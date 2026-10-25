/* 语音复述训练 · CER 算法回归测试
   用法：node tools/test_speech.js  （退出码 0 = 通过）
   只测纯函数（normalize / cer / markMatch），不依赖 DOM 与麦克风。 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const sandbox = { window: {}, console, String, Number, Object, Array, Math, JSON, RegExp, parseInt, parseFloat, isNaN };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/speech-module.js'), 'utf8'), sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'data/speech.js'), 'utf8'), sandbox);
const SM = sandbox.SpeechModule;

let pass = 0, fail = 0;
function chk(name, actual, expected) {
  const ok = String(actual) === String(expected);
  console.log((ok ? '  \u2705 ' : '  \u274c ') + name + '  \u2192  \u5b9e\u9645 ' + actual + ' / \u671f\u671b ' + expected);
  if (ok) pass++; else fail++;
}
function near(name, actual, expected, eps) {
  const ok = Math.abs(actual - expected) < (eps || 1e-9);
  console.log((ok ? '  \u2705 ' : '  \u274c ') + name + '  \u2192  \u5b9e\u9645 ' + actual.toFixed(4) + ' / \u671f\u671b ' + expected);
  if (ok) pass++; else fail++;
}

console.log('=== T1 \u5f52\u4e00\u5316\uff08\u53bb\u6807\u70b9\u4e0e\u7a7a\u683c\u3001\u8f6c\u5c0f\u5199\uff09===');
chk('去标点', SM._normalize('你好，世界。'), '你好世界');
chk('去空格', SM._normalize('你 好   世界'), '你好世界');
chk('转小写', SM._normalize('ABC'), 'abc');
chk('中英混排', SM._normalize('AI \u4ea7\u54c1\u8fd0\u8425\uff01'), 'ai\u4ea7\u54c1\u8fd0\u8425');
chk('\u7a7a\u4e32', SM._normalize(''), '');

console.log('');
console.log('=== T2 CER \u57fa\u672c\u60c5\u5f62 ===');
let r = SM._cer('abcdefghij', 'abcdefghij');
chk('完全相同 \u2192 total', r.total, 0);
near('完全相同 \u2192 cer', r.cer, 0);

r = SM._cer('abcdefghij', 'abcdefghi');   // 漏 1 字
chk('漏 1 \u5b57 \u2192 del', r.del, 1);
chk('漏 1 \u5b57 \u2192 sub', r.sub, 0);
chk('漏 1 \u5b57 \u2192 ins', r.ins, 0);
near('漏 1 \u5b57 \u2192 cer = 1/10', r.cer, 0.1);

r = SM._cer('abcdefghij', 'abcdefghiX');   // 第 10 字替换
chk('替换 1 \u5b57 \u2192 sub', r.sub, 1);
chk('替换 1 \u5b57 \u2192 del', r.del, 0);
near('替换 1 \u5b57 \u2192 cer = 1/10', r.cer, 0.1);

r = SM._cer('abcdefghij', 'abcdefghijK');  // 多 1 字
chk('多 1 \u5b57 \u2192 ins', r.ins, 1);
near('多 1 \u5b57 \u2192 cer = 1/10', r.cer, 0.1);

r = SM._cer('abcdefghij', '');             // 全漏
chk('全漏 \u2192 del', r.del, 10);
near('全漏 \u2192 cer = 1', r.cer, 1);
near('全漏 \u2192 accuracy = 0', r.accuracy, 0);

r = SM._cer('', 'abc');
chk('原文为空 \u2192 refLen', r.refLen, 0);
near('原文为空 \u2192 cer = 0\uff08\u907f\u514d\u9664\u96f6\uff09', r.cer, 0);

console.log('');
console.log('=== T3 \u4e2d\u6587 + \u6807\u70b9\u4e0d\u8ba1\u5165\u9519\u8bef ===');
r = SM._cer('\u4f60\u597d\u4e16\u754c', '\u4f60\u597d\uff0c\u4e16\u754c\u3002');
chk('\u6807\u70b9\u5dee\u5f02\u4e0d\u8ba1 \u2192 total', r.total, 0);
r = SM._cer('\u6838\u5fc3\u6307\u6807\u4e0b\u964d\u4e86\u767e\u5206\u4e4b\u516b', '\u6838\u5fc3\u6307\u6807\u4e0b\u964d\u4e86\u767e\u5206\u4e4b\u4e03');
chk('\u6570\u5b57\u8bf4\u9519 \u2192 sub', r.sub, 1);
near('\u6570\u5b57\u8bf4\u9519 \u2192 cer = 1/11', r.cer, 1 / 11, 1e-6);

console.log('');
console.log('=== T4 markMatch\uff08\u9ad8\u4eae\u7528\uff09===');
let mk = SM._markMatch('\u4f60\u597d\u4e16\u754c', '\u4f60\u597d\u4e16\u754c');
chk('\u5b8c\u5168\u5339\u914d \u2192 \u9519\u8bef\u6570', Object.keys(mk.okMap).filter(k => mk.okMap[k] === false).length, 0);

mk = SM._markMatch('\u4f60\u597d\u4e16\u754c', '\u4f60\u597d\u4e16');   // 漏「界」
chk('\u6f0f\u5b57\u88ab\u6807\u8bb0', mk.okMap[3], false);
chk('\u6b63\u5e38\u5b57\u672a\u88ab\u6807\u8bb0', mk.okMap[0], true);

mk = SM._markMatch('\u4f60\u597d\uff0c\u4e16\u754c\u3002', '\u4f60\u597d\u4e16\u754c');
// 标点不参与，归一化后长度 4，全部匹配
chk('\u6807\u70b9\u4e0d\u5f71\u54cd\u9ad8\u4eae', Object.keys(mk.okMap).filter(k => mk.okMap[k] === false).length, 0);
chk('normLen', mk.normLen, 4);

console.log('');
console.log('=== T5 \u5408\u683c\u7ebf\u903b\u8f91 ===');
const M = sandbox.SPEECH_MATERIALS;
chk('\u6750\u6599\u6570', M.length, 5);
let bad = M.filter(m => !m.id || !m.text || typeof m.target !== 'number' || !m.tips || !m.tips.length);
chk('\u6750\u6599\u5b57\u6bb5\u7f3a\u5931', bad.length, 0);
chk('\u5408\u683c\u7ebf\u90fd\u5728 0-1 \u4e4b\u95f4', M.filter(m => m.target > 0 && m.target < 1).length, M.length);
// 模拟：把材料 1 的每个字都正确朗读
const t0 = M[0].text;
const rr = SM._cer(t0, t0);
chk('\u5b8c\u7f8e\u6717\u8bfb \u2192 \u8fbe\u6807', rr.cer <= M[0].target, true);

console.log('');
console.log('=== \u7ed3\u679c\uff1a' + pass + ' \u901a\u8fc7 / ' + fail + ' \u5931\u8d25 ===');
process.exit(fail ? 1 : 0);
