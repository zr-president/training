// 能力雷达 · 维度定义（基于字节跳动策略运营岗真实 JD 反推）
// target = 该岗位要求达到的等级（1-5）；evidence = 对应的训练模块进度键

var RADAR_DIMS = [
  {
    id: 'sql', n: 'SQL 数据提取', short: 'SQL',
    jd: '熟练使用SQL（硬性要求）', target: 5, hard: true,
    module: '#/sql', modName: 'SQL 训练场',
    how: '刷完 L1-L5 全部 20 题，重点是 L3 多表 JOIN 与 L5 业务场景题（留存/漏斗/LTV-CAC）——面试常考的就是这几类。',
    evidence: 'sql'
  },
  {
    id: 'analysis', n: '数据分析与问题拆解', short: '分析拆解',
    jd: '较强的数据分析与问题拆解能力（硬性要求）', target: 5, hard: true,
    module: '#/lab', modName: '数据集实验室',
    how: '做完 8 个业务问题。关键不是写出 SQL，而是能说清"为什么拆这个维度""口径怎么定"。',
    evidence: 'lab'
  },
  {
    id: 'ai', n: 'AI/LLM/Agent 理解', short: 'AI理解',
    jd: '对AI产品/LLM/Agent/Workflow有较强兴趣（硬性要求）', target: 5, hard: true,
    module: '#/agent', modName: 'AI Agent 实操',
    how: '做 Agent 判读题 + 至少完成 T1-T2 实操任务。能讲清 Prompt / 工作流 / Agent 的区别与适用场景。',
    evidence: 'agent_quiz'
  },
  {
    id: 'aieff', n: 'AI 提升运营效率', short: 'AI提效',
    jd: '探索AI能力与自动化工具在运营场景中的落地应用（硬性要求）', target: 4, hard: true,
    module: '#/agent', modName: 'AI Agent 实操',
    how: '完成 T3-T4：搭出一个能跑的运营 Agent，并用提效计算器算出**含审核与维护成本**的真实收益。',
    evidence: 'agent_task'
  },
  {
    id: 'think', n: '量化拆解·系统思考', short: '量化拆解',
    jd: '善于将复杂业务问题量化拆解和系统化思考（硬性要求）', target: 4, hard: true,
    module: '#/case', modName: 'Case 拆解训练',
    how: '做完 5 个 Case，每次都按 6 步框架走完（尤其"列假设"和"设计验证"这两步最容易跳过）。',
    evidence: 'case'
  },
  {
    id: 'ab', n: '实验分析 (A/B)', short: '实验分析',
    jd: '有实验分析经验加分', target: 4, hard: false,
    module: '#/abtest', modName: '实验分析训练',
    how: '做完 6 道判读题，并能自己设计一个小实验：定假设、算样本量、定护栏指标、定观察周期。',
    evidence: 'abtest'
  },
  {
    id: 'metric', n: '指标体系设计', short: '指标体系',
    jd: '有指标体系设计经验加分', target: 4, hard: false,
    module: '#/metrics', modName: '指标设计工坊',
    how: '做完 6 个场景，并且能自己为一类业务从零设计出「北极星 + 一级 + 二级」的指标树。',
    evidence: 'metrics'
  },
  {
    id: 'sop', n: '运营 SOP/工作流设计', short: 'SOP工作流',
    jd: '运营SOP优化、跨团队协同机制搭建（职责）', target: 3, hard: false,
    module: '#/case', modName: 'Case 拆解训练',
    how: '把 Case 里的方案落成可执行 SOP（谁在什么时间做什么、异常怎么处理），而不只是"给建议"。',
    evidence: null
  },
  {
    id: 'method', n: '方法论沉淀', short: '方法论',
    jd: '沉淀方法论与最佳实践（职责）', target: 3, hard: false,
    module: '#/radar', modName: '能力雷达',
    how: '把每次分析/实验的结论与踩坑记录成可复用模板；能用一句话说清自己做事的方法论。',
    evidence: null
  }
];

var RADAR_META = {
  updated: '2026-09-12',
  intro: '自评不是目的，**找到最高优先级的短板**才是。下面的等级请按"能不能独立做到"来打，而不是"了不了解"：1=没接触过，2=了解概念，3=能照着做，4=能独立完成，5=能设计并教别人。'
};
