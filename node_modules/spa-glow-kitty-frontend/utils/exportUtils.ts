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
  
  const html = `
    <html>
      <head>
        <title>Ticket de Servicio - ${settings.spaName}</title>
        <style>
          body { font-family: 'Courier New', Courier, monospace; padding: 40px; color: #2D1B2E; text-align: center; max-width: 400px; margin: 0 auto; }
          .header { margin-bottom: 20px; }
          .header h1 { color: #FF2A7A; margin: 0; font-size: 24px; }
          .header p { margin: 5px 0; font-size: 12px; color: #666; }
          .divider { border-top: 1px dashed #ccc; margin: 15px 0; }
          .details { text-align: left; font-size: 14px; margin-bottom: 20px; }
          .items table { border-collapse: collapse; width: 100%; font-size: 14px; }
          .items th, .items td { text-align: left; padding: 5px 0; }
          .items th { border-bottom: 1px solid #ccc; }
          .items td.price { text-align: right; }
          .total { text-align: right; font-size: 18px; font-weight: bold; margin-top: 20px; }
          .payment-method { text-align: right; font-size: 12px; color: #666; margin-top: 10px; }
          .footer { margin-top: 30px; font-size: 12px; color: #FF2A7A; font-style: italic; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎀 ${settings.spaName} 🎀</h1>
          <p>RUC: ${settings.ruc}</p>
          <p>${settings.address}</p>
          <p>Tel: ${settings.phone}</p>
        </div>
        <div class="divider"></div>
        <div class="details">
          <p><strong>Orden:</strong> #${order.id.slice(-6)}</p>
          <p><strong>Fecha:</strong> ${new Date(order.created_at).toLocaleString('es-PE')}</p>
          <p><strong>Clienta:</strong> ${clientName}</p>
          <p><strong>Atendido por:</strong> ${staffName}</p>
        </div>
        <div class="divider"></div>
        <div class="items">
          <table>
            <thead>
              <tr>
                <th>Descripción</th>
                <th style="text-align: right;">Importe</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr>
                  <td>${item.quantity}x ${item.name}</td>
                  <td class="price">${settings.currency.split(' ')[0]} ${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <div class="divider"></div>
        <div class="total">
          TOTAL: ${settings.currency.split(' ')[0]} ${order.total.toFixed(2)}
        </div>
        <div class="payment-method">
          <strong>Pagos:</strong><br/>
          ${order.payments.map(p => `${p.method}: ${settings.currency.split(' ')[0]} ${p.amount.toFixed(2)}`).join('<br/>')}
        </div>
        <div class="footer">
          ¡Gracias por tu preferencia, hermosa! ✨
        </div>
        <script>
          window.onload = () => { window.print(); window.close(); }
        </script>
      </body>
    </html>
  `;
  printWindow.document.write(html);
  printWindow.document.close();
};
