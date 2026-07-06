'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  TrendingUp, 
  Trash2, 
  PlusCircle, 
  Save, 
  Camera, 
  FileText, 
  UserCheck,
  Check,
  Clock,
  AlertTriangle,
  Pencil,
  X
} from 'lucide-react';
import CustomSelect from '../../components/CustomSelect';

interface ProductItem {
  product: string;
  quantity: string;
  unit: string;
  price: string;
}

interface Customer {
  id: number;
  name: string;
  contact: string;
}

interface Sale {
  id: string;
  date: string;
  subtotal: number;
  grandTotal: number;
  paymentStatus: string;
  paymentReceived: number;
  balanceDue: number;
  customerBillPhoto?: string;
  customer: Customer;
  products: {
    id: number;
    product: string;
    quantity: number;
    unit: string;
    price: number;
    amount: number;
  }[];
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  // Invoice form state
  const [customerId, setCustomerId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'PARTIAL' | 'UNPAID'>('PAID');
  const [paymentReceived, setPaymentReceived] = useState('');
  const [customerBillPhoto, setCustomerBillPhoto] = useState('/uploads/sales_invoice_bill.pdf');
  const [products, setProducts] = useState<ProductItem[]>([
    { product: 'Copper Wire', quantity: '100', unit: 'KG', price: '13.00' }
  ]);

  // Status and Modal settings
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustContact, setNewCustContact] = useState('');

  // Edit sale state
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [editSalePaymentStatus, setEditSalePaymentStatus] = useState<'PAID' | 'PARTIAL' | 'UNPAID'>('PAID');
  const [editSalePaymentReceived, setEditSalePaymentReceived] = useState('');

  // Edit customer state
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editCustName, setEditCustName] = useState('');
  const [editCustContact, setEditCustContact] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const custRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sales/customers`);
      setCustomers(await custRes.json());

      const salesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sales`);
      setSales(await salesRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sales/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCustName,
          contact: newCustContact
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create customer');

      setMessage({ type: 'success', text: `Registered customer card for: ${newCustName}` });
      await fetchData();
      setCustomerId(data.id.toString());
      setShowCustomerModal(false);
      
      setNewCustName('');
      setNewCustContact('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const updateProductItem = (index: number, key: keyof ProductItem, val: string) => {
    const nextArr = [...products];
    nextArr[index][key] = val;
    setProducts(nextArr);
  };

  const addProductRow = () => {
    setProducts([...products, { product: 'Steel Scrap', quantity: '500', unit: 'KG', price: '0.45' }]);
  };

  const removeProductRow = (index: number) => {
    if (products.length <= 1) return;
    setProducts(products.filter((_, idx) => idx !== index));
  };

  const openEditSale = (s: Sale) => {
    setEditingSale(s);
    setEditSalePaymentStatus(s.paymentStatus as any);
    setEditSalePaymentReceived(s.paymentReceived.toString());
  };

  const handleEditSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSale) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sales/${editingSale.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: editSalePaymentStatus, paymentReceived: parseFloat(editSalePaymentReceived) || 0 })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update sale');
      setMessage({ type: 'success', text: `Sale ${editingSale.id} updated.` });
      setEditingSale(null);
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const openEditCustomer = (c: Customer) => {
    setEditingCustomer(c);
    setEditCustName(c.name);
    setEditCustContact(c.contact || '');
  };

  const handleEditCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sales/customers/${editingCustomer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editCustName, contact: editCustContact })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update customer');
      setMessage({ type: 'success', text: `Customer ${editCustName} updated.` });
      setEditingCustomer(null);
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || products.length === 0) {
      setMessage({ type: 'error', text: 'Select customer and add at least one line item.' });
      return;
    }

    try {
      const body = {
        customerId: parseInt(customerId),
        paymentStatus,
        paymentReceived: parseFloat(paymentReceived) || 0,
        customerBillPhoto,
        products: products.map(p => ({
          product: p.product,
          quantity: parseFloat(p.quantity) || 0,
          unit: p.unit,
          price: parseFloat(p.price) || 0
        }))
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit sale');

      setMessage({ type: 'success', text: `Invoice generated successfully with reference: ${data.id}` });
      setCustomerId('');
      setPaymentReceived('');
      setProducts([{ product: 'Copper Wire', quantity: '100', unit: 'KG', price: '13.00' }]);
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const calculateSubtotal = () => {
    return products.reduce((sum, item) => {
      const q = parseFloat(item.quantity) || 0;
      const p = parseFloat(item.price) || 0;
      return sum + (q * p);
    }, 0);
  };

  const subtotalVal = calculateSubtotal();
  const balanceVal = paymentStatus === 'PAID' ? 0 : Math.max(0, subtotalVal - (parseFloat(paymentReceived) || 0));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Outbound Wholesale Sales Desk</h1>
          <p className="page-title-desc">Log local distributions, record custom materials weights, and generate export billing references.</p>
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

      <div className="dashboard-layout-main">
        {/* Left: Wholesale Entry Screen */}
        <form onSubmit={handleSaleSubmit} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontSize: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
            New Dispatch Invoice
          </h2>

          <div className="form-grid">
            <div className="col-12 form-group">
              <label>Wholesale Customer Account</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <CustomSelect
                  value={customerId}
                  onChange={setCustomerId}
                  placeholder="-- Select Customer Account --"
                  options={customers.map(c => ({ value: c.id.toString(), label: c.name }))}
                />
                <button type="button" className="btn-outline" onClick={() => setShowCustomerModal(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 14px' }}>
                  <PlusCircle size={18} />
                </button>
                {customerId && (
                  <button type="button" className="btn-outline" onClick={() => { const c = customers.find(x => x.id === parseInt(customerId)); if (c) openEditCustomer(c); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 14px' }}>
                    <Pencil size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Custom product lists */}
            <div className="col-12" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', marginBottom: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', color: '#94a3b8' }}>Custom Materials Rows</label>
              <button 
                type="button" 
                className="btn-outline" 
                onClick={addProductRow}
                style={{ fontSize: '0.8rem', padding: '6px 12.5px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={14} /> Add Row
              </button>
            </div>

            {products.map((item, idx) => (
              <div key={idx} className="col-12" style={{ display: 'flex', gap: '12px', alignItems: 'center', width: '100%' }}>
                <div style={{ flex: 3 }}>
                  <CustomSelect
                    value={item.product}
                    onChange={(v) => updateProductItem(idx, 'product', v)}
                    options={[
                      { value: 'Copper Wire', label: 'Copper Wire (Clean)' },
                      { value: 'Brass Ingots', label: 'Brass Ingots' },
                      { value: 'Heavy Melting Steel', label: 'Heavy Melting Steel' },
                      { value: 'Alloy Scraps', label: 'Alloy Scraps' },
                      { value: 'Lead Acid Battery Block', label: 'Lead Battery Block' },
                    ]}
                    required
                  />
                </div>

                <div style={{ flex: 1.5 }}>
                  <input 
                    type="number"
                    className="form-input"
                    placeholder="Weight"
                    value={item.quantity}
                    onChange={(e) => updateProductItem(idx, 'quantity', e.target.value)}
                    required
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <CustomSelect
                    value={item.unit}
                    onChange={(v) => updateProductItem(idx, 'unit', v)}
                    options={[
                      { value: 'KG', label: 'KG' },
                      { value: 'TON', label: 'TON' },
                    ]}
                    required
                  />
                </div>

                <div style={{ flex: 2 }}>
                  <input 
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder="Rate per Unit"
                    value={item.price}
                    onChange={(e) => updateProductItem(idx, 'price', e.target.value)}
                    required
                  />
                </div>

                {products.length > 1 && (
                  <button 
                    type="button" 
                    className="btn-outline" 
                    onClick={() => removeProductRow(idx)}
                    style={{ padding: '12px', display: 'flex', alignItems: 'center', color: '#ef4444', borderColor: 'rgba(239,68,68,0.15)' }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}

            <div className="col-12" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px', marginTop: '10px' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '16px' }}>Invoice Payments</h3>
            </div>

            <div className="col-4 form-group">
              <label>Settle Status</label>
              <CustomSelect
                value={paymentStatus}
                onChange={(v) => setPaymentStatus(v as any)}
                options={[
                  { value: 'PAID', label: <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Check size={14} style={{ color: '#10b981' }} /> Fully Paid Today</span> },
                  { value: 'PARTIAL', label: <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Clock size={14} style={{ color: '#f59e0b' }} /> Partial Account Deposit</span> },
                  { value: 'UNPAID', label: <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><AlertTriangle size={14} style={{ color: '#ef4444' }} /> Unpaid Account Due</span> },
                ]}
                required
              />
            </div>

            {paymentStatus !== 'PAID' && (
              <div className="col-4 form-group">
                <label>Cash Received (BND)</label>
                <input 
                  type="number"
                  placeholder="0.00"
                  className="form-input"
                  value={paymentReceived}
                  onChange={(e) => setPaymentReceived(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="col-12 form-group">
              <label>Bill Upload visual Record</label>
              <div className="image-preview-box">
                <Camera size={26} />
                <span style={{ fontSize: '0.85rem' }}>Attached Receipt / Customer ID Proof</span>
                <code style={{ fontSize: '0.75rem', color: '#0ea5e9' }}>{customerBillPhoto}</code>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '16px 20px', borderRadius: '12px', marginTop: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Grand Invoice Total</p>
              <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
                B$ {subtotalVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                {paymentStatus !== 'PAID' && <span style={{ fontSize: '0.85rem', color: '#ef4444', marginLeft: '10px' }}>(Balance due: B$ {balanceVal.toLocaleString('en-US', { minimumFractionDigits: 2 })})</span>}
              </p>
            </div>
            
            <button type="submit" className="btn-primary">
              <Save size={18} />
              Publish dispatch Invoice
            </button>
          </div>
        </form>

        {/* Right: Master Sales invoices ledger */}
        <div className="glass-panel" style={{ maxHeight: '900px', overflowY: 'auto' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={20} style={{ color: '#0ea5e9' }} />
            Wholesale Outflow Ledger
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {sales.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '0.9rem' }}>No invoices dispatched yet.</p>
            ) : (
              sales.map(s => (
                <div 
                  key={s.id} 
                  style={{ 
                    padding: '16px', 
                    background: 'rgba(255,255,255,0.02)', 
                    borderRadius: '12px', 
                    border: '1px solid rgba(255,255,255,0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div className="flex-between">
                    <code style={{ fontSize: '0.85rem', color: '#0ea5e9', fontWeight: 700 }}>{s.id}</code>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`badge ${s.paymentStatus === 'PAID' ? 'badge-success' : s.paymentStatus === 'PARTIAL' ? 'badge-warning' : 'badge-danger'}`}>
                        {s.paymentStatus}
                      </span>
                      <button type="button" onClick={() => openEditSale(s)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '4px 8px', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
                        <Pencil size={13} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Customer Account:</p>
                    <p style={{ fontWeight: 650, color: '#fff', fontSize: '0.95rem' }}>{s.customer?.name}</p>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                    <p style={{ fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>Inspected Weight Bundles:</p>
                    {s.products.map(item => (
                      <div key={item.id} className="flex-between" style={{ padding: '2px 0' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><FileText size={12} style={{ opacity: 0.5 }} />{item.product} ({item.quantity} {item.unit})</span>
                        <span>B$ {item.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {new Date(s.date).toLocaleDateString()}
                    </span>
                    <strong style={{ color: '#fff', fontSize: '0.95rem' }}>B$ {s.grandTotal.toFixed(2)}</strong>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Edit Sale Modal */}
      {editingSale && (
        <div className="overlay">
          <div className="modal-content">
            <div className="flex-between" style={{ marginBottom: '20px' }}>
              <h2 className="modal-title" style={{ margin: 0 }}>Edit Sale — <code style={{ color: '#0ea5e9' }}>{editingSale.id}</code></h2>
              <button type="button" style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }} onClick={() => setEditingSale(null)}><X size={20} /></button>
            </div>
            <form onSubmit={handleEditSaleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>Payment Status</label>
                <CustomSelect
                  value={editSalePaymentStatus}
                  onChange={(v) => setEditSalePaymentStatus(v as any)}
                  options={[
                    { value: 'PAID', label: <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Check size={14} style={{ color: '#10b981' }} /> Fully Paid</span> },
                    { value: 'PARTIAL', label: <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Clock size={14} style={{ color: '#f59e0b' }} /> Partial</span> },
                    { value: 'UNPAID', label: <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><AlertTriangle size={14} style={{ color: '#ef4444' }} /> Unpaid</span> },
                  ]}
                  required
                />
              </div>
              {editSalePaymentStatus !== 'PAID' && (
                <div className="form-group">
                  <label>Amount Received (BND)</label>
                  <input type="number" className="form-input" value={editSalePaymentReceived} onChange={(e) => setEditSalePaymentReceived(e.target.value)} />
                </div>
              )}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-outline" onClick={() => setEditingSale(null)}>Cancel</button>
                <button type="submit" className="btn-primary"><Save size={16} /> Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <div className="overlay">
          <div className="modal-content">
            <div className="flex-between" style={{ marginBottom: '20px' }}>
              <h2 className="modal-title" style={{ margin: 0 }}>Edit Customer</h2>
              <button type="button" style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }} onClick={() => setEditingCustomer(null)}><X size={20} /></button>
            </div>
            <form onSubmit={handleEditCustomerSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>Customer Name</label>
                <input type="text" className="form-input" value={editCustName} onChange={(e) => setEditCustName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Contact</label>
                <input type="text" className="form-input" value={editCustContact} onChange={(e) => setEditCustContact(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-outline" onClick={() => setEditingCustomer(null)}>Cancel</button>
                <button type="submit" className="btn-primary"><Save size={16} /> Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Modal Dialog */}
      {showCustomerModal && (
        <div className="overlay">
          <div className="modal-content">
            <h2 className="modal-title">Register New Customer Profile</h2>
            <form onSubmit={handleCreateCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>Company / Customer Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Sheng Hong Steel Corp" 
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Contact Phone / Representative</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. +673 2420912" 
                  value={newCustContact}
                  onChange={(e) => setNewCustContact(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn-outline" onClick={() => setShowCustomerModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
