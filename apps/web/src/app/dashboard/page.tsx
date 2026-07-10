'use client';

import { useEffect, useState } from 'react';
import {
  TrendingDown, TrendingUp, Users, Truck, Car,
  AlertTriangle, ShieldCheck, FileText,
  ArrowUpRight, ArrowDownRight, RefreshCw
} from 'lucide-react';
import { SkeletonMetricCard, SkeletonTableRows, SkeletonBox } from '../../components/Skeleton';

interface Alert {
  id: number;
  name: string;
  plateNumber: string;
  roadTaxDays: number;
  insDays: number;
  isInspExpired: boolean;
}

interface Stats {
  totalSpentToday: number;
  vehiclesAcquired: number;
  alloyWheelsToday: number;
  logisticsRunsToday: number;
  expiryAlertsCount: number;
  expiryAlerts: Alert[];
  totalSalesRevenueToday: number;
  invoicesToday: number;
  totalExpensesToday: number;
  activeEmployeesCount: number;
}

interface AuditLog {
  id: number;
  action: string;
  performedBy: string;
  timestamp: string;
  details: string;
}

interface CashRecord {
  id: number;
  date: string;
  type: string;
  category: string;
  amount: number;
  referenceId: string;
  description: string;
}

export default function OverviewDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [cashFlow, setCashFlow] = useState<CashRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort('timeout'), 10000);
    let cancelled = false;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const [statsRes, logsRes, cashRes] = await Promise.all([
          fetch('/api/dashboard', { signal: controller.signal }),
          fetch('/api/auditlogs?limit=8', { signal: controller.signal }),
          fetch('/api/cashbook?limit=6', { signal: controller.signal }),
        ]);
        clearTimeout(timeoutId);
        if (!statsRes.ok) throw new Error(`Dashboard API error: ${statsRes.status}`);
        const [statsData, logsData, cashData] = await Promise.all([
          statsRes.json(), logsRes.json(), cashRes.json()
        ]);
        if (cancelled) return;
        setStats(statsData);
        setLogs(Array.isArray(logsData) ? logsData.slice(0, 8) : []);
        setCashFlow(Array.isArray(cashData) ? cashData.slice(0, 6) : []);
      } catch (err: any) {
        if (cancelled) return;
        if (err.name === 'AbortError') {
          if (controller.signal.reason === 'timeout') {
            setError('Request timed out. Please try again.');
          }
          return;
        }
        setError(err.message || 'Failed to load dashboard data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [refreshKey]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Operations Control Overview</h1>
          <p className="page-title-desc">Real-time status metrics, daily material processing speed, and compliance notifications.</p>
        </div>
        <button className="btn-primary" onClick={() => setRefreshKey(prev => prev + 1)} style={{ padding: '10px 18px', fontSize: '0.875rem' }}>
          <RefreshCw size={16} />
          Refresh Stats
        </button>
      </div>

      {loading && !stats ? (
        <>
          <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonMetricCard key={i} />)}
          </div>
          <div className="dashboard-layout-main">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div className="glass-panel">
                <SkeletonBox w="40%" h="18px" style={{ marginBottom: '20px' }} />
                <table className="custom-table"><tbody><SkeletonTableRows cols={6} rows={6} /></tbody></table>
              </div>
              <div className="glass-panel">
                <SkeletonBox w="40%" h="18px" style={{ marginBottom: '20px' }} />
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} style={{ display: 'flex', gap: '16px', padding: '16px', marginBottom: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                    <SkeletonBox w="36px" h="36px" style={{ borderRadius: '8px', flexShrink: 0 }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <SkeletonBox w="60%" h="14px" />
                      <SkeletonBox w="90%" h="12px" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div className="glass-panel">
                <SkeletonBox w="50%" h="18px" style={{ marginBottom: '16px' }} />
                {Array.from({ length: 3 }).map((_, i) => <SkeletonBox key={i} h="60px" style={{ marginBottom: '10px' }} />)}
              </div>
              <div className="glass-panel">
                <SkeletonBox w="40%" h="18px" style={{ marginBottom: '16px' }} />
                {Array.from({ length: 3 }).map((_, i) => <SkeletonBox key={i} h="44px" style={{ marginBottom: '10px' }} />)}
              </div>
            </div>
          </div>
        </>
      ) : error ? (
        <div style={{ padding: '80px', textAlign: 'center', color: '#ef4444', fontSize: '1rem' }}>
          {error} — <button onClick={() => setRefreshKey(p => p + 1)} style={{ background: 'none', border: 'none', color: '#c9a84c', cursor: 'pointer', textDecoration: 'underline' }}>Retry</button>
        </div>
      ) : (
        <>
          <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <div className="metric-card">
              <div className="metric-info">
                <h3>Today's Revenue</h3>
                <div className="metric-value" style={{ color: '#e8d5a3' }}>B$ {stats?.totalSalesRevenueToday.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
              <div className="metric-icon-wrap" style={{ background: 'rgba(232, 213, 163, 0.1)', color: '#e8d5a3' }}>
                <TrendingUp size={22} />
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-info">
                <h3>Today's Purchases</h3>
                <div className="metric-value">B$ {stats?.totalSpentToday.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
              <div className="metric-icon-wrap" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                <TrendingDown size={22} />
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-info">
                <h3>Today's Expenses</h3>
                <div className="metric-value">B$ {stats?.totalExpensesToday.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
              <div className="metric-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                <TrendingDown size={22} />
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-info">
                <h3>Vehicles Processed</h3>
                <div className="metric-value">{stats?.vehiclesAcquired} Units</div>
              </div>
              <div className="metric-icon-wrap" style={{ background: 'rgba(201, 168, 76, 0.1)', color: '#c9a84c' }}>
                <Car size={22} />
              </div>
            </div>
            
            <div className="metric-card">
              <div className="metric-info">
                <h3>Active Employees</h3>
                <div className="metric-value">{stats?.activeEmployeesCount} Staff</div>
              </div>
              <div className="metric-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                <Users size={22} />
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-info">
                <h3>Logistics Runs</h3>
                <div className="metric-value">{stats?.logisticsRunsToday} Scheduled</div>
              </div>
              <div className="metric-icon-wrap" style={{ background: 'rgba(212, 175, 106, 0.1)', color: '#d4af6a' }}>
                <Truck size={22} />
              </div>
            </div>
          </div>

          <div className="dashboard-layout-main">
            {/* Left Side: Ledger & Logs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              
              {/* Daily Cash Book */}
              <div className="glass-panel">
                <div className="flex-between" style={{ marginBottom: '20px' }}>
                  <h2 style={{ fontSize: '1.25rem' }}>Recent Ledger Transactions</h2>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Cash Book Entries</span>
                </div>
                <div className="table-wrapper">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Ref ID</th>
                        <th>Flow</th>
                        <th>Category</th>
                        <th>Description</th>
                        <th style={{ textAlign: 'right' }}>Amount (BND)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cashFlow.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', color: '#64748b' }}>No recent entries found.</td>
                        </tr>
                      ) : (
                        cashFlow.map(c => (
                          <tr key={c.id}>
                            <td>{new Date(c.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                            <td><code style={{ color: '#fff', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>{c.referenceId || 'N/A'}</code></td>
                            <td>
                              {c.type === 'IN' ? (
                                <span className="badge badge-success" style={{ gap: '4px' }}>
                                  <ArrowUpRight size={12} /> IN
                                </span>
                              ) : (
                                <span className="badge badge-danger" style={{ gap: '4px' }}>
                                  <ArrowDownRight size={12} /> OUT
                                </span>
                              )}
                            </td>
                            <td>
                              <span className="badge badge-neutral">{c.category}</span>
                            </td>
                            <td style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>{c.description}</td>
                            <td style={{ textAlign: 'right', fontWeight: 650, color: c.type === 'IN' ? '#10b981' : '#fff' }}>
                              {c.type === 'IN' ? '+' : '-'} ${c.amount.toFixed(2)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* System Audit Trails */}
              <div className="glass-panel">
                <div className="flex-between" style={{ marginBottom: '20px' }}>
                  <h2 style={{ fontSize: '1.25rem' }}>System Audit Trails</h2>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>User Logs</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {logs.map(log => (
                    <div key={log.id} style={{ display: 'flex', gap: '16px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(201, 168, 76, 0.1)', color: '#c9a84c', width: '36px', height: '36px', borderRadius: '8px' }}>
                        <FileText size={18} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="flex-between">
                          <p style={{ fontWeight: 600, color: '#fff', fontSize: '0.95rem' }}>{log.action}</p>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '4px' }}>{log.details}</p>
                        <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '6px' }}>Performed by: <span style={{ color: '#c9a84c', fontWeight: 500 }}>{log.performedBy}</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Side: Expiry Warnings & Quick Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              
              {/* Compliance & Fleet Alerts */}
              <div className="glass-panel" style={{ border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <AlertTriangle style={{ color: '#ef4444' }} />
                  <h2 style={{ fontSize: '1.25rem' }}>Compliance & Expiry alerts</h2>
                </div>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '20px' }}>
                  The inventory tracker automatically highlights fleet vehicles requiring immediate renewal.
                </p>

                {stats?.expiryAlerts.length === 0 ? (
                  <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: '12px', color: '#10b981', fontSize: '0.9rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={16} /> All fleet documents are valid and up to date.
                  </div>
                ) : (
                  stats?.expiryAlerts.map(alert => (
                    <div key={alert.id} className="alert-item-card">
                      <div>
                        <div className="expiry-name">{alert.name}</div>
                        <code style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{alert.plateNumber}</code>
                        <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {alert.insDays <= 15 && <span style={{ color: '#f59e0b', display: 'inline-flex', alignItems: 'center', gap: '6px' }}><AlertTriangle size={14} /> Insurance renewal in {alert.insDays} days</span>}
                          {alert.roadTaxDays <= 30 && <span style={{ color: '#f59e0b', display: 'inline-flex', alignItems: 'center', gap: '6px' }}><AlertTriangle size={14} /> Road Tax renewal in {alert.roadTaxDays} days</span>}
                          {alert.isInspExpired && <span style={{ color: '#ef4444', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}><AlertTriangle size={14} /> Inspection expired or overdue</span>}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Quick Actions Panel */}
              <div className="glass-panel">
                <h2 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Operational Shortcuts</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <a href="/purchases" className="btn-primary" style={{ textAlign: 'center', width: '100%', justifyContent: 'center' }}>
                    Record New Purchase
                  </a>
                  <a href="/sales" className="btn-outline text-center" style={{ textAlign: 'center', display: 'block', width: '100%' }}>
                    Generate Sales Invoice
                  </a>
                  <a href="/transport" className="btn-outline text-center" style={{ textAlign: 'center', display: 'block', width: '100%' }}>
                    Settle Towing Statements
                  </a>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
