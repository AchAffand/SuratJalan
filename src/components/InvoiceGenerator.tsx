import React, { useState, useMemo } from 'react';
import { FileText, Download, Filter, DollarSign, Package, Truck, AlertCircle, Receipt, MapPin, Printer } from 'lucide-react';
import dayjs from '../lib/dayjs';
import { exportToCSV, exportToPrintableHTML } from '../utils/exporters';

interface InvoiceGeneratorProps {
  notes: any[];
  purchaseOrders: any[];
  onGenerateInvoice: (invoiceData: any) => void;
}

export const InvoiceGenerator: React.FC<InvoiceGeneratorProps> = ({
  notes,
  purchaseOrders,
  onGenerateInvoice
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'excel' | 'pdf' | 'csv'>('excel');
  const [dateRange, setDateRange] = useState<'all' | 'this-month' | 'last-month' | 'this-year' | 'custom'>('this-month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [poFilter, setPoFilter] = useState('all');
  const [destinationFilter, setDestinationFilter] = useState('all');

  // Filter delivery notes yang sudah selesai dan ada berat timbangan
  const completedDeliveries = useMemo(() => {
    return notes.filter(note => 
      note.status === 'selesai' && 
      note.netWeight && 
      note.netWeight > 0
    );
  }, [notes]);

  // Filter berdasarkan kriteria yang dipilih
  const filteredDeliveries = useMemo(() => {
    let filtered = [...completedDeliveries];

    // Filter berdasarkan tanggal
    if (dateRange !== 'all') {
      const now = dayjs();
      let startDate: dayjs.Dayjs;
      let endDate: dayjs.Dayjs;

      switch (dateRange) {
        case 'this-month':
          startDate = now.startOf('month');
          endDate = now.endOf('month');
          break;
        case 'last-month':
          startDate = now.subtract(1, 'month').startOf('month');
          endDate = now.subtract(1, 'month').endOf('month');
          break;
        case 'this-year':
          startDate = now.startOf('year');
          endDate = now.endOf('year');
          break;
        case 'custom':
          if (customStartDate && customEndDate) {
            startDate = dayjs(customStartDate);
            endDate = dayjs(customEndDate);
          } else {
            return filtered;
          }
          break;
        default:
          return filtered;
      }

      filtered = filtered.filter(note => {
        const noteDate = dayjs(note.date);
        return noteDate.isBetween(startDate, endDate, 'day', '[]');
      });
    }

    // Filter berdasarkan PO
    if (poFilter !== 'all') {
      filtered = filtered.filter(note => note.poNumber === poFilter);
    }

    // Filter berdasarkan destinasi
    if (destinationFilter !== 'all') {
      filtered = filtered.filter(note => note.destination === destinationFilter);
    }

    return filtered;
  }, [completedDeliveries, dateRange, customStartDate, customEndDate, poFilter, destinationFilter]);

  // Hitung statistik invoice
  const stats = useMemo(() => {
    const totalDeliveries = filteredDeliveries.length;
    const totalWeight = filteredDeliveries.reduce((sum, note) => sum + (note.netWeight || 0), 0);
    const totalValue = filteredDeliveries.reduce((sum, note) => {
      const po = purchaseOrders.find(p => p.po_number === note.poNumber);
      return sum + ((po?.price_per_ton || 0) * (note.netWeight || 0));
    }, 0);
    
    const uniquePOs = [...new Set(filteredDeliveries.map(note => note.poNumber).filter(Boolean))];
    const uniqueDestinations = [...new Set(filteredDeliveries.map(note => note.destination))];

    return {
      totalDeliveries,
      totalWeight,
      totalValue,
      uniquePOs: uniquePOs.length,
      uniqueDestinations: uniqueDestinations.length
    };
  }, [filteredDeliveries, purchaseOrders]);

  // Generate invoice data
  const generateInvoice = () => {
    const invoiceData = {
      metadata: {
        title: 'Invoice Surat Jalan',
        generatedAt: new Date().toISOString(),
        invoiceNumber: `INV-${dayjs().format('YYYYMMDD')}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
        filters: {
          dateRange,
          customStartDate,
          customEndDate,
          poFilter,
          destinationFilter
        }
      },
      summary: stats,
      deliveries: filteredDeliveries.map(note => {
        const po = purchaseOrders.find(p => p.po_number === note.poNumber);
        const unitPrice = po?.price_per_ton || 0;
        const totalPrice = unitPrice * (note.netWeight || 0);
        
        return {
          ...note,
          poDetails: po,
          unitPrice,
          totalPrice,
          invoiceDate: note.date
        };
      })
    };

    // Lakukan ekspor sesuai format
    if (selectedFormat === 'pdf') {
      const rows = invoiceData.deliveries.map((d: any) => `
        <tr>
          <td>${dayjs(d.invoiceDate).format('YYYY-MM-DD')}</td>
          <td>${d.deliveryNoteNumber}</td>
          <td>${d.poNumber || ''}</td>
          <td>${d.destination}</td>
          <td>${(d.netWeight || 0).toFixed(2)}</td>
          <td>${(d.unitPrice || 0).toLocaleString('id-ID')}</td>
          <td>${(d.totalPrice || 0).toLocaleString('id-ID')}</td>
        </tr>
      `).join('');
      const html = `
        <table>
          <thead>
            <tr>
              <th>Tanggal</th><th>No SJ</th><th>No PO</th><th>Destinasi</th><th>Berat</th><th>Harga/Ton</th><th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>`;
      exportToPrintableHTML(`Invoice ${invoiceData.metadata.invoiceNumber}`, html);
    } else {
      const csvRows = invoiceData.deliveries.map((d: any) => ({
        tanggal: dayjs(d.invoiceDate).format('YYYY-MM-DD'),
        no_surat_jalan: d.deliveryNoteNumber,
        no_po: d.poNumber || '',
        destinasi: d.destination,
        berat_bersih: d.netWeight || 0,
        harga_per_ton: d.unitPrice || 0,
        total_harga: d.totalPrice || 0,
      }));
      exportToCSV(csvRows, `invoice-${dayjs().format('YYYYMMDD-HHmm')}`)
        .then(success => {
          if (success) {
            console.log('✅ Export CSV invoice berhasil');
          }
        })
        .catch(error => {
          console.error('❌ Export CSV invoice gagal:', error);
        });
    }

    // Tetap panggil callback agar kompatibel dengan kode pemanggil
    onGenerateInvoice(invoiceData);
  };

  // Get unique PO numbers for filter
  const uniquePOs = useMemo(() => {
    return [...new Set(completedDeliveries.map(note => note.poNumber).filter(Boolean))];
  }, [completedDeliveries]);

  // Get unique destinations for filter
  const uniqueDestinations = useMemo(() => {
    return [...new Set(completedDeliveries.map(note => note.destination))];
  }, [completedDeliveries]);

  const buildPrintableInvoiceForDelivery = (note: any) => {
    const po = purchaseOrders.find(p => p.po_number === note.poNumber);
    const unitPrice = po?.price_per_ton || 0;
    const weightInKg = note.netWeight || 0;
    const weightInTons = weightInKg / 1000; // Convert KG to tons
    const totalPrice = unitPrice * weightInTons;
    const ppnRate = (po?.ppn_enabled ? (po?.ppn_rate ?? 0.11) : 0);
    const vat = totalPrice * ppnRate; // PPN sesuai PO
    const grandTotal = totalPrice + vat;
    const dueDate = dayjs(note.date).add(14, 'days').format('DD MMMM YYYY');
    const buyerName: string = po?.buyer_name || '';
    const deriveBuyerCode = (name: string): string => {
      if (!name) return 'INV';
      const blacklist = new Set(['PT', 'PT.', 'CV', 'CV.', 'TBK', 'TBK.', 'UD', 'UD.', 'PD', 'PD.']);
      const tokens = name
        .replace(/[^A-Za-z\s-]/g, ' ')
        .split(/[\s-]+/)
        .filter(Boolean)
        .filter(w => !blacklist.has(w.toUpperCase()));
      if (tokens.length === 0) return 'INV';
      const initials = tokens.slice(0, 2).map(w => w[0].toUpperCase()).join('');
      return initials || 'INV';
    };
    const productCode = (po?.product_type || 'INV').toString().split(/[\s-]+/)[0].toUpperCase();
    const buyerCode = deriveBuyerCode(buyerName);
    // Ambil hanya angka urutan dari deliveryNoteNumber untuk mencegah duplikasi format
    const seqRaw = String(note.deliveryNoteNumber || '').match(/\d+/)?.[0] || '1';
    const seq = seqRaw.slice(-3).padStart(3, '0');
    const invoiceNumber = `${seq}/${productCode}-${buyerCode}-${dayjs(note.date).format('MM')}/${dayjs(note.date).format('YYYY')}`;
    
    const style = `
      @page { 
        margin: 15mm; 
        size: A4;
        @top-left { content: ""; }
        @top-center { content: ""; }
        @top-right { content: ""; }
        @bottom-left { content: ""; }
        @bottom-center { content: ""; }
        @bottom-right { content: ""; }
      }
      body { 
        font-family: Arial, sans-serif; 
        color: #000; 
        margin: 0; 
        padding: 10px; 
        line-height: 1.4; 
        background: white;
        font-size: 12px;
        position: relative;
        min-height: 100vh;
        padding-bottom: 90px; /* ruang untuk footer fixed */
        box-sizing: border-box;
      }
      * {
        -webkit-print-color-adjust: exact !important;
        color-adjust: exact !important;
        box-sizing: border-box;
      }
      html {
        margin: 0;
        padding: 0;
        height: 100%;
      }
      @media print {
        body {
          margin: 0 !important;
          padding: 15mm !important;
        }
        .header {
          margin-top: 0 !important;
          padding-top: 0 !important;
        }
        @page {
          margin: 0 !important;
          size: A4 !important;
        }
      }
      .header { 
        text-align: center; 
        margin-bottom: 25px; 
        position: relative;
        min-height: 180px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }
      .logo { 
        width: 100px; 
        height: 100px; 
        margin: 0 auto 15px; 
        object-fit: contain; 
        display: block;
        position: relative;
        z-index: 2;
      }
      .logo-background { 
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 500px; 
        height: 500px; 
        opacity: 0.12;
        z-index: -1;
        object-fit: contain;
        pointer-events: none;
      }
      .company-name { 
        font-size: 16px; 
        font-weight: bold; 
        margin-bottom: 8px; 
        color: #000; 
        text-align: center;
      }
      .invoice-title { 
        font-size: 32px; 
        font-weight: bold; 
        color: #0066cc; 
        margin: 10px 0; 
        letter-spacing: 2px; 
        text-align: center;
        text-transform: uppercase;
      }
      .content { 
        display: flex; 
        justify-content: space-between; 
        margin-bottom: 25px; 
        gap: 30px;
        align-items: flex-start;
      }
      .recipient { 
        flex: 1;
        padding: 0;
      }
      .recipient h3 { 
        font-size: 12px; 
        margin: 0 0 6px 0; 
        font-weight: bold; 
        color: #000;
      }
      .recipient p { 
        font-size: 12px; 
        margin: 3px 0; 
        font-weight: normal;
        color: #000;
      }
      .invoice-details { 
        flex: 1;
        font-size: 11px; 
        padding: 0;
      }
      .invoice-details .row { 
        display: flex; 
        justify-content: space-between; 
        margin: 4px 0; 
        padding: 0;
      }
      .invoice-details .label { 
        font-weight: bold; 
        min-width: 90px; 
        color: #000;
      }
      .invoice-details span:last-child { 
        font-weight: normal; 
        color: #000;
      }
      table { 
        width: 100%; 
        border-collapse: collapse; 
        margin: 25px 0; 
        border: 1px solid #000;
        table-layout: fixed;
        font-family: Arial, sans-serif;
      }
      th, td { 
        border: 1px solid #2b6cb0; 
        padding: 8px 6px; 
        text-align: left; 
        font-size: 11px; 
        vertical-align: middle;
      }
      th { 
        background: #e6f0ff; 
        font-weight: bold; 
        text-align: center; 
        color: #000;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .col-no { width: 8%; }
      .col-product { width: 30%; }
      .col-amount { width: 18%; }
      .col-qty { width: 12%; }
      .col-price { width: 16%; }
      .col-total { width: 16%; }
      .right { text-align: right; }
      .center { text-align: center; }
      .totals { 
        width: 32%; 
        margin-left: auto; 
        margin-top: 10px;
      }
      .totals table { 
        width: 100%; 
        border-collapse: collapse; 
        border: 1px solid #2b6cb0; 
      }
      .totals th, .totals td { 
        border: 1px solid #2b6cb0; 
        padding: 6px; 
        font-size: 11px; 
      }
      .totals .label { 
        text-align: right; 
        font-weight: bold; 
      }
      .totals .value { 
        text-align: right; 
      }
      .totals .grand-total td { 
        background: #dbeafe; 
        font-weight: bold; 
      }
      .bank-info { 
        margin: 25px 0; 
        font-size: 11px; 
        padding: 0;
      }
      .bank-info div:first-child { 
        font-weight: bold; 
        color: #000;
        margin-bottom: 6px;
        font-size: 12px;
      }
      .bank-info div { 
        margin: 3px 0; 
        color: #000;
        font-size: 11px;
      }
      .signatures { 
        display: flex; 
        justify-content: space-between; 
        margin-top: 60px; 
        padding-top: 0;
      }
      .signature-box { 
        width: 45%; 
        text-align: center; 
        padding: 0;
      }
      .signature-box div:first-child { 
        font-weight: bold; 
        color: #000;
        margin-bottom: 130px; /* ruang untuk materai lebih besar */
        font-size: 12px;
      }

      .signature-box div:last-child { 
        font-weight: bold; 
        color: #000;
        margin-top: 8px;
        font-size: 11px;
      }
      .footer { 
        position: fixed;
        left: 0;
        right: 0;
        bottom: 15mm; 
        font-size: 10px; 
        text-align: center; 
        color: #666; 
        line-height: 1.4; 
        padding: 0 15mm;
        border-top: 1px solid #ccc;
        padding-top: 15px;
        background: #fff;
      }
      .footer div { 
        margin: 2px 0; 
      }
      .footer div:first-child { 
        font-weight: bold; 
        color: #000;
        font-size: 11px;
      }
      .creation-time {
        position: fixed;
        left: 15mm;
        bottom: 6mm; 
        font-size: 9px;
        color: #888;
      }
      @media print { 
        body { 
          -webkit-print-color-adjust: exact; 
          print-color-adjust: exact; 
          margin: 0;
          padding: 15mm;
          padding-bottom: 100px; /* pastikan tidak overlap footer */
        } 
        .header, .content, table, .summary, .bank-info, .signatures, .footer {
          page-break-inside: avoid;
        }
        @page {
          margin: 0;
          size: A4;
        }
      }
    `;

    const buyer = po?.buyer_name || '-';
    const product = po?.product_type || '-';
    const buyerAddress = po?.buyer_address || '-';
    const buyerPhone = po?.buyer_phone || '-';
    const addressLines = (buyerAddress || '')
      .split(/\s*,\s*/)
      .filter(Boolean);

    return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title></title>
          <meta name="robots" content="noindex, nofollow" />
          <style>${style}</style>
        </head>
        <body>
          <img src="/sbslogo.jpg" alt="SBS" class="logo-background" />
          <div class="header">
            <img src="/sbslogo.jpg" alt="SBS" class="logo" />
            <div class="invoice-title">INVOICE</div>
          </div>

          <div class="content">
            <div class="recipient">
              <h3>Kepada Yth.</h3>
              <p><strong>${buyer}</strong></p>
              ${addressLines.map((line: string) => `<p>${line}</p>`).join('')}
              <p>Telp: ${buyerPhone}</p>
            </div>
            <div class="invoice-details">
              <div class="row">
                <span class="label">No Invoice:</span>
                <span>${invoiceNumber}</span>
              </div>
              <div class="row">
                <span class="label">Tanggal:</span>
                <span>${dayjs(note.date).format('DD MMMM YYYY')}</span>
              </div>
              <div class="row">
                <span class="label">No. P.O:</span>
                <span>${note.poNumber || '-'}</span>
              </div>
              <div class="row">
                <span class="label">Tanggal Kirim:</span>
                <span>${dayjs(note.date).format('DD MMMM YYYY')}</span>
              </div>
              <div class="row">
                <span class="label">T.O.P:</span>
                <span>14 Day</span>
              </div>
              <div class="row">
                <span class="label">Jatuh Tempo:</span>
                <span>${dueDate}</span>
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th class="center col-no">NO</th>
                <th class="col-product">NAMA BARANG</th>
                <th class="right col-amount">JUMLAH</th>
                <th class="center col-qty">QTY</th>
                <th class="right col-price">HARGA</th>
                <th class="right col-total">JUMLAH (Rp.)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="center col-no">1</td>
                <td class="col-product">${product}</td>
                <td class="right col-amount">${(note.netWeight || 0).toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                <td class="center col-qty">KG</td>
                <td class="right col-price">${unitPrice.toLocaleString('id-ID')}</td>
                <td class="right col-total">${totalPrice.toLocaleString('id-ID')}</td>
              </tr>
            </tbody>
          </table>

          <div class="totals">
            <table>
              <tbody>
                <tr>
                  <td class="label">SUB TOTAL:</td>
                  <td class="value">${totalPrice.toLocaleString('id-ID')}</td>
                </tr>
                ${ppnRate > 0 ? `<tr>
                  <td class="label">PPN (${(ppnRate*100).toFixed(0)}%):</td>
                  <td class="value">${vat.toLocaleString('id-ID')}</td>
                </tr>` : ''}
                <tr class="grand-total">
                  <td class="label">TOTAL:</td>
                  <td class="value">${grandTotal.toLocaleString('id-ID')}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="bank-info">
            <div><strong>Bank Transfer:</strong></div>
            <div>Bank: BCA</div>
            <div>A/C: 6155422789</div>
            <div>Cabang: Sidoarjo</div>
            <div>a/n: Samudera Berkah Sentosa</div>
          </div>

          <div class="signatures">
            <div class="signature-box">
              <div>Hormat Kami</div>
              <div><strong>( Samudera Berkah Sentosa )</strong></div>
            </div>
            <div class="signature-box">
              <div>Penerima</div>
              <div><strong>( ..................... )</strong></div>
            </div>
          </div>

          <div class="footer">
            <div>PT. SAMUDERA BERKAH SENTOSA</div>
            <div>Industries, Trading And General Supplier</div>
            <div>Kawasan Pergudangan SAFE N LOCK Blok E-1509, Rangkah kidul, Sidoarjo</div>
            <div>Phone: 031-58281627 | Email: admin@idptsbs.com</div>
          </div>

          <div class="creation-time">
            Dibuat pada: ${dayjs().format('DD/M/YYYY, HH.mm.ss')}
          </div>

          <script>window.addEventListener('load', () => setTimeout(() => window.print(), 100));<\/script>
        </body>
      </html>
    `;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 bg-green-100 rounded-xl">
            <Receipt className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Invoice Generator</h1>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center space-x-2">
              <Truck className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Total Kiriman</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">{stats.totalDeliveries}</p>
          </div>
          
          <div className="bg-green-50 rounded-xl p-4 border border-green-200">
            <div className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-800">Total Berat</span>
            </div>
            <p className="text-2xl font-bold text-green-900">{stats.totalWeight.toFixed(1)} ton</p>
          </div>
          
          <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">Total PO</span>
            </div>
            <p className="text-2xl font-bold text-purple-900">{stats.uniquePOs}</p>
          </div>
          
          <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
            <div className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">Destinasi</span>
            </div>
            <p className="text-2xl font-bold text-orange-900">{stats.uniqueDestinations}</p>
          </div>
          
          <div className="bg-red-50 rounded-xl p-4 border border-red-200">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium text-red-800">Total Nilai</span>
            </div>
            <p className="text-lg font-bold text-red-900">
              Rp {(stats.totalValue / 1000000).toFixed(1)}M
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <span>Filter Invoice</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Format Export */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Format Export</label>
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="excel">Excel (.xlsx)</option>
              <option value="pdf">PDF</option>
              <option value="csv">CSV</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rentang Tanggal</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Semua Tanggal</option>
              <option value="this-month">Bulan Ini</option>
              <option value="last-month">Bulan Lalu</option>
              <option value="this-year">Tahun Ini</option>
              <option value="custom">Kustom</option>
            </select>
          </div>

          {/* PO Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter PO</label>
            <select
              value={poFilter}
              onChange={(e) => setPoFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Semua PO</option>
              {uniquePOs.map(poNumber => (
                <option key={poNumber} value={poNumber}>{poNumber}</option>
              ))}
            </select>
          </div>

          {/* Destination Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter Destinasi</label>
            <select
              value={destinationFilter}
              onChange={(e) => setDestinationFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Semua Destinasi</option>
              {uniqueDestinations.map(destination => (
                <option key={destination} value={destination}>{destination}</option>
              ))}
            </select>
          </div>

          {/* Generate Button */}
          <div className="flex items-end">
            <button
              onClick={generateInvoice}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-green-700 transition-all flex items-center justify-center space-x-2 font-medium"
            >
              <Download className="w-4 h-4" />
              <span>Generate</span>
            </button>
          </div>
        </div>

        {/* Custom Date Range */}
        {dateRange === 'custom' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Mulai</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Akhir</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Preview Data */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Preview Data Invoice</h2>
          <span className="text-sm text-gray-500">
            {filteredDeliveries.length} surat jalan siap di-invoice
          </span>
        </div>

        {filteredDeliveries.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Tidak ada data surat jalan yang sesuai dengan filter yang dipilih</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    No. Surat Jalan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    No. PO
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Destinasi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Berat (ton)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Harga/ton
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Harga
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDeliveries.map((note) => {
                  const po = purchaseOrders.find(p => p.po_number === note.poNumber);
                  const unitPrice = po?.price_per_ton || 0;
                  const totalPrice = unitPrice * (note.netWeight || 0);
                  
                  return (
                    <tr key={note.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {note.deliveryNoteNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {dayjs(note.date).format('DD/MM/YYYY')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {note.poNumber || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {note.destination}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                        {note.netWeight?.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Rp {unitPrice.toLocaleString()}
                      </td>
                                             <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 flex items-center gap-2">
                         <span>Rp {totalPrice.toLocaleString()}</span>
                         <button
                           onClick={() => {
                             const html = buildPrintableInvoiceForDelivery(note);
                             exportToPrintableHTML(`Invoice ${note.deliveryNoteNumber}`, html);
                           }}
                           title="Cetak Invoice"
                           className="inline-flex items-center px-2 py-1 border border-gray-300 rounded-md hover:bg-gray-100"
                         >
                           <Printer className="w-4 h-4" />
                           <span className="sr-only">Print</span>
                         </button>
                       </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
