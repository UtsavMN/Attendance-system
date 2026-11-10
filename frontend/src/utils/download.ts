import { apiClient, API_BASE_URL } from '../api/client';
import { loadDb } from '../api/browserDb';

export const downloadAuthorizedFile = async (endpoint: string, filename: string) => {
  try {
    const res = await apiClient.get(endpoint, {
      responseType: 'blob',
    });
    if (res.data && res.data.size > 0) {
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return;
    }
  } catch (err: any) {
    console.warn('Backend download endpoint not available. Using browser export generator:', err);
  }

  // Client-side Fallback Generator for Vercel Showcase
  const db = loadDb();
  let content = '';
  let mimeType = 'text/plain';

  if (endpoint.includes('attendance')) {
    mimeType = 'text/csv;charset=utf-8;';
    content = 'Student Name,Admission Number,Class,Attendance Percentage,Status\n';
    db.students.forEach((s: any) => {
      content += `"${s.full_name}","${s.admission_number}","Grade 7 - A","100%","ACTIVE"\n`;
    });
    filename = filename.replace('.xlsx', '.csv');
  } else if (endpoint.includes('academics')) {
    mimeType = 'text/csv;charset=utf-8;';
    content = 'Student Name,Admission Number,Examination,Subject,Marks Obtained,Max Marks,Percentage,Grade\n';
    content += '"Utsav M N","ADM-2025-232","dsa","dsa","85","100","85%","A"\n';
    filename = filename.replace('.xlsx', '.csv');
  } else if (endpoint.includes('student-report-card-pdf')) {
    // Generate clean printable report document window
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${filename}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #17243A; }
            .header { text-align: center; border-bottom: 2px solid #17243A; padding-bottom: 16px; margin-bottom: 24px; }
            h1 { font-size: 24px; margin: 0; color: #17243A; text-transform: uppercase; }
            p { margin: 4px 0; font-size: 13px; color: #64748B; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
            th, td { border: 1px solid #E8EBF0; padding: 10px 14px; text-align: left; }
            th { background-color: #F7F8FA; font-weight: 600; }
            .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; background: #DFF3E7; color: #065F46; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>SCHOLARIS ACADEMY</h1>
            <p>742 Evergreen Terrace, Academic District, Springfield</p>
            <p>Official Student Academic & Attendance Report Card</p>
          </div>
          <h3>Student Record: Utsav M N</h3>
          <p><strong>Admission No:</strong> ADM-2025-232 | <strong>Class:</strong> Grade 7 - Section A | <strong>Roll No:</strong> #231</p>
          <table>
            <thead>
              <tr>
                <th>Subject Discipline</th>
                <th>Max Marks</th>
                <th>Marks Obtained</th>
                <th>Percentage</th>
                <th>Letter Grade</th>
                <th>Evaluation Remarks</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>dsa</td>
                <td>100</td>
                <td>85</td>
                <td>85.0%</td>
                <td><span class="badge">A</span></td>
                <td>Excellent performance and conceptual grasp.</td>
              </tr>
            </tbody>
          </table>
          <br/>
          <p><strong>Attendance Compliance:</strong> 100% (1/1 sessions attended)</p>
          <p><strong>Overall Grade & GPA:</strong> Grade A | 3.7 / 4.0</p>
          <script>window.onload = function() { window.print(); }</script>
        </body>
        </html>
      `);
      printWindow.document.close();
      return;
    }
  }

  // Trigger download of generated CSV
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

export const getAuthorizedUrl = (endpoint: string) => {
  const token = localStorage.getItem('scholaris_token');
  const separator = endpoint.includes('?') ? '&' : '?';
  return `${API_BASE_URL}${endpoint}${separator}token=${token || ''}`;
};
