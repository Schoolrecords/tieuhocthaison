# Hướng dẫn ROLLBACK — Phương án D-3 (1 Sheet)

---

## 🟢 RỦI RO THẤP

Plan D-3 không xoá data, chỉ:
- Append code QLCL vào Code.gs HSS
- Copy 9 tab từ Sheet ngoài vào Sheet HSS

→ **Rollback**: revert Code.gs + xoá 9 tab mới copy.

---

## 🔄 ROLLBACK 4 BƯỚC

### Bước 1: Xoá 9 tab QLCL trong Sheet HSS

Mở Sheet HSS → chuột phải vào tab → **Xoá** từng tab:
```
Config (CHÚ Ý: nếu HSS đang dùng Config nội bộ thì SKIP — kiểm tra trước)
Lop
CN
GK2
CK1
GK1
NhanXet
Users
HocSinh
```

### Bước 2: Revert Code.gs HSS

Mở Apps Script editor → file `Code.gs`:
1. Tìm dòng có `// SECTION QLCL TEMPLATE (Wide Format)` (khoảng dòng 3340)
2. Xoá từ dòng đó đến cuối file (`// ═══════ END SECTION QLCL TEMPLATE ═══════`)
3. Tìm và xoá:
   - Const `_QLCL_TPL_ACTIONS = [...]` (~ dòng 66)
   - Block `if (_QLCL_TPL_ACTIONS.indexOf(action) >= 0) { ... }` trong `doPost`
4. **Ctrl+S** lưu

### Bước 3: Revert FE GitHub

```bash
cd <repo-folder>
git revert HEAD    # hoặc git revert <commit-hash của lần D-3>
git push origin main
```

Hoặc thủ công:
- Xoá `qlcl.html`, `qlcl-app.js`, `qlcl-style.css` khỏi repo
- Trong `app.js`, restore handler `showQlcl` về toggle in-page (xem CHANGELOG.md để biết version cũ)

### Bước 4: Khôi phục Sheet HSS từ backup

Nếu Bước 1 lỡ xoá nhầm tab quan trọng → restore từ `BACKUP_2026-05-05_PreD3` đã tạo ở Bước 1 deploy.

---

## 🛡 Backup quan trọng

| Backup | Mục đích |
|---|---|
| `BACKUP_2026-05-05_PreD3` (Sheet HSS) | Khôi phục nếu migration sai |
| Sheet `THThaiSon_05.2026` (cũ) | KHÔNG đụng — vẫn còn data 3 tháng làm backup tự nhiên |
| Project QLCL_V3.0 (cũ) | KHÔNG cần restore (đã không dùng nữa) |

→ Data 3 tháng QLCL **CÓ Ở 2 NƠI** sau migration:
- Sheet HSS (mới copy)
- Sheet THThaiSon_05.2026 (cũ, không đụng)

→ An toàn tuyệt đối, dù rollback hay không.

---

## 🔍 Debug trước khi rollback

### Vấn đề: "qlcl.html không kết nối được backend"
- F12 → Network → check API call đến `script.google.com/macros/s/AKfycbxS-M_WE3zkT7gR5kIuyka1DOOpGfgPCJInnpplpsik_RRfBQ6ULUDA9l8xlTVNgU_y/exec`
- Nếu sai URL: kiểm tra `qlcl.html` line ~563 và `qlcl-app.js` `DEFAULT_GAS`

### Vấn đề: "Login QLCL báo 'Tài khoản không tồn tại'"
- Verify tab `Users` đã được copy chưa (mở Sheet HSS, tìm tab `Users`)
- Nếu chưa: chạy lại `migrateQlclFromExternal`

### Vấn đề: "Nhập điểm không lưu"
- Apps Script Logs → tìm error
- Có thể: Apps Script chưa Deploy New version → quay lại Bước 5 deploy

### Vấn đề: "Tab Config conflict"
- Sheet HSS có thể đã có sẵn tab `Config` (do anh chạy nhầm setupAll trước đó). Migration sẽ skip để không ghi đè.
- Nếu cần data Config từ Sheet QLCL nguồn → copy thủ công từ Sheet `THThaiSon_05.2026` sang.

---

## 📞 Liên hệ em nếu có vấn đề không tự xử lý

Gửi qua chat:
1. Apps Script Logs (View → Logs)
2. Browser Console (F12 → Console)
3. Tab list của Sheet HSS sau migration
