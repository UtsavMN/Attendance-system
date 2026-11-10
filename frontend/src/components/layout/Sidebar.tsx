import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  GraduationCap,
  School as SchoolIcon,
  UserCheck,
  BarChart3,
  Bell,
  Settings,
  ShieldCheck,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user, school, logout } = useAuth();

  const navItems = [
    { name: 'Overview', to: '/', icon: LayoutDashboard },
    { name: 'Students', to: '/students', icon: Users },
    { name: 'Attendance', to: '/attendance', icon: CalendarCheck },
    { name: 'Academics', to: '/academics', icon: GraduationCap },
    { name: 'Classes & Sections', to: '/classes', icon: SchoolIcon },
    { name: 'Teachers & Staff', to: '/teachers', icon: UserCheck },
    { name: 'Reports & Analytics', to: '/reports', icon: BarChart3 },
    { name: 'Notifications', to: '/notifications', icon: Bell },
    { name: 'Settings', to: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-surface border-r border-border-subtle flex flex-col flex-shrink-0 min-h-screen select-none">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-navy-800 flex items-center justify-center text-white font-bold text-sm shadow-sm tracking-tight">
            S
          </div>
          <div>
            <h1 className="font-semibold text-navy-800 text-[14px] leading-tight tracking-tight">
              SCHOLARIS
            </h1>
            <span className="text-[10px] uppercase tracking-wider text-slate font-medium">
              School OS
            </span>
          </div>
        </div>
      </div>

      {/* School Badge Pill */}
      {school && (
        <div className="px-5 py-3 border-b border-border-subtle bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-medium text-navy-800 truncate" title={school.name}>
              {school.name}
            </span>
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Main Modules
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                  isActive
                    ? 'bg-navy-800 text-white shadow-sm'
                    : 'text-slate-600 hover:text-navy-800 hover:bg-slate-100'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span>{item.name}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer Card */}
      <div className="p-3 border-t border-border-subtle bg-slate-50/60">
        <div className="flex items-center justify-between p-2 rounded-lg bg-surface border border-border-subtle">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name}
                className="w-8 h-8 rounded-full object-cover border border-border-subtle"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-200 text-navy-800 flex items-center justify-center font-medium text-xs">
                {user?.first_name?.[0] || 'U'}
              </div>
            )}
            <div className="overflow-hidden">
              <p className="text-[12px] font-medium text-navy-800 truncate leading-tight">
                {user?.full_name || user?.username}
              </p>
              <p className="text-[10px] text-slate font-medium capitalize truncate">
                {user?.role?.replace('_', ' ').toLowerCase() || 'Administrator'}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="p-1.5 text-slate-400 hover:text-accent-red-text hover:bg-accent-red/40 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
