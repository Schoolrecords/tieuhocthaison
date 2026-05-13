# Hướng dẫn Deploy Apps Script tự động bằng clasp

> **Công cụ**: `clasp` v3.3.0 (Google's official Apps Script CLI)
> **Tài khoản Google**: xebatcheotrt@gmail.com
> **Thư mục dự án**: thư mục hiện tại

---

## ⚠️ Việc thầy PHẢI TỰ LÀM trước (3 bước, một lần duy nhất)

### Bước 1 — Bật Apps Script API
1. Mở: https://script.google.com/home/usersettings
2. Login bằng **xebatcheotrt@gmail.com**
3. Bật toggle **"Google Apps Script API"** → ON

### Bước 2 — Login clasp với tài khoản Google
Mở PowerShell (hoặc Git Bash) tại thư mục này, chạy:
```powershell
clasp login
```
→ Trình duyệt mở. Login bằng **xebatcheotrt@gmail.com** → cho phép quyền → đóng tab.
→ Tạo file `C:\Users\Chung Tran\.clasprc.json` chứa OAuth token (giữ riêng tư, không commit Git).

### Bước 3 — Tạo Google Sheet + GAS project bound với Sheet
**Cách A (KHUYẾN NGHỊ — tạo qua web, dễ kiểm soát)**:
1. Mở Google Drive bằng **xebatcheotrt@gmail.com**
2. Tạo Sheet mới, đặt tên: **`THThaiSon_05.2026`**
3. Trong Sheet → menu **Extensions → Apps Script**
4. Đổi tên project (góc trên trái): **`HSS Thái Sơn 2025-2026`**
5. Lấy **Script ID** từ URL: `https://script.google.com/.../projects/<SCRIPT_ID>/edit`
6. Copy SCRIPT_ID → đưa cho em (paste vào chat) để em tự tạo `.clasp.json`

**Cách B (clasp tự tạo, ít kiểm soát hơn)**:
```powershell
clasp create-script --type sheets --title "HSS Thái Sơn 2025-2026"
```
→ Tự tạo Sheet + project + `.clasp.json`. Nhưng có thể overwrite `appsscript.json` local — không khuyến nghị.

---

## 🤖 Quy trình deploy sau khi setup xong (em tự chạy)

Sau khi thầy hoàn thành 3 bước trên + đưa em SCRIPT_ID:

### Lần đầu (push code lên + deploy Web App)
```powershell
# 1. Push Code.gs + appsscript.json lên GAS
clasp push --force

# 2. Tạo deployment Web App đầu tiên
clasp deploy --description "Init v1 - TH Thái Sơn"

# 3. Lấy Web App URL
clasp list-deployments
```
→ URL dạng `https://script.google.com/macros/s/<DEPLOY_ID>/exec`
→ Em sẽ tự replace 12 placeholder `CHUA_CAU_HINH_APPS_SCRIPT_THAI_SON` bằng URL này.

### Các lần cập nhật code sau
```powershell
# Dùng script helper:
.\deploy-gas.ps1 -Message "Mô tả thay đổi"
```
Hoặc thủ công:
```powershell
clasp push --force
clasp redeploy <DEPLOY_ID> --description "fix bug X"
```

---

## 📋 Checklist cấu hình `.clasp.json`

Em sẽ tạo file `.clasp.json` với nội dung sau (cần SCRIPT_ID):
```json
{
  "scriptId": "<PASTE_SCRIPT_ID_HERE>",
  "rootDir": "."
}
```

`.claspignore` (đã có sẵn) giới hạn chỉ push `Code.gs` + `appsscript.json`, không đụng file frontend.

---

## 🔒 Lưu ý bảo mật
- `.clasprc.json` (chứa OAuth refresh token) nằm ở `~/.clasprc.json` — **không bao giờ** commit Git
- `.clasp.json` (chứa scriptId) — có thể commit nhưng nên gitignore để mỗi máy/môi trường tự sinh

---

## 🆘 Troubleshooting
| Lỗi | Xử lý |
|---|---|
| `User has not enabled the Apps Script API` | Quay lại Bước 1 |
| `Could not read API credentials` | Login lại: `clasp logout` rồi `clasp login` |
| `Push failed: rootDir not found` | Check `.clasp.json` `rootDir` đúng đường dẫn |
| Deploy URL không exec được | Trong GAS web → Triển khai → Cài đặt → "Truy cập: Bất kỳ ai" |
