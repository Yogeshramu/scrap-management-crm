'use client';

import { useState, useEffect } from 'react';
import { Banknote, Save, X, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import CustomSelect from '../../components/CustomSelect';

interface Employee {
  id: number;
  employeeId: string;
  name: string;
  position?: string;
  salary: number;
}

interface SalaryRecord {
  id: number;
  employeeId: number;
  month: number;
  year: number;
  workingDays: number;
  presentDays: number;
  overtimeHours: number;
  overtimeRate: number;
  advances: number;
  grossSalary: number;
  netSalary: number;
  status: string;
  employee: Employee;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function SalaryPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<SalaryRecord[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState({ workingDays: '26', presentDays: '', overtimeHours: '0', overtimeRate: '0', advances: '0' });

  useEffect(() => { fetchEmployees(); }, []);
  useEffect(() => { fetchRecords(); }, [month, year]);

  const fetchEmployees = async () => {
    const res = await fetch('/api/employees');
    setEmployees(await res.json());
  };

  const fetchRecords = async () => {
    const res = await fetch(`/api/salary?month=${month}&year=${year}`);
    setRecords(await res.json());
  };

  const handleGenerate = async (ev: React.FormEvent) => {
    ev.preventDefault();
    try {
      const res = await fetch('/api/salary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: selectedEmp, month, year, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ type: 'success', text: `Salary computed: Net B$ ${data.netSalary.toFixed(2)}` });
      setShowModal(false);
      fetchRecords();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleMarkPaid = async (id: number) => {
    try {
      const res = await fetch('/api/salary', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: 'PAID' }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ type: 'success', text: 'Salary marked as paid and logged to cashbook.' });
      fetchRecords();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const totalNet = records.reduce((s, r) => s + r.netSalary, 0);
  const totalPaid = records.filter(r => r.status === 'PAID').reduce((s, r) => s + r.netSalary, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Salary Management</h1>
          <p className="page-title-desc">Compute monthly salaries based on attendance, overtime and advances.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button className="btn-outline" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center' }} onClick={prevMonth}><ChevronLeft size={18} /></button>
          <span style={{ fontWeight: 700, fontSize: '1rem', minWidth: '160px', textAlign: 'center' }}>{MONTHS[month - 1]} {year}</span>
          <button className="btn-outline" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center' }} onClick={nextMonth}><ChevronRight size={18} /></button>
          <button className="btn-primary" onClick={() => setShowModal(true)}><Banknote size={16} /> Compute Salary</button>
        </div>
      </div>

      {message && (
        <div style={{ padding: '16px', borderRadius: '12px', marginBottom: '24px', background: message.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: message.type === 'success' ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(239,68,68,0.2)', color: message.type === 'success' ? '#10b981' : '#ef4444', fontWeight: 500, display: 'flex', justifyContent: 'space-between' }}>
          <span>{message.text}</span>
          <button style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }} onClick={() => setMessage(null)}><X size={16} /></button>
        </div>
      )}

      <div className="metrics-grid" style={{ marginBottom: '32px' }}>
        <div className="metric-card">
          <div className="metric-info"><h3>Total Payroll</h3><div className="metric-value">B$ {totalNet.toFixed(2)}</div></div>
          <div className="metric-icon-wrap" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}><Banknote size={22} /></div>
        </div>
        <div className="metric-card">
          <div className="metric-info"><h3>Paid Out</h3><div className="metric-value" style={{ color: '#10b981' }}>B$ {totalPaid.toFixed(2)}</div></div>
          <div className="metric-icon-wrap" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}><CheckCircle size={22} /></div>
        </div>
        <div className="metric-card">
          <div className="metric-info"><h3>Outstanding</h3><div className="metric-value" style={{ color: totalNet - totalPaid > 0 ? '#ef4444' : '#10b981' }}>B$ {(totalNet - totalPaid).toFixed(2)}</div></div>
          <div className="metric-icon-wrap" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}><Banknote size={22} /></div>
        </div>
      </div>

      <div className="glass-panel">
        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Working Days</th>
                <th>Present Days</th>
                <th>OT Hours</th>
                <th>Advances</th>
                <th>Gross Salary</th>
                <th>Net Salary</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', color: '#64748b' }}>No salary records for this month. Click "Compute Salary" to generate.</td></tr>
              ) : records.map(r => (
                <tr key={r.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#fff' }}>{r.employee.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{r.employee.employeeId}</div>
                  </td>
                  <td>{r.workingDays}</td>
                  <td>{r.presentDays}</td>
                  <td>{r.overtimeHours}h</td>
                  <td style={{ color: r.advances > 0 ? '#f59e0b' : '#64748b' }}>B$ {r.advances.toFixed(2)}</td>
                  <td>B$ {r.grossSalary.toFixed(2)}</td>
                  <td style={{ fontWeight: 700, color: '#fff' }}>B$ {r.netSalary.toFixed(2)}</td>
                  <td><span className={`badge ${r.status === 'PAID' ? 'badge-success' : 'badge-danger'}`}>{r.status}</span></td>
                  <td>
                    {r.status === 'UNPAID' && (
                      <button onClick={() => handleMarkPaid(r.id)} className="btn-outline" style={{ fontSize: '0.8rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', borderColor: 'rgba(16,185,129,0.3)' }}>
                        <CheckCircle size={14} /> Mark Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="overlay">
          <div className="modal-content">
            <div className="flex-between" style={{ marginBottom: '20px' }}>
              <h2 className="modal-title" style={{ margin: 0 }}>Compute Salary — {MONTHS[month - 1]} {year}</h2>
              <button type="button" style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }} onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>Employee</label>
                <CustomSelect value={selectedEmp} onChange={setSelectedEmp} placeholder="-- Select Employee --" options={employees.map(e => ({ value: e.id.toString(), label: `${e.name} (B$ ${e.salary.toFixed(0)}/mo)` }))} required />
              </div>
              <div className="form-grid">
                <div className="col-6 form-group">
                  <label>Working Days</label>
                  <input type="number" className="form-input" value={form.workingDays} onChange={e => setForm({ ...form, workingDays: e.target.value })} required />
                </div>
                <div className="col-6 form-group">
                  <label>Present Days</label>
                  <input type="number" className="form-input" value={form.presentDays} onChange={e => setForm({ ...form, presentDays: e.target.value })} required />
                </div>
                <div className="col-6 form-group">
                  <label>Overtime Hours</label>
                  <input type="number" className="form-input" value={form.overtimeHours} onChange={e => setForm({ ...form, overtimeHours: e.target.value })} />
                </div>
                <div className="col-6 form-group">
                  <label>OT Rate (BND/hr)</label>
                  <input type="number" className="form-input" value={form.overtimeRate} onChange={e => setForm({ ...form, overtimeRate: e.target.value })} />
                </div>
                <div className="col-12 form-group">
                  <label>Advances / Deductions (BND)</label>
                  <input type="number" className="form-input" value={form.advances} onChange={e => setForm({ ...form, advances: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary"><Save size={16} /> Compute & Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
