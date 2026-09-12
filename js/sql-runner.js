/* SQL 执行引擎：懒加载 sql.js（浏览器内跑真实 SQLite）+ 结果集自动判分 */
var SQLRunner = (function () {
  var CDN = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.2/';
  var SQL = null, db = null, loading = null, ready = false;

  function loadScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = src; s.onload = res; s.onerror = function () { rej(new Error('CDN 加载失败: ' + src)); };
      document.head.appendChild(s);
    });
  }

  /* 懒加载：只有进入 SQL 模块才下载 sql.js 与数据集 */
  function init(onStatus) {
    if (ready) return Promise.resolve();
    if (loading) return loading;
    loading = new Promise(function (resolve, reject) {
      if (onStatus) onStatus('正在加载 SQL 引擎 (sql.js ~1.5MB)…');
      loadScript(CDN + 'sql-wasm.js').then(function () {
        if (typeof initSqlJs !== 'function') throw new Error('sql.js 未正确加载');
        if (onStatus) onStatus('正在初始化数据库…');
        return initSqlJs({ locateFile: function (f) { return CDN + f; } });
      }).then(function (mod) {
        SQL = mod;
        if (typeof DATASET_SQL === 'undefined') {
          if (onStatus) onStatus('正在加载用户增长数据集…');
          return loadScript('data/dataset.js?v=1').then(function () {
            if (typeof DATASET_SQL === 'undefined') throw new Error('数据集文件缺失 data/dataset.js');
          });
        }
      }).then(function () {
        if (onStatus) onStatus('正在导入数据（620 用户 / 5512 行为 / 148 订单）…');
        db = new SQL.Database();
        db.run(DATASET_SQL);
        ready = true;
        if (onStatus) onStatus('');
        resolve();
      }).catch(function (e) { loading = null; reject(e); });
    });
    return loading;
  }

  function isReady() { return ready; }

  /* 执行 SQL，返回最后一个有结果集的结果 {cols, rows}；多语句只取最后一个结果集 */
  function run(sql) {
    if (!ready) throw new Error('引擎未就绪');
    if (!sql || !sql.trim()) throw new Error('SQL 为空');
    var res = db.exec(sql);
    if (!res || !res.length) return { cols: [], rows: [], noResult: true };
    var last = res[res.length - 1];
    return { cols: last.columns || [], rows: last.values || [] };
  }

  /* ---------- 判分 ---------- */
  function norm(v, digits) {
    if (v === null || v === undefined) return '∅NULL';
    if (typeof v === 'number') {
      var r = Math.round(v * Math.pow(10, digits)) / Math.pow(10, digits);
      return 'n:' + r;
    }
    if (typeof v === 'string') {
      var t = v.trim();
      /* 数字型字符串按数字比，避免 '3' vs 3 误判 */
      if (t !== '' && !isNaN(Number(t)) && /^-?\d+(\.\d+)?$/.test(t)) {
        var n = Number(t);
        return 'n:' + (Math.round(n * Math.pow(10, digits)) / Math.pow(10, digits));
      }
      return 's:' + t;
    }
    return 'x:' + String(v);
  }
  function rowKey(row, digits) {
    var a = [];
    for (var i = 0; i < row.length; i++) a.push(norm(row[i], digits));
    return a.join('|');
  }

  /* 对比用户结果与参考解结果 */
  function compare(mine, ref, orderSensitive) {
    if (mine.noResult) return { ok: false, reason: '没有返回结果集——请确认写的是 SELECT 查询（能查出数据），而不是只有建表/插入语句。' };
    var mc = mine.cols.length, rc = ref.cols.length;
    if (mc === 0) return { ok: false, reason: '查询没有返回任何列，请检查语句。' };
    if (mc !== rc) {
      return { ok: false, reason: '列数不一致：你返回了 ' + mc + ' 列，参考答案需要 ' + rc + ' 列（' + ref.cols.join(' / ') + '）。' };
    }
    if (mine.rows.length !== ref.rows.length) {
      return { ok: false, reason: '行数不一致：你返回了 ' + mine.rows.length + ' 行，正确答案是 ' + ref.rows.length + ' 行。' };
    }
    var digits = 3, i, j;
    if (orderSensitive) {
      for (i = 0; i < ref.rows.length; i++) {
        if (rowKey(mine.rows[i], digits) !== rowKey(ref.rows[i], digits)) {
          return { ok: false, reason: '第 ' + (i + 1) + ' 行结果不对（本题要求按指定顺序排序，请检查 ORDER BY）。' };
        }
      }
    } else {
      var m = mine.rows.map(function (r) { return rowKey(r, digits); }).sort();
      var f = ref.rows.map(function (r) { return rowKey(r, digits); }).sort();
      for (i = 0; i < f.length; i++) {
        if (m[i] !== f[i]) return { ok: false, reason: '结果集内容不一致（行数对但数据不对，可能有分组/过滤条件遗漏）。' };
      }
    }
    return { ok: true, reason: '完全正确' };
  }

  /* 取若干行样本（数据集浏览用） */
  function preview(table, limit) {
    var r = run('SELECT * FROM ' + table + ' LIMIT ' + (limit || 8));
    return r;
  }

  /* 自检：跑通全部参考解（用于部署验证） */
  function selfTest(questions) {
    var out = [];
    for (var i = 0; i < questions.length; i++) {
      var q = questions[i];
      try {
        var r = run(q.solution);
        out.push({ id: q.id, ok: !r.noResult && r.rows.length > 0, rows: r.rows.length, cols: r.cols.length,
                   err: r.rows.length === 0 ? '参考解返回 0 行' : '' });
      } catch (e) {
        out.push({ id: q.id, ok: false, rows: 0, cols: 0, err: String(e.message || e) });
      }
    }
    return out;
  }

  /* 自检：数据集实验室的全部参考 SQL */
  function selfTestLab(labQuestions) {
    var out = [];
    for (var i = 0; i < labQuestions.length; i++) {
      var item = labQuestions[i];
      for (var j = 0; j < item.queries.length; j++) {
        var id = item.id + '-' + (j + 1);
        try {
          var r = run(item.queries[j].sql);
          out.push({ id: id, ok: !r.noResult && r.rows.length > 0, rows: r.rows.length, cols: r.cols.length,
                     err: r.rows.length === 0 ? '参考 SQL 返回 0 行' : '' });
        } catch (e) {
          out.push({ id: id, ok: false, rows: 0, cols: 0, err: String(e.message || e) });
        }
      }
    }
    return out;
  }

  return { init: init, isReady: isReady, run: run, compare: compare, preview: preview,
           selfTest: selfTest, selfTestLab: selfTestLab, norm: norm };
})();
