'use client';

import { useState, useEffect } from 'react';
import { Save, X, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { SkeletonTableRows } from '../../components/Skeleton';

interface AttendanceRecord {
  date: string;
  status: string;
}

interface EmployeeWithAttendance {
  id: number;
  employeeId: string;
  name: string;
  position?: string;
  attendance: AttendanceRecord[];
}

const STATUS_OPTIONS = ['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE'];
const STATUS_COLORS: Record<string, string> = {
  PRESENT: '#10b981',
  ABSENT: '#ef4444',
  HALF_DAY: '#f59e0b',
  LEAVE: '#c9a84c',
};
const STATUS_SHORT: Record<string, string> = {
  PRESENT: 'P',
  ABSENT: 'A',
  HALF_DAY: 'H',
  LEAVE: 'L',
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

export default function AttendancePage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [employees, setEmployees] = useState<EmployeeWithAttendance[]>([]);
  const [changes, setChanges] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAttendance(); }, [month, year]);

  const fetchAttendance = async () => {
    const res = await fetch(`/api/attendance?month=${month}&year=${year}`);
    const data = await res.json();
    setEmployees(Array.isArray(data) ? data : []);
    setChanges({});
    setLoading(false);
  };

  const getStatus = (emp: EmployeeWithAttendance, day: number) => {
    const key = `${emp.id}-${day}`;
    if (changes[key]) return changes[key];
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const rec = emp.attendance.find(a => a.date.startsWith(dateStr));
    return rec?.status || '';
  };

  const cycleStatus = (empId: number, day: number) => {
    const key = `${empId}-${day}`;
    const current = getStatus(employees.find(e => e.id === empId)!, day);
    const idx = STATUS_OPTIONS.indexOf(current);
    const next = STATUS_OPTIONS[(idx + 1) % STATUS_OPTIONS.length];
    setChanges(prev => ({ ...prev, [key]: next }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const records = Object.entries(changes).map(([key, status]) => {
        const [empId, day] = key.split('-');
        return {
          employeeId: parseInt(empId),
          date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
          status,
        };
      });
      if (records.length === 0) return;
      const res = await fetch('/api/attendance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ records }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ type: 'success', text: `Saved ${data.saved} attendance records.` });
      fetchAttendance();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const daysInMonth = getDaysInMonth(year, month);
  const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
  const hasChanges = Object.keys(changes).length > 0;

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Attendance Register</h1>
          <p className="page-title-desc">Mark daily attendance for all active employees. Click a cell to cycle through statuses.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button className="btn-outline" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center' }} onClick={prevMonth}><ChevronLeft size={18} /></button>
          <span style={{ fontWeight: 700, fontSize: '1rem', minWidth: '160px', textAlign: 'center' }}>{monthName}</span>
          <button className="btn-outline" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center' }} onClick={nextMonth}><ChevronRight size={18} /></button>
          {hasChanges && (
            <button className="btn-primary" style={{ padding: '10px 18px' }} onClick={handleSave} disabled={saving}>
              <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>

      {message && (
        <div style={{ padding: '16px', borderRadius: '12px', marginBottom: '24px', background: message.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: message.type === 'success' ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(239,68,68,0.2)', color: message.type === 'success' ? '#10b981' : '#ef4444', fontWeight: 500, display: 'flex', justifyContent: 'space-between' }}>
          <span>{message.text}</span>
          <button style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }} onClick={() => setMessage(null)}><X size={16} /></button>
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {STATUS_OPTIONS.map(s => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#94a3b8' }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '4px', background: STATUS_COLORS[s], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#fff' }}>{STATUS_SHORT[s]}</div>
            {s}
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#94a3b8' }}>
          <div style={{ width: '20px', height: '20px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
          Not Marked
        </div>
      </div>

      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        {loading ? (
          <table className="custom-table"><tbody><SkeletonTableRows cols={8} rows={6} /></tbody></table>
        ) : employees.length === 0 ? (
          <p style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>No active employees found. Add employees first.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: `${200 + daysInMonth * 36}px` }}>
            <thead>
              <tr>
                <th style={{ padding: '12px 16px', textAlign: 'left', background: 'rgba(10, 9, 7, 0.6)', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', left: 0, zIndex: 1, minWidth: '180px' }}>Employee</th>
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
                  const dow = new Date(year, month - 1, d).getDay();
                  const isWeekend = dow === 0 || dow === 6;
                  return (
                    <th key={d} style={{ padding: '8px 4px', textAlign: 'center', background: 'rgba(10, 9, 7, 0.6)', color: isWeekend ? '#c9a84c' : '#94a3b8', fontSize: '0.75rem', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.06)', minWidth: '32px' }}>
                      {d}
                    </th>
                  );
                })}
                <th style={{ padding: '12px 16px', textAlign: 'center', background: 'rgba(10, 9, 7, 0.6)', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.06)', minWidth: '60px' }}>Present</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => {
                const presentCount = Array.from({ length: daysInMonth }, (_, i) => i + 1).filter(d => {
                  const s = getStatus(emp, d);
                  return s === 'PRESENT' || s === 'HALF_DAY';
                }).length;
                return (
                  <tr key={emp.id}>
                    <td style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', position: 'sticky', left: 0, background: '#0a0a0a', zIndex: 1 }}>
                      <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>{emp.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{emp.employeeId} · {emp.position || '—'}</div>
                    </td>
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
                      const status = getStatus(emp, d);
                      const isChanged = !!changes[`${emp.id}-${d}`];
                      return (
                        <td key={d} style={{ padding: '4px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <div
                            onClick={() => cycleStatus(emp.id, d)}
                            title={status || 'Click to mark'}
                            style={{
                              width: '28px', height: '28px', borderRadius: '6px', margin: '0 auto', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#fff', transition: 'all 0.15s ease',
                              background: status ? STATUS_COLORS[status] : 'rgba(255,255,255,0.04)',
                              border: isChanged ? '2px solid #fff' : '1px solid rgba(255,255,255,0.08)',
                              opacity: status ? 1 : 0.5,
                            }}
                          >
                            {status ? STATUS_SHORT[status] : ''}
                          </div>
                        </td>
                      );
                    })}
                    <td style={{ padding: '10px 16px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)', fontWeight: 700, color: '#10b981' }}>
                      {presentCount}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
