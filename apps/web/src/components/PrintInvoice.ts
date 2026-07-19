export interface PrintPurchaseData {
  id: string;
  date: string;
  supplierName: string;
  supplierContact?: string;
  pickupLocation: string;
  notes?: string;
  type: string;
  // Vehicle
  vehicleBrand?: string;
  vehicleModel?: string;
  registrationNo?: string;
  otherInfo?: string;
  alloyWheelsCount?: number;
  checklist?: { label: string; checked: boolean }[];
  // Scrap
  lotName?: string;
  scrapDescription?: string;
  grossTonnageEstimate?: number;
  lineItems?: { material: string; qty: string; unit: string; rate: string }[];
  // Logistics
  logisticsMethod: string;
  collectionDate?: string;
  driverName?: string;
  transportCompanyName?: string;
  transportTripFee?: number;
  // Payment
  agreedPrice: number;
  advancePaid: number;
  advanceDeduction: number;
  balanceDue: number;
  paymentStatus: string;
  paymentMethod: string;
}

const LOGISTICS_LABEL: Record<string, string> = {
  OUR_TOW_TRUCK: 'Our Tow Truck',
  OUR_LORRY: 'Our Lorry',
  HIRED_TOW_TRUCK: 'Hired Tow Truck',
  HIRED_LORRY: 'Hired Lorry',
  SUPPLIER_DELIVERED: 'Supplier Drop-off',
};

export function printPurchaseInvoice(data: PrintPurchaseData) {
  const isHired = data.logisticsMethod === 'HIRED_TOW_TRUCK' || data.logisticsMethod === 'HIRED_LORRY';
  const statusColor = data.paymentStatus === 'PAID' ? '#16a34a' : data.paymentStatus === 'PARTIAL' ? '#d97706' : '#dc2626';
  const statusBg   = data.paymentStatus === 'PAID' ? '#dcfce7' : data.paymentStatus === 'PARTIAL' ? '#fef3c7' : '#fee2e2';

  const checklistHtml = data.checklist && data.type === 'VEHICLE'
    ? `<div class="section">
        <div class="section-title">Component Checklist</div>
        <div class="checklist-grid">
          ${data.checklist.map(i => `
            <div class="check-item ${i.checked ? 'present' : 'missing'}">
              <span class="check-icon">${i.checked ? '✓' : '✗'}</span>
              ${i.label}
            </div>`).join('')}
          ${data.alloyWheelsCount !== undefined ? `
            <div class="check-item present">
              <span class="check-icon">✓</span>
              Alloy Wheels ×${data.alloyWheelsCount}
            </div>` : ''}
        </div>
      </div>`
    : '';

  const lineItemsHtml = data.lineItems && data.lineItems.length > 0
    ? `<div class="section">
        <div class="section-title">Materials Breakdown</div>
        <table class="items-table">
          <thead><tr><th>Material</th><th>Qty</th><th>Unit</th><th>Rate (B$)</th><th>Amount (B$)</th></tr></thead>
          <tbody>
            ${data.lineItems.map(li => {
              const amt = (parseFloat(li.qty) || 0) * (parseFloat(li.rate) || 0);
              return `<tr><td>${li.material}</td><td>${li.qty}</td><td>${li.unit}</td><td>${parseFloat(li.rate).toFixed(2)}</td><td><strong>${amt.toFixed(2)}</strong></td></tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Purchase Invoice — ${data.id}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #1a1a1a; background: #fff; padding: 32px; }
  .invoice-wrap { max-width: 780px; margin: 0 auto; }

  /* Header */
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 2px solid #1a1a1a; }
  .company-name { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
  .company-sub { font-size: 11px; color: #666; margin-top: 3px; }
  .invoice-meta { text-align: right; }
  .invoice-id { font-size: 20px; font-weight: 800; color: #92400e; letter-spacing: 0.5px; }
  .invoice-date { font-size: 11px; color: #666; margin-top: 4px; }
  .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 6px; background: ${statusBg}; color: ${statusColor}; border: 1px solid ${statusColor}40; }

  /* Two-col info */
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
  .info-box { background: #f8f7f4; border: 1px solid #e5e0d5; border-radius: 8px; padding: 14px 16px; }
  .info-box-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #92400e; margin-bottom: 8px; }
  .info-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 12px; }
  .info-label { color: #666; }
  .info-value { font-weight: 600; color: #1a1a1a; text-align: right; max-width: 55%; }

  /* Sections */
  .section { margin-bottom: 18px; }
  .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #92400e; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #e5e0d5; }

  /* Checklist */
  .checklist-grid { display: flex; flex-wrap: wrap; gap: 6px; }
  .check-item { display: flex; align-items: center; gap: 5px; padding: 5px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; }
  .check-item.present { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
  .check-item.missing  { background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; }
  .check-icon { font-weight: 800; font-size: 12px; }

  /* Line items table */
  .items-table { width: 100%; border-collapse: collapse; font-size: 12px; }
  .items-table th { background: #f3f0ea; padding: 8px 10px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #666; border-bottom: 1px solid #e5e0d5; }
  .items-table td { padding: 8px 10px; border-bottom: 1px solid #f0ece4; }
  .items-table tr:last-child td { border-bottom: none; }

  /* Payment summary */
  .payment-box { background: #f8f7f4; border: 1px solid #e5e0d5; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
  .pay-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 12px; border-bottom: 1px solid #ede9e0; }
  .pay-row:last-child { border-bottom: none; }
  .pay-row.total { font-size: 15px; font-weight: 800; padding-top: 10px; margin-top: 4px; }
  .pay-row.total .pay-val { color: ${data.balanceDue > 0 ? '#dc2626' : '#16a34a'}; }

  /* Signature */
  .sig-row { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e0d5; }
  .sig-box { text-align: center; }
  .sig-line { border-top: 1px solid #1a1a1a; margin-bottom: 6px; margin-top: 40px; }
  .sig-label { font-size: 11px; color: #666; }

  /* Footer */
  .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e5e0d5; text-align: center; font-size: 10px; color: #999; }

  @media print {
    body { padding: 16px; }
    @page { margin: 12mm; size: A4; }
  }
</style>
</head>
<body>
<div class="invoice-wrap">

  <!-- Header -->
  <div class="header">
    <div>
      <div class="company-name">Scrap Management CRM</div>
      <div class="company-sub">Inbound Purchase Invoice</div>
    </div>
    <div class="invoice-meta">
      <div class="invoice-id">${data.id}</div>
      <div class="invoice-date">Date: ${new Date(data.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
      <div><span class="status-badge">${data.paymentStatus}</span></div>
    </div>
  </div>

  <!-- Supplier + Logistics info -->
  <div class="info-grid">
    <div class="info-box">
      <div class="info-box-title">Supplier Details</div>
      <div class="info-row"><span class="info-label">Name</span><span class="info-value">${data.supplierName}</span></div>
      ${data.supplierContact ? `<div class="info-row"><span class="info-label">Contact</span><span class="info-value">${data.supplierContact}</span></div>` : ''}
      <div class="info-row"><span class="info-label">Pickup Location</span><span class="info-value">${data.pickupLocation}</span></div>
      ${data.notes ? `<div class="info-row"><span class="info-label">Notes</span><span class="info-value">${data.notes}</span></div>` : ''}
    </div>
    <div class="info-box">
      <div class="info-box-title">Logistics & Collection</div>
      <div class="info-row"><span class="info-label">Method</span><span class="info-value">${LOGISTICS_LABEL[data.logisticsMethod] ?? data.logisticsMethod}</span></div>
      ${data.collectionDate ? `<div class="info-row"><span class="info-label">Collection Date</span><span class="info-value">${new Date(data.collectionDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div>` : ''}
      ${data.driverName ? `<div class="info-row"><span class="info-label">Driver / Crew</span><span class="info-value">${data.driverName}</span></div>` : ''}
      ${isHired && data.transportCompanyName ? `<div class="info-row"><span class="info-label">Towing Co.</span><span class="info-value">${data.transportCompanyName}</span></div>` : ''}
      ${isHired && data.transportTripFee ? `<div class="info-row"><span class="info-label">Trip Fee</span><span class="info-value">B$ ${data.transportTripFee.toFixed(2)}</span></div>` : ''}
    </div>
  </div>

  <!-- Vehicle / Scrap details -->
  ${data.type === 'VEHICLE' ? `
  <div class="section">
    <div class="section-title">Vehicle Details</div>
    <div class="info-grid" style="margin-bottom:0">
      <div class="info-box">
        <div class="info-row"><span class="info-label">Brand</span><span class="info-value">${data.vehicleBrand || '—'}</span></div>
        <div class="info-row"><span class="info-label">Model</span><span class="info-value">${data.vehicleModel || '—'}</span></div>
        <div class="info-row"><span class="info-label">Reg. No.</span><span class="info-value">${data.registrationNo || '—'}</span></div>
      </div>
      <div class="info-box">
        ${data.otherInfo ? `<div class="info-row"><span class="info-label">Condition Notes</span><span class="info-value">${data.otherInfo}</span></div>` : ''}
        <div class="info-row"><span class="info-label">Alloy Wheels</span><span class="info-value">${data.alloyWheelsCount ?? 0}</span></div>
      </div>
    </div>
  </div>` : ''}

  ${data.type !== 'VEHICLE' && (data.lotName || data.scrapDescription) ? `
  <div class="section">
    <div class="section-title">Scrap / Lot Details</div>
    <div class="info-box">
      ${data.lotName ? `<div class="info-row"><span class="info-label">Lot Name</span><span class="info-value">${data.lotName}</span></div>` : ''}
      ${data.grossTonnageEstimate ? `<div class="info-row"><span class="info-label">Est. Tonnage</span><span class="info-value">${data.grossTonnageEstimate} KG</span></div>` : ''}
      ${data.scrapDescription ? `<div class="info-row"><span class="info-label">Description</span><span class="info-value">${data.scrapDescription}</span></div>` : ''}
    </div>
  </div>` : ''}

  ${checklistHtml}
  ${lineItemsHtml}

  <!-- Payment Summary -->
  <div class="section">
    <div class="section-title">Payment Summary</div>
    <div class="payment-box">
      <div class="pay-row"><span>Agreed Price</span><span class="pay-val">B$ ${data.agreedPrice.toFixed(2)}</span></div>
      ${data.advancePaid > 0 ? `<div class="pay-row"><span>Advance Paid</span><span class="pay-val" style="color:#d97706">− B$ ${data.advancePaid.toFixed(2)}</span></div>` : ''}
      ${data.advanceDeduction > 0 ? `<div class="pay-row"><span>Advance Deduction</span><span class="pay-val" style="color:#d97706">− B$ ${data.advanceDeduction.toFixed(2)}</span></div>` : ''}
      <div class="pay-row"><span>Payment Method</span><span class="pay-val">${data.paymentMethod === 'CASH' ? 'Cash' : 'Bank Transfer'}</span></div>
      <div class="pay-row total"><span>Balance Due</span><span class="pay-val">B$ ${data.balanceDue.toFixed(2)}</span></div>
    </div>
  </div>

  <!-- Signatures -->
  <div class="sig-row">
    <div class="sig-box">
      <div class="sig-line"></div>
      <div class="sig-label">Supplier Signature &amp; Date</div>
    </div>
    <div class="sig-box">
      <div class="sig-line"></div>
      <div class="sig-label">Authorised by (Company)</div>
    </div>
  </div>

  <div class="footer">This is a computer-generated purchase invoice. Printed on ${new Date().toLocaleString('en-GB')}.</div>
</div>
<script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=900,height=700');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
