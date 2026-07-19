'use client';

import { useState, useEffect } from 'react';
import { Plus, Users, Save, X, Pencil, Briefcase, Phone, CreditCard, AlertTriangle } from 'lucide-react';
import CustomSelect from '../../components/CustomSelect';
import { SkeletonMetricCard, SkeletonTableRows } from '../../components/Skeleton';
import FileUpload from '../../components/FileUpload';

interface Employee {
  id: number;
  employeeId: string;
  name: string;
  icNumber?: string;
  passportNumber?: string;
  country?: string;
  visaExpiry?: string;
  phone?: string;
  position?: string;
  department?: string;
  salary: number;
  bankAccount?: string;
  bankName?: string;
  status: string;
  joinDate: string;
}

const DEPARTMENTS = ['Operations', 'Logistics', 'Admin', 'Workshop', 'Management'];
const POSITIONS = ['Driver', 'Mechanic', 'Machine Operator', 'Forklift Operator', 'General Labour', 'Welder', 'Waste Collector'];

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const loadTestData = async () => {
    setForm({
      name: 'Md. Karim Uddin',
      icNumber: '',
      passportNumber: 'BD-9876543',
      country: 'Bangladesh',
      visaExpiry: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      phone: '+673 8234567',
      position: 'General Labour',
      department: 'Operations',
      salary: '35',
      bankName: 'Bank Islam',
      bankAccount: '9876543210',
      joinDate: '2024-03-01',
      photo: '',
      documents: '',
    });
  };

  const blank = { name: '', icNumber: '', passportNumber: '', country: '', visaExpiry: '', phone: '', position: 'Driver', department: 'Operations', salary: '', bankAccount: '', bankName: '', joinDate: new Date().toISOString().split('T')[0], photo: '', documents: '' };
  const [form, setForm] = useState<any>(blank);

  useEffect(() => { fetchEmployees(); }, []);

  const fetchEmployees = async () => {
    const res = await fetch('/api/employees');
    const data = await res.json();
    setEmployees(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  const openAdd = () => { setEditing(null); setForm(blank); setShowModal(true); };
  const openEdit = (e: Employee) => {
    setEditing(e);
    setForm({ name: e.name, icNumber: e.icNumber || '', passportNumber: (e as any).passportNumber || '', country: (e as any).country || '', visaExpiry: (e as any).visaExpiry ? new Date((e as any).visaExpiry).toISOString().split('T')[0] : '', phone: e.phone || '', position: e.position || 'Driver', department: e.department || 'Operations', salary: e.salary.toString(), bankAccount: e.bankAccount || '', bankName: e.bankName || '', joinDate: e.joinDate.split('T')[0], photo: (e as any).photo || '', documents: (e as any).documents || '' });
    setShowModal(true);
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    try {
      const url = editing ? `/api/employees/${editing.id}` : '/api/employees';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ type: 'success', text: editing ? `Updated ${form.name}` : `Registered ${data.employeeId} — ${form.name}` });
      setShowModal(false);
      fetchEmployees();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const active = employees.filter(e => e.status === 'Active').length;
  const today = new Date();
  const in30 = new Date(); in30.setDate(today.getDate() + 30);
  const visaExpiring = employees.filter(e => { if (!(e as any).visaExpiry) return false; const d = new Date((e as any).visaExpiry); return d <= in30; }).length;
  const getVisaBadge = (visaExpiry?: string) => {
    if (!visaExpiry) return <span style={{ color: '#475569' }}>—</span>;
    const exp = new Date(visaExpiry);
    const diff = Math.ceil((exp.getTime() - today.getTime()) / 86400000);
    if (diff < 0) return <span className="badge" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>Expired</span>;
    if (diff <= 30) return <span className="badge" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>⚠ {exp.toLocaleDateString()}</span>;
    return <span className="badge badge-success">{exp.toLocaleDateString()}</span>;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Employee Management</h1>
          <p className="page-title-desc">Staff registry, personal details, salary configuration and document records.</p>
        </div>
        <button className="btn-primary" onClick={openAdd}><Plus size={16} /> Add Employee</button>
      </div>

      {message && (
        <div style={{ padding: '16px', borderRadius: '12px', marginBottom: '24px', background: message.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: message.type === 'success' ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(239,68,68,0.2)', color: message.type === 'success' ? '#10b981' : '#ef4444', fontWeight: 500, display: 'flex', justifyContent: 'space-between' }}>
          <span>{message.text}</span>
          <button style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }} onClick={() => setMessage(null)}><X size={16} /></button>
        </div>
      )}

      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '32px' }}>
        {loading ? <><SkeletonMetricCard /><SkeletonMetricCard /><SkeletonMetricCard /><SkeletonMetricCard /></> : <>
        <div className="metric-card">
          <div className="metric-info"><h3>Total Staff</h3><div className="metric-value">{employees.length}</div></div>
          <div className="metric-icon-wrap" style={{ background: 'rgba(201, 168, 76,0.1)', color: '#c9a84c' }}><Users size={22} /></div>
        </div>
        <div className="metric-card">
          <div className="metric-info"><h3>Active</h3><div className="metric-value">{active}</div></div>
          <div className="metric-icon-wrap" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}><Briefcase size={22} /></div>
        </div>
        <div className="metric-card">
          <div className="metric-info"><h3>Avg. Daily Rate</h3><div className="metric-value">B$ {active === 0 ? '0.00' : (employees.filter(e => e.status === 'Active').reduce((s, e) => s + e.salary, 0) / active).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div></div>
          <div className="metric-icon-wrap" style={{ background: 'rgba(232, 213, 163,0.1)', color: '#e8d5a3' }}><CreditCard size={22} /></div>
        </div>
        <div className="metric-card">
          <div className="metric-info"><h3>Visa Alerts</h3><div className="metric-value" style={{ color: visaExpiring > 0 ? '#f59e0b' : '#10b981' }}>{visaExpiring}</div></div>
          <div className="metric-icon-wrap" style={{ background: visaExpiring > 0 ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)', color: visaExpiring > 0 ? '#f59e0b' : '#10b981' }}><AlertTriangle size={22} /></div>
        </div>
        </>}
      </div>

      <div className="glass-panel">
        <div className="table-wrapper">
          <table className="custom-table">
            <thead><tr><th>ID</th><th>Name</th><th>Position</th><th>Department</th><th>Phone</th><th>Bank</th><th>Daily Rate (BND)</th><th>Visa Expiry</th><th>Status</th><th>Join Date</th><th></th></tr></thead>
            <tbody>
              {loading ? <SkeletonTableRows cols={10} rows={5} /> : employees.length === 0 ? (
                <tr><td colSpan={10} style={{ textAlign: 'center', color: '#64748b' }}>No employees registered yet.</td></tr>
              ) : employees.map(e => (
                <tr key={e.id}>
                  <td><code style={{ color: '#c9a84c', background: 'rgba(201, 168, 76,0.08)', padding: '2px 6px', borderRadius: '4px' }}>{e.employeeId}</code></td>
                  <td style={{ fontWeight: 600, color: '#fff' }}>{e.name}</td>
                  <td>{e.position || '—'}</td>
                  <td>{e.department || '—'}</td>
                  <td style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={13} style={{ opacity: 0.5 }} />{e.phone || '—'}</td>
                  <td style={{ fontSize: '0.85rem' }}>{e.bankName ? `${e.bankName} ···${e.bankAccount?.slice(-4)}` : '—'}</td>
                  <td style={{ fontWeight: 650 }}>B$ {e.salary.toFixed(2)}/day</td>
                  <td>{getVisaBadge((e as any).visaExpiry)}</td>
                  <td><span className={`badge ${e.status === 'Active' ? 'badge-success' : 'badge-neutral'}`}>{e.status}</span></td>
                  <td>{new Date(e.joinDate).toLocaleDateString()}</td>
                  <td>
                    <button onClick={() => openEdit(e)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '4px 8px', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
                      <Pencil size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" style={{ maxWidth: '680px' }} onClick={e => e.stopPropagation()}>
            <div className="flex-between" style={{ marginBottom: '20px' }}>
              <h2 className="modal-title" style={{ margin: 0 }}>{editing ? `Edit — ${editing.employeeId}` : 'Register New Employee'}</h2>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {!editing && (
                  <button type="button" className="btn-outline" onClick={loadTestData} style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                    ⚡ Load Test Data
                  </button>
                )}
                <button type="button" style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }} onClick={() => setShowModal(false)}><X size={20} /></button>
              </div>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="col-6 form-group">
                  <label>Full Name</label>
                  <input type="text" className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="col-6 form-group">
                  <label>IC Number</label>
                  <input type="text" className="form-input" value={form.icNumber} onChange={e => setForm({ ...form, icNumber: e.target.value })} />
                </div>
                <div className="col-6 form-group">
                  <label>Passport Number</label>
                  <input type="text" className="form-input" value={form.passportNumber} onChange={e => setForm({ ...form, passportNumber: e.target.value })} />
                </div>
                <div className="col-6 form-group">
                  <label>Country</label>
                  <input type="text" className="form-input" placeholder="e.g. Bangladesh, Malaysia" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} />
                </div>
                <div className="col-6 form-group">
                  <label>Visa Expiry Date</label>
                  <input type="date" className="form-input" value={form.visaExpiry} onChange={e => setForm({ ...form, visaExpiry: e.target.value })} />
                </div>
                <div className="col-6 form-group">
                  <label>Phone</label>
                  <input type="text" className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="col-6 form-group">
                  <label>Join Date</label>
                  <input type="date" className="form-input" value={form.joinDate} onChange={e => setForm({ ...form, joinDate: e.target.value })} />
                </div>
                <div className="col-6 form-group">
                  <label>Position</label>
                  <CustomSelect value={form.position} onChange={v => setForm({ ...form, position: v })} options={POSITIONS.map(p => ({ value: p, label: p }))} required />
                </div>
                <div className="col-6 form-group">
                  <label>Department</label>
                  <CustomSelect value={form.department} onChange={v => setForm({ ...form, department: v })} options={DEPARTMENTS.map(d => ({ value: d, label: d }))} required />
                </div>
                <div className="col-4 form-group">
                  <label>Daily Rate (BND)</label>
                  <input type="number" className="form-input" placeholder="0.00" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} required />
                </div>
                <div className="col-4 form-group">
                  <label>Bank Name</label>
                  <input type="text" className="form-input" placeholder="e.g. Baiduri Bank" value={form.bankName} onChange={e => setForm({ ...form, bankName: e.target.value })} />
                </div>
                <div className="col-4 form-group">
                  <label>Bank Account No.</label>
                  <input type="text" className="form-input" value={form.bankAccount} onChange={e => setForm({ ...form, bankAccount: e.target.value })} />
                </div>
                {editing && (
                  <div className="col-12 form-group">
                    <label>Status</label>
                    <CustomSelect value={form.status || editing.status} onChange={v => setForm({ ...form, status: v })} options={[{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }]} required />
                  </div>
                )}
                <div className="col-6">
                  <FileUpload label="Employee Photo" value={form.photo} onChange={v => setForm({ ...form, photo: v })} accept="images" compact />
                </div>
                <div className="col-6">
                  <FileUpload label="IC / Documents" value={form.documents} onChange={v => setForm({ ...form, documents: v })} accept="both" compact />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary"><Save size={16} /> {editing ? 'Save Changes' : 'Register Employee'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
