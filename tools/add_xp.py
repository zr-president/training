# -*- coding: utf-8 -*-
"""G01 双进度：角色等级（做了多少） vs 技能掌握（能否独立完成）
   设计要点：
   - 等级由「完成量」派生（不是记账本）→ 不存在重复刷分，历史进度立即生效
   - 技能掌握由「一次做对」派生 → 刷题能涨等级，但不会让技能掌握自动上涨
"""
import io, sys, os, re, subprocess
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
T = r'C:\Users\ZR\Desktop\钟锐的训练场'
PP = os.path.join(T, 'js', 'progress.js')
AP = os.path.join(T, 'js', 'app.js')

# ==================== 1) progress.js 加 xpSummary ====================
p = open(PP, encoding='utf-8').read()

XP = r'''
    },

    /* ---------- G01 双进度：角色等级 vs 技能掌握 ---------- */
    /* 等级由「完成量」派生，技能掌握由「一次做对」派生，两者分开记账。
       因为等级是从既有状态算出来的（不用账本），所以：
       ① 不存在重复刷分；② 历史进度立即生效，不需要迁移。 */
    xpSummary: function () {
      var W = { sql: 20, lab: 20, metrics: 20, abtest: 20, case: 30, agent: 30,
                plan: 4, python: 20, aipm: 20, prd: 30, interview: 15, workflow: 40 };
      var s = null;
      try { s = this.exportSummary(); } catch (e) { s = null; }

      var xp = 0, detail = [];
      if (s && s.mods) {
        for (var k in s.mods) {
          var m = s.mods[k], w = W[k] || 10, g = (m.done || 0) * w;
          xp += g;
          detail.push({ key: k, name: m.name, done: m.done || 0, w: w, xp: g });
        }
      }
      detail.sort(function (a, b) { return b.xp - a.xp; });

      /* 等级曲线：从 L 升到 L+1 需要 100 + 40 × (L−1) XP */
      function levelOf(x) {
        var L = 1, need = 100, acc = 0, guard = 0;
        while (x >= acc + need && guard++ < 500) { acc += need; L += 1; need = 100 + 40 * (L - 1); }
        return { level: L, inLevel: x - acc, need: need, accAt: acc, nextAt: acc + need };
      }
      var lv = levelOf(xp);

      /* 技能掌握：一次做对的题数（不看提示、不重做、第一次就过） */
      var indep = 0, attempted = 0;
      try {
        var st = this.stats((typeof SQL_QUESTIONS !== 'undefined') ? SQL_QUESTIONS.length : 0);
        indep += st.firstTry; attempted += st.attempted;
      } catch (e) {}
      var QNS = [
        ['metrics', (typeof METRICS_QUIZZES !== 'undefined') ? METRICS_QUIZZES.length : 0],
        ['abtest',  (typeof ABTEST_QUIZZES  !== 'undefined') ? ABTEST_QUIZZES.length  : 0],
        ['aipm',    (typeof AIPM_QUIZZES    !== 'undefined') ? AIPM_QUIZZES.length    : 0]
      ];
      for (var qi = 0; qi < QNS.length; qi++) {
        try {
          var qs = this.quizStats(QNS[qi][0], QNS[qi][1]);
          indep += qs.firstTry; attempted += qs.attempted;
        } catch (e) {}
      }
      try {
        if (typeof AGENT_CONTENT !== 'undefined' && AGENT_CONTENT.designs) {
          var az = this.quizStats('agent', AGENT_CONTENT.designs.length);
          indep += az.firstTry; attempted += az.attempted;
        }
      } catch (e) {}

      var doneN = s ? (s.done || 0) : 0;
      var totalN = s ? (s.total || 0) : 0;
      return {
        xp: xp, level: lv.level, inLevel: lv.inLevel, need: lv.need,
        accAt: lv.accAt, nextAt: lv.nextAt, toNext: lv.nextAt - xp,
        detail: detail,
        indep: indep, attempted: attempted,
        indepRate: attempted ? Math.round(indep / attempted * 100) : 0,
        done: doneN, total: totalN,
        pct: totalN ? Math.round(doneN / totalN * 100) : 0
      };
'''

# 在 exportSummary 结束的 `    }\n  };` 之前插入（把那个 `}` 收进 XP 开头）
ANCHOR = '''    }
  };
})();'''
if 'xpSummary' in p:
    print('ℹ️  xpSummary 已存在')
elif ANCHOR in p:
    # ANCHOR 里的 `    }` 是 exportSummary 的收尾，XP 开头也写了一个 `    },`
    p = p.replace(ANCHOR, XP.strip('\n') + '\n  };\n})();', 1)
    open(PP, 'w', encoding='utf-8').write(p)
    print('✅ progress.js 已加 xpSummary')
else:
    print('❌ progress.js 锚点未匹配')

# ==================== 2) app.js 首页加能力远征面板 ====================
a = open(AP, encoding='utf-8').read()

PANEL = r'''
    /* ===== G01 双进度：能力远征面板 ===== */
    try {
      var x = TP.xpSummary ? TP.xpSummary() : null;
      if (x) {
        var pctLv = x.need ? Math.round(x.inLevel / x.need * 100) : 0;
        h += '<div class="card" style="margin:14px 0 4px;padding:14px 17px">';
        h += '<div class="row" style="justify-content:space-between;align-items:flex-end;gap:12px;margin-bottom:9px">';
        h += '<div><div style="font-size:12px;color:var(--text3);font-weight:700;letter-spacing:.4px">角色等级</div>';
        h += '<div style="font-size:24px;font-weight:800;color:var(--cy);font-family:var(--mono);line-height:1.15;letter-spacing:-1px">Lv.' + x.level +
             '<span style="font-size:12px;color:var(--text3);font-family:var(--sans);font-weight:600;letter-spacing:0;margin-left:8px">累计 ' + x.xp + ' XP</span></div></div>';
        h += '<div style="text-align:right"><div style="font-size:15px;font-weight:800;color:var(--em)">独立完成 ' + x.indep + ' 题</div>' +
             '<div style="font-size:11.5px;color:var(--text3);margin-top:2px">一次做对率 ' + x.indepRate + '%（做过 ' + x.attempted + ' 题）</div></div>';
        h += '</div>';
        h += '<div style="height:8px;background:var(--bg2);border-radius:99px;overflow:hidden">' +
             '<div style="height:100%;width:' + pctLv + '%;background:linear-gradient(90deg,var(--cy),var(--em));border-radius:99px"></div></div>';
        h += '<div style="font-size:11.5px;color:var(--text3);margin-top:8px;line-height:1.75">' +
             '级内 ' + x.inLevel + ' / ' + x.need + ' XP，距 Lv.' + (x.level + 1) + ' 还需 <b style="color:var(--cy)">' + x.toNext + ' XP</b>　·　' +
             '<b style="color:var(--text2)">这两项是分开记账的</b>：等级记录你做了多少，独立完成记录你能一次做对多少 —— ' +
             '刷题能涨等级，但不会让第二项自动上涨。</div>';
        h += '</div>';
      }
    } catch (e) {}
'''

OLD = "    /* ===== 两个求职方向 ===== */"
if 'G01 双进度' in a:
    print('ℹ️  首页面板已存在')
elif OLD in a:
    a = a.replace(OLD, PANEL + '\n' + OLD, 1)
    open(AP, 'w', encoding='utf-8').write(a)
    print('✅ app.js 首页已加能力远征面板')
else:
    print('❌ app.js 锚点未匹配')

# ==================== 3) 语法 ====================
print()
for f in ['js/progress.js', 'js/app.js']:
    r = subprocess.run(['node', '--check', os.path.join(T, f)],
                       capture_output=True, text=True, encoding='utf-8', errors='replace')
    print('  %-18s %s' % (f, 'OK' if r.returncode == 0 else 'FAIL'))
    if r.returncode != 0:
        print('    ' + (r.stderr or '')[:300])
