import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

function setup() {
  const dom = new JSDOM(readFileSync('index.html', 'utf8'), { runScripts: 'outside-only', url: 'https://practice.example' });
  const w = dom.window;
  w.TextEncoder = TextEncoder;
  w.scrollTo = () => {}; w.HTMLElement.prototype.scrollIntoView = () => {};
  w.alert = message => { throw new Error(message); };
  const stored = [];
  w.fetch = async (url, options) => {
    const subject = new URL(url, w.location.href).searchParams.get('subject');
    if (options?.method === 'POST') { const mock = { ...JSON.parse(options.body), subject }; stored.push(mock); return { ok: true, json: async () => mock }; }
    return { ok: true, json: async () => stored.filter(mock => mock.subject === subject) };
  };
  const inline = [...w.document.querySelectorAll('script:not([src])')].map(s => s.textContent).join('\n');
  w.eval(inline + '\n' + readFileSync('dashboard.js', 'utf8'));
  return dom;
}

test('subject selection, upload, reopen, scoring and return', async () => {
  const dom = setup(); const w = dom.window; const d = w.document;
  try {
    for (const subject of ['math', 'reasoning', 'gk', 'english']) {
      await w.openSubject(subject);
      assert.equal(d.querySelectorAll('.subject-selected').length, 1);
      assert.match(d.getElementById('uploadedMockList').textContent, /first mock/);
      assert(d.getElementById('examScreen').classList.contains('hidden'));
    }
    await w.openSubject('math');
    d.getElementById('mockTitle').value = 'Uploaded algebra';
    d.getElementById('jsonInput').value = JSON.stringify([
      { q: '2 + 2?', options: ['1','2','3','4'], answer: 3 },
      { q: '3 + 3?', options: ['4','5','6','7'], answer: 2 },
      { q: '4 + 4?', options: ['6','7','8','9'], answer: 2 }
    ]);
    await w.saveSubjectMock();
    assert.match(d.getElementById('uploadedMockList').textContent, /Uploaded algebra/);
    await w.openSubject('english'); assert.doesNotMatch(d.getElementById('uploadedMockList').textContent, /Uploaded algebra/);
    await w.openSubject('math');
    d.querySelector('#uploadedMockList button').click();
    w.selectOption(3); w.nextQ(); w.selectOption(0); w.nextQ();
    w.submitPaper(false);
    assert.equal(d.getElementById('finalScore').textContent, '1.5');
    assert.equal(d.getElementById('correctCount').textContent, '1');
    assert.equal(d.getElementById('wrongCount').textContent, '1');
    assert.equal(d.getElementById('blankCount').textContent, '1');
    assert.equal(d.querySelectorAll('.key-item').length, 3);
    assert.match(d.getElementById('resultMockTitle').textContent, /Uploaded algebra/);
    w.returnToMocks(); assert(d.getElementById('resultScreen').classList.contains('hidden'));
    assert(!d.getElementById('setupScreen').classList.contains('hidden'));
  } finally { dom.window.close(); }
});

test('invalid upload and library failures have recoverable feedback', async () => {
  const dom = setup(); const w = dom.window; const d = w.document;
  try {
    d.getElementById('mockTitle').value = 'Invalid'; d.getElementById('jsonInput').value = '{}';
    await w.saveSubjectMock(); assert.match(d.getElementById('uploadStatus').textContent, /1–500/);
    w.fetch = async () => { throw new Error('Offline'); };
    await w.openSubject('gk'); assert.match(d.getElementById('uploadedMockList').textContent, /could not be loaded/);
    assert.equal(d.querySelector('#uploadedMockList button').textContent, 'Try again');
    assert(d.querySelector('#subjectBuiltins button'));
  } finally { dom.window.close(); }
});

test('HTML, CSV and text imports save and score through the existing exam', async () => {
  const dom = setup(); const w = dom.window; const d = w.document;
  const sources = [
    '<div class="question" data-answer="D"><h3>2 &lt; 4?</h3><ol><li>No</li><li>Maybe</li><li>Unknown</li><li>Yes</li></ol><p class="explanation">Yes indeed.</p></div><script>window.importExecuted = true</script>',
    '<script type="application/json">{"questions":[{"q":"2 < 4?","options":["No","Maybe","Unknown","Yes"],"answer":3}]}</script>',
    'question,A,B,C,D,answer,explanation\n"2 < 4?","No, never",Maybe,Unknown,Yes,D,"Yes, indeed."',
    '1. 2 < 4?\nA) No\nB) Maybe\nC) Unknown\nD) Yes\nAnswer: D\nExplanation: Yes indeed.',
    '<pre>1. 2 &lt; 4?\nA) No\nB) Maybe\nC) Unknown\nD) Yes\nAnswer: D</pre>'
  ];
  try {
    await w.openSubject('math');
    for (const [i, source] of sources.entries()) {
      const data = w.parseMockContent(source);
      assert.equal(data.length, 1); assert.equal(data[0].answer, 3); assert.equal(data[0].q, '2 < 4?');
      d.getElementById('mockTitle').value = `Format ${i}`; d.getElementById('jsonInput').value = source;
      await w.saveSubjectMock();
      const buttons = [...d.querySelectorAll('#uploadedMockList button')];
      buttons[i].click(); w.selectOption(3); w.submitPaper(false);
      assert.equal(d.getElementById('correctCount').textContent, '1');
      w.returnToMocks(); await w.openSubject('math');
    }
    assert.equal(w.importExecuted, undefined);
  } finally { dom.window.close(); }
});

test('import errors reject missing answers, unsupported HTML and malformed CSV', () => {
  const dom = setup(); const w = dom.window;
  try {
    assert.throws(() => w.parseMockContent('<script>const questions = [];</script>'), /No supported HTML questions/);
    assert.throws(() => w.parseMockContent('<div class="question"><h3>Question</h3><ol><li>A</li></ol></div>'), /HTML question 1/);
    assert.throws(() => w.parseMockContent('question,A,B,C,D,answer\nQ,a,b,c,d,E'), /answers must be/);
    assert.throws(() => w.parseMockContent('question,A,B,C,D,answer\n"unclosed'), /unclosed/);
    assert.throws(() => w.parseMockContent('1. Missing answer\nA) a\nB) b\nC) c\nD) d'), /Question 1 needs/);
    assert.throws(() => w.parseMockContent('x'.repeat(1000001)), /smaller than 1 MB/);
    w.handleFile({name: 'mock.pdf', size: 100});
    assert.match(w.document.getElementById('uploadStatus').textContent, /Choose a JSON, HTML, CSV, or TXT/);
  } finally { dom.window.close(); }
});

test('attached OWS HTML imports through file selection, saves and scores', async () => {
  const dom = setup(); const w = dom.window; const d = w.document;
  try {
    await w.openSubject('english');
    const source = readFileSync('tests/fixtures/OWS_Mock_Part1.html', 'utf8');
    w.handleFile(new w.File([source], 'OWS_Mock_Part1.html', { type: 'text/html' }));
    await new Promise((resolve, reject) => {
      const deadline = Date.now() + 3000;
      const check = () => {
        if (d.getElementById('uploadStatus').textContent) resolve();
        else if (Date.now() > deadline) reject(new Error('File import timed out'));
        else w.setTimeout(check, 10);
      };
      check();
    });
    assert.match(d.getElementById('uploadStatus').textContent, /Imported 50 questions/);
    const data = JSON.parse(d.getElementById('jsonInput').value);
    assert.equal(data[0].q, 'To become less intense or widespread');
    assert.deepEqual(data[0].options, ['Abet', 'Abate', 'Abjure', 'Abrade']);
    assert.equal(data[0].answer, 1);
    assert.equal(data[49].answer, 1);
    assert.equal(d.getElementById('mockTitle').value, 'OWS_Mock_Part1');
    await w.saveSubjectMock();
    const take = [...d.querySelectorAll('#uploadedMockList button')].at(-1);
    take.click(); w.selectOption(1); w.submitPaper(false);
    assert.equal(d.getElementById('correctCount').textContent, '1');
    assert.equal(d.getElementById('test'), null);
  } finally { w.close(); }
});

test('HTML Q data preserves quoted brackets and rejects executable or invalid entries', () => {
  const dom = setup(); const w = dom.window;
  const html = value => `<script>const Q = ${value}; window.importExecuted = true;</script>`;
  try {
    const rows = [['A ] bracket and "quote" with \\ slash', ['a', 'b', 'c', 'd'], 0]];
    const data = w.parseMockContent(html(JSON.stringify(rows)));
    assert.equal(data[0].q, rows[0][0]);
    assert.equal(data[0].answer, 0);
    assert.equal(w.importExecuted, undefined);
    assert.throws(() => w.parseMockContent(html('[["Q",["a","b","c","d"],(window.importExecuted=true)]]')), /JSON data only/);
    assert.equal(w.importExecuted, undefined);
    for (const row of [['Q', ['a'], 0], ['Q', ['a','b','c','d'], 4], ['', ['a','b','c','d'], 0]]) {
      assert.throws(() => w.parseMockContent(html(JSON.stringify([row]))), /HTML question 1/);
    }
    assert.throws(() => w.parseMockContent(html('[]')), /1–500/);
    assert.throws(() => w.parseMockContent(html('[["unfinished"')), /incomplete/);
  } finally { w.close(); }
});
