import { auth } from './firebase';
import { AdminActivityLog, AdminActionCategory } from '../types';

export async function fetchActivityLogs(category: AdminActionCategory = 'all', search = '', limit = 100): Promise<AdminActivityLog[]> {
  try {
    const token = await auth.currentUser?.getIdToken();
    const queryParams = new URLSearchParams();
    if (category && category !== 'all') queryParams.set('category', category);
    if (search) queryParams.set('search', search);
    if (limit) queryParams.set('limit', String(limit));

    const res = await fetch(`/api/admin/activity-logs?${queryParams.toString()}`, {
      headers: {
        Authorization: `Bearer ${token || ''}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      return data.logs || [];
    }
    return [];
  } catch (err) {
    console.warn('Failed to fetch activity logs:', err);
    return [];
  }
}

export async function recordAdminActivity(log: {
  actionType: string;
  category: 'content' | 'subscription' | 'settings' | 'users' | 'broadcast';
  summary: string;
  details?: string;
  targetId?: string;
  targetName?: string;
  changes?: Record<string, { from?: any; to?: any }>;
  severity?: 'info' | 'warning' | 'critical' | 'success';
}): Promise<boolean> {
  try {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch('/api/admin/activity-logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token || ''}`,
      },
      body: JSON.stringify(log),
    });
    return res.ok;
  } catch (err) {
    console.warn('Failed to record admin activity log:', err);
    return false;
  }
}

export function exportActivityLogsToCSV(logs: AdminActivityLog[]): void {
  if (!logs || logs.length === 0) {
    alert('No activity logs available to export.');
    return;
  }

  const headers = ['Timestamp', 'Date & Time', 'Category', 'Action Type', 'Summary', 'Admin Email', 'Target Name', 'Details'];
  const rows = logs.map(l => [
    l.timestamp,
    `"${new Date(l.timestamp).toISOString()}"`,
    `"${l.category}"`,
    `"${l.actionType}"`,
    `"${(l.summary || '').replace(/"/g, '""')}"`,
    `"${l.adminEmail || ''}"`,
    `"${(l.targetName || '').replace(/"/g, '""')}"`,
    `"${(l.details || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `innovation_admin_activity_log_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
