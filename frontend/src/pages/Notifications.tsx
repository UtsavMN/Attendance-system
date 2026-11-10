import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, AlertTriangle, GraduationCap, Info } from 'lucide-react';
import { apiClient } from '../api/client';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { NotificationItem } from '../types';

export const Notifications: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: notificationsData, isLoading } = useQuery<NotificationItem[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await apiClient.get('/api/notifications/');
      return res.data?.results || res.data;
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      return await apiClient.post('/api/notifications/all/read/');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const markSingleReadMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiClient.post(`/api/notifications/${id}/read/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ATTENDANCE_ALERT':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'EXAM_RESULT':
        return <GraduationCap className="w-4 h-4 text-emerald-600" />;
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-navy-800 tracking-tight">Notification Center</h2>
          <p className="text-[12px] text-slate">Attendance threshold warnings, examination publication notices, and announcements</p>
        </div>

        <button
          onClick={() => markAllReadMutation.mutate()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium bg-slate-100 hover:bg-slate-200 text-navy-800 rounded-lg transition-colors"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          <span>Mark All Read</span>
        </button>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <Card key={i} className="h-20 animate-pulse bg-surface" />
          ))
        ) : notificationsData && notificationsData.length > 0 ? (
          notificationsData.map((notif) => (
            <Card
              key={notif.id}
              className={`p-4 flex items-start justify-between gap-4 transition-all ${
                notif.is_read ? 'opacity-70 bg-slate-50/40' : 'border-l-4 border-l-navy-800 bg-surface'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2 rounded-lg bg-slate-100 flex-shrink-0 mt-0.5">
                  {getCategoryIcon(notif.category)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-navy-800 text-[13px]">{notif.title}</h4>
                    <span className="text-[10px] text-slate font-medium">
                      {new Date(notif.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[12px] text-slate-700 mt-1">{notif.message}</p>
                </div>
              </div>

              {!notif.is_read && (
                <button
                  onClick={() => markSingleReadMutation.mutate(notif.id)}
                  className="px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:text-navy-800 hover:bg-slate-100 rounded-md transition-colors flex-shrink-0"
                >
                  Mark as read
                </button>
              )}
            </Card>
          ))
        ) : (
          <div className="py-12 text-center text-slate bg-surface rounded-xl border border-border-subtle">
            <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-navy-800">No active notifications</p>
            <p className="text-[12px] text-slate-500">All alerts and system notices have been cleared.</p>
          </div>
        )}
      </div>
    </div>
  );
};
