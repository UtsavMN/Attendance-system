// In-Browser Persistent Database Engine for Standalone / Vercel Showcase Deployment
// Stores all data permanently in browser localStorage with zero external cloud database dependencies.

export interface StoredStudent {
  id: number;
  admission_number: string;
  admission_date: string;
  first_name: string;
  last_name: string;
  full_name: string;
  date_of_birth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  blood_group: string;
  photo_url?: string;
  email: string;
  phone: string;
  address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relation: string;
  medical_notes: string;
  previous_school: string;
  status: 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'SUSPENDED' | 'ARCHIVED';
  class_id: number;
  section_id: number;
  roll_number: string;
  guardian_name?: string;
  guardian_relationship?: string;
  guardian_phone?: string;
  guardian_email?: string;
}

export interface StoredClass {
  id: number;
  name: string;
  code: string;
  order_index: number;
  sections: Array<{ id: number; class_group: number; name: string; room_number: string; student_count: number }>;
  subjects: Array<{ id: number; name: string; code: string; is_elective: boolean; credit_hours: string }>;
}

export interface StoredAttendanceRecord {
  id: number;
  date: string;
  class_id: number;
  section_id: number;
  subject_id?: number | null;
  subject_name?: string;
  session_type: string;
  timestamp: string;
  records: Array<{ student_id: number; status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'; remarks: string }>;
}

export interface StoredExam {
  id: number;
  name: string;
  term: string;
  start_date: string;
  end_date: string;
  is_published: boolean;
  exam_subjects: Array<{
    id: number;
    examination_id: number;
    class_id: number;
    class_name: string;
    subject_id: number;
    subject_name: string;
    max_marks: number;
    pass_marks: number;
  }>;
}

export interface StoredMark {
  id: number;
  exam_subject_id: number;
  student_id: number;
  marks_obtained: number | null;
  is_absent: boolean;
  remarks: string;
}

const STORAGE_KEY = 'scholaris_browser_db_v2';

const getInitialData = () => ({
  school: {
    id: 1,
    name: 'Scholaris Academy',
    code: 'scholaris',
    motto: 'Excellence in Mind, Character in Action',
    address: '742 Evergreen Terrace, Academic District, Springfield',
    phone: '+1 (555) 382-9901',
    email: 'admissions@scholaris.edu',
    website: 'https://scholaris.edu',
    attendance_threshold: 75.0,
    warning_threshold: 85.0,
    late_penalty_weight: 0.2,
    excused_counts_as_present: false,
  },
  user: {
    id: 1,
    username: 'admin',
    email: 'admin@scholaris.edu',
    first_name: 'Eleanor',
    last_name: 'Sterling',
    full_name: 'Eleanor Sterling',
    role: 'SUPER_ADMIN',
    school: 1,
    school_name: 'Scholaris Academy',
    phone_number: '+1 (555) 100-0001',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    is_active: true,
  },
  academicYears: [
    { id: 4, school: 1, name: '2025-2026', start_date: '2025-06-01', end_date: '2026-05-31', is_current: true }
  ],
  classes: [
    {
      id: 10,
      name: 'Grade 7',
      code: 'G07',
      order_index: 1,
      sections: [{ id: 10, class_group: 10, name: 'A', room_number: '104', student_count: 1 }],
      subjects: [{ id: 18, name: 'dsa', code: 'bsidsa', is_elective: false, credit_hours: '3.00' }]
    },
    {
      id: 5,
      name: 'Grade 9',
      code: 'G9',
      order_index: 2,
      sections: [{ id: 7, class_group: 5, name: 'A', room_number: 'Room 105', student_count: 0 }],
      subjects: [
        { id: 13, name: 'Mathematics', code: 'MATH-101', is_elective: false, credit_hours: '4.00' },
        { id: 14, name: 'Science', code: 'SCI-101', is_elective: false, credit_hours: '4.00' }
      ]
    },
    {
      id: 6,
      name: 'Grade 10',
      code: 'G10',
      order_index: 3,
      sections: [{ id: 5, class_group: 6, name: 'A', room_number: 'Lab 201', student_count: 0 }],
      subjects: [
        { id: 13, name: 'Mathematics', code: 'MATH-101', is_elective: false, credit_hours: '4.00' },
        { id: 14, name: 'Science', code: 'SCI-101', is_elective: false, credit_hours: '4.00' }
      ]
    }
  ] as StoredClass[],
  students: [
    {
      id: 73,
      admission_number: 'ADM-2025-232',
      admission_date: '2026-11-10',
      first_name: 'Utsav',
      last_name: 'M N',
      full_name: 'Utsav M N',
      date_of_birth: '2006-03-06',
      gender: 'MALE',
      blood_group: 'O+',
      photo_url: '',
      email: '',
      phone: '',
      address: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      emergency_contact_relation: 'Parent',
      medical_notes: '',
      previous_school: 'None',
      status: 'ACTIVE',
      class_id: 10,
      section_id: 10,
      roll_number: '231',
      guardian_name: 'Natesh M G',
      guardian_relationship: 'Father',
      guardian_phone: '',
      guardian_email: ''
    }
  ] as StoredStudent[],
  attendanceSessions: [
    {
      id: 1,
      date: new Date().toISOString().split('T')[0],
      class_id: 10,
      section_id: 10,
      subject_id: 18,
      subject_name: 'dsa',
      session_type: 'SUBJECT_WISE',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      records: [{ student_id: 73, status: 'PRESENT', remarks: 'Marked on time' }]
    }
  ] as StoredAttendanceRecord[],
  examinations: [
    {
      id: 9,
      name: 'dsa',
      term: 'Term 1',
      start_date: '2026-11-10',
      end_date: '2026-11-15',
      is_published: true,
      exam_subjects: [
        {
          id: 46,
          examination_id: 9,
          class_id: 10,
          class_name: 'Grade 7',
          subject_id: 18,
          subject_name: 'dsa',
          max_marks: 100,
          pass_marks: 40
        }
      ]
    }
  ] as StoredExam[],
  marks: [
    {
      id: 547,
      exam_subject_id: 46,
      student_id: 73,
      marks_obtained: 85.0,
      is_absent: false,
      remarks: 'Excellent performance'
    }
  ] as StoredMark[],
  gradingScales: [
    { id: 1, grade: 'A+', min_percentage: 90, max_percentage: 100, gpa: 4.0, description: 'Outstanding' },
    { id: 2, grade: 'A', min_percentage: 80, max_percentage: 89.99, gpa: 3.7, description: 'Excellent' },
    { id: 3, grade: 'B', min_percentage: 70, max_percentage: 79.99, gpa: 3.0, description: 'Very Good' },
    { id: 4, grade: 'C', min_percentage: 60, max_percentage: 69.99, gpa: 2.0, description: 'Satisfactory' },
    { id: 5, grade: 'D', min_percentage: 40, max_percentage: 59.99, gpa: 1.0, description: 'Pass' },
    { id: 6, grade: 'F', min_percentage: 0, max_percentage: 39.99, gpa: 0.0, description: 'Fail' }
  ],
  notifications: [
    { id: 1, title: 'Welcome to Scholaris', message: 'Turnkey attendance & academic management system initialized in open-access mode.', type: 'SYSTEM', is_read: false, created_at: new Date().toISOString() }
  ]
});

// Load DB from localStorage or seed
export const loadDb = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading browser DB:', e);
  }
  const initial = getInitialData();
  saveDb(initial);
  return initial;
};

export const saveDb = (db: any) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (e) {
    console.error('Error writing browser DB:', e);
  }
};

const getGradeForScore = (pct: number | null) => {
  if (pct === null || isNaN(pct)) return { grade: '-', gpa: null };
  if (pct >= 90) return { grade: 'A+', gpa: 4.0 };
  if (pct >= 80) return { grade: 'A', gpa: 3.7 };
  if (pct >= 70) return { grade: 'B', gpa: 3.0 };
  if (pct >= 60) return { grade: 'C', gpa: 2.0 };
  if (pct >= 40) return { grade: 'D', gpa: 1.0 };
  return { grade: 'F', gpa: 0.0 };
};

// Dispatcher for API endpoints
export const handleMockRequest = async (method: string, url: string, data?: any) => {
  const db = loadDb();
  const cleanUrl = url.split('?')[0];
  const queryParams = new URLSearchParams(url.includes('?') ? url.split('?')[1] : '');

  // 1. Auth Me
  if (cleanUrl === '/api/auth/me/') {
    return { data: { user: db.user, school: db.school } };
  }

  // 2. Academic Years
  if (cleanUrl === '/api/academic-years/') {
    return { data: db.academicYears };
  }

  // 3. Classes
  if (cleanUrl === '/api/classes/') {
    if (method.toUpperCase() === 'POST') {
      const newClass: StoredClass = {
        id: Date.now(),
        name: data.name,
        code: data.code || `G${db.classes.length + 1}`,
        order_index: db.classes.length + 1,
        sections: [{ id: Date.now() + 1, class_group: Date.now(), name: 'A', room_number: '101', student_count: 0 }],
        subjects: []
      };
      db.classes.push(newClass);
      saveDb(db);
      return { data: newClass };
    }
    // Update student counts in classes
    const classes = db.classes.map((c: StoredClass) => {
      const classStudents = db.students.filter((s: StoredStudent) => s.class_id === c.id && s.status === 'ACTIVE');
      return {
        ...c,
        total_students: classStudents.length,
        subjects_count: c.subjects?.length || 0,
        sections: c.sections?.map((sec) => ({
          ...sec,
          student_count: classStudents.filter((s: StoredStudent) => s.section_id === sec.id).length
        }))
      };
    });
    return { data: classes };
  }

  // Add Section
  if (cleanUrl === '/api/sections/' && method.toUpperCase() === 'POST') {
    const classObj = db.classes.find((c: StoredClass) => c.id === parseInt(data.class_group));
    if (classObj) {
      const newSec = { id: Date.now(), class_group: classObj.id, name: data.name, room_number: data.room_number || '', student_count: 0 };
      classObj.sections.push(newSec);
      saveDb(db);
      return { data: newSec };
    }
  }

  // Add Subject
  if (cleanUrl === '/api/subjects/') {
    if (method.toUpperCase() === 'POST') {
      const newSub = {
        id: Date.now(),
        school: 1,
        name: data.name,
        code: data.code || `SUB-${Date.now().toString().slice(-4)}`,
        is_elective: false,
        credit_hours: '3.00'
      };
      // Assign to class if specified
      if (data.class_id) {
        const c = db.classes.find((item: StoredClass) => item.id === parseInt(data.class_id));
        if (c) {
          c.subjects = c.subjects || [];
          c.subjects.push(newSub);
        }
      }
      saveDb(db);
      return { data: newSub };
    }
    const allSubjects = db.classes.flatMap((c: StoredClass) => c.subjects || []);
    return { data: allSubjects };
  }

  // Assign Subject to Class
  if (cleanUrl.match(/\/api\/classes\/\d+\/assign-subject\//)) {
    const classId = parseInt(cleanUrl.split('/')[3]);
    const c = db.classes.find((item: StoredClass) => item.id === classId);
    if (c) {
      c.subjects = c.subjects || [];
      const newSub = {
        id: Date.now(),
        name: data.name || 'Subject',
        code: data.code || 'SUB-101',
        is_elective: false,
        credit_hours: '3.00'
      };
      c.subjects.push(newSub);
      saveDb(db);
      return { data: newSub };
    }
  }

  // 4. Students
  if (cleanUrl === '/api/students/') {
    if (method.toUpperCase() === 'POST') {
      const newStudent: StoredStudent = {
        id: Date.now(),
        admission_number: data.admission_number,
        admission_date: data.admission_date || new Date().toISOString().split('T')[0],
        first_name: data.first_name,
        last_name: data.last_name,
        full_name: `${data.first_name} ${data.last_name}`,
        date_of_birth: data.date_of_birth,
        gender: data.gender,
        blood_group: data.blood_group || 'O+',
        photo_url: data.photo_url || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        emergency_contact_name: data.emergency_contact_name || '',
        emergency_contact_phone: data.emergency_contact_phone || '',
        emergency_contact_relation: data.emergency_contact_relation || 'Parent',
        medical_notes: data.medical_notes || '',
        previous_school: data.previous_school || '',
        status: data.status || 'ACTIVE',
        class_id: parseInt(data.class_id),
        section_id: parseInt(data.section_id),
        roll_number: data.roll_number || `${db.students.length + 101}`,
        guardian_name: data.guardian_name || '',
        guardian_relationship: data.guardian_relationship || 'Father',
        guardian_phone: data.guardian_phone || '',
        guardian_email: data.guardian_email || ''
      };
      db.students.push(newStudent);
      saveDb(db);
      return { data: newStudent };
    }

    // List students with filters
    const classFilter = queryParams.get('class_id');
    const searchFilter = queryParams.get('search')?.toLowerCase();
    let filtered = db.students.filter((s: StoredStudent) => s.status === 'ACTIVE');

    if (classFilter) {
      filtered = filtered.filter((s: StoredStudent) => s.class_id === parseInt(classFilter));
    }
    if (searchFilter) {
      filtered = filtered.filter((s: StoredStudent) =>
        s.full_name.toLowerCase().includes(searchFilter) ||
        s.admission_number.toLowerCase().includes(searchFilter)
      );
    }

    const results = filtered.map((s: StoredStudent) => {
      const c = db.classes.find((item: StoredClass) => item.id === s.class_id);
      const sec = c?.sections?.find((item: any) => item.id === s.section_id);

      // Calculate attendance
      const sessions = db.attendanceSessions.filter((sess: StoredAttendanceRecord) =>
        sess.records.some((r) => r.student_id === s.id)
      );
      const presentCount = sessions.filter((sess: StoredAttendanceRecord) =>
        sess.records.some((r) => r.student_id === s.id && (r.status === 'PRESENT' || r.status === 'LATE'))
      ).length;
      const attPct = sessions.length > 0 ? Math.round((presentCount / sessions.length) * 100) : 100;

      // Calculate marks
      const marks = db.marks.filter((m: StoredMark) => m.student_id === s.id && !m.is_absent && m.marks_obtained !== null);
      const avgMark = marks.length > 0
        ? Math.round(marks.reduce((acc: number, cur: StoredMark) => acc + (cur.marks_obtained || 0), 0) / marks.length)
        : null;

      return {
        id: s.id,
        admission_number: s.admission_number,
        first_name: s.first_name,
        last_name: s.last_name,
        full_name: s.full_name,
        gender: s.gender,
        date_of_birth: s.date_of_birth,
        photo_url: s.photo_url,
        status: s.status,
        current_class: c?.name || '-',
        current_section: sec?.name || '-',
        roll_number: s.roll_number,
        attendance_percentage: attPct,
        academic_average: avgMark
      };
    });

    return { data: { count: results.length, results } };
  }

  // Delete Student
  if (cleanUrl.match(/\/api\/students\/\d+\/$/) && method.toUpperCase() === 'DELETE') {
    const studentId = parseInt(cleanUrl.split('/')[3]);
    db.students = db.students.filter((s: StoredStudent) => s.id !== studentId);
    saveDb(db);
    return { data: { detail: 'Student deleted successfully' } };
  }

  // Student Full Profile
  if (cleanUrl.match(/\/api\/students\/\d+\/full-profile\/$/)) {
    const studentId = parseInt(cleanUrl.split('/')[3]);
    const student = db.students.find((s: StoredStudent) => s.id === studentId) || db.students[0];
    const c = db.classes.find((item: StoredClass) => item.id === student.class_id);
    const sec = c?.sections?.find((item: any) => item.id === student.section_id);

    // Attendance records
    const records = db.attendanceSessions
      .map((sess: StoredAttendanceRecord) => {
        const r = sess.records.find((rec) => rec.student_id === student.id);
        if (!r) return null;
        return {
          id: sess.id,
          date: sess.date,
          status: r.status,
          remarks: r.remarks,
          session_type: sess.session_type,
          subject_name: sess.subject_name || 'General'
        };
      })
      .filter(Boolean);

    const totalSessions = records.length;
    const presentCount = records.filter((r: any) => r.status === 'PRESENT').length;
    const absentCount = records.filter((r: any) => r.status === 'ABSENT').length;
    const lateCount = records.filter((r: any) => r.status === 'LATE').length;
    const attPct = totalSessions > 0 ? Math.round(((presentCount + lateCount * 0.8) / totalSessions) * 100) : 100;

    // Academic marks
    const studentMarks = db.marks.filter((m: StoredMark) => m.student_id === student.id);
    const examsList = db.examinations.map((ex: StoredExam) => {
      const subjects = ex.exam_subjects.map((es) => {
        const m = studentMarks.find((mk: StoredMark) => mk.exam_subject_id === es.id);
        const obt = m ? m.marks_obtained : null;
        const pct = obt !== null ? Math.round((obt / es.max_marks) * 100) : 0;
        const gradeInfo = getGradeForScore(pct);
        return {
          subject: es.subject_name,
          max_marks: es.max_marks,
          pass_marks: es.pass_marks,
          marks_obtained: obt,
          is_absent: m ? m.is_absent : false,
          percentage: pct,
          grade: gradeInfo.grade,
          remarks: m?.remarks || 'Good progress'
        };
      });

      const validPcts = subjects.filter((s) => s.marks_obtained !== null).map((s) => s.percentage);
      const avgPct = validPcts.length > 0 ? Math.round(validPcts.reduce((a, b) => a + b, 0) / validPcts.length) : null;
      const exGrade = getGradeForScore(avgPct);

      return {
        exam_id: ex.id,
        exam_name: ex.name,
        term: ex.term,
        subjects,
        average_percentage: avgPct,
        overall_grade: exGrade.grade,
        is_published: ex.is_published
      };
    });

    const evaluatedMarks = studentMarks.filter((m: StoredMark) => m.marks_obtained !== null && !m.is_absent);
    const overallAvg = evaluatedMarks.length > 0
      ? Math.round(evaluatedMarks.reduce((a: number, b: StoredMark) => a + (b.marks_obtained || 0), 0) / evaluatedMarks.length)
      : null;
    const overallGrade = getGradeForScore(overallAvg);

    return {
      data: {
        student: {
          ...student,
          current_enrollment: {
            class_name: c?.name || 'Grade 7',
            section_name: sec?.name || 'A',
            roll_number: student.roll_number
          }
        },
        attendance_summary: {
          total_sessions: totalSessions,
          present_count: presentCount,
          absent_count: absentCount,
          late_count: lateCount,
          excused_count: 0,
          percentage: attPct,
          is_low_attendance: attPct < 75,
          threshold: 75,
          monthly_breakdown: [
            { month: '2026-11', total: totalSessions, present: presentCount, absent: absentCount, late: lateCount, percentage: attPct }
          ],
          recent_records: records
        },
        academic_summary: {
          overall_average: overallAvg,
          overall_grade: overallGrade.grade,
          current_gpa: overallGrade.gpa,
          examinations: examsList,
          subject_performance: (c?.subjects || []).map((sub: any) => {
            const m = studentMarks.find((mk: StoredMark) => mk.exam_subject_id === 46);
            const score = m ? m.marks_obtained : overallAvg;
            return {
              subject: sub.name,
              average: score,
              grade: getGradeForScore(score).grade,
              assessments_count: 1
            };
          }),
          strengths: (overallAvg && overallAvg >= 75) ? [{ subject: 'dsa', average: overallAvg, grade: overallGrade.grade }] : [],
          weaknesses: []
        },
        remarks: [],
        achievements: []
      }
    };
  }

  // 5. Attendance Marking
  if (cleanUrl === '/api/attendance/mark/' && method.toUpperCase() === 'POST') {
    const newSession: StoredAttendanceRecord = {
      id: Date.now(),
      date: data.date,
      class_id: parseInt(data.class_id),
      section_id: parseInt(data.section_id),
      subject_id: data.subject_id ? parseInt(data.subject_id) : null,
      subject_name: data.subject_name || 'Subject Session',
      session_type: data.session_type || 'SUBJECT_WISE',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      records: data.records
    };
    db.attendanceSessions.push(newSession);
    saveDb(db);
    return { data: { detail: 'Attendance recorded successfully', session_id: newSession.id } };
  }

  if (cleanUrl === '/api/attendance/') {
    return { data: db.attendanceSessions };
  }

  // 6. Examinations & Marks
  if (cleanUrl === '/api/examinations/') {
    if (method.toUpperCase() === 'POST') {
      const newExam: StoredExam = {
        id: Date.now(),
        name: data.name,
        term: data.term || 'Term 1',
        start_date: data.start_date || new Date().toISOString().split('T')[0],
        end_date: data.end_date || new Date().toISOString().split('T')[0],
        is_published: false,
        exam_subjects: []
      };
      db.examinations.push(newExam);
      saveDb(db);
      return { data: newExam };
    }
    return { data: db.examinations };
  }

  if (cleanUrl === '/api/exam-subjects/' && method.toUpperCase() === 'POST') {
    const ex = db.examinations.find((item: StoredExam) => item.id === parseInt(data.examination));
    const c = db.classes.find((item: StoredClass) => item.id === parseInt(data.class_group));
    const allSubs = db.classes.flatMap((cl: StoredClass) => cl.subjects || []);
    const sub = allSubs.find((s: any) => s.id === parseInt(data.subject));

    if (ex && c) {
      const newES = {
        id: Date.now(),
        examination_id: ex.id,
        class_id: c.id,
        class_name: c.name,
        subject_id: sub ? sub.id : 18,
        subject_name: sub ? sub.name : 'dsa',
        max_marks: Number(data.max_marks) || 100,
        pass_marks: Number(data.pass_marks) || 40
      };
      ex.exam_subjects.push(newES);
      saveDb(db);
      return { data: newES };
    }
  }

  if (cleanUrl.match(/\/api\/examinations\/\d+\/publish\/$/)) {
    const examId = parseInt(cleanUrl.split('/')[3]);
    const ex = db.examinations.find((item: StoredExam) => item.id === examId);
    if (ex) {
      ex.is_published = true;
      saveDb(db);
      return { data: { detail: 'Examination published' } };
    }
  }

  // Marks Sheet Roster
  if (cleanUrl === '/api/marks/sheet/') {
    const esId = parseInt(queryParams.get('exam_subject_id') || '46');
    const allExamSubs = db.examinations.flatMap((e: StoredExam) => e.exam_subjects);
    const targetES = allExamSubs.find((es: any) => es.id === esId) || allExamSubs[0];

    const enrolledStudents = db.students.filter((s: StoredStudent) => s.class_id === targetES?.class_id && s.status === 'ACTIVE');
    const roster = enrolledStudents.map((st: StoredStudent) => {
      const m = db.marks.find((mk: StoredMark) => mk.exam_subject_id === esId && mk.student_id === st.id);
      return {
        student_id: st.id,
        full_name: st.full_name,
        admission_number: st.admission_number,
        roll_number: st.roll_number,
        marks_obtained: m ? m.marks_obtained : null,
        is_absent: m ? m.is_absent : false,
        remarks: m ? m.remarks : '',
        grade: m && m.marks_obtained !== null ? getGradeForScore((m.marks_obtained / (targetES?.max_marks || 100)) * 100).grade : '-'
      };
    });

    return {
      data: {
        exam_subject: targetES,
        students: roster
      }
    };
  }

  // Save Marks Entry
  if (cleanUrl === '/api/marks/entry/' && method.toUpperCase() === 'POST') {
    const { exam_subject_id, marks } = data;
    marks.forEach((entry: any) => {
      const existing = db.marks.find((m: StoredMark) => m.exam_subject_id === exam_subject_id && m.student_id === entry.student_id);
      if (existing) {
        existing.marks_obtained = entry.marks_obtained;
        existing.is_absent = entry.is_absent;
        existing.remarks = entry.remarks;
      } else {
        db.marks.push({
          id: Date.now() + Math.floor(Math.random() * 1000),
          exam_subject_id,
          student_id: entry.student_id,
          marks_obtained: entry.marks_obtained,
          is_absent: entry.is_absent,
          remarks: entry.remarks
        });
      }
    });
    saveDb(db);
    return { data: { detail: 'Marks saved successfully' } };
  }

  // 7. Class Analysis (Reports & Analytics Graphs)
  if (cleanUrl === '/api/reports/class-analysis/') {
    const classAnalysis = db.classes.map((c: StoredClass) => {
      const enrolled = db.students.filter((s: StoredStudent) => s.class_id === c.id && s.status === 'ACTIVE');
      const sessions = db.attendanceSessions.filter((sess: StoredAttendanceRecord) => sess.class_id === c.id);

      let attPct = 0;
      if (sessions.length > 0) {
        const totalRecords = sessions.flatMap((s: StoredAttendanceRecord) => s.records);
        const presents = totalRecords.filter((r: any) => r.status === 'PRESENT' || r.status === 'LATE').length;
        attPct = Math.round((presents / totalRecords.length) * 100);
      }

      const classMarks = db.marks.filter((m: StoredMark) =>
        enrolled.some((st: StoredStudent) => st.id === m.student_id) && !m.is_absent && m.marks_obtained !== null
      );
      const acadAvg = classMarks.length > 0
        ? Math.round(classMarks.reduce((a: number, b: StoredMark) => a + (b.marks_obtained || 0), 0) / classMarks.length)
        : null;
      const passRate = classMarks.length > 0
        ? Math.round((classMarks.filter((m: StoredMark) => (m.marks_obtained || 0) >= 40).length / classMarks.length) * 100)
        : null;
      const gradeInfo = getGradeForScore(acadAvg);

      return {
        class_id: c.id,
        class_name: c.name,
        code: c.code,
        student_count: enrolled.length,
        attendance_percentage: attPct,
        total_attendance_sessions: sessions.length,
        present_count: sessions.length > 0 ? 1 : 0,
        absent_count: 0,
        academic_average: acadAvg,
        pass_rate: passRate,
        overall_grade: gradeInfo.grade,
        gpa: gradeInfo.gpa,
        evaluated_assessments: classMarks.length
      };
    });

    const evaluated = classAnalysis.filter((c: any) => c.academic_average !== null);
    const activeSessions = classAnalysis.filter((c: any) => c.total_attendance_sessions > 0);

    return {
      data: {
        classes: classAnalysis,
        summary: {
          total_classes: classAnalysis.length,
          total_enrolled: db.students.filter((s: StoredStudent) => s.status === 'ACTIVE').length,
          school_attendance_avg: activeSessions.length > 0
            ? Math.round(activeSessions.reduce((a: number, b: any) => a + b.attendance_percentage, 0) / activeSessions.length)
            : 100,
          school_academic_avg: evaluated.length > 0
            ? Math.round(evaluated.reduce((a: number, b: any) => a + b.academic_average, 0) / evaluated.length)
            : 85,
          evaluated_classes_count: evaluated.length
        }
      }
    };
  }

  // 8. Dashboard Overview
  if (cleanUrl === '/api/dashboard/overview/') {
    const totalStudents = db.students.filter((s: StoredStudent) => s.status === 'ACTIVE').length;
    return {
      data: {
        total_students: totalStudents,
        present_today: totalStudents > 0 ? totalStudents : 0,
        absent_today: 0,
        attendance_percentage: 100.0,
        total_classes: db.classes.length,
        students_requiring_attention: 0,
        attendance_distribution: { present: totalStudents, absent: 0, late: 0, excused: 0 },
        attendance_trend: [
          { date: 'Nov 07', percentage: 100 },
          { date: 'Nov 08', percentage: 100 },
          { date: 'Nov 09', percentage: 100 },
          { date: 'Nov 10', percentage: 100 }
        ],
        recent_activity: [
          { id: 1, action: 'ATTENDANCE_RECORDED', description: 'Attendance marked for Grade 7 - A in dsa', timestamp: 'Today' },
          { id: 2, action: 'MARKS_PUBLISHED', description: 'Examination marks published for dsa', timestamp: 'Today' }
        ]
      }
    };
  }

  // 9. Grading scales
  if (cleanUrl === '/api/grading-scales/') {
    return { data: db.gradingScales };
  }

  // 10. Teachers
  if (cleanUrl === '/api/teachers/') {
    return { data: [] };
  }

  // 11. Notifications
  if (cleanUrl === '/api/notifications/') {
    return { data: db.notifications };
  }

  // Default fallback
  return { data: {} };
};
