/* Python 实算 · Pyodide 运行器（懒加载，浏览器内跑真实 Python + pandas + scipy） */
var PyRunner = (function () {
  var CDN = 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/';
  var pyodide = null, loading = null, ready = false;

  function loadScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = src; s.onload = res; s.onerror = function () { rej(new Error('CDN 加载失败：' + src)); };
      document.head.appendChild(s);
    });
  }

  /* 惰性初始化：只有用户点击「启动」才下载。
     策略：先只加载 Python 内核（约 10MB，~30s 即可用），pandas / scipy 后台按需加载 */
  var scipyReady = false, scipyLoading = null;
  var pandasReady = false, pandasLoading = null;
  function init(onStatus) {
    if (ready) return Promise.resolve();
    if (loading) return loading;
    loading = new Promise(function (resolve, reject) {
      onStatus && onStatus('正在下载 Python 运行时（约 10MB）…', 10);
      loadScript(CDN + 'pyodide.js').then(function () {
        if (typeof loadPyodide !== 'function') throw new Error('Pyodide 未正确加载');
        onStatus && onStatus('正在启动 Python 内核…', 45);
        return loadPyodide({ indexURL: CDN });
      }).then(function (py) {
        pyodide = py;
        ready = true;
        onStatus && onStatus('Python 内核已就绪（基础题可直接练）', 100);
        resolve();
        /* 后台静默预加载数据科学包，失败不影响基础题 */
        ensurePandas().then(function () { return ensureScipy(); }).then(function () {}, function () {});
      }).catch(function (e) { loading = null; reject(e); });
    });
    return loading;
  }

  /* 给包加载加超时：避免网络/浏览器较慢时无限转圈（真实浏览器通常 1-2 分钟） */
  function withTimeout(promise, ms, label) {
    return new Promise(function (resolve, reject) {
      var done = false;
      var tm = setTimeout(function () {
        if (done) return;
        done = true;
        reject(new Error(label + ' 加载超时（超过 ' + Math.round(ms / 1000) + ' 秒）。可能是网络较慢或浏览器在解压大文件。\n可以先练「纯 Python」题（不需要任何包），稍后重试。'));
      }, ms);
      promise.then(function (v) { if (!done) { done = true; clearTimeout(tm); resolve(v); } },
                   function (e) { if (!done) { done = true; clearTimeout(tm); reject(e); } });
    });
  }

  /* pandas 按需/后台加载 */
  function ensurePandas(onStatus) {
    if (pandasReady) return Promise.resolve();
    if (pandasLoading) return pandasLoading;
    pandasLoading = new Promise(function (resolve, reject) {
      if (!pyodide) { reject(new Error('Python 环境未启动')); return; }
      onStatus && onStatus('正在加载 pandas（约 23MB + 依赖 numpy/dateutil/pytz）…');
      /* 先把数据集 SQL 注入 Python 全局，再加载 pandas 并导入数据
         注意：不要传 errorCallback（会让 loadPackage 的 promise 不再 reject，掩盖错误） */
      primeDataset().then(function () {
        return withTimeout(pyodide.loadPackage('pandas'), 300000, 'pandas');
      }).then(function () {
        /* 导入数据集，供 pandas 题目使用 */
        return pyodide.runPythonAsync([
          'import sqlite3, pandas as pd',
          'con = sqlite3.connect(":memory:")',
          'con.executescript(DATASET_SQL)',
          'users = pd.read_sql_query("SELECT * FROM users", con)',
          'events = pd.read_sql_query("SELECT * FROM events", con)',
          'orders = pd.read_sql_query("SELECT * FROM orders", con)',
          'channels = pd.read_sql_query("SELECT * FROM channels", con)',
          'print("数据集已就绪:", len(users), "用户 /", len(events), "行为 /", len(orders), "订单")'
        ].join('\n'));
      }).then(function () {
        pandasReady = true;
        onStatus && onStatus('pandas 与数据集已就绪');
        resolve();
      }).catch(function (e) { pandasLoading = null; reject(e); });
    });
    return pandasLoading;
  }

  /* scipy 按需/后台加载 */
  function ensureScipy(onStatus) {
    if (scipyReady) return Promise.resolve();
    if (scipyLoading) return scipyLoading;
    scipyLoading = new Promise(function (resolve, reject) {
      if (!pyodide) { reject(new Error('Python 环境未启动')); return; }
      onStatus && onStatus('正在加载 scipy（约 30MB，仅统计检验题需要）…');
      withTimeout(pyodide.loadPackage('scipy'), 300000, 'scipy').then(function () {
        scipyReady = true;
        onStatus && onStatus('scipy 就绪');
        resolve();
      }).catch(function (e) { scipyLoading = null; reject(e); });
    });
    return scipyLoading;
  }

  /* 按任务声明准备依赖 */
  function ensureDeps(needs, onStatus) {
    var list = needs || [];
    if (typeof list === 'string') list = [list];
    var chain = Promise.resolve();
    if (list.indexOf('pandas') >= 0) chain = chain.then(function () { return ensurePandas(onStatus); });
    if (list.indexOf('scipy') >= 0) chain = chain.then(function () { return ensureScipy(onStatus); });
    return chain;
  }

  /* DATASET_SQL 需要在 pandas 加载前注入（必须始终返回 Promise） */
  function primeDataset() {
    if (typeof DATASET_SQL !== 'undefined') {
      try { pyodide.globals.set('DATASET_SQL', DATASET_SQL); } catch (e) {}
      return Promise.resolve();
    }
    return loadScript('data/dataset.js?v=2').then(function () {
      if (typeof DATASET_SQL === 'undefined') throw new Error('数据集文件未加载');
      pyodide.globals.set('DATASET_SQL', DATASET_SQL);
    });
  }

  function isReady() { return ready; }
  function isScipyReady() { return scipyReady; }
  function isPandasReady() { return pandasReady; }

  /* 执行代码并取 check 表达式的结果 */
  function run(code, checkExpr) {
    if (!ready) return Promise.reject(new Error('Python 环境未启动'));
    var py = [
      'import json, io, sys, traceback',
      '__buf = io.StringIO()',
      '__old = sys.stdout',
      '__res = {"ok": False, "val": None, "err": None, "out": ""}',
      'try:',
      '    sys.stdout = __buf',
      '    exec(compile(' + JSON.stringify(code) + ', "<user>", "exec"), globals())',
      '    __v = eval(compile(' + JSON.stringify(checkExpr) + ', "<check>", "eval"), globals())',
      '    sys.stdout = __old',
      '    __res["ok"] = True',
      '    __res["val"] = json.dumps(__v, ensure_ascii=False, default=str)',
      'except Exception:',
      '    sys.stdout = __old',
      '    __res["err"] = traceback.format_exc(limit=4)',
      '__res["out"] = __buf.getvalue()',
      'json.dumps(__res)'
    ].join('\n');
    return pyodide.runPythonAsync(py).then(function (s) { return JSON.parse(s); });
  }

  /* 结果比对：数值用相对容差，字符串严格比对 */
  function compare(userValStr, refValStr) {
    if (userValStr === null || userValStr === undefined) return { ok: false, reason: '没有取到结果值' };
    var u = userValStr, r = refValStr;
    var un = Number(u), rn = Number(r);
    var uIsNum = u !== '' && !isNaN(un), rIsNum = r !== '' && !isNaN(rn);
    if (uIsNum && rIsNum) {
      var tol = Math.max(1e-6, Math.abs(rn) * 1e-3);
      if (Math.abs(un - rn) <= tol) return { ok: true, reason: '结果一致' };
      return { ok: false, reason: '数值不一致：你得到 ' + u + '，参考答案 ' + r };
    }
    if (String(u).trim() === String(r).trim()) return { ok: true, reason: '结果一致' };
    return { ok: false, reason: '结果不一致：你得到 ' + u + '，参考答案 ' + r };
  }

  /* 自检：跑通全部参考解（部署验证用） */
  function selfTest(tasks) {
    return init(function () {}).then(function () {
      var out = [];
      var chain = Promise.resolve();
      tasks.forEach(function (t) {
        chain = chain.then(function () {
          return ensureDeps(t.needs, function () {}).then(function () { return run(t.sol, t.check); }).then(function (r) {
            out.push({ id: t.id, ok: !!(r.ok && r.val !== null), val: r.val, err: r.err || '' });
          }).catch(function (e) {
            out.push({ id: t.id, ok: false, val: null, err: String(e.message || e) });
          });
        });
      });
      return chain.then(function () { return out; });
    });
  }

  return { init: init, isReady: isReady, isScipyReady: isScipyReady, isPandasReady: isPandasReady,
           ensurePandas: ensurePandas, ensureScipy: ensureScipy, ensureDeps: ensureDeps,
           run: run, compare: compare, selfTest: selfTest };
})();
