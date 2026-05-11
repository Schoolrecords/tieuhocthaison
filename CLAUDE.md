# Dự án: Hệ thống Hồ sơ số Tiểu học (Multi-School Template — Kiến trúc D)

## Tổng quan
Hệ thống Hồ sơ số + KĐCL + QLCL + đồng bộ CSDL ngành MOET cho **nhiều trường tiểu học**,
một codebase template duy nhất, mỗi trường = 1 entry trong `schools.json` + 1 Apps Script riêng.

## Kiến trúc D — Hybrid + Public Registry

```
┌────────────────────────────────────────┐
│  GitHub Pages: 1 repo chung            │
│  • index.html, app.js, qlcl.html, ...  │
│  • boot.js       ← Router FE           │
│  • wizard.js     ← First-run wizard    │
│  • schools.json  ← Registry public     │
└────────────┬───────────────────────────┘
   User: hosososo.vn/?school=<code>
             │
   ┌─────────┴──────────┬──────────┐
   ▼                    ▼          ▼
 AppsScript A       AppsScript B   ...
 + Sheet A          + Sheet B
 + Drive A          + Drive B
 (data isolated)
```

## File quan trọng

### Multi-School layer (MỚI 2026-05-11)
- `boot.js`              — Router FE: fetch schools.json, set window.SCHOOL + window.API_URL, set SEO meta động + theme
- `wizard.js`            — First-run wizard 4 bước (Thông tin trường / Cán bộ / Mã đăng nhập / Xác nhận)
- `schools.json`         — Registry public (mỗi trường 1 entry: code, name, xa, tinh, apiUrl, primaryColor, active)

### Core code (đã refactor về generic)
- `index.html`           — Trang Hồ sơ số. SEO meta để trống, boot.js fill động
- `app.js`               — Logic HSS chính. Mọi nơi dùng `window.SCHOOL` + `cfg` từ Sheet thay vì hard-code
- `qlcl.html` / `qlcl-app.js` — QLCL GDTH. Tương tự, dùng `_rptSchool() / _rptXa() / _rptTinh()` helper
- `Code.gs`              — Backend Apps Script. SCHOOL_CONFIG mặc định trống. AUTH_TOKEN đọc động từ Sheet CauHinh
- `style.css` / `qlcl-style.css` — Theme động qua CSS variable `--school-brand`

### Chrome Extension (giữ nguyên — generic)
- `hss-sync-extension/`  — Đồng bộ điểm QLCL lên CSDL ngành MOET

## Triển khai trường mới (5-8 phút)

```bash
# 1. Tạo Google Sheet mới (1 phút)
# 2. Tạo Apps Script:
#    - Tiện ích → Apps Script → paste Code.gs → Save
#    - Run setup() → cấp quyền
#    - Deploy → Web App → "Anyone" → Copy URL /exec
# 3. Thêm entry vào schools.json (1 phút)
git pull
# Edit schools.json:
{
  "code": "truongx",
  "name": "Trường Tiểu học X",
  "shortName": "TH X",
  "xa": "...",
  "tinh": "Nghệ An",
  "apiUrl": "https://script.google.com/macros/s/AKfyc.../exec",
  "primaryColor": "#1e3a8a",
  "active": true,
  "createdAt": "2026-05-11"
}
git commit -m "feat: thêm trường TH X"
git push  # GitHub Pages auto-deploy

# 4. Gửi link admin trường (10 giây)
# "Cô A vào https://hosososo.vn/?school=truongx → wizard sẽ hỏi cấu hình"

# 5. Admin trường mở web lần đầu:
#    Wizard 4 bước → Lưu → Trang load lại với cấu hình đầy đủ
```

## Workflow code update

### FE (HTML/CSS/JS) — 30 giây
```bash
git pull && [edit] && git commit && git push
# → tất cả N trường thấy update ngay khi reload
```

### BE (Code.gs) — 5 phút/trường (manual) hoặc 30 giây (clasp script)
```bash
# Bán tự động: dùng clasp
for school in truongA truongB truongC; do
  cp Code.gs schools_clasp/$school/Code.gs
  cd schools_clasp/$school && clasp push -f && clasp deploy && cd ../..
done

# Sau update DATA_MINHCHUNG seed → trường nào muốn pull MC mới:
# Admin click "Đồng bộ MC chuẩn" → action mergeMinhChungSeed
# → thêm MC mới chưa có, KHÔNG ghi đè MC trường đã sửa
```

## API Multi-School (action mới)

### `saveSchoolConfig` (POST, first-run KHÔNG cần auth)
Body: `{ name, address, xa, tinh, namHoc, hieuTruong, phoHT, schoolCode, authTokenGV, authTokenAdmin, ... }`
Behavior: nếu sheet CauHinh chưa có `auth_token_admin` → cho phép write. Nếu đã có → bắt buộc admin auth.

### `mergeMinhChungSeed` (POST, cần admin auth)
Body: `{ action: 'mergeMinhChungSeed', token: 'AdminXXX' }`
Returns: `{ ok:true, added:n, skipped:n, total:n }`
Behavior: thêm MC chuẩn mới từ DATA_MINHCHUNG seed (master Code.gs) vào tab MinhChung; bỏ qua MC đã có (theo Mã MC).

## Quy tắc quan trọng (KHI VIẾT CODE)

- ❌ **KHÔNG hard-code** tên trường, xã, tỉnh trong code FE hay BE
- ✅ FE: dùng `window.SCHOOL.name` / `window.SCHOOL.xa` / `window.SCHOOL.tinh` (boot.js đảm bảo set trước app.js)
- ✅ BE: đọc từ `_getCfgMap_()` — key `auth_token_gv`, `auth_token_admin`, `school_code`, `drive_root_name`, `xa`, `tinh`
- ✅ Fallback chuỗi: dùng `'...'` (3 chấm) thay vì tên trường cụ thể
- ✅ Địa danh ký văn bản: dùng helper `_rptXa()` thay vì hard-code "Đô Lương,"
- ❌ **KHÔNG ghi "Phòng GD&ĐT"** — Việt Nam đã bỏ cấp huyện từ 2025 (chỉ Tỉnh + Xã)

## Cấu trúc Excel MOET (35 cột — không thay đổi)

Xem `hss-sync-extension/` để biết chi tiết mapping QLCL key → cột Excel MOET.

## Mã đăng nhập (mới — mỗi trường tự đặt qua wizard)

| Cấp | Key trong Sheet CauHinh | Vai trò |
|-----|--------------------------|----------|
| GV  | `auth_token_gv`         | Sửa điểm, nhận xét |
| Admin | `auth_token_admin`    | Admin panel + KĐCL + cả quyền GV |

Wizard yêu cầu mỗi mã ≥6 ký tự và 2 mã phải khác nhau.

## Versioning
- v3.0 (2026-05-05): Phương án D-3 — gộp HSS + KĐCL + QLCL thành 1 Sheet + 1 Apps Script
- **v4.0 (2026-05-11): Kiến trúc D — Multi-School template** (file này phản ánh)
