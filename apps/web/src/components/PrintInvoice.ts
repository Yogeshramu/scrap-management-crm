export interface PrintPurchaseItem {
  no?: number;
  description: string;
  registrationNo?: string;
  amount: number;
}

export interface PrintPurchaseData {
  id: string;
  date: string;
  supplierName: string;
  supplierContact?: string;
  supplierIce?: string;
  pickupLocation?: string;
  notes?: string;
  type?: string;
  items?: PrintPurchaseItem[];
  // Vehicle fields
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
  logisticsMethod?: string;
  collectionDate?: string;
  driverName?: string;
  transportCompanyName?: string;
  transportTripFee?: number;
  // Payment
  agreedPrice: number;
  advancePaid?: number;
  advanceDeduction?: number;
  balanceDue?: number;
  paymentStatus: string;
  paymentMethod: string;
}

export function printPurchaseInvoice(data: PrintPurchaseData) {
  const issueDateStr = new Date(data.date || Date.now()).toLocaleDateString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }).replace(/\//g, ' / ');

  const COMPANY_NAME    = 'NUR & AFIQ ENTERPRISE';
  const COMPANY_ADDRESS = 'Unit No.12, Grd Flr, Block A Lot No.7099\nKg Junjongan, Negara Brunei Darussalam';
  const COMPANY_PHONE   = '+673 8620115';

  const sellerName    = data.supplierName || '—';
  const sellerContact = data.supplierContact || '—';
  const sellerIce = data.supplierIce || null;
  const sellerAddress = data.pickupLocation || '—';

  const isPaid    = data.paymentStatus === 'PAID';
  const isPartial = data.paymentStatus === 'PARTIAL';
  const statusLabel = isPaid ? 'PAID IN FULL' : isPartial ? 'PARTIAL PAYMENT' : 'UNPAID';
  const statusColor = isPaid ? '#16a34a' : isPartial ? '#d97706' : '#dc2626';
  const statusBg    = isPaid ? '#dcfce7'  : isPartial ? '#fef3c7'  : '#fee2e2';
  const methodDisplay = data.paymentMethod === 'BANK_TRANSFER' ? 'Bank Transfer' : 'Cash';

  // ── Build table rows ──────────────────────────────────────────────────────
  let rows = '';
  let subtotal = 0;

  const addRow = (sl: number, desc: string, price: number, qty: number | string, total: number) => {
    subtotal += total;
    rows += `
      <tr>
        <td style="text-align:center;width:48px;color:#374151;font-weight:600;">${sl}</td>
        <td style="color:#111827;font-weight:500;">${desc}</td>
        <td style="text-align:right;color:#111827;">B$${price.toFixed(2)}</td>
        <td style="text-align:center;color:#374151;">${qty}</td>
        <td style="text-align:right;font-weight:700;color:#111827;">B$${total.toFixed(2)}</td>
      </tr>`;
  };

  if (Array.isArray(data.items) && data.items.length > 0) {
    data.items.forEach((item, i) => {
      addRow(item.no ?? i + 1, item.description + (item.registrationNo ? ` <span style="font-size:11px;color:#6b7280;">[${item.registrationNo}]</span>` : ''), item.amount, 1, item.amount);
    });
  } else if (data.lineItems && data.lineItems.length > 0) {
    data.lineItems.forEach((li, i) => {
      const qty   = parseFloat(li.qty) || 0;
      const rate  = parseFloat(li.rate) || 0;
      const total = qty * rate;
      addRow(i + 1, `${li.material} <span style="font-size:11px;color:#6b7280;">(${li.unit})</span>`, rate, qty, total);
    });
  } else {
    const desc = data.type === 'VEHICLE'
      ? `${data.vehicleBrand || ''} ${data.vehicleModel || ''}`.trim() || 'Motor Vehicle'
      : (data.lotName || data.scrapDescription || 'Scrap Material');
    const regSuffix = data.registrationNo ? ` <span style="font-size:11px;color:#6b7280;">[${data.registrationNo}]</span>` : '';
    addRow(1, desc + regSuffix, data.agreedPrice, 1, data.agreedPrice);
  }

  const displayTotal   = data.agreedPrice || subtotal;
  const advancePaid    = data.advancePaid    || 0;
  const advanceDeduct  = data.advanceDeduction || 0;
  const balanceDue     = data.balanceDue ?? Math.max(0, displayTotal - advancePaid - advanceDeduct);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Invoice — ${data.id}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{
    font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
    background:#fff;color:#111827;font-size:13px;line-height:1.5;
    -webkit-print-color-adjust:exact;print-color-adjust:exact;
  }
  .page{max-width:794px;margin:0 auto;padding:0;}

  /* ── Top yellow bar ── */
  .bar-top{height:10px;background:#f5c518;width:100%;}

  /* ── Inner content ── */
  .inner{padding:32px 40px 0 40px;}

  /* ── Logo row ── */
  .logo-row{display:flex;align-items:center;gap:12px;margin-bottom:24px;}
  .logo-diamond{
    width:40px;height:40px;background:#1e293b;border-radius:8px;
    display:flex;align-items:center;justify-content:center;
    color:#f5c518;font-weight:800;font-size:18px;flex-shrink:0;
  }
  .logo-text-main{font-size:17px;font-weight:800;color:#1e293b;line-height:1.1;}
  .logo-text-sub{font-size:9px;font-weight:600;color:#6b7280;letter-spacing:1.5px;text-transform:uppercase;}

  /* ── Yellow divider row with INVOICE title ── */
  .title-bar{
    display:flex;align-items:stretch;margin-bottom:28px;
  }
  .title-bar-yellow{flex:1;background:#f5c518;height:14px;align-self:center;}
  .title-bar-text{
    font-size:36px;font-weight:800;color:#1e293b;letter-spacing:-1px;
    padding:0 16px;line-height:1;
  }
  .title-bar-square{width:14px;height:14px;background:#f5c518;align-self:center;}

  /* ── Party + meta row ── */
  .party-meta{display:flex;justify-content:space-between;margin-bottom:28px;gap:24px;}
  .invoice-to-label{font-size:13px;font-weight:700;color:#1e293b;margin-bottom:4px;}
  .invoice-to-name{font-size:14px;font-weight:800;color:#1e293b;margin-bottom:2px;}
  .invoice-to-body{font-size:11px;color:#4b5563;line-height:1.7;white-space:pre-line;}
  .meta-table{font-size:12px;color:#374151;border-collapse:collapse;}
  .meta-table td{padding:3px 0;}
  .meta-table .ml{font-weight:600;color:#374151;padding-right:24px;}
  .meta-table .mv{font-weight:700;color:#1e293b;text-align:right;}

  /* ── Items table ── */
  .table-wrap{border:1px solid #d1d5db;border-radius:4px;overflow:hidden;margin-bottom:24px;}
  .bill-table{width:100%;border-collapse:collapse;}
  .bill-table thead tr{background:#1e293b;}
  .bill-table thead th{
    color:#fff;padding:11px 14px;font-size:11px;font-weight:700;
    letter-spacing:0.5px;text-transform:uppercase;text-align:left;
  }
  .bill-table thead th:first-child{text-align:center;}
  .bill-table thead th:nth-child(3),.bill-table thead th:nth-child(5){text-align:right;}
  .bill-table thead th:nth-child(4){text-align:center;}
  .bill-table tbody tr{border-bottom:1px solid #f3f4f6;}
  .bill-table tbody tr:last-child{border-bottom:none;}
  .bill-table tbody td{padding:13px 14px;vertical-align:middle;}

  /* ── Bottom section ── */
  .bottom{display:flex;justify-content:space-between;align-items:flex-start;padding:0 40px;margin-bottom:0;}
  .bottom-left{max-width:320px;}
  .thank-you{font-size:13px;font-weight:700;color:#1e293b;margin-bottom:14px;}
  .tc-label{font-size:11px;font-weight:700;color:#1e293b;margin-bottom:4px;}
  .tc-body{font-size:10px;color:#6b7280;line-height:1.6;margin-bottom:14px;}
  .pi-label{font-size:11px;font-weight:700;color:#1e293b;margin-bottom:4px;}

  .totals-block{min-width:240px;}
  .totals-row{display:flex;justify-content:space-between;font-size:12px;color:#374151;padding:5px 0;border-bottom:1px solid #f3f4f6;}
  .totals-row .tl{font-weight:500;}
  .totals-row .tv{font-weight:600;color:#1e293b;}
  .total-final{
    display:flex;justify-content:space-between;align-items:center;
    background:#f5c518;padding:10px 14px;border-radius:4px;margin-top:8px;
  }
  .total-final .tfl{font-size:14px;font-weight:800;color:#1e293b;}
  .total-final .tfv{font-size:16px;font-weight:800;color:#1e293b;}

  /* ── Yellow bottom bar + footer ── */
  .footer-bar{
    display:flex;justify-content:space-between;align-items:flex-end;
    padding:28px 40px 0 40px;margin-top:28px;
  }
  .footer-bar-yellow-left{flex:1;height:6px;background:#f5c518;align-self:flex-end;margin-bottom:18px;}
  .sig-block{text-align:center;padding:0 24px;}
  .sig-line{border-top:1px solid #9ca3af;margin-bottom:6px;width:160px;margin-left:auto;margin-right:auto;}
  .sig-label{font-size:10px;font-weight:700;color:#1e293b;text-transform:uppercase;letter-spacing:0.5px;}
  .footer-bar-yellow-right{width:24px;height:6px;background:#f5c518;align-self:flex-end;margin-bottom:18px;}

  .footer-contact{
    display:flex;justify-content:space-between;align-items:center;
    padding:10px 40px 20px 40px;font-size:10px;color:#6b7280;font-weight:500;
  }
  .footer-contact span{display:inline-flex;align-items:center;gap:6px;}
  .footer-sep{color:#d1d5db;}

  .status-badge{
    display:inline-block;padding:2px 10px;border-radius:20px;
    font-size:10px;font-weight:700;letter-spacing:0.5px;
    background:${statusBg};color:${statusColor};
    border:1px solid ${statusColor}33;
  }

  @media print{
    body{background:#fff;}
    .page{max-width:100%;}
    @page{size:A4;margin:8mm;}
  }
</style>
</head>
<body>
<div class="page">

  <div class="bar-top"></div>

  <div class="inner">

    <!-- Logo -->
    <div class="logo-row">
      <div class="logo-diamond">N</div>
      <div>
        <div class="logo-text-main">${COMPANY_NAME}</div>
        <div class="logo-text-sub">Scrap Metal &amp; Recycling Enterprise</div>
      </div>
    </div>

    <!-- INVOICE title bar -->
    <div class="title-bar">
      <div class="title-bar-yellow"></div>
      <div class="title-bar-text">INVOICE</div>
      <div class="title-bar-square"></div>
    </div>

    <!-- Party + Meta -->
    <div class="party-meta">
      <div>
        <div class="invoice-to-label">Invoice to:</div>
        <div class="invoice-to-name">${sellerName}</div>
        <div class="invoice-to-body">${sellerAddress}\nContact: ${sellerContact}${sellerIce ? `\nICE No: ${sellerIce}` : ''}</div>
      </div>
      <div>
        <table class="meta-table">
          <tr><td class="ml">Invoice #</td><td class="mv">${data.id}</td></tr>
          <tr><td class="ml">Date</td><td class="mv">${issueDateStr}</td></tr>
          <tr><td class="ml">Status</td><td class="mv"><span class="status-badge">${statusLabel}</span></td></tr>
          <tr><td class="ml">Method</td><td class="mv">${methodDisplay}</td></tr>
        </table>
      </div>
    </div>

    <!-- Items Table -->
    <div class="table-wrap">
      <table class="bill-table">
        <thead>
          <tr>
            <th style="width:48px;text-align:center;">SL.</th>
            <th>Item Description</th>
            <th style="text-align:right;">Price</th>
            <th style="text-align:center;">Qty.</th>
            <th style="text-align:right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>

  </div><!-- /inner -->

  <!-- Bottom section -->
  <div class="bottom">
    <div class="bottom-left">
      <div class="thank-you">Thank you for your business</div>

      <div class="tc-label">Terms &amp; Conditions</div>
      <div class="tc-body">1. All goods sold as-is. No warranty on any scrap or used vehicle.<br>2. Full payment due upon collection. Goods withheld until payment confirmed.<br>3. All sales final. Disputes must be reported within 3 working days.</div>


    </div>

    <div class="totals-block">
      <div class="totals-row"><span class="tl">Sub Total:</span><span class="tv">B$${subtotal.toFixed(2)}</span></div>
      ${advancePaid > 0 ? `<div class="totals-row"><span class="tl">Advance Paid:</span><span class="tv" style="color:#d97706;">− B$${advancePaid.toFixed(2)}</span></div>` : ''}
      ${advanceDeduct > 0 ? `<div class="totals-row"><span class="tl">Advance Deduction:</span><span class="tv" style="color:#d97706;">− B$${advanceDeduct.toFixed(2)}</span></div>` : ''}

      ${balanceDue > 0 && !isPaid ? `<div class="totals-row"><span class="tl">Balance Due:</span><span class="tv" style="color:#dc2626;">B$${balanceDue.toFixed(2)}</span></div>` : ''}
      <div class="total-final">
        <span class="tfl">Total:</span>
        <span class="tfv">B$${displayTotal.toFixed(2)}</span>
      </div>
    </div>
  </div>

  <!-- Footer bar + signature -->
  <div class="footer-bar">
    <div class="footer-bar-yellow-left"></div>
    <div class="sig-block">
      <div class="sig-line"></div>
      <div class="sig-label">Authorised Sign</div>
    </div>
    <div class="footer-bar-yellow-right"></div>
  </div>

  <div class="footer-contact">
    <span>
      <span>${COMPANY_PHONE}</span>
      <span class="footer-sep">|</span>
      <span>${COMPANY_ADDRESS.split('\n')[1]}</span>
      <span class="footer-sep">|</span>
      <span>nur-afiq-recycling.com</span>
    </span>
    <span style="color:#9ca3af;">Generated: ${new Date().toLocaleDateString('en-GB')}</span>
  </div>

</div>

<script>window.onload=()=>window.print();</script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=860,height=900');
  if (win) { win.document.write(html); win.document.close(); }
}
