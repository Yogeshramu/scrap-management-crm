'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar, 
  Wrench, 
  Fuel, 
  AlertTriangle, 
  Plus, 
  FileText,
  FileCheck,
  CheckCircle,
  Clock,
  PlusCircle,
  ChevronRight,
  Pencil,
  Save,
  X
} from 'lucide-react';
import CustomSelect from '../../components/CustomSelect';

interface MaintenanceLog {
  id: number;
  date: string;
  service: string;
  cost: number;
  workshop: string;
}

interface FuelLog {
  id: number;
  date: string;
  amount: number;
  cost: number;
  odometer: number | null;
}

interface Vehicle {
  id: number;
  name: string;
  type: string;
  plateNumber: string;
  brand: string;
  model: string;
  year: number;
  roadTaxExpiry: string;
  insuranceExpiry: string;
  inspectionExpiry: string;
  status: string;
  roadTaxPdf?: string;
  insurancePdf?: string;
  registrationCardPdf?: string;
  inspectionPdf?: string;
  maintenanceLogs: MaintenanceLog[];
  fuelLogs: FuelLog[];
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  
  // Registration form
  const [name, setName] = useState('');
  const [type, setType] = useState('Truck');
  const [plateNumber, setPlateNumber] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('2022');
  const [roadTaxExpiry, setRoadTaxExpiry] = useState('');
  const [insuranceExpiry, setInsuranceExpiry] = useState('');
  const [inspectionExpiry, setInspectionExpiry] = useState('');
  
  // Maintenance logs form
  const [maintDate, setMaintDate] = useState('');
  const [maintService, setMaintService] = useState('');
  const [maintCost, setMaintCost] = useState('');
  const [maintWorkshop, setMaintWorkshop] = useState('');

  // Fuel logs form
  const [fuelDate, setFuelDate] = useState('');
  const [fuelAmount, setFuelAmount] = useState('');
  const [fuelCost, setFuelCost] = useState('');
  const [fuelOdometer, setFuelOdometer] = useState('');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showMaintModal, setShowMaintModal] = useState(false);
  const [showFuelModal, setShowFuelModal] = useState(false);

  // Edit vehicle state
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [editVName, setEditVName] = useState('');
  const [editVType, setEditVType] = useState('');
  const [editVBrand, setEditVBrand] = useState('');
  const [editVModel, setEditVModel] = useState('');
  const [editVYear, setEditVYear] = useState('');
  const [editVRoadTax, setEditVRoadTax] = useState('');
  const [editVInsurance, setEditVInsurance] = useState('');
  const [editVInspection, setEditVInspection] = useState('');

  useEffect(() => {
    fetchVehicles();
  }, []);

  const openEditVehicle = (v: Vehicle) => {
    setEditingVehicle(v);
    setEditVName(v.name);
    setEditVType(v.type);
    setEditVBrand(v.brand);
    setEditVModel(v.model);
    setEditVYear(v.year.toString());
    setEditVRoadTax(v.roadTaxExpiry.split('T')[0]);
    setEditVInsurance(v.insuranceExpiry.split('T')[0]);
    setEditVInspection(v.inspectionExpiry.split('T')[0]);
  };

  const handleEditVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVehicle) return;
    try {
      const res = await fetch(`/api/vehicles/${editingVehicle.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editVName, type: editVType, brand: editVBrand, model: editVModel, year: editVYear, roadTaxExpiry: editVRoadTax, insuranceExpiry: editVInsurance, inspectionExpiry: editVInspection })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update vehicle');
      setMessage({ type: 'success', text: `Vehicle ${editVName} updated.` });
      setEditingVehicle(null);
      fetchVehicles();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const fetchVehicles = async () => {
    try {
      const res = await fetch('/api/vehicles');
      const data = await res.json();
      setVehicles(data);
      if (data.length > 0 && !selectedVehicleId) {
        setSelectedVehicleId(data[0].id.toString());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegisterVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !plateNumber || !roadTaxExpiry || !insuranceExpiry) {
      setMessage({ type: 'error', text: 'All core registration details must be complete.' });
      return;
    }

    try {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, type, plateNumber, brand, model, year, roadTaxExpiry, insuranceExpiry, inspectionExpiry
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to register vehicle');

      setMessage({ type: 'success', text: `Registered brand new fleet vehicle: ${name} [${plateNumber}]` });
      
      // Reset
      setName('');
      setPlateNumber('');
      setBrand('');
      setModel('');
      setRoadTaxExpiry('');
      setInsuranceExpiry('');
      setInspectionExpiry('');
      setShowVehicleModal(false);
      
      await fetchVehicles();
      setSelectedVehicleId(data.id.toString());
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleMaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintDate || !maintService || !maintCost) {
      setMessage({ type: 'error', text: 'Please complete date, service, and cost value.' });
      return;
    }
    try {
      const res = await fetch(`/api/vehicles/${selectedVehicleId}/maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: maintDate, service: maintService, cost: maintCost, workshop: maintWorkshop
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to log maintenance work');

      setMessage({ type: 'success', text: `Maintenance logged successfully!` });
      setMaintDate('');
      setMaintService('');
      setMaintCost('');
      setMaintWorkshop('');
      setShowMaintModal(false);
      fetchVehicles();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleFuelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fuelDate || !fuelAmount || !fuelCost) {
      setMessage({ type: 'error', text: 'Complete date, volume (liters) and cash cost.' });
      return;
    }
    try {
      const res = await fetch(`/api/vehicles/${selectedVehicleId}/fuel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: fuelDate, amount: fuelAmount, cost: fuelCost, odometer: fuelOdometer
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to register fuel log');

      setMessage({ type: 'success', text: `Fuel purchase logged successfully!` });
      setFuelDate('');
      setFuelAmount('');
      setFuelCost('');
      setFuelOdometer('');
      setShowFuelModal(false);
      fetchVehicles();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const currentVehicle = vehicles.find(v => v.id === parseInt(selectedVehicleId));

  // Expiry calculation helper
  const getDaysDiff = (dateStr: string) => {
    return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 3600 * 24));
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Internal Fleet Asset tracker</h1>
          <p className="page-title-desc">Oversee company machinery, track road tax dates and compliance insurances warning indices, and log operations overheads.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowVehicleModal(true)}>
          <Plus size={16} /> Add Fleet Asset
        </button>
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

      {/* Fleet List Selection tabs */}
      <div className="tabs-container">
        {vehicles.map(v => {
          const isTaxExpiring = getDaysDiff(v.roadTaxExpiry) <= 30;
          const isInsExpiring = getDaysDiff(v.insuranceExpiry) <= 15;
          const isInspExpired = new Date(v.inspectionExpiry).getTime() < Date.now();
          const hasWarning = isTaxExpiring || isInsExpiring || isInspExpired;

          return (
            <div 
              key={v.id} 
              className={`tab-nav ${selectedVehicleId === v.id.toString() ? 'active' : ''}`}
              onClick={() => setSelectedVehicleId(v.id.toString())}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span>{v.name}</span>
              {hasWarning && <AlertTriangle size={14} style={{ color: '#ef4444' }} />}
              <button type="button" onClick={(e) => { e.stopPropagation(); openEditVehicle(v); }} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '2px 6px', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', marginLeft: '4px' }}>
                <Pencil size={11} />
              </button>
            </div>
          );
        })}
      </div>

      {currentVehicle && (
        <div className="dashboard-layout-main">
          {/* Left panel: vehicle details and action logs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* Expiry documents checklist status */}
            <div className="glass-panel">
              <h2 style={{ fontSize: '1.25rem', marginBottom: '20px' }}>Compliance Documentation Compliance</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                
                {/* Road Tax Card */}
                <div style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: getDaysDiff(currentVehicle.roadTaxExpiry) <= 30 ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.05)',
                  border: getDaysDiff(currentVehicle.roadTaxExpiry) <= 30 ? '1px solid rgba(239, 68, 68, 0.15)' : '1px solid rgba(16, 185, 129, 0.15)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Road Tax Status</span>
                  <strong style={{ color: '#fff', fontSize: '0.95rem' }}>{new Date(currentVehicle.roadTaxExpiry).toLocaleDateString()}</strong>
                  <span style={{ fontSize: '0.85rem', fontWeight: 650, color: getDaysDiff(currentVehicle.roadTaxExpiry) <= 30 ? '#ef4444' : '#10b981' }}>
                    {getDaysDiff(currentVehicle.roadTaxExpiry) <= 30 ? `Renew in ${getDaysDiff(currentVehicle.roadTaxExpiry)} days` : 'Active / Verified'}
                  </span>
                  {currentVehicle.roadTaxPdf && <small style={{ color: '#6366f1', fontSize: '0.75rem', marginTop: '6px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}><FileText size={12} /> Attached: road_tax.pdf</small>}
                </div>

                {/* Insurance Card */}
                <div style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: getDaysDiff(currentVehicle.insuranceExpiry) <= 15 ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.05)',
                  border: getDaysDiff(currentVehicle.insuranceExpiry) <= 15 ? '1px solid rgba(239, 68, 68, 0.15)' : '1px solid rgba(16, 185, 129, 0.15)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Insurance Policy</span>
                  <strong style={{ color: '#fff', fontSize: '0.95rem' }}>{new Date(currentVehicle.insuranceExpiry).toLocaleDateString()}</strong>
                  <span style={{ fontSize: '0.85rem', fontWeight: 650, color: getDaysDiff(currentVehicle.insuranceExpiry) <= 15 ? '#ef4444' : '#10b981' }}>
                    {getDaysDiff(currentVehicle.insuranceExpiry) <= 15 ? `Renew in ${getDaysDiff(currentVehicle.insuranceExpiry)} days` : 'Active / Verified'}
                  </span>
                  {currentVehicle.insurancePdf && <small style={{ color: '#6366f1', fontSize: '0.75rem', marginTop: '6px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}><FileText size={12} /> Attached: insurance.pdf</small>}
                </div>

                {/* Inspection Card */}
                <div style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: new Date(currentVehicle.inspectionExpiry).getTime() < Date.now() ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.05)',
                  border: new Date(currentVehicle.inspectionExpiry).getTime() < Date.now() ? '1px solid rgba(239, 68, 68, 0.15)' : '1px solid rgba(16, 185, 129, 0.15)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Land Inspection</span>
                  <strong style={{ color: '#fff', fontSize: '0.95rem' }}>{new Date(currentVehicle.inspectionExpiry).toLocaleDateString()}</strong>
                  <span style={{ fontSize: '0.85rem', fontWeight: 650, color: new Date(currentVehicle.inspectionExpiry).getTime() < Date.now() ? '#ef4444' : '#10b981' }}>
                    {new Date(currentVehicle.inspectionExpiry).getTime() < Date.now() ? 'Overdue / Inspection Required' : 'Active / Verified'}
                  </span>
                  {currentVehicle.inspectionPdf && <small style={{ color: '#6366f1', fontSize: '0.75rem', marginTop: '6px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}><FileText size={12} /> Attached: inspection.pdf</small>}
                </div>

              </div>
            </div>

            {/* Logs Tabs */}
            <div className="glass-panel">
              <div className="flex-between" style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.25rem' }}>Operational Activities logs</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '6px 12px' }} onClick={() => setShowMaintModal(true)}>
                    <Wrench size={14} /> Log Maintenance
                  </button>
                  <button className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '6px 12px' }} onClick={() => setShowFuelModal(true)}>
                    <Fuel size={14} /> Log Fuel Purchase
                  </button>
                </div>
              </div>

              {/* Maintenance History */}
              <h3 style={{ fontSize: '0.95rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '6px' }}>Maintenance Ledger</h3>
              <div className="table-wrapper" style={{ marginBottom: '24px' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Service Date</th>
                      <th>Repair description details</th>
                      <th>Workshop</th>
                      <th style={{ textAlign: 'right' }}>Cost (BND)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentVehicle.maintenanceLogs.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', color: '#64748b' }}>No maintenance records found.</td>
                      </tr>
                    ) : (
                      currentVehicle.maintenanceLogs.map(m => (
                        <tr key={m.id}>
                          <td>{new Date(m.date).toLocaleDateString()}</td>
                          <td style={{ fontWeight: 600, color: '#fff' }}>{m.service}</td>
                          <td>{m.workshop || 'N/A'}</td>
                          <td style={{ textAlign: 'right', fontWeight: 650 }}>B$ {m.cost.toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Fuel purchase logs */}
              <h3 style={{ fontSize: '0.95rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '6px' }}>Fuel refueling history</h3>
              <div className="table-wrapper">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Refuel Date</th>
                      <th>Liters Count</th>
                      <th>Odometer Reading</th>
                      <th style={{ textAlign: 'right' }}>Cost (BND)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentVehicle.fuelLogs.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', color: '#64748b' }}>No fuel logging registered.</td>
                      </tr>
                    ) : (
                      currentVehicle.fuelLogs.map(f => (
                        <tr key={f.id}>
                          <td>{new Date(f.date).toLocaleDateString()}</td>
                          <td>{f.amount.toFixed(1)} L</td>
                          <td>{f.odometer ? `${f.odometer.toLocaleString()} KM` : 'N/A'}</td>
                          <td style={{ textAlign: 'right', fontWeight: 650 }}>B$ {f.cost.toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>

          </div>

          {/* Right panel: Details parameters */}
          <div className="glass-panel" style={{ height: 'fit-content' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Asset Profile Summary</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.9rem', color: '#cbd5e1' }}>
              <div className="flex-between">
                <span>Asset Identification:</span>
                <strong style={{ color: '#fff' }}>{currentVehicle.name}</strong>
              </div>
              <div className="flex-between">
                <span>Plate Serial Number:</span>
                <code style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px', color: '#6366f1' }}>
                  {currentVehicle.plateNumber}
                </code>
              </div>
              <div className="flex-between">
                <span>Machine Type:</span>
                <span>{currentVehicle.type}</span>
              </div>
              <div className="flex-between">
                <span>Manufacturer brand:</span>
                <span>{currentVehicle.brand}</span>
              </div>
              <div className="flex-between">
                <span>Model reference:</span>
                <span>{currentVehicle.model}</span>
              </div>
              <div className="flex-between">
                <span>Manufacturing Year:</span>
                <span>{currentVehicle.year}</span>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '6px', paddingTop: '16px' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Attached PDF Documents</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileCheck size={14} style={{ color: currentVehicle.roadTaxPdf ? '#10b981' : '#64748b' }} />
                    <span style={{ fontSize: '0.85rem' }}>Road Tax Card</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileCheck size={14} style={{ color: currentVehicle.insurancePdf ? '#10b981' : '#64748b' }} />
                    <span style={{ fontSize: '0.85rem' }}>Insurance Policy Certificate</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileCheck size={14} style={{ color: currentVehicle.registrationCardPdf ? '#10b981' : '#64748b' }} />
                    <span style={{ fontSize: '0.85rem' }}>Blue Registration Card</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileCheck size={14} style={{ color: currentVehicle.inspectionPdf ? '#10b981' : '#64748b' }} />
                    <span style={{ fontSize: '0.85rem' }}>Land Inspection Report</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Vehicle Modal */}
      {editingVehicle && (
        <div className="overlay">
          <div className="modal-content" style={{ maxWidth: '680px' }}>
            <div className="flex-between" style={{ marginBottom: '20px' }}>
              <h2 className="modal-title" style={{ margin: 0 }}>Edit Vehicle — {editingVehicle.plateNumber}</h2>
              <button type="button" style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }} onClick={() => setEditingVehicle(null)}><X size={20} /></button>
            </div>
            <form onSubmit={handleEditVehicleSubmit}>
              <div className="form-grid">
                <div className="col-6 form-group">
                  <label>Asset Name</label>
                  <input type="text" className="form-input" value={editVName} onChange={(e) => setEditVName(e.target.value)} required />
                </div>
                <div className="col-6 form-group">
                  <label>Type</label>
                  <CustomSelect
                    value={editVType}
                    onChange={setEditVType}
                    options={[
                      { value: 'HIAB', label: 'HIAB Crane Truck' },
                      { value: 'Tow Truck', label: 'Tow Flatbed' },
                      { value: 'SUV', label: 'Field SUV' },
                      { value: 'Truck', label: 'Logistics Tipper Truck' },
                    ]}
                    required
                  />
                </div>
                <div className="col-4 form-group">
                  <label>Brand</label>
                  <input type="text" className="form-input" value={editVBrand} onChange={(e) => setEditVBrand(e.target.value)} />
                </div>
                <div className="col-4 form-group">
                  <label>Model</label>
                  <input type="text" className="form-input" value={editVModel} onChange={(e) => setEditVModel(e.target.value)} />
                </div>
                <div className="col-4 form-group">
                  <label>Year</label>
                  <input type="number" className="form-input" value={editVYear} onChange={(e) => setEditVYear(e.target.value)} />
                </div>
                <div className="col-4 form-group">
                  <label>Road Tax Expiry</label>
                  <input type="date" className="form-input" value={editVRoadTax} onChange={(e) => setEditVRoadTax(e.target.value)} required />
                </div>
                <div className="col-4 form-group">
                  <label>Insurance Expiry</label>
                  <input type="date" className="form-input" value={editVInsurance} onChange={(e) => setEditVInsurance(e.target.value)} required />
                </div>
                <div className="col-4 form-group">
                  <label>Inspection Expiry</label>
                  <input type="date" className="form-input" value={editVInspection} onChange={(e) => setEditVInspection(e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn-outline" onClick={() => setEditingVehicle(null)}>Cancel</button>
                <button type="submit" className="btn-primary"><Save size={16} /> Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register Vehicle Modal */}
      {showVehicleModal && (
        <div className="overlay">
          <div className="modal-content" style={{ maxWidth: '700px' }}>
            <h2 className="modal-title">Register Company Fleet Machinery</h2>
            <form onSubmit={handleRegisterVehicle}>
              <div className="form-grid">
                <div className="col-6 form-group">
                  <label>Descriptive Asset Name</label>
                  <input type="text" className="form-input" placeholder="e.g. Fuso Hydraulic Crane" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="col-6 form-group">
                  <label>Plate Serial Number</label>
                  <input type="text" className="form-input" placeholder="e.g. BA-1234" value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} required />
                </div>
                <div className="col-4 form-group">
                  <label>Asset Category Class</label>
                  <CustomSelect
                    value={type}
                    onChange={setType}
                    options={[
                      { value: 'HIAB', label: 'HIAB Crane Truck' },
                      { value: 'Tow Truck', label: 'Tow Flatbed' },
                      { value: 'SUV', label: 'Field SUV' },
                      { value: 'Truck', label: 'Logistics Tipper Truck' },
                    ]}
                    required
                  />
                </div>
                <div className="col-4 form-group">
                  <label>Brand / Maker</label>
                  <input type="text" className="form-input" placeholder="e.g. Mitsubishi" value={brand} onChange={(e) => setBrand(e.target.value)} />
                </div>
                <div className="col-4 form-group">
                  <label>Model Version</label>
                  <input type="text" className="form-input" placeholder="e.g. Fuso 6T" value={model} onChange={(e) => setModel(e.target.value)} />
                </div>
                <div className="col-4 form-group">
                  <label>road Tax Expiry Date</label>
                  <input type="date" className="form-input" value={roadTaxExpiry} onChange={(e) => setRoadTaxExpiry(e.target.value)} required />
                </div>
                <div className="col-4 form-group">
                  <label>insurance expiry Date</label>
                  <input type="date" className="form-input" value={insuranceExpiry} onChange={(e) => setInsuranceExpiry(e.target.value)} required />
                </div>
                <div className="col-4 form-group">
                  <label>land Inspection expiry</label>
                  <input type="date" className="form-input" value={inspectionExpiry} onChange={(e) => setInspectionExpiry(e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn-outline" onClick={() => setShowVehicleModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Register Asset</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Maintenance Modal */}
      {showMaintModal && (
        <div className="overlay">
          <div className="modal-content">
            <h2 className="modal-title">Log Asset Maintenance Repairs</h2>
            <form onSubmit={handleMaintSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>Service / Repair Date</label>
                <input type="date" className="form-input" value={maintDate} onChange={(e) => setMaintDate(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Servicing work details</label>
                <input type="text" className="form-input" placeholder="e.g. Hydraulic Cylinder Seals Replacement" value={maintService} onChange={(e) => setMaintService(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Repair Cost (BND)</label>
                <input type="number" className="form-input" placeholder="0.00" value={maintCost} onChange={(e) => setMaintCost(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Workshop Station name</label>
                <input type="text" className="form-input" placeholder="e.g. Seria Engineering Hub" value={maintWorkshop} onChange={(e) => setMaintWorkshop(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn-outline" onClick={() => setShowMaintModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Record Maintenance</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Fuel Modal */}
      {showFuelModal && (
        <div className="overlay">
          <div className="modal-content">
            <h2 className="modal-title">Log Fuel Purchase Refueling</h2>
            <form onSubmit={handleFuelSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>Purchase Refuel Date</label>
                <input type="date" className="form-input" value={fuelDate} onChange={(e) => setFuelDate(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Fuel Quantity (Liters)</label>
                <input type="number" className="form-input" placeholder="e.g. 75.3" value={fuelAmount} onChange={(e) => setFuelAmount(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Total Cash Cost Paid (BND)</label>
                <input type="number" className="form-input" placeholder="0.00" value={fuelCost} onChange={(e) => setFuelCost(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Odometer Reading (KM)</label>
                <input type="number" className="form-input" placeholder="e.g. 142050" value={fuelOdometer} onChange={(e) => setFuelOdometer(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn-outline" onClick={() => setShowFuelModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Record Fuel Log</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
