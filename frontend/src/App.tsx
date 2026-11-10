import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Students } from './pages/Students';
import { StudentProfile } from './pages/StudentProfile';
import { Attendance } from './pages/Attendance';
import { Academics } from './pages/Academics';
import { Classes } from './pages/Classes';
import { Teachers } from './pages/Teachers';
import { Reports } from './pages/Reports';
import { Notifications } from './pages/Notifications';
import { Settings } from './pages/Settings';

export const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />

      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="students" element={<Students />} />
        <Route path="students/:id" element={<StudentProfile />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="academics" element={<Academics />} />
        <Route path="classes" element={<Classes />} />
        <Route path="teachers" element={<Teachers />} />
        <Route path="reports" element={<Reports />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
