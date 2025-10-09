import React, { useState } from 'react';
import { DeliveryNote } from '../types';
import { formatDate } from '../utils/format';
import { 
  Printer, Eye, EyeOff, X, CheckCircle, 
  FileText, AlertCircle
} from 'lucide-react';

interface PurchaseOrder {
  id: string;
  po_number: string;
  buyer_name?: string | null;
  buyer_address?: string | null;
  buyer_phone?: string | null;
  buyer_email?: string | null;
}

interface SuratJalanPrinterProps {
  deliveryNote: DeliveryNote;
  purchaseOrders?: PurchaseOrder[];
  onClose: () => void;
}

export const SuratJalanPrinter: React.FC<SuratJalanPrinterProps> = ({
  deliveryNote,
  purchaseOrders = [],
  onClose,
}) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Validate delivery note data on mount
  React.useEffect(() => {
    if (!deliveryNote) {
      setError('Data surat jalan tidak tersedia');
      return;
    }
    
    if (!deliveryNote.deliveryNoteNumber) {
      setError('Nomor surat jalan tidak tersedia');
      return;
    }
    
    // Debug logging for printer
    console.log('🖨️ Rendering surat jalan printer:', {
      id: deliveryNote.id,
      date: deliveryNote.date,
      destination: deliveryNote.destination,
      poNumber: deliveryNote.poNumber,
      status: deliveryNote.status
    });
    
    setError(null);
  }, [deliveryNote]);

  const generatePrintContent = () => {
    // Find PO data for this delivery note
    const poData = purchaseOrders.find(po => po.po_number === deliveryNote.poNumber);
    
    // Function to format address with line breaks every 2 commas
    const formatAddress = (address: string) => {
      if (!address) return '';
      
      // Split by comma and clean up spaces
      const parts = address.split(',').map(part => part.trim()).filter(part => part);
      
      // Group every 2 parts and join with comma, then add line breaks
      const formattedParts = [];
      for (let i = 0; i < parts.length; i += 2) {
        const group = parts.slice(i, i + 2).join(' , ');
        formattedParts.push(group);
      }
      
      return formattedParts.join(' ,<br/>');
    };
    
    // Ensure all required data is available
    const safeDeliveryNote = {
      deliveryNoteNumber: deliveryNote.deliveryNoteNumber || 'N/A',
      createdAt: deliveryNote.createdAt || new Date().toISOString(),
      date: deliveryNote.date || new Date().toISOString().split('T')[0],
      poNumber: deliveryNote.poNumber || 'N/A',
      vehicleNumber: deliveryNote.vehiclePlate || 'N/A',
      driverName: deliveryNote.driverName || 'N/A',
      destination: deliveryNote.destination || 'N/A',
      destinationAddress: '',
      netWeight: deliveryNote.netWeight || 0,
      status: deliveryNote.status || 'menunggu',
      hasSeal: deliveryNote.hasSeal || false,
      sealNumbers: deliveryNote.sealNumbers || [],
      company: deliveryNote.company || 'sbs',
      items: [] as Array<unknown>,
      // Add PO data
      buyerName: poData?.buyer_name || '',
      buyerAddress: poData?.buyer_address || deliveryNote.destination || 'N/A',
      buyerPhone: poData?.buyer_phone || '',
      buyerEmail: poData?.buyer_email || ''
    };

    // Debug logging for print content
    console.log('🖨️ Generating print content with data:', {
      deliveryNoteNumber: safeDeliveryNote.deliveryNoteNumber,
      date: safeDeliveryNote.createdAt,
      destination: safeDeliveryNote.destination,
      poNumber: safeDeliveryNote.poNumber,
      company: safeDeliveryNote.company
    });

    // Company configurations
    const companyConfig = {
      sbs: {
        name: 'PT SAMUDERA BERKAH SENTOSA',
        tagline: '',
        address: 'Jl. Kahuripan Nirwana Avenue No. 20',
        city: 'Sidoarjo - Jawa Timur',
        phone: 'Telp: (031) 58281617',
        logo: '/sbslogo.jpg',
        signatureName: '(PT. SAMUDERA BERKAH SENTOSA)'
      },
      mbs: {
        name: 'CV. MULIA BERKAH SENTOSA',
        tagline: 'Supplier and General Trading',
        address: 'Jl. Raya Pilang Wonoayu',
        city: 'Sidoarjo',
        phone: '',
        logo: '/logombs.png',
        signatureName: '(Mulia Berkah Sentosa)'
      },
      perorangan: {
        name: 'YUSUF ROJIKIN',
        tagline: '',
        address: 'JALAN RAYA PLOSO - WONOAYU',
        city: 'SIDOARJO - JAWA TIMUR',
        phone: '',
        logo: '',
        signatureName: '(YUSUF ROJIKIN)'
      }
    };

    const config = companyConfig[safeDeliveryNote.company];

    const sealHtml = safeDeliveryNote.hasSeal && safeDeliveryNote.sealNumbers.length > 0
      ? (() => {
          const first = safeDeliveryNote.sealNumbers[0];
          const rest = safeDeliveryNote.sealNumbers.slice(1);
          const indent = '82px';
          return `<div style="text-align:left;">`
            + `<div><span style="font-weight:bold;">NO. SEAL :</span> <span>- ${first}</span></div>`
            + rest.map(s => `<div style=\"padding-left:${indent}; margin-top:4px;\">- ${s}</div>`).join('')
            + `</div>`;
        })()
      : 'TANPA SEAL';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Surat Jalan - ${safeDeliveryNote.deliveryNoteNumber}</title>
        <style>
          @page { 
      size: 9.44in 5.5in landscape;
      margin: 0.2in;
    }
    
          * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
          }
    
          body { 
      font-family: 'Century Gothic', Arial, sans-serif;
      font-size: 12px;
      line-height: 1.2;
            color: #000; 
      width: 9.44in;
      height: 5.5in;
      margin: 0;
      padding: 0.2in;
    }
    
          .document { 
            width: 100%; 
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    
          .header { 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-start; 
      margin-bottom: 0.15in;
      padding-bottom: 0.1in;
    }
    
    .title-section {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }
    
    .title {
      font-size: 32px;
      font-weight: bold;
      letter-spacing: 2px;
      margin-bottom: 0.05in;
    }
    
    .doc-no {
      font-size: 14px;
      font-weight: bold;
      color: #333;
    }
    
    .company {
      text-align: right;
      font-size: 14px;
      line-height: 1.3;
      display: flex;
      align-items: flex-start;
      justify-content: flex-end;
      gap: 0.15in;
      margin-bottom: 0.1in;
      margin-right: 0.7in;
    }
    
    .company-logo {
      width: 0.7in;
      height: auto;
      max-height: 0.8in;
      object-fit: contain;
    }
    
    .company-text {
            text-align: right;
          }
    
    
    .company .name {
      font-weight: bold;
      font-size: 16px;
    }
    
    .company .tagline {
      font-size: 14px;
      color: #666;
      margin-bottom: 0.05in;
    }
    
    .content {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    
    .info-section {
      display: flex;
      gap: 0.1in;
      margin-bottom: 0.15in;
      align-items: flex-start;
    }
    
    .recipient {
      flex: 0.7;
      padding: 0.1in;
      font-size: 14px;
      line-height: 1.3;
    }
    
    .recipient .label {
      font-weight: bold; 
      margin-bottom: 0.08in;
      font-size: 15px;
    }
    
    .recipient div {
      margin-bottom: 0.02in;
    }
    
    .details {
      flex: 0.3;
      padding: 0.1in;
      font-size: 14px;
      line-height: 1.4;
    }
    
    .detail-row {
      display: flex;
      margin-bottom: 0.03in;
    }
    
    .detail-label {
      width: 0.8in;
            font-weight: bold; 
    }
    
    .detail-value {
      flex: 1;
    }
    
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 0.05in;
            font-size: 16px; 
    }
    
    .items-table th,
    .items-table td {
      border: 1px solid #000;
      padding: 0.05in;
      text-align: center;
      vertical-align: top;
    }
    
    .items-table th {
      background-color: #f0f0f0;
            font-weight: bold; 
    }
    
    .signature-section {
      display: flex;
      justify-content: space-between;
      margin-top: 0.05in;
      gap: 0.35in;
    }
    
    .signature-box {
      width: 3in;
      height: 1.6in;
      padding: 0.01in;
      text-align: center;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    
    .signature-title {
      font-weight: bold;
            font-size: 16px; 
    }
    
    .company-name {
      font-size: 14px;
      margin-top: 0.1in;
      text-align: center;
    }
    
    .stamp-area {
      height: 1.1in;
      margin: 0.06in 0;
    }
    
    .signature-line {
      font-size: 9px;
      margin-top: auto;
    }
    
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="document">
    <div class="header">
      <div class="title-section">
        <div class="title">SURAT JALAN</div>
        ${safeDeliveryNote.company === 'mbs' ? `<div class="doc-no">DOC NO.MBS-009/2025</div>` : ''}
      </div>
      <div class="company">
        ${config.logo ? `<img src="${config.logo}" alt="Company Logo" class="company-logo" />` : ''}
        <div class="company-text">
          <div class="name">${config.name}</div>
          ${config.tagline ? `<div class="tagline">${config.tagline}</div>` : ''}
          <div>${config.address}</div>
          <div>${config.city}</div>
          ${config.phone ? `<div>${config.phone}</div>` : ''}
        </div>
      </div>
    </div>
    
    <div class="content">
      <div class="info-section">
        <div class="recipient">
          <div class="label">Kepada Yth,</div>
          ${safeDeliveryNote.buyerName ? `<div>${safeDeliveryNote.buyerName}</div>` : ''}
          <div>${formatAddress(safeDeliveryNote.buyerAddress || safeDeliveryNote.destination || 'Alamat tujuan tidak tersedia')}</div>
          ${safeDeliveryNote.buyerPhone ? `<div>Telp. ${safeDeliveryNote.buyerPhone}</div>` : ''}
        </div>
        
        <div class="details">
          <div class="detail-row">
            <div class="detail-label">No. SJ</div>
            <div class="detail-value">: ${safeDeliveryNote.deliveryNoteNumber}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Tanggal</div>
            <div class="detail-value">: ${new Date(safeDeliveryNote.date).toLocaleDateString('id-ID')}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">No. PO</div>
            <div class="detail-value">: ${safeDeliveryNote.poNumber}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">No. Pol</div>
            <div class="detail-value">: ${safeDeliveryNote.vehicleNumber}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Driver</div>
            <div class="detail-value">: ${safeDeliveryNote.driverName}</div>
          </div>
        </div>
      </div>
      
      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 0.5in;">NO</th>
            <th>NAMA BARANG</th>
            <th style="width: 1.2in;">JUMLAH</th>
            <th style="width: 2.5in;">KETERANGAN</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td rowspan="2">1</td>
            <td rowspan="2" style="padding-top:0.06in;height:1.1in;">CPO</td>
            <td rowspan="2" style="padding-top:0.06in;height:1.1in;">1 Tangki</td>
            <td rowspan="2">${sealHtml}</td>
          </tr>
          <tr></tr>
        </tbody>
      </table>
      
      <div class="signature-section">
        <div class="signature-box">
          <div class="signature-title">Penerima</div>
        </div>
        <div class="signature-box">
          <div class="signature-title">Hormat kami,</div>
          <div class="company-name">${config.signatureName}</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
  };

  const generateExcelContent = () => {
    // Find PO data for this delivery note
    const poData = purchaseOrders.find(po => po.po_number === deliveryNote.poNumber);
    
    const safeDeliveryNote = {
      deliveryNoteNumber: deliveryNote.deliveryNoteNumber || 'N/A',
      createdAt: deliveryNote.createdAt || new Date().toISOString(),
      poNumber: deliveryNote.poNumber || 'N/A',
      vehicleNumber: deliveryNote.vehiclePlate || 'N/A',
      driverName: deliveryNote.driverName || 'N/A',
      destination: deliveryNote.destination || 'N/A',
      hasSeal: deliveryNote.hasSeal || false,
      sealNumbers: deliveryNote.sealNumbers || [],
      company: deliveryNote.company || 'sbs',
      // Add PO data
      buyerName: poData?.buyer_name || '',
      buyerAddress: poData?.buyer_address || deliveryNote.destination || 'N/A',
      buyerPhone: poData?.buyer_phone || '',
      buyerEmail: poData?.buyer_email || ''
    };

    // Debug logging for Excel content
    console.log('📊 Generating Excel content with data:', {
      deliveryNoteNumber: safeDeliveryNote.deliveryNoteNumber,
      date: safeDeliveryNote.createdAt,
      destination: safeDeliveryNote.destination,
      poNumber: safeDeliveryNote.poNumber,
      company: safeDeliveryNote.company
    });

    // Company configurations
    const companyConfig = {
      sbs: {
        name: 'PT SAMUDERA BERKAH SENTOSA',
        tagline: '',
        address: 'Jl. Kahuripan Nirwana Avenue No. 20',
        city: 'Sidoarjo - Jawa Timur',
        phone: 'Telp: (031) 58281617',
        logo: '/sbslogo.jpg',
        signatureName: '(PT. SAMUDERA BERKAH SENTOSA)'
      },
      mbs: {
        name: 'CV. MULIA BERKAH SENTOSA',
        tagline: 'Supplier and General Trading',
        address: 'Jl. Raya Pilang Wonoayu',
        city: 'Sidoarjo',
        phone: '',
        logo: '/logombs.png',
        signatureName: '(Mulia Berkah Sentosa)'
      },
      perorangan: {
        name: 'YUSUF ROJIKIN',
        tagline: '',
        address: 'JALAN RAYA PLOSO - WONOAYU',
        city: 'SIDOARJO - JAWA TIMUR',
        phone: '',
        logo: '',
        signatureName: '(YUSUF ROJIKIN)'
      }
    };

    const config = companyConfig[safeDeliveryNote.company];

    // Function to format address with line breaks every 2 commas (for second template)
    const formatAddressExcel = (address: string) => {
      if (!address) return '';
      
      // Split by comma and clean up spaces
      const parts = address.split(',').map(part => part.trim()).filter(part => part);
      
      // Group every 2 parts and join with comma, then add line breaks
      const formattedParts = [];
      for (let i = 0; i < parts.length; i += 2) {
        const group = parts.slice(i, i + 2).join(' , ');
        formattedParts.push(group);
      }
      
      return formattedParts.join(' ,<br/>');
    };

    const excelSealHtml = safeDeliveryNote.hasSeal && safeDeliveryNote.sealNumbers.length > 0
      ? (() => {
          const first = safeDeliveryNote.sealNumbers[0];
          const rest = safeDeliveryNote.sealNumbers.slice(1);
          const indent = '82px';
          return `<div style="text-align:left;">`
            + `<div><span style="font-weight:bold;">NO. SEAL :</span> <span>- ${first}</span></div>`
            + rest.map(s => `<div style=\"padding-left:${indent}; margin-top:4px;\">- ${s}</div>`).join('')
            + `</div>`;
        })()
      : 'TANPA SEAL';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Surat Jalan - ${safeDeliveryNote.deliveryNoteNumber}</title>
  <style>
    @page {
      size: 9.44in 5.5in landscape;
      margin: 0.2in;
    }
    
    body {
      font-family: 'Century Gothic', Arial, sans-serif;
      font-size: 12px;
      line-height: 1.2;
      color: #000;
      margin: 0;
      padding: 0;
      width: 9.44in;
      height: 5.5in;
    }
    
    .document {
      width: 9.44in;
      height: 5.5in;
      display: flex;
      flex-direction: column;
      padding: 0.2in;
      box-sizing: border-box;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.15in;
      border-bottom: 2px solid #000;
      padding-bottom: 0.1in;
    }
    
    .details {
      flex: 1;
      padding: 0.1in;
      font-size: 16px;
      line-height: 1.4;
    }
    
    .title {
      font-size: 28px;
            font-weight: bold; 
      letter-spacing: 1px;
          }
    
    .company {
      text-align: right;
      font-size: 14px; 
      line-height: 1.3;
      display: flex;
      align-items: flex-start;
      justify-content: flex-end;
      gap: 0.15in;
    }
    
    .company-logo {
      width: 1.2in;
      height: auto;
      max-height: 0.8in;
      object-fit: contain;
      border-radius: 50%;
    }
    
    .company-text {
      text-align: right;
    }
    
    
    .company .name {
            font-weight: bold; 
      font-size: 16px;
    }
    
    .content {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    
    .info-section {
      display: flex;
      gap: 0.15in;
      margin-bottom: 0.15in;
      align-items: flex-start;
    }
    
    .recipient {
      flex: 0.7;
      padding: 0.08in;
      font-size: 15px;
      line-height: 1.4;
    }
    
    .recipient .label {
            font-weight: bold;
      margin-bottom: 0.05in;
      font-size: 18px;
    }
    
    .details {
      flex: 0.3;
      padding: 0.08in;
      font-size: 15px;
      line-height: 1.4;
          }
    
    .detail-row {
      display: flex;
      margin-bottom: 0.03in;
    }
    
    .detail-label {
      width: 0.8in;
      font-weight: bold;
    }
    
    .detail-value {
      flex: 1;
    }
    
          .items-table { 
            width: 100%; 
            border-collapse: collapse; 
      margin-bottom: 0.15in;
      font-size: 14px;
    }
    
          .items-table th, 
          .items-table td { 
      border: 1px solid #000;
      padding: 0.06in;
      text-align: center;
    }
    
          .items-table th { 
      background-color: #f0f0f0;
            font-weight: bold; 
    }
    
    .signature-section {
      display: flex;
      justify-content: space-between;
      margin-top: auto;
      gap: 0.2in;
    }
    
    .signature-box {
      width: 2.6in;
      height: 1.3in;
      padding: 0.06in;
            text-align: center; 
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    
    .signature-title {
      font-weight: bold;
      font-size: 16px;
    }
    
    .company-name {
      font-size: 14px;
      margin-top: 0.1in;
            text-align: center; 
          }
    
    .stamp-area {
      height: 0.8in;
      border: 1px dashed #ccc;
      margin: 0.05in 0;
    }
    
          .signature-line { 
      font-size: 9px;
      margin-top: auto;
          }
        </style>
      </head>
      <body>
  <div class="document">
          <div class="header">
      <div class="title">SURAT JALAN</div>
      <div class="company">
        ${config.logo ? `<img src="${config.logo}" alt="Company Logo" class="company-logo" />` : ''}
        <div class="company-text">
          <div class="name">${config.name}</div>
          ${config.tagline ? `<div class="tagline">${config.tagline}</div>` : ''}
          <div>${config.address}</div>
          <div>${config.city}</div>
          ${config.phone ? `<div>${config.phone}</div>` : ''}
              </div>
            </div>
          </div>
          
    <div class="content">
      <div class="info-section">
        <div class="recipient">
          <div class="label">Kepada Yth,</div>
          ${safeDeliveryNote.buyerName ? `<div>${safeDeliveryNote.buyerName}</div>` : ''}
          <div>${formatAddressExcel(safeDeliveryNote.buyerAddress || safeDeliveryNote.destination || 'Alamat tujuan tidak tersedia')}</div>
          ${safeDeliveryNote.buyerPhone ? `<div>Telp. ${safeDeliveryNote.buyerPhone}</div>` : ''}
        </div>
        
          <div class="details">
          <div class="detail-row">
            <div class="detail-label">No. SJ</div>
            <div class="detail-value">: ${safeDeliveryNote.company === 'mbs' ? 'No. 010/MBS-09/CS/2025' : safeDeliveryNote.deliveryNoteNumber}</div>
              </div>
          <div class="detail-row">
            <div class="detail-label">Tanggal</div>
            <div class="detail-value">: ${new Date(safeDeliveryNote.createdAt).toLocaleDateString('id-ID')}</div>
                </div>
          <div class="detail-row">
            <div class="detail-label">No. PO</div>
            <div class="detail-value">: ${safeDeliveryNote.poNumber}</div>
                </div>
          <div class="detail-row">
            <div class="detail-label">No. Pol</div>
            <div class="detail-value">: ${safeDeliveryNote.vehicleNumber}</div>
                </div>
          <div class="detail-row">
            <div class="detail-label">Driver</div>
            <div class="detail-value">: ${safeDeliveryNote.driverName}</div>
              </div>
            </div>
          </div>
          
          <table class="items-table">
            <thead>
              <tr>
            <th style="width: 0.5in;">NO</th>
            <th>NAMA BARANG</th>
            <th style="width: 1.2in;">JUMLAH</th>
            <th style="width: 2.5in;">KETERANGAN</th>
              </tr>
            </thead>
            <tbody>
          <tr>
            <td>1</td>
            <td>CPO</td>
            <td>1 Tangki</td>
            <td rowspan="4">${excelSealHtml}</td>
              </tr>
              <tr>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
              </tr>
              <tr>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
              </tr>
              <tr>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
              </tr>
            </tbody>
          </table>
          
      <div class="signature-section">
        <div class="signature-box">
          <div class="signature-title">Penerima</div>
              </div>
        <div class="signature-box">
          <div class="signature-title">Hormat kami,</div>
          <div class="company-name">${config.signatureName}</div>
              </div>
            </div>
          </div>
        </div>
      </body>
</html>`;
  };

  const handlePrint = () => {
    setIsPrinting(true);
    
    try {
      if (!deliveryNote || !deliveryNote.deliveryNoteNumber) {
        throw new Error('Data surat jalan tidak lengkap');
      }
      
      console.log('🖨️ Starting print process for:', {
        id: deliveryNote.id,
        deliveryNoteNumber: deliveryNote.deliveryNoteNumber,
        date: deliveryNote.date,
        destination: deliveryNote.destination
      });
      
      const printContent = generatePrintContent();
      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        throw new Error('Tidak dapat membuka jendela cetak');
      }
      
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // Wait for content to load then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
          printWindow.close();
        }, 500);
      };
      
    } catch (error) {
      console.error('Error printing:', error);
      alert(`Gagal mencetak surat jalan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsPrinting(false);
    }
  };

  const handleExportToExcel = () => {
    try {
      if (!deliveryNote || !deliveryNote.deliveryNoteNumber) {
        throw new Error('Data surat jalan tidak lengkap');
      }
      
      console.log('📊 Starting Excel export for:', {
        id: deliveryNote.id,
        deliveryNoteNumber: deliveryNote.deliveryNoteNumber,
        date: deliveryNote.date,
        destination: deliveryNote.destination
      });
      
      const excelContent = generateExcelContent();
      const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `Surat Jalan - ${deliveryNote.deliveryNoteNumber}.xls`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        alert('File Excel berhasil didownload! Buka file tersebut dan gunakan Print > Landscape untuk mencetak dengan orientasi yang benar.');
      } else {
        alert('Browser tidak mendukung download file Excel');
      }
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert(`Gagal mengekspor ke Excel: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Show error state if there's an error
  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={onClose}
              className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Surat Jalan - {deliveryNote.deliveryNoteNumber}
              </h2>
              <p className="text-sm text-gray-500">
                {formatDate(deliveryNote.createdAt)} • {deliveryNote.destination}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title={showPreview ? 'Sembunyikan Preview' : 'Tampilkan Preview'}
            >
              {showPreview ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {showPreview ? (
            <div className="h-full overflow-auto p-4">
              <div 
                className="bg-white border border-gray-200 rounded-lg shadow-sm"
                dangerouslySetInnerHTML={{ __html: generatePrintContent() }}
              />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Preview disembunyikan</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Format: Epson LX-310 • Kertas: NCR 9.44" x 5.5" • Landscape</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleExportToExcel}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>Export Excel</span>
            </button>
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>{isPrinting ? 'Mencetak...' : 'Cetak'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};