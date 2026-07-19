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
  Clock,
  Check,
  X,
  PlusCircle,
  Pencil,
  Printer,
  FileText,
  CalendarDays,
  Hash,
  Zap,
  Wind,
  Battery,
  Droplets,
  Cable,
  FlaskConical,
} from 'lucide-react';
import { SkeletonBox } from '../../components/Skeleton';
import CustomSelect from '../../components/CustomSelect';
import Checklist from '../../components/Checklist';
import FileUpload from '../../components/FileUpload';
import { printPurchaseInvoice, type PrintPurchaseData } from '../../components/PrintInvoice';

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
  advancePaid?: number;
  previousAdvanceDeduction: number;
  cashToPay: number;
  paymentStatus: string;
  paymentMethod: string;
  notes?: string;
  collectionDate?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  registrationNo?: string;
  otherInfo?: string;
  engineIntact?: boolean;
  gearboxPresent?: boolean;
  catalyticConverter?: boolean;
  battery?: boolean;
  radiator?: boolean;
  wiring?: boolean;
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

type LogisticsMethod = 'OUR_LORRY' | 'OUR_TOW_TRUCK' | 'HIRED_LORRY' | 'HIRED_TOW_TRUCK' | 'SUPPLIER_DELIVERED';
type PaymentStatus = 'PAID' | 'PARTIAL' | 'UNPAID';
type PaymentMethod = 'CASH' | 'BANK_TRANSFER';

// ─── Collection method cards config ───────────────────────────────────────────
const LOGISTICS_OPTIONS: { value: LogisticsMethod; label: string; sub: string; icon: React.ReactNode }[] = [
  { value: 'OUR_TOW_TRUCK', label: 'Our Tow Truck', sub: 'Internal fleet', icon: <Truck size={18} /> },
  { value: 'OUR_LORRY',     label: 'Our Lorry',     sub: 'Internal lorry', icon: <Truck size={18} /> },
  { value: 'HIRED_TOW_TRUCK', label: 'Hired Tow',   sub: 'External partner', icon: <Truck size={18} /> },
  { value: 'HIRED_LORRY',   label: 'Hired Lorry',   sub: 'External partner', icon: <Package size={18} /> },
  { value: 'SUPPLIER_DELIVERED', label: 'Supplier Drop-off', sub: 'Self-delivered', icon: <User size={18} /> },
];

// ─── Inline toggle component ──────────────────────────────────────────────────
function YesNoToggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="form-group" style={{ minWidth: 0 }}>
      <label style={{ fontSize: '0.78rem' }}>{label}</label>
      <div className="toggle-group">
        <button type="button" className={`toggle-btn toggle-btn-yes ${value ? 'active' : ''}`} onClick={() => onChange(true)}>YES</button>
        <button type="button" className={`toggle-btn toggle-btn-no ${!value ? 'active' : ''}`} onClick={() => onChange(false)}>NO</button>
      </div>
    </div>
  );
}



export default function PurchasesPage() {
  const [purchases, setPurchases]       = useState<Purchase[]>([]);
  const [suppliers, setSuppliers]       = useState<Supplier[]>([]);
  const [transporters, setTransporters] = useState<Transporter[]>([]);
  const [loading, setLoading]           = useState(true);

  // Form state
  const [type, setType]               = useState<'VEHICLE' | 'LOOSE_SCRAP' | 'MIXED_SCRAP'>('VEHICLE');

  // Vehicle list (supports single + bulk in VEHICLE mode)
  const DEFAULT_CHECKLIST = [
    { label: 'Engine', checked: true }, { label: 'Gearbox', checked: true },
    { label: 'Catalytic', checked: true }, { label: 'Battery', checked: true },
    { label: 'Radiator', checked: true }, { label: 'Wiring', checked: true },
  ];
  interface BulkVehicle {
    id: string; brand: string; model: string; regNo: string;
    price: string; alloyWheels: number; otherInfo: string;
    checklist: { label: string; checked: boolean; custom?: boolean }[];
    logistics?: {
      logisticsMethod: LogisticsMethod;
      collectionDate: string;
      driverNames: string[];
      crewCount: string;
      transportCompanyId: string;
      transportTripFee: string;
    };
  }
  const newBulkVehicle = (): BulkVehicle => ({ id: Date.now().toString(), brand: '', model: '', regNo: '', price: '', alloyWheels: 0, otherInfo: '', checklist: DEFAULT_CHECKLIST.map(i => ({ ...i })) });

  // Multi-driver tag input helpers
  const [driverInput, setDriverInput] = useState('');
  const [driverNames, setDriverNames] = useState<string[]>([]);
  const [crewCount, setCrewCount] = useState('');
  const addDriver = (name: string, setInput: (v: string) => void, list: string[], setList: (v: string[]) => void) => {
    const n = name.trim();
    if (n && !list.includes(n)) setList([...list, n]);
    setInput('');
  };
  const [bulkVehicles, setBulkVehicles] = useState<BulkVehicle[]>([newBulkVehicle()]);
  const [expandedBulkId, setExpandedBulkId] = useState<string | null>(bulkVehicles[0]?.id ?? null);
  const [perVehicleLogistics, setPerVehicleLogistics] = useState(false);
  const [supplierId, setSupplierId]   = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [pickupLocation, setPickupLocation] = useState('');
  const [notes, setNotes]             = useState('');
  const [logisticsMethod, setLogisticsMethod] = useState<LogisticsMethod>('OUR_TOW_TRUCK');
  const [collectionDate, setCollectionDate]   = useState(new Date().toISOString().split('T')[0]);
  const [driverName, setDriverName]   = useState(''); // kept for non-vehicle / fallback
  const [agreedPrice, setAgreedPrice] = useState('');
  const [advancePaid, setAdvancePaid] = useState('0');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('UNPAID');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');

  // Vehicle specific (kept for edit modal only)
  const [vehicleBrand, setVehicleBrand]     = useState('');
  const [vehicleModel, setVehicleModel]     = useState('');
  const [registrationNo, setRegistrationNo] = useState('');
  const [otherInfo, setOtherInfo]           = useState('');
  const [componentChecklist, setComponentChecklist] = useState(DEFAULT_CHECKLIST.map(i => ({ ...i })));
  const [alloyWheelsCount, setAlloyWheelsCount] = useState(0);

  // Photo slots (3 slots per form)
  const [photoFront, setPhotoFront]   = useState('');
  const [photoSide, setPhotoSide]     = useState('');
  const [photoDetail, setPhotoDetail] = useState('');

  // Loose Scrap specific
  const [looseMaterial, setLooseMaterial] = useState('');
  const [looseCode, setLooseCode]         = useState('');
  const [looseCodeEnabled, setLooseCodeEnabled] = useState(false);
  const [looseQty, setLooseQty]           = useState('');
  const [looseUnit, setLooseUnit]         = useState('KG');
  const [looseRate, setLooseRate]         = useState('');

  // Mixed Scrap specific
  const [lotName, setLotName]                       = useState('');
  const [scrapDescription, setScrapDescription]     = useState('');
  const [grossTonnageEstimate, setGrossTonnageEstimate] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  // External logistics
  const [transportCompanyId, setTransportCompanyId] = useState('');
  const [transportCompanyName, setTransportCompanyName] = useState('');
  const [transportTripFee, setTransportTripFee]     = useState('80.00');

  // UI state
  const [applyAdvanceDeduction, setApplyAdvanceDeduction] = useState(true);
  const [customDeductionMode, setCustomDeductionMode] = useState(false);
  const [customDeductionAmt, setCustomDeductionAmt] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [previewPurchaseId, setPreviewPurchaseId] = useState<string>(`PUR-${new Date().getFullYear()}-001`);

  // ── Edit purchase state ────────────────────────────────────────────────────
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [editPickupLocation, setEditPickupLocation] = useState('');
  const [editNotes, setEditNotes]               = useState('');
  const [editLogisticsMethod, setEditLogisticsMethod] = useState<LogisticsMethod>('OUR_TOW_TRUCK');
  const [editCollectionDate, setEditCollectionDate]   = useState('');
  const [editDriverName, setEditDriverName]     = useState('');
  const [editPaymentStatus, setEditPaymentStatus]     = useState<PaymentStatus>('UNPAID');
  const [editPaymentMethod, setEditPaymentMethod]     = useState<PaymentMethod>('CASH');
  const [editAdvancePaid, setEditAdvancePaid]   = useState('0');
  const [editVehicleBrand, setEditVehicleBrand] = useState('');
  const [editVehicleModel, setEditVehicleModel] = useState('');
  const [editRegistrationNo, setEditRegistrationNo] = useState('');
  const [editOtherInfo, setEditOtherInfo]       = useState('');
  const [editComponentChecklist, setEditComponentChecklist] = useState([
    { label: 'Engine', checked: true },
    { label: 'Gearbox', checked: true },
    { label: 'Catalytic', checked: true },
    { label: 'Battery', checked: true },
    { label: 'Radiator', checked: true },
    { label: 'Wiring', checked: true },
  ]);
  const [editAlloyWheelsCount, setEditAlloyWheelsCount] = useState(0);
  const [editLotName, setEditLotName]           = useState('');
  const [editScrapDescription, setEditScrapDescription] = useState('');
  const [editGrossTonnageEstimate, setEditGrossTonnageEstimate] = useState('');
  const [editTransportCompanyId, setEditTransportCompanyId] = useState('');
  const [editTransportTripFee, setEditTransportTripFee]     = useState('');

  // ── New Supplier dialog ────────────────────────────────────────────────────
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [newSupName, setNewSupName]       = useState('');
  const [newSupContact, setNewSupContact] = useState('');
  const [newSupIce, setNewSupIce]         = useState('');
  const [newSupAdvance, setNewSupAdvance] = useState('0.00');

  // ── Edit Supplier dialog ───────────────────────────────────────────────────
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [editSupName, setEditSupName]         = useState('');
  const [editSupContact, setEditSupContact]   = useState('');
  const [editSupIce, setEditSupIce]           = useState('');
  const [editSupAdvance, setEditSupAdvance]   = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [supRes, transRes, purchaseRes] = await Promise.all([
        fetch('/api/suppliers'),
        fetch('/api/transporters'),
        fetch('/api/purchases'),
      ]);
      const [sups, trans, purs] = await Promise.all([supRes.json(), transRes.json(), purchaseRes.json()]);
      setSuppliers(Array.isArray(sups) ? sups : []);
      setTransporters(Array.isArray(trans) ? trans : []);
      const pursList = Array.isArray(purs) ? purs : [];
      setPurchases(pursList);
      const year = new Date().getFullYear();
      const yearPurchases = pursList.filter((p: Purchase) => p.id.startsWith(`PUR-${year}-`));
      const lastNum = yearPurchases.length > 0 ? Math.max(...yearPurchases.map((p: Purchase) => parseInt(p.id.split('-')[2]))) : 0;
      setPreviewPurchaseId(`PUR-${year}-${(lastNum + 1).toString().padStart(3, '0')}`);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const refreshNextId = () =>
    fetch('/api/purchases/next-id').then(r => r.json()).then(d => setPreviewPurchaseId(d.id)).catch(() => {});

  const handleSupplierChange = (idStr: string) => {
    setSupplierId(idStr);
    setSelectedSupplier(suppliers.find(s => s.id === parseInt(idStr)) || null);
    setApplyAdvanceDeduction(true);
    setCustomDeductionMode(false);
    setCustomDeductionAmt('');
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupName) return;
    try {
      const res  = await fetch('/api/suppliers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newSupName, contact: newSupContact, iceNumber: newSupIce || null, outstandingAdvance: parseFloat(newSupAdvance) || 0 }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create supplier');
      setMessage({ type: 'success', text: `Created supplier card: ${newSupName}` });
      await fetchData();
      setSupplierId(data.id.toString());
      setSelectedSupplier(data);
      setShowSupplierModal(false);
      setNewSupName(''); setNewSupContact(''); setNewSupIce(''); setNewSupAdvance('0.00');
    } catch (err: any) { setMessage({ type: 'error', text: err.message }); }
  };

  const computedAgreedPrice =
    type === 'MIXED_SCRAP' ? lineItems.reduce((acc, item) => acc + (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0), 0)
    : type === 'LOOSE_SCRAP' ? (parseFloat(looseQty) || 0) * (parseFloat(looseRate) || 0)
    : type === 'VEHICLE' ? bulkVehicles.reduce((s, v) => s + (parseFloat(v.price) || 0), 0)
    : parseFloat(agreedPrice) || 0;

  const fullDeduction = selectedSupplier ? Math.min(selectedSupplier.outstandingAdvance, computedAgreedPrice) : 0;
  const calculatedAdvanceDeduction = applyAdvanceDeduction
    ? (customDeductionMode
        ? Math.min(parseFloat(customDeductionAmt) || 0, fullDeduction)
        : fullDeduction)
    : 0;
  const advancePaidNum  = parseFloat(advancePaid) || 0;
  const balanceDue      = Math.max(0, computedAgreedPrice - calculatedAdvanceDeduction - advancePaidNum);

  const handleFormSubmit = async (e: React.FormEvent, print = false) => {
    e.preventDefault();
    if (!supplierId || !pickupLocation) {
      setMessage({ type: 'error', text: 'Please complete all required fields.' });
      return;
    }
    try {
      const isHired = logisticsMethod === 'HIRED_TOW_TRUCK' || logisticsMethod === 'HIRED_LORRY';
      const sharedBase: any = {
        supplierId: parseInt(supplierId), pickupLocation, notes, logisticsMethod,
        collectionDate,
        driverName: driverNames.length > 0 ? driverNames.join(', ') + (crewCount ? ` (+${crewCount} crew)` : '') : driverName,
        paymentStatus, paymentMethod, advancePaid: advancePaidNum,
        vehiclePhoto: [photoFront, photoSide, photoDetail].filter(Boolean).join(','),
      };
      if (isHired) {
        sharedBase.transportCompanyId   = transportCompanyId ? parseInt(transportCompanyId) : null;
        sharedBase.transportCompanyName  = transportCompanyName || null;
        sharedBase.transportTripFee      = parseFloat(transportTripFee) || 0;
      }

      const savedInvoices: PrintPurchaseData[] = [];

      if (type === 'VEHICLE') {
        if (bulkVehicles.length === 0) { setMessage({ type: 'error', text: 'Add at least one vehicle.' }); return; }
        const results: string[] = [];
        for (const v of bulkVehicles) {
          const cl = v.checklist;
          const vLogistics = perVehicleLogistics && v.logistics ? v.logistics : null;
          const vMethod = vLogistics ? vLogistics.logisticsMethod : logisticsMethod;
          const vIsHired = vMethod === 'HIRED_TOW_TRUCK' || vMethod === 'HIRED_LORRY';
          const vDriverName = vLogistics
            ? (vLogistics.driverNames.length > 0 ? vLogistics.driverNames.join(', ') + (vLogistics.crewCount ? ` (+${vLogistics.crewCount} crew)` : '') : '')
            : (driverNames.length > 0 ? driverNames.join(', ') + (crewCount ? ` (+${crewCount} crew)` : '') : driverName);
          const vPrice = parseFloat(v.price) || 0;
          const body: any = { ...sharedBase, type: 'VEHICLE', agreedPrice: vPrice,
            logisticsMethod: vMethod,
            collectionDate: vLogistics ? vLogistics.collectionDate : collectionDate,
            driverName: vDriverName,
            vehicleBrand: v.brand, vehicleModel: v.model, registrationNo: v.regNo,
            otherInfo: v.otherInfo, alloyWheelsCount: v.alloyWheels,
            engineIntact:       cl.find(i => i.label === 'Engine')?.checked ?? true,
            gearboxPresent:     cl.find(i => i.label === 'Gearbox')?.checked ?? true,
            catalyticConverter: cl.find(i => i.label === 'Catalytic')?.checked ?? true,
            battery:            cl.find(i => i.label === 'Battery')?.checked ?? true,
            radiator:           cl.find(i => i.label === 'Radiator')?.checked ?? true,
            wiring:             cl.find(i => i.label === 'Wiring')?.checked ?? true,
          };
          if (vIsHired) {
            body.transportCompanyId = vLogistics ? (vLogistics.transportCompanyId ? parseInt(vLogistics.transportCompanyId) : null) : (transportCompanyId ? parseInt(transportCompanyId) : null);
            body.transportTripFee   = vLogistics ? (parseFloat(vLogistics.transportTripFee) || 0) : (parseFloat(transportTripFee) || 0);
          }
          const res = await fetch('/api/purchases', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
          const saved = await res.json();
          if (!res.ok) throw new Error(`${v.brand} ${v.model}: ${saved.error}`);
          results.push(saved.id);
          savedInvoices.push({
            id: saved.id, date: saved.date ?? new Date().toISOString(),
            supplierName: selectedSupplier?.name ?? '', supplierContact: selectedSupplier?.contact,
            pickupLocation, notes, type: 'VEHICLE',
            vehicleBrand: v.brand, vehicleModel: v.model, registrationNo: v.regNo,
            otherInfo: v.otherInfo, alloyWheelsCount: v.alloyWheels,
            checklist: cl,
            logisticsMethod: vMethod,
            collectionDate: vLogistics ? vLogistics.collectionDate : collectionDate,
            driverName: vDriverName,
            transportCompanyName: vIsHired ? (vLogistics?.transportCompanyId || transportCompanyName) : undefined,
            transportTripFee: vIsHired ? (vLogistics ? parseFloat(vLogistics.transportTripFee) || 0 : parseFloat(transportTripFee) || 0) : undefined,
            agreedPrice: vPrice, advancePaid: advancePaidNum,
            advanceDeduction: calculatedAdvanceDeduction,
            balanceDue: Math.max(0, vPrice - calculatedAdvanceDeduction - advancePaidNum),
            paymentStatus, paymentMethod,
          });
        }
        setMessage({ type: 'success', text: `${results.length} vehicle${results.length > 1 ? 's' : ''} recorded: ${results.join(', ')}` });
        const first = newBulkVehicle();
        setBulkVehicles([first]); setExpandedBulkId(first.id);
      } else {
        const body: any = { ...sharedBase, type, agreedPrice: computedAgreedPrice };
        if (type === 'LOOSE_SCRAP') {
          body.lotName = looseMaterial;
          body.scrapDescription = `${looseQty} ${looseUnit} @ B$${looseRate}/${looseUnit}`;
          if (looseCodeEnabled && looseCode) body.scrapCode = looseCode;
          body.grossTonnageEstimate = parseFloat(looseQty) || 0;
          body.scrapPhoto = [photoFront, photoSide, photoDetail].filter(Boolean).join(',');
          body.lineItems  = [{ id: '1', material: looseMaterial, qty: looseQty, unit: looseUnit, rate: looseRate }];
        } else {
          Object.assign(body, { lotName, scrapDescription, grossTonnageEstimate: parseFloat(grossTonnageEstimate) || 0, scrapPhoto: [photoFront, photoSide, photoDetail].filter(Boolean).join(','), lineItems });
        }
        const res  = await fetch('/api/purchases', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const saved = await res.json();
        if (!res.ok) throw new Error(saved.error || 'Failed to record purchase');
        setMessage({ type: 'success', text: `Purchase recorded: ${saved.id}` });
        savedInvoices.push({
          id: saved.id, date: saved.date ?? new Date().toISOString(),
          supplierName: selectedSupplier?.name ?? '', supplierContact: selectedSupplier?.contact,
          pickupLocation, notes, type,
          lotName: type === 'LOOSE_SCRAP' ? looseMaterial : lotName,
          scrapDescription: type === 'LOOSE_SCRAP' ? `${looseQty} ${looseUnit} @ B$${looseRate}/${looseUnit}` : scrapDescription,
          grossTonnageEstimate: type === 'LOOSE_SCRAP' ? parseFloat(looseQty) || 0 : parseFloat(grossTonnageEstimate) || 0,
          lineItems: type === 'LOOSE_SCRAP'
            ? [{ material: looseMaterial, qty: looseQty, unit: looseUnit, rate: looseRate }]
            : lineItems,
          logisticsMethod, collectionDate, driverName: sharedBase.driverName,
          transportCompanyName: (logisticsMethod === 'HIRED_TOW_TRUCK' || logisticsMethod === 'HIRED_LORRY') ? transportCompanyName : undefined,
          transportTripFee: (logisticsMethod === 'HIRED_TOW_TRUCK' || logisticsMethod === 'HIRED_LORRY') ? parseFloat(transportTripFee) || 0 : undefined,
          agreedPrice: computedAgreedPrice, advancePaid: advancePaidNum,
          advanceDeduction: calculatedAdvanceDeduction,
          balanceDue, paymentStatus, paymentMethod,
        });
      }
      // Reset shared fields
      setPickupLocation(''); setNotes(''); setDriverName(''); setDriverNames([]); setDriverInput(''); setCrewCount(''); setAgreedPrice(''); setAdvancePaid('0');
      setLineItems([]); setLooseMaterial(''); setLooseCode(''); setLooseCodeEnabled(false); setLooseQty(''); setLooseRate('');
      setPhotoFront(''); setPhotoSide(''); setPhotoDetail('');
      setSelectedSupplier(null); setSupplierId('');
      const first = newBulkVehicle(); setBulkVehicles([first]); setExpandedBulkId(first.id);
      await fetchData();
      if (print) savedInvoices.forEach(inv => printPurchaseInvoice(inv));
    } catch (err: any) { setMessage({ type: 'error', text: err.message }); }
  };

  const openEditSupplier = (s: Supplier) => { setEditingSupplier(s); setEditSupName(s.name); setEditSupContact(s.contact || ''); setEditSupIce((s as any).iceNumber || ''); setEditSupAdvance(s.outstandingAdvance.toString()); };

  const handleEditSupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupplier) return;
    try {
      const res  = await fetch(`/api/suppliers/${editingSupplier.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: editSupName, contact: editSupContact, iceNumber: editSupIce || null, outstandingAdvance: parseFloat(editSupAdvance) || 0 }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update supplier');
      setMessage({ type: 'success', text: `Supplier ${editSupName} updated.` });
      setEditingSupplier(null);
      fetchData();
    } catch (err: any) { setMessage({ type: 'error', text: err.message }); }
  };

  const reprintPurchase = (p: Purchase) => {
    const checklist = [
      { label: 'Engine', checked: p.engineIntact ?? true },
      { label: 'Gearbox', checked: p.gearboxPresent ?? true },
      { label: 'Catalytic', checked: p.catalyticConverter ?? true },
      { label: 'Battery', checked: p.battery ?? true },
      { label: 'Radiator', checked: p.radiator ?? true },
      { label: 'Wiring', checked: p.wiring ?? true },
    ];
    printPurchaseInvoice({
      id: p.id, date: p.date, supplierName: p.supplier?.name ?? '', supplierContact: p.supplier?.contact,
      pickupLocation: p.pickupLocation, notes: p.notes, type: p.type,
      vehicleBrand: p.vehicleBrand, vehicleModel: p.vehicleModel, registrationNo: p.registrationNo,
      otherInfo: p.otherInfo, alloyWheelsCount: p.alloyWheelsCount, checklist,
      lotName: p.lotName, scrapDescription: p.scrapDescription, grossTonnageEstimate: p.grossTonnageEstimate,
      logisticsMethod: p.logisticsMethod, collectionDate: p.collectionDate, driverName: p.driverName,
      transportCompanyName: p.transportCompany?.name, transportTripFee: p.transportTripFee,
      agreedPrice: p.agreedPrice, advancePaid: p.advancePaid ?? 0,
      advanceDeduction: p.previousAdvanceDeduction,
      balanceDue: Math.max(0, p.cashToPay - (p.advancePaid ?? 0)),
      paymentStatus: p.paymentStatus, paymentMethod: p.paymentMethod,
    });
  };

  const openEditModal = (p: Purchase) => {
    setEditingPurchase(p);
    setEditPickupLocation(p.pickupLocation);
    setEditNotes(p.notes || '');
    setEditLogisticsMethod(p.logisticsMethod as LogisticsMethod);
    setEditCollectionDate(p.collectionDate ? p.collectionDate.split('T')[0] : '');
    setEditDriverName(p.driverName || '');
    setEditPaymentStatus(p.paymentStatus as PaymentStatus);
    setEditPaymentMethod(p.paymentMethod as PaymentMethod);
    setEditAdvancePaid(p.advancePaid?.toString() || '0');
    setEditVehicleBrand(p.vehicleBrand || '');
    setEditVehicleModel(p.vehicleModel || '');
    setEditRegistrationNo(p.registrationNo || '');
    setEditOtherInfo(p.otherInfo || '');
    setEditComponentChecklist([
      { label: 'Engine',    checked: p.engineIntact ?? true },
      { label: 'Gearbox',   checked: p.gearboxPresent ?? true },
      { label: 'Catalytic', checked: p.catalyticConverter ?? true },
      { label: 'Battery',   checked: p.battery ?? true },
      { label: 'Radiator',  checked: p.radiator ?? true },
      { label: 'Wiring',    checked: p.wiring ?? true },
    ]);
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
      const isHired = editLogisticsMethod === 'HIRED_TOW_TRUCK' || editLogisticsMethod === 'HIRED_LORRY';
      const body: any = {
        pickupLocation: editPickupLocation, notes: editNotes, logisticsMethod: editLogisticsMethod,
        collectionDate: editCollectionDate, driverName: editDriverName,
        paymentStatus: editPaymentStatus, paymentMethod: editPaymentMethod,
        advancePaid: parseFloat(editAdvancePaid) || 0,
      };
      if (editingPurchase.type === 'VEHICLE') {
        const cl = editComponentChecklist;
        Object.assign(body, { vehicleBrand: editVehicleBrand, vehicleModel: editVehicleModel, registrationNo: editRegistrationNo, otherInfo: editOtherInfo, alloyWheelsCount: editAlloyWheelsCount,
          engineIntact:       cl.find(i => i.label === 'Engine')?.checked ?? true,
          gearboxPresent:     cl.find(i => i.label === 'Gearbox')?.checked ?? true,
          catalyticConverter: cl.find(i => i.label === 'Catalytic')?.checked ?? true,
          battery:            cl.find(i => i.label === 'Battery')?.checked ?? true,
          radiator:           cl.find(i => i.label === 'Radiator')?.checked ?? true,
          wiring:             cl.find(i => i.label === 'Wiring')?.checked ?? true,
        });
      } else {
        Object.assign(body, { lotName: editLotName, scrapDescription: editScrapDescription, grossTonnageEstimate: parseFloat(editGrossTonnageEstimate) || 0 });
      }
      if (isHired) {
        body.transportCompanyId = editTransportCompanyId ? parseInt(editTransportCompanyId) : null;
        body.transportTripFee   = parseFloat(editTransportTripFee) || 0;
      }
      const res  = await fetch(`/api/purchases/${editingPurchase.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update purchase');
      setMessage({ type: 'success', text: `Purchase ${editingPurchase.id} updated.` });
      setEditingPurchase(null);
      fetchData();
    } catch (err: any) { setMessage({ type: 'error', text: err.message }); }
  };

  // ── Load dummy data for testing ──────────────────────────────────────────
  const loadDummyData = () => {
    setType('VEHICLE');
    setPickupLocation('Kg. Sungai Tilong Scrapyard, Brunei Muara');
    setNotes('Bulk salvage lot — referral from Hj. Rosli');
    setLogisticsMethod('OUR_TOW_TRUCK');
    setDriverNames(['Sufri bin Haji Damit']); setCrewCount('2');
    setCollectionDate(new Date().toISOString().split('T')[0]);
    setPaymentStatus('PARTIAL');
    setPaymentMethod('CASH');
    setAdvancePaid('100');
    setPerVehicleLogistics(true);

    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const dummyVehicles = [
      {
        id: Date.now().toString(),
        brand: 'Toyota', model: 'Hilux', regNo: 'BA 2341 A',
        price: '850', alloyWheels: 4, otherInfo: 'Missing front bumper, engine intact',
        checklist: [
          { label: 'Engine', checked: true }, { label: 'Gearbox', checked: true },
          { label: 'Catalytic', checked: false }, { label: 'Battery', checked: true },
          { label: 'Radiator', checked: true }, { label: 'Wiring', checked: false },
        ],
        logistics: {
          logisticsMethod: 'OUR_TOW_TRUCK' as LogisticsMethod,
          collectionDate: today,
          driverNames: ['Sufri bin Haji Damit'],
          crewCount: '2',
          transportCompanyId: '',
          transportTripFee: '0',
        },
      },
      {
        id: (Date.now() + 1).toString(),
        brand: 'Mitsubishi', model: 'Pajero', regNo: 'BB 5892 C',
        price: '1200', alloyWheels: 4, otherInfo: 'Cracked windscreen, gearbox present',
        checklist: [
          { label: 'Engine', checked: true }, { label: 'Gearbox', checked: true },
          { label: 'Catalytic', checked: true }, { label: 'Battery', checked: false },
          { label: 'Radiator', checked: true }, { label: 'Wiring', checked: true },
        ],
        logistics: {
          logisticsMethod: 'HIRED_TOW_TRUCK' as LogisticsMethod,
          collectionDate: today,
          driverNames: [],
          crewCount: '',
          transportCompanyId: 'Syarikat Towing Maju',
          transportTripFee: '80',
        },
      },
      {
        id: (Date.now() + 2).toString(),
        brand: 'Nissan', model: 'Navara', regNo: 'BC 1107 D',
        price: '650', alloyWheels: 0, otherInfo: 'No wheels, stripped interior',
        checklist: [
          { label: 'Engine', checked: false }, { label: 'Gearbox', checked: true },
          { label: 'Catalytic', checked: false }, { label: 'Battery', checked: false },
          { label: 'Radiator', checked: false }, { label: 'Wiring', checked: true },
        ],
        logistics: {
          logisticsMethod: 'OUR_LORRY' as LogisticsMethod,
          collectionDate: tomorrow,
          driverNames: ['Hairul bin Metali'],
          crewCount: '',
          transportCompanyId: '',
          transportTripFee: '0',
        },
      },
    ];
    setBulkVehicles(dummyVehicles);
    setExpandedBulkId(dummyVehicles[0].id);

    if (suppliers.length > 0) {
      const s = suppliers[0];
      setSupplierId(s.id.toString());
      setSelectedSupplier(s);
      setApplyAdvanceDeduction(s.outstandingAdvance > 0);
    }
    setMessage({ type: 'success', text: '🧪 Dummy data loaded — 3 vehicles with per-vehicle logistics pre-filled.' });
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* ── Page Header with Back button ─────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1>Inbound Purchase Processing</h1>
          <p className="page-title-desc">Dynamic procurement desk supporting dual modes for single motor salvage and heavy lot operations.</p>
        </div>
        <button
          type="button"
          onClick={loadDummyData}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 16px', borderRadius: '10px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700, border: '1px dashed rgba(139,92,246,0.4)', background: 'rgba(139,92,246,0.08)', color: '#a78bfa', transition: 'all 0.15s ease' }}
        >
          <FlaskConical size={15} /> Load Test Data
        </button>
      </div>

      {/* ── Toast message ──────────────────────────────────────────────────── */}
      {message && (
        <div style={{ padding: '16px', borderRadius: '12px', marginBottom: '24px', background: message.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: message.type === 'success' ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(239,68,68,0.2)', color: message.type === 'success' ? '#10b981' : '#ef4444', fontWeight: 500, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{message.text}</span>
          <button type="button" style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }} onClick={() => setMessage(null)}><X size={16} /></button>
        </div>
      )}

      {/* ── Mode tabs ──────────────────────────────────────────────────────── */}
      <div className="tabs-container">
        <div className={`tab-nav ${type === 'VEHICLE' ? 'active' : ''}`} onClick={() => setType('VEHICLE')}><Car size={16} /> Single Car Entry Mode</div>
        <div className={`tab-nav ${type === 'LOOSE_SCRAP' ? 'active' : ''}`} onClick={() => setType('LOOSE_SCRAP')}><Package size={16} /> Loose Scrap Entry</div>
        <div className={`tab-nav ${type === 'MIXED_SCRAP' ? 'active' : ''}`} onClick={() => setType('MIXED_SCRAP')}><Package size={16} /> Mixed Lot Screen</div>
      </div>

      <div className="dashboard-layout-main">
        {/* ══════════════ LEFT — Main Form ══════════════ */}
        <form onSubmit={(e) => handleFormSubmit(e, false)} style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>

          {/* ── Section 1: Purchase Header Info ──────────────────────────── */}
          <div className="glass-panel" style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} style={{ color: '#c9a84c' }} /> Salvage Procurement Card
            </h2>

            {/* Purchase ID + Date + Supplier row */}
            <div className="form-grid">
              <div className="col-3 form-group">
                <label><Hash size={12} style={{ display: 'inline', marginRight: '4px', opacity: 0.7 }} />Purchase ID</label>
                <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: '10px', padding: '10px 14px', fontFamily: 'monospace', color: '#c9a84c', fontWeight: 700, fontSize: '0.95rem', letterSpacing: '0.05em', minHeight: '42px', display: 'flex', alignItems: 'center' }}>
                  {previewPurchaseId}
                </div>
              </div>

              <div className="col-3 form-group">
                <label><CalendarDays size={12} style={{ display: 'inline', marginRight: '4px', opacity: 0.7 }} />Purchase Date</label>
                <input type="date" className="form-input" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} required />
              </div>

              <div className="col-6 form-group">
                <label>Supplier Vendor Registry</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <CustomSelect
                    value={supplierId}
                    onChange={handleSupplierChange}
                    placeholder="-- Choose Supplier --"
                    options={suppliers.map(s => ({ value: s.id.toString(), label: `${s.name} (Adv: B$${s.outstandingAdvance.toFixed(0)})` }))}
                  />
                  <button type="button" className="btn-outline" onClick={() => setShowSupplierModal(true)} style={{ padding: '10px 14px', display: 'flex', alignItems: 'center' }}><PlusCircle size={18} /></button>
                  {selectedSupplier && <button type="button" className="btn-outline" onClick={() => openEditSupplier(selectedSupplier)} style={{ padding: '10px 14px', display: 'flex', alignItems: 'center' }}><Pencil size={16} /></button>}
                </div>
              </div>

              <div className="col-6 form-group">
                <label>Pickup Spot Location</label>
                <input type="text" className="form-input" placeholder="e.g. Sengkurong Site Yard" value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} required />
              </div>

              <div className="col-6 form-group">
                <label>Reference / Notes</label>
                <input type="text" className="form-input" placeholder="e.g. Referral from Hj. Ahmad, special terms..." value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>

            {selectedSupplier && selectedSupplier.outstandingAdvance > 0 && (
              <div className="custom-alert" style={{ marginTop: '4px', flexDirection: 'column', gap: '12px', alignItems: 'stretch' }}>
                {/* Row 1 — icon + text + checkbox */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <AlertTriangle className="custom-alert-icon" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ flex: 1 }}>
                    <p className="custom-alert-title">Smart Advance Auto-Deduction Alert</p>
                    <p style={{ fontSize: '0.85rem' }}>Supplier <strong>{selectedSupplier.name}</strong> holds an outstanding advance of <strong>B$ {selectedSupplier.outstandingAdvance.toFixed(2)}</strong>. This will auto-deduct from today's cash payout.</p>
                  </div>
                  {/* Apply deduction checkbox */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer', flexShrink: 0, fontSize: '0.82rem', fontWeight: 600, color: applyAdvanceDeduction ? '#f59e0b' : '#64748b', whiteSpace: 'nowrap' }}>
                    <button
                      type="button"
                      onClick={() => { setApplyAdvanceDeduction(!applyAdvanceDeduction); if (applyAdvanceDeduction) { setCustomDeductionMode(false); setCustomDeductionAmt(''); } }}
                      style={{ width: '20px', height: '20px', borderRadius: '5px', cursor: 'pointer', flexShrink: 0, border: applyAdvanceDeduction ? '2px solid #f59e0b' : '2px solid rgba(255,255,255,0.15)', background: applyAdvanceDeduction ? '#f59e0b' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease' }}
                    >
                      {applyAdvanceDeduction && <Check size={12} color="#0e0c09" strokeWidth={3} />}
                    </button>
                    Apply Deduction
                  </label>
                </div>

                {/* Row 2 — deduction mode selector (only when checked) */}
                {applyAdvanceDeduction && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '30px' }}>
                    {/* Full deduction pill */}
                    <button
                      type="button"
                      onClick={() => { setCustomDeductionMode(false); setCustomDeductionAmt(''); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, border: !customDeductionMode ? '2px solid #f59e0b' : '1px solid rgba(255,255,255,0.1)', background: !customDeductionMode ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.03)', color: !customDeductionMode ? '#f59e0b' : '#64748b', transition: 'all 0.15s ease' }}
                    >
                      <Check size={12} />
                      Full — B$ {fullDeduction.toFixed(2)}
                    </button>

                    {/* Custom amount pill */}
                    <button
                      type="button"
                      onClick={() => { setCustomDeductionMode(true); setCustomDeductionAmt(''); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, border: customDeductionMode ? '2px solid #c9a84c' : '1px solid rgba(255,255,255,0.1)', background: customDeductionMode ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.03)', color: customDeductionMode ? '#c9a84c' : '#64748b', transition: 'all 0.15s ease' }}
                    >
                      Custom Amount
                    </button>

                    {/* Custom amount input */}
                    {customDeductionMode && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>B$</span>
                        <input
                          type="number"
                          className="form-input"
                          placeholder={`Max ${fullDeduction.toFixed(2)}`}
                          value={customDeductionAmt}
                          min="0"
                          max={fullDeduction}
                          step="0.01"
                          onChange={e => setCustomDeductionAmt(e.target.value)}
                          style={{ width: '120px', padding: '6px 10px', fontSize: '0.85rem' }}
                        />
                        {parseFloat(customDeductionAmt) > fullDeduction && (
                          <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>Max B$ {fullDeduction.toFixed(2)}</span>
                        )}
                      </div>
                    )}

                    {/* Live deduction badge */}
                    {calculatedAdvanceDeduction > 0 && (
                      <span style={{ marginLeft: 'auto', fontSize: '0.8rem', fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '6px', padding: '4px 10px', whiteSpace: 'nowrap' }}>
                        − B$ {calculatedAdvanceDeduction.toFixed(2)} deducted
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Section 2: Vehicle / Scrap Details ───────────────────────── */}
          <div className="glass-panel" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '16px', color: '#c9a84c' }}>
              {type === 'VEHICLE' ? '🚗 Vehicle Details' : type === 'LOOSE_SCRAP' ? '📦 Scrap Details' : '📦 Lot Details'}
            </h3>
            <div className="form-grid">
              {/* ── VEHICLE (single + bulk list) ──────────────────────── */}
              {type === 'VEHICLE' && (
                <div className="col-12">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {bulkVehicles.map((v, idx) => (
                      <div key={v.id} style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden' }}>
                        <div
                          onClick={() => setExpandedBulkId(expandedBulkId === v.id ? null : v.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', cursor: 'pointer', userSelect: 'none' }}
                        >
                          <span style={{ color: '#c9a84c', fontWeight: 700, fontSize: '0.85rem', minWidth: '24px' }}>#{idx + 1}</span>
                          <span style={{ flex: 1, color: '#e2e8f0', fontSize: '0.9rem' }}>
                            {[v.brand, v.model].filter(Boolean).join(' ') || 'New Vehicle'}
                            {v.regNo && <span style={{ color: '#64748b', marginLeft: '8px', fontSize: '0.8rem' }}>{v.regNo}</span>}
                          </span>
                          {v.price && <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.85rem' }}>B$ {parseFloat(v.price).toFixed(2)}</span>}
                          {bulkVehicles.length > 1 && (
                            <button type="button" onClick={(e) => { e.stopPropagation(); setBulkVehicles(bulkVehicles.filter(x => x.id !== v.id)); }} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px', display: 'flex' }}><Trash2 size={14} /></button>
                          )}
                        </div>
                        {expandedBulkId === v.id && (
                          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                              <div className="form-group">
                                <label>Vehicle Brand</label>
                                <input type="text" className="form-input" placeholder="e.g. Toyota" value={v.brand} onChange={e => setBulkVehicles(bulkVehicles.map(x => x.id === v.id ? { ...x, brand: e.target.value } : x))} />
                              </div>
                              <div className="form-group">
                                <label>Vehicle Model</label>
                                <input type="text" className="form-input" placeholder="e.g. Hilux" value={v.model} onChange={e => setBulkVehicles(bulkVehicles.map(x => x.id === v.id ? { ...x, model: e.target.value } : x))} required />
                              </div>
                              <div className="form-group">
                                <label>Price (BND)</label>
                                <input type="number" className="form-input" placeholder="0.00" value={v.price} onChange={e => setBulkVehicles(bulkVehicles.map(x => x.id === v.id ? { ...x, price: e.target.value } : x))} required />
                              </div>
                            </div>
                            <div className="form-group">
                              <label>Component Checklist</label>
                              <Checklist items={v.checklist} onChange={cl => setBulkVehicles(bulkVehicles.map(x => x.id === v.id ? { ...x, checklist: cl } : x))} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                              <div className="form-group">
                                <label>Alloy Wheels Count</label>
                                <input type="number" className="form-input" min={0} max={8} value={v.alloyWheels} onChange={e => setBulkVehicles(bulkVehicles.map(x => x.id === v.id ? { ...x, alloyWheels: parseInt(e.target.value) || 0 } : x))} />
                              </div>
                              <div className="form-group">
                                <label>Other Info / Condition Notes</label>
                                <input type="text" className="form-input" placeholder="e.g. Missing bonnet, cracked windscreen..." value={v.otherInfo} onChange={e => setBulkVehicles(bulkVehicles.map(x => x.id === v.id ? { ...x, otherInfo: e.target.value } : x))} />
                              </div>
                            </div>
                            {/* Per-vehicle logistics */}
                            {perVehicleLogistics && (
                              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#c9a84c', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>🚛 Logistics for this vehicle</p>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                                  {LOGISTICS_OPTIONS.map(opt => {
                                    const cur = v.logistics?.logisticsMethod ?? 'OUR_TOW_TRUCK';
                                    return (
                                      <button key={opt.value} type="button"
                                        onClick={() => setBulkVehicles(bulkVehicles.map(x => x.id === v.id ? { ...x, logistics: { logisticsMethod: opt.value, collectionDate: x.logistics?.collectionDate ?? collectionDate, driverNames: x.logistics?.driverNames ?? [], crewCount: x.logistics?.crewCount ?? '', transportCompanyId: x.logistics?.transportCompanyId ?? '', transportTripFee: x.logistics?.transportTripFee ?? '80.00' } } : x))}
                                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '10px 6px', borderRadius: '10px', cursor: 'pointer', border: cur === opt.value ? '2px solid #c9a84c' : '1px solid rgba(255,255,255,0.08)', background: cur === opt.value ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.02)', color: cur === opt.value ? '#e8d5a3' : '#64748b', fontSize: '0.75rem', fontWeight: 700, textAlign: 'center', transition: 'all 0.15s ease' }}>
                                        <span style={{ color: cur === opt.value ? '#c9a84c' : '#64748b' }}>{opt.icon}</span>
                                        {opt.label}
                                      </button>
                                    );
                                  })}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                  <div className="form-group">
                                    <label>Collection Date</label>
                                    <input type="date" className="form-input" value={v.logistics?.collectionDate ?? collectionDate} onChange={e => setBulkVehicles(bulkVehicles.map(x => x.id === v.id ? { ...x, logistics: { ...x.logistics!, logisticsMethod: x.logistics?.logisticsMethod ?? 'OUR_TOW_TRUCK', collectionDate: e.target.value, driverNames: x.logistics?.driverNames ?? [], crewCount: x.logistics?.crewCount ?? '', transportCompanyId: x.logistics?.transportCompanyId ?? '', transportTripFee: x.logistics?.transportTripFee ?? '80.00' } } : x))} />
                                  </div>
                                  <div className="form-group">
                                    <label>Crew Count (total in vehicle)</label>
                                    <input type="number" className="form-input" min={1} placeholder="e.g. 2" value={v.logistics?.crewCount ?? ''} onChange={e => setBulkVehicles(bulkVehicles.map(x => x.id === v.id ? { ...x, logistics: { ...x.logistics!, logisticsMethod: x.logistics?.logisticsMethod ?? 'OUR_TOW_TRUCK', collectionDate: x.logistics?.collectionDate ?? collectionDate, driverNames: x.logistics?.driverNames ?? [], crewCount: e.target.value, transportCompanyId: x.logistics?.transportCompanyId ?? '', transportTripFee: x.logistics?.transportTripFee ?? '80.00' } } : x))} />
                                  </div>
                                </div>
                                {/* Multi-driver tags */}
                                <div className="form-group">
                                  <label>Driver(s) / Operator(s)</label>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '6px' }}>
                                    {(v.logistics?.driverNames ?? []).map((dn, di) => (
                                      <span key={di} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '20px', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', color: '#e8d5a3', fontSize: '0.82rem', fontWeight: 600 }}>
                                        {dn}
                                        <button type="button" onClick={() => setBulkVehicles(bulkVehicles.map(x => x.id === v.id ? { ...x, logistics: { ...x.logistics!, logisticsMethod: x.logistics!.logisticsMethod, collectionDate: x.logistics!.collectionDate, driverNames: (x.logistics?.driverNames ?? []).filter((_, i) => i !== di), crewCount: x.logistics?.crewCount ?? '', transportCompanyId: x.logistics!.transportCompanyId, transportTripFee: x.logistics!.transportTripFee } } : x))} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0, display: 'flex' }}><X size={11} /></button>
                                      </span>
                                    ))}
                                  </div>
                                  <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                      type="text" className="form-input" placeholder="Type name, press Enter"
                                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); const val = (e.target as HTMLInputElement).value.trim(); if (val) { setBulkVehicles(bulkVehicles.map(x => x.id === v.id ? { ...x, logistics: { ...x.logistics!, logisticsMethod: x.logistics?.logisticsMethod ?? 'OUR_TOW_TRUCK', collectionDate: x.logistics?.collectionDate ?? collectionDate, driverNames: [...(x.logistics?.driverNames ?? []), val], crewCount: x.logistics?.crewCount ?? '', transportCompanyId: x.logistics?.transportCompanyId ?? '', transportTripFee: x.logistics?.transportTripFee ?? '80.00' } } : x)); (e.target as HTMLInputElement).value = ''; } } }}
                                      style={{ flex: 1 }}
                                    />
                                    <button type="button" className="btn-outline" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}
                                      onClick={e => { const inp = (e.currentTarget.previousSibling as HTMLInputElement); const val = inp.value.trim(); if (val) { setBulkVehicles(bulkVehicles.map(x => x.id === v.id ? { ...x, logistics: { ...x.logistics!, logisticsMethod: x.logistics?.logisticsMethod ?? 'OUR_TOW_TRUCK', collectionDate: x.logistics?.collectionDate ?? collectionDate, driverNames: [...(x.logistics?.driverNames ?? []), val], crewCount: x.logistics?.crewCount ?? '', transportCompanyId: x.logistics?.transportCompanyId ?? '', transportTripFee: x.logistics?.transportTripFee ?? '80.00' } } : x)); inp.value = ''; } }}>
                                      <Plus size={13} /> Add
                                    </button>
                                  </div>
                                </div>
                                {(v.logistics?.logisticsMethod === 'HIRED_TOW_TRUCK' || v.logistics?.logisticsMethod === 'HIRED_LORRY') && (
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div className="form-group">
                                      <label>Towing Company</label>
                                      <input list="transporter-list" className="form-input" placeholder="Type company name..." value={v.logistics?.transportCompanyId ?? ''} onChange={e => {
                                        const match = transporters.find(t => t.name === e.target.value);
                                        setBulkVehicles(bulkVehicles.map(x => x.id === v.id ? { ...x, logistics: { ...x.logistics!, logisticsMethod: x.logistics!.logisticsMethod, collectionDate: x.logistics!.collectionDate, driverNames: x.logistics?.driverNames ?? [], crewCount: x.logistics?.crewCount ?? '', transportCompanyId: match ? match.id.toString() : e.target.value, transportTripFee: x.logistics?.transportTripFee ?? '80.00' } } : x));
                                      }} />
                                    </div>
                                    <div className="form-group">
                                      <label>Trip Fee (BND)</label>
                                      <input type="number" className="form-input" value={v.logistics?.transportTripFee ?? '80.00'} onChange={e => setBulkVehicles(bulkVehicles.map(x => x.id === v.id ? { ...x, logistics: { ...x.logistics!, logisticsMethod: x.logistics!.logisticsMethod, collectionDate: x.logistics!.collectionDate, driverNames: x.logistics?.driverNames ?? [], crewCount: x.logistics?.crewCount ?? '', transportCompanyId: x.logistics!.transportCompanyId, transportTripFee: e.target.value } } : x))} />
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button" className="btn-outline"
                    onClick={() => { const v = newBulkVehicle(); setBulkVehicles(prev => [...prev, v]); setExpandedBulkId(v.id); }}
                    style={{ marginTop: '12px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <Plus size={15} /> Add Another Vehicle
                  </button>
                  {bulkVehicles.length > 1 && (
                    <div style={{ marginTop: '10px', padding: '10px 14px', background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{bulkVehicles.length} vehicles — Total</span>
                      <strong style={{ color: '#e8d5a3' }}>B$ {bulkVehicles.reduce((s, v) => s + (parseFloat(v.price) || 0), 0).toFixed(2)}</strong>
                    </div>
                  )}
                </div>
              )}

              {/* ── LOOSE SCRAP ────────────────────────────────────────── */}
              {type === 'LOOSE_SCRAP' && (
                <>
                  <div className="col-6 form-group">
                    <label>Material Type</label>
                    <input type="text" className="form-input" placeholder="e.g. Copper Wire, Iron Rods" value={looseMaterial} onChange={(e) => setLooseMaterial(e.target.value)} required />
                  </div>
                  <div className="col-6 form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => { setLooseCodeEnabled(!looseCodeEnabled); if (looseCodeEnabled) setLooseCode(''); }}
                        style={{
                          width: '20px', height: '20px', borderRadius: '5px', cursor: 'pointer', flexShrink: 0,
                          border: looseCodeEnabled ? '2px solid #c9a84c' : '2px solid rgba(255,255,255,0.15)',
                          background: looseCodeEnabled ? '#c9a84c' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {looseCodeEnabled && <Check size={12} color="#0e0c09" strokeWidth={3} />}
                      </button>
                      Scrap Code <span style={{ color: '#64748b', fontWeight: 400, fontSize: '0.78rem' }}>(optional)</span>
                    </label>
                    <input type="text" className="form-input" placeholder="e.g. SC-001" value={looseCode} onChange={(e) => setLooseCode(e.target.value)} disabled={!looseCodeEnabled} required={looseCodeEnabled} style={{ opacity: looseCodeEnabled ? 1 : 0.4 }} />
                  </div>
                  <div className="col-2 form-group">
                    <label>Quantity</label>
                    <input type="number" className="form-input" placeholder="e.g. 250" value={looseQty} onChange={(e) => setLooseQty(e.target.value)} required />
                  </div>
                  <div className="col-3 form-group">
                    <label>Unit</label>
                    <select className="form-input" value={looseUnit} onChange={(e) => setLooseUnit(e.target.value)}>
                      <option value="KG">KG</option>
                      <option value="TON">TON</option>
                      <option value="PCS">PCS</option>
                    </select>
                  </div>
                  <div className="col-2 form-group">
                    <label style={{ whiteSpace: 'nowrap' }}>Rate (BND/{looseUnit})</label>
                    <input type="number" className="form-input" placeholder="0.00" value={looseRate} onChange={(e) => setLooseRate(e.target.value)} required />
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

              {/* ── MIXED SCRAP ────────────────────────────────────────── */}
              {type === 'MIXED_SCRAP' && (
                <>
                  <div className="col-6 form-group">
                    <label>Lot Identification Name</label>
                    <input type="text" className="form-input" placeholder="e.g. Gadong Clearance Lot #3" value={lotName} onChange={(e) => setLotName(e.target.value)} required />
                  </div>
                  <div className="col-6 form-group">
                    <label>Tonnage Estimate (Gross KG)</label>
                    <input type="number" className="form-input" placeholder="e.g. 5500" value={grossTonnageEstimate} onChange={(e) => setGrossTonnageEstimate(e.target.value)} required />
                  </div>
                  <div className="col-12 form-group">
                    <label>Scrap Metal Descriptions</label>
                    <textarea className="form-textarea" rows={2} placeholder="Heavy Industrial Radiators, scrap copper wires, assorted motor blocks..." value={scrapDescription} onChange={(e) => setScrapDescription(e.target.value)} />
                  </div>
                  <div className="col-12 form-group" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <label style={{ marginBottom: 0 }}>Materials Line Items</label>
                      <button type="button" className="btn-outline" onClick={() => setLineItems([...lineItems, { id: Date.now().toString(), material: '', qty: '', unit: 'KG', rate: '' }])} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                        <Plus size={14} /> Add Item
                      </button>
                    </div>
                    {lineItems.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {lineItems.map((item, index) => (
                          <div key={item.id} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input type="text" className="form-input" placeholder="Material" value={item.material} onChange={(e) => { const n = [...lineItems]; n[index].material = e.target.value; setLineItems(n); }} required />
                            <input type="number" className="form-input" placeholder="Qty" style={{ width: '80px' }} value={item.qty} onChange={(e) => { const n = [...lineItems]; n[index].qty = e.target.value; setLineItems(n); }} required />
                            <select className="form-input" style={{ width: '90px' }} value={item.unit} onChange={(e) => { const n = [...lineItems]; n[index].unit = e.target.value; setLineItems(n); }}>
                              <option value="KG">KG</option><option value="TON">TON</option><option value="PCS">PCS</option>
                            </select>
                            <input type="number" className="form-input" placeholder="Rate" style={{ width: '100px' }} value={item.rate} onChange={(e) => { const n = [...lineItems]; n[index].rate = e.target.value; setLineItems(n); }} required />
                            <div style={{ width: '100px', textAlign: 'right', fontWeight: 600, color: '#10b981' }}>B$ {((parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0)).toFixed(2)}</div>
                            <button type="button" onClick={() => setLineItems(lineItems.filter(li => li.id !== item.id))} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}><Trash2 size={16} /></button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', color: '#64748b', fontSize: '0.85rem' }}>No items added yet. Click "Add Item" to record scrap materials.</div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── Section 3: Photo Upload (3 slots) ───────────────────────── */}
          <div className="glass-panel" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '16px', color: '#c9a84c' }}>📷 Photo Documentation</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <FileUpload label={type === 'VEHICLE' ? 'Car Photo' : 'Scrap Photo'} value={photoFront} onChange={setPhotoFront} accept="images" />
              <FileUpload label="Documents" value={photoSide} onChange={setPhotoSide} accept="both" />
              <FileUpload label="Additional Photo" value={photoDetail} onChange={setPhotoDetail} accept="both" />
            </div>
          </div>

          {/* ── Section 4: Logistics & Collection ───────────────────────── */}
          <div className="glass-panel" style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1rem', color: '#c9a84c', margin: 0 }}>🚛 Dispatch &amp; Transport</h3>
              {type === 'VEHICLE' && (
                <button type="button" onClick={() => setPerVehicleLogistics(!perVehicleLogistics)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 14px', borderRadius: '10px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, border: perVehicleLogistics ? '2px solid #c9a84c' : '1px solid rgba(255,255,255,0.12)', background: perVehicleLogistics ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.03)', color: perVehicleLogistics ? '#e8d5a3' : '#64748b', transition: 'all 0.15s ease' }}>
                  <span style={{ width: '16px', height: '16px', borderRadius: '4px', border: perVehicleLogistics ? '2px solid #c9a84c' : '2px solid rgba(255,255,255,0.2)', background: perVehicleLogistics ? '#c9a84c' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s ease' }}>
                    {perVehicleLogistics && <Check size={10} color="#0e0c09" strokeWidth={3} />}
                  </span>
                  Per-vehicle logistics
                </button>
              )}
            </div>
            {perVehicleLogistics && type === 'VEHICLE' ? (
              <div style={{ padding: '12px 16px', background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: '10px', color: '#94a3b8', fontSize: '0.85rem' }}>
                Each vehicle has its own logistics set inside the vehicle card above. The fields below apply only to vehicles without individual logistics set.
              </div>
            ) : (
              <div className="form-grid">
              {/* 5 collection method cards */}
              <div className="col-12 form-group">
                <label>Collection Method</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                  {LOGISTICS_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setLogisticsMethod(opt.value)}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        gap: '6px', padding: '14px 8px', borderRadius: '12px', cursor: 'pointer',
                        border: logisticsMethod === opt.value ? '2px solid #c9a84c' : '1px solid rgba(255,255,255,0.08)',
                        background: logisticsMethod === opt.value ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.02)',
                        color: logisticsMethod === opt.value ? '#e8d5a3' : '#94a3b8',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span style={{ color: logisticsMethod === opt.value ? '#c9a84c' : '#64748b' }}>{opt.icon}</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, textAlign: 'center', lineHeight: 1.2 }}>{opt.label}</span>
                      <span style={{ fontSize: '0.7rem', color: '#64748b', textAlign: 'center' }}>{opt.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="col-4 form-group">
                <label>Collection Date</label>
                <input type="date" className="form-input" value={collectionDate} onChange={(e) => setCollectionDate(e.target.value)} />
              </div>

              <div className="col-8 form-group">
                <label>Driver(s) / Operator(s)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '6px' }}>
                  {driverNames.map((dn, di) => (
                    <span key={di} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '20px', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', color: '#e8d5a3', fontSize: '0.82rem', fontWeight: 600 }}>
                      {dn}
                      <button type="button" onClick={() => setDriverNames(driverNames.filter((_, i) => i !== di))} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0, display: 'flex' }}><X size={11} /></button>
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" className="form-input" placeholder="Type name, press Enter" value={driverInput} onChange={e => setDriverInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addDriver(driverInput, setDriverInput, driverNames, setDriverNames); } }} />
                  <button type="button" className="btn-outline" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }} onClick={() => addDriver(driverInput, setDriverInput, driverNames, setDriverNames)}>
                    <Plus size={13} /> Add
                  </button>
                </div>
              </div>
              <div className="col-4 form-group">
                <label>Crew Count (total in vehicle)</label>
                <input type="number" className="form-input" min={1} placeholder="e.g. 2" value={crewCount} onChange={e => setCrewCount(e.target.value)} />
              </div>

              {(logisticsMethod === 'HIRED_TOW_TRUCK' || logisticsMethod === 'HIRED_LORRY') ? (
                <>
                  <div className="col-4 form-group">
                    <label>External Towing Company</label>
                    <input list="transporter-list" className="form-input" placeholder="Type company name..." value={transportCompanyName} onChange={e => {
                      setTransportCompanyName(e.target.value);
                      const match = transporters.find(t => t.name === e.target.value);
                      setTransportCompanyId(match ? match.id.toString() : '');
                    }} />
                    <datalist id="transporter-list">{transporters.map(t => <option key={t.id} value={t.name} />)}</datalist>
                  </div>
                  <div className="col-4 form-group">
                    <label>Trip Fee (BND)</label>
                    <input type="number" className="form-input" value={transportTripFee} onChange={(e) => setTransportTripFee(e.target.value)} />
                  </div>
                </>
              ) : (
                <div className="col-4 form-group" style={{ opacity: 0.4 }}>
                  <label>Logistics Partner</label>
                  <input type="text" className="form-input" value="Internal Fleet" disabled />
                </div>
              )}
              </div>
            )}
          </div>

          {/* ── Section 5: Payment & Financial Settlement ───────────────── */}
          <div className="glass-panel" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '16px', color: '#c9a84c' }}>💰 Invoice &amp; Payment Settlement</h3>
            <div className="form-grid">
              <div className="col-4 form-group">
                <label>Agreed Price (BND)</label>
                <input
                  type="number" className="form-input" placeholder="0.00"
                  value={computedAgreedPrice.toFixed(2)}
                  onChange={(e) => setAgreedPrice(e.target.value)}
                  disabled={true} required={false}
                />
              </div>

              <div className="col-4 form-group">
                <label>Advance Paid (BND)</label>
                <input type="number" className="form-input" placeholder="0.00" value={advancePaid} onChange={(e) => setAdvancePaid(e.target.value)} min="0" />
              </div>

              <div className="col-4 form-group">
                <label>Balance Due (BND)</label>
                <div style={{ background: balanceDue > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)', border: `1px solid ${balanceDue > 0 ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}`, borderRadius: '10px', padding: '10px 14px', fontWeight: 700, fontSize: '1rem', color: balanceDue > 0 ? '#ef4444' : '#10b981' }}>
                  B$ {balanceDue.toFixed(2)}
                  {calculatedAdvanceDeduction > 0 && <span style={{ fontSize: '0.75rem', color: '#f59e0b', display: 'block', fontWeight: 400 }}>After B${calculatedAdvanceDeduction.toFixed(2)} advance deduction</span>}
                </div>
              </div>

              {/* Payment Status — inline pill buttons */}
              <div className="col-6 form-group">
                <label>Payment Status</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {([
                    { value: 'PAID',    label: 'Paid',    color: '#10b981', bg: 'rgba(16,185,129,0.12)',    border: 'rgba(16,185,129,0.35)' },
                    { value: 'PARTIAL', label: 'Partial', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',   border: 'rgba(245,158,11,0.35)' },
                    { value: 'UNPAID',  label: 'Pending', color: '#ef4444', bg: 'rgba(239,68,68,0.12)',    border: 'rgba(239,68,68,0.35)' },
                  ] as const).map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPaymentStatus(opt.value)}
                      style={{
                        flex: 1, padding: '10px 8px', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem',
                        border: paymentStatus === opt.value ? `2px solid ${opt.border}` : '1px solid rgba(255,255,255,0.08)',
                        background: paymentStatus === opt.value ? opt.bg : 'rgba(255,255,255,0.02)',
                        color: paymentStatus === opt.value ? opt.color : '#64748b',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="col-6 form-group">
                <label>Payout Method</label>
                <CustomSelect value={paymentMethod} onChange={(v) => setPaymentMethod(v as PaymentMethod)} options={[{ value: 'CASH', label: 'Cash Drawer' }, { value: 'BANK_TRANSFER', label: 'Bank Telegraphic Transfer' }]} required />
              </div>
            </div>
          </div>

          {/* ── Save & Print bottom bar ──────────────────────────────────── */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', padding: '16px 20px' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Calculated Cash Payment Today</p>
              <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
                B$ {balanceDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                {calculatedAdvanceDeduction > 0 && <span style={{ fontSize: '0.85rem', color: '#f59e0b', marginLeft: '10px' }}>(Deducted B${calculatedAdvanceDeduction.toFixed(2)})</span>}
              </p>
            </div>
            <button type="button" className="btn-outline" onClick={() => { setPickupLocation(''); setNotes(''); setSupplierId(''); setSelectedSupplier(null); setAgreedPrice(''); setAdvancePaid('0'); setVehicleBrand(''); setVehicleModel(''); setRegistrationNo(''); setOtherInfo(''); setPhotoFront(''); setPhotoSide(''); setPhotoDetail(''); }}>
              <X size={16} /> Cancel
            </button>
            <button type="button" className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={(e) => handleFormSubmit(e as any, true)}>
              <Printer size={16} /> Save &amp; Print
            </button>
            <button type="submit" className="btn-primary">
              <Save size={18} /> Save Record
            </button>
          </div>
        </form>

        {/* ══════════════ RIGHT — Purchase Summary Panel ══════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '24px', alignSelf: 'start' }}>

          {/* Live summary of the current form */}
          <div className="glass-panel">
            <h2 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} style={{ color: '#c9a84c' }} /> Purchase Summary
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                <span style={{ color: '#94a3b8' }}>Purchase ID</span>
                <code style={{ color: '#c9a84c', fontWeight: 700 }}>{previewPurchaseId ?? '—'}</code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                <span style={{ color: '#94a3b8' }}>Date</span>
                <span style={{ color: '#e2e8f0' }}>{purchaseDate}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                <span style={{ color: '#94a3b8' }}>Supplier</span>
                <span style={{ color: '#e2e8f0' }}>{selectedSupplier?.name || '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                <span style={{ color: '#94a3b8' }}>Type</span>
                <span className={`badge ${type === 'VEHICLE' ? 'badge-info' : 'badge-warning'}`}>{type.replace('_', ' ')}</span>
              </div>
              {type === 'VEHICLE' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                  <span style={{ color: '#94a3b8' }}>Vehicle</span>
                  <span style={{ color: '#e2e8f0' }}>{[vehicleBrand, vehicleModel].filter(Boolean).join(' ') || '—'}</span>
                </div>
              )}
              {type === 'VEHICLE' && registrationNo && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                  <span style={{ color: '#94a3b8' }}>Reg. No.</span>
                  <span style={{ color: '#e2e8f0' }}>{registrationNo}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                <span style={{ color: '#94a3b8' }}>Collection</span>
                <span style={{ color: '#e2e8f0' }}>{LOGISTICS_OPTIONS.find(o => o.value === logisticsMethod)?.label || logisticsMethod}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                <span style={{ color: '#94a3b8' }}>Payment</span>
                <span className={`badge ${paymentStatus === 'PAID' ? 'badge-success' : paymentStatus === 'PARTIAL' ? 'badge-warning' : 'badge-danger'}`}>{paymentStatus}</span>
              </div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', marginTop: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(201,168,76,0.06)', borderRadius: '8px', border: '1px solid rgba(201,168,76,0.15)' }}>
                  <span style={{ color: '#94a3b8', fontWeight: 600 }}>Agreed Price</span>
                  <strong style={{ color: '#e8d5a3', fontSize: '1rem' }}>B$ {computedAgreedPrice.toFixed(2)}</strong>
                </div>
                {advancePaidNum > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', marginTop: '6px', background: 'rgba(245,158,11,0.05)', borderRadius: '8px' }}>
                    <span style={{ color: '#94a3b8' }}>Advance Paid</span>
                    <span style={{ color: '#f59e0b' }}>- B$ {advancePaidNum.toFixed(2)}</span>
                  </div>
                )}
                {calculatedAdvanceDeduction > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', marginTop: '6px', background: 'rgba(245,158,11,0.05)', borderRadius: '8px' }}>
                    <span style={{ color: '#94a3b8' }}>Advance Deduction</span>
                    <span style={{ color: '#f59e0b' }}>- B$ {calculatedAdvanceDeduction.toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', marginTop: '6px', background: balanceDue > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)', borderRadius: '8px', border: `1px solid ${balanceDue > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}` }}>
                  <span style={{ color: '#94a3b8', fontWeight: 700 }}>Balance Due</span>
                  <strong style={{ color: balanceDue > 0 ? '#ef4444' : '#10b981', fontSize: '1.1rem' }}>B$ {balanceDue.toFixed(2)}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Recent purchases mini-log */}
          <div className="glass-panel" style={{ maxHeight: '520px', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingBag size={18} style={{ color: '#c9a84c' }} /> Recent Purchases
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <SkeletonBox w="90px" h="14px" />
                      <SkeletonBox w="50px" h="14px" />
                    </div>
                    <SkeletonBox w="60%" h="13px" />
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <SkeletonBox w="40%" h="12px" />
                      <SkeletonBox w="60px" h="12px" />
                    </div>
                  </div>
                ))
              ) : purchases.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>No purchase records yet.</p>
              ) : (
                purchases.slice(0, 8).map(p => (
                  <div key={p.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <code style={{ fontSize: '0.8rem', color: '#c9a84c', fontWeight: 700 }}>{p.id}</code>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className={`badge ${p.paymentStatus === 'PAID' ? 'badge-success' : p.paymentStatus === 'PARTIAL' ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: '0.7rem' }}>{p.paymentStatus}</span>
                        <button type="button" onClick={() => reprintPurchase(p)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '3px 6px', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}><Printer size={11} /></button>
                        <button type="button" onClick={() => openEditModal(p)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '3px 6px', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}><Pencil size={11} /></button>
                      </div>
                    </div>
                    <p style={{ fontWeight: 650, color: '#fff', fontSize: '0.85rem', marginBottom: '4px' }}>{p.type === 'VEHICLE' ? [p.vehicleBrand, p.vehicleModel].filter(Boolean).join(' ') || p.vehicleModel : p.lotName}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: '#64748b' }}>
                      <span>{p.supplier?.name}</span>
                      <strong style={{ color: '#e2e8f0' }}>B$ {p.agreedPrice.toFixed(2)}</strong>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════ EDIT PURCHASE MODAL ══════════════ */}
      {editingPurchase && (
        <div className="overlay" onClick={() => setEditingPurchase(null)}>
          <div className="modal-content" style={{ maxWidth: '700px' }} onClick={e => e.stopPropagation()}>
            <div className="flex-between" style={{ marginBottom: '20px', position: 'sticky', top: 0, background: '#0e0c09', zIndex: 1, paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h2 className="modal-title" style={{ margin: 0 }}>
                Edit Purchase — <code style={{ color: '#c9a84c' }}>{editingPurchase.id}</code>
              </h2>
              <button type="button" style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }} onClick={() => setEditingPurchase(null)}><X size={20} /></button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="form-grid">
                <div className="col-6 form-group">
                  <label>Pickup Location</label>
                  <input type="text" className="form-input" value={editPickupLocation} onChange={(e) => setEditPickupLocation(e.target.value)} required />
                </div>
                <div className="col-6 form-group">
                  <label>Notes / Reference</label>
                  <input type="text" className="form-input" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
                </div>
                <div className="col-6 form-group">
                  <label>Collection Date</label>
                  <input type="date" className="form-input" value={editCollectionDate} onChange={(e) => setEditCollectionDate(e.target.value)} />
                </div>
                <div className="col-6 form-group">
                  <label>Driver / Contact</label>
                  <input type="text" className="form-input" value={editDriverName} onChange={(e) => setEditDriverName(e.target.value)} />
                </div>

                {/* Collection method cards — edit modal */}
                <div className="col-12 form-group">
                  <label>Collection Method</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                    {LOGISTICS_OPTIONS.map(opt => (
                      <button key={opt.value} type="button" onClick={() => setEditLogisticsMethod(opt.value)}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '10px 6px', borderRadius: '10px', cursor: 'pointer', border: editLogisticsMethod === opt.value ? '2px solid #c9a84c' : '1px solid rgba(255,255,255,0.08)', background: editLogisticsMethod === opt.value ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.02)', color: editLogisticsMethod === opt.value ? '#e8d5a3' : '#64748b', transition: 'all 0.15s ease', fontSize: '0.75rem', fontWeight: 700, textAlign: 'center' }}>
                        <span style={{ color: editLogisticsMethod === opt.value ? '#c9a84c' : '#64748b' }}>{opt.icon}</span>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {(editLogisticsMethod === 'HIRED_TOW_TRUCK' || editLogisticsMethod === 'HIRED_LORRY') && (
                  <>
                    <div className="col-6 form-group">
                      <label>Towing Company</label>
                      <input list="transporter-list" className="form-input" placeholder="Type company name..." value={editTransportCompanyId} onChange={e => {
                        setEditTransportCompanyId(e.target.value);
                      }} />
                    </div>
                    <div className="col-6 form-group">
                      <label>Trip Fee (BND)</label>
                      <input type="number" className="form-input" value={editTransportTripFee} onChange={(e) => setEditTransportTripFee(e.target.value)} />
                    </div>
                  </>
                )}

                <div className="col-6 form-group">
                  <label>Advance Paid (BND)</label>
                  <input type="number" className="form-input" value={editAdvancePaid} onChange={(e) => setEditAdvancePaid(e.target.value)} />
                </div>

                {/* Payment status inline buttons */}
                <div className="col-6 form-group">
                  <label>Payment Status</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {([
                      { value: 'PAID',    label: 'Paid',    color: '#10b981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.35)' },
                      { value: 'PARTIAL', label: 'Partial', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)' },
                      { value: 'UNPAID',  label: 'Pending', color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.35)' },
                    ] as const).map(opt => (
                      <button key={opt.value} type="button" onClick={() => setEditPaymentStatus(opt.value)}
                        style={{ flex: 1, padding: '9px 6px', borderRadius: '9px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', border: editPaymentStatus === opt.value ? `2px solid ${opt.border}` : '1px solid rgba(255,255,255,0.08)', background: editPaymentStatus === opt.value ? opt.bg : 'rgba(255,255,255,0.02)', color: editPaymentStatus === opt.value ? opt.color : '#64748b', transition: 'all 0.15s ease' }}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="col-6 form-group">
                  <label>Payment Method</label>
                  <CustomSelect value={editPaymentMethod} onChange={(v) => setEditPaymentMethod(v as PaymentMethod)} options={[{ value: 'CASH', label: 'Cash' }, { value: 'BANK_TRANSFER', label: 'Bank Transfer' }]} required />
                </div>

                {editingPurchase.type === 'VEHICLE' && (
                  <>
                    <div className="col-4 form-group">
                      <label>Vehicle Brand</label>
                      <input type="text" className="form-input" value={editVehicleBrand} onChange={(e) => setEditVehicleBrand(e.target.value)} />
                    </div>
                    <div className="col-4 form-group">
                      <label>Vehicle Model</label>
                      <input type="text" className="form-input" value={editVehicleModel} onChange={(e) => setEditVehicleModel(e.target.value)} />
                    </div>
                    <div className="col-12 form-group">
                      <label>Component Checklist</label>
                      <Checklist items={editComponentChecklist} onChange={setEditComponentChecklist} />
                    </div>

                    <div className="col-4 form-group">
                      <label>Alloy Wheels Count</label>
                      <input type="number" className="form-input" min={0} max={8} value={editAlloyWheelsCount} onChange={e => setEditAlloyWheelsCount(parseInt(e.target.value) || 0)} />
                    </div>

                    <div className="col-12 form-group">
                      <label>Other Info</label>
                      <textarea className="form-textarea" rows={2} value={editOtherInfo} onChange={(e) => setEditOtherInfo(e.target.value)} />
                    </div>
                  </>
                )}

                {(editingPurchase.type === 'MIXED_SCRAP' || editingPurchase.type === 'LOOSE_SCRAP') && (
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
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn-outline" onClick={() => setEditingPurchase(null)}>Cancel</button>
                <button type="submit" className="btn-primary"><Save size={16} /> Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════ EDIT SUPPLIER MODAL ══════════════ */}
      {editingSupplier && (
        <div className="overlay" onClick={() => setEditingSupplier(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
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
                <label>ICE Number</label>
                <input type="text" className="form-input" placeholder="e.g. ICE-12345" value={editSupIce} onChange={(e) => setEditSupIce(e.target.value)} />
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

      {/* ══════════════ NEW SUPPLIER MODAL ══════════════ */}
      {showSupplierModal && (
        <div className="overlay" onClick={() => setShowSupplierModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex-between" style={{ marginBottom: '20px' }}>
              <h2 className="modal-title" style={{ margin: 0 }}>Register New Supplier Card</h2>
              <button type="button" style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }} onClick={() => setShowSupplierModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateSupplier} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>Company / Supplier Name</label>
                <input type="text" className="form-input" placeholder="e.g. Syarikat Maju Recyclers" value={newSupName} onChange={(e) => setNewSupName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Contact Phone Number</label>
                <input type="text" className="form-input" placeholder="e.g. +673 8812345" value={newSupContact} onChange={(e) => setNewSupContact(e.target.value)} />
              </div>
              <div className="form-group">
                <label>ICE Number</label>
                <input type="text" className="form-input" placeholder="e.g. ICE-12345" value={newSupIce} onChange={(e) => setNewSupIce(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Outstanding Advance (BND)</label>
                <input type="number" className="form-input" placeholder="0.00" value={newSupAdvance} onChange={(e) => setNewSupAdvance(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-outline" onClick={() => setShowSupplierModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create Card</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
