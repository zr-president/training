/* 进度管理：localStorage 持久化（同源下可与个人网站共享数据） */
var TP = (function () {
  var KEY = 'tp_progress_v1';

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }
  function save(p) {
    try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) {}
  }
  function blank() {
    return { q: {}, runs: 0, updated: null };
  }

  var state = load();
  if (!state.q) state = blank();

  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  return {
    /* 记录一次作答：ok=是否通过 */
    mark: function (qid, ok) {
      var rec = state.q[qid] || { tries: 0, ok: false, firstTry: null, ts: null };
      rec.tries += 1;
      if (ok && rec.firstTry === null) rec.firstTry = (rec.tries === 1);
      if (ok) rec.ok = true;
      rec.ts = today();
      state.q[qid] = rec;
      state.runs = (state.runs || 0) + 1;
      state.updated = today();
      save(state);
      return rec;
    },
    /* 单题状态 */
    get: function (qid) { return state.q[qid] || null; },
    isDone: function (qid) { var r = state.q[qid]; return !!(r && r.ok); },
    isWrong: function (qid) { var r = state.q[qid]; return !!(r && !r.ok && r.tries > 0); },

    /* 总览统计 */
    stats: function (total) {
      var done = 0, firstTry = 0, tries = 0, wrong = [];
      for (var k in state.q) {
        var r = state.q[k];
        tries += r.tries || 0;
        if (r.ok) { done++; if (r.firstTry) firstTry++; }
        else if ((r.tries || 0) > 0) wrong.push(k);
      }
      return {
        done: done,
        total: total || 0,
        pct: total ? Math.round(done / total * 100) : 0,
        firstTry: firstTry,
        /* 一次做对率 = 真实掌握度（比"做完比例"更真实） */
        mastery: done ? Math.round(firstTry / done * 100) : 0,
        tries: tries,
        wrong: wrong,
        runs: state.runs || 0,
        updated: state.updated
      };
    },
    wrongList: function () {
      var out = [];
      for (var k in state.q) { var r = state.q[k]; if (!r.ok && (r.tries || 0) > 0) out.push(k); }
      return out;
    },
    reset: function () { state = blank(); save(state); },
    raw: function () { return state; }
  };
})();
