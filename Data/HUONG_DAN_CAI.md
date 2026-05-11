# Hướng dẫn cài HSS Sync Extension v2

> Hệ thống đồng bộ tự động kết quả học sinh từ QLCL → CSDL ngành MOET
> **Cài đặt làm 1 lần, dùng mãi mãi.** Có wizard hướng dẫn từng bước.

---

## 🚀 Cách dễ nhất: Dùng Wizard trong QLCL

1. Mở **QLCL** (qlcl.html) trên Chrome
2. Vào **Xuất báo cáo** → bấm **Đồng bộ CSDL ngành**
3. **Trình cài đặt 4 bước** sẽ tự động hiện ra → bấm **Tiếp theo →** ở mỗi bước
4. Cuối wizard, ID extension **tự động kết nối** — không cần copy/paste gì cả

> 💡 Wizard có sẵn nút **📥 Chỉ xuất Excel (bỏ qua extension)** ở cuối nếu thầy/cô
> không muốn cài extension và chỉ muốn xuất file Excel để upload thủ công.

---

## Tóm tắt 4 bước (đầy đủ trong wizard)

### Bước 1 — Chuẩn bị thư mục
- Đã có sẵn thư mục `hss-sync-extension` trong thư mục dự án trường.
- Nếu trường khác: nhận file `hss-sync-extension-v2.zip` → giải nén ra một thư mục cố định.
- ⚠️ KHÔNG xoá thư mục sau khi cài (Chrome cần đường dẫn thật).

### Bước 2 — Mở Chrome Extensions
- Tab Chrome mới → gõ: `chrome://extensions/`
- Wizard có nút **📋 Sao chép** sẵn để dán địa chỉ
- Bật công tắc **"Chế độ nhà phát triển"** (góc trên phải)

### Bước 3 — Cài extension
- Bấm **"Tải tiện ích chưa đóng gói"** → chọn thư mục `hss-sync-extension`
- Extension xuất hiện với tên **"HSS Sync — Đồng bộ CSDL Ngành"**
- 💡 Mẹo: Bấm icon 🧩 → 📌 ghim HSS Sync để dễ thấy

### Bước 4 — Tự động kết nối
- Quay lại tab QLCL → **F5** (tải lại trang)
- Wizard hiện ✅ "Đã kết nối extension!"
- Bấm **✓ Hoàn tất** → quay về modal đồng bộ

---

## Cấu hình URL Apps Script (làm 1 lần đầu)

1. Click icon HSS Sync (🏛️) trên thanh Chrome → popup hiện ra
2. Dán URL Apps Script của trường vào ô **"URL Apps Script"**
3. Bấm **💾 Lưu**

---

## Thêm code vào Google Apps Script (chỉ làm 1 lần)

> Bước này cần người quản trị Apps Script của trường thực hiện.

1. Mở file `APPS_SCRIPT_ENDPOINT.gs` ở thư mục dự án
2. Mở Google Apps Script của trường (gắn với `THThaiSon_05.2026.gsheet`)
3. **Phần A**: thêm CASE `getKetQuaMOET` vào hàm `doGet()` đang có
4. **Phần B**: dán toàn bộ block còn lại vào CUỐI file `Code.gs`
5. **Triển khai** → Phiên bản mới → Web App → Ai có quyền: **Mọi người**
6. Cập nhật URL Web App mới vào extension popup nếu URL thay đổi

---

## Sử dụng (hằng ngày)

1. Mở Chrome → vào CSDL ngành: `https://truong.csdl.moet.gov.vn`
2. **Đăng nhập + nhập CAPTCHA thủ công** (1 lần đầu mỗi phiên)
3. Mở tab mới → vào **QLCL**
4. Vào **Xuất báo cáo** → bấm **Đồng bộ CSDL ngành**
5. Chọn **Khối** + **Kỳ** → bấm **🚀 Đồng bộ tự động lên CSDL ngành**
6. Ngồi xem panel HSS Sync (góc dưới phải tab CSDL) báo tiến trình ☕

---

## Cơ chế Auto-detect ID (giải thích nhanh)

Sau khi cài, extension chạy 1 đoạn script nhỏ (`qlcl-bridge.js`) trên trang QLCL.
Script này gửi `Extension ID` qua `window.postMessage` → QLCL bắt được → tự lưu
vào localStorage. Toàn bộ quá trình diễn ra trong < 1 giây sau khi load trang.

---

## Khi gặp sự cố

| Triệu chứng | Cách xử lý |
|---|---|
| Wizard đứng ở Bước 4 sau 10s | Tải lại (F5) trang QLCL — extension chỉ phát ID khi trang load |
| Vẫn không kết nối được | Bấm link **"🔧 Nhập Extension ID thủ công"** ở cuối wizard |
| Modal báo "❌ Chưa cấu hình Extension" | Mở wizard và làm lại từ Bước 1 |
| Apps Script lỗi "Không tìm thấy sheet kết quả kỳ..." | Kiểm tra tên sheet trong Spreadsheet (Grades_cn / Grades_gk1...) |
| Panel không bơm file vào CSDL ngành | F12 → Console tab CSDL → xem lỗi từ content.js |
| Background không phản hồi | `chrome://extensions/` → click "service worker" → xem console |

---

## Đổi / xoá Extension ID

Modal **Đồng bộ CSDL ngành** (sau khi cấu hình xong) có nút **"Đổi"** ở góc phải
khung trạng thái → quay lại wizard hoặc nhập ID khác (vd: cài lại extension, đổi máy).

---

## Cấu trúc thư mục dự án

```
THThaiSon/
├── qlcl.html, qlcl-app.js, qlcl-style.css   ← Hệ thống QLCL
├── hss-sync-extension/                       ← Chrome Extension
│   ├── manifest.json
│   ├── background.js     (service worker, tạo Excel)
│   ├── content.js        (inject vào CSDL ngành)
│   ├── content.css       (panel floating)
│   ├── qlcl-bridge.js    (gửi ID sang QLCL — auto-detect)
│   ├── popup.html, popup.js  (cấu hình URL)
│   └── lib/xlsx.min.js   (SheetJS, ~930KB)
├── APPS_SCRIPT_ENDPOINT.gs   ← Code dán vào Apps Script
├── HUONG_DAN_CAI.md          ← File này
└── hss-sync-extension-v2.zip ← Bản đóng gói (~340KB)
```
