# Dự án: Hồ sơ số — Trường Tiểu học Thái Sơn (Đô Lương, Nghệ An)

## Tổng quan
Hệ thống Hồ sơ số + KĐCL + QLCL + đồng bộ CSDL ngành MOET — **single-school**,
clone từ template gốc TH Diễn Liên (kiến trúc D-3, v3.0). Vào web là dùng được ngay,
KHÔNG có wizard cấu hình lần đầu.

## Kiến trúc
```
GitHub Pages: hososotruonghoc.github.io/tieuhocthaison/
├─ index.html       — Trang Hồ sơ số (HSS) + KĐCL React app
├─ app.js           — Logic HSS chính (callGAS, render, Admin, Setup, view-swap)
├─ style.css        — Theme HSS
├─ qlcl.html        — Trang QLCL GDTH (chấm điểm, NLPC, sổ chủ nhiệm)
├─ qlcl-app.js      — Logic QLCL
├─ qlcl-style.css   — Theme QLCL
├─ Code.gs          — Backend Apps Script (gộp Router + HSS + TDG + QLCL + MOET)
├─ hss-sync-extension/  — Chrome Extension đồng bộ điểm lên CSDL ngành MOET
└─ mẫu-hocba/     — Mẫu học bạ Lớp 1-5 (.docx)
       │
       ▼ fetch JSONP
Apps Script: AKfycbwTwqzXPUNzeLnnneoE8.../exec
       │
       ▼
Google Sheet (Thái Sơn) + Drive folder
```

## File quan trọng
- `index.html` — title + meta SEO + 3 URL Apps Script (API_URL_EARLY, API_URL, DEFAULT_APPS_SCRIPT_URL)
- `app.js` — fallback `cfg.name || 'Trường Tiểu học Thái Sơn'`
- `qlcl.html` / `qlcl-app.js` — `var API_URL` + `_rptSchool()` default 'Trường Tiểu học Thái Sơn'
- `Code.gs` — backend chung; tên trường + cấu hình đọc từ tab CauHinh trong Sheet (sửa qua Admin → Thông tin trường, KHÔNG sửa code)

## Khi đổi backend (chuyển Apps Script sang URL khác)
Sửa 5 chỗ:
1. `index.html` line ~64  — `var API_URL_EARLY`
2. `index.html` line ~1526 — `const API_URL`
3. `index.html` line ~1953 — `const DEFAULT_APPS_SCRIPT_URL`
4. `qlcl.html` line ~631  — `var API_URL`
5. `qlcl-app.js` line ~44 — `var DEFAULT_GAS`

## Workflow code update (FE)
```bash
git pull && [edit] && git commit && git push
# → GitHub Pages auto-deploy ~30s
```

## Workflow code update (Code.gs)
1. Mở Apps Script project Thái Sơn (HSS_TH_ThaiSon_Backend)
2. Paste Code.gs mới → Lưu
3. Triển khai → Quản lý phiên bản → Tạo bản triển khai mới (KHÔNG đổi URL)

## Quy tắc quan trọng (KHI VIẾT CODE)
- ✅ Tên trường/xã/tỉnh: đọc từ Sheet CauHinh (qua `cfg`/`STATS.config`), fallback hard-code 'Thái Sơn' / 'Đô Lương' / 'Nghệ An' nếu Sheet chưa có
- ✅ Địa danh ký văn bản: 'Thái Sơn' (không phải xã hành chính sau sát nhập)
- ✅ Mã GV / Mã Admin: đọc động từ Sheet CauHinh (`auth_token_gv`, `auth_token_admin`)
- ❌ **KHÔNG ghi "Phòng GD&ĐT"** — Việt Nam đã bỏ cấp huyện từ 2025 (chỉ Tỉnh + Xã). Báo cáo cấp trên = Sở GD&ĐT Nghệ An.

## Cấu trúc Excel MOET (35 cột)
Xem `hss-sync-extension/` để biết chi tiết mapping QLCL key → cột Excel MOET.
Mapping chi tiết trong file Code.gs (action `getKetQuaMOET`) và content.js của extension.

## Versioning
- v3.0 (2026-05-05): Phương án D-3 — gộp HSS + KĐCL + QLCL thành 1 Sheet + 1 Apps Script (gốc DL)
- v4.0 (2026-05-11): Multi-School template — REVERTED 2026-05-12
- **v5.0 (2026-05-12): Quay về single-school clone DL** (file này phản ánh) — gỡ boot.js/wizard.js/schools.json, FE clone thẳng từ DL, đổi text + URL Apps Script
