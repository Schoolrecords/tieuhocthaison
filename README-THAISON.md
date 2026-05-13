# THThaiSon — Hệ thống Hồ sơ số Trường Tiểu học Thái Sơn

## Trạng thái
- **Clone từ**: thư mục `THDienLien` (TH Diễn Liên)
- **Ngày clone**: 2026-05-13
- **Đơn vị áp dụng**: Trường Tiểu học Thái Sơn, xã Đô Lương, tỉnh Nghệ An
- **Năm học**: 2025-2026

## 🚨 HOTFIX BẮT BUỘC CHẠY SAU DEPLOY (2026-05-13)

`DATA_HSS` trong `Code.gs` đã được clear 82 link Drive Diễn Liên. Sheet Thái Sơn hiện vẫn còn link cũ (do `setupAll` đã chạy lần đầu). **Phải làm theo thứ tự:**

1. Deploy `Code.gs` mới: `.\deploy-gas.ps1 -Message "hotfix: clear data_hss drive links"` (nếu chưa login: `clasp login` rồi chạy lại)
2. Mở Apps Script editor → dropdown chọn `resetHssLinksForNewSchool` → ▶ Run → cấp quyền
3. Verify: `curl "WEB_APP_URL?action=getHSS"` → tất cả `link` trong JSON phải = `""`
4. Mở Admin web → Hồ sơ số → paste link Drive Thái Sơn cho từng hồ sơ khi cần

## Đã thay thế tự động (script)
- Tên trường, địa danh: `Diễn Liên` → `Thái Sơn`, `Quảng Châu` → `Đô Lương`
- Slug, đường dẫn: `tieuhocdienlien` → `tieuhocthaison`, `THDienLien` → `THThaiSon`, `THDL` → `THTS`
- Token: `DienLien-2026` → `ThaiSon-2026`, `AdminDL-2026` → `AdminTS-2026` (Code.gs)
- Header HTML `PHÒNG GD&ĐT DIỄN CHÂU` → `SỞ GIÁO DỤC VÀ ĐÀO TẠO NGHỆ AN` (qlcl-app.js)
- Apps Script URL của trường cũ → placeholder `CHUA_CAU_HINH_APPS_SCRIPT_THAI_SON` ở 4 file HTML
- Đã xóa `CHANGELOG.md` (lịch sử trường cũ) và `Data/THDienLien_05.2026.gsheet`

## ⚠️ CHECKLIST CẤU HÌNH CÒN THIẾU (thầy phải tự điền)

### 1. Apps Script (ĐÃ DEPLOY ✅ — 2026-05-13)
- **Sheet ID**: `19Pdl_fIcDaqrEh9F2DLZZWnlPueDG0quqSMhsIu5Gy8`
- **Script ID**: `1NGbNJ2vxwyULeV2LxFxAWqNiJuZOo5Y1g12qTLZ-MJJs-dcl8k9RSvPC`
- **Web App URL**: `https://script.google.com/macros/s/AKfycbz77YHbIlmMHasWjKaDRfXCU1rS6oHLJHQqaOlB6yAxJeURDEILBTQPllCtylcVp1VK/exec`
- **Account**: `xebatcheotrt@gmail.com`
- **Cập nhật code sau này**: chạy `.\deploy-gas.ps1 -Message "..."`

Đã replace 8 placeholder trong 4 file HTML (`index.html`, `kdcl.html`, `dbcl.html`, `qlcl.html`).

Nếu cần thay đổi sau:
- `index.html` (2 chỗ: dòng ~64 và ~1729)
- `kdcl.html` (3 chỗ: ~64, ~6351, và 1 chỗ khác)
- `dbcl.html` (2 chỗ: ~64 và ~259)
- `qlcl.html` (1 chỗ: ~631)

Lệnh tìm nhanh:
```powershell
Select-String -Path *.html -Pattern 'CHUA_CAU_HINH_APPS_SCRIPT_THAI_SON'
```

### 2. AUTH_TOKEN trong Code.gs
Đã đặt mặc định `ThaiSon-2026` (GV) và `AdminTS-2026` (Admin). Nếu muốn token khác → sửa `Code.gs` dòng 604–605, hoặc set qua Script Properties (`AUTH_TOKEN_GV`, `AUTH_TOKEN_ADMIN`).

### 3. HSS_EXT_ID (Chrome Extension)
Hiện chưa có biến này hardcoded trong code. Sau khi cài Chrome Extension `hss-sync-extension/`:
- Lấy ID từ `chrome://extensions/`
- Khai báo vào `qlcl-app.js` (function `_hssGetExtId` hoặc localStorage — xem hướng dẫn trong popup.html của extension)

### 4. Mã trường MOET
Hệ thống không hardcode mã trường MOET. Mã sẽ được điền khi đăng nhập CSDL ngành. Nếu cần đặt mặc định → bổ sung biến trong qlcl-app.js sau.

### 5. Logo + ảnh thương hiệu
- ✅ **`Logo_THTS.svg` + `Logo_THTS.png` (1024×1024) + `Logo_THTS.jpg`**: đã tạo placeholder generative — logo tròn xanh lá, sách mở, ribbon năm học 2025-2026. Thay bằng logo chính thức khi có.
- ✅ **`og-banner.png` + `og-banner.jpg` (1200×630)**: banner social share đã render từ template. Đẩy lên gốc GitHub Pages khi deploy → preview Zalo/Facebook hoạt động.
- ❌ Chữ ký HT + dấu trường (file PNG nền trong suốt) — cần ảnh thật, đặt vào `Data/` sau
- ❌ Ảnh hoạt động trường — đặt vào `Data/HinhAnh/` khi có

### 6. Dữ liệu học sinh, giáo viên (ĐÃ XÓA CSDL CŨ)
- Import lại danh sách HS + GV Thái Sơn qua Admin → Excel
- Mọi điểm số, nhận xét cũ trong Google Sheet phải tạo Sheet mới riêng cho Thái Sơn

### 7. File học bạ template
- `templates-hocba/Mau-HocBa-Lop{1..5}.docx`: **template runtime** — đã được fix Lớp 1 (Lớp 2-5 sạch sẵn). Code load qua `qlcl-app.js` để sinh học bạ.
- Thư mục `Mẫu Học bạ/` (5 mẫu HS Diễn Liên cũ) đã được xóa — không có tác dụng runtime.

## Quy tắc tuyệt đối (giữ nguyên từ project)
- KHÔNG ghi "Phòng GD&ĐT" (Việt Nam đã bỏ cấp huyện từ 2025)
- KHÔNG ghi "huyện Đô Lương" — Đô Lương hiện là **xã**, không phải huyện
- Cấp trên trực tiếp: **Sở GD&ĐT Nghệ An**

## Kiểm tra nhanh sau khi cấu hình
```powershell
# Còn dấu vết Diễn Liên không?
Select-String -Path *.html,*.js,*.gs,*.md,*.css -Pattern 'Diễn Liên|dienlien|DienLien|Quảng Châu' -Encoding UTF8

# Đã thay URL chưa?
Select-String -Path *.html -Pattern 'CHUA_CAU_HINH_APPS_SCRIPT_THAI_SON' -Encoding UTF8
```
