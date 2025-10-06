import dayjs from '../lib/dayjs';

export interface POExportData {
  purchaseOrders: any[];
  deliveryNotes: any[];
  metadata: {
    title: string;
    generatedAt: string;
    period: string;
    filters?: any;
  };
}

export const exportToExcel = (data: POExportData): void => {
  // Create simple Excel-compatible HTML format
  const style = `
    <style>
      body { 
        font-family: Arial, sans-serif; 
        margin: 20px; 
        color: #000; 
        background: white;
      }
      .header { 
        text-align: center; 
        border-bottom: 2px solid #000; 
        padding-bottom: 15px; 
        margin-bottom: 20px;
      }
      .company-name {
        font-size: 18pt;
        font-weight: bold;
        color: #000;
        margin-bottom: 5px;
      }
      .report-title {
        font-size: 14pt;
        font-weight: bold;
        color: #000;
        margin-bottom: 8px;
      }
      .report-meta {
        font-size: 9pt;
        color: #666;
        margin-bottom: 15px;
      }
      .summary-title {
        font-size: 12pt;
        font-weight: bold;
        color: #000;
        margin-bottom: 10px;
        text-align: center;
      }
      table { 
        width: 100%; 
        border-collapse: collapse; 
        margin: 10px 0;
        font-size: 9pt;
        table-layout: fixed;
      }
      th {
        background-color: #4472C4;
        color: white;
        padding: 8px 4px;
        text-align: center;
        font-weight: bold;
        font-size: 8pt;
        border: 1px solid #000;
      }
      td {
        padding: 6px 4px;
        border: 1px solid #000;
        vertical-align: top;
        font-size: 8pt;
      }
      .summary-table {
        width: 100%;
        border-collapse: collapse;
        margin: 10px 0;
      }
      .summary-table td {
        background-color: #E7E6E6;
        border: 1px solid #000;
        padding: 8px;
        text-align: center;
        font-weight: bold;
      }
      .summary-label {
        font-size: 8pt;
        color: #666;
        font-weight: normal;
      }
      .summary-value {
        font-size: 12pt;
        color: #000;
        font-weight: bold;
      }
      .footer {
        margin-top: 20px;
        padding-top: 10px;
        border-top: 1px solid #000;
        text-align: center;
        font-size: 8pt;
        color: #666;
      }
      @media print {
        body { 
          margin: 0; 
          padding: 10mm; 
          font-size: 8pt;
        }
        table { 
          width: 100% !important; 
          font-size: 7pt !important;
          table-layout: fixed !important;
        }
        th, td { 
          padding: 3px 2px !important; 
          font-size: 7pt !important;
        }
        .summary-table td {
          padding: 5px !important;
          font-size: 8pt !important;
        }
        .summary-value {
          font-size: 10pt !important;
        }
        .summary-label {
          font-size: 7pt !important;
        }
        .header {
          margin-bottom: 15px !important;
        }
        .company-name {
          font-size: 14pt !important;
        }
        .report-title {
          font-size: 12pt !important;
        }
        .report-meta {
          font-size: 8pt !important;
        }
        .footer {
          margin-top: 15px !important;
          font-size: 7pt !important;
        }
      }
    </style>
  `;

  // Calculate summary statistics with error handling
  const totalPOs = data.purchaseOrders ? data.purchaseOrders.length : 0;
  const totalValue = data.purchaseOrders ? data.purchaseOrders.reduce((sum, po) => sum + (po.total_value || 0), 0) : 0;
  const totalTonnage = data.purchaseOrders ? data.purchaseOrders.reduce((sum, po) => sum + (po.total_tonnage || 0), 0) : 0;
  const shippedTonnage = data.purchaseOrders ? data.purchaseOrders.reduce((sum, po) => sum + (po.shipped_tonnage || 0), 0) : 0;
  const completionRate = totalTonnage > 0 ? ((shippedTonnage / totalTonnage) * 100).toFixed(1) : '0';
  
  // Safe metadata handling
  const safePeriod = data.metadata?.period || 'Semua Periode';
  const safeGeneratedAt = data.metadata?.generatedAt || new Date().toISOString();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Laporan Purchase Order - ${dayjs().format('DD MMMM YYYY')}</title>
      ${style}
    </head>
    <body>
      <!-- Company Header -->
      <div class="header">
        <div class="company-name">PT. SAMUDERA BERKAH SENTOSA</div>
        <div class="report-title">LAPORAN PURCHASE ORDER</div>
        <div class="report-meta">
          Periode: ${safePeriod} | Dibuat: ${dayjs(safeGeneratedAt).format('DD MMMM YYYY HH:mm')} | Total Data: ${totalPOs} PO
        </div>
      </div>

      <!-- Summary Section -->
      <div class="summary-title">RINGKASAN EKSEKUTIF</div>
      <table class="summary-table">
        <tr>
          <td width="25%">
            <div class="summary-label">Total PO</div>
            <div class="summary-value">${totalPOs.toLocaleString('id-ID')}</div>
          </td>
          <td width="25%">
            <div class="summary-label">Total Nilai</div>
            <div class="summary-value">Rp ${totalValue.toLocaleString('id-ID')}</div>
          </td>
          <td width="25%">
            <div class="summary-label">Total Tonase</div>
            <div class="summary-value">${(totalTonnage / 1000).toFixed(1)} ton</div>
          </td>
          <td width="25%">
            <div class="summary-label">Tingkat Penyelesaian</div>
            <div class="summary-value">${completionRate}%</div>
          </td>
        </tr>
      </table>

      <!-- Detailed Table -->
      <table>
        <tr>
          <th width="80">No. PO</th>
          <th width="60">Tanggal</th>
          <th width="100">Pembeli</th>
          <th width="40">Produk</th>
          <th width="60">Total (kg)</th>
          <th width="60">Harga/Ton</th>
          <th width="80">Nilai Total</th>
          <th width="60">Terkirim (kg)</th>
          <th width="60">Sisa (kg)</th>
          <th width="50">Progress</th>
          <th width="50">Status</th>
          <th width="60">Batas Waktu</th>
          <th width="30">PPN</th>
          <th width="40">Tarif PPN</th>
          <th width="120">Syarat Pembayaran</th>
          <th width="60">Catatan</th>
        </tr>
        ${(data.purchaseOrders || []).map(po => {
          const progress = po.total_tonnage ? ((po.shipped_tonnage / po.total_tonnage) * 100).toFixed(1) : '0';
          
          // Safe date formatting with error handling
          const formatDate = (date: any) => {
            try {
              return dayjs(date).isValid() ? dayjs(date).format('DD/MM/YY') : '-';
            } catch (e) {
              return '-';
            }
          };
          
          // Safe text sanitization
          const sanitizeText = (text: any) => {
            if (!text) return '-';
            return String(text).replace(/[<>]/g, '').substring(0, 100);
          };
          
          return `
            <tr>
              <td width="80"><strong>${sanitizeText(po.po_number)}</strong></td>
              <td width="60">${formatDate(po.po_date)}</td>
              <td width="100">${sanitizeText(po.buyer_name)}</td>
              <td width="40">${sanitizeText(po.product_type)}</td>
              <td width="60">${(po.total_tonnage || 0).toLocaleString('id-ID')}</td>
              <td width="60">${(po.price_per_ton || 0).toLocaleString('id-ID')}</td>
              <td width="80">${(po.total_value || 0).toLocaleString('id-ID')}</td>
              <td width="60">${(po.shipped_tonnage || 0).toLocaleString('id-ID')}</td>
              <td width="60">${(po.remaining_tonnage || 0).toLocaleString('id-ID')}</td>
              <td width="50">${progress}%</td>
              <td width="50">${sanitizeText(po.status)}</td>
              <td width="60">${formatDate(po.delivery_deadline)}</td>
              <td width="30">${po.ppn_enabled ? 'Ya' : 'Tidak'}</td>
              <td width="40">${po.ppn_rate ? (po.ppn_rate * 100).toFixed(1) : '0'}</td>
              <td width="120">${sanitizeText(po.payment_terms)}</td>
              <td width="60">${sanitizeText(po.notes)}</td>
            </tr>
          `;
        }).join('') || '<tr><td colspan="16" style="text-align: center; padding: 20px; color: #666;">Tidak ada data Purchase Order untuk periode ini</td></tr>'}
      </table>

      <!-- Footer -->
      <div class="footer">
        <p><strong>Sistem Manajemen Purchase Order - PT. SAMUDERA BERKAH SENTOSA</strong></p>
        <p>Laporan dibuat otomatis pada ${dayjs().format('DD MMMM YYYY HH:mm')}</p>
        <p>Confidential & Proprietary - Dokumen ini hanya untuk penggunaan internal perusahaan</p>
      </div>
      
      <!-- Print Instructions -->
      <div style="position: fixed; top: 10px; right: 10px; background: #f0f0f0; padding: 10px; border: 1px solid #ccc; border-radius: 5px; font-size: 10pt; z-index: 1000;">
        <strong>Instruksi:</strong><br>
        1. Tekan Ctrl+P untuk print<br>
        2. Pilih "Save as PDF"<br>
        3. Pastikan "More settings" → "Margins" = "Minimum"<br>
        4. Pastikan "More settings" → "Scale" = "Fit to page"
      </div>
      
      <script>
        // Auto-optimize for print
        window.addEventListener('beforeprint', function() {
          // Inject print-specific styles
          const printStyle = document.createElement('style');
          printStyle.textContent = \`
            @media print {
              body { margin: 0 !important; padding: 5mm !important; }
              table { width: 100% !important; font-size: 6pt !important; }
              th, td { padding: 2px 1px !important; font-size: 6pt !important; }
              .summary-table td { padding: 3px !important; font-size: 7pt !important; }
              .summary-value { font-size: 9pt !important; }
              .summary-label { font-size: 6pt !important; }
              .header { margin-bottom: 10px !important; }
              .company-name { font-size: 12pt !important; }
              .report-title { font-size: 10pt !important; }
              .report-meta { font-size: 7pt !important; }
              .footer { margin-top: 10px !important; font-size: 6pt !important; }
            }
          \`;
          document.head.appendChild(printStyle);
        });
        
        // Auto-trigger print dialog after a short delay
        setTimeout(function() {
          window.print();
        }, 500);
      </script>
    </body>
    </html>
  `;

  // Create and download Excel file with error handling
  try {
    const blob = new Blob([htmlContent], { 
      type: 'application/vnd.ms-excel;charset=utf-8' 
    });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `laporan-po-${dayjs().format('YYYYMMDD-HHmm')}.xls`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
    
    console.log('✅ Excel file downloaded successfully');
  } catch (error) {
    console.error('❌ Error downloading Excel file:', error);
    alert('Terjadi kesalahan saat mengunduh file Excel. Silakan coba lagi.');
  }
};

export const exportToJSON = (data: POExportData): void => {
  const jsonContent = JSON.stringify(data, null, 2);
  downloadFile(jsonContent, `po-report-${dayjs().format('YYYY-MM-DD')}.json`, 'application/json');
};

export const exportToXML = (data: POExportData): void => {
  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<POReport>
  <metadata>
    <title>${data.metadata.title}</title>
    <generatedAt>${data.metadata.generatedAt}</generatedAt>
    <period>${data.metadata.period}</period>
  </metadata>
  <purchaseOrders>
    ${data.purchaseOrders.map(po => `
    <purchaseOrder>
      <poNumber>${po.po_number || ''}</poNumber>
      <poDate>${dayjs(po.po_date).format('YYYY-MM-DD')}</poDate>
      <buyerName>${po.buyer_name || ''}</buyerName>
      <productType>${po.product_type || ''}</productType>
      <totalTonnage>${po.total_tonnage || 0}</totalTonnage>
      <pricePerTon>${po.price_per_ton || 0}</pricePerTon>
      <totalValue>${po.total_value || 0}</totalValue>
      <shippedTonnage>${po.shipped_tonnage || 0}</shippedTonnage>
      <remainingTonnage>${po.remaining_tonnage || 0}</remainingTonnage>
      <status>${po.status || ''}</status>
      <deliveryDeadline>${dayjs(po.delivery_deadline).format('YYYY-MM-DD')}</deliveryDeadline>
      <ppnEnabled>${po.ppn_enabled ? 'true' : 'false'}</ppnEnabled>
      <ppnRate>${po.ppn_rate || 0}</ppnRate>
      <paymentTerms>${po.payment_terms || ''}</paymentTerms>
      <notes>${po.notes || ''}</notes>
    </purchaseOrder>`).join('')}
  </purchaseOrders>
</POReport>`;

  downloadFile(xmlContent, `po-report-${dayjs().format('YYYY-MM-DD')}.xml`, 'application/xml');
};

export const exportToPDF = (data: POExportData): void => {
  // Generate HTML content for PDF
  const htmlContent = generatePDFHTML(data);
  
  // Open in new window for printing
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }
};

const generatePDFHTML = (data: POExportData): string => {
  const style = `
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
      .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
      .metadata { margin-bottom: 20px; font-size: 12px; color: #666; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 11px; }
      th { background-color: #f5f5f5; font-weight: bold; }
      .summary { margin-top: 30px; padding: 15px; background-color: #f9f9f9; border-radius: 5px; }
      .summary h3 { margin-top: 0; color: #333; }
      .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-top: 15px; }
      .summary-item { text-align: center; padding: 10px; background: white; border-radius: 5px; }
      .summary-value { font-size: 18px; font-weight: bold; color: #2563eb; }
      .summary-label { font-size: 12px; color: #666; margin-top: 5px; }
      @media print { body { margin: 0; } }
    </style>
  `;

  const totalValue = data.purchaseOrders.reduce((sum, po) => sum + (po.total_value || 0), 0);
  const activePOs = data.purchaseOrders.filter(po => po.status === 'Aktif').length;
  const completedPOs = data.purchaseOrders.filter(po => po.status === 'Selesai').length;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${data.metadata.title}</title>
      ${style}
    </head>
    <body>
      <div class="header">
        <h1>${data.metadata.title}</h1>
        <div class="metadata">
          <p>Dibuat: ${dayjs(data.metadata.generatedAt).format('DD/MM/YYYY HH:mm')}</p>
          <p>Periode: ${data.metadata.period}</p>
        </div>
      </div>

      <div class="summary">
        <h3>Ringkasan</h3>
        <div class="summary-grid">
          <div class="summary-item">
            <div class="summary-value">${data.purchaseOrders.length}</div>
            <div class="summary-label">Total PO</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(totalValue)}</div>
            <div class="summary-label">Total Nilai</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">${activePOs}</div>
            <div class="summary-label">PO Aktif</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">${completedPOs}</div>
            <div class="summary-label">PO Selesai</div>
          </div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>No. PO</th>
            <th>Tanggal</th>
            <th>Pembeli</th>
            <th>Produk</th>
            <th>Total (kg)</th>
            <th>Harga/Ton</th>
            <th>Nilai Total</th>
            <th>Terkirim (kg)</th>
            <th>Sisa (kg)</th>
            <th>Progress</th>
            <th>Status</th>
            <th>Batas Waktu</th>
            <th>PPN</th>
          </tr>
        </thead>
        <tbody>
          ${data.purchaseOrders.map(po => `
            <tr>
              <td>${po.po_number || ''}</td>
              <td>${dayjs(po.po_date).format('DD/MM/YYYY')}</td>
              <td>${po.buyer_name || ''}</td>
              <td>${po.product_type || ''}</td>
              <td>${(po.total_tonnage || 0).toLocaleString('id-ID')}</td>
              <td>${(po.price_per_ton || 0).toLocaleString('id-ID')}</td>
              <td>${(po.total_value || 0).toLocaleString('id-ID')}</td>
              <td>${(po.shipped_tonnage || 0).toLocaleString('id-ID')}</td>
              <td>${(po.remaining_tonnage || 0).toLocaleString('id-ID')}</td>
              <td>${po.total_tonnage ? ((po.shipped_tonnage / po.total_tonnage) * 100).toFixed(1) : '0'}%</td>
              <td>${po.status || ''}</td>
              <td>${dayjs(po.delivery_deadline).format('DD/MM/YYYY')}</td>
              <td>${po.ppn_enabled ? 'Yes' : 'No'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;
};

const downloadFile = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportToCSV = (data: POExportData): void => {
  try {
    // Convert PO data to CSV format
    const headers = [
      'No. PO',
      'Tanggal PO',
      'Pembeli',
      'Produk',
      'Total Tonase (kg)',
      'Harga per Ton',
      'Nilai Total',
      'Terkirim (kg)',
      'Sisa (kg)',
      'Progress (%)',
      'Status',
      'Batas Waktu',
      'PPN Aktif',
      'Tarif PPN (%)',
      'Syarat Pembayaran',
      'Catatan'
    ];

    const csvRows = [headers.join(',')];

    (data.purchaseOrders || []).forEach(po => {
      const progress = po.total_tonnage ? ((po.shipped_tonnage / po.total_tonnage) * 100).toFixed(1) : '0';
      
      const row = [
        `"${po.po_number || ''}"`,
        `"${dayjs(po.po_date).format('DD/MM/YYYY')}"`,
        `"${po.buyer_name || ''}"`,
        `"${po.product_type || ''}"`,
        po.total_tonnage || 0,
        po.price_per_ton || 0,
        po.total_value || 0,
        po.shipped_tonnage || 0,
        po.remaining_tonnage || 0,
        progress,
        `"${po.status || ''}"`,
        `"${dayjs(po.delivery_deadline).format('DD/MM/YYYY')}"`,
        po.ppn_enabled ? 'Ya' : 'Tidak',
        po.ppn_rate ? (po.ppn_rate * 100).toFixed(1) : '0',
        `"${po.payment_terms || ''}"`,
        `"${po.notes || ''}"`
      ];
      
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `laporan-po-${dayjs().format('YYYYMMDD-HHmm')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('✅ CSV export completed');
    } else {
      console.error('❌ CSV export failed: Download not supported');
    }
  } catch (error) {
    console.error('❌ CSV export failed:', error);
  }
};

export const exportToMultipleFormats = (data: POExportData, formats: string[]): void => {
  formats.forEach(format => {
    switch (format) {
      case 'excel':
        exportToExcel(data);
        break;
      case 'csv':
        exportToCSV(data);
        break;
      case 'json':
        exportToJSON(data);
        break;
      case 'xml':
        exportToXML(data);
        break;
      case 'pdf':
        exportToPDF(data);
        break;
    }
  });
};

