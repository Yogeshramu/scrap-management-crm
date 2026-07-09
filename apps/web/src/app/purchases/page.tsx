'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Car,
  Package,
  MapPin,
  User,
  Truck,
  ShoppingBag, 
  AlertTriangle, 
  Save, 
  Trash2, 
  Camera, 
  Clock, 
  Check, 
  X,
  PlusCircle,
  Pencil
} from 'lucide-react';
import CustomSelect from '../../components/CustomSelect';

interface Supplier {
  id: number;
  name: string;
  contact: string;
  outstandingAdvance: number;
}

interface Transporter {
  id: number;
  name: string;
  phone: string;
}

interface Purchase {
  id: string;
  type: string;
  date: string;
  supplierId: number;
  supplier: Supplier;
  pickupLocation: string;
  logisticsMethod: string;
  driverName?: string;
  agreedPrice: number;
  previousAdvanceDeduction: number;
  cashToPay: number;
  paymentStatus: string;
  paymentMethod: string;
  vehicleModel?: string;
  engineIntact?: boolean;
  gearboxPresent?: boolean;
  catalyticConverter?: boolean;
  alloyWheelsCount?: number;
  vehiclePhoto?: string;
  lotName?: string;
  scrapDescription?: string;
  scrapPhoto?: string;
  grossTonnageEstimate?: number;
  transportCompany?: Transporter;
  transportTripFee?: number;
  transportPaymentStatus?: string;
}

interface LineItem {
  id: string;
  material: string;
  qty: string;
  unit: string;
  rate: string;
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [transporters, setTransporters] = useState<Transporter[]>([]);
  
  // Form state
  const [type, setType] = useState<'VEHICLE' | 'LOOSE_SCRAP' | 'MIXED_SCRAP'>('VEHICLE');
  const [supplierId, setSupplierId] = useState<string>('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [logisticsMethod, setLogisticsMethod] = useState<'HIAB' | 'TOWING' | 'COMPANY_VEHICLE'>('HIAB');
  const [driverName, setDriverName] = useState('');
  const [agreedPrice, setAgreedPrice] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'PARTIAL' | 'UNPAID'>('UNPAID');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER'>('CASH');

  // Mode Specific
  const [vehicleModel, setVehicleModel] = useState('');
  const [engineIntact, setEngineIntact] = useState<boolean>(true);
  const [gearboxPresent, setGearboxPresent] = useState<boolean>(true);
  const [catalyticConverter, setCatalyticConverter] = useState<boolean>(true);
  const [alloyWheelsCount, setAlloyWheelsCount] = useState<number>(0);
  const [vehiclePhoto, setVehiclePhoto] = useState('/uploads/hilux_front.jpg');

  // Loose Scrap specific
  const [looseMaterial, setLooseMaterial] = useState('');
  const [looseQty, setLooseQty] = useState('');
  const [looseUnit, setLooseUnit] = useState('KG');
  const [looseRate, setLooseRate] = useState('');

  const [lotName, setLotName] = useState('');
  const [scrapDescription, setScrapDescription] = useState('');
  const [grossTonnageEstimate, setGrossTonnageEstimate] = useState('');
  const [scrapPhoto, setScrapPhoto] = useState('/uploads/scrap_lot_3.jpg');
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  // External logistics
  const [transportCompanyId, setTransportCompanyId] = useState('');
  const [transportTripFee, setTransportTripFee] = useState('80.00');

  // Notification / Alert state
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit purchase state
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [editPickupLocation, setEditPickupLocation] = useState('');
  const [editLogisticsMethod, setEditLogisticsMethod] = useState<'HIAB' | 'TOWING' | 'COMPANY_VEHICLE'>('HIAB');
  const [editDriverName, setEditDriverName] = useState('');
  const [editPaymentStatus, setEditPaymentStatus] = useState<'PAID' | 'PARTIAL' | 'UNPAID'>('UNPAID');
  const [editPaymentMethod, setEditPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER'>('CASH');
  const [editVehicleModel, setEditVehicleModel] = useState('');
  const [editEngineIntact, setEditEngineIntact] = useState(true);
  const [editGearboxPresent, setEditGearboxPresent] = useState(true);
  const [editCatalyticConverter, setEditCatalyticConverter] = useState(true);
  const [editAlloyWheelsCount, setEditAlloyWheelsCount] = useState(0);
  const [editLotName, setEditLotName] = useState('');
  const [editScrapDescription, setEditScrapDescription] = useState('');
  const [editGrossTonnageEstimate, setEditGrossTonnageEstimate] = useState('');
  const [editTransportCompanyId, setEditTransportCompanyId] = useState('');
  const [editTransportTripFee, setEditTransportTripFee] = useState('');

  // New Supplier dialog
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [newSupName, setNewSupName] = useState('');
  const [newSupContact, setNewSupContact] = useState('');
  const [newSupAdvance, setNewSupAdvance] = useState('0.00');

  // Edit Supplier dialog
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [editSupName, setEditSupName] = useState('');
  const [editSupContact, setEditSupContact] = useState('');
  const [editSupAdvance, setEditSupAdvance] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const supRes = await fetch('/api/suppliers');
      setSuppliers(await supRes.json());

      const transRes = await fetch('/api/transporters');
      setTransporters(await transRes.json());

      const purchaseRes = await fetch('/api/purchases');
      setPurchases(await purchaseRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  const handleSupplierChange = (idStr: string) => {
    setSupplierId(idStr);
    const id = parseInt(idStr);
    const match = suppliers.find(s => s.id === id) || null;
    setSelectedSupplier(match);
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupName) return;
    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSupName,
          contact: newSupContact,
          outstandingAdvance: parseFloat(newSupAdvance) || 0
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create supplier');
      
      setMessage({ type: 'success', text: `Created supplier card: ${newSupName}` });
      await fetchData();
      setSupplierId(data.id.toString());
      setSelectedSupplier(data);
      setShowSupplierModal(false);
      // Reset Modal Form
      setNewSupName('');
      setNewSupContact('');
      setNewSupAdvance('0.00');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    if (!supplierId || !pickupLocation || (type === 'VEHICLE' && agreedPrice === '')) {
      setMessage({ type: 'error', text: 'Please complete all required fields.' });
      return;
    }

    try {
      const body: any = {
        type,
        supplierId: parseInt(supplierId),
        pickupLocation,
        logisticsMethod,
        driverName,
        paymentStatus,
        paymentMethod,
        agreedPrice: computedAgreedPrice,
      };

      if (logisticsMethod === 'TOWING') {
        body.transportCompanyId = transportCompanyId ? parseInt(transportCompanyId) : null;
        body.transportTripFee = parseFloat(transportTripFee) || 0;
      }

      if (type === 'VEHICLE') {
        body.vehicleModel = vehicleModel;
        body.engineIntact = engineIntact;
        body.gearboxPresent = gearboxPresent;
        body.catalyticConverter = catalyticConverter;
        body.alloyWheelsCount = alloyWheelsCount;
        body.vehiclePhoto = vehiclePhoto;
      } else if (type === 'LOOSE_SCRAP') {
        body.lotName = looseMaterial;
        body.scrapDescription = `${looseQty} ${looseUnit} @ B$${looseRate}/${looseUnit}`;
        body.grossTonnageEstimate = parseFloat(looseQty) || 0;
        body.scrapPhoto = scrapPhoto;
        body.lineItems = [{ id: '1', material: looseMaterial, qty: looseQty, unit: looseUnit, rate: looseRate }];
      } else {
        body.lotName = lotName;
        body.scrapDescription = scrapDescription;
        body.grossTonnageEstimate = parseFloat(grossTonnageEstimate) || 0;
        body.scrapPhoto = scrapPhoto;
        body.lineItems = lineItems;
      }

      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record purchase');

      setMessage({ type: 'success', text: `Purchase recorded successfully with Ref ID: ${data.id}` });
      
      // Reset form variables
      setPickupLocation('');
      setDriverName('');
      setAgreedPrice('');
      setVehicleModel('');
      setLotName('');
      setScrapDescription('');
      setGrossTonnageEstimate('');
      setAlloyWheelsCount(0);
      setLineItems([]);
      setLooseMaterial('');
      setLooseQty('');
      setLooseRate('');
      setSelectedSupplier(null);
      setSupplierId('');
      
      // Reload lists
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  // Autodeduction computation indicators
  const openEditSupplier = (s: Supplier) => {
    setEditingSupplier(s);
    setEditSupName(s.name);
    setEditSupContact(s.contact || '');
    setEditSupAdvance(s.outstandingAdvance.toString());
  };

  const handleEditSupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupplier) return;
    try {
      const res = await fetch(`/api/suppliers/${editingSupplier.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editSupName, contact: editSupContact, outstandingAdvance: parseFloat(editSupAdvance) || 0 })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update supplier');
      setMessage({ type: 'success', text: `Supplier ${editSupName} updated.` });
      setEditingSupplier(null);
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const openEditModal = (p: Purchase) => {
    setEditingPurchase(p);
    setEditPickupLocation(p.pickupLocation);
    setEditLogisticsMethod(p.logisticsMethod as any);
    setEditDriverName(p.driverName || '');
    setEditPaymentStatus(p.paymentStatus as any);
    setEditPaymentMethod(p.paymentMethod as any);
    setEditVehicleModel(p.vehicleModel || '');
    setEditEngineIntact(p.engineIntact ?? true);
    setEditGearboxPresent(p.gearboxPresent ?? true);
    setEditCatalyticConverter(p.catalyticConverter ?? true);
    setEditAlloyWheelsCount(p.alloyWheelsCount ?? 0);
    setEditLotName(p.lotName || '');
    setEditScrapDescription(p.scrapDescription || '');
    setEditGrossTonnageEstimate(p.grossTonnageEstimate?.toString() || '');
    setEditTransportCompanyId(p.transportCompany?.id?.toString() || '');
    setEditTransportTripFee(p.transportTripFee?.toString() || '');
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPurchase) return;
    try {
      const body: any = {
        pickupLocation: editPickupLocation,
        logisticsMethod: editLogisticsMethod,
        driverName: editDriverName,
        paymentStatus: editPaymentStatus,
        paymentMethod: editPaymentMethod,
      };
      if (editingPurchase.type === 'VEHICLE') {
        body.vehicleModel = editVehicleModel;
        body.engineIntact = editEngineIntact;
        body.gearboxPresent = editGearboxPresent;
        body.catalyticConverter = editCatalyticConverter;
        body.alloyWheelsCount = editAlloyWheelsCount;
      } else {
        body.lotName = editLotName;
        body.scrapDescription = editScrapDescription;
        body.grossTonnageEstimate = parseFloat(editGrossTonnageEstimate) || 0;
      }
      if (editLogisticsMethod === 'TOWING') {
        body.transportCompanyId = editTransportCompanyId ? parseInt(editTransportCompanyId) : null;
        body.transportTripFee = parseFloat(editTransportTripFee) || 0;
      }

      const res = await fetch(`/api/purchases/${editingPurchase.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update purchase');

      setMessage({ type: 'success', text: `Purchase ${editingPurchase.id} updated successfully.` });
      setEditingPurchase(null);
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const computedAgreedPrice = type === 'MIXED_SCRAP' 
    ? lineItems.reduce((acc, item) => acc + (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0), 0)
    : type === 'LOOSE_SCRAP'
    ? (parseFloat(looseQty) || 0) * (parseFloat(looseRate) || 0)
    : parseFloat(agreedPrice) || 0;

  const calculatedAdvanceDeduction = selectedSupplier && computedAgreedPrice
    ? Math.min(selectedSupplier.outstandingAdvance, computedAgreedPrice)
    : 0;
  const calculatedCashDue = computedAgreedPrice 
    ? Math.max(0, computedAgreedPrice - calculatedAdvanceDeduction)
    : 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Inbound Purchase Processing</h1>
          <p className="page-title-desc">Dynamic procurement desk supporting dual modes for single motor salvage and heavy lot operations.</p>
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
          fontWeight: 500,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{message.text}</span>
          <button style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => setMessage(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Mode Selector Tabs */}
      <div className="tabs-container">
        <div className={`tab-nav ${type === 'VEHICLE' ? 'active' : ''}`} onClick={() => setType('VEHICLE')}>
          <Car size={16} /> Single Car Entry Mode
        </div>
        <div className={`tab-nav ${type === 'LOOSE_SCRAP' ? 'active' : ''}`} onClick={() => setType('LOOSE_SCRAP')}>
          <Package size={16} /> Loose Scrap Entry
        </div>
        <div className={`tab-nav ${type === 'MIXED_SCRAP' ? 'active' : ''}`} onClick={() => setType('MIXED_SCRAP')}>
          <Package size={16} /> Mixed Lot Screen
        </div>
      </div>

      <div className="dashboard-layout-main">
        {/* Left Side: Form */}
        <form onSubmit={handleFormSubmit} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontSize: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
            Salvage Procurement Card
          </h2>

          {selectedSupplier && selectedSupplier.outstandingAdvance > 0 && (
            <div className="custom-alert">
              <AlertTriangle className="custom-alert-icon" />
              <div>
                <p className="custom-alert-title">Smart Advance Auto-Deduction Alert</p>
                <p style={{ fontSize: '0.85rem' }}>
                  Supplier <strong>{selectedSupplier.name}</strong> holds an outstanding advance of 
                  <strong> B$ {selectedSupplier.outstandingAdvance.toFixed(2)}</strong> BND. 
                  This credit balance will automatically deduct from today's final cash payout calculations.
                </p>
              </div>
            </div>
          )}

          <div className="form-grid">
            <div className="col-6 form-group">
              <label>Supplier Vendor Registry</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <CustomSelect
                  value={supplierId}
                  onChange={handleSupplierChange}
                  placeholder="-- Choose Supplier --"
                  options={suppliers.map(s => ({ value: s.id.toString(), label: `${s.name} (Adv: B$${s.outstandingAdvance.toFixed(0)})` }))}
                />
                <button type="button" className="btn-outline" onClick={() => setShowSupplierModal(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 14px' }}>
                  <PlusCircle size={18} />
                </button>
                {selectedSupplier && (
                  <button type="button" className="btn-outline" onClick={() => openEditSupplier(selectedSupplier)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 14px' }}>
                    <Pencil size={16} />
                  </button>
                )}
              </div>
            </div>

            <div className="col-6 form-group">
              <label>Pickup Spot Location</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Sengkurong Site Yard" 
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                required
              />
            </div>

            {/* Mode A: Single Vehicle Parameters */}
            {type === 'VEHICLE' && (
              <>
                <div className="col-6 form-group">
                  <label>Car Model Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Toyota Hilux Double Cab" 
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    required
                  />
                </div>

                <div className="col-6 form-group">
                  <label>Wheel Rim Specification</label>
                  <CustomSelect
                    value={alloyWheelsCount.toString()}
                    onChange={(v) => setAlloyWheelsCount(parseInt(v))}
                    options={[
                      { value: '0', label: 'Steel Wheels (0 Alloys)' },
                      { value: '1', label: '1 Premium Alloy' },
                      { value: '2', label: '2 Premium Alloys' },
                      { value: '3', label: '3 Premium Alloys' },
                      { value: '4', label: '4 Premium Alloys' },
                      { value: '5', label: '5+ Premium Alloys' },
                    ]}
                    required
                  />
                </div>

                <div className="col-4 form-group">
                  <label>Engine Block Intact?</label>
                  <div className="toggle-group">
                    <button 
                      type="button" 
                      className={`toggle-btn toggle-btn-yes ${engineIntact ? 'active' : ''}`}
                      onClick={() => setEngineIntact(true)}
                    >
                      YES
                    </button>
                    <button 
                      type="button" 
                      className={`toggle-btn toggle-btn-no ${!engineIntact ? 'active' : ''}`}
                      onClick={() => setEngineIntact(false)}
                    >
                      NO
                    </button>
                  </div>
                </div>

                <div className="col-4 form-group">
                  <label>Gearbox Present?</label>
                  <div className="toggle-group">
                    <button 
                      type="button" 
                      className={`toggle-btn toggle-btn-yes ${gearboxPresent ? 'active' : ''}`}
                      onClick={() => setGearboxPresent(true)}
                    >
                      YES
                    </button>
                    <button 
                      type="button" 
                      className={`toggle-btn toggle-btn-no ${!gearboxPresent ? 'active' : ''}`}
                      onClick={() => setGearboxPresent(false)}
                    >
                      NO
                    </button>
                  </div>
                </div>

                <div className="col-4 form-group">
                  <label>Catalytic Converter?</label>
                  <div className="toggle-group">
                    <button 
                      type="button" 
                      className={`toggle-btn toggle-btn-yes ${catalyticConverter ? 'active' : ''}`}
                      onClick={() => setCatalyticConverter(true)}
                    >
                      YES
                    </button>
                    <button 
                      type="button" 
                      className={`toggle-btn toggle-btn-no ${!catalyticConverter ? 'active' : ''}`}
                      onClick={() => setCatalyticConverter(false)}
                    >
                      NO
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Mode B: Loose Scrap */}
            {type === 'LOOSE_SCRAP' && (
              <>
                <div className="col-6 form-group">
                  <label>Material Type</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Copper Wire, Iron Rods"
                    value={looseMaterial}
                    onChange={(e) => setLooseMaterial(e.target.value)}
                    required
                  />
                </div>
                <div className="col-2 form-group">
                  <label>Quantity</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 250"
                    value={looseQty}
                    onChange={(e) => setLooseQty(e.target.value)}
                    required
                  />
                </div>
                <div className="col-2 form-group">
                  <label>Unit</label>
                  <select className="form-input" value={looseUnit} onChange={(e) => setLooseUnit(e.target.value)}>
                    <option value="KG">KG</option>
                    <option value="TON">TON</option>
                    <option value="PCS">PCS</option>
                  </select>
                </div>
                <div className="col-2 form-group">
                  <label>Rate (BND/{looseUnit})</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0.00"
                    value={looseRate}
                    onChange={(e) => setLooseRate(e.target.value)}
                    required
                  />
                </div>
                {looseQty && looseRate && (
                  <div className="col-12">
                    <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '10px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Calculated Total</span>
                      <strong style={{ color: '#10b981', fontSize: '1.1rem' }}>B$ {((parseFloat(looseQty) || 0) * (parseFloat(looseRate) || 0)).toFixed(2)}</strong>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Mode C: Mixed Lot Parameters */}
            {type === 'MIXED_SCRAP' && (
              <>
                <div className="col-6 form-group">
                  <label>Lot Identification Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Gadong Clearance Lot #3" 
                    value={lotName}
                    onChange={(e) => setLotName(e.target.value)}
                    required
                  />
                </div>

                <div className="col-6 form-group">
                  <label>Tonnage Estimate (Gross Metric KG)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="e.g. 5500" 
                    value={grossTonnageEstimate}
                    onChange={(e) => setGrossTonnageEstimate(e.target.value)}
                    required
                  />
                </div>

                <div className="col-12 form-group">
                  <label>Scrap Metal Descriptions</label>
                  <textarea 
                    className="form-textarea" 
                    rows={2} 
                    placeholder="Heavy Industrial Radiators, scrap copper wires, assorted motor blocks..."
                    value={scrapDescription}
                    onChange={(e) => setScrapDescription(e.target.value)}
                  />
                </div>

                <div className="col-12 form-group" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <label style={{ marginBottom: 0 }}>Materials Inventory Line Items</label>
                    <button 
                      type="button" 
                      className="btn-outline" 
                      onClick={() => setLineItems([...lineItems, { id: Date.now().toString(), material: '', qty: '', unit: 'KG', rate: '' }])}
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    >
                      <Plus size={14} /> Add Item
                    </button>
                  </div>
                  
                  {lineItems.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {lineItems.map((item, index) => (
                        <div key={item.id} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="Material (e.g. Copper)" 
                            value={item.material}
                            onChange={(e) => {
                              const newItems = [...lineItems];
                              newItems[index].material = e.target.value;
                              setLineItems(newItems);
                            }}
                            required
                          />
                          <input 
                            type="number" 
                            className="form-input" 
                            placeholder="Qty" 
                            style={{ width: '80px' }}
                            value={item.qty}
                            onChange={(e) => {
                              const newItems = [...lineItems];
                              newItems[index].qty = e.target.value;
                              setLineItems(newItems);
                            }}
                            required
                          />
                          <select 
                            className="form-input" 
                            style={{ width: '90px' }}
                            value={item.unit}
                            onChange={(e) => {
                              const newItems = [...lineItems];
                              newItems[index].unit = e.target.value;
                              setLineItems(newItems);
                            }}
                          >
                            <option value="KG">KG</option>
                            <option value="TON">TON</option>
                            <option value="PCS">PCS</option>
                          </select>
                          <input 
                            type="number" 
                            className="form-input" 
                            placeholder="Rate (BND)" 
                            style={{ width: '100px' }}
                            value={item.rate}
                            onChange={(e) => {
                              const newItems = [...lineItems];
                              newItems[index].rate = e.target.value;
                              setLineItems(newItems);
                            }}
                            required
                          />
                          <div style={{ width: '100px', textAlign: 'right', fontWeight: 600, color: '#10b981' }}>
                            ${((parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0)).toFixed(2)}
                          </div>
                          <button 
                            type="button" 
                            onClick={() => setLineItems(lineItems.filter(li => li.id !== item.id))}
                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', color: '#64748b', fontSize: '0.85rem' }}>
                      No items added yet. Click "Add Item" to record scrap materials.
                    </div>
                  )}
                </div>
              </>
            )}

            {/* General Inbound Logistics Info */}
            <div className="col-12" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px', marginTop: '10px' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '16px' }}>Dispatch & Transport Log</h3>
            </div>

            <div className="col-4 form-group">
              <label>Logistics Mode</label>
              <div className="toggle-group">
                <button 
                  type="button" 
                  className={`toggle-btn ${logisticsMethod === 'HIAB' ? 'active' : ''}`}
                  onClick={() => setLogisticsMethod('HIAB')}
                >
                  HIAB Crane
                </button>
                <button 
                  type="button" 
                  className={`toggle-btn ${logisticsMethod === 'COMPANY_VEHICLE' ? 'active' : ''}`}
                  onClick={() => setLogisticsMethod('COMPANY_VEHICLE')}
                >
                  Own Fleet
                </button>
                <button 
                  type="button" 
                  className={`toggle-btn ${logisticsMethod === 'TOWING' ? 'active' : ''}`}
                  onClick={() => setLogisticsMethod('TOWING')}
                >
                  Rented Tow
                </button>
              </div>
            </div>

            <div className="col-4 form-group">
              <label>Assigned Operator / Driver</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Sufri" 
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
              />
            </div>

            {logisticsMethod === 'TOWING' ? (
              <div className="col-4 form-group">
                <label>External Towing Company</label>
                <CustomSelect
                  value={transportCompanyId}
                  onChange={setTransportCompanyId}
                  placeholder="-- Choose Transporter --"
                  options={transporters.map(t => ({ value: t.id.toString(), label: t.name }))}
                  required
                />
              </div>
            ) : (
              <div className="col-4 form-group" style={{ opacity: 0.5 }}>
                <label>Logistics Partner</label>
                <input type="text" className="form-input" value="Internal Fleet Runs" disabled />
              </div>
            )}

            {logisticsMethod === 'TOWING' && (
              <div className="col-4 form-group">
                <label>Towing Fee due to Partner (BND)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={transportTripFee}
                  onChange={(e) => setTransportTripFee(e.target.value)}
                />
              </div>
            )}

            {/* Financial valuations */}
            <div className="col-12" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px', marginTop: '10px' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '16px' }}>Invoice Payments Settlement</h3>
            </div>

            <div className="col-4 form-group">
              <label>Valuation Cost Price (BND)</label>
              <input 
                type="number" 
                className="form-input" 
                placeholder="0.00" 
                value={type !== 'VEHICLE' ? computedAgreedPrice.toFixed(2) : agreedPrice}
                onChange={(e) => setAgreedPrice(e.target.value)}
                disabled={type !== 'VEHICLE'}
                required={type === 'VEHICLE'}
              />
            </div>

            <div className="col-4 form-group">
              <label>Payment Settlement Mode</label>
              <CustomSelect
                value={paymentStatus}
                onChange={(v) => setPaymentStatus(v as any)}
                options={[
                  { value: 'UNPAID', label: <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><AlertTriangle size={14} style={{ color: '#ef4444' }} /> Unpaid (Pay Later)</span> },
                  { value: 'PAID', label: <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Check size={14} style={{ color: '#10b981' }} /> Fully Paid Today</span> },
                  { value: 'PARTIAL', label: <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Clock size={14} style={{ color: '#f59e0b' }} /> Partial Advance Deposit</span> },
                ]}
                required
              />
            </div>

            <div className="col-4 form-group">
              <label>Payout Method</label>
              <CustomSelect
                value={paymentMethod}
                onChange={(v) => setPaymentMethod(v as any)}
                options={[
                  { value: 'CASH', label: 'Cash Drawer' },
                  { value: 'BANK_TRANSFER', label: 'Bank Telegraphic Transfer' },
                ]}
                required
              />
            </div>

            {/* Camera mock up */}
            <div className="col-12 form-group">
              <label>Camera Field Proof Attachment</label>
              <div className="image-preview-box">
                <Camera size={26} />
                <span style={{ fontSize: '0.85rem' }}>Proof of Pile / Asset Photo Captured</span>
                <code style={{ fontSize: '0.75rem', color: '#6366f1' }}>
                  {type === 'VEHICLE' ? vehiclePhoto : scrapPhoto}
                </code>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '16px 20px', borderRadius: '12px', marginTop: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Calculated Cash Payment Today</p>
              <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
                B$ {calculatedCashDue.toLocaleString('en-US', { minimumFractionDigits: 2 })} 
                {calculatedAdvanceDeduction > 0 && <span style={{ fontSize: '0.85rem', color: '#f59e0b', marginLeft: '10px' }}>(Deducted B${calculatedAdvanceDeduction})</span>}
              </p>
            </div>
            
            <button type="submit" className="btn-primary">
              <Save size={18} />
              Save Record to Production
            </button>
          </div>
        </form>

        {/* Right Side: Ledger view */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-panel" style={{ maxHeight: '900px', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingBag size={20} style={{ color: '#6366f1' }} />
              Live Purchases Log
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {purchases.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>No purchase records yet.</p>
              ) : (
                purchases.map(p => (
                  <div 
                    key={p.id} 
                    style={{ 
                      padding: '16px', 
                      background: 'rgba(255,255,255,0.02)', 
                      borderRadius: '12px', 
                      border: '1px solid rgba(255,255,255,0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div className="flex-between">
                      <code style={{ fontSize: '0.85rem', color: '#6366f1', fontWeight: 700 }}>{p.id}</code>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className={`badge ${p.paymentStatus === 'PAID' ? 'badge-success' : p.paymentStatus === 'PARTIAL' ? 'badge-warning' : 'badge-danger'}`}>
                          {p.paymentStatus}
                        </span>
                        <button
                          type="button"
                          onClick={() => openEditModal(p)}
                          style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '4px 8px', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}
                        >
                          <Pencil size={13} />
                        </button>
                      </div>
                    </div>

                    <p style={{ fontWeight: 650, color: '#fff', fontSize: '0.95rem' }}>
                      {p.type === 'VEHICLE' ? p.vehicleModel : p.lotName}
                    </p>

                    <div style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <p style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><MapPin size={14} style={{ opacity: 0.7 }} /> Location: {p.pickupLocation}</p>
                      <p style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><User size={14} style={{ opacity: 0.7 }} /> Supplier: {p.supplier?.name}</p>
                      <p style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Truck size={14} style={{ opacity: 0.7 }} /> Logistics: {p.logisticsMethod} {p.driverName ? `(${p.driverName})` : ''}</p>
                      {p.previousAdvanceDeduction > 0 && <p style={{ color: '#f59e0b', display: 'inline-flex', alignItems: 'center', gap: '6px' }}><AlertTriangle size={14} /> Adv Deduction: B$ {p.previousAdvanceDeduction.toFixed(0)}</p>}
                    </div>

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {new Date(p.date).toLocaleDateString()}
                      </span>
                      <strong style={{ color: '#fff', fontSize: '0.95rem' }}>B$ {p.agreedPrice.toFixed(2)}</strong>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Purchase Modal */}
      {editingPurchase && (
        <div className="overlay">
          <div className="modal-content" style={{ maxWidth: '680px' }}>
            <div className="flex-between" style={{ marginBottom: '20px' }}>
              <h2 className="modal-title" style={{ margin: 0 }}>Edit Purchase — <code style={{ color: '#6366f1' }}>{editingPurchase.id}</code></h2>
              <button type="button" style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }} onClick={() => setEditingPurchase(null)}><X size={20} /></button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="form-grid">
                <div className="col-6 form-group">
                  <label>Pickup Location</label>
                  <input type="text" className="form-input" value={editPickupLocation} onChange={(e) => setEditPickupLocation(e.target.value)} required />
                </div>
                <div className="col-6 form-group">
                  <label>Driver / Operator</label>
                  <input type="text" className="form-input" value={editDriverName} onChange={(e) => setEditDriverName(e.target.value)} />
                </div>
                <div className="col-4 form-group">
                  <label>Logistics Mode</label>
                  <div className="toggle-group">
                    {(['HIAB', 'COMPANY_VEHICLE', 'TOWING'] as const).map(m => (
                      <button key={m} type="button" className={`toggle-btn ${editLogisticsMethod === m ? 'active' : ''}`} onClick={() => setEditLogisticsMethod(m)}>
                        {m === 'HIAB' ? 'HIAB' : m === 'COMPANY_VEHICLE' ? 'Own Fleet' : 'Rented Tow'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="col-4 form-group">
                  <label>Payment Status</label>
                  <CustomSelect
                    value={editPaymentStatus}
                    onChange={(v) => setEditPaymentStatus(v as any)}
                    options={[
                        { value: 'UNPAID', label: <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><AlertTriangle size={14} style={{ color: '#ef4444' }} /> Unpaid</span> },
                        { value: 'PAID', label: <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Check size={14} style={{ color: '#10b981' }} /> Fully Paid</span> },
                        { value: 'PARTIAL', label: <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Clock size={14} style={{ color: '#f59e0b' }} /> Partial</span> },
                    ]}
                    required
                  />
                </div>
                <div className="col-4 form-group">
                  <label>Payment Method</label>
                  <CustomSelect
                    value={editPaymentMethod}
                    onChange={(v) => setEditPaymentMethod(v as any)}
                    options={[
                      { value: 'CASH', label: 'Cash' },
                      { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
                    ]}
                    required
                  />
                </div>

                {editingPurchase.type === 'VEHICLE' && (
                  <>
                    <div className="col-6 form-group">
                      <label>Vehicle Model</label>
                      <input type="text" className="form-input" value={editVehicleModel} onChange={(e) => setEditVehicleModel(e.target.value)} />
                    </div>
                    <div className="col-6 form-group">
                      <label>Alloy Wheels Count</label>
                      <CustomSelect
                        value={editAlloyWheelsCount.toString()}
                        onChange={(v) => setEditAlloyWheelsCount(parseInt(v))}
                        options={[0,1,2,3,4,5].map(n => ({ value: n.toString(), label: n === 0 ? 'Steel (0)' : `${n} Alloy${n > 1 ? 's' : ''}` }))}
                        required
                      />
                    </div>
                    <div className="col-4 form-group">
                      <label>Engine Intact?</label>
                      <div className="toggle-group">
                        <button type="button" className={`toggle-btn toggle-btn-yes ${editEngineIntact ? 'active' : ''}`} onClick={() => setEditEngineIntact(true)}>YES</button>
                        <button type="button" className={`toggle-btn toggle-btn-no ${!editEngineIntact ? 'active' : ''}`} onClick={() => setEditEngineIntact(false)}>NO</button>
                      </div>
                    </div>
                    <div className="col-4 form-group">
                      <label>Gearbox Present?</label>
                      <div className="toggle-group">
                        <button type="button" className={`toggle-btn toggle-btn-yes ${editGearboxPresent ? 'active' : ''}`} onClick={() => setEditGearboxPresent(true)}>YES</button>
                        <button type="button" className={`toggle-btn toggle-btn-no ${!editGearboxPresent ? 'active' : ''}`} onClick={() => setEditGearboxPresent(false)}>NO</button>
                      </div>
                    </div>
                    <div className="col-4 form-group">
                      <label>Catalytic Converter?</label>
                      <div className="toggle-group">
                        <button type="button" className={`toggle-btn toggle-btn-yes ${editCatalyticConverter ? 'active' : ''}`} onClick={() => setEditCatalyticConverter(true)}>YES</button>
                        <button type="button" className={`toggle-btn toggle-btn-no ${!editCatalyticConverter ? 'active' : ''}`} onClick={() => setEditCatalyticConverter(false)}>NO</button>
                      </div>
                    </div>
                  </>
                )}

                {editingPurchase.type === 'MIXED_SCRAP' && (
                  <>
                    <div className="col-6 form-group">
                      <label>Lot Name</label>
                      <input type="text" className="form-input" value={editLotName} onChange={(e) => setEditLotName(e.target.value)} />
                    </div>
                    <div className="col-6 form-group">
                      <label>Gross Tonnage (KG)</label>
                      <input type="number" className="form-input" value={editGrossTonnageEstimate} onChange={(e) => setEditGrossTonnageEstimate(e.target.value)} />
                    </div>
                    <div className="col-12 form-group">
                      <label>Scrap Description</label>
                      <textarea className="form-textarea" rows={2} value={editScrapDescription} onChange={(e) => setEditScrapDescription(e.target.value)} />
                    </div>
                  </>
                )}

                {editLogisticsMethod === 'TOWING' && (
                  <>
                    <div className="col-6 form-group">
                      <label>Towing Company</label>
                      <CustomSelect
                        value={editTransportCompanyId}
                        onChange={setEditTransportCompanyId}
                        placeholder="-- Choose Transporter --"
                        options={transporters.map(t => ({ value: t.id.toString(), label: t.name }))}
                      />
                    </div>
                    <div className="col-6 form-group">
                      <label>Trip Fee (BND)</label>
                      <input type="number" className="form-input" value={editTransportTripFee} onChange={(e) => setEditTransportTripFee(e.target.value)} />
                    </div>
                  </>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn-outline" onClick={() => setEditingPurchase(null)}>Cancel</button>
                <button type="submit" className="btn-primary"><Save size={16} /> Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Supplier Modal */}
      {editingSupplier && (
        <div className="overlay">
          <div className="modal-content">
            <div className="flex-between" style={{ marginBottom: '20px' }}>
              <h2 className="modal-title" style={{ margin: 0 }}>Edit Supplier</h2>
              <button type="button" style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }} onClick={() => setEditingSupplier(null)}><X size={20} /></button>
            </div>
            <form onSubmit={handleEditSupplierSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>Supplier Name</label>
                <input type="text" className="form-input" value={editSupName} onChange={(e) => setEditSupName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Contact</label>
                <input type="text" className="form-input" value={editSupContact} onChange={(e) => setEditSupContact(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Outstanding Advance (BND)</label>
                <input type="number" className="form-input" value={editSupAdvance} onChange={(e) => setEditSupAdvance(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-outline" onClick={() => setEditingSupplier(null)}>Cancel</button>
                <button type="submit" className="btn-primary"><Save size={16} /> Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supplier Modal Dialog */}
      {showSupplierModal && (
        <div className="overlay">
          <div className="modal-content">
            <h2 className="modal-title">Register New Supplier Card</h2>
            <form onSubmit={handleCreateSupplier} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>Company / Supplier Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Syarikat Maju Recyclers" 
                  value={newSupName}
                  onChange={(e) => setNewSupName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Contact Phone Number</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. +673 8812345" 
                  value={newSupContact}
                  onChange={(e) => setNewSupContact(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Outstanding Advance Cash Issuance (BND)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="0.00" 
                  value={newSupAdvance}
                  onChange={(e) => setNewSupAdvance(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn-outline" onClick={() => setShowSupplierModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
