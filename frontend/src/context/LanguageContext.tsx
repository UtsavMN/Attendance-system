import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'kn';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
  t: (text: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'scholaris_language_pref';

export const translations: Record<Language, Record<string, string>> = {
  en: {},
  kn: {
    // Navigation & Main Titles
    'Scholaris': 'ಸ್ಕಾಲರಿಸ್',
    'Dashboard Overview': 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಅವಲೋಕನ',
    'Overview': 'ಅವಲೋಕನ',
    'Students': 'ವಿದ್ಯಾರ್ಥಿಗಳು',
    'Student Directory': 'ವಿದ್ಯಾರ್ಥಿ ವಿವರಗಳ ಪಟ್ಟಿ',
    'Student Profile': 'ವಿದ್ಯಾರ್ಥಿ ಪ್ರೊಫೈಲ್',
    'Attendance': 'ಹಾಜರಾತಿ',
    'Attendance Management': 'ಹಾಜರಾತಿ ನಿರ್ವಹಣೆ',
    'Academics': 'ಶೈಕ್ಷಣಿಕ',
    'Academic Performance & Grading': 'ಶೈಕ್ಷಣಿಕ ಸಾಧನೆ ಮತ್ತು ಗ್ರೇಡಿಂಗ್',
    'Classes & Sections': 'ತರಗತಿಗಳು & ವಿಭಾಗಗಳು',
    'Classes': 'ತರಗತಿಗಳು',
    'Teachers & Staff': 'ಶಿಕ್ಷಕರು & ಸಿಬ್ಬಂದಿ',
    'Teachers & Staff Directory': 'ಶಿಕ್ಷಕರು & ಸಿಬ್ಬಂದಿ ಪಟ್ಟಿ',
    'Reports & Analytics': 'ವರದಿಗಳು & ವಿಶ್ಲೇಷಣೆ',
    'Institutional Reports & Analytics': 'ಸಾಂಸ್ಥಿಕ ವರದಿಗಳು ಮತ್ತು ವಿಶ್ಲೇಷಣೆ',
    'Notification Center': 'ಅಧಿಸೂಚನೆ ಕೇಂದ್ರ',
    'Notifications': 'ಅಧಿಸೂಚನೆಗಳು',
    'Settings': 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    'System Settings & Rules': 'ವ್ಯವಸ್ಥೆಯ ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    'System Settings & Policies': 'ವ್ಯವಸ್ಥೆಯ ಸೆಟ್ಟಿಂಗ್‌ಗಳು ಮತ್ತು ನಿಯಮಗಳು',
    'Main Modules': 'ಮುಖ್ಯ ವಿಭಾಗಗಳು',

    // Quick Action Buttons
    'Mark Attendance': 'ಹಾಜರಾತಿ ದಾಖಲಿಸಿ',
    'New Student': 'ಹೊಸ ವಿದ್ಯಾರ್ಥಿ',
    'Add Student': 'ವಿದ್ಯಾರ್ಥಿ ಸೇರಿಸಿ',
    'Register New Student': 'ಹೊಸ ವಿದ್ಯಾರ್ಥಿ ನೋಂದಾಯಿಸಿ',
    'Export Roster': 'ಪಟ್ಟಿ ಡೌನ್‌ಲೋಡ್',
    'Download Excel': 'ಎಕ್ಸೆಲ್ ಡೌನ್‌ಲೋಡ್',
    'Generate PDF': 'ಪಿಡಿಎಫ್ ರಚಿಸಿ',
    'Official PDF Report Card': 'ಅಧಿಕೃತ ಪ್ರಗತಿ ಪತ್ರಿಕೆ',
    'Save Attendance': 'ಹಾಜರಾತಿ ಉಳಿಸಿ',
    'Save Examination Marks': 'ಪರೀಕ್ಷಾ ಅಂಕಗಳನ್ನು ಉಳಿಸಿ',
    'Save Marks': 'ಅಂಕಗಳನ್ನು ಉಳಿಸಿ',
    'Save & Publish': 'ಉಳಿಸಿ & ಪ್ರಕಟಿಸಿ',
    'Save & Publish Results': 'ಉಳಿಸಿ & ಫಲಿತಾಂಶ ಪ್ರಕಟಿಸಿ',
    'Publish Results': 'ಫಲಿತಾಂಶ ಪ್ರಕಟಿಸಿ',
    'Results Published': 'ಫಲಿತಾಂಶ ಪ್ರಕಟಿಸಲಾಗಿದೆ',
    'Mark All Present': 'ಎಲ್ಲರೂ ಹಾಜರು',
    'Mark All Absent': 'ಎಲ್ಲರೂ ಗೈರುಹಾಜರು',
    'Clear All': 'ತೆರವುಗೊಳಿಸಿ',
    'Save Student Record': 'ವಿದ್ಯಾರ್ಥಿ ವಿವರ ಉಳಿಸಿ',
    'Registering...': 'ನೋಂದಾಯಿಸಲಾಗುತ್ತಿದೆ...',
    'Cancel': 'ರದ್ದುಮಾಡಿ',
    'Delete': 'ಅಳಿಸಿ',
    'Edit': 'ಸಂಪಾದಿಸಿ',
    'View Profile': 'ಪ್ರೊಫೈಲ್ ನೋಡಿ',
    'Add Remark': 'ಷರಾ ಸೇರಿಸಿ',
    'Add Class': 'ತರಗತಿ ಸೇರಿಸಿ',
    'Add Section': 'ವಿಭಾಗ ಸೇರಿಸಿ',
    'Add Subject': 'ವಿಷಯ ಸೇರಿಸಿ',
    'Assign Subject': 'ವಿಷಯ ನಿಯೋಜಿಸಿ',
    'Mark All Read': 'ಎಲ್ಲವನ್ನೂ ಓದಲಾಗಿದೆ ಎಂದು ಗುರುತಿಸಿ',
    'Save Configuration': 'ಸಂರಚನೆ ಉಳಿಸಿ',
    'Saving...': 'ಉಳಿಸಲಾಗುತ್ತಿದೆ...',

    // Dashboard & Stats KPI
    'Total Students': 'ಒಟ್ಟು ವಿದ್ಯಾರ್ಥಿಗಳು',
    'Present Today': 'ಇಂದು ಹಾಜರಾದವರು',
    'Absent Today': 'ಇಂದು ಗೈರುಹಾಜರಾದವರು',
    'Attendance Rate': 'ಹಾಜರಾತಿ ಪ್ರಮಾಣ',
    'Total Classes': 'ಒಟ್ಟು ತರಗತಿಗಳು',
    'Students Requiring Attention': 'ಗಮನ ಅಗತ್ಯವಿರುವ ವಿದ್ಯಾರ್ಥಿಗಳು',
    'Mandatory Benchmark': 'ಕಡ್ಡಾಯ ಮಾನದಂಡ',
    'Minimum threshold': 'ಕನಿಷ್ಠ ಮಿತಿ',
    'School Attendance': 'ಶಾಲಾ ಹಾಜರಾತಿ ಸರಾಸರಿ',
    'Academic Average': 'ಶೈಕ್ಷಣಿಕ ಸರಾಸರಿ',
    'Academic Avg': 'ಶೈಕ್ಷಣಿಕ ಸರಾಸರಿ',
    'Evaluated Classes': 'ಮೌಲ್ಯಮಾಪನಗೊಂಡ ತರಗತಿಗಳು',
    'Active class average': 'ಸಕ್ರಿಯ ತರಗತಿ ಸರಾಸರಿ',
    'evaluated classes': 'ಮೌಲ್ಯಮಾಪನಗೊಂಡ ತರಗತಿಗಳು',
    'active students': 'ಸಕ್ರಿಯ ವಿದ್ಯಾರ್ಥಿಗಳು',
    'sessions tracked': 'ಅವಧಿಗಳು ದಾಖಲಾಗಿವೆ',

    // Attendance Terms
    'Present': 'ಹಾಜರು',
    'Absent': 'ಗೈರುಹಾಜರು',
    'Late': 'ತಡವಾಗಿ ಬಂದವರು',
    'Excused': 'ಅನುಮತಿ ಪಡೆದವರು',
    'PRESENT': 'ಹಾಜರು',
    'ABSENT': 'ಗೈರುಹಾಜರು',
    'LATE': 'ತಡವಾಗಿ ಬಂದವರು',
    'EXCUSED': 'ಅನುಮತಿ ಪಡೆದವರು',
    'Days Present': 'ಹಾಜರಾದ ದಿನಗಳು',
    'Days Absent': 'ಗೈರುಹಾಜರಾದ ದಿನಗಳು',
    'Late Arrivals': 'ತಡವಾದ ಆಗಮನಗಳು',
    'Select Date': 'ದಿನಾಂಕ ಆಯ್ಕೆಮಾಡಿ',
    'Select Class': 'ತರಗತಿ ಆಯ್ಕೆಮಾಡಿ',
    'Select Section': 'ವಿಭಾಗ ಆಯ್ಕೆಮಾಡಿ',
    'Select Subject': 'ವಿಷಯ ಆಯ್ಕೆಮಾಡಿ',
    'Select Grade': 'ತರಗತಿ ಆಯ್ಕೆಮಾಡಿ',
    'All Classes': 'ಎಲ್ಲಾ ತರಗತಿಗಳು',
    'Class': 'ತರಗತಿ',
    'Section': 'ವಿಭಾಗ',
    'Subject': 'ವಿಷಯ',
    'Date': 'ದಿನಾಂಕ',
    'Roll #': 'ರೋಲ್ ನಂ',
    'Roll No': 'ರೋಲ್ ನಂ',
    'Roll Number': 'ರೋಲ್ ಸಂಖ್ಯೆ',
    'Student Name': 'ವಿದ್ಯಾರ್ಥಿಯ ಹೆಸರು',
    'Student Details': 'ವಿದ್ಯಾರ್ಥಿ ವಿವರಗಳು',
    'Class & Section': 'ತರಗತಿ & ವಿಭಾಗ',
    'Admission No': 'ಪ್ರವೇಶ ಸಂಖ್ಯೆ',
    'Admission Number': 'ಪ್ರವೇಶ ಸಂಖ್ಯೆ',
    'Status': 'ಸ್ಥಿತಿ',
    'Actions': 'ಕ್ರಿಯೆಗಳು',
    'Remarks': 'ಷರಾ',
    'Staff Notes': 'ಸಿಬ್ಬಂದಿ ಟಿಪ್ಪಣಿ',
    'Active': 'ಸಕ್ರಿಯ',
    'Inactive': 'ನಿಷ್ಕ್ರಿಯ',
    'ACTIVE': 'ಸಕ್ರಿಯ',
    'INACTIVE': 'ನಿಷ್ಕ್ರಿಯ',
    'GRADUATED': 'ತೇರ್ಗಡೆ ಹೊಂದಿದವರು',
    'SUSPENDED': 'ಅಮಾನತುಗೊಂಡವರು',
    'ARCHIVED': 'ಸಂಗ್ರಹಿಸಲಾಗಿದೆ',

    // Attendance Filters
    'Attendance: All': 'ಹಾಜರಾತಿ: ಎಲ್ಲಾ',
    'High (>85%)': 'ಉತ್ತಮ (>85%)',
    'Warning (75-85%)': 'ಎಚ್ಚರಿಕೆ (75-85%)',
    'At Risk (<75%)': 'ಕಡಿಮೆ (<75%)',

    // Academics & Examination
    'Marks Entry': 'ಅಂಕಗಳ ನಮೂದು',
    'Examinations': 'ಪರೀಕ್ಷೆಗಳು',
    'Grading Scales': 'ಗ್ರೇಡಿಂಗ್ ಮಾನದಂಡಗಳು',
    'Select Examination': 'ಪರೀಕ್ಷೆ ಆಯ್ಕೆಮಾಡಿ',
    'Select Class & Subject': 'ತರಗತಿ ಮತ್ತು ವಿಷಯ ಆಯ್ಕೆಮಾಡಿ',
    'Marks Obtained': 'ಪಡೆದ ಅಂಕಗಳು',
    'Max Marks': 'ಗರಿಷ್ಠ ಅಂಕಗಳು',
    'Pass Marks': 'ಪಾಸಿಂಗ್ ಅಂಕಗಳು',
    'Percentage': 'ಶೇಕಡಾವಾರು',
    'Letter Grade': 'ಗ್ರೇಡ್',
    'Current Grade & GPA': 'ಪ್ರಸ್ತುತ ಗ್ರೇಡ್ & ಜಿಪಿಎ',
    'Teacher Evaluation Remarks': 'ಶಿಕ್ಷಕರ ಮೌಲ್ಯಮಾಪನ ಟಿಪ್ಪಣಿ',
    'Teacher Feedback': 'ಶಿಕ್ಷಕರ ಅಭಿಪ್ರಾಯ',
    'Schedule New Exam': 'ಹೊಸ ಪರೀಕ್ಷೆ ನಿಗದಿಪಡಿಸಿ',
    'Grade': 'ಗ್ರೇಡ್',
    'All examinations': 'ಎಲ್ಲಾ ಪರೀಕ್ಷೆಗಳು',
    'Examinations Taken': 'ತೆಗೆದುಕೊಂಡ ಪರೀಕ್ಷೆಗಳು',
    'Grade Evaluation': 'ಗ್ರೇಡ್ ಮೌಲ್ಯಮಾಪನ',

    // Reports & Analytics
    'Class-Wise Comparative Analysis': 'ತರಗತಿವಾರು ತೌಲನಿಕ ವಿಶ್ಲೇಷಣೆ',
    'Attendance Comparison (%)': 'ಹಾಜರಾತಿ ಹೋಲಿಕೆ (%)',
    'Academic Performance (%)': 'ಶೈಕ್ಷಣಿಕ ಸಾಧನೆ (%)',
    'Export Institutional Attendance Roster': 'ಸಾಂಸ್ಥಿಕ ಹಾಜರಾತಿ ಪಟ್ಟಿಯನ್ನು ರಫ್ತು ಮಾಡಿ',
    'Export Academic Performance Marks': 'ಶೈಕ್ಷಣಿಕ ಅಂಕಗಳ ಪಟ್ಟಿಯನ್ನು ರಫ್ತು ಮಾಡಿ',
    'Individual Student Official PDF Report Cards': 'ವೈಯಕ್ತಿಕ ವಿದ್ಯಾರ್ಥಿ ಅಧಿಕೃತ ಪಿಡಿಎಫ್ ಪ್ರಗತಿ ಪತ್ರಿಕೆಗಳು',
    'Pass Rate': 'ಉತ್ತೀರ್ಣ ದರ',
    'Enrolled': 'ದಾಖಲಾದವರು',
    'High Attendance': 'ಉತ್ತಮ ಹಾಜರಾತಿ (≥ 85%)',
    'Compliant': 'ನಿಯಮಾನುಸಾರ (75% - 84%)',
    'At Risk': 'ಕಡಿಮೆ ಹಾಜರಾತಿ (< 75%)',
    'No Attendance Logged': 'ಹಾಜರಾತಿ ದಾಖಲಾಗಿಲ್ಲ',
    'No Marks Logged': 'ಅಂಕಗಳು ದಾಖಲಾಗಿಲ್ಲ',
    '75% Mandatory Attendance': '75% ಕಡ್ಡಾಯ ಹಾಜರಾತಿ',
    '40% Passing Benchmark': '40% ಉತ್ತೀರ್ಣ ಮಾನದಂಡ',

    // Form Labels & Demographics
    'Personal Information': 'ವೈಯಕ್ತಿಕ ಮಾಹಿತಿ',
    'Admission & Class Assignment': 'ಪ್ರವೇಶ ಮತ್ತು ತರಗತಿ ನಿಯೋಜನೆ',
    'Primary Guardian Information': 'ಪ್ರಾಥಮಿಕ ಪೋಷಕರ ಮಾಹಿತಿ',
    'First Name *': 'ಮೊದಲ ಹೆಸರು *',
    'Last Name *': 'ಕೊನೆಯ ಹೆಸರು *',
    'Date of Birth *': 'ಹುಟ್ಟಿದ ದಿನಾಂಕ *',
    'Gender *': 'ಲಿಂಗ *',
    'Male': 'ಪುರುಷ',
    'Female': 'ಮಹಿಳೆ',
    'Other': 'ಇತರೆ',
    'Blood Group': 'ರಕ್ತದ ಗುಂಪು',
    'Photo URL (Optional)': 'ಭಾವಚಿತ್ರದ ಲಿಂಕ್ (ಐಚ್ಛಿಕ)',
    'Admission Number *': 'ಪ್ರವೇಶ ಸಂಖ್ಯೆ *',
    'Admission Date': 'ಪ್ರವೇಶ ದಿನಾಂಕ',
    'Class *': 'ತರಗತಿ *',
    'Section *': 'ವಿಭಾಗ *',
    'Guardian Full Name': 'ಪೋಷಕರ ಪೂರ್ಣ ಹೆಸರು',
    'Relationship': 'ಸಂಬಂಧ',
    'Father': 'ತಂದೆ',
    'Mother': 'ತಾಯಿ',
    'Legal Guardian': 'ಕಾನೂನುಬದ್ಧ ಪೋಷಕರು',
    'Guardian Phone': 'ಪೋಷಕರ ಫೋನ್',
    'Guardian Email': 'ಪೋಷಕರ ಇಮೇಲ್',
    'Address': 'ವಿಳಾಸ',
    'Emergency Contact': 'ತುರ್ತು ಸಂಪರ್ಕ',
    'Medical Notes (Restricted)': 'ವೈದ್ಯಕೀಯ ಟಿಪ್ಪಣಿಗಳು',
    'Previous School': 'ಹಿಂದಿನ ಶಾಲೆ',

    // Profile Tabs
    'Attendance History': 'ಹಾಜರಾತಿ ಇತಿಹಾಸ',
    'Academics & Grades': 'ಶೈಕ್ಷಣಿಕ ವಿವರ & ಅಂಕಗಳು',
    'Performance Analytics': 'ಸಾಧನೆ ವಿಶ್ಲೇಷಣೆ',
    'Activity & Remarks': 'ಚಟುವಟಿಕೆ & ಟಿಪ್ಪಣಿಗಳು',
    'Personal Demographics': 'ವೈಯಕ್ತಿಕ ವಿವರಗಳು',
    'Guardian Information': 'ಪೋಷಕರ ಮಾಹಿತಿ',
    'Emergency & Health Notes': 'ತುರ್ತು ಮತ್ತು ಆರೋಗ್ಯ ಟಿಪ್ಪಣಿಗಳು',
    'Academic Summary': 'ಶೈಕ್ಷಣಿಕ ಸಾರಾಂಶ',
    'Attendance Summary': 'ಹಾಜರಾತಿ ಸಾರಾಂಶ',
    'Attendance Status:': 'ಹಾಜರಾತಿ ಸ್ಥಿತಿ:',
    'Present / Total Days:': 'ಹಾಜರಾದ / ಒಟ್ಟು ದಿನಗಳು:',
    'Late Arrivals:': 'ತಡವಾದ ಆಗಮನಗಳು:',
    'Overall Average:': 'ಒಟ್ಟಾರೆ ಸರಾಸರಿ:',
    'Grade Evaluation:': 'ಗ್ರೇಡ್ ಮೌಲ್ಯಮಾಪನ:',
    'Examinations Taken:': 'ತೆಗೆದುಕೊಂಡ ಪರೀಕ್ಷೆಗಳು:',
    'Back to Student Directory': 'ವಿದ್ಯಾರ್ಥಿ ಪಟ್ಟಿಗೆ ಹಿಂತಿರುಗಿ',
    'Date of Birth': 'ಹುಟ್ಟಿದ ದಿನಾಂಕ',
    'Email Address': 'ಇಮೇಲ್ ವಿಳಾಸ',
    'Contact Phone': 'ಸಂಪರ್ಕ ಫೋನ್',
    'Residential Address': 'ವಾಸಸ್ಥಳದ ವಿಳಾಸ',
    'Name': 'ಹೆಸರು',
    'Phone': 'ಫೋನ್',
    'Occupation': 'ಉದ್ಯೋಗ',
    'Term Average:': 'ಅವಧಿಯ ಸರಾಸರಿ:',

    // Classes Page
    'Class Name': 'ತರಗತಿಯ ಹೆಸರು',
    'Class Code': 'ತರಗತಿಯ ಸಂಕೇತ',
    'Room Number': 'ಕೊಠಡಿ ಸಂಖ್ಯೆ',
    'Subject Name': 'ವಿಷಯದ ಹೆಸರು',
    'Subject Code': 'ವಿಷಯದ ಸಂಕೇತ',
    'Credit Hours': 'ಕ್ರೆಡಿಟ್ ಗಂಟೆಗಳು',
    'Create Class': 'ತರಗತಿ ರಚಿಸಿ',
    'Create Section': 'ವಿಭಾಗ ರಚಿಸಿ',
    'Create Subject': 'ವಿಷಯ ರಚಿಸಿ',
    'Total Enrolled Students': 'ಒಟ್ಟು ದಾಖಲಾದ ವಿದ್ಯಾರ್ಥಿಗಳು',

    // Settings Page
    'Attendance Rules & Logic': 'ಹಾಜರಾತಿ ನಿಯಮಗಳು & ತರ್ಕ',
    'School Profile': 'ಶಾಲಾ ಪ್ರೊಫೈಲ್',
    'Audit Logs': 'ಆಡಿಟ್ ಲಾಗ್‌ಗಳು',
    'School Name': 'ಶಾಲೆಯ ಹೆಸರು',
    'Motto / Tagline': 'ಧ್ಯೇಯವಾಕ್ಯ',
    'Website': 'ವೆಬ್‌ಸೈಟ್',
    'Official Email': 'ಅಧಿಕೃತ ಇಮೇಲ್',
    'Official Phone': 'ಅಧಿಕೃತ ಫೋನ್',
    'Campus Address': 'ಶಾಲಾ ವಿಳಾಸ',
    'Attendance Threshold (%)': 'ಕನಿಷ್ಠ ಹಾಜರಾತಿ ಮಿತಿ (%)',
    'Warning Threshold (%)': 'ಎಚ್ಚರಿಕೆ ಮಿತಿ (%)',
    'Late Arrival Penalty (Weight)': 'ತಡವಾದ ಆಗಮನದ ದಂಡ',

    // Miscellaneous
    'Search by student name or admission number...': 'ವಿದ್ಯಾರ್ಥಿ ಹೆಸರು ಅಥವಾ ಪ್ರವೇಶ ಸಂಖ್ಯೆಯಿಂದ ಹುಡುಕಿ...',
    'Loading Scholaris...': 'ಸ್ಕಾಲರಿಸ್ ಲೋಡ್ ಆಗುತ್ತಿದೆ...',
    'Administrator': 'ಆಡಳಿತಾಧಿಕಾರಿ',
    'Manage enrolled students, digital profiles, attendance & grades': 'ದಾಖಲಾದ ವಿದ್ಯಾರ್ಥಿಗಳು, ಡಿಜಿಟಲ್ ಪ್ರೊಫೈಲ್, ಹಾಜರಾತಿ & ಅಂಕಗಳನ್ನು ನಿರ್ವಹಿಸಿ',
    'Generate, export, and analyze comparative class attendance and academic metrics': 'ತರಗತಿ ಹಾಜರಾತಿ ಮತ್ತು ಶೈಕ್ಷಣಿಕ ಅಂಕಗಳನ್ನು ರಚಿಸಿ, ರಫ್ತು ಮಾಡಿ ಮತ್ತು ವಿಶ್ಲೇಷಿಸಿ',
    'Track subject-wise daily attendance, real-time percentages, and compliance': 'ದೈನಂದಿನ ವಿಷಯವಾರು ಹಾಜರಾತಿ ಮತ್ತು ಶೇಕಡಾವಾರು ದಾಖಲಿಸಿ',
    'Manage examination terms, subject marks rosters, and automatic GPA grading': 'ಪರೀಕ್ಷೆಗಳು, ಅಂಕಗಳ ಪಟ್ಟಿ ಮತ್ತು ಜಿಪಿಎ ಗ್ರೇಡಿಂಗ್ ನಿರ್ವಹಿಸಿ',
    'Manage institutional class hierarchy, sections, room assignments & teachers': 'ತರಗತಿಗಳು, ವಿಭಾಗಗಳು, ಕೊಠಡಿಗಳು ಮತ್ತು ಶಿಕ್ಷಕರನ್ನು ನಿರ್ವಹಿಸಿ',
    'Configure institution-wide attendance rules, thresholds, and profile': 'ಸಾಂಸ್ಥಿಕ ಹಾಜರಾತಿ ನಿಯಮಗಳು, ಮಿತಿಗಳು ಮತ್ತು ಪ್ರೊಫೈಲ್ ಸಂರಚಿಸಿ'
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'kn' ? 'kn' : 'en';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const toggleLanguage = () => {
    setLanguageState((prev) => (prev === 'en' ? 'kn' : 'en'));
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (text: string, fallback?: string): string => {
    if (!text) return '';
    if (language === 'en') return fallback || text;
    const knTranslation = translations.kn[text.trim()];
    if (knTranslation) return knTranslation;
    return fallback || text;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
