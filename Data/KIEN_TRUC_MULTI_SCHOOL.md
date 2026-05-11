# Phân tích kiến trúc Multi-School cho Hệ thống HSS

> **Ngày**: 2026-05-11
> **Bối cảnh**: Hệ thống Hồ sơ số + QLCL + KĐCL hiện đang chạy cho TH Diễn Liên, vừa fork cho TH Thái Sơn. Quy mô dự kiến **20+ trường (toàn tỉnh hoặc nhiều tỉnh)**.
> **Mục tiêu**: Tìm kiến trúc cho phép triển khai trường mới mà KHÔNG cần sửa code (giống SMAS).

---

## 1. Đánh giá hiện trạng

| Tiêu chí | Trạng thái |
|---|---|
| Tên trường hard-code trong code | ~200+ chỗ, 16 file |
| Mỗi trường có Sheet riêng | ✅ Có (data isolation tốt) |
| Mỗi trường có Apps Script riêng | ✅ Có (deploy riêng) |
| Mỗi trường có repo GitHub Pages riêng | ✅ Có (`tieuhocdienlien`, `tieuhocthaiSon`...) |
| **Vấn đề chính** | Fork mỗi trường tốn 2-3h, lỗi do quên sót, không update đồng bộ |

**Kết luận hiện trạng**: kiến trúc "fork-per-school" — chạy được nhưng KHÔNG scale qua 5 trường mà không phát điên.

---

## 2. Bốn phương án kiến trúc

### 🟢 A. Generic Template + First-run Wizard

```
┌─────────────────────────────────────────────┐
│  School A: repoA + SheetA + AppsScriptA     │
│  School B: repoB + SheetB + AppsScriptB     │ ← code FE 100% sạch
│  School N: repoN + SheetN + AppsScriptN     │   config đọc từ Sheet
└─────────────────────────────────────────────┘
       Wizard khi cfg trống ─→ admin nhập ─→ ghi vào CauHinh
```

**Triển khai trường mới**:
1. Thầy: Clone repo template lên GitHub, bật Pages
2. Thầy: Tạo Sheet mới, paste Code.gs, run setup, deploy Apps Script
3. Thầy: Dán API_URL vào `qlcl.html` + `index.html` (vẫn còn 2 chỗ cần sửa)
4. Admin trường: Mở web → wizard → nhập tên/HT/PHT → xong

**Pros**:
- Data isolation hoàn hảo (mỗi trường 1 Sheet, không ai xem được data trường khác)
- Quota Apps Script không bị share → 1 trường tăng request không ảnh hưởng trường khác
- Code FE sạch → trường lớn dễ tự host nếu muốn
- Migrate đường mềm: từ A → C → B nếu cần scale lên

**Cons** (TẠI QUY MÔ 20+ TRƯỜNG):
- Thầy vẫn phải làm 4 bước/trường (chừng 15 phút) → 20 trường = 5 giờ
- **Code update cực kỳ đau**: Bugfix hoặc feature mới → thầy phải vào TỪNG Apps Script của TỪNG trường paste code mới. 20 trường = 1 tiếng/lần update
- Không có dashboard tổng quản lý các trường
- SEO/branding mỗi trường mỗi nơi (canonical, og:* đều phải gen động)

**Ước tính công sức refactor**: 4-6 giờ
**Ước tính chi phí vận hành 20 trường/năm**: ~50 giờ thầy (chủ yếu code update đồng bộ)

---

### 🟡 B. Multi-tenant Central Registry (đúng kiểu SMAS)

```
                         ┌──────────────────┐
                         │ Apps Script chung│ (1 router)
                         │ + Sheet master   │
                         └────────┬─────────┘
              ┌───────────────────┼───────────────────┐
              ▼                   ▼                   ▼
        ┌──────────┐        ┌──────────┐       ┌──────────┐
        │SheetA(HSS)│       │SheetB(HSS)│      │SheetN(HSS)│
        │ TH DienLien│       │TH ThaiSon │      │TH ...    │
        └──────────┘        └──────────┘       └──────────┘

  User truy cập: hss.io/?school=thaison  ─→  router fetch SheetB  ─→ trả data
```

**Triển khai trường mới**:
1. Thầy (super-admin): Tạo Sheet mới cho trường X (chỉ Sheet, không cần Apps Script)
2. Thầy: Vào Sheet master, thêm 1 dòng: `[schoolCode=thaison, sheetId=xxx, displayName=TH Thái Sơn]`
3. Admin trường X: mở `hss.io/?school=thaison` → wizard → xong

**Pros**:
- **Code update 1 lần áp dụng cho TẤT CẢ trường** → đây là lý do chính chọn B
- Có dashboard tổng (super-admin xem được status mọi trường)
- Triển khai trường mới = thêm 1 dòng trong Sheet master (3 phút)
- 1 deploy GitHub Pages duy nhất

**Cons**:
- **Single point of failure**: Apps Script trung tâm crash = tất cả trường down
- **Quota Apps Script** (6 phút/execution, 30 phút/ngày/script, 6 phút concurrent) bị share giữa tất cả trường → trường lớn upload nhiều = trường nhỏ bị ảnh hưởng
- **Auth phức tạp**: phải đảm bảo admin trường A không đọc được data trường B (cần check `body.schoolCode === user.schoolCode` ở MỌI hàm — dễ quên 1 hàm là leak data)
- Logic phân quyền 3 tầng: super-admin (toàn hệ thống) → admin trường → GV
- **Migration data**: từ Apps Script riêng (A) sang router chung (B) phức tạp
- **Backup**: nếu Sheet master hỏng → mất ánh xạ toàn bộ → cần backup riêng

**Ước tính công sức refactor**: 20-30 giờ
**Ước tính chi phí vận hành 20 trường/năm**: ~10 giờ thầy

---

### 🟡 C. Hybrid: 1 FE + N Backend (qua localStorage)

```
┌──────────────────────────────────────┐
│  1 GitHub Pages duy nhất (FE chung)  │
└──────────────┬───────────────────────┘
               │ localStorage:
               │   schoolCode = "thaison"
               │   apiUrl     = "https://script.../exec"
               ▼
        ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
        │AppsScriptA   │  │AppsScriptB   │  │AppsScriptN   │
        │SheetA        │  │SheetB        │  │SheetN        │
        └──────────────┘  └──────────────┘  └──────────────┘
```

**Triển khai trường mới**: như A nhưng KHÔNG cần repo GitHub Pages riêng. Admin mở `hss.io` → wizard nhập tên trường + API URL → lưu localStorage → xong.

**Pros**:
- Code FE 1 chỗ duy nhất (giống B)
- Data isolation (mỗi trường Apps Script + Sheet riêng — giống A)
- Update FE: 1 push, áp dụng tất cả trường mà không đụng Apps Script
- Quota Apps Script không share

**Cons**:
- **localStorage là per-browser**: user đổi máy / xóa cache là phải nhập lại API URL
- URL không có brand trường (`hss.io` thay vì `tieuhocthaison.github.io`) → SEO không đặt được tên trường
- Update Apps Script vẫn phải làm từng trường (giống A) → tốn time

**Ước tính công sức refactor**: 6-8 giờ
**Ước tính chi phí vận hành 20 trường/năm**: ~30 giờ thầy

---

### 🟢 D. Hybrid + Public Registry (TỐI ƯU CHO QUY MÔ 20+)

```
┌──────────────────────────────────────┐
│  1 GitHub Pages chung (FE)           │
│  + schools.json (public registry)    │
│      [                                │
│        {code:"dienlien",             │
│         name:"TH Diễn Liên",         │
│         api:"https://.../exec",      │
│         xa:"Quảng Châu"},            │
│        {code:"thaison", ...}          │
│      ]                                │
└──────────────┬───────────────────────┘
               │ User: chọn trường từ dropdown
               │   (hoặc URL ?school=thaison)
               ▼
        ┌──────────────┐  ┌──────────────┐
        │AppsScriptA   │  │AppsScriptB   │ ← mỗi trường riêng
        │SheetA        │  │SheetB        │
        └──────────────┘  └──────────────┘
```

**Triển khai trường mới**:
1. Thầy: Tạo Sheet + Apps Script + deploy URL (5-10 phút)
2. Thầy: Edit `schools.json` thêm 1 entry (1 phút)
3. Push to GitHub → tất cả trường thấy trường mới trong dropdown
4. Admin trường mới: mở web → chọn trường mình → vào ngay

**So với C**: thêm registry JSON public → user không cần nhập API URL nữa, chỉ chọn từ list. Đỡ cho người dùng cuối.

**Pros**:
- Toàn bộ ưu điểm C
- + Người dùng cuối KHÔNG cần biết API URL (chỉ chọn trường)
- + URL đẹp: `hss.io/?school=thaison` hoặc `hss.io/thaison`
- + Có thể làm trang index liệt kê tất cả trường (Search bằng tên/xã/huyện cũ)
- + Phân quyền vẫn isolated (mỗi trường Apps Script riêng)

**Cons**:
- Update Apps Script khi có bug vẫn phải đi từng trường (giống A, C)
- `schools.json` public → ai cũng thấy danh sách Apps Script URL của các trường (KHÔNG sao vì Apps Script có auth token bảo vệ rồi, nhưng nên hiểu)

**Ước tính công sức refactor**: 8-10 giờ
**Ước tính chi phí vận hành 20 trường/năm**: ~25 giờ thầy

---

## 3. Bảng so sánh nhanh

| Tiêu chí | A | B | C | D |
|---|---|---|---|---|
| Code FE 1 nơi | ❌ N repo | ✅ 1 repo | ✅ 1 repo | ✅ 1 repo |
| Apps Script 1 nơi | ❌ N proj | ✅ 1 proj | ❌ N proj | ❌ N proj |
| Data isolation | ✅✅ | ⚠️ | ✅✅ | ✅✅ |
| Code update 1 lần | ❌ | ✅ FE+BE | ⚠️ chỉ FE | ⚠️ chỉ FE |
| Quota Apps Script | ✅ Riêng | ❌ Share | ✅ Riêng | ✅ Riêng |
| Brand trường SEO | ✅ Domain | ⚠️ Path | ❌ | ⚠️ Path |
| Triển khai trường mới | 15 phút | 3 phút | 10 phút | 8 phút |
| Công sức refactor | 4-6h | 20-30h | 6-8h | 8-10h |
| Vận hành 20 trường/năm | ~50h | ~10h | ~30h | ~25h |
| **Phù hợp quy mô** | ≤5 | 50+ | ≤20 | 10-50 |

---

## 4. Khuyến nghị

**Quy mô 20+ trường** → loại A (không scale), loại B (over-engineering nếu thầy còn 1-2 năm nữa mới đạt 20 trường).

**Đề xuất em**: chọn **D (Hybrid + Public Registry)** với lộ trình 2 giai đoạn:

### Giai đoạn 1 (làm ngay — 8-10h):
- Refactor code về generic: xóa tất cả hard-code tên trường → đọc từ config
- Tách meta SEO ra dynamic JS
- Wizard FE: lần đầu mở web → modal hỏi thông tin trường → lưu Sheet
- File `schools.json` ở root repo (ban đầu có 2 entry: TH Diễn Liên, TH Thái Sơn)
- URL: `hss.io/?school=<code>` → FE fetch `schools.json` → biết API URL → load

### Giai đoạn 2 (khi đạt 10+ trường — 10h):
- Thêm dashboard super-admin: 1 trang riêng (auth riêng) hiển thị trạng thái 10+ trường, số HS, số GV, ngày update cuối
- Thêm CLI/script tự động: thầy chạy `npm run add-school -- --code=truongx --name="..."` để tạo entry + tạo Sheet template auto qua API → giảm thời gian thầy

### Giai đoạn 3 (khi đạt 30+ trường, nếu có): chuyển sang B
- Lúc này business model đã rõ → đầu tư 30h refactor về central router xứng đáng
- Có thể tự host backend Node.js + PostgreSQL thay vì Apps Script

---

## 5. Cảnh báo thẳng thắn

1. **Apps Script quota**: 6 phút/execution, 6 phút concurrent execution, 90 phút runtime/ngày/user. Với 20+ trường mỗi trường có 500 HS, GV cuối kỳ vào nhập điểm cùng lúc → có thể đụng quota nếu chọn B. Cẩn trọng.

2. **Backup**: Cả 4 phương án đều dùng Google Sheet làm DB. Cần policy backup tự động (export sang Drive khác hoặc dùng `clasp` để version Code.gs). KHÔNG được phụ thuộc 100% Google.

3. **Auth model hiện tại**: AUTH_TOKEN chia sẻ giữa BGH+GV (`DienLien-2026`...) là **rất yếu** ở quy mô 20+ trường — 1 GV rời trường biết token là vẫn truy cập được. Trước khi mở rộng nên chuyển sang **per-user password + hash bcrypt** (đã có một phần trong SSO migration tháng 5/2026 của TH Diễn Liên).

4. **GDPR / Nghị định 13/2023**: 20+ trường = vài chục nghìn HS. Cần policy: data ai lưu, lưu ở đâu, ai xem được, log truy cập. Hiện chưa có audit log đầy đủ.

5. **Domain & branding**: nếu định ra quy mô liên trường/tỉnh, nên mua 1 domain riêng (`hosososo.vn` hoặc tương tự) thay vì dùng `*.github.io`. GitHub Pages có giới hạn 100GB bandwidth/tháng, không phù hợp scale lớn.

---

## 6. Kết luận

| Bối cảnh | Khuyến nghị |
|---|---|
| Thầy thật sự sẽ đạt 20+ trường trong 1-2 năm | **D** ngay (8-10h refactor) |
| Thầy đang ở mood "phục vụ bạn bè 3-5 trường" và 20+ là long-term goal | **A** đủ dùng (4-6h), sau migrate sang D khi cần |
| Thầy muốn trải nghiệm "SMAS thật sự" cho người dùng cuối | **B** (20-30h, phức tạp nhưng đáng) |
| Thầy chưa sure | Bắt đầu **A**, code generic ngay từ đầu → đường mở sang C/D dễ |

> Em nghĩ **D** là sweet spot cho quy mô 20+ trường. A là "MVP của D" — nên có thể bắt đầu A rồi nâng lên D trong vài tuần khi cần. Chi phí migrate A→D nhỏ (chủ yếu thêm file `schools.json` + đổi URL convention).

Sẵn sàng nghe quyết định của thầy.
