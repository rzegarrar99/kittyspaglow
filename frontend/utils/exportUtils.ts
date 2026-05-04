import { Order } from '../types';

export const exportToCSV = (filename: string, rows: any[]) => {
  if (!rows || !rows.length) return;
  const separator = ',';
  const keys = Object.keys(rows[0]);
  const csvContent =
    keys.join(separator) +
    '\n' +
    rows.map(row => {
      return keys.map(k => {
        let cell = row[k] === null || row[k] === undefined ? '' : row[k];
        cell = cell instanceof Date ? cell.toLocaleString('es-PE') : cell.toString().replace(/"/g, '""');
        if (cell.search(/("|,|\n)/g) >= 0) {
          cell = `"${cell}"`;
        }
        return cell;
      }).join(separator);
    }).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const printTicket = (order: Order, clientName: string, staffName: string, items: any[], settings: any) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  
   const now = new Date(order.created_at);
  const fecha = now.toLocaleDateString('es-PE', { timeZone: 'America/Lima' });
  const hora = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima' });
  const docNum = `B001-${order.id.slice(-8).toUpperCase()}`;
  const sym = 'S/';

  // Totales para el desglose del pie
  const totalDescuentoAplicado = items.reduce((s: number, i: any) => s + (!i.isGift ? (i.discount || 0) : 0), 0);
  const totalRegalos = items.reduce((s: number, i: any) => s + (i.isGift ? (i.price * i.quantity) : 0), 0);

  // IGV sobre lo cobrado (gifts son S/0)
  const igvRate = (settings.taxRate || 18) / 100;
  const valorVenta = order.total / (1 + igvRate);
  const igv = order.total - valorVenta;

  // Pagos
  const totalPagado = order.payments.reduce((s: number, p: any) => s + p.amount, 0);
  const vuelto = Math.max(0, totalPagado - order.total);
  const totalItems = items.reduce((s: number, i: any) => s + i.quantity, 0);

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Boleta - ${settings.spaName}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Courier New', Courier, monospace;
          font-size: 12px;
          color: #111;
          background: #fff;
          width: 302px;
          margin: 0 auto;
          padding: 16px 10px;
        }
        .center { text-align: center; }
        .right { text-align: right; }
        .bold { font-weight: bold; }
        .spa-name { font-size: 15px; font-weight: bold; letter-spacing: 1px; text-align: center; }
        .sub-info { font-size: 10px; color: #444; text-align: center; line-height: 1.6; }
        .divider { border: none; border-top: 1px dashed #999; margin: 7px 0; }
        .divider-solid { border: none; border-top: 1px solid #333; margin: 7px 0; }
        .doc-type { text-align: center; font-weight: bold; font-size: 12px; border: 1px solid #333; padding: 3px 0; margin: 4px 0; letter-spacing: 0.5px; }
        .doc-num { text-align: center; font-size: 11px; font-weight: bold; margin-bottom: 4px; }
        .info-row { display: flex; justify-content: space-between; margin: 2px 0; font-size: 11px; }
        .info-value { font-weight: bold; text-align: right; }

        /* SECTION LABELS */
        .section-label {
          font-size: 10px;
          font-weight: bold;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin: 6px 0 2px 0;
          color: #555;
          border-left: 3px solid #333;
          padding-left: 5px;
        }
        .section-label.gift { border-left-color: #22c55e; color: #166534; }
        .section-label.discount { border-left-color: #f59e0b; color: #92400e; }

        /* ITEMS TABLE */
        .items-table { width: 100%; border-collapse: collapse; font-size: 11px; margin: 2px 0; }
        .items-table thead tr { border-bottom: 1px solid #555; border-top: 1px solid #555; }
        .items-table th { padding: 3px 2px; font-size: 10px; font-weight: bold; text-align: left; }
        .items-table th.right, .items-table td.right { text-align: right; }
        .items-table td { padding: 3px 2px; vertical-align: top; }
        .item-name { font-size: 11px; }
        .item-code { font-size: 9px; color: #777; vertical-align: top; padding-top: 3px; }
        .item-nota { display: block; font-size: 9px; color: #555; font-style: italic; }
        .tachado { text-decoration: line-through; color: #999; font-size: 10px; }

        /* BADGES inline */
        .badge {
          display: inline-block;
          font-size: 8px;
          font-weight: bold;
          padding: 1px 3px;
          border-radius: 2px;
          vertical-align: middle;
        }
        .badge-gift { background: #fff; color: #000; border: 1px solid #000; }
        .badge-discount { background: #fff; color: #000; border: 1px solid #000; }

        /* Gift row */
        .gift-row td { color: #000; }
        .gift-price { text-decoration: line-through; color: #999; font-size: 10px; }

        /* SUBTOTALES */
        .subtotal-row { display: flex; justify-content: space-between; font-size: 11px; margin: 2px 0; }
        .subtotal-row.desc { color: #000; }
        .subtotal-row.gift { color: #000; }

        /* TOTALS */
        .total-row { display: flex; justify-content: space-between; font-size: 11px; margin: 2px 0; }
        .total-row.grand { font-size: 14px; font-weight: bold; border-top: 1px solid #333; padding-top: 5px; margin-top: 4px; }

        /* PAYMENTS */
        .pay-row { display: flex; justify-content: space-between; font-size: 11px; margin: 2px 0; }
        .pay-row.highlight { font-weight: bold; }

        /* FOOTER */
        .footer { text-align: center; font-size: 10px; color: #555; margin-top: 8px; line-height: 1.7; }
        .footer .thanks { font-weight: bold; color: #000; font-size: 12px; }

        @media print {
          body { padding: 0; }
          @page { margin: 4mm; size: 80mm auto; }
        }
      </style>
    </head>
    <body>

      <!-- CABECERA -->
      <div class="spa-name">${settings.spaName.toUpperCase()}</div>
      <div class="sub-info">
        ${settings.address}<br>
        TEL: ${settings.phone}
      </div>

      <hr class="divider"/>
      <div class="sub-info">R.U.C: ${settings.ruc}</div>
      <div class="doc-type">BOLETA DE VENTA ELECTRÓNICA</div>
      <div class="doc-num">${docNum}</div>
      <hr class="divider"/>

      <!-- DATOS -->
      <div class="info-row"><span>FECHA:</span><span class="info-value">${fecha}</span></div>
      <div class="info-row"><span>HORA:</span><span class="info-value">${hora}</span></div>
      <div class="info-row"><span>CLIENTA:</span><span class="info-value">${clientName.toUpperCase()}</span></div>
      <div class="info-row"><span>ATENDIÓ:</span><span class="info-value">${staffName.toUpperCase()}</span></div>

      <hr class="divider"/>

      <table class="items-table">
        <thead>
          <tr>
            <th style="width:10%">COD.</th>
            <th style="width:34%">DESCRIPCIÓN</th>
            <th class="right" style="width:12%">CANT</th>
            <th class="right" style="width:20%">P.UNIT</th>
            <th class="right" style="width:24%">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item: any) => {
            const codigo = (item.type === 'service' ? 'SRV' : 'PRD') 
              + '-' + (item.id||'').slice(-6).toUpperCase();
            
            const isGift = item.isGift === true;
            const descuento = item.discount || 0;
            const totalFila = isGift 
              ? 0 
              : (item.price * item.quantity) - descuento;
            
            const nota = isGift 
              ? '<span class="item-nota">* CORTESÍA</span>'
              : descuento > 0 
                ? '<span class="item-nota">* Dscto: -S/ ' + descuento.toFixed(2) + '</span>'
                : '';

            return `
              <tr>
                <td class="item-code">${codigo}</td>
                <td>
                  <div class="item-name">${item.name}</div>
                  ${nota}
                </td>
                <td class="right">${item.quantity}</td>
                <td class="right">${item.isGift 
                  ? '<span class="tachado">' + item.price.toFixed(2) + '</span>' 
                  : item.price.toFixed(2)}</td>
                <td class="right bold">${totalFila.toFixed(2)}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <hr class="divider-solid"/>

      <div class="total-row">
        <span>SUBTOTAL:</span>
        <span>${sym} ${(order.total + totalDescuentoAplicado).toFixed(2)}</span>
      </div>
      ${totalDescuentoAplicado > 0 ? `
      <div class="total-row">
        <span>(-) DESCUENTO:</span>
        <span>- ${sym} ${totalDescuentoAplicado.toFixed(2)}</span>
      </div>` : ''}
      ${totalRegalos > 0 ? `
      <div class="total-row">
        <span>CORTESÍA:</span>
        <span>- ${sym} ${totalRegalos.toFixed(2)}</span>
      </div>` : ''}
      <div class="total-row">
        <span>OP. GRAVADA:</span>
        <span>${sym} ${valorVenta.toFixed(2)}</span>
      </div>
      <div class="total-row">
        <span>IGV (${settings.taxRate || 18}%):</span>
        <span>${sym} ${igv.toFixed(2)}</span>
      </div>
      <div class="total-row grand">
        <span>TOTAL:</span>
        <span>${sym} ${order.total.toFixed(2)}</span>
      </div>

      <hr class="divider"/>

      <!-- PAGOS -->
      <div class="pay-row highlight"><span>TOTAL PAGADO:</span><span>${sym} ${totalPagado.toFixed(2)}</span></div>
      ${order.payments.map((p: any) => `
        <div class="pay-row"><span>${p.method.toUpperCase()}:</span><span>${sym} ${p.amount.toFixed(2)}</span></div>
      `).join('')}
      <div class="pay-row"><span>VUELTO:</span><span>${sym} ${vuelto.toFixed(2)}</span></div>
      <div class="pay-row"><span>DESCUENTO:</span><span>${sym} ${totalDescuentoAplicado.toFixed(2)}</span></div>

      <hr class="divider"/>

      <div class="center" style="font-size:10px;font-weight:bold;">
        MÉTODO: ${order.payments.map((p: any) => p.method).join(' + ').toUpperCase()}
      </div>
      <div class="center" style="font-size:10px;margin-top:2px;">
        TOTAL ÍTEMS: ${totalItems} | SESIÓN POS: ${order.id.slice(-6).toUpperCase()}
      </div>

      <hr class="divider"/>

      <!-- FOOTER -->
      <div class="footer">
        <div class="thanks">¡Gracias por tu preferencia! 🎀</div>
        Representación impresa del comprobante electrónico.<br>
      Autorizado por SUNAT — ${settings.spaName} ${new Date().getFullYear()}&lt;br&gt;
        Verifica en: ww1.sunat.gob.pe&lt;br&gt;
        RUC: ${settings.ruc}
      </div>

      <script>window.onload = () => { window.print(); }</script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
