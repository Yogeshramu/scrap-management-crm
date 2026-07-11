'use client';

import { useState, useEffect } from 'react';
import { Plus, UserCheck, Save, X, Pencil, Phone } from 'lucide-react';
import { SkeletonMetricCard, SkeletonTableRows } from '../../components/Skeleton';

interface Customer {
  id: number;
  name: string;
  contact?: string;
  createdAt: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState({ name: '', contact: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/sales/customers');
      if (!res.ok) throw new Error('Failed to fetch customers');
      const data = await res.json();
      setCustomers(Array.isArray(data) ? data : []);
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to load customers' });
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => { setEditing(null); setForm({ name: '', contact: '' }); setShowModal(true); };
  const openEdit = (c: Customer) => { setEditing(c); setForm({ name: c.name, contact: c.contact || '' }); setShowModal(true); };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setSubmitting(true);
    try {
      const url = editing ? `/api/sales/customers/${editing.id}` : '/api/sales/customers';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ type: 'success', text: editing ? `Updated ${form.name}` : `Customer ${form.name} registered.` });
      setTimeout(() => setMessage(null), 4000);
      setShowModal(false);
      fetchCustomers();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Something went wrong' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Customer Management</h1>
          <p className="page-title-desc">Manage wholesale buyers and scrap export customers.</p>
        </div>
        <button className="btn-primary" onClick={openAdd}><Plus size={16} /> Add Customer</button>
      </div>

      {message && (
        <div style={{ padding: '16px', borderRadius: '12px', marginBottom: '24px', background: message.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: message.type === 'success' ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(239,68,68,0.2)', color: message.type === 'success' ? '#10b981' : '#ef4444', fontWeight: 500, display: 'flex', justifyContent: 'space-between' }}>
          <span>{message.text}</span>
          <button style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }} onClick={() => setMessage(null)}><X size={16} /></button>
        </div>
      )}

      <div className="metrics-grid" style={{ marginBottom: '32px' }}>
        {loading ? <SkeletonMetricCard /> : <div className="metric-card">
          <div className="metric-info"><h3>Total Customers</h3><div className="metric-value">{customers.length}</div></div>
          <div className="metric-icon-wrap" style={{ background: 'rgba(14,165,233,0.1)', color: '#0ea5e9' }}><UserCheck size={22} /></div>
        </div>}
      </div>

      <div className="glass-panel">
        <div className="table-wrapper">
          <table className="custom-table">
            <thead><tr><th>ID</th><th>Customer Name</th><th>Contact</th><th>Registered</th><th></th></tr></thead>
            <tbody>
              {loading ? <SkeletonTableRows cols={5} rows={5} /> : customers.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: '#64748b' }}>No customers registered.</td></tr>
              ) : customers.map(c => (
                <tr key={c.id}>
                  <td><code style={{ color: '#0ea5e9', background: 'rgba(14,165,233,0.08)', padding: '2px 6px', borderRadius: '4px' }}>CUS-{String(c.id).padStart(3, '0')}</code></td>
                  <td style={{ fontWeight: 600, color: '#fff' }}>{c.name}</td>
                  <td style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={13} style={{ opacity: 0.5 }} />{c.contact || '—'}</td>
                  <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button onClick={() => openEdit(c)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '4px 8px', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
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
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex-between" style={{ marginBottom: '20px' }}>
              <h2 className="modal-title" style={{ margin: 0 }}>{editing ? 'Edit Customer' : 'Register New Customer'}</h2>
              <button type="button" style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }} onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>Company / Customer Name</label>
                <input type="text" className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Contact Phone</label>
                <input type="text" className="form-input" placeholder="+673 2xxxxxx" value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}><Save size={16} /> {submitting ? 'Saving...' : editing ? 'Save Changes' : 'Register'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
