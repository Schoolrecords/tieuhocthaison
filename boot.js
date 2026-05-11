/*
============================================================================
 boot.js — Router FE Multi-School (Phương án D)
============================================================================
 Load đầu tiên trong index.html và qlcl.html. Quy trình:
   1. Parse ?school=<code> hoặc localStorage 'lastSchool'
   2. Fetch /schools.json (registry public)
   3. Tìm school → set window.SCHOOL + window.API_URL
   4. Set SEO meta + theme color động
   5. Gọi loadMainApp() để app.js render
 Nếu không có school → render picker.
 Nếu school không tồn tại → render error.
============================================================================
*/

(function () {
  'use strict';

  // ── Config ───────────────────────────────────────────────────────────────
  var REGISTRY_URL = 'schools.json';
  var STORAGE_KEY  = 'hss_last_school';
  var CACHE_KEY    = 'hss_registry_cache_v1';
  var CACHE_TTL_MS = 5 * 60 * 1000; // 5 phút

  // ── Helpers ──────────────────────────────────────────────────────────────
  function getParam(name) {
    var m = location.search.match(new RegExp('[?&]' + name + '=([^&]+)'));
    return m ? decodeURIComponent(m[1]) : '';
  }

  function setMeta(name, content, isProperty) {
    var attr = isProperty ? 'property' : 'name';
    var el = document.querySelector('meta[' + attr + '="' + name + '"]');
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, name);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  }

  function setLinkCanonical(href) {
    var el = document.querySelector('link[rel="canonical"]');
    if (!el) {
      el = document.createElement('link');
      el.setAttribute('rel', 'canonical');
      document.head.appendChild(el);
    }
    el.setAttribute('href', href);
  }

  // ── Fetch registry (với cache 5 phút trong sessionStorage) ───────────────
  function fetchRegistry() {
    try {
      var cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        var parsed = JSON.parse(cached);
        if (Date.now() - parsed.t < CACHE_TTL_MS) {
          return Promise.resolve(parsed.data);
        }
      }
    } catch (e) {}

    return fetch(REGISTRY_URL + '?t=' + Date.now())
      .then(function (r) {
        if (!r.ok) throw new Error('Không tải được registry (HTTP ' + r.status + ')');
        return r.json();
      })
      .then(function (data) {
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), data: data }));
        } catch (e) {}
        return data;
      });
  }

  // ── Apply school metadata vào DOM ────────────────────────────────────────
  function applySchool(school, page) {
    window.SCHOOL  = school;
    window.API_URL = school.apiUrl || '';

    try { localStorage.setItem(STORAGE_KEY, school.code); } catch (e) {}

    var titlePrefix = (page === 'qlcl') ? 'Quản lý Chất lượng GDTH' : 'Hồ sơ số';
    var fullTitle   = titlePrefix + ' · ' + school.name;
    document.title  = fullTitle;

    setMeta('description',
      'Hệ thống ' + titlePrefix + ' chính thức của ' + school.name +
      ' — Xã ' + school.xa + ', Tỉnh ' + school.tinh + '.');

    setMeta('og:title',       fullTitle, true);
    setMeta('og:site_name',   titlePrefix + ' ' + school.name, true);
    setMeta('og:description', fullTitle + ' — ' + school.xa + ', ' + school.tinh, true);
    setMeta('og:type',        'website', true);

    var canonical = location.origin + location.pathname + '?school=' + school.code;
    setMeta('og:url',     canonical, true);
    setLinkCanonical(canonical);

    setMeta('twitter:title',       fullTitle);
    setMeta('twitter:description', fullTitle);
    setMeta('twitter:url',         canonical);

    if (school.primaryColor) {
      document.documentElement.style.setProperty('--school-brand', school.primaryColor);
      setMeta('theme-color', school.primaryColor);
    }

    // Fill các element có data-school-bind="<field>" với giá trị từ school
    // Chạy ngay (nếu DOM đã sẵn) và đăng ký để chạy lại khi DOMContentLoaded
    function fillBindings() {
      var els = document.querySelectorAll('[data-school-bind]');
      els.forEach(function (el) {
        var key = el.getAttribute('data-school-bind');
        if (school[key] != null) el.textContent = school[key];
      });
      // SVG mockups: data-school-mock="<field>" → cùng kiểu
      document.querySelectorAll('[data-school-mock]').forEach(function (el) {
        var key = el.getAttribute('data-school-mock');
        if (school[key] != null) el.textContent = '🏫 ' + school[key];
      });
    }
    fillBindings();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fillBindings);
    }
  }

  // ── Render picker khi không có ?school= ──────────────────────────────────
  function renderPicker(registry) {
    var schools = (registry.schools || []).filter(function (s) { return s.active; });

    // Nhóm theo tỉnh
    var byTinh = {};
    schools.forEach(function (s) {
      var k = s.tinh || 'Khác';
      (byTinh[k] = byTinh[k] || []).push(s);
    });

    var groupsHtml = Object.keys(byTinh).sort().map(function (tinh) {
      var items = byTinh[tinh].map(function (s) {
        return '' +
          '<li class="hss-picker-item" data-code="' + s.code + '">' +
            '<div class="hss-picker-item-main">' +
              '<div class="hss-picker-item-name">' + s.shortName + '</div>' +
              '<div class="hss-picker-item-sub">Xã ' + s.xa + '</div>' +
            '</div>' +
            '<span class="hss-picker-item-arrow">→</span>' +
          '</li>';
      }).join('');
      return '<div class="hss-picker-group">' +
               '<div class="hss-picker-group-title">Tỉnh ' + tinh + ' (' + byTinh[tinh].length + ')</div>' +
               '<ul class="hss-picker-list">' + items + '</ul>' +
             '</div>';
    }).join('');

    document.body.innerHTML =
      '<div class="hss-picker-wrap">' +
        '<div class="hss-picker-card">' +
          '<h1 class="hss-picker-title">🏫 Hệ thống Hồ sơ số Tiểu học</h1>' +
          '<p class="hss-picker-sub">Chọn trường của bạn để vào hệ thống</p>' +
          '<input class="hss-picker-search" id="hssPickerSearch" placeholder="🔍 Tìm theo tên trường hoặc xã..." autofocus>' +
          '<div id="hssPickerGroups">' + groupsHtml + '</div>' +
          (schools.length === 0
            ? '<p class="hss-picker-empty">Chưa có trường nào trong registry. Liên hệ admin để thêm trường.</p>'
            : '') +
          '<div class="hss-picker-footer">v' + (registry.version || '1.0') +
            ' · cập nhật ' + (registry.updatedAt || '') + '</div>' +
        '</div>' +
      '</div>' +
      // styles inline để không phụ thuộc style.css
      '<style>' +
        ':root{--hss-pick-bg:#f8fafc;--hss-pick-card:#fff;--hss-pick-ink:#0f172a;--hss-pick-sub:#64748b;--hss-pick-brand:#1e3a8a;--hss-pick-line:#e2e8f0}' +
        'body{margin:0;font-family:"Be Vietnam Pro",system-ui,sans-serif;background:var(--hss-pick-bg);color:var(--hss-pick-ink)}' +
        '.hss-picker-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}' +
        '.hss-picker-card{max-width:520px;width:100%;background:var(--hss-pick-card);border-radius:16px;padding:32px;box-shadow:0 10px 40px rgba(15,23,42,.08)}' +
        '.hss-picker-title{font-size:22px;margin:0 0 6px;color:var(--hss-pick-brand)}' +
        '.hss-picker-sub{margin:0 0 20px;color:var(--hss-pick-sub);font-size:14px}' +
        '.hss-picker-search{width:100%;padding:12px 14px;border:1.5px solid var(--hss-pick-line);border-radius:10px;font-size:15px;box-sizing:border-box;font-family:inherit}' +
        '.hss-picker-search:focus{outline:none;border-color:var(--hss-pick-brand)}' +
        '.hss-picker-group{margin-top:20px}' +
        '.hss-picker-group-title{font-size:12px;text-transform:uppercase;letter-spacing:.5px;color:var(--hss-pick-sub);margin-bottom:8px;font-weight:600}' +
        '.hss-picker-list{list-style:none;padding:0;margin:0;border:1px solid var(--hss-pick-line);border-radius:12px;overflow:hidden}' +
        '.hss-picker-item{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;cursor:pointer;border-bottom:1px solid var(--hss-pick-line);transition:background .15s}' +
        '.hss-picker-item:last-child{border-bottom:none}' +
        '.hss-picker-item:hover{background:#f1f5f9}' +
        '.hss-picker-item-name{font-weight:600;font-size:15px}' +
        '.hss-picker-item-sub{font-size:13px;color:var(--hss-pick-sub);margin-top:2px}' +
        '.hss-picker-item-arrow{color:var(--hss-pick-brand);font-size:18px;font-weight:700}' +
        '.hss-picker-empty{padding:20px;text-align:center;color:var(--hss-pick-sub);font-style:italic}' +
        '.hss-picker-footer{margin-top:24px;text-align:center;font-size:12px;color:var(--hss-pick-sub)}' +
      '</style>';

    // Wire up
    document.querySelectorAll('.hss-picker-item').forEach(function (el) {
      el.addEventListener('click', function () {
        var code = el.getAttribute('data-code');
        location.search = '?school=' + code;
      });
    });

    var search = document.getElementById('hssPickerSearch');
    if (search) {
      search.addEventListener('input', function () {
        var q = search.value.trim().toLowerCase();
        document.querySelectorAll('.hss-picker-item').forEach(function (item) {
          var text = item.textContent.toLowerCase();
          item.style.display = (!q || text.indexOf(q) !== -1) ? '' : 'none';
        });
        // Ẩn group nếu tất cả item trong group đều ẩn
        document.querySelectorAll('.hss-picker-group').forEach(function (g) {
          var visible = g.querySelectorAll('.hss-picker-item:not([style*="display: none"])').length;
          g.style.display = visible ? '' : 'none';
        });
      });
    }
  }

  // ── Render error khi school không tồn tại ────────────────────────────────
  function renderError(code, registry) {
    var activeList = (registry.schools || []).filter(function (s) { return s.active; })
      .map(function (s) { return '<li><a href="?school=' + s.code + '">' + s.shortName + ' (Xã ' + s.xa + ')</a></li>'; })
      .join('');

    document.body.innerHTML =
      '<div style="max-width:520px;margin:80px auto;padding:32px;background:#fff;border-radius:16px;font-family:\'Be Vietnam Pro\',system-ui,sans-serif;color:#0f172a;box-shadow:0 10px 40px rgba(0,0,0,.08)">' +
        '<h1 style="color:#dc2626;margin:0 0 12px;font-size:22px">⚠️ Không tìm thấy trường "' + code + '"</h1>' +
        '<p style="color:#64748b">Mã trường này chưa có trong hệ thống. Vui lòng kiểm tra lại URL hoặc chọn trường khác:</p>' +
        '<ul style="line-height:1.8">' + activeList + '</ul>' +
        '<p style="margin-top:24px"><a href="?" style="color:#1e3a8a">← Quay lại trang chọn trường</a></p>' +
      '</div>';
  }

  // ── Render error khi apiUrl trống (trường có entry nhưng chưa deploy) ────
  function renderNeedDeploy(school) {
    document.body.innerHTML =
      '<div style="max-width:560px;margin:80px auto;padding:32px;background:#fff;border-radius:16px;font-family:\'Be Vietnam Pro\',system-ui,sans-serif;color:#0f172a;box-shadow:0 10px 40px rgba(0,0,0,.08)">' +
        '<h1 style="color:#d97706;margin:0 0 12px;font-size:22px">🚧 ' + school.name + ' chưa được kích hoạt</h1>' +
        '<p style="color:#64748b">Trường này đã có trong registry nhưng <b>Apps Script chưa được deploy</b>.</p>' +
        '<p style="color:#0f172a">Vui lòng:</p>' +
        '<ol style="line-height:1.8">' +
          '<li>Tạo Google Sheet mới</li>' +
          '<li>Mở Apps Script → paste <code>Code.gs</code> → Deploy → Web App</li>' +
          '<li>Copy URL <code>/exec</code></li>' +
          '<li>Mở <code>schools.json</code> → điền URL vào trường <code>apiUrl</code> của <code>' + school.code + '</code></li>' +
          '<li>Push GitHub → reload trang này</li>' +
        '</ol>' +
        '<p style="margin-top:24px"><a href="?" style="color:#1e3a8a">← Chọn trường khác</a></p>' +
      '</div>';
  }

  // ── MAIN ─────────────────────────────────────────────────────────────────
  function main() {
    var page = (document.documentElement.getAttribute('data-page')) ||
               (location.pathname.indexOf('qlcl') !== -1 ? 'qlcl' : 'hss');

    var code = getParam('school');
    if (!code) {
      try { code = localStorage.getItem(STORAGE_KEY) || ''; } catch (e) {}
    }

    fetchRegistry()
      .then(function (registry) {
        window.__REGISTRY__ = registry;

        if (!code) {
          renderPicker(registry);
          return;
        }

        var school = (registry.schools || []).find(function (s) {
          return s.code === code && s.active;
        });

        if (!school) {
          renderError(code, registry);
          return;
        }

        if (!school.apiUrl) {
          applySchool(school, page); // vẫn set title để admin biết trường nào
          renderNeedDeploy(school);
          return;
        }

        applySchool(school, page);

        // ⚡ Trigger early-fetch ngay khi biết apiUrl (rút ngắn loading)
        if (typeof window.__startEarlyFetch === 'function') {
          window.__startEarlyFetch(school.apiUrl);
        }

        // Bắn event để app.js / qlcl-app.js bắt đầu
        var ev = new CustomEvent('hss:school-ready', { detail: school });
        window.dispatchEvent(ev);

        // Backward-compat: nếu app.js có hàm loadMainApp() global thì gọi
        if (typeof window.loadMainApp === 'function') {
          try { window.loadMainApp(school); } catch (e) { console.error('loadMainApp error', e); }
        }
      })
      .catch(function (err) {
        document.body.innerHTML =
          '<div style="max-width:520px;margin:80px auto;padding:32px;background:#fee2e2;border-radius:12px;font-family:system-ui;color:#991b1b">' +
            '<h2>❌ Lỗi tải hệ thống</h2>' +
            '<p>Không tải được <code>schools.json</code>. Vui lòng kiểm tra mạng hoặc liên hệ admin.</p>' +
            '<pre style="background:#fff;padding:12px;border-radius:6px;overflow:auto">' + (err.message || err) + '</pre>' +
          '</div>';
        console.error('[boot.js] fatal:', err);
      });
  }

  // DOM sẵn sàng → chạy
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
  } else {
    main();
  }
})();
