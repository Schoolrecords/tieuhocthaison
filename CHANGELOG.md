# CHANGELOG — TH Thái Sơn

> Lịch sử thay đổi riêng của hệ thống Hồ sơ số TH Thái Sơn (Đô Lương).
> Trước mốc clone, xem CHANGELOG bản gốc tại `THDienLien/CHANGELOG.md`.

---

## [Assets + brand identity] — 2026-05-13 (chiều)

### ✨ Thay đổi
- **`Logo_THTS.svg` + `Logo_THTS.png` (1024×1024) + `Logo_THTS.jpg`**: tạo logo placeholder generative bằng SVG — vòng tròn xanh lá (#16a34a), sách mở với gradient vàng, mặt trời + lá decoration, ribbon "2025 — 2026", text vòng cung "TRƯỜNG TIỂU HỌC THÁI SƠN" + "XÃ ĐÔ LƯƠNG · TỈNH NGHỆ AN". Render bằng Edge headless (msedge --headless --window-size=1024,1024 --screenshot).
- **`og-banner.png` + `og-banner.jpg` (1200×630)**: render từ `og-banner-template.html` qua Edge headless. JPG quality 90. Có logo + slogan "Hệ thống Hồ sơ số toàn diện" + 4 chip Hồ sơ số/QLCL/KĐCL/ĐBCL + footer slug `schoolrecords.github.io/tieuhocthaison`.
- **Tinh chỉnh logo**: dời ribbon năm học từ y=880 lên y=740 (đặt trong sách) để không che text "XÃ ĐÔ LƯƠNG · TỈNH NGHỆ AN" ở vòng dưới.

### 📌 Lưu ý
Logo này là **placeholder professional** — đủ tốt để dùng ngay, nhưng nên thay bằng logo chính thức của trường khi có. Sửa `Logo_THTS.svg` + chạy lại lệnh render Edge headless để regenerate PNG/JPG.

---

## [🚨 HOTFIX cross-school data leak] — 2026-05-13 (trưa)

### 🚨 Bug
Sau khi smoke test Apps Script deployment phát hiện: **`DATA_HSS` const trong `Code.gs`** (dòng 1209) hardcode **82 Google Drive folder ID của TH Diễn Liên**. Khi `setupAll()` đã chạy lần đầu trên Sheet Thái Sơn, 82 link Drive Diễn Liên đã ghi vào tab `Danh muc HSS`. Hệ quả nếu không sửa:
- GV/HT Thái Sơn click "📂 Mở Drive" trên 1 hồ sơ → mở Drive folder TH Diễn Liên
- Upload file → upload vào Drive Diễn Liên (data leak ngược)
- Hoặc bị "Access denied" nếu không có quyền

### 🔍 Root cause
Script auto-replace lúc clone chỉ thay tên trường/slug/token — không match được Drive folder ID (chuỗi random 33 ký tự). 82 URL thoát khỏi rà soát.

### ✨ Sửa
- **`Code.gs`**: regex replace `"https://drive.google.com/drive/folders/[A-Za-z0-9_-]+"` → `""` ở toàn bộ `DATA_HSS`. Verify: 82 → 0.
- **Thêm function `resetHssLinksForNewSchool()`** (Code.gs sau `_populateSheet`) — clear cột C (Link Drive) ở tab `Danh muc HSS`. Idempotent.

### 🛡 Cần làm sau khi deploy
1. **Deploy Code.gs mới** lên Apps Script (`.\deploy-gas.ps1` sau khi `clasp login`, hoặc copy-paste thủ công)
2. **Mở Apps Script editor → dropdown chọn `resetHssLinksForNewSchool` → ▶ Run** (cấp quyền nếu cần)
3. Verify: gọi `?action=getHSS` → tất cả `link` trong response = `""`
4. Mở Admin web → từng hồ sơ → paste link Drive Thái Sơn (sau khi tạo Drive folder tổ chức riêng)

### 📌 Bài học
Khi clone codebase cross-school: **phải grep toàn bộ const hardcode (Drive ID, Sheet ID, Folder ID, Image URL)**, không chỉ tên trường. Script auto-replace dùng pattern dạng tên có dấu chỉ bắt được human-readable string.

---

## [Phase 2 — DBCL backend + deploy clasp] — 2026-05-13

### 🎯 Mục tiêu
Triển khai module **ĐBCL (Đảm bảo chất lượng)** và setup quy trình deploy Apps Script tự động bằng `clasp` cho TH Thái Sơn.

### ✨ Thay đổi
- **Thêm module DBCL**:
  - `dbcl.html` (19KB) — UI Đảm bảo chất lượng (tách riêng khỏi `index.html`)
  - `dbcl-app.js` (35KB) — logic FE
  - Dispatch backend trong `Code.gs` (Phase 2)
- **Tách `kdcl.html` + `kdcl-app.js`** ra khỏi `index.html` để giảm trọng lượng landing (540KB → 163KB)
- **`core-shared.js` (27KB)** — gom helpers dùng chung (auth, callGAS, format) cho `index/qlcl/kdcl/dbcl`
- **Setup deploy clasp**:
  - `.clasp.json` + `.claspignore` + `appsscript.json`
  - `deploy-gas.ps1` — script PowerShell push code lên Apps Script
  - `SETUP_CLASP_RUN.md`, `DEPLOY_GAS.md` — hướng dẫn
- **Apps Script đã deploy**:
  - Sheet ID: `19Pdl_fIcDaqrEh9F2DLZZWnlPueDG0quqSMhsIu5Gy8`
  - Script ID: `1NGbNJ2vxwyULeV2LxFxAWqNiJuZOo5Y1g12qTLZ-MJJs-dcl8k9RSvPC`
  - Account: `xebatcheotrt@gmail.com`
- **MAPPING.md** — tài liệu mapping QLCL key ↔ cột Excel MOET (35 cột, 3 hàng header)
- **Cache version**: `?v=2026.05.12-qts-final`

### 📁 File deploy
- FE: push GitHub Pages (`schoolrecords.github.io/tieuhocthaison`)
- BE: `.\deploy-gas.ps1 -Message "..."`

---

## [Clone khởi tạo từ TH Diễn Liên] — 2026-05-13

### 🎯 Mục tiêu
Tách dự án Thái Sơn (Đô Lương) khỏi codebase Diễn Liên (Quảng Châu) để 2 trường chạy độc lập.

### ✨ Thay đổi (do script tự động thực hiện)
- **Tên trường, địa danh**: `Diễn Liên` → `Thái Sơn`, `Quảng Châu` → `Đô Lương`
- **Slug, đường dẫn**: `tieuhocdienlien` → `tieuhocthaison`, `THDienLien` → `THThaiSon`, `THDL` → `THTS`
- **Token (Code.gs)**: `DienLien-2026` → `ThaiSon-2026`, `AdminDL-2026` → `AdminTS-2026`
- **Header HTML** (`qlcl-app.js`): `PHÒNG GD&ĐT DIỄN CHÂU` → `SỞ GIÁO DỤC VÀ ĐÀO TẠO NGHỆ AN`
- **Apps Script URL**: thay bằng placeholder `CHUA_CAU_HINH_APPS_SCRIPT_THAI_SON` ở 4 file HTML (sau đó đã điền URL thật khi deploy)
- **Đã xóa**: `Data/THDienLien_05.2026.gsheet`, thư mục `Mẫu Học bạ/` cũ, ảnh hoạt động trường Diễn Liên

### ⚠️ Tuân thủ
- KHÔNG ghi "Phòng GD&ĐT" (Việt Nam đã bỏ cấp huyện từ 2025)
- KHÔNG ghi "huyện Đô Lương" — Đô Lương hiện là **xã**, không phải huyện
- Cấp trên trực tiếp: **Sở GD&ĐT Nghệ An**

### 📌 Đã kế thừa từ Diễn Liên (đầy đủ tính đến 2026-05-12)
Tất cả các đợt cải tiến của TH Diễn Liên trước mốc 2026-05-13 đều có trong codebase Thái Sơn, gồm:
- Mobile compat + 12 step-card hướng dẫn QLCL (2026-05-11)
- Dọn QLCL v1 dead code 4 lớp (2026-05-10)
- Filter 5 khối + HOTFIX modal qlNXModal (2026-05-08)
- Bảng tổng hợp QLCL (2026-05-08)
- Đổi màu nút "Cuối năm" + logic Khóa/Mở kỳ (2026-05-08)
- Guest Mode QLCL (2026-05-07)
- SSO 1 login HSS + QLCL (2026-05-07)
- D-3 Final: 1 Sheet + 1 Apps Script + 1 URL (2026-05-05)

### 🔧 Còn thiếu (chờ thầy điền)
- Logo trường: `Logo_THTS.png` / `Logo_THTS.jpg`
- Banner social share: `og-banner.jpg` (render từ `og-banner-template.html`)
- Chữ ký HT + dấu trường (PNG nền trong suốt)
- Dữ liệu CBGV-NV, HS, điểm — import qua Admin → Excel
- `HSS_EXT_ID` (Chrome Extension)
