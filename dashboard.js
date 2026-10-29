let paused = false;
let sessionName = 'SSC Practice';
const englishBank = [
 ['Choose the synonym of “Abundant”.',['Scarce','Plentiful','Tiny','Empty'],1,'Abundant means plentiful or available in large quantities.'],
 ['Choose the antonym of “Ancient”.',['Old','Historic','Modern','Early'],2,'Modern is the opposite of ancient.'],
 ['Fill in the blank: She has been studying ___ morning.',['for','since','from','by'],1,'Use “since” with the starting point of a period of time.'],
 ['Choose the correct spelling.',['Accomodate','Acommodate','Accommodate','Accomadate'],2,'Accommodate has double c and double m.'],
 ['Choose the correct sentence.',['He do not like tea.','He does not likes tea.','He does not like tea.','He not like tea.'],2,'After “does”, use the base form of the main verb.'],
 ['What does the idiom “a piece of cake” mean?',['A difficult task','An easy task','A celebration','A small reward'],1,'A piece of cake describes something easy to do.'],
 ['Fill in the blank: He is ___ honest man.',['a','an','the','no article'],1,'“Honest” begins with a vowel sound, so it takes “an”.'],
 ['Choose the passive form of “Riya wrote the letter.”',['The letter writes Riya.','The letter is written by Riya.','The letter was written by Riya.','Riya was written a letter.'],2,'The simple past passive uses was/were + past participle.'],
 ['A person who studies plants is a:',['Geologist','Botanist','Zoologist','Historian'],1,'Botany is the scientific study of plants.'],
 ['Choose the correct preposition: She is good ___ mathematics.',['in','on','at','for'],2,'The standard expression is “good at” a subject or activity.']
].map(([q,options,answer,explanation])=>({q,options,answer,explanation}));
const reasoningBank = [
 ['Find the next number: 2, 6, 12, 20, 30, ?',['36','40','42','44'],2,'The differences are 4, 6, 8, 10, and then 12. So 30 + 12 = 42.'],
 ['Book is to Reading as Fork is to:',['Drawing','Eating','Writing','Cooking'],1,'A book is used for reading; a fork is used for eating.'],
 ['Find the odd one out.',['Square','Triangle','Circle','Cube'],3,'A cube is three-dimensional; the others are plane figures.'],
 ['If CAT is coded as DBU, how is DOG coded?',['EPH','CNG','EPI','FQH'],0,'Each letter is shifted one place forward in the alphabet.'],
 ['A person walks 5 km north, then 3 km east. In which direction are they from the start?',['North-west','South-east','North-east','South-west'],2,'The final position is both north and east of the starting point.'],
 ['Find the next letter: A, C, F, J, O, ?',['S','T','U','V'],2,'Alphabet positions increase by 2, 3, 4, 5, and 6. Position 21 is U.'],
 ['If all roses are flowers, which conclusion must be true?',['All flowers are roses.','Every rose is a flower.','No roses are flowers.','All plants are roses.'],1,'The given statement directly tells us that every rose is a flower.'],
 ['Find the missing number: 3, 9, 27, 81, ?',['162','216','243','324'],2,'Each term is multiplied by 3. 81 × 3 = 243.'],
 ['If today is Monday, what day will it be after 17 days?',['Tuesday','Wednesday','Thursday','Friday'],2,'17 leaves a remainder of 3 when divided by 7. Three days after Monday is Thursday.'],
 ['Pointing to a girl, Ravi says, “She is the daughter of my mother’s only son.” How is she related to Ravi?',['Sister','Daughter','Niece','Mother'],1,'Ravi is his mother’s only son, so the girl is Ravi’s daughter.']
].map(([q,options,answer,explanation])=>({q,options,answer,explanation}));
const subjectBanks = {math:BEST_500_PART1.slice(0,25),reasoning:reasoningBank,gk:SAMPLE_BANK,english:englishBank};
const subjectNames = {math:'Quantitative Aptitude',reasoning:'General Reasoning',gk:'General Awareness',english:'English Language'};
function startSubject(subject){selectedSubject=subject;questions=shuffle(subjectBanks[subject]).map(q=>({...q,subject:subjectNames[subject]}));totalTime=questions.length*36;sessionName=subjectNames[subject]+' · Subject practice';beginExam();}
function startMixed(){selectedSubject=null;questions=Object.keys(subjectBanks).flatMap(key=>shuffle(subjectBanks[key]).slice(0,10).map(q=>({...q,subject:subjectNames[key]})));totalTime=24*60;sessionName='SSC · Mixed practice mock';beginExam();}
function togglePause(){if(!examStarted)return;paused=!paused;document.getElementById('examContent').classList.toggle('hidden',paused);document.getElementById('pauseScreen').classList.toggle('hidden',!paused);document.getElementById('pauseButton').textContent=paused?'▶ Resume mock':'Ⅱ Pause mock';}
function escapeHTML(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
const parts=[BEST_500_PART1,BEST_500_PART2,BEST_500_PART3,BEST_500_PART4,BEST_500_PART5];
document.getElementById('libraryList').innerHTML=parts.map((part,i)=>`<div class="library-row"><span class="set-number">0${i+1}</span><div class="set-info"><h3>Best 500 Maths · Practice set ${i+1}</h3><p>${part.length} questions <span> · </span> 60 minutes <span> · </span> +2 / −0.5 marking</p></div><span class="pill">FREE PRACTICE</span><button class="btn secondary" onclick="startBest500(${i+1})">Start mock ↗</button></div>`).join('');
const originalRenderQuestion=renderQuestion;
renderQuestion=function(){originalRenderQuestion();const subject=questions[current].subject;if(subject)document.getElementById('qNumber').textContent=`${subject} · Question ${current+1} of ${questions.length}`;};

let selectedSubject = null;
let libraryRequest = 0;
function mockRow(title, detail, label, action) {
  const row = document.createElement('div'); row.className = 'library-row';
  const info = document.createElement('div'); info.className = 'set-info';
  const heading = document.createElement('h3'); heading.textContent = title;
  const description = document.createElement('p'); description.textContent = detail;
  info.append(heading, description);
  const button = document.createElement('button'); button.className = 'btn secondary'; button.textContent = label; button.onclick = action;
  row.append(info, button); return row;
}
function closeSubject() {
  selectedSubject = null; libraryRequest++;
  document.getElementById('subjectMocks').classList.add('hidden');
  document.querySelectorAll('.subject-card').forEach(card => card.classList.remove('subject-selected'));
  document.getElementById('subjects').scrollIntoView({ behavior: 'smooth' });
}
async function openSubject(subject) {
  if (!subjectNames[subject]) return;
  selectedSubject = subject;
  document.getElementById('subjectMocks').classList.remove('hidden');
  document.getElementById('subjectMockTitle').textContent = subjectNames[subject];
  document.querySelectorAll('.subject-card').forEach((card, i) => card.classList.toggle('subject-selected', Object.keys(subjectNames)[i] === subject));
  document.getElementById('customSubject').value = subjectNames[subject];
  const builtins = document.getElementById('subjectBuiltins'); builtins.replaceChildren();
  builtins.append(mockRow('Quick subject practice', `${subjectBanks[subject].length} questions · ${Math.ceil(subjectBanks[subject].length * 36 / 60)} minutes · +2 / −0.5 marking`, 'Start practice', () => startSubject(subject)));
  if (subject === 'math') parts.forEach((part, i) => builtins.append(mockRow(`Best 500 Maths · Practice set ${i + 1}`, `${part.length} questions · 60 minutes · +2 / −0.5 marking`, 'Start mock', () => startBest500(i + 1))));
  document.getElementById('subjectMocks').scrollIntoView({ behavior: 'smooth', block: 'start' });
  document.getElementById('subjectMockTitle').focus({ preventScroll: true });
  await loadSubjectLibrary(subject);
}
async function loadSubjectLibrary(subject) {
  const request = ++libraryRequest;
  const list = document.getElementById('uploadedMockList'); list.className = 'mock-message'; list.textContent = 'Loading your mocks…';
  try {
    const response = await fetch(`/api/mocks?subject=${encodeURIComponent(subject)}`, { cache: 'no-store' });
    if (!response.ok) throw new Error();
    const mocks = await response.json();
    if (request !== libraryRequest || subject !== selectedSubject) return;
    list.replaceChildren();
    if (!mocks.length) {
      list.className = 'mock-message';
      const message = document.createElement('p'); message.textContent = 'Your first mock starts here. Upload a JSON, HTML, CSV, or TXT file to add a test to this subject.';
      const button = document.createElement('button'); button.className = 'btn secondary'; button.textContent = 'Add your first mock'; button.onclick = openSubjectUpload;
      list.append(message, button); return;
    }
    list.className = 'library-list';
    mocks.forEach(mock => list.append(mockRow(mock.title, `${mock.questions.length} questions · ${Math.ceil(Math.max(900, mock.questions.length * 36) / 60)} minutes · +2 / −0.5 marking`, 'Take mock →', () => {
      questions = mock.questions.map(q => ({ ...q, options: q.options.map(escapeHTML), explanation: escapeHTML(q.explanation), subject: subjectNames[subject] }));
      totalTime = Math.max(900, Math.round(questions.length * 36)); sessionName = `${mock.title} · ${subjectNames[subject]}`; beginExam();
    })));
  } catch {
    if (request !== libraryRequest || subject !== selectedSubject) return;
    list.className = 'mock-message'; list.textContent = 'Your uploaded mocks could not be loaded. Built-in practice is still available.';
    const retry = document.createElement('button'); retry.className = 'btn secondary'; retry.textContent = 'Try again'; retry.onclick = () => loadSubjectLibrary(subject); list.append(retry);
  }
}
function openSubjectUpload() {
  if (selectedSubject) document.getElementById('customSubject').value = subjectNames[selectedSubject];
  const area = document.getElementById('custom-area'); area.open = true; area.scrollIntoView({ behavior: 'smooth' }); document.getElementById('mockTitle').focus({ preventScroll: true });
}
async function saveSubjectMock() {
  const status = document.getElementById('uploadStatus');
  const button = document.getElementById('saveMockButton');
  const title = document.getElementById('mockTitle').value.trim();
  const subject = Object.keys(subjectNames).find(key => subjectNames[key] === document.getElementById('customSubject').value);
  let data;
  try { data = parseMockContent(document.getElementById('jsonInput').value); } catch (error) { status.textContent = error.message; return; }
  if (!title) { status.textContent = 'Give your mock a name so you can find it later.'; document.getElementById('mockTitle').focus(); return; }
  if (!Array.isArray(data) || !data.length || data.length > 500 || !data.every(q => q && typeof (q.q || q.question) === 'string' && (q.q || q.question).trim() && Array.isArray(q.options || q.choices) && (q.options || q.choices).length === 4 && (q.options || q.choices).every(o => typeof o === 'string') && Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 4)) {
    status.textContent = 'Use 1–500 questions, each with question text, four text options, and an answer index from 0 to 3.'; return;
  }
  button.disabled = true; status.textContent = 'Saving your mock…';
  try {
    const response = await fetch(`/api/mocks?subject=${subject}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, questions: data.map(q => ({ q: q.q || q.question, options: q.options || q.choices, answer: q.answer, explanation: String(q.explanation || q.exp || '') })) }) });
    const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Could not save your mock. Please try again.');
    status.textContent = 'Saved. Choose Take mock from your subject list to begin.';
    document.getElementById('mockTitle').value = ''; document.getElementById('jsonInput').value = ''; document.getElementById('fileInput').value = '';
    document.getElementById('custom-area').open = false; await openSubject(subject);
  } catch (error) { status.textContent = error.message || 'Could not save your mock. Your questions are still here; please try again.'; }
  finally { button.disabled = false; }
}
function returnToMocks() {
  document.getElementById('resultScreen').classList.add('hidden');
  document.getElementById('setupScreen').classList.remove('hidden');
  if (selectedSubject) openSubject(selectedSubject);
  else document.getElementById('subjects').scrollIntoView({ behavior: 'smooth' });
}
document.querySelectorAll('.subject-bottom').forEach(el => { el.innerHTML = '<span>Uploaded mocks + practice</span><strong>View mocks →</strong>'; });
document.querySelector('.side-link[href="#subjects"]').addEventListener('click', event => {
  if (examStarted) { event.preventDefault(); return; }
  document.getElementById('resultScreen').classList.add('hidden'); document.getElementById('setupScreen').classList.remove('hidden'); closeSubject();
});

// All import formats become the same validated question records before saving.
function importAnswer(value) {
  const answer = String(value || '').trim().toUpperCase();
  if (!/^[A-D]$/.test(answer)) throw new Error('CSV, HTML, and text answers must be A, B, C, or D. See Supported question formats.');
  return answer.charCodeAt(0) - 65;
}
function parseCSV(source) {
  const rows = []; let row = [], cell = '', quoted = false;
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (c === '"') {
      if (quoted && source[i + 1] === '"') { cell += '"'; i++; }
      else if (quoted || !cell) quoted = !quoted;
      else throw new Error('Invalid CSV quoting. See Supported question formats.');
    } else if (c === ',' && !quoted) { row.push(cell); cell = ''; }
    else if ((c === '\n' || c === '\r') && !quoted) {
      if (c === '\r' && source[i + 1] === '\n') i++;
      row.push(cell); if (row.some(v => v.trim())) rows.push(row); row = []; cell = '';
    } else cell += c;
  }
  if (quoted) throw new Error('CSV has an unclosed quoted field.');
  row.push(cell); if (row.some(v => v.trim())) rows.push(row);
  const header = (rows.shift() || []).map(v => v.trim().toLowerCase());
  const required = ['question', 'a', 'b', 'c', 'd', 'answer'];
  if (!required.every(key => header.includes(key))) throw new Error('CSV needs columns: question,A,B,C,D,answer,explanation.');
  return rows.map((values, index) => {
    if (values.length !== header.length) throw new Error(`CSV row ${index + 2} has the wrong number of fields. Quote text containing commas.`);
    const get = key => values[header.indexOf(key)] || '';
    return { q: get('question'), options: ['a','b','c','d'].map(get), answer: importAnswer(get('answer')), explanation: get('explanation') };
  });
}
function parseTextMock(source) {
  const blocks = source.trim().split(/\n\s*\n/);
  return blocks.map((block, index) => {
    const lines = block.split('\n').map(line => line.trim()).filter(Boolean);
    const options = lines.filter(line => /^[A-D][).:]\s*/i.test(line));
    const answer = lines.find(line => /^Answer\s*:/i.test(line));
    const firstOption = lines.findIndex(line => /^[A-D][).:]\s*/i.test(line));
    const explanation = lines.findIndex(line => /^Explanation\s*:/i.test(line));
    if (firstOption < 1 || options.length !== 4 || !options.every((line, i) => line[0].toUpperCase() === 'ABCD'[i]) || !answer) {
      throw new Error(`Question ${index + 1} needs question text, A)–D) options, and Answer: A–D. See Supported question formats.`);
    }
    return { q: lines.slice(0, firstOption).join('\n').replace(/^\d+[.)]\s*/, ''), options: options.map(line => line.replace(/^[A-D][).:]\s*/i, '')), answer: importAnswer(answer.replace(/^Answer\s*:/i, '')), explanation: explanation < 0 ? '' : lines.slice(explanation).join('\n').replace(/^Explanation\s*:/i, '') };
  });
}
// Read only JSON-compatible Q data; never evaluate an uploaded script.
function parseHTMLQuestionArray(doc) {
  for (const script of doc.querySelectorAll('script:not([src])')) {
    const source = script.textContent;
    const declaration = /(?:^|\n)[ \t]*(?:const|let|var)\s+Q\s*=\s*(\[)/.exec(source);
    if (!declaration) continue;
    const start = declaration.index + declaration[0].length - 1;
    let depth = 0, quoted = false, escaped = false;
    for (let i = start; i < source.length; i++) {
      const c = source[i];
      if (quoted) {
        if (escaped) escaped = false;
        else if (c === '\\') escaped = true;
        else if (c === '"') quoted = false;
        continue;
      }
      if (c === '"') quoted = true;
      else if (c === '[') depth++;
      else if (c === ']' && --depth === 0) {
        let rows;
        try { rows = JSON.parse(source.slice(start, i + 1)); }
        catch { throw new Error('The HTML Q array must contain JSON data only: double-quoted text, four options, and an answer index from 0 to 3.'); }
        if (!rows.length || rows.length > 500) throw new Error('The HTML Q array must contain 1–500 questions.');
        return rows.map((row, index) => {
          if (!Array.isArray(row) || row.length !== 3 || typeof row[0] !== 'string' || !row[0].trim() || !Array.isArray(row[1]) || row[1].length !== 4 || !row[1].every(option => typeof option === 'string') || !Number.isInteger(row[2]) || row[2] < 0 || row[2] > 3) {
            throw new Error(`HTML question ${index + 1} needs question text, four text options, and an answer index from 0 to 3.`);
          }
          return { q: row[0], options: row[1], answer: row[2], explanation: '' };
        });
      }
    }
    throw new Error('The HTML Q array is incomplete. Upload the complete HTML file.');
  }
  return null;
}
function parseMockContent(source, format = '') {
  source = source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').trim();
  if (new TextEncoder().encode(source).length > 1000000) throw new Error('Upload must be smaller than 1 MB.');
  if (!source) throw new Error('Upload a file or paste questions first.');
  if (format === 'json' || /^[\[{]/.test(source)) {
    let data;
    try { data = JSON.parse(source); } catch { throw new Error('Invalid JSON. Check the question array and try again.'); }
    return Array.isArray(data) ? data : data.questions || data;
  }
  if (['html', 'htm'].includes(format) || source.startsWith('<')) {
    // Parsing in an inert document never executes uploaded scripts.
    const doc = new DOMParser().parseFromString(source, 'text/html');
    const embedded = [...doc.querySelectorAll('script[type="application/json"]')];
    for (const script of embedded) {
      try {
        const data = JSON.parse(script.textContent);
        if (Array.isArray(data) || Array.isArray(data?.questions)) return data.questions || data;
      } catch { /* Try visible question markup instead. */ }
    }
    const questionArray = parseHTMLQuestionArray(doc);
    if (questionArray) return questionArray;
    doc.querySelectorAll('script,style,iframe,object,template').forEach(el => el.remove());
    const blocks = [...doc.querySelectorAll('.question, [data-question]')];
    if (blocks.length) return blocks.map((block, index) => {
      const q = block.querySelector('.question-text, .q-text, h2, h3, legend');
      const options = [...block.querySelectorAll('.option, li')];
      const answer = block.getAttribute('data-answer') || block.querySelector('.answer')?.textContent.replace(/^\s*Answer\s*:\s*/i, '');
      if (!q || options.length !== 4 || !answer) throw new Error(`HTML question ${index + 1} needs a heading, four options, and data-answer="A"–"D". See Supported question formats.`);
      return { q: q.textContent.trim(), options: options.map(el => el.textContent.trim()), answer: importAnswer(answer), explanation: block.querySelector('.explanation')?.textContent.trim() || '' };
    });
    doc.querySelectorAll('br').forEach(el => el.replaceWith('\n'));
    doc.querySelectorAll('p,div,h1,h2,h3,li,tr').forEach(el => el.append('\n'));
    try { return parseTextMock(doc.body.textContent.replace(/\n[ \t]*\n+/g, '\n').replace(/\n(?=\s*\d+[.)]\s)/g, '\n\n')); }
    catch { throw new Error('No supported HTML questions found. Use embedded JSON, question blocks, or numbered text with answers. See Supported question formats.'); }
  }
  if (format === 'csv' || /^question\s*,/i.test(source) || /^"question"\s*,/i.test(source)) return parseCSV(source);
  return parseTextMock(source);
}
function handleFile(file) {
  const status = document.getElementById('uploadStatus');
  const format = file.name.split('.').pop().toLowerCase();
  if (!['json','html','htm','csv','txt'].includes(format)) { status.textContent = 'Choose a JSON, HTML, CSV, or TXT file.'; return; }
  if (file.size > 1000000) { status.textContent = 'Upload must be smaller than 1 MB.'; return; }
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = parseMockContent(String(reader.result), format);
      document.getElementById('jsonInput').value = JSON.stringify(data, null, 2);
      if (!document.getElementById('mockTitle').value.trim()) document.getElementById('mockTitle').value = file.name.replace(/\.[^.]+$/, '').slice(0, 120);
      status.textContent = `Imported ${Array.isArray(data) ? data.length : 0} questions. Review the content, then save your mock.`;
    } catch (error) { status.textContent = error.message; }
  };
  reader.onerror = () => { status.textContent = 'The file could not be read. Please try again.'; };
  reader.readAsText(file);
}
