'use client';

import { useState, useEffect } from 'react';
import { 
  Truck, 
  DollarSign, 
  Activity, 
  CheckSquare, 
  Square,
  CheckCircle,
  FileCheck,
  CreditCard,
  Download,
  Pencil,
  Save,
  X
} from 'lucide-react';
import CustomSelect from '../../components/CustomSelect';

interface TransportSummary {
  id: number;
  name: string;
  phone: string;
  totalTrips: number;
  totalAmount: number;
  paid: number;
  outstanding: number;
}

interface Trip {
  id: string;
  type: string;
  date: string;
  pickupLocation: string;
  agreedPrice: number;
  vehicleModel?: string;
  lotName?: string;
  transportTripFee: number;
  transportPaymentStatus: string;
  supplier: {
    name: string;
  };
}

export default function TransportersPage() {
  const [summaries, setSummaries] = useState<TransportSummary[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrips, setSelectedTrips] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER'>('CASH');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit transporter state
  const [editingTransporter, setEditingTransporter] = useState<TransportSummary | null>(null);
  const [editTransName, setEditTransName] = useState('');
  const [editTransPhone, setEditTransPhone] = useState('');

  useEffect(() => {
    fetchTransporterSummaries();
  }, []);

  useEffect(() => {
    if (selectedCompanyId) {
      fetchTrips(parseInt(selectedCompanyId));
    } else {
      setTrips([]);
      setSelectedTrips([]);
    }
  }, [selectedCompanyId]);

  const fetchTransporterSummaries = async () => {
    try {
      const res = await fetch('/api/transporters');
      const data = await res.json();
      setSummaries(data);
      if (data.length > 0 && !selectedCompanyId) {
        setSelectedCompanyId(data[0].id.toString());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTrips = async (id: number) => {
    try {
      const res = await fetch(`/api/transporters/${id}/trips`);
      const data = await res.json();
      setTrips(data);
      setSelectedTrips([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleTrip = (tripId: string) => {
    setSelectedTrips(prev => 
      prev.includes(tripId) 
        ? prev.filter(id => id !== tripId) 
        : [...prev, tripId]
    );
  };

  const handleSelectAllUnpaid = () => {
    const unpaidIds = trips
      .filter(t => t.transportPaymentStatus === 'UNPAID')
      .map(t => t.id);
    
    if (selectedTrips.length === unpaidIds.length) {
      setSelectedTrips([]);
    } else {
      setSelectedTrips(unpaidIds);
    }
  };

  const openEditTransporter = (s: TransportSummary) => {
    setEditingTransporter(s);
    setEditTransName(s.name);
    setEditTransPhone(s.phone || '');
  };

  const handleEditTransporterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransporter) return;
    try {
      const res = await fetch(`/api/transporters/${editingTransporter.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editTransName, phone: editTransPhone })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update transporter');
      setMessage({ type: 'success', text: `Transporter ${editTransName} updated.` });
      setEditingTransporter(null);
      fetchTransporterSummaries();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handlePayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTrips.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one trip to settle.' });
      return;
    }

    const selectedFee = trips
      .filter(t => selectedTrips.includes(t.id))
      .reduce((sum, t) => sum + (t.transportTripFee || 0), 0);

    try {
      const res = await fetch(`/api/transporters/${selectedCompanyId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod,
          amountPaid: selectedFee,
          tripIds: selectedTrips
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit transporter payout');

      setMessage({ type: 'success', text: `Disbursed and settled B$ ${selectedFee.toFixed(2)} BND for ${selectedTrips.length} logistics runs.` });
      setSelectedTrips([]);
      fetchTransporterSummaries();
      fetchTrips(parseInt(selectedCompanyId));
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const currentSummary = summaries.find(s => s.id === parseInt(selectedCompanyId));

  const totalOwedSelected = trips
    .filter(t => selectedTrips.includes(t.id))
    .reduce((sum, t) => sum + (t.transportTripFee || 0), 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Driver & Transporter Settlement Portal</h1>
          <p className="page-title-desc">Coordinate external rented towing partners. Select multiple dispatch jobs and generate CSV balances declarations sheets.</p>
        </div>
      </div>

      {message && (
        <div style={{
          padding: '16px',
          borderRadius: '12px',
          marginBottom: '24px',
          background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: message.type === 'success' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
          color: message.type === 'success' ? '#10b981' : '#ef4444',
          fontWeight: 500
        }}>
          {message.text}
        </div>
      )}

      {/* Towing Companies Tabs */}
      <div className="tabs-container">
        {summaries.map(s => (
          <div 
            key={s.id} 
            className={`tab-nav ${selectedCompanyId === s.id.toString() ? 'active' : ''}`}
            onClick={() => setSelectedCompanyId(s.id.toString())}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Truck size={14} /> {s.name}
            <button type="button" onClick={(e) => { e.stopPropagation(); openEditTransporter(s); }} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '2px 6px', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
              <Pencil size={11} />
            </button>
          </div>
        ))}
      </div>

      {currentSummary && (
        <>
          {/* Transporter balance sheets cards */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-info">
                <h3>Total Transport Jobs</h3>
                <div className="metric-value">{currentSummary.totalTrips} Runs</div>
              </div>
              <div className="metric-icon-wrap" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
                <Truck size={22} />
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-info">
                <h3>Logistics Billing Total</h3>
                <div className="metric-value">B$ {currentSummary.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              </div>
              <div className="metric-icon-wrap" style={{ background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9' }}>
                <DollarSign size={22} />
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-info">
                <h3>Paid Disbursements</h3>
                <div className="metric-value">B$ {currentSummary.paid.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              </div>
              <div className="metric-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                <FileCheck size={22} />
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-info">
                <h3>Outstanding Balance Owed</h3>
                <div className="metric-value" style={{ color: currentSummary.outstanding > 0 ? '#ef4444' : '#10b981' }}>
                  B$ {currentSummary.outstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="metric-icon-wrap" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                <CreditCard size={22} />
              </div>
            </div>
          </div>

          <div className="dashboard-layout-main">
            {/* Left: Towing Trip lines item matrix */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="flex-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
                <h2 style={{ fontSize: '1.25rem' }}>Billing Cycle Statement Ledger</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    type="button" 
                    className="btn-outline" 
                    style={{ fontSize: '0.8rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    onClick={handleSelectAllUnpaid}
                  >
                    Select All Unpaid
                  </button>
                  <button 
                    type="button" 
                    className="btn-outline" 
                    style={{ fontSize: '0.8rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => {
                      if (trips.length === 0) return;
                      const headers = ['Trip ID', 'Date', 'Description', 'Pickup Location', 'Trip Fee (BND)', 'Payment Status'];
                      const rows = trips.map(t => [
                        t.id,
                        new Date(t.date).toLocaleDateString(),
                        t.type === 'VEHICLE' ? (t.vehicleModel || '') : (t.lotName || ''),
                        t.pickupLocation,
                        t.transportTripFee?.toFixed(2) ?? '0.00',
                        t.transportPaymentStatus,
                      ]);
                      const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
                      const blob = new Blob([csv], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `transport-statement-${currentSummary?.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    <Download size={14} /> CSV Statement
                  </button>
                </div>
              </div>

              <div className="table-wrapper">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>Select</th>
                      <th>Trip Date</th>
                      <th>Lot Description</th>
                      <th>Pickup Yard Address</th>
                      <th>Refer ID</th>
                      <th>Payment Status</th>
                      <th style={{ textAlign: 'right' }}>Trip Fee (BND)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trips.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', color: '#64748b' }}>No trip runs registered.</td>
                      </tr>
                    ) : (
                      trips.map(trip => {
                        const isSelected = selectedTrips.includes(trip.id);
                        const canSettle = trip.transportPaymentStatus === 'UNPAID';
                        return (
                          <tr key={trip.id} style={{ opacity: canSettle ? 1 : 0.7 }}>
                            <td>
                              {canSettle ? (
                                <span 
                                  onClick={() => handleToggleTrip(trip.id)} 
                                  style={{ cursor: 'pointer', color: isSelected ? '#6366f1' : '#64748b', display: 'flex', alignItems: 'center' }}
                                >
                                  {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                                </span>
                              ) : (
                                <span style={{ color: '#10b981', display: 'flex', alignItems: 'center' }}><CheckCircle size={16} /></span>
                              )}
                            </td>
                            <td>{new Date(trip.date).toLocaleDateString()}</td>
                            <td style={{ fontWeight: 600, color: '#fff' }}>
                              {trip.type === 'VEHICLE' ? trip.vehicleModel : trip.lotName}
                            </td>
                            <td>{trip.pickupLocation}</td>
                            <td>
                              <code style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                                {trip.id}
                              </code>
                            </td>
                            <td>
                              <span className={`badge ${trip.transportPaymentStatus === 'PAID' ? 'badge-success' : 'badge-danger'}`}>
                                {trip.transportPaymentStatus}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 650 }}>B$ {trip.transportTripFee?.toFixed(2)}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Selected payout widget card */}
            <form onSubmit={handlePayoutSubmit} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 style={{ fontSize: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
                Disburse Payout Settlement
              </h2>

              <div className="form-group">
                <label>Payout Financial Method</label>
                <CustomSelect
                  value={paymentMethod}
                  onChange={(v) => setPaymentMethod(v as any)}
                  options={[
                    { value: 'CASH', label: 'Cash Drawer Safe' },
                    { value: 'BANK_TRANSFER', label: 'Bank Telegraphic Wire' },
                  ]}
                  required
                />
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Selected Jobs</p>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', marginTop: '4px' }}>
                  {selectedTrips.length} Runs
                </h3>

                <p style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, marginTop: '16px' }}>Total Amount to Settle</p>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
                  B$ {totalOwedSelected.toFixed(2)} BND
                </h3>
              </div>

              <button 
                type="submit" 
                className="btn-primary" 
                style={{ width: '100%', padding: '14px' }}
                disabled={selectedTrips.length === 0}
              >
                Execute Ledger Disbursement
              </button>
            </form>
          </div>
        </>
      )}
      {/* Edit Transporter Modal */}
      {editingTransporter && (
        <div className="overlay">
          <div className="modal-content">
            <div className="flex-between" style={{ marginBottom: '20px' }}>
              <h2 className="modal-title" style={{ margin: 0 }}>Edit Transporter</h2>
              <button type="button" style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }} onClick={() => setEditingTransporter(null)}><X size={20} /></button>
            </div>
            <form onSubmit={handleEditTransporterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>Company Name</label>
                <input type="text" className="form-input" value={editTransName} onChange={(e) => setEditTransName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input type="text" className="form-input" value={editTransPhone} onChange={(e) => setEditTransPhone(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-outline" onClick={() => setEditingTransporter(null)}>Cancel</button>
                <button type="submit" className="btn-primary"><Save size={16} /> Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
