'use client';

import { useState, useEffect } from 'react';
import { Plus, CreditCard, Save, X, TrendingDown } from 'lucide-react';
import CustomSelect from '../../components/CustomSelect';
import { SkeletonTableRows, SkeletonBox } from '../../components/Skeleton';

interface Expense {
  id: number;
  date: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  paidTo?: string;
  referenceId?: string;
}

const CATEGORIES = ['UTILITIES', 'RENT', 'MAINTENANCE', 'FUEL', 'OFFICE', 'SALARY', 'TRANSPORT', 'OTHER'];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], category: 'OTHER', description: '', amount: '', paymentMethod: 'CASH', paidTo: '', referenceId: '' });

  useEffect(() => { fetchExpenses(); }, []);

  const fetchExpenses = async () => {
    const params = new URLSearchParams();
    if (filterFrom) params.set('from', filterFrom);
    if (filterTo) params.set('to', filterTo);
    const res = await fetch(`/api/expenses?${params}`);
    const data = await res.json();
    setExpenses(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    try {
      const res = await fetch('/api/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ type: 'success', text: `Expense recorded: B$ ${form.amount} — ${form.description}` });
      setShowModal(false);
      setForm({ date: new Date().toISOString().split('T')[0], category: 'OTHER', description: '', amount: '', paymentMethod: 'CASH', paidTo: '', referenceId: '' });
      fetchExpenses();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const byCategory = CATEGORIES.map(c => ({ cat: c, total: expenses.filter(e => e.category === c).reduce((s, x) => s + x.amount, 0) })).filter(x => x.total > 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Expense Management</h1>
          <p className="page-title-desc">Track all operational outflows by category, payment method and payee.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Record Expense</button>
      </div>

      {message && (
        <div style={{ padding: '16px', borderRadius: '12px', marginBottom: '24px', background: message.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: message.type === 'success' ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(239,68,68,0.2)', color: message.type === 'success' ? '#10b981' : '#ef4444', fontWeight: 500, display: 'flex', justifyContent: 'space-between' }}>
          <span>{message.text}</span>
          <button style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }} onClick={() => setMessage(null)}><X size={16} /></button>
        </div>
      )}

      {/* Date filter */}
      <div className="glass-panel" style={{ marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '160px' }}>
          <label>From Date</label>
          <input type="date" className="form-input" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} />
        </div>
        <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '160px' }}>
          <label>To Date</label>
          <input type="date" className="form-input" value={filterTo} onChange={e => setFilterTo(e.target.value)} />
        </div>
        <button className="btn-primary" style={{ padding: '12px 20px' }} onClick={fetchExpenses}>Apply Filter</button>
        <button className="btn-outline" style={{ padding: '12px 20px' }} onClick={() => { setFilterFrom(''); setFilterTo(''); setTimeout(fetchExpenses, 0); }}>Clear</button>
      </div>

      <div className="dashboard-layout-main">
        <div className="glass-panel">
          <div className="flex-between" style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.25rem' }}>Expense Ledger</h2>
            <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '1.1rem' }}>Total: B$ {total.toFixed(2)}</span>
          </div>
          <div className="table-wrapper">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Paid To</th>
                  <th>Method</th>
                  <th style={{ textAlign: 'right' }}>Amount (BND)</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <SkeletonTableRows cols={6} rows={6} /> : expenses.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: '#64748b' }}>No expenses recorded.</td></tr>
                ) : expenses.map(e => (
                  <tr key={e.id}>
                    <td>{new Date(e.date).toLocaleDateString()}</td>
                    <td><span className="badge badge-neutral">{e.category}</span></td>
                    <td style={{ color: '#fff', fontWeight: 500 }}>{e.description}</td>
                    <td>{e.paidTo || '—'}</td>
                    <td><span className="badge badge-neutral">{e.paymentMethod}</span></td>
                    <td style={{ textAlign: 'right', fontWeight: 650, color: '#ef4444' }}>B$ {e.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="metric-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em' }}>Total Outflow</h3>
              <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><TrendingDown size={20} /></div>
            </div>
            <div className="metric-value" style={{ color: '#ef4444' }}>B$ {total.toFixed(2)}</div>
          </div>

          <div className="glass-panel">
            <h2 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>By Category</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {byCategory.length === 0 ? <p style={{ color: '#64748b', fontSize: '0.9rem' }}>No data.</p> : byCategory.map(x => (
                <div key={x.cat} className="flex-between" style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <span className="badge badge-neutral">{x.cat}</span>
                  <strong style={{ color: '#fff' }}>B$ {x.total.toFixed(2)}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="overlay">
          <div className="modal-content">
            <div className="flex-between" style={{ marginBottom: '20px' }}>
              <h2 className="modal-title" style={{ margin: 0 }}>Record New Expense</h2>
              <button type="button" style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }} onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>Date</label>
                <input type="date" className="form-input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Category</label>
                <CustomSelect value={form.category} onChange={v => setForm({ ...form, category: v })} options={CATEGORIES.map(c => ({ value: c, label: c }))} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input type="text" className="form-input" placeholder="e.g. Monthly electricity bill" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Amount (BND)</label>
                <input type="number" className="form-input" placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Payment Method</label>
                <CustomSelect value={form.paymentMethod} onChange={v => setForm({ ...form, paymentMethod: v })} options={[{ value: 'CASH', label: 'Cash' }, { value: 'BANK_TRANSFER', label: 'Bank Transfer' }]} required />
              </div>
              <div className="form-group">
                <label>Paid To</label>
                <input type="text" className="form-input" placeholder="e.g. DST Broadband" value={form.paidTo} onChange={e => setForm({ ...form, paidTo: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary"><Save size={16} /> Record Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
