# Setup `clasp run` — Cho Claude tự chạy function GAS

> Tổng thời gian: ~15 phút. Mở từng link → làm theo đúng thứ tự.
> Đảm bảo trình duyệt đang login bằng **xebatcheotrt@gmail.com**.

---

## ⚙️ Bước 1 — Tạo GCP Project (2 phút)

🔗 **Link**: https://console.cloud.google.com/projectcreate

1. **Tên dự án**: `HSS Thái Sơn` (hoặc gì cũng được)
2. **Tổ chức / Vị trí**: để mặc định (No organization)
3. Bấm **"TẠO"** (CREATE)
4. Đợi ~30 giây — thông báo "Dự án đã sẵn sàng"

📋 **Lấy Project Number**:
- Click vào tên dự án vừa tạo (góc trên trang Console)
- Trong khung "Thông tin dự án" (Project info), copy số **"Số dự án"** (Project number) — gồm 10-12 chữ số
- **Gửi số này cho em qua chat** (em cần để xác nhận)

---

## ⚙️ Bước 2 — Bật 3 API cần thiết (3 phút)

🔗 **Link**: https://console.cloud.google.com/apis/library

Đảm bảo top bar đang chọn project `HSS Thái Sơn`. Lần lượt bật 3 API:

1. Ô tìm kiếm gõ **"Apps Script API"** → click → **BẬT** (Enable)
2. Quay lại Library, gõ **"Google Drive API"** → click → **BẬT**
3. Quay lại Library, gõ **"Google Sheets API"** → click → **BẬT**

---

## ⚙️ Bước 3 — OAuth Consent Screen (4 phút)

🔗 **Link**: https://console.cloud.google.com/apis/credentials/consent

### 3.1 — User Type
- Chọn **"Bên ngoài"** (External) → **TẠO**

### 3.2 — Thông tin ứng dụng
- **Tên ứng dụng**: `HSS Thái Sơn Local`
- **Email hỗ trợ người dùng**: `xebatcheotrt@gmail.com`
- **Thông tin liên hệ của nhà phát triển**: `xebatcheotrt@gmail.com`
- Các ô khác bỏ trống → **LƯU VÀ TIẾP TỤC** (SAVE AND CONTINUE)

### 3.3 — Scopes
- Bỏ qua, không thêm gì → **LƯU VÀ TIẾP TỤC**

### 3.4 — Test users
- Bấm **+ THÊM NGƯỜI DÙNG** (ADD USERS)
- Nhập `xebatcheotrt@gmail.com` → **THÊM**
- **LƯU VÀ TIẾP TỤC**

### 3.5 — Summary
- Xem lại → **QUAY LẠI BẢNG TỔNG QUAN**

---

## ⚙️ Bước 4 — Tạo OAuth Client (Desktop) — 3 phút

🔗 **Link**: https://console.cloud.google.com/apis/credentials

1. Click **"+ TẠO THÔNG TIN ĐĂNG NHẬP"** (CREATE CREDENTIALS) → chọn **"Mã ứng dụng khách OAuth"** (OAuth client ID)
2. **Loại ứng dụng**: chọn **"Ứng dụng dành cho máy tính"** (Desktop app)
3. **Tên**: `clasp`
4. Bấm **TẠO** (CREATE)
5. Popup hiện ra → bấm **"TẢI XUỐNG JSON"** (DOWNLOAD JSON)
6. File tải về có tên dạng `client_secret_XXXXX.json`
7. **Đổi tên file** thành `creds.json`
8. **Copy file** vào thư mục dự án: `D:\XebatcheoTrT\1\EduTech_ChungTran\Code\HoSoSo_TH\Hệ thống quản trị số\THThaiSon\`

---

## ⚙️ Bước 5 — Liên kết Apps Script ↔ GCP Project (2 phút)

🔗 **Link**: https://script.google.com/d/1NGbNJ2vxwyULeV2LxFxAWqNiJuZOo5Y1g12qTLZ-MJJs-dcl8k9RSvPC/edit

1. Trong GAS Editor, sidebar trái có icon **bánh răng** ⚙ "Cài đặt dự án" — bấm vào
2. Cuộn xuống mục **"Dự án Google Cloud Platform (GCP)"**
3. Bấm **"Thay đổi dự án"** (Change project)
4. Paste **Project Number** (số từ Bước 1) vào ô
5. Bấm **"Đặt dự án"** (Set project)

---

## ✅ Báo em khi xong

Sau khi hoàn thành 5 bước, báo em **"Xong"** + gửi **Project Number**. Em sẽ:
1. Login lại clasp với credentials mới: `clasp login --creds ./creds.json`
2. Test `clasp run setupAll` chạy được không
3. Update `deploy-gas.ps1` để dùng full workflow
4. Xóa file `creds.json` khỏi không-an-toàn (đẩy vào thư mục credentials riêng)

---

## 🔒 Bảo mật `creds.json`
- File này chứa OAuth client secret — **KHÔNG bao giờ** push lên Git/GitHub public
- Em sẽ thêm vào file gitignore (khi nào có Git repo) và lưu nó tại nơi an toàn
- Có thể revoke bất cứ lúc nào tại https://console.cloud.google.com/apis/credentials
