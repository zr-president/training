/* 数据集浏览器 · 在线预览字段与数据（无需下载） */
var DataModule = (function () {
  var curTable = null, page = 1, pageSize = 20, engineReady = false;

  function esc(s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function toast(m) {
    var t = document.getElementById('toast'); if (!t) return;
    t.textContent = m; t.classList.add('show');
    clearTimeout(t._tm); t._tm = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }

  function tableList() {
    var h = '';
    (DATASET_SCHEMA || []).forEach(function (t) {
      h += '<div class="ti' + (curTable === t.table ? ' on' : '') + '" data-t="' + t.table + '">' +
           '<b>' + esc(t.table) + '</b><span>' + t.rows + ' 行</span></div>';
    });
    return h;
  }

  function schemaHTML(t) {
    var h = '<table class="schema"><thead><tr><th>字段</th><th>类型</th><th>键</th><th>说明</th></tr></thead><tbody>';
    t.fields.forEach(function (f) {
      var keys = '';
      if (f.key.indexOf('PRIMARY') >= 0) keys += '<span class="pill pk">主键</span>';
      if (f.key.indexOf('FOREIGN') >= 0) keys += '<span class="pill fk">外键</span>';
      h += '<tr><td class="f">' + esc(f.name) + '</td><td class="t">' + esc(f.type) + '</td>' +
           '<td>' + (keys || '<span style="color:var(--text3)">—</span>') + '</td>' +
           '<td>' + esc(f.desc) + '</td></tr>';
    });
    h += '</tbody></table>';
    return h;
  }

  function renderData() {
    var box = document.getElementById('dsData');
    if (!box) return;
    if (!engineReady) { box.innerHTML = '<div class="loading"><span class="spin"></span>正在加载数据…</div>'; return; }
    var t = null;
    (DATASET_SCHEMA || []).forEach(function (x) { if (x.table === curTable) t = x; });
    if (!t) return;

    var offset = (page - 1) * pageSize;
    var res, total = t.rows;
    try {
      res = SQLRunner.run('SELECT * FROM ' + curTable + ' LIMIT ' + pageSize + ' OFFSET ' + offset);
    } catch (e) {
      box.innerHTML = '<div class="verdict err">读取失败：' + esc(e.message || e) + '</div>'; return;
    }

    var h = '<div class="tblwrap" style="max-height:460px"><table class="dg"><thead><tr><th style="color:var(--text3)">#</th>';
    res.cols.forEach(function (c) { h += '<th>' + esc(c) + '</th>'; });
    h += '</tr></thead><tbody>';
    res.rows.forEach(function (r, i) {
      h += '<tr><td style="color:var(--text3)">' + (offset + i + 1) + '</td>';
      r.forEach(function (v) {
        if (v === null) h += '<td class="nullv">NULL</td>';
        else if (typeof v === 'number') h += '<td>' + (Number.isInteger(v) ? v : (Math.round(v * 1000) / 1000)) + '</td>';
        else h += '<td>' + esc(v) + '</td>';
      });
      h += '</tr>';
    });
    h += '</tbody></table></div>';

    var totalPages = Math.max(1, Math.ceil(total / pageSize));
    h += '<div class="pager">' +
         '<button data-pg="1" ' + (page <= 1 ? 'disabled' : '') + '>« 首页</button>' +
         '<button data-pg="' + (page - 1) + '" ' + (page <= 1 ? 'disabled' : '') + '>‹ 上一页</button>' +
         '<span>第 <b style="color:var(--accent);font-family:var(--mono)">' + page + '</b> / ' + totalPages + ' 页　共 ' + total + ' 行</span>' +
         '<button data-pg="' + (page + 1) + '" ' + (page >= totalPages ? 'disabled' : '') + '>下一页 ›</button>' +
         '<button data-pg="' + totalPages + '" ' + (page >= totalPages ? 'disabled' : '') + '>末页 »</button>' +
         '<span style="margin-left:auto">每页</span>' +
         '<button data-ps="20" ' + (pageSize === 20 ? 'style="border-color:var(--accent);color:var(--accent)"' : '') + '>20</button>' +
         '<button data-ps="50" ' + (pageSize === 50 ? 'style="border-color:var(--accent);color:var(--accent)"' : '') + '>50</button>' +
         '<button data-ps="100" ' + (pageSize === 100 ? 'style="border-color:var(--accent);color:var(--accent)"' : '') + '>100</button>' +
         '</div>';
    box.innerHTML = h;

    Array.prototype.forEach.call(box.querySelectorAll('[data-pg]'), function (b) {
      b.onclick = function () { page = +b.getAttribute('data-pg'); renderData(); };
    });
    Array.prototype.forEach.call(box.querySelectorAll('[data-ps]'), function (b) {
      b.onclick = function () { pageSize = +b.getAttribute('data-ps'); page = 1; renderData(); };
    });
  }

  function render() {
    var t = null;
    (DATASET_SCHEMA || []).forEach(function (x) { if (x.table === curTable) t = x; });
    var host = document.getElementById('dsMain');
    if (!host || !t) return;

    host.innerHTML =
      '<div class="pane rise">' +
        '<div class="qtitle"><span class="badge hot">' + esc(curTable) + '</span><span>' + esc(t.desc) + '</span>' +
          '<span class="muted" style="margin-left:auto;font-family:var(--mono)">' + t.rows + ' 行 · 主键 ' + esc(t.pk) + '</span></div>' +
        '<div class="sec-t" style="margin-top:12px">📋 字段结构（在线看，无需下载）</div>' +
        schemaHTML(t) +
        '<div class="sec-t">🔎 快速查询（可直接改 SQL 探索）</div>' +
        '<div class="qbar"><input id="dsQ" value="SELECT * FROM ' + curTable + ' LIMIT 20" spellcheck="false"></div>' +
        '<div class="row"><button class="btn primary" id="dsRun">▶ 运行</button>' +
          '<button class="btn" id="dsCsv">⬇ 导出 CSV</button>' +
          '<span class="muted" id="dsInfo"></span></div>' +
        '<div id="dsQueryOut" style="margin-top:10px"></div>' +
        '<div class="sec-t" style="margin-top:16px">🗂️ 数据预览（分页）</div>' +
        '<div id="dsData"></div>' +
      '</div>';

    renderData();

    document.getElementById('dsRun').onclick = function () {
      var sql = document.getElementById('dsQ').value.trim();
      var out = document.getElementById('dsQueryOut');
      var info = document.getElementById('dsInfo');
      if (!sql) return;
      var t0 = performance.now();
      try {
        var r = SQLRunner.run(sql);
        var ms = Math.round(performance.now() - t0);
        var h = '<div class="tblwrap"><table class="dg"><thead><tr>';
        r.cols.forEach(function (c) { h += '<th>' + esc(c) + '</th>'; });
        h += '</tr></thead><tbody>';
        r.rows.slice(0, 200).forEach(function (row) {
          h += '<tr>';
          row.forEach(function (v) {
            if (v === null) h += '<td class="nullv">NULL</td>';
            else if (typeof v === 'number') h += '<td>' + (Number.isInteger(v) ? v : (Math.round(v * 1000) / 1000)) + '</td>';
            else h += '<td>' + esc(v) + '</td>';
          });
          h += '</tr>';
        });
        h += '</tbody></table></div><div class="muted" style="margin-top:6px">共 ' + r.rows.length + ' 行（最多展示 200 行）· ' + ms + 'ms</div>';
        out.innerHTML = h;
        info.textContent = '';
      } catch (e) {
        out.innerHTML = '<div class="verdict err"><b>SQL 报错：</b>' + esc(e.message || e) + '</div>';
      }
    };
    document.getElementById('dsCsv').onclick = function () { exportCSV(curTable); };
  }

  function exportCSV(table) {
    try {
      var r = SQLRunner.run('SELECT * FROM ' + table);
      var lines = [r.cols.join(',')];
      r.rows.forEach(function (row) {
        lines.push(row.map(function (v) {
          if (v === null) return '';
          var s = String(v);
          return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
        }).join(','));
      });
      var blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = table + '.csv';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      toast('已导出 ' + table + '.csv');
    } catch (e) { toast('导出失败：' + (e.message || e)); }
  }

  function mount(host) {
    curTable = (DATASET_SCHEMA && DATASET_SCHEMA[0]) ? DATASET_SCHEMA[0].table : 'users';
    page = 1;

    host.innerHTML =
      '<div class="h1"><span class="grad">数据集</span> · 增长实验室</div>' +
      '<div class="sub">在线查看字段结构与数据（无需下载）· 支持快速 SQL 查询与分页浏览 · 需要时可导出 CSV 到本地用 Python/Excel 练</div>' +
      '<div class="card" style="margin-bottom:14px;padding:12px 15px;font-size:12px;color:var(--text2);line-height:1.8">' +
        '💡 ' + esc((typeof DATASET_META !== 'undefined' && DATASET_META.note) ? DATASET_META.note : '') +
      '</div>' +
      '<div id="dsEngine" class="loading"><span class="spin"></span>正在加载数据集…</div>' +
      '<div class="ds-lay" id="dsLay" style="display:none">' +
        '<div><div class="sec-t" style="margin-top:0">数据表</div><div class="ds-nav" id="dsNav">' + tableList() + '</div></div>' +
        '<div id="dsMain"></div>' +
      '</div>';

    Array.prototype.forEach.call(host.querySelectorAll('.ds-nav .ti'), function (el) {
      el.onclick = function () {
        curTable = el.getAttribute('data-t'); page = 1;
        Array.prototype.forEach.call(host.querySelectorAll('.ds-nav .ti'), function (x) { x.classList.toggle('on', x === el); });
        render();
      };
    });

    SQLRunner.init(function (msg) {
      var st = document.getElementById('dsEngine');
      if (st && msg) st.innerHTML = '<span class="spin"></span>' + esc(msg);
    }).then(function () {
      engineReady = true;
      var st = document.getElementById('dsEngine'); if (st) st.style.display = 'none';
      var lay = document.getElementById('dsLay'); if (lay) lay.style.display = '';
      render();
    }).catch(function (e) {
      var st = document.getElementById('dsEngine');
      if (st) st.innerHTML = '<div class="verdict err"><b>数据集加载失败：</b>' + esc(e.message || e) + '</div>';
    });
  }

  function onShow() { if (engineReady) renderData(); }

  return { mount: mount, onShow: onShow };
})();
