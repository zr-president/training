/* 进度管理：localStorage 持久化（同源下可与个人网站共享数据） */
var TP = (function () {
  var KEY = 'tp_progress_v1';

  function blank() {
    return { q: {}, lab: {}, runs: 0, updated: null };
  }
  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY)) || {};
      if (!s.q) s.q = {};
      if (!s.lab) s.lab = {};
      return s;
    } catch (e) { return blank(); }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

  var state = load();

  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  return {
    /* ---------- SQL 训练场 ---------- */
    mark: function (qid, ok) {
      var rec = state.q[qid] || { tries: 0, ok: false, firstTry: null, ts: null };
      rec.tries += 1;
      if (ok && rec.firstTry === null) rec.firstTry = (rec.tries === 1);
      if (ok) rec.ok = true;
      rec.ts = today();
      state.q[qid] = rec;
      state.runs = (state.runs || 0) + 1;
      state.updated = today();
      save();
      return rec;
    },
    get: function (qid) { return state.q[qid] || null; },
    isDone: function (qid) { var r = state.q[qid]; return !!(r && r.ok); },
    isWrong: function (qid) { var r = state.q[qid]; return !!(r && !r.ok && r.tries > 0); },

    stats: function (total) {
      var done = 0, firstTry = 0, tries = 0;
      for (var k in state.q) {
        var r = state.q[k];
        tries += r.tries || 0;
        if (r.ok) { done++; if (r.firstTry) firstTry++; }
      }
      return {
        done: done, total: total || 0,
        pct: total ? Math.round(done / total * 100) : 0,
        firstTry: firstTry,
        mastery: done ? Math.round(firstTry / done * 100) : 0,
        tries: tries,
        runs: state.runs || 0,
        updated: state.updated
      };
    },
    wrongList: function () {
      var out = [];
      for (var k in state.q) { var r = state.q[k]; if (!r.ok && (r.tries || 0) > 0) out.push(k); }
      return out;
    },

    /* ---------- 数据集实验室 ---------- */
    markLab: function (id, done, note) {
      var rec = state.lab[id] || { done: false, ts: null, note: '' };
      rec.done = !!done;
      if (typeof note === 'string') rec.note = note;
      rec.ts = today();
      state.lab[id] = rec;
      state.updated = today();
      save();
      return rec;
    },
    labNote: function (id) { var r = state.lab[id]; return (r && r.note) || ''; },
    isLabDone: function (id) { var r = state.lab[id]; return !!(r && r.done); },
    labStats: function (total) {
      var done = 0;
      for (var k in state.lab) if (state.lab[k].done) done++;
      return { done: done, total: total || 0, pct: total ? Math.round(done / total * 100) : 0 };
    },
    labList: function () {
      var out = [];
      for (var k in state.lab) if (state.lab[k].done) out.push(k);
      return out;
    },

    reset: function () { state = blank(); save(); },
    raw: function () { return state; }
  };
})();
