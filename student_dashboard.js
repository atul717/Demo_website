/* student_dashboard.js
   - Reads logged_user and shows student info
   - Shows subject-wise attendance and donut chart for overall
   - Shows notes, notices, syllabus from localStorage
*/

const DBget = k => JSON.parse(localStorage.getItem(k) || '[]');

function requireLogin(){
  const logged = JSON.parse(localStorage.getItem('logged_user') || 'null');
  if(!logged || logged.role !== 'student') {
    window.location.href = 'login.html';
    return null;
  }
  return logged;
}

const logged = requireLogin();
if(!logged) throw 'no login';

const users = DBget('users');
const students = DBget('students');
const subjects = DBget('subjects');
const attendance = DBget('attendance');
const notes = DBget('notes');
const notices = DBget('notices');
const syllabus = DBget('syllabus');

const student = students.find(s => s.user_id === logged.user_id);
if(!student) { alert('Student profile not found'); window.location.href='login.html'; }

// populate top
document.getElementById('stu-photo').src = student.photo || 'https://i.pravatar.cc/300';
document.getElementById('stu-name').innerText = student.name;
document.getElementById('stu-roll').innerText = 'Roll: ' + student.roll;
document.getElementById('stu-class').innerText = student.class + ' | Semester ' + student.semester;
document.getElementById('top-sem').innerText = 'Semester: ' + student.semester;

// TAB switching
function openTab(id, btn){
  document.querySelectorAll('.tab-button').forEach(b=>b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  document.querySelectorAll('.tab-content').forEach(tc=>tc.style.display='none');
  document.getElementById(id).style.display = 'block';
}
window.openTab = openTab;

// ATTENDANCE: display subject-wise
function showSubjectAttendance(){
  const list = document.getElementById('subject-list');
  list.innerHTML = '';
  const subs = subjects.filter(s=>s.semester === student.semester);
  subs.forEach(s => {
    const att = attendance.find(a => a.student_id === student.student_id && a.subject_id === s.subject_id) || {total:0,attended:0};
    const percent = att.total ? Math.round((att.attended/att.total)*100) : 0;
    const card = document.createElement('div');
    card.className = 'subject-card sub-' + (s.code ? s.code.toLowerCase() : s.subject_name.toLowerCase().replace(/\s/g,'-'));
    card.innerHTML = `
      <div class="sub-left">
        <div class="sub-title">${s.subject_name} (${s.code||''})</div>
        <div class="sub-meta">Attended: ${att.attended}/${att.total}</div>
      </div>
      <div class="action-row">
        <div class="${percent>=75 ? 'status-high' : 'status-low'}">${percent}%</div>
      </div>
    `;
    list.appendChild(card);
  });
}
showSubjectAttendance();

// Overall Attendance and donut chart
let chartInstance = null;
function showOverall(attPercent){
  const ctx = document.getElementById('attendanceChart').getContext('2d');
  if(chartInstance) chartInstance.destroy();
  chartInstance = new Chart(ctx, {
    type:'doughnut',
    data:{
      labels:['Present','Absent'],
      datasets:[{data:[attPercent, 100-attPercent], backgroundColor:['#4da6ff','#dc3545']}]
    },
    options:{
      cutout:'70%',
      plugins:{
        legend:{display:true, position:'bottom'},
        datalabels:{
          color:'#333',
          font:{size:18,weight:'700'},
          formatter: function(value, ctx){
            return ctx.dataIndex===0 ? attPercent + '%' : '';
          }
        }
      }
    },
    plugins:[ChartDataLabels]
  });
}

// compute overall percent based on subject totals
function computeOverall(){
  const subs = subjects.filter(s=>s.semester === student.semester);
  let sumAtt=0, sumTot=0;
  subs.forEach(s=>{
    const a = attendance.find(x=>x.student_id===student.student_id && x.subject_id===s.subject_id);
    if(a){ sumAtt += a.attended; sumTot += a.total; }
  });
  const percent = sumTot ? Math.round((sumAtt/sumTot)*100) : 0;
  return percent;
}

document.getElementById('btn-overall').addEventListener('click', ()=>{
  const p = computeOverall();
  showOverall(p);
});

// initial overall
showOverall(computeOverall());

// NOTES
function loadNotes(){
  const notesList = document.getElementById('notes-list'); notesList.innerHTML='';
  const subs = subjects.filter(s=>s.semester===student.semester);
  subs.forEach(s=>{
    const area = document.createElement('div'); area.className='tab-content';
    area.style.marginBottom='10px';
    area.innerHTML = `<div style="font-weight:700;color:#333">${s.subject_name}</div>`;
    const nForSub = notes.filter(n=>n.subject_id===s.subject_id);
    if(nForSub.length===0) area.innerHTML += `<div class="sub-meta">No notes yet</div>`;
    else {
      const ul = document.createElement('ul');
      nForSub.forEach(n=>{
        const li = document.createElement('li');
        li.innerHTML = `<strong>${n.title}</strong> - ${n.content} ${n.file_url?`<a href="${n.file_url}" target="_blank">[file]</a>`:''}`;
        ul.appendChild(li);
      });
      area.appendChild(ul);
    }
    notesList.appendChild(area);
  });
}
loadNotes();

// NOTICES
function loadNotices(){
  const hol = document.getElementById('holiday-list');
  const other = document.getElementById('other-notice-list');
  hol.innerHTML=''; other.innerHTML='';
  const nts = DBget('notices');
  nts.forEach(n=>{
    const li = document.createElement('li');
    li.innerText = `${n.title} - ${n.description} (${n.date})`;
    if(n.notice_type === 'holiday') hol.appendChild(li);
    else other.appendChild(li);
  });
}
loadNotices();

// SYLLABUS
function loadSyllabus(){
  const prep = document.getElementById('prep-list');
  const comp = document.getElementById('complete-syllabus');
  prep.innerHTML=''; comp.innerHTML='';
  const subs = subjects.filter(s=>s.semester===student.semester);
  subs.forEach(s=>{
    const sblock = document.createElement('div');
    sblock.style.marginBottom='8px';
    sblock.innerHTML = `<div style="font-weight:700">${s.subject_name}</div>`;
    const prepItems = syllabus.filter(x=>x.subject_id===s.subject_id && x.syllabus_type==='preparation');
    const compItems = syllabus.filter(x=>x.subject_id===s.subject_id && x.syllabus_type==='complete');
    if(prepItems.length){
      prepItems.forEach(p=> sblock.innerHTML += `<div class="sub-meta">Exam: ${p.exam_name} - ${p.syllabus_content}</div>`);
    }
    if(compItems.length){
      compItems.forEach(c=> sblock.innerHTML += `<div class="sub-meta">Complete: ${c.syllabus_content}</div>`);
    }
    comp.appendChild(sblock.cloneNode(true));
    prep.appendChild(sblock);
  });
}
loadSyllabus();

// default active tab is attendance
openTab('attendance', document.querySelector('.tab-button.active'));
