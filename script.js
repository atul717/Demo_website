/* script.js
   - Initializes demo data if missing
   - Handles login and signup (uses localStorage as DB)
   - Redirects to student or teacher dashboard
*/

(function initDemoDB(){
  if (!localStorage.getItem('db_initialized')) {
    // users (login)
    const users = [
      { user_id: 1, email: 'student1@example.com', password: 'pass123', role: 'student' },
      { user_id: 2, email: 'teacher1@example.com', password: 'teach123', role: 'teacher' }
    ];
    // students
    const students = [
      { student_id:1, user_id:1, name:'Atul Singh', roll:'BCA2025001', class:'BCA', semester:5, photo:'https://i.pravatar.cc/300?img=12' }
    ];
    // teachers
    const teachers = [
      { teacher_id:1, user_id:2, name:'Dr. Priya Verma', department:'Computer Science' }
    ];
    // subjects (semester 5)
    const subjects = [
      { subject_id:1, subject_name:'Digital Logic', semester:5, code:'DL' },
      { subject_id:2, subject_name:'Operating Systems', semester:5, code:'OS' },
      { subject_id:3, subject_name:'Database Management System', semester:5, code:'DB' },
      { subject_id:4, subject_name:'Computer Networks', semester:5, code:'CN' },
      { subject_id:5, subject_name:'Web Development', semester:5, code:'WD' }
    ];
    // attendance (subject-wise) - total and attended classes counted
    const attendance = [
      { student_id:1, subject_id:1, total:30, attended:28 },
      { student_id:1, subject_id:2, total:32, attended:25 },
      { student_id:1, subject_id:3, total:28, attended:26 },
      { student_id:1, subject_id:4, total:30, attended:27 },
      { student_id:1, subject_id:5, total:20, attended:19 }
    ];
    // notes
    const notes = [
      { note_id:1, teacher_id:1, subject_id:1, title:'DL - Lecture 1', content:'Intro to gates and boolean algebra', file_url:'' },
      { note_id:2, teacher_id:1, subject_id:2, title:'OS - Process', content:'Process scheduling basics', file_url:'' }
    ];
    // notices - holidays between 21 July and 1 Dec sample
    const notices = [
      { notice_id:1, teacher_id:1, notice_type:'holiday', title:'Independence Day', description:'Holiday on 15 Aug', date:'2025-08-15' },
      { notice_id:2, teacher_id:1, notice_type:'other', title:'Guest Lecture', description:'Guest lecture on 5 Oct', date:'2025-10-05' }
    ];
    // syllabus entries
    const syllabus = [
      { syllabus_id:1, subject_id:2, syllabus_type:'complete', syllabus_content:'OS full syllabus...' },
      { syllabus_id:2, subject_id:2, syllabus_type:'preparation', exam_name:'Mid Term', syllabus_content:'OS topics for mid term...' }
    ];

    // teacher schedule (for realtime lecture demo) - times in 24h string HH:MM
    const schedule = [
      { teacher_id:1, day:'Mon', start:'10:00', end:'11:00', class_name:'BCA-5', subject_id:2 },
      { teacher_id:1, day:'Wed', start:'11:00', end:'12:00', class_name:'BCA-5', subject_id:3 }
    ];

    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('students', JSON.stringify(students));
    localStorage.setItem('teachers', JSON.stringify(teachers));
    localStorage.setItem('subjects', JSON.stringify(subjects));
    localStorage.setItem('attendance', JSON.stringify(attendance));
    localStorage.setItem('notes', JSON.stringify(notes));
    localStorage.setItem('notices', JSON.stringify(notices));
    localStorage.setItem('syllabus', JSON.stringify(syllabus));
    localStorage.setItem('schedule', JSON.stringify(schedule));
    localStorage.setItem('db_initialized','1');
    console.log('Demo DB initialized.');
  }
})();

/* helpers */
const DB = {
  get: key => JSON.parse(localStorage.getItem(key) || '[]'),
  set: (key,val) => localStorage.setItem(key, JSON.stringify(val)),
  push: (key,obj) => { const arr=DB.get(key); arr.push(obj); DB.set(key,arr); }
};

/* UI logic for login page */
document.addEventListener('DOMContentLoaded', () => {
  const btnStudent = document.getElementById('btn-student');
  const btnTeacher = document.getElementById('btn-teacher');
  const loginForm = document.getElementById('login-form');
  const roleTitle = document.getElementById('role-title');
  let currentRole = 'student';

  btnStudent.addEventListener('click', () => { currentRole='student'; loginForm.style.display='block'; roleTitle.innerText='Student Login'; });
  btnTeacher.addEventListener('click', () => { currentRole='teacher'; loginForm.style.display='block'; roleTitle.innerText='Teacher Login'; });

  document.getElementById('login-form').addEventListener('submit', function(e){
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const pass = document.getElementById('password').value.trim();
    const users = DB.get('users');
    const user = users.find(u => u.email === email && u.role === currentRole);
    if(user && user.password === pass){
      localStorage.setItem('logged_user', JSON.stringify({ user_id:user.user_id, role:user.role }));
      if(user.role === 'student') window.location.href = 'student_dashboard.html';
      else window.location.href = 'teacher_dashboard.html';
    } else alert('Invalid credentials. Try demo accounts: student1@example.com / pass123 or teacher1@example.com / teach123');
  });

  document.getElementById('signup-btn').addEventListener('click', ()=>{
    const email = document.getElementById('email').value.trim();
    const pass = document.getElementById('password').value.trim();
    if(!email || !pass) { alert('Enter email & password to sign up'); return; }
    const users = DB.get('users');
    if(users.find(u=>u.email===email)){ alert('User exists. Please login.'); return; }
    const newId = users.length? (Math.max(...users.map(u=>u.user_id))+1) : 1;
    users.push({ user_id:newId, email, password:pass, role:currentRole });
    DB.set('users', users);
    if(currentRole==='student'){
      const students = DB.get('students');
      const sId = students.length? (Math.max(...students.map(s=>s.student_id))+1):1;
      students.push({ student_id:sId, user_id:newId, name:email.split('@')[0], roll:'AUTO'+sId, class:'BCA', semester:5, photo:'https://i.pravatar.cc/300' });
      DB.set('students', students);
    } else {
      const teachers = DB.get('teachers');
      const tId = teachers.length? (Math.max(...teachers.map(t=>t.teacher_id))+1):1;
      teachers.push({ teacher_id:tId, user_id:newId, name:email.split('@')[0], department:'' });
      DB.set('teachers', teachers);
    }
    alert('Signup created. Now login.');
  });

});
