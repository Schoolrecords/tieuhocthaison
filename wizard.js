/*
============================================================================
 wizard.js — First-Run Wizard cấu hình trường (Multi-School / Kiến trúc D)
============================================================================
 Khi admin trường mở web LẦN ĐẦU (Sheet CauHinh trống tên trường):
   1. Hiện modal 4 bước thu thập: Tên trường, Cán bộ, Mã đăng nhập, Xác nhận
   2. POST saveSchoolConfig → backend ghi vào Sheet CauHinh
   3. Reload trang → app.js render bình thường

 Tự động phát hiện first-run dựa vào:
   • window.__earlyData.config (JSONP từ getAll)
   • Nếu config.name trống → show wizard
   • Nếu config.name có → skip, app.js chạy bình thường

 Phụ thuộc: boot.js (set window.SCHOOL + window.API_URL trước)
============================================================================
*/

(function () {
  'use strict';

  var STATE = {
    step:   1,
    school: null,
    data:   {
      // Bước 1
      name:     '',
      xa:       '',
      tinh:     '',
      address:  '',
      namHoc:   '2025-2026',
      themeColor: '#1e3a8a',
      // Bước 2
      hieuTruong: '',
      phoHT:      '',
      phone:      '',
      email:      '',
      // Bước 3
      authTokenGV:    '',
      authTokenAdmin: ''
    }
  };

  // ── Listen boot.js ───────────────────────────────────────────────────────
  window.addEventListener('hss:school-ready', function (e) {
    STATE.school = e.detail || window.SCHOOL;
    if (!STATE.school) return;

    // Pre-fill từ registry
    STATE.data.name  = STATE.school.name  || '';
    STATE.data.xa    = STATE.school.xa    || '';
    STATE.data.tinh  = STATE.school.tinh  || '';
    STATE.data.address = STATE.school.xa && STATE.school.tinh
      ? ('Xã ' + STATE.school.xa + ', Tỉnh ' + STATE.school.tinh)
      : '';
    STATE.data.themeColor = STATE.school.primaryColor || '#1e3a8a';

    waitForEarlyData(function (data) {
      if (needsWizard(data)) {
        showWizard();
      }
    });
  });

  function waitForEarlyData(cb) {
    var tries = 0;
    var timer = setInterval(function () {
      tries++;
      if (window.__earlyData) {
        clearInterval(timer);
        cb(window.__earlyData);
      } else if (window.__earlyFailed || tries > 50) {
        clearInterval(timer);
        cb(null);  // không có data — coi như cần wizard
      }
    }, 100);
  }

  function needsWizard(data) {
    if (!data) return true;
    // Response từ _hssDoGet luôn dạng {ok, data: {...}}. getAllData() lồng config
    // trong data.stats.config, KHÔNG phải data.config. Trước đây check sai path
    // nên wizard luôn hiện lại dù đã setup → 2026-05-12 fix.
    if (data.ok === false) return true;
    var root = (data && data.data) ? data.data : data;
    var cfg = (root && root.stats && root.stats.config) ||
              (root && root.config) || null;
    if (!cfg) return true;
    var nameStr = cfg.name || cfg['Tên trường'] || '';
    return !nameStr || String(nameStr).trim() === '';
  }

  // ── UI ───────────────────────────────────────────────────────────────────
  function showWizard() {
    injectStyles();
    var html =
      '<div class="hssw-overlay" id="hsswOverlay">' +
        '<div class="hssw-modal">' +
          '<div class="hssw-header">' +
            '<div class="hssw-emoji">🎉</div>' +
            '<h2 class="hssw-title">Chào mừng đến với Hồ sơ số</h2>' +
            '<p class="hssw-sub">Thiết lập hệ thống cho <b>' + escapeHtml(STATE.school.name) + '</b></p>' +
            '<div class="hssw-progress">' +
              '<span class="hssw-dot active" data-step="1">1</span>' +
              '<span class="hssw-line"></span>' +
              '<span class="hssw-dot" data-step="2">2</span>' +
              '<span class="hssw-line"></span>' +
              '<span class="hssw-dot" data-step="3">3</span>' +
              '<span class="hssw-line"></span>' +
              '<span class="hssw-dot" data-step="4">4</span>' +
            '</div>' +
          '</div>' +
          '<div class="hssw-body" id="hsswBody"></div>' +
          '<div class="hssw-footer">' +
            '<button class="hssw-btn-ghost" id="hsswPrev" disabled>← Quay lại</button>' +
            '<button class="hssw-btn-primary" id="hsswNext">Tiếp →</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.insertAdjacentHTML('beforeend', html);

    document.getElementById('hsswPrev').addEventListener('click', wizardPrev);
    document.getElementById('hsswNext').addEventListener('click', wizardNext);

    renderStep();
  }

  function renderStep() {
    var body = document.getElementById('hsswBody');
    var step = STATE.step;
    var html = '';
    if (step === 1) html = stepInfo();
    else if (step === 2) html = stepStaff();
    else if (step === 3) html = stepTokens();
    else if (step === 4) html = stepConfirm();
    body.innerHTML = html;

    // Wire input changes
    body.querySelectorAll('input,select,textarea').forEach(function (el) {
      el.addEventListener('input', function () {
        STATE.data[el.id.replace(/^hssw-/, '')] = el.value;
        if (el.id === 'hssw-xa' || el.id === 'hssw-tinh') {
          // auto cập nhật address
          var addrEl = body.querySelector('#hssw-address');
          if (addrEl && !addrEl.dataset.userEdited) {
            var xa = STATE.data.xa || '...', tinh = STATE.data.tinh || '...';
            STATE.data.address = 'Xã ' + xa + ', Tỉnh ' + tinh;
            addrEl.value = STATE.data.address;
          }
        }
      });
    });
    var addrEl = body.querySelector('#hssw-address');
    if (addrEl) addrEl.addEventListener('input', function () { addrEl.dataset.userEdited = '1'; });

    // Cập nhật progress dots
    document.querySelectorAll('.hssw-dot').forEach(function (d) {
      var s = parseInt(d.getAttribute('data-step'));
      d.classList.toggle('active', s <= step);
      d.classList.toggle('done', s < step);
    });

    document.getElementById('hsswPrev').disabled = step === 1;
    document.getElementById('hsswNext').textContent = step === 4 ? '✓ Lưu cấu hình' : 'Tiếp →';
  }

  function stepInfo() {
    var d = STATE.data;
    return '' +
      '<h3 class="hssw-step-title">Bước 1/4 — Thông tin trường</h3>' +
      '<p class="hssw-step-hint">Em đã điền sẵn từ registry. Thầy/cô kiểm tra lại và sửa nếu cần.</p>' +
      field('hssw-name',    'Tên trường (đầy đủ) *', 'text',  d.name,    'VD: Trường Tiểu học An Bình') +
      field('hssw-xa',      'Xã/Phường *',           'text',  d.xa,      'VD: An Bình') +
      field('hssw-tinh',    'Tỉnh/Thành phố *',      'text',  d.tinh,    'VD: Nghệ An') +
      field('hssw-address', 'Địa chỉ đầy đủ *',      'text',  d.address || ('Xã '+d.xa+', Tỉnh '+d.tinh), 'Tự động ghép từ Xã + Tỉnh') +
      field('hssw-namHoc',  'Năm học hiện tại *',    'text',  d.namHoc,  'VD: 2025-2026') +
      field('hssw-themeColor', 'Màu chủ đạo (theme)', 'color', d.themeColor, '');
  }

  function stepStaff() {
    var d = STATE.data;
    return '' +
      '<h3 class="hssw-step-title">Bước 2/4 — Cán bộ quản lý</h3>' +
      '<p class="hssw-step-hint">Tên Hiệu trưởng/Phó HT sẽ in vào học bạ + báo cáo. Có thể sửa sau qua Admin.</p>' +
      field('hssw-hieuTruong', 'Hiệu trưởng *',     'text', d.hieuTruong, 'VD: Nguyễn Văn A') +
      field('hssw-phoHT',      'Phó Hiệu trưởng',   'text', d.phoHT,      'VD: Trần Thị B (tùy chọn)') +
      field('hssw-phone',      'Điện thoại trường', 'tel',  d.phone,      'VD: 02386123456') +
      field('hssw-email',      'Email trường',      'email',d.email,      'VD: thpt.xyz@gmail.com');
  }

  function stepTokens() {
    var d = STATE.data;
    var code = STATE.school.code || 'school';
    return '' +
      '<h3 class="hssw-step-title">Bước 3/4 — Mã đăng nhập (BẢO MẬT)</h3>' +
      '<p class="hssw-step-hint">' +
        '<b>Mã GV</b>: cấp cho giáo viên khi nhập điểm/nhận xét. ' +
        '<b>Mã Admin</b>: chỉ Hiệu trưởng/Phó HT giữ. ' +
        '<b>⚠ Đặt mã mạnh, ≥6 ký tự</b>. Có thể đổi sau qua Sheet CauHinh.' +
      '</p>' +
      field('hssw-authTokenGV',    'Mã đăng nhập Giáo viên *', 'text', d.authTokenGV    || (capitalize(code) + '-2026'), 'VD: ' + capitalize(code) + '-2026') +
      field('hssw-authTokenAdmin', 'Mã đăng nhập Admin *',     'text', d.authTokenAdmin || ('Admin' + capitalize(code).slice(0,3) + '-2026'), 'VD: AdminXyz-2026') +
      '<div class="hssw-warning">⚠ Lưu cả 2 mã này vào nơi an toàn (sổ tay/Zalo BGH) — em không lưu chỗ nào khác ngoài Sheet CauHinh của trường mình.</div>';
  }

  function stepConfirm() {
    var d = STATE.data;
    return '' +
      '<h3 class="hssw-step-title">Bước 4/4 — Xác nhận</h3>' +
      '<p class="hssw-step-hint">Kiểm tra lại lần cuối. Bấm "Lưu cấu hình" để hoàn tất.</p>' +
      '<table class="hssw-confirm">' +
        confirmRow('Tên trường',     d.name) +
        confirmRow('Xã/Tỉnh',         d.xa + ' / ' + d.tinh) +
        confirmRow('Địa chỉ',         d.address) +
        confirmRow('Năm học',         d.namHoc) +
        confirmRow('Hiệu trưởng',     d.hieuTruong) +
        confirmRow('Phó HT',          d.phoHT || '(chưa nhập)') +
        confirmRow('Điện thoại',      d.phone || '(chưa nhập)') +
        confirmRow('Email',           d.email || '(chưa nhập)') +
        confirmRow('Mã GV',           '<code>' + escapeHtml(d.authTokenGV) + '</code>') +
        confirmRow('Mã Admin',        '<code>' + escapeHtml(d.authTokenAdmin) + '</code>') +
      '</table>';
  }

  function field(id, label, type, value, hint) {
    var inputAttr = type === 'color' ? 'style="height:42px;cursor:pointer"' : '';
    return '' +
      '<div class="hssw-field">' +
        '<label for="' + id + '">' + label + '</label>' +
        '<input id="' + id + '" type="' + type + '" value="' + escapeAttr(value) + '" placeholder="' + escapeAttr(hint) + '" ' + inputAttr + '>' +
        (hint && type !== 'color' ? '<div class="hssw-hint">' + escapeHtml(hint) + '</div>' : '') +
      '</div>';
  }

  function confirmRow(k, v) {
    return '<tr><td class="hssw-confirm-k">' + escapeHtml(k) + '</td><td>' + (v.indexOf('<code>') === 0 ? v : escapeHtml(v)) + '</td></tr>';
  }

  // ── Navigation ───────────────────────────────────────────────────────────
  function wizardPrev() {
    if (STATE.step > 1) {
      STATE.step--;
      renderStep();
    }
  }

  function wizardNext() {
    if (!validateStep(STATE.step)) return;
    if (STATE.step < 4) {
      STATE.step++;
      renderStep();
    } else {
      submitWizard();
    }
  }

  function validateStep(step) {
    var d = STATE.data;
    if (step === 1) {
      if (!d.name || !d.xa || !d.tinh || !d.address || !d.namHoc) {
        alert('Vui lòng điền đầy đủ các trường có dấu *');
        return false;
      }
    } else if (step === 2) {
      if (!d.hieuTruong) {
        alert('Vui lòng điền tên Hiệu trưởng (bắt buộc)');
        return false;
      }
    } else if (step === 3) {
      if (!d.authTokenGV || d.authTokenGV.length < 6) {
        alert('Mã GV phải ≥6 ký tự');
        return false;
      }
      if (!d.authTokenAdmin || d.authTokenAdmin.length < 6) {
        alert('Mã Admin phải ≥6 ký tự');
        return false;
      }
      if (d.authTokenGV === d.authTokenAdmin) {
        alert('Mã GV và Mã Admin phải KHÁC nhau');
        return false;
      }
    }
    return true;
  }

  // ── Submit ───────────────────────────────────────────────────────────────
  function submitWizard() {
    var btn = document.getElementById('hsswNext');
    btn.disabled = true;
    btn.textContent = '⏳ Đang lưu...';

    var body = {
      action: 'saveSchoolConfig',
      schoolCode: STATE.school.code,
      name:       STATE.data.name,
      address:    STATE.data.address,
      xa:         STATE.data.xa,
      tinh:       STATE.data.tinh,
      namHoc:     STATE.data.namHoc,
      hieuTruong: STATE.data.hieuTruong,
      phoHT:      STATE.data.phoHT,
      phone:      STATE.data.phone,
      email:      STATE.data.email,
      themeColor: STATE.data.themeColor,
      authTokenGV:    STATE.data.authTokenGV,
      authTokenAdmin: STATE.data.authTokenAdmin
    };

    postGAS(body, function (ok, resp) {
      if (!ok) {
        alert('❌ Lưu thất bại: ' + (resp && resp.error || resp || 'Không rõ lỗi'));
        btn.disabled = false;
        btn.textContent = '✓ Lưu cấu hình';
        return;
      }
      alert('✅ Đã lưu cấu hình thành công!\n\nTrường: ' + STATE.data.name + '\n\nTrang sẽ tải lại để áp dụng cấu hình mới.');
      // Cache mã admin vào sessionStorage để admin không cần đăng nhập ngay lần đầu
      try {
        sessionStorage.setItem('hss_admin_token_just_set', STATE.data.authTokenAdmin);
      } catch (e) {}
      location.reload();
    });
  }

  function postGAS(body, callback) {
    var url = window.API_URL || '';
    if (!url) {
      callback(false, 'API URL trống — kiểm tra schools.json');
      return;
    }
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body)
    }).then(function (r) {
      return r.json();
    }).then(function (resp) {
      if (resp && resp.ok) callback(true, resp);
      else callback(false, resp);
    }).catch(function (err) {
      callback(false, err.message || 'Network error');
    });
  }

  // ── Utils ────────────────────────────────────────────────────────────────
  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function escapeAttr(s) {
    return escapeHtml(s).replace(/"/g, '&quot;');
  }
  function capitalize(s) {
    return String(s || '').charAt(0).toUpperCase() + String(s || '').slice(1);
  }

  function injectStyles() {
    if (document.getElementById('hssw-styles')) return;
    var css =
      '.hssw-overlay{position:fixed;inset:0;background:rgba(15,23,42,.65);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;font-family:"Be Vietnam Pro",system-ui,sans-serif}' +
      '.hssw-modal{background:#fff;border-radius:18px;max-width:560px;width:100%;max-height:90vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.3)}' +
      '.hssw-header{padding:24px 28px 16px;border-bottom:1px solid #e2e8f0;background:linear-gradient(135deg,#eff6ff,#f0fdf4)}' +
      '.hssw-emoji{font-size:36px;margin-bottom:6px}' +
      '.hssw-title{margin:0 0 4px;font-size:20px;color:#0f172a}' +
      '.hssw-sub{margin:0 0 16px;color:#64748b;font-size:13px}' +
      '.hssw-progress{display:flex;align-items:center;gap:6px;margin-top:8px}' +
      '.hssw-dot{width:26px;height:26px;border-radius:50%;background:#e2e8f0;color:#64748b;font-size:12px;font-weight:600;display:flex;align-items:center;justify-content:center;transition:all .25s}' +
      '.hssw-dot.active{background:var(--school-brand,#1e3a8a);color:#fff}' +
      '.hssw-dot.done{background:#10b981;color:#fff}' +
      '.hssw-dot.done::before{content:"✓";font-size:14px}' +
      '.hssw-dot.done{font-size:0}' +
      '.hssw-line{flex:1;height:2px;background:#e2e8f0}' +
      '.hssw-body{padding:24px 28px;overflow-y:auto;flex:1}' +
      '.hssw-step-title{margin:0 0 4px;font-size:16px;color:#0f172a}' +
      '.hssw-step-hint{margin:0 0 18px;color:#64748b;font-size:13px;line-height:1.5}' +
      '.hssw-field{margin-bottom:14px}' +
      '.hssw-field label{display:block;font-size:13px;font-weight:600;color:#0f172a;margin-bottom:5px}' +
      '.hssw-field input{width:100%;padding:10px 12px;border:1.5px solid #cbd5e1;border-radius:8px;font-size:14px;box-sizing:border-box;font-family:inherit}' +
      '.hssw-field input:focus{outline:none;border-color:var(--school-brand,#1e3a8a);box-shadow:0 0 0 3px rgba(30,58,138,.12)}' +
      '.hssw-hint{font-size:12px;color:#94a3b8;margin-top:4px}' +
      '.hssw-warning{margin-top:12px;padding:10px 12px;background:#fef3c7;border-left:3px solid #f59e0b;border-radius:6px;font-size:12.5px;color:#78350f;line-height:1.5}' +
      '.hssw-confirm{width:100%;border-collapse:collapse;font-size:13.5px}' +
      '.hssw-confirm td{padding:8px 0;border-bottom:1px solid #f1f5f9}' +
      '.hssw-confirm-k{color:#64748b;width:38%;vertical-align:top}' +
      '.hssw-confirm code{background:#f1f5f9;padding:2px 6px;border-radius:4px;font-family:monospace}' +
      '.hssw-footer{padding:16px 28px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;gap:10px;background:#f8fafc}' +
      '.hssw-btn-ghost,.hssw-btn-primary{padding:10px 18px;border-radius:8px;font-size:14px;font-weight:600;font-family:inherit;cursor:pointer;border:0}' +
      '.hssw-btn-ghost{background:transparent;color:#64748b;border:1.5px solid #cbd5e1}' +
      '.hssw-btn-ghost:disabled{opacity:0.4;cursor:not-allowed}' +
      '.hssw-btn-primary{background:var(--school-brand,#1e3a8a);color:#fff}' +
      '.hssw-btn-primary:disabled{opacity:0.6;cursor:wait}';
    var el = document.createElement('style');
    el.id = 'hssw-styles';
    el.textContent = css;
    document.head.appendChild(el);
  }
})();
