/* 事件账本（方案 G10 基础 / G04 奖励经济）
   为什么需要它：
   - 成长币是「可消费」的，必须能算余额、能解释每一笔来源
   - 同一件事不能重复发奖（刷新、重复点击、重新导入都不能多发一次）
   - 需要知道「这周有几个学习日」，用来做周目标（G09）

   与既有 XP 的关系（重要）：
   XP 仍然由 progress.js 从既有状态现算（等级/掌握），**不写进账本** ——
   这样「刷分」在结构上就不可能发生，比事后去重更可靠。
   账本只负责三件必须有历史的事：成长币收支、每日/每周任务完成、学习日计数。

   时间规则（方案 G10）：
   - 时区固定 Asia/Shanghai（UTC+8，无夏令时）
   - 每天 04:00 切换「学习日」——凌晨 3 点学习算前一天
   - 每周一 04:00 切换「周」 */
var Ledger = (function () {
  var KEY = 'tp_ledger_v1';
  var MAX_EVENTS = 2000;   /* 上限，超出裁掉最旧的，避免无限增长 */
  var DAY_HOUR = 4;        /* 学习日切换点 */
  var TZ_OFFSET_MS = 8 * 3600 * 1000;

  /* ---------------- 时间：固定 UTC+8 ---------------- */
  function pad(n) { return String(n).padStart(2, '0'); }

  function utc8(ms) { return new Date((ms == null ? Date.now() : ms) + TZ_OFFSET_MS); }

  /* 学习日：YYYY-MM-DD（04:00 前算前一天） */
  function learningDay(ms) {
    var d = utc8(ms);
    if (d.getUTCHours() < DAY_HOUR) d = new Date(d.getTime() - 86400000);
    return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
  }

  /* 该学习日所在周的周一（YYYY-MM-DD） */
  function weekStart(dayStr) {
    var d = new Date((dayStr || learningDay()) + 'T00:00:00Z');
    var dow = d.getUTCDay();                 /* 0=周日 */
    var back = (dow === 0) ? 6 : (dow - 1);
    d = new Date(d.getTime() - back * 86400000);
    return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
  }

  /* 两个学习日相差几天 */
  function dayDiff(a, b) {
    var t1 = new Date(a + 'T00:00:00Z').getTime();
    var t2 = new Date(b + 'T00:00:00Z').getTime();
    return Math.round((t1 - t2) / 86400000);
  }

  /* ---------------- 存储 ---------------- */
  function store(s) {
    return s || (typeof localStorage !== 'undefined' ? localStorage : null);
  }
  function load(s) {
    try {
      var raw = store(s).getItem(KEY);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }
  function save(arr, s) {
    try { store(s).setItem(KEY, JSON.stringify(arr)); return true; }
    catch (e) { return false; }
  }

  function events(s) { return load(s); }

  /* ---------------- 事件类型与幂等范围 ---------------- */
  /* scope:
       'ever'   —— 整个生命周期只发一次（例：某题族的首个练习）
       'day'    —— 每个学习日一次（例：今日任务组）
       'week'   —— 每周一次（例：关底挑战）
       'free'   —— 不去重（例：花币兑换，自带唯一 id） */
  var KINDS = {
    practice: { scope: 'ever', label: '首次练习' },
    review:   { scope: 'ever', label: '到期复习' },
    explain:  { scope: 'ever', label: '写出有效解释' },
    daily:    { scope: 'day',  label: '今日任务组' },
    boss:     { scope: 'week', label: '关底挑战' },
    streak:   { scope: 'week', label: '周目标达成' },
    active:   { scope: 'day',  label: '学习活动' },
    spend:    { scope: 'free', label: '兑换支出' },
    adjust:   { scope: 'free', label: '手动调整' }
  };

  function scopeValue(scope, day) {
    if (scope === 'day') return day || learningDay();
    if (scope === 'week') return weekStart(day || learningDay());
    return 'always';
  }

  function has(kind, key, s) {
    var cfg = KINDS[kind];
    if (!cfg) return false;
    var sv = scopeValue(cfg.scope);
    var arr = load(s);
    for (var i = 0; i < arr.length; i++) {
      if (arr[i].kind === kind && arr[i].key === key && arr[i].scope === sv) return true;
    }
    return false;
  }

  var seq = 0;
  function newId() {
    seq = (seq + 1) % 100000;
    return 'ev_' + Date.now().toString(36) + '_' + seq.toString(36) + Math.random().toString(36).slice(2, 6);
  }

  /* 记一笔。返回 {ok, event, reason}
     ok=false 且 reason='duplicate' 表示幂等命中（不是错误） */
  function add(kind, key, coin, opts, s) {
    opts = opts || {};
    var cfg = KINDS[kind];
    if (!cfg) return { ok: false, reason: 'unknown-kind' };
    if (!key) return { ok: false, reason: 'no-key' };

    var day = opts.day || learningDay(opts.ms);
    var sv = scopeValue(cfg.scope, day);

    if (cfg.scope !== 'free') {
      var arr0 = load(s);
      for (var i = 0; i < arr0.length; i++) {
        if (arr0[i].kind === kind && arr0[i].key === key && arr0[i].scope === sv) {
          return { ok: false, reason: 'duplicate', existing: arr0[i] };
        }
      }
    }

    var ev = {
      id: newId(),
      kind: kind,
      key: String(key),
      scope: sv,
      day: day,
      week: weekStart(day),
      ts: (opts.ms == null ? Date.now() : opts.ms),
      coin: Number(coin) || 0,
      meta: opts.meta || null
    };

    var arr = load(s);
    arr.push(ev);
    if (arr.length > MAX_EVENTS) arr = arr.slice(arr.length - MAX_EVENTS);
    if (!save(arr, s)) return { ok: false, reason: 'write-failed', event: ev };
    return { ok: true, event: ev };
  }

  /* 撤销某一笔（用于「点错了」） */
  function removeById(id, s) {
    var arr = load(s);
    var n = arr.filter(function (e) { return e.id !== id; });
    if (n.length === arr.length) return false;
    return save(n, s);
  }

  /* ---------------- 汇总 ---------------- */
  function coinBalance(s) {
    var arr = load(s), sum = 0;
    for (var i = 0; i < arr.length; i++) sum += Number(arr[i].coin) || 0;
    return sum;
  }

  function coinEarned(s) {
    var arr = load(s), sum = 0;
    for (var i = 0; i < arr.length; i++) if (arr[i].coin > 0) sum += arr[i].coin;
    return sum;
  }
  function coinSpent(s) {
    var arr = load(s), sum = 0;
    for (var i = 0; i < arr.length; i++) if (arr[i].coin < 0) sum += -arr[i].coin;
    return sum;
  }

  function eventsOnDay(day, s) {
    return load(s).filter(function (e) { return e.day === day; });
  }
  function eventsInWeek(startStr, s) {
    return load(s).filter(function (e) { return e.week === startStr; });
  }

  /* 最近 n 个学习日里，有活动的天数（用于「本周 4 个学习日」） */
  function activeDaysInWeek(day, s) {
    var w = weekStart(day || learningDay());
    var arr = eventsInWeek(w, s);
    var seen = {};
    arr.forEach(function (e) { seen[e.day] = 1; });
    return Object.keys(seen).sort();
  }

  /* 连续学习日（允许今天还没学：从昨天往前数） */
  function streakDays(day, s) {
    var today = day || learningDay();
    var arr = load(s);
    var seen = {};
    arr.forEach(function (e) { seen[e.day] = 1; });
    var n = 0, cur = today;
    if (!seen[cur]) {
      /* 今天还没学，从昨天开始数，不算断 */
      cur = shiftDay(today, -1);
      if (!seen[cur]) return 0;
    }
    while (seen[cur]) { n++; cur = shiftDay(cur, -1); }
    return n;
  }

  function shiftDay(dayStr, delta) {
    var d = new Date(dayStr + 'T00:00:00Z');
    d = new Date(d.getTime() + delta * 86400000);
    return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
  }

  /* 本周是否已达成「N 个学习日」目标 */
  function weekGoalProgress(target, day, s) {
    var active = activeDaysInWeek(day, s);
    target = target || 4;
    return {
      active: active.length,
      target: target,
      done: active.length >= target,
      days: active,
      weekStart: weekStart(day || learningDay())
    };
  }

  /* ---------------- 导入/导出（配合备份页） ---------------- */
  function exportJSON(s) { return JSON.stringify(load(s)); }

  /* 合并导入：按事件 id 去重，不覆盖已有 */
  function importJSON(text, s) {
    var incoming;
    try { incoming = JSON.parse(text); } catch (e) { return { ok: false, reason: 'bad-json' }; }
    if (!Array.isArray(incoming)) return { ok: false, reason: 'not-array' };
    var arr = load(s);
    var have = {};
    arr.forEach(function (e) { have[e.id] = 1; });
    var added = 0, skipped = 0, bad = 0;
    incoming.forEach(function (e) {
      if (!e || typeof e !== 'object' || !e.id || !e.kind) { bad++; return; }
      if (have[e.id]) { skipped++; return; }
      arr.push(e); have[e.id] = 1; added++;
    });
    if (arr.length > MAX_EVENTS) arr = arr.slice(arr.length - MAX_EVENTS);
    if (!save(arr, s)) return { ok: false, reason: 'write-failed' };
    return { ok: true, added: added, skipped: skipped, bad: bad };
  }

  /* 清空（危险操作，UI 需二次确认） */
  function clear(s) { return save([], s); }

  return {
    KEY: KEY,
    DAY_HOUR: DAY_HOUR,
    KINDS: KINDS,
    learningDay: learningDay,
    weekStart: weekStart,
    shiftDay: shiftDay,
    dayDiff: dayDiff,
    events: events,
    has: has,
    add: add,
    removeById: removeById,
    coinBalance: coinBalance,
    coinEarned: coinEarned,
    coinSpent: coinSpent,
    eventsOnDay: eventsOnDay,
    eventsInWeek: eventsInWeek,
    activeDaysInWeek: activeDaysInWeek,
    streakDays: streakDays,
    weekGoalProgress: weekGoalProgress,
    exportJSON: exportJSON,
    importJSON: importJSON,
    clear: clear
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = Ledger;
