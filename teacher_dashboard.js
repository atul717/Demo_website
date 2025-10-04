/* teacher_dashboard.js
   - Manage teacher top info and realtime lecture (simple demo)
   - Manage attendance marking, notes, notices, syllabus (all update localStorage)
*/

const DB = key => JSON.parse(localStorage.getItem(key) || '[]');
const SET = (k,v) => localStorage.setItem(k, JSON.stringify(v));

function requireTeacher(){
  const logged = JSON.parse(localStorage.getItem('logged_user') || 'null');
  if(!logged || logged.role !== 'teacher'){ window.location.href='login.html'; return null; }
  return logged;
}
const loggedT = requireTeacher();
if(!loggedT) throw 'not logged';

// populate teacher info
const teachers = DB('teachers'), users = DB('users'), subjects = DB('subjects');
const teacher = teachers.find(t=>t.user_id === loggedT.user_id);
if(!teacher){ alert('Teacher profile missing'); window.location.href='login.html'; }
document.getElementById('teacher-name').innerText = teacher.name;
document.getElementById('teacher-dept').innerText = teacher.department || 'Department';
document.getElementById('teacher-photo').src = 'https://i.pravatar.cc/300?img=65';

// fill subject selects
['note-subject','syll-subject','syll-subject','note-subject','syll-subject'].forEach(id=>{
  const el = document.getElementById(id);
  if(el) {
    el.innerHTML = '';
    subjects.forEach(s => el.appendChild(new Option(s.subject_name, s.subject_id)));
  }
});

// Realtime lecture: simple check using schedule and current day/time
function checkCurrentLecture(){
  const sched = DB('schedule');
  const now = new Date();
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const today = days[now.getDay()];
  const tNow = now.toTimeString().slice(0,5);
  const cur = sched.find(s => s.teacher_id === teacher.teacher_id && s.day === today && s.start <= tNow && s.end >= tNow);
  const el = document.getElementById('current-lecture');
  if(cur){
    const subj = subjects.find(x=>x.subject_id===cur.subject_id);
    el.innerText = `In Class: ${cur.class_name} - ${subj?subj.subject_name:''}`;
    el.style.color = '#28a745';
  } else {
    el.innerText = 'Free Lecture';
    el.style.color = '#ff9900';
  }
}
checkCurrentLecture();
setInterval(checkCurrentLecture, 30*1000); // update every 30s

// ---------------- Attendance Management ----------------
function renderAttendanceManagement(){
  const studentList = DB('students'), subs = DB('subjects'), att = DB('attendance');
  const container = document.getElementById('attendance-management');
  container.innerHTML = '';
  subs.filter(s=>s.semester===5).forEach(s=>{
    const block = document.createElement('div');
    block.className = 'tab-content';
    block.innerHTML = `<div style="font-weight:700">${s.subject_name}</div>`;
    studentList.forEach(st => {
      const a = att.find(x=>x.student_id===st.student_id && x.subject_id===s.subject_id) || {total:0,attended:0};
      const row = document.createElement('div');
      row.style.display='flex'; row.style.justifyContent='space-between'; row.style.alignItems='center'; row.style.margin='8px 0';
      row.innerHTML = `<div>${st.name} (${st.roll}) - ${a.attended}/${a.total}</div>
        <div style="display:flex;gap:6px">
          <button class="small-btn" onclick="markAttendance(${st.student_id},${s.subject_id},true)">Present</button>
          <button class="small-btn" onclick="markAttendance(${st.student_id},${s.subject_id},false)">Absent</button>
        </div>`;
      block.appendChild(row);
    });
    container.appendChild(block);
  });
}
window.markAttendance = function(student_id, subject_id, present){
  const att = DB('attendance');
  let rec = att.find(x=>x.student_id===student_id && x.subject_id===subject_id);
  if(!rec){ rec = {student_id, subject_id, total:0, attended:0}; att.push(rec); }
  rec.total = (rec.total || 0) + 1;
  if(present) rec.attended = (rec.attended || 0) + 1;
  SET('attendance', att);
  renderAttendanceManagement();
  alert('Attendance updated');
}
renderAttendanceManagement();

// ---------------- Notes Management ----------------
function loadTeacherNotes(){
  const list = DB('notes');
  const out = document.getElementById('teacher-notes-list'); out.innerHTML='';
  list.filter(n=>n.teacher_id === teacher.teacher_id).forEach(n=>{
    const sname = subjects.find(s=>s.subject_id===n.subject_id)?.subject_name || '';
    const div = document.createElement('div'); div.className='subject-card';
    div.innerHTML = `<div><strong>${n.title}</strong> <div class="sub-meta">${sname}</div><div>${n.content}</div></div>
      <div style="display:flex;flex-direction:column;gap:6px">
        <button class="small-btn" onclick="deleteNote(${n.note_id})">Delete</button>
      </div>`;
    out.appendChild(div);
  });
}
document.getElementById('add-note').addEventListener('click', ()=>{
  const title = document.getElementById('note-title').value.trim();
  const content = document.getElementById('note-content').value.trim();
  const subject_id = +document.getElementById('note-subject').value;
  if(!title || !content){ alert('Enter title & content'); return; }
  const notes = DB('notes');
  const nid = notes.length? Math.max(...notes.map(n=>n.note_id))+1 : 1;
  notes.push({ note_id:nid, teacher_id:teacher.teacher_id, subject_id, title, content, file_url:''});
  SET('notes', notes);
  document.getElementById('note-title').value=''; document.getElementById('note-content').value='';
  loadTeacherNotes();
  alert('Note added - students will see it');
});
window.deleteNote = function(note_id){
  let notes = DB('notes'); notes = notes.filter(n=>n.note_id !== note_id);
  SET('notes', notes); loadTeacherNotes(); alert('Note deleted');
}
loadTeacherNotes();

// ---------------- Notices Management ----------------
function loadTeacherNotices(){
  const out = document.getElementById('teacher-notice-list'); out.innerHTML='';
  const nts = DB('notices').filter(n=>n.teacher_id === teacher.teacher_id);
  nts.forEach(n=>{
    const div = document.createElement('div'); div.className='subject-card';
    div.innerHTML = `<div><strong>${n.title}</strong><div class="sub-meta">${n.date} - ${n.notice_type}</div><div>${n.description}</div></div>
      <div><button class="small-btn" onclick="deleteNotice(${n.notice_id})">Delete</button></div>`;
    out.appendChild(div);
  });
}
document.getElementById('add-notice').addEventListener('click', ()=>{
  const type = document.getElementById('notice-type').value;
  const title = document.getElementById('notice-title').value.trim();
  const date = document.getElementById('notice-date').value;
  const desc = document.getElementById('notice-desc').value.trim();
  if(!title || !date || !desc){ alert('Fill fields'); return; }
  const nts = DB('notices');
  const nid = nts.length? Math.max(...nts.map(n=>n.notice_id))+1 : 1;
  nts.push({ notice_id:nid, teacher_id:teacher.teacher_id, notice_type:type, title, description:desc, date });
  SET('notices', nts);
  document.getElementById('notice-title').value=''; document.getElementById('notice-desc').value=''; document.getElementById('notice-date').value='';
  loadTeacherNotices(); alert('Notice added');
});
window.deleteNotice = function(nid){
  let nts = DB('notices'); nts = nts.filter(n=>n.notice_id!==nid); SET('notices', nts); loadTeacherNotices(); alert('Deleted');
}
loadTeacherNotices();

// ---------------- Syllabus Management ----------------
function loadTeacherSyll(){
  const out = document.getElementById('teacher-syll-list'); out.innerHTML='';
  const syl = DB('syllabus').filter(s=>s.subject_id); // all
  syl.forEach(s=>{
    const subj = subjects.find(ss=>ss.subject_id===s.subject_id)?.subject_name || '';
    const div = document.createElement('div'); div.className='subject-card';
    div.innerHTML = `<div><strong>${subj} (${s.syllabus_type})</strong><div class="sub-meta">${s.exam_name || ''}</div><div>${s.syllabus_content}</div></div>
      <div><button class="small-btn" onclick="deleteSyll(${s.syllabus_id})">Delete</button></div>`;
    out.appendChild(div);
  });
}
document.getElementById('add-syll').addEventListener('click', ()=>{
  const subject_id = +document.getElementById('syll-subject').value;
  const type = document.getElementById('syll-type').value;
  const exam_name = document.getElementById('syll-exam-name').value.trim();
  const content = document.getElementById('syll-content').value.trim();
  if(!content){ alert('Enter syllabus content'); return; }
  const syl = DB('syllabus');
  const id = syl.length? Math.max(...syl.map(x=>x.syllabus_id))+1:1;
  syl.push({ syllabus_id:id, subject_id, syllabus_type:type, exam_name, syllabus_content:content, uploaded_at: new Date().toISOString() });
  SET('syllabus', syl);
  document.getElementById('syll-exam-name').value=''; document.getElementById('syll-content').value='';
  loadTeacherSyll(); alert('Syllabus saved');
});
window.deleteSyll = function(id){ let s=DB('syllabus'); s=s.filter(x=>x.syllabus_id!==id); SET('syllabus', s); loadTeacherSyll(); alert('Deleted'); }
loadTeacherSyll();

// TAB switch helper
function openTab(id, btn){ document.querySelectorAll('.tab-button').forEach(b=>b.classList.remove('active')); if(btn) btn.classList.add('active'); document.querySelectorAll('.tab-content').forEach(tc=>tc.style.display='none'); document.getElementById(id).style.display='block'; }
window.openTab = openTab;
