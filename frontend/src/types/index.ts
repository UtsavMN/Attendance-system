export type UserRole = 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'TEACHER' | 'PARENT';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: UserRole;
  school: number | null;
  school_name?: string;
  phone_number?: string;
  avatar_url?: string;
  is_active: boolean;
}

export interface School {
  id: number;
  name: string;
  code: string;
  motto?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo_url?: string;
  attendance_threshold: string | number;
  warning_threshold: string | number;
  late_penalty_weight: string | number;
  excused_counts_as_present: boolean;
}

export interface AcademicYear {
  id: number;
  school: number;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

export interface ClassGroup {
  id: number;
  school: number;
  name: string;
  code: string;
  order_index: number;
  sections?: Section[];
  subjects?: Subject[];
  subjects_count?: number;
  total_students?: number;
}

export interface Section {
  id: number;
  class_group: number;
  name: string;
  room_number?: string;
  class_teacher?: number | null;
  class_teacher_name?: string;
  student_count?: number;
}

export interface Subject {
  id: number;
  school: number;
  name: string;
  code: string;
  is_elective: boolean;
  credit_hours: string | number;
  description?: string;
}

export interface Teacher {
  id: number;
  school: number;
  user: User;
  employee_id: string;
  designation: string;
  department: string;
  qualification: string;
  joining_date?: string;
  is_active: boolean;
  name: string;
  email: string;
  phone: string;
  assigned_sections_count: number;
}

export interface StudentListItem {
  id: number;
  admission_number: string;
  first_name: string;
  last_name: string;
  full_name: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  date_of_birth: string;
  photo_url?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'SUSPENDED' | 'ARCHIVED';
  current_class: string;
  current_section: string;
  roll_number: string;
  attendance_percentage: number;
  academic_average: number | null;
}

export interface Guardian {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  relationship: string;
  phone: string;
  email: string;
  occupation?: string;
  address?: string;
}

export interface StudentRemark {
  id: number;
  student: number;
  author: number;
  author_name: string;
  category: 'ACADEMIC' | 'DISCIPLINE' | 'ATTENDANCE' | 'ACHIEVEMENT' | 'GENERAL';
  severity: 'POSITIVE' | 'NEUTRAL' | 'WARNING' | 'CRITICAL';
  title: string;
  description: string;
  date: string;
  created_at: string;
}

export interface StudentAchievement {
  id: number;
  student: number;
  title: string;
  category: string;
  award_level?: string;
  description?: string;
  award_date: string;
  certificate_url?: string;
}

export interface StudentFullProfile {
  student: {
    id: number;
    school: number;
    admission_number: string;
    admission_date: string;
    first_name: string;
    last_name: string;
    full_name: string;
    date_of_birth: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    blood_group?: string;
    photo_url?: string;
    email?: string;
    phone?: string;
    address?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    emergency_contact_relation?: string;
    medical_notes?: string;
    previous_school?: string;
    status: string;
    guardians: Array<{
      id: number;
      guardian: Guardian;
      is_primary: boolean;
      can_pickup: boolean;
    }>;
    current_enrollment: {
      id: number;
      academic_year_name: string;
      class_name: string;
      section_name: string;
      roll_number: string;
      is_active: boolean;
    } | null;
  };
  attendance_summary: {
    total_sessions: number;
    present_count: number;
    absent_count: number;
    late_count: number;
    excused_count: number;
    percentage: number;
    is_low_attendance: boolean;
    threshold: number;
    monthly_breakdown: Array<{
      month: string;
      total: number;
      present: number;
      absent: number;
      late: number;
      excused: number;
      percentage: number;
    }>;
    recent_records: Array<{
      id: number;
      date: string;
      status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
      remarks: string;
      session_type: string;
    }>;
  };
  academic_summary: {
    overall_average: number | null;
    overall_grade: string;
    current_gpa: number | null;
    examinations: Array<{
      exam_id: number;
      exam_name: string;
      term: string;
      average_percentage: number;
      overall_grade: string;
      subjects: Array<{
        subject: string;
        max_marks: number;
        pass_marks: number;
        marks_obtained: number | null;
        is_absent: boolean;
        percentage: number;
        grade: string;
        remarks: string;
      }>;
    }>;
    subject_performance: Array<{
      subject: string;
      average: number;
      grade: string;
      assessments_count: number;
    }>;
    strengths: Array<{ subject: string; average: number }>;
    weaknesses: Array<{ subject: string; average: number }>;
  };
  remarks: StudentRemark[];
  achievements: StudentAchievement[];
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export interface AttendanceSessionItem {
  id: number;
  section: number;
  section_name?: string;
  subject?: number | null;
  subject_name?: string | null;
  subject_code?: string | null;
  date: string;
  session_type: string;
  taken_by_name?: string;
  status: string;
  notes?: string;
  marked_at?: string;
  marked_at_formatted?: string;
  summary?: {
    total: number;
    present: number;
    absent: number;
    percentage: number;
  };
}

export interface AttendanceSheetStudent {
  student_id: number;
  roll_number: string;
  admission_number: string;
  first_name: string;
  last_name: string;
  full_name: string;
  photo_url?: string;
  record_id: number | null;
  status: AttendanceStatus;
  check_in_time: string;
  remarks: string;
}

export interface AttendanceOverviewData {
  date: string;
  total_students_enrolled: number;
  total_present: number;
  total_absent: number;
  total_late: number;
  total_excused: number;
  overall_percentage: number;
  total_sections: number;
  marked_sections_count: number;
  pending_sections_count: number;
  pending_sections: Array<{
    section_id: number;
    section_name: string;
    room_number: string;
    class_teacher: string;
  }>;
  marked_sections: Array<{
    session_id: number;
    section_id: number;
    section_name: string;
    total: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    percentage: number;
    status: string;
    taken_by: string;
  }>;
}

export interface Examination {
  id: number;
  school: number;
  academic_year: number;
  academic_year_name: string;
  name: string;
  term: string;
  start_date: string;
  end_date: string;
  is_published: boolean;
  created_at: string;
  exam_subjects: Array<{
    id: number;
    examination: number;
    class_group: number;
    class_name: string;
    subject: number;
    subject_name: string;
    subject_code: string;
    max_marks: number;
    pass_marks: number;
    exam_date?: string;
  }>;
}

export interface GradingScaleRule {
  min: number;
  max: number;
  grade: string;
  gpa: number;
  label?: string;
}

export interface GradingScale {
  id: number;
  school: number;
  name: string;
  is_default: boolean;
  rules: GradingScaleRule[];
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  category: 'ATTENDANCE_ALERT' | 'ACADEMIC_ALERT' | 'EXAM_RESULT' | 'ANNOUNCEMENT';
  link?: string;
  is_read: boolean;
  created_at: string;
}
