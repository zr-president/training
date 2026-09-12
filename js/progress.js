/* 进度管理：localStorage 持久化（同源下可与个人网站共享数据） */
var TP = (function () {
  var KEY = 'tp_progress_v1';

  function blank() {
    return { q: {}, lab: {}, quiz: {}, runs: 0, updated: null };
  }
  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY)) || {};
      if (!s.q) s.q = {};
      if (!s.lab) s.lab = {};
      if (!s.quiz) s.quiz = {};
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
    raw: function () { return state; },

    /* ---------- 通用答题模块（指标设计工坊 / 实验分析训练） ---------- */
    /* ns = 命名空间，如 'metrics' / 'abtest' */
    markQuiz: function (ns, id, ok, score, disqualifyFirstTry) {
      if (!state.quiz[ns]) state.quiz[ns] = {};
      var rec = state.quiz[ns][id] || { tries: 0, ok: false, best: 0, firstTry: null, ts: null };
      rec.tries += 1;
      if (ok && rec.firstTry === null) rec.firstTry = (rec.tries === 1 && !disqualifyFirstTry);
      if (ok && disqualifyFirstTry && rec.firstTry === null) rec.firstTry = false;
      if (ok) rec.ok = true;
      if (typeof score === 'number' && score > (rec.best || 0)) rec.best = score;
      rec.ts = today();
      state.quiz[ns][id] = rec;
      state.updated = today();
      save();
      return rec;
    },
    quizGet: function (ns, id) {
      return (state.quiz[ns] && state.quiz[ns][id]) || null;
    },
    isQuizDone: function (ns, id) {
      var r = state.quiz[ns] && state.quiz[ns][id];
      return !!(r && r.ok);
    },
    quizStats: function (ns, total) {
      var bucket = state.quiz[ns] || {};
      var done = 0, firstTry = 0, tries = 0;
      for (var k in bucket) {
        var r = bucket[k];
        tries += r.tries || 0;
        if (r.ok) { done++; if (r.firstTry) firstTry++; }
      }
      return {
        done: done, total: total || 0,
        pct: total ? Math.round(done / total * 100) : 0,
        mastery: done ? Math.round(firstTry / done * 100) : 0,
        tries: tries
      };
    },
    /* 开放题（北极星指标/案例拆解）草稿与标记 */
    setNote: function (ns, id, text) {
      var k = ns + '::' + id;
      try { localStorage.setItem('tp_note_' + k, text); } catch (e) {}
    },
    getNote: function (ns, id) {
      try { return localStorage.getItem('tp_note_' + ns + '::' + id) || ''; } catch (e) { return ''; }
    },
    markOpen: function (ns, id, done) {
      var k = ns + '::done::' + id;
      try { localStorage.setItem('tp_note_' + k, done ? '1' : ''); } catch (e) {}
      state.updated = today(); save();
    },
    isOpenDone: function (ns, id) {
      try { return localStorage.getItem('tp_note_' + ns + '::done::' + id) === '1'; } catch (e) { return false; }
    },

    /* ---------- 导出进度摘要（供同源的个人网站读取，键名 tp_summary_v1） ---------- */
    exportSummary: function () {
      try {
        function has(n) { return typeof window[n] !== 'undefined' || (typeof eval('typeof ' + n) === 'string' && eval('typeof ' + n) !== 'undefined'); }
        var out = { updated: today(), v: 1, mods: {}, done: 0, total: 0 };

        function add(key, name, done, total, extra) {
          out.mods[key] = { name: name, done: done, total: total, pct: total ? Math.round(done / total * 100) : 0 };
          if (extra) out.mods[key].extra = extra;
          out.done += done; out.total += total;
        }

        /* SQL 训练场 */
        try {
          var SQ = (typeof SQL_QUESTIONS !== 'undefined') ? SQL_QUESTIONS : null;
          if (SQ) { var st = this.stats(SQ.length); add('sql', 'SQL 训练场', st.done, st.total, { mastery: st.mastery, runs: st.runs }); }
        } catch (e) {}
        /* 数据集实验室 */
        try {
          var LQ = (typeof LAB_QUESTIONS !== 'undefined') ? LAB_QUESTIONS : null;
          if (LQ) { var ls = this.labStats(LQ.length); add('lab', '数据集实验室', ls.done, ls.total); }
        } catch (e) {}
        /* 指标设计 */
        try {
          var MQ = (typeof METRICS_QUIZZES !== 'undefined') ? METRICS_QUIZZES : null;
          if (MQ) { var ms = this.quizStats('metrics', MQ.length); add('metrics', '指标设计工坊', ms.done, ms.total); }
        } catch (e) {}
        /* 实验分析 */
        try {
          var AQ = (typeof ABTEST_QUIZZES !== 'undefined') ? ABTEST_QUIZZES : null;
          if (AQ) { var as = this.quizStats('abtest', AQ.length); add('abtest', '实验分析训练', as.done, as.total); }
        } catch (e) {}
        /* Case 拆解 */
        try {
          var CQ = (typeof CASE_QUESTIONS !== 'undefined') ? CASE_QUESTIONS : null;
          if (CQ) { var cd = 0; for (var i = 0; i < CQ.length; i++) if (this.isOpenDone('case', CQ[i].id)) cd++; add('case', 'Case 拆解训练', cd, CQ.length); }
        } catch (e) {}
        /* AI Agent */
        try {
          if (typeof AGENT_CONTENT !== 'undefined') {
            var ad = 0, atot = 1 + AGENT_CONTENT.designs.length + AGENT_CONTENT.tasks.length;
            var su = this.quizGet('agent', AGENT_CONTENT.suitability.id); if (su && su.ok) ad++;
            for (var j = 0; j < AGENT_CONTENT.designs.length; j++) if (this.isQuizDone('agent', AGENT_CONTENT.designs[j].id)) ad++;
            for (var k = 0; k < AGENT_CONTENT.tasks.length; k++) if (this.isOpenDone('agent', AGENT_CONTENT.tasks[k].id)) ad++;
            add('agent', 'AI Agent 实操', ad, atot);
          }
        } catch (e) {}
        /* 30 天训练计划 */
        try {
          if (typeof PLAN_DAYS !== 'undefined') {
            var pdDone = 0, pdTot = 0, di, ti;
            for (di = 0; di < PLAN_DAYS.length; di++) {
              var pd = PLAN_DAYS[di];
              for (ti = 0; ti < pd.tasks.length; ti++) {
                pdTot++;
                if (this.isOpenDone('plan', 'd' + pd.day + '::' + ti)) pdDone++;
              }
            }
            add('plan', '30 天训练计划', pdDone, pdTot);
          }
        } catch (e) {}
        /* Python 数据分析案例（案例已学 + 练习已完成） */
        try {
          var PC = (typeof PY_CASES !== 'undefined') ? PY_CASES : null;
          var PT = (typeof PY_TASKS !== 'undefined') ? PY_TASKS : null;
          if (PC) {
            var pdone = 0, ptot = PC.length, pi, pj;
            for (pi = 0; pi < PC.length; pi++) if (this.isOpenDone('pycase', PC[pi].id)) pdone++;
            if (PT) { for (pj = 0; pj < PT.length; pj++) { ptot++; if (this.isOpenDone('pycase', 'task_' + PT[pj].id)) pdone++; } }
            add('python', 'Python 数据分析案例', pdone, ptot);
          }
        } catch (e) {}
        /* AI 产品经理（判读题 + PRD 工坊） */
        try {
          if (typeof AIPM_QUIZZES !== 'undefined') {
            var pq = this.quizStats('aipm', AIPM_QUIZZES.length);
            var prdDone = 0, prdTot = 0;
            if (typeof AIPM_PRD_TASKS !== 'undefined') {
              prdTot = AIPM_PRD_TASKS.length;
              for (var pk = 0; pk < AIPM_PRD_TASKS.length; pk++) if (this.isOpenDone('prd', AIPM_PRD_TASKS[pk].id)) prdDone++;
            }
            add('aipm', 'AI 产品经理', pq.done + prdDone, pq.total + prdTot);
          }
        } catch (e) {}
        /* 能力雷达 */
        try {
          var dims = (typeof RADAR_DIMS !== 'undefined') ? RADAR_DIMS : null;
          if (dims) {
            var rv = {}; try { rv = JSON.parse(localStorage.getItem('tp_radar_v1') || '{}'); } catch (e2) {}
            var rated = 0, sum = 0, tgt = 0;
            for (var d = 0; d < dims.length; d++) {
              tgt += dims[d].target;
              if (rv[dims[d].id]) { rated++; sum += rv[dims[d].id]; }
            }
            out.radar = { rated: rated, total: dims.length, sum: sum, target: tgt, pct: tgt ? Math.round(sum / tgt * 100) : 0 };
          }
        } catch (e) {}

        out.pct = out.total ? Math.round(out.done / out.total * 100) : 0;
        localStorage.setItem('tp_summary_v1', JSON.stringify(out));
        return out;
      } catch (e) { return null; }
    }
  };
})();
