'use client';

import { useState } from 'react';
import { BarChart3, Download, TrendingUp, TrendingDown, Truck, Users, Building2, UserCheck, CreditCard } from 'lucide-react';

type ReportType = 'sales' | 'purchases' | 'expenses' | 'salary' | 'employees' | 'suppliers' | 'customers';
type DatePreset = 'today' | 'week' | 'month' | 'year' | 'custom';

interface ReportData {
  rows: any[];
  summary: Record<string, any>;
}

function getPresetDates(preset: DatePreset): { from: string; to: string } {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const today = fmt(now);
  if (preset === 'today') return { from: today, to: today };
  if (preset === 'week') {
    const start = new Date(now); start.setDate(now.getDate() - now.getDay());
    return { from: fmt(start), to: today };
  }
  if (preset === 'month') {
    return { from: fmt(new Date(now.getFullYear(), now.getMonth(), 1)), to: today };
  }
  if (preset === 'year') {
    return { from: fmt(new Date(now.getFullYear(), 0, 1)), to: today };
  }
  return { from: '', to: '' };
}

const REPORT_TYPES: { key: ReportType; label: string; icon: any; color: string }[] = [
  { key: 'sales', label: 'Sales', icon: TrendingUp, color: '#e8d5a3' },
  { key: 'purchases', label: 'Purchases', icon: TrendingDown, color: '#c9a84c' },
  { key: 'expenses', label: 'Expenses', icon: CreditCard, color: '#ef4444' },
  { key: 'salary', label: 'Salary', icon: Users, color: '#10b981' },
  { key: 'employees', label: 'Employees', icon: Users, color: '#f59e0b' },
  { key: 'suppliers', label: 'Suppliers', icon: Building2, color: '#d4af6a' },
  { key: 'customers', label: 'Customers', icon: UserCheck, color: '#e8d5a3' },
];

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('sales');
  const [preset, setPreset] = useState<DatePreset>('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getDateRange = () => {
    if (preset === 'custom') return { from: customFrom, to: customTo };
    return getPresetDates(preset);
  };

  const fetchReport = async () => {
    const { from, to } = getDateRange();
    if (!from || !to) { setError('Please select a valid date range.'); return; }
    setLoading(true);
    setError('');
    try {
      let rows: any[] = [];
      let summary: Record<string, any> = {};

      if (reportType === 'sales') {
        const res = await fetch(`/api/sales`);
        const all: any[] = await res.json();
        rows = all.filter(s => s.date >= from && s.date <= to + 'T23:59:59');
        summary = {
          'Total Invoices': rows.length,
          'Total Revenue': `B$ ${rows.reduce((s, r) => s + r.grandTotal, 0).toFixed(2)}`,
          'Paid': rows.filter(r => r.paymentStatus === 'PAID').length,
          'Unpaid': rows.filter(r => r.paymentStatus === 'UNPAID').length,
        };
      } else if (reportType === 'purchases') {
        const res = await fetch(`/api/purchases`);
        const all: any[] = await res.json();
        rows = all.filter(p => p.date >= from && p.date <= to + 'T23:59:59');
        summary = {
          'Total Purchases': rows.length,
          'Total Spent': `B$ ${rows.reduce((s, r) => s + r.agreedPrice, 0).toFixed(2)}`,
          'Vehicles': rows.filter(r => r.type === 'VEHICLE').length,
          'Scrap Lots': rows.filter(r => r.type === 'MIXED_SCRAP').length,
        };
      } else if (reportType === 'expenses') {
        const res = await fetch(`/api/expenses?from=${from}&to=${to}`);
        rows = await res.json();
        summary = {
          'Total Expenses': rows.length,
          'Total Amount': `B$ ${rows.reduce((s: number, r: any) => s + r.amount, 0).toFixed(2)}`,
        };
      } else if (reportType === 'salary') {
        const res = await fetch(`/api/salary`);
        rows = await res.json();
        summary = {
          'Total Records': rows.length,
          'Total Net Salary': `B$ ${rows.reduce((s: number, r: any) => s + r.netSalary, 0).toFixed(2)}`,
          'Paid': rows.filter((r: any) => r.status === 'PAID').length,
          'Unpaid': rows.filter((r: any) => r.status === 'UNPAID').length,
        };
      } else if (reportType === 'employees') {
        const res = await fetch(`/api/employees`);
        rows = await res.json();
        summary = {
          'Total Employees': rows.length,
          'Active': rows.filter((r: any) => r.status === 'Active').length,
          'Monthly Payroll': `B$ ${rows.filter((r: any) => r.status === 'Active').reduce((s: number, r: any) => s + r.salary, 0).toFixed(2)}`,
        };
      } else if (reportType === 'suppliers') {
        const res = await fetch(`/api/suppliers`);
        rows = await res.json();
        summary = {
          'Total Suppliers': rows.length,
          'Total Advances': `B$ ${rows.reduce((s: number, r: any) => s + r.outstandingAdvance, 0).toFixed(2)}`,
        };
      } else if (reportType === 'customers') {
        const res = await fetch(`/api/sales/customers`);
        rows = await res.json();
        summary = { 'Total Customers': rows.length };
      }

      setData({ rows, summary });
    } catch (err: any) {
      setError(err.message || 'Failed to load report.');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!data || data.rows.length === 0) return;
    const headers = Object.keys(data.rows[0]).join(',');
    const csvRows = data.rows.map(r => Object.values(r).map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));
    const csv = [headers, ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentType = REPORT_TYPES.find(r => r.key === reportType)!;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Reports & Analytics</h1>
          <p className="page-title-desc">Generate filtered reports across all modules with date range controls.</p>
        </div>
        {data && data.rows.length > 0 && (
          <button className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={exportCSV}>
            <Download size={16} /> Export CSV
          </button>
        )}
      </div>

      {/* Report type selector */}
      <div className="tabs-container" style={{ marginBottom: '24px', flexWrap: 'wrap' }}>
        {REPORT_TYPES.map(r => {
          const Icon = r.icon;
          return (
            <div key={r.key} className={`tab-nav ${reportType === r.key ? 'active' : ''}`} onClick={() => { setReportType(r.key); setData(null); }} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Icon size={14} style={{ color: reportType === r.key ? r.color : undefined }} /> {r.label}
            </div>
          );
        })}
      </div>

      {/* Date filter */}
      <div className="glass-panel" style={{ marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        {(['today', 'week', 'month', 'year', 'custom'] as DatePreset[]).map(p => (
          <button key={p} className={preset === p ? 'btn-primary' : 'btn-outline'} style={{ padding: '10px 16px', fontSize: '0.85rem', textTransform: 'capitalize' }} onClick={() => setPreset(p)}>
            {p}
          </button>
        ))}
        {preset === 'custom' && (
          <>
            <div className="form-group" style={{ margin: 0 }}>
              <label>From</label>
              <input type="date" className="form-input" value={customFrom} onChange={e => setCustomFrom(e.target.value)} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>To</label>
              <input type="date" className="form-input" value={customTo} onChange={e => setCustomTo(e.target.value)} />
            </div>
          </>
        )}
        <button className="btn-primary" style={{ padding: '12px 24px' }} onClick={fetchReport} disabled={loading}>
          <BarChart3 size={16} /> {loading ? 'Loading...' : 'Generate Report'}
        </button>
      </div>

      {error && <div style={{ padding: '16px', borderRadius: '12px', marginBottom: '24px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>{error}</div>}

      {data && (
        <>
          {/* Summary cards */}
          <div className="metrics-grid" style={{ marginBottom: '32px' }}>
            {Object.entries(data.summary).map(([k, v]) => (
              <div key={k} className="metric-card">
                <div className="metric-info">
                  <h3>{k}</h3>
                  <div className="metric-value" style={{ fontSize: '1.5rem', color: currentType.color }}>{String(v)}</div>
                </div>
                <div className="metric-icon-wrap" style={{ background: `${currentType.color}18`, color: currentType.color }}>
                  <currentType.icon size={22} />
                </div>
              </div>
            ))}
          </div>

          {/* Data table */}
          <div className="glass-panel">
            <div className="flex-between" style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.25rem', textTransform: 'capitalize' }}>{reportType} Report — {data.rows.length} records</h2>
            </div>
            {data.rows.length === 0 ? (
              <p style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>No records found for the selected period.</p>
            ) : (
              <div className="table-wrapper">
                <table className="custom-table">
                  <thead>
                    <tr>
                      {Object.keys(data.rows[0]).slice(0, 8).map(k => (
                        <th key={k} style={{ textTransform: 'capitalize' }}>{k.replace(/([A-Z])/g, ' $1').trim()}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((row, i) => (
                      <tr key={i}>
                        {Object.values(row).slice(0, 8).map((v: any, j) => (
                          <td key={j} style={{ fontSize: '0.875rem' }}>
                            {typeof v === 'object' && v !== null ? JSON.stringify(v).slice(0, 40) : String(v ?? '—').slice(0, 60)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
