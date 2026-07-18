'use client';

import { useState, useEffect } from 'react';
import { Plus, Building2, Save, X, Pencil, Phone, AlertTriangle } from 'lucide-react';
import Checklist from '@/components/Checklist';
import { SkeletonMetricCard, SkeletonTableRows } from '@/components/Skeleton';
import FileUpload from '@/components/FileUpload';

const DEFAULT_CHECKLIST = [
  { label: 'IC Copy received', checked: false },
  { label: 'Agreement signed', checked: false },
  { label: 'Bank details verified', checked: false },
];

interface Supplier {
  id: number;
  name: string;
  contact?: string;
  outstandingAdvance: number;
  bankName?: string;
  bankAccount?: string;
  documents?: string;
  createdAt: string;
  _count?: { purchases: number };
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState({ name: '', contact: '', outstandingAdvance: '0.00', bankName: '', bankAccount: '' });
  const [docChecklist, setDocChecklist] = useState(DEFAULT_CHECKLIST);
  const [docFile, setDocFile] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchSuppliers(); }, []);

  const fetchSuppliers = async () => {
    const res = await fetch('/api/suppliers');
    const data = await res.json();
    setSuppliers(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  const openAdd = () => { setEditing(null); setForm({ name: '', contact: '', outstandingAdvance: '0.00', bankName: '', bankAccount: '' }); setDocChecklist(DEFAULT_CHECKLIST); setDocFile(''); setShowModal(true); };
  const openEdit = (s: Supplier) => { setEditing(s); setForm({ name: s.name, contact: s.contact || '', outstandingAdvance: s.outstandingAdvance.toString(), bankName: s.bankName || '', bankAccount: s.bankAccount || '' }); setDocChecklist(s.documents ? JSON.parse(s.documents) : DEFAULT_CHECKLIST); setDocFile(''); setShowModal(true); };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    try {
      const url = editing ? `/api/suppliers/${editing.id}` : '/api/suppliers';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: form.name, contact: form.contact, outstandingAdvance: parseFloat(form.outstandingAdvance) || 0, bankName: form.bankName || null, bankAccount: form.bankAccount || null, documents: JSON.stringify(docChecklist) }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ type: 'success', text: editing ? `Updated ${form.name}` : `Supplier ${form.name} registered.` });
      setShowModal(false);
      fetchSuppliers();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const totalAdvance = suppliers.reduce((s, x) => s + x.outstandingAdvance, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Supplier Management</h1>
          <p className="page-title-desc">Manage scrap and vehicle suppliers, track outstanding advances and contact details.</p>
        </div>
        <button className="btn-primary" onClick={openAdd}><Plus size={16} /> Add Supplier</button>
      </div>

      {message && (
        <div style={{ padding: '16px', borderRadius: '12px', marginBottom: '24px', background: message.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: message.type === 'success' ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(239,68,68,0.2)', color: message.type === 'success' ? '#10b981' : '#ef4444', fontWeight: 500, display: 'flex', justifyContent: 'space-between' }}>
          <span>{message.text}</span>
          <button style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }} onClick={() => setMessage(null)}><X size={16} /></button>
        </div>
      )}

      <div className="metrics-grid" style={{ marginBottom: '32px' }}>
        {loading ? <><SkeletonMetricCard /><SkeletonMetricCard /></> : <>
        <div className="metric-card">
          <div className="metric-info"><h3>Total Suppliers</h3><div className="metric-value">{suppliers.length}</div></div>
          <div className="metric-icon-wrap" style={{ background: 'rgba(201, 168, 76,0.1)', color: '#c9a84c' }}><Building2 size={22} /></div>
        </div>
        <div className="metric-card">
          <div className="metric-info"><h3>Total Outstanding Advances</h3><div className="metric-value" style={{ color: totalAdvance > 0 ? '#f59e0b' : '#10b981' }}>B$ {totalAdvance.toFixed(2)}</div></div>
          <div className="metric-icon-wrap" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}><AlertTriangle size={22} /></div>
        </div>
        </>}
      </div>

      <div className="glass-panel">
        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>ID</th><th>Supplier Name</th><th>Contact</th><th>Bank</th><th>Outstanding Advance</th><th>Registered</th><th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? <SkeletonTableRows cols={7} rows={5} /> : suppliers.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: '#64748b' }}>No suppliers registered.</td></tr>
              ) : suppliers.map(s => (
                <tr key={s.id}>
                  <td><code style={{ color: '#c9a84c', background: 'rgba(201, 168, 76,0.08)', padding: '2px 6px', borderRadius: '4px' }}>SUP-{String(s.id).padStart(3, '0')}</code></td>
                  <td style={{ fontWeight: 600, color: '#fff' }}>{s.name}</td>
                  <td style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={13} style={{ opacity: 0.5 }} />{s.contact || '—'}</td>
                  <td style={{ fontSize: '0.85rem' }}>{s.bankName ? `${s.bankName}${s.bankAccount ? ` ···${s.bankAccount.slice(-4)}` : ''}` : '—'}</td>
                  <td>
                    {s.outstandingAdvance > 0
                      ? <span style={{ color: '#f59e0b', fontWeight: 650 }}>B$ {s.outstandingAdvance.toFixed(2)}</span>
                      : <span style={{ color: '#10b981' }}>Nil</span>}
                  </td>
                  <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button onClick={() => openEdit(s)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '4px 8px', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
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
              <h2 className="modal-title" style={{ margin: 0 }}>{editing ? 'Edit Supplier' : 'Register New Supplier'}</h2>
              <button type="button" style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }} onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>Supplier / Company Name</label>
                <input type="text" className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Contact Phone</label>
                <input type="text" className="form-input" placeholder="+673 8xxxxxx" value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Outstanding Advance (BND)</label>
                <input type="number" className="form-input" placeholder="0.00" value={form.outstandingAdvance} onChange={e => setForm({ ...form, outstandingAdvance: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Bank Name</label>
                <input type="text" className="form-input" placeholder="e.g. Baiduri Bank" value={form.bankName} onChange={e => setForm({ ...form, bankName: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Bank Account No.</label>
                <input type="text" className="form-input" placeholder="e.g. 01-234567-8" value={form.bankAccount} onChange={e => setForm({ ...form, bankAccount: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Document Checklist</label>
                <Checklist items={docChecklist} onChange={setDocChecklist} />
              </div>
              <FileUpload label="Upload Document (IC / Agreement)" value={docFile} onChange={setDocFile} accept="both" compact />
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary"><Save size={16} /> {editing ? 'Save Changes' : 'Register'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
