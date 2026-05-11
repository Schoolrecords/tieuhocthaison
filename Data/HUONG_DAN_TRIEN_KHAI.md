# Hướng dẫn triển khai QLCL — Phương án D-3 (Final, 1 Sheet)

**Ngày**: 2026-05-05
**Phương án**: D-3 — 1 Sheet duy nhất + 1 Apps Script duy nhất

---

## 🎯 Mục tiêu

Toàn bộ hệ thống TH Thái Sơn dùng **1 Google Sheet + 1 Apps Script + 1 URL** chứa tất cả module:
- HSS (Hồ sơ số)
- KĐCL/TĐG
- QLCL (Sổ điểm + Học bạ — wide format theo template QLCL_V3.0)

Trước đây có 2 hệ thống độc lập (Sheet HSS + Sheet THThaiSon_05.2026) → **gộp thành 1**.

---

## 📦 Tóm tắt thay đổi

### Code đã sửa (em làm)
- **`Code.gs`** (HSS): +637 dòng
  - Thêm 20 action QLCL template (`getGrades`, `saveGrade`, `autoSave`, ...)
  - Thêm hàm `migrateQlclFromExternal()` — copy 9 tab từ Sheet ngoài
  - Helpers `_qt*`, `_qlclTplHandle` dispatcher
- **`qlcl.html`**: API_URL trỏ về URL HSS (cùng với index.html)
- **`qlcl-app.js`**: `DEFAULT_GAS` trỏ về URL HSS

### Files (anh push lên GitHub)
- `app.js`, `qlcl.html`, `qlcl-app.js`, `qlcl-style.css`

### Sheet (sau migration)
- Sheet HSS sẽ có thêm 9 tab: `Config`, `Lop`, `CN`, `GK2`, `CK1`, `GK1`, `NhanXet`, `Users`, `HocSinh`
- 3 tháng data 864 HS được giữ nguyên

---

## 🚀 5 BƯỚC DEPLOY

### Bước 1: Backup Sheet HSS (BẮT BUỘC, 2 phút)

1. Mở **Sheet HSS TH Thái Sơn** (Sheet đang chạy production với HSS + KĐCL — KHÔNG phải Sheet `THThaiSon_05.2026`)
2. **Tệp** → **Tạo bản sao**
3. Đặt tên: `BACKUP_2026-05-05_PreD3`

### Bước 2: Lấy Sheet ID của Sheet `THThaiSon_05.2026` (1 phút)

1. Mở Sheet `THThaiSon_05.2026` (Sheet QLCL data 3 tháng)
2. Copy URL từ thanh địa chỉ
3. Sheet ID là phần giữa `/d/` và `/edit`:
   ```
   https://docs.google.com/spreadsheets/d/<SHEET_ID_ĐÂY>/edit
   ```
4. Lưu lại để dán ở Bước 4

### Bước 3: Mở Apps Script ĐÚNG project HSS (3 phút)

⚠ **CẨN THẬN**: Đây là project HSS đang chạy production, **KHÔNG phải project QLCL_V3.0**.

Cách 1: từ Sheet HSS → **Tiện ích mở rộng** → **Apps Script** → mở project bound
Cách 2: vào Apps Script editor → tìm project có URL `/exec` đang dùng cho web `https://hososotruonghoc.github.io/tieuhocthaiSon/`

Trong project này:
1. Mở file `Code.gs` (đang chứa code HSS hiện tại)
2. **Ctrl+A** → **Delete** (xoá toàn bộ)
3. Mở file mới: `J:\XeBatCheo\1\EduTech_ChungTran\Code\HoSoSo_TH\THThaiSon\Code.gs`
4. **Ctrl+A** → **Ctrl+C** copy
5. Paste vào editor → **Ctrl+S** lưu
6. Verify: dropdown function thấy `migrateQlclFromExternal`, `_qtGetGrades`, ... → đúng

### Bước 4: Chạy migration copy 9 tab QLCL (5 phút)

1. Trong Apps Script editor (project HSS), dropdown chọn: **`migrateQlclFromExternal`**
2. ▶ Chạy
3. Khi hiện dialog **"Migrate QLCL từ Sheet ngoài"** → paste **Sheet ID** đã lấy ở Bước 2 → OK
4. Lần đầu sẽ yêu cầu **Authorization** → cấp quyền
5. Đợi script chạy (~1-2 phút)
6. Mở **Logs** (View → Logs):
   - Phải thấy `🎉 MIGRATION HOÀN TẤT — Đã copy: 9 tab` (Config, Lop, CN, GK2, CK1, GK1, NhanXet, Users, HocSinh)

7. Verify: mở Sheet HSS → kiểm tra có 9 tab mới với data thật của 864 HS

### Bước 5: Deploy + Push GitHub (3 phút)

#### A. Apps Script HSS — Deploy New version

1. Apps Script editor → **Triển khai** (góc phải trên) → **Quản lý các bản triển khai**
2. Tìm deployment hiện có (URL HSS production) → ✏️ Edit
3. **Phiên bản** → **Phiên bản mới**
4. Description: `D-3: gộp QLCL backend + migration`
5. **Triển khai** → ✅
6. URL `/exec` không đổi

#### B. GitHub Pages — Push 4 file

```bash
cd <repo-folder>
git add app.js qlcl.html qlcl-app.js qlcl-style.css
git commit -m "Phương án D-3: gộp QLCL vào hệ thống HSS (1 Sheet + 1 Apps Script)"
git push origin main
```

GitHub Pages auto-deploy ~30s.

---

## 🧪 Test sau deploy

Mở web bằng **Ctrl+F5** (hard refresh).

### A. Hệ thống Hồ sơ số (HSS + KĐCL — không nên thay đổi gì)
- [ ] Trang chủ load OK
- [ ] HSS click cat → bảng instant
- [ ] Login Admin → vào tab Admin OK
- [ ] KĐCL/TĐG mở OK

### B. QLCL (mới — multi-page, dùng cùng URL HSS)
- [ ] Click "QL Chất lượng 📊" → URL chuyển sang `qlcl.html`
- [ ] Trang QLCL hiện màn login (template QLCL có bảng Users riêng)
- [ ] Login bằng tài khoản trong tab `Users` (Sheet HSS sau migration)
- [ ] Tab "Học sinh" → 864 HS hiện
- [ ] Tab "Nhập kết quả" → chọn lớp → bảng nhập điểm
- [ ] Nhập 1 điểm → save → verify trên tab `GK2` (hoặc kỳ chọn) trong Sheet HSS
- [ ] Tab "Quản lý học bạ" → "📄 Word" → tải file → format theo TT 27

### C. Quay lại HSS
- [ ] qlcl.html → click "← Hồ sơ số" → quay về index.html

---

## 🗑 Sau khi confirm OK (KHÔNG vội)

Sau **1-2 tuần** chạy ổn định, anh có thể dọn:

1. **Project QLCL_V3.0** (Apps Script cũ): vào Drive → Trash (hoặc giữ làm backup)
2. **Sheet `THThaiSon_05.2026`** (Sheet QLCL cũ): rename thành `_OLD_QLCL_THThaiSon_05.2026` để không nhầm. KHÔNG xoá ngay.
3. **18 tab thừa** trong Sheet HSS (do anh chạy nhầm `setupAll` ở project QLCL_V3.0): em đã liệt kê trong CHANGELOG, có thể xoá thủ công.

---

## ⚠ Auth: 2 hệ thống riêng

- **HSS / KĐCL**: dùng AUTH_TOKEN của TH Thái Sơn (`AdminTS-2026`, `ThaiSon-2026`)
- **QLCL**: dùng bảng `Users` trong Sheet HSS (sau migration) với username/password riêng

→ User phải login 2 lần khi qua lại 2 module. Tương lai có thể consolidate.

---

## 🆘 Nếu có vấn đề

- Migration không copy đủ 9 tab: chạy lại `migrateQlclFromExternal` (script idempotent, skip tab đã tồn tại)
- qlcl.html load lỗi: check API_URL trong qlcl.html khớp URL HSS không
- Backend báo lỗi: xem Apps Script Logs

Xem `ROLLBACK_GUIDE.md` để rollback từng phần.
