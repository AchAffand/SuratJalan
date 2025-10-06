/**
 * Export utilities for generating printable documents
 */

/**
 * Create a basic PDF using browser's print-to-PDF functionality
 * This is the most reliable method that always works
 */
export function createBasicPDF(title: string, reportData: any): void {
  try {
    console.log('📄 Creating basic PDF with data:', reportData);
    
    // Create very simple HTML that definitely works
    const basicHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${title}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            font-size: 12px;
            line-height: 1.4;
            color: #000;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .company {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .title {
            font-size: 14px;
            margin-bottom: 5px;
        }
        .date {
            font-size: 12px;
            color: #666;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        th, td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f0f0f0;
            font-weight: bold;
        }
        .summary {
            margin: 20px 0;
        }
        .summary h3 {
            margin: 10px 0;
            font-size: 14px;
        }
        .kpi-row {
            display: block;
            margin: 5px 0;
        }
        .kpi-label {
            font-weight: bold;
            display: inline-block;
            width: 150px;
        }
        .footer {
            margin-top: 30px;
            padding-top: 10px;
            border-top: 1px solid #000;
            font-size: 10px;
            text-align: center;
        }
        @media print {
            body { margin: 15mm; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company">PT. SAMUDERA BERKAH SENTOSA</div>
        <div class="title">${title}</div>
        <div class="date">Tanggal: ${new Date().toLocaleDateString('id-ID', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</div>
    </div>

    <div class="summary">
        <h3>RINGKASAN EKSEKUTIF</h3>
        <div class="kpi-row">
            <span class="kpi-label">Total Pengiriman:</span>
            <span>${reportData?.summary?.totalDeliveries || 0} pengiriman</span>
        </div>
        <div class="kpi-row">
            <span class="kpi-label">Total Berat:</span>
            <span>${((reportData?.summary?.totalWeight || 0) / 1000).toFixed(2)} ton</span>
        </div>
        <div class="kpi-row">
            <span class="kpi-label">Total Revenue:</span>
            <span>Rp ${(reportData?.summary?.totalRevenue || 0).toLocaleString('id-ID')}</span>
        </div>
        <div class="kpi-row">
            <span class="kpi-label">On-Time Delivery:</span>
            <span>${reportData?.summary?.onTimeDelivery || 0}%</span>
        </div>
    </div>

    <div class="details">
        <h3>DETAIL PENGIRIMAN</h3>
        <table>
            <thead>
                <tr>
                    <th>Tanggal</th>
                    <th>No. SJ</th>
                    <th>Tujuan</th>
                    <th>Kendaraan</th>
                    <th>Sopir</th>
                    <th>Berat (kg)</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${(reportData?.details?.deliveries || []).slice(0, 30).map((delivery: any) => `
                    <tr>
                        <td>${delivery.date ? new Date(delivery.date).toLocaleDateString('id-ID') : '-'}</td>
                        <td>${delivery.deliveryNoteNumber || '-'}</td>
                        <td>${delivery.destination || '-'}</td>
                        <td>${delivery.vehiclePlate || '-'}</td>
                        <td>${delivery.driverName || '-'}</td>
                        <td>${(delivery.netWeight || 0).toLocaleString('id-ID')}</td>
                        <td>${delivery.status || '-'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="footer">
        <p><strong>Sistem Surat Jalan - PT. SAMUDERA BERKAH SENTOSA</strong></p>
        <p>Laporan dibuat pada: ${new Date().toLocaleString('id-ID')}</p>
    </div>

    <div class="no-print" style="position: fixed; top: 10px; right: 10px; background: #007bff; color: white; padding: 10px; border-radius: 5px; z-index: 1000;">
        <strong>📄 Untuk menyimpan sebagai PDF:</strong><br>
        1. Tekan Ctrl+P<br>
        2. Pilih "Save as PDF"<br>
        3. Klik Save
    </div>

    <script>
        // Auto-trigger print dialog
        window.addEventListener('load', function() {
            setTimeout(function() {
                window.print();
            }, 500);
        });
    </script>
</body>
</html>`;

    // Open in new window
    const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
    
    if (!printWindow) {
      alert('Popup diblokir! Silakan izinkan popup untuk ekspor PDF.');
      return;
    }

    printWindow.document.write(basicHtml);
    printWindow.document.close();
    
    console.log('✅ Basic PDF window opened successfully');
    
  } catch (error) {
    console.error('❌ Error creating basic PDF:', error);
    alert(`Gagal membuat PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Simple PDF export using basic HTML table structure
 * @param title - Document title for the PDF
 * @param data - Report data object
 */
export function exportSimplePDF(title: string, data: any): void {
  try {
    const simpleHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            background: white;
            color: black;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px;
            border-bottom: 2px solid #000;
            padding-bottom: 15px;
          }
          h1 { 
            margin: 0; 
            font-size: 20px;
          }
          h2 { 
            margin: 5px 0; 
            font-size: 16px;
            color: #666;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0;
          }
          th, td { 
            border: 1px solid #000; 
            padding: 8px; 
            text-align: left;
          }
          th { 
            background-color: #f0f0f0; 
            font-weight: bold;
          }
          .summary { 
            margin: 20px 0;
          }
          .kpi-table { 
            width: 100%;
            margin: 15px 0;
          }
          .kpi-table td {
            padding: 10px;
            border: 1px solid #ccc;
          }
          .kpi-label {
            font-weight: bold;
            background-color: #f9f9f9;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>PT. SAMUDERA BERKAH SENTOSA</h1>
          <h2>${title}</h2>
          <p>Tanggal: ${new Date().toLocaleDateString('id-ID')}</p>
        </div>
        
        <div class="summary">
          <h3>Ringkasan Eksekutif</h3>
          <table class="kpi-table">
            <tr>
              <td class="kpi-label">Total Pengiriman</td>
              <td>${data?.summary?.totalDeliveries || 0}</td>
              <td class="kpi-label">Total Berat</td>
              <td>${data?.summary?.totalWeight || 0} kg</td>
            </tr>
            <tr>
              <td class="kpi-label">Total Revenue</td>
              <td>Rp ${(data?.summary?.totalRevenue || 0).toLocaleString('id-ID')}</td>
              <td class="kpi-label">On-Time Delivery</td>
              <td>${data?.summary?.onTimeDelivery || 0}%</td>
            </tr>
          </table>
        </div>

        <div class="details">
          <h3>Detail Pengiriman</h3>
          <table>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>No. Surat Jalan</th>
                <th>Tujuan</th>
                <th>Kendaraan</th>
                <th>Sopir</th>
                <th>Berat (kg)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${(data?.details?.deliveries || []).slice(0, 50).map((d: any) => `
                <tr>
                  <td>${d.date || '-'}</td>
                  <td>${d.deliveryNoteNumber || '-'}</td>
                  <td>${d.destination || '-'}</td>
                  <td>${d.vehiclePlate || '-'}</td>
                  <td>${d.driverName || '-'}</td>
                  <td>${d.netWeight || 0}</td>
                  <td>${d.status || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="footer">
          <p><strong>Sistem Surat Jalan - PT. SAMUDERA BERKAH SENTOSA</strong></p>
          <p>Laporan dibuat otomatis pada ${new Date().toLocaleString('id-ID')}</p>
        </div>
      </body>
      </html>
    `;
    
    exportToPDFViaPrint(title, simpleHtml);
    
  } catch (error) {
    console.error('❌ Error creating simple PDF:', error);
    alert('Gagal membuat PDF sederhana');
  }
}

/**
 * Alternative PDF export using browser's built-in PDF generation
 * @param title - Document title for the PDF
 * @param htmlContent - Complete HTML content to convert to PDF
 */
export function exportToPDFViaPrint(title: string, htmlContent: string): void {
  try {
    // Create enhanced HTML with PDF-specific CSS
    const pdfHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          @media print {
            @page {
              size: A4;
              margin: 15mm;
            }
            body {
              font-family: Arial, sans-serif;
              font-size: 12px;
              line-height: 1.4;
              color: #000;
              background: white;
            }
            .no-print {
              display: none !important;
            }
            table {
              page-break-inside: avoid;
              border-collapse: collapse;
              width: 100%;
            }
            th, td {
              border: 1px solid #000;
              padding: 4px 8px;
              text-align: left;
            }
            th {
              background-color: #f0f0f0 !important;
              font-weight: bold;
            }
            h1, h2, h3 {
              page-break-after: avoid;
            }
            .page-break {
              page-break-before: always;
            }
          }
          @media screen {
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              background: white;
            }
            .print-instruction {
              background: #e3f2fd;
              border: 1px solid #2196f3;
              padding: 15px;
              margin-bottom: 20px;
              border-radius: 4px;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-instruction no-print">
          <strong>📄 Untuk menyimpan sebagai PDF:</strong><br>
          1. Tekan Ctrl+P atau klik Print<br>
          2. Pilih "Save as PDF" atau "Microsoft Print to PDF"<br>
          3. Klik Save/Print
        </div>
        ${htmlContent.replace(/<script[^>]*>.*?<\/script>/gs, '').replace(/<!--[^>]*-->/g, '')}
        <script>
          // Auto-trigger print dialog after page loads
          window.addEventListener('load', function() {
            setTimeout(function() {
              window.print();
            }, 500);
          });
        </script>
      </body>
      </html>
    `;
    
    // Open in new window
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (!printWindow) {
      throw new Error('Tidak dapat membuka jendela cetak. Pastikan popup diizinkan.');
    }

    printWindow.document.write(pdfHtml);
    printWindow.document.close();
    
    console.log('✅ PDF print dialog opened successfully');
    
  } catch (error) {
    console.error('❌ Error opening PDF print dialog:', error);
    alert(`Gagal membuka dialog PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Export content to PDF file using html2pdf library
 * @param title - Document title for the PDF filename
 * @param htmlContent - Complete HTML content to convert to PDF
 */
export async function exportToPDF(title: string, htmlContent: string): Promise<boolean> {
  console.log('🔄 Starting PDF generation for:', title);
  
  try {
    // Check if we're in browser environment
    if (typeof window === 'undefined') {
      throw new Error('PDF generation only works in browser environment');
    }

    // Try to load html2pdf library
    let html2pdf: any;
    
    try {
      // First try to import from window (if already loaded)
      html2pdf = (window as any).html2pdf;
      
      if (!html2pdf) {
        console.log('📦 Loading html2pdf library...');
        // Dynamic import as fallback
        // @ts-ignore - html2pdf.js doesn't have proper TypeScript declarations
        const module = await import('html2pdf.js');
        html2pdf = module.default || module;
      }
      
      if (!html2pdf) {
        throw new Error('html2pdf library not available');
      }
      
    } catch (importError) {
      console.error('❌ Failed to load html2pdf:', importError);
      throw new Error('Failed to load PDF library');
    }
    
    // Remove the auto-print script and clean HTML
    const cleanHtmlContent = htmlContent
      .replace(/<script>window\.addEventListener\('load'[^<]*<\/script>/g, '')
      .replace(/<!--[^>]*-->/g, '') // Remove comments too
      .replace(/display:\s*grid[^;]*;/g, 'display: block;') // Replace CSS Grid with block
      .replace(/grid-template-columns[^;]*;/g, '') // Remove grid properties
      .replace(/display:\s*flex[^;]*;/g, 'display: block;'); // Replace Flexbox with block
    
    console.log('🧹 HTML cleaned and CSS fixed for PDF compatibility...');
    
    // Create a more compatible HTML structure
    const pdfCompatibleHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            background: white;
            color: black;
            font-size: 12px;
            line-height: 1.4;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 10px 0;
          }
          th, td { 
            border: 1px solid #000; 
            padding: 6px 8px; 
            text-align: left;
            vertical-align: top;
          }
          th { 
            background-color: #f0f0f0; 
            font-weight: bold;
          }
          h1, h2, h3 { 
            color: #000; 
            margin: 10px 0;
          }
          .kpi-grid { 
            width: 100%;
            margin: 15px 0;
          }
          .kpi { 
            border: 1px solid #000; 
            padding: 8px; 
            margin: 5px 0;
            background: #f9f9f9;
          }
          .header { 
            text-align: center; 
            border-bottom: 2px solid #000; 
            padding-bottom: 10px; 
            margin-bottom: 20px;
          }
          .section { 
            margin: 20px 0; 
          }
          .footer { 
            margin-top: 30px; 
            padding-top: 10px; 
            border-top: 1px solid #000;
          }
        </style>
      </head>
      <body>
        ${cleanHtmlContent.replace(/<body[^>]*>|<\/body>|<html[^>]*>|<\/html>|<head[^>]*>.*?<\/head>/gs, '')}
      </body>
      </html>
    `;
    
    console.log('📄 Creating PDF-compatible HTML structure...');
    
    // Create a temporary div to hold the content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = pdfCompatibleHtml;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    tempDiv.style.width = '210mm'; // A4 width
    tempDiv.style.backgroundColor = 'white';
    document.body.appendChild(tempDiv);
    
    // Configure PDF options
    const filename = `${title.replace(/[^a-z0-9\s]/gi, '_').toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
    
    const options = {
      margin: 15, // Simple margin in mm
      filename: filename,
      image: { 
        type: 'jpeg', 
        quality: 0.8 
      },
      html2canvas: { 
        scale: 1,
        useCORS: false,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 794, // A4 width in pixels at 96 DPI
        height: 1123 // A4 height in pixels at 96 DPI
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait'
      }
    };
    
    console.log('📄 Generating PDF with options:', options);
    console.log('📋 HTML content preview:', tempDiv.innerHTML.substring(0, 500) + '...');
    console.log('📏 Element dimensions:', {
      width: tempDiv.offsetWidth,
      height: tempDiv.offsetHeight,
      scrollHeight: tempDiv.scrollHeight
    });
    
    // Wait a moment for rendering
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Generate and download PDF
    await html2pdf().set(options).from(tempDiv).save();
    
    // Cleanup
    document.body.removeChild(tempDiv);
    
    console.log('✅ PDF berhasil digenerate dan didownload:', filename);
    return true;
    
  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Show user-friendly error message
    alert(`Gagal membuat PDF: ${error instanceof Error ? error.message : 'Unknown error'}. Menggunakan print dialog sebagai alternatif.`);
    
    // Fallback to enhanced print dialog with PDF instructions
    console.log('🔄 Fallback ke enhanced print dialog...');
    exportToPDFViaPrint(title, htmlContent);
    return false;
  }
}

/**
 * Export content to printable HTML and trigger print dialog
 * @param _title - Document title (unused but kept for compatibility)
 * @param htmlContent - Complete HTML content to print
 */
export function exportToPrintableHTML(_title: string, htmlContent: string): void {
  try {
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (!printWindow) {
      throw new Error('Tidak dapat membuka jendela cetak. Pastikan popup diizinkan.');
    }

    // Write the HTML content to the new window
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Wait for content to load, then print
    printWindow.onload = () => {
      setTimeout(() => {
        try {
          printWindow.focus();
          printWindow.print();
          
          // Close window after printing (with delay to allow print dialog)
          setTimeout(() => {
            printWindow.close();
          }, 1000);
        } catch (printError) {
          console.error('Error during printing:', printError);
          alert('Gagal mencetak dokumen. Pastikan printer tersedia.');
        }
      }, 500);
    };

    // Fallback: if onload doesn't fire, try printing anyway
    setTimeout(() => {
      try {
        printWindow.focus();
        printWindow.print();
        setTimeout(() => printWindow.close(), 1000);
      } catch (fallbackError) {
        console.error('Fallback print error:', fallbackError);
        printWindow.close();
      }
    }, 2000);

  } catch (error) {
    console.error('Error creating print window:', error);
    alert(`Gagal menyiapkan dokumen untuk dicetak: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Export data to CSV format with proper error handling and data sanitization
 * @param data - Array of objects to export
 * @param filename - Name of the CSV file (without extension)
 * @returns Promise<boolean> - Success status
 */
export function exportToCSV(data: Record<string, any>[], filename: string): Promise<boolean> {
  return new Promise((resolve) => {
    // Input validation
    if (!data || !Array.isArray(data)) {
      console.error('Invalid data provided to exportToCSV:', data);
      alert('Data tidak valid untuk diekspor');
      resolve(false);
      return;
    }

    if (data.length === 0) {
      console.warn('Empty data array provided to exportToCSV');
      alert('Tidak ada data untuk diekspor');
      resolve(false);
      return;
    }

    if (!filename || typeof filename !== 'string' || filename.trim() === '') {
      console.error('Invalid filename provided to exportToCSV:', filename);
      alert('Nama file tidak valid');
      resolve(false);
      return;
    }

    try {
      // Sanitize filename
      const sanitizedFilename = filename.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
      
      // Get headers from first object, with fallback
      const firstRow = data[0];
      if (!firstRow || typeof firstRow !== 'object') {
        throw new Error('Data format tidak valid - baris pertama bukan object');
      }
      
      const headers = Object.keys(firstRow);
      if (headers.length === 0) {
        throw new Error('Tidak ada kolom yang ditemukan dalam data');
      }
      
      // Enhanced CSV value sanitization
      const sanitizeCSVValue = (value: any): string => {
        if (value === null || value === undefined) {
          return '';
        }
        
        let stringValue = String(value);
        
        // Handle special characters that need escaping
        if (stringValue.includes(',') || 
            stringValue.includes('"') || 
            stringValue.includes('\n') || 
            stringValue.includes('\r') || 
            stringValue.includes(';')) {
          // Escape quotes by doubling them
          stringValue = stringValue.replace(/"/g, '""');
          // Wrap in quotes
          return `"${stringValue}"`;
        }
        
        return stringValue;
      };
      
      // Create CSV content with proper sanitization
      const csvContent = [
        // Headers (also sanitize header names)
        headers.map(header => sanitizeCSVValue(header)).join(','),
        // Data rows
        ...data.map((row, index) => {
          try {
            return headers.map(header => {
              const value = row[header];
              return sanitizeCSVValue(value);
            }).join(',');
          } catch (rowError) {
            console.warn(`Error processing row ${index}:`, rowError);
            // Return empty row with correct number of columns
            return headers.map(() => '').join(',');
          }
        })
      ].join('\n');

      // Add BOM for proper UTF-8 encoding in Excel
      const BOM = '\uFEFF';
      const csvWithBOM = BOM + csvContent;

      // Create and download file
      const blob = new Blob([csvWithBOM], { 
        type: 'text/csv;charset=utf-8;' 
      });
      
      // Check if download is supported
      const link = document.createElement('a');
      if (typeof link.download === 'undefined') {
        alert('Browser Anda tidak mendukung download file CSV. Silakan gunakan browser yang lebih baru.');
        resolve(false);
        return;
      }
      
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${sanitizedFilename}.csv`);
      link.style.visibility = 'hidden';
      
      // Add to DOM, click, and cleanup
      document.body.appendChild(link);
      link.click();
      
      // Cleanup with timeout to ensure download starts
      setTimeout(() => {
        try {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } catch (cleanupError) {
          console.warn('Error during cleanup:', cleanupError);
        }
      }, 100);
      
      console.log(`✅ CSV export successful: ${sanitizedFilename}.csv (${data.length} rows)`);
      resolve(true);
      
    } catch (error) {
      console.error('❌ Error exporting to CSV:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Gagal mengekspor data ke CSV: ${errorMessage}`);
      resolve(false);
    }
  });
}

/**
 * Export data to Excel format (HTML table with proper error handling)
 * @param data - Array of objects to export
 * @param filename - Name of the Excel file (without extension)
 * @returns Promise<boolean> - Success status
 */
export function exportToExcel(data: Record<string, any>[], filename: string): Promise<boolean> {
  return new Promise((resolve) => {
    // Input validation (same as CSV)
    if (!data || !Array.isArray(data)) {
      console.error('Invalid data provided to exportToExcel:', data);
      alert('Data tidak valid untuk diekspor');
      resolve(false);
      return;
    }

    if (data.length === 0) {
      console.warn('Empty data array provided to exportToExcel');
      alert('Tidak ada data untuk diekspor');
      resolve(false);
      return;
    }

    if (!filename || typeof filename !== 'string' || filename.trim() === '') {
      console.error('Invalid filename provided to exportToExcel:', filename);
      alert('Nama file tidak valid');
      resolve(false);
      return;
    }

    try {
      // Sanitize filename
      const sanitizedFilename = filename.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
      
      // Get headers with validation
      const firstRow = data[0];
      if (!firstRow || typeof firstRow !== 'object') {
        throw new Error('Data format tidak valid - baris pertama bukan object');
      }
      
      const headers = Object.keys(firstRow);
      if (headers.length === 0) {
        throw new Error('Tidak ada kolom yang ditemukan dalam data');
      }
      
      // HTML sanitization function
      const sanitizeHTML = (value: any): string => {
        if (value === null || value === undefined) {
          return '';
        }
        
        return String(value)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;');
      };
      
      // Create professional Excel HTML with styling
      const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <title>${sanitizeHTML(sanitizedFilename)}</title>
  <style>
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      margin: 20px; 
      color: #1a1a1a; 
      background: white;
    }
    .header { 
      text-align: center; 
      border-bottom: 3px solid #1e40af; 
      padding-bottom: 20px; 
      margin-bottom: 30px;
    }
    .company-name {
      font-size: 24pt;
      font-weight: 900;
      color: #1e40af;
      margin-bottom: 8px;
    }
    .report-title {
      font-size: 18pt;
      font-weight: 700;
      color: #1e40af;
      margin-bottom: 10px;
    }
    .report-meta {
      font-size: 10pt;
      color: #64748b;
      margin-bottom: 20px;
    }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin: 20px 0;
      font-size: 10pt;
    }
    thead {
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      color: white;
    }
    th {
      padding: 12px 8px;
      text-align: left;
      font-weight: 600;
      font-size: 9pt;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      border: none;
    }
    td {
      padding: 10px 8px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: top;
    }
    tbody tr:nth-child(even) {
      background: #f8fafc;
    }
    tbody tr:hover {
      background: #e2e8f0;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
      text-align: center;
      font-size: 9pt;
      color: #64748b;
    }
    @media print {
      body { margin: 0; padding: 15mm; }
      table { font-size: 9pt; }
      th, td { padding: 6px 4px; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">PT. SAMUDERA BERKAH SENTOSA</div>
    <div class="report-title">${sanitizeHTML(sanitizedFilename)}</div>
    <div class="report-meta">
      <strong>Diekspor pada:</strong> ${new Date().toLocaleString('id-ID')} | 
      <strong>Total Data:</strong> ${data.length} baris
    </div>
  </div>
  
  <table>
    <thead>
      <tr>
        ${headers.map(header => `<th>${sanitizeHTML(header)}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${data.map((row, index) => {
        try {
          return `<tr>${headers.map(header => {
            const value = row[header];
            return `<td>${sanitizeHTML(value)}</td>`;
          }).join('')}</tr>`;
        } catch (rowError) {
          console.warn(`Error processing row ${index}:`, rowError);
          return `<tr>${headers.map(() => '<td></td>').join('')}</tr>`;
        }
      }).join('')}
    </tbody>
  </table>
  
  <div class="footer">
    <p><strong>Sistem Manajemen Surat Jalan - PT. SAMUDERA BERKAH SENTOSA</strong></p>
    <p><em>Confidential & Proprietary - Dokumen ini hanya untuk penggunaan internal perusahaan</em></p>
  </div>
</body>
</html>`;

      // Create and download file
      const blob = new Blob([htmlContent], { 
        type: 'application/vnd.ms-excel;charset=utf-8' 
      });
      
      // Check if download is supported
      const link = document.createElement('a');
      if (typeof link.download === 'undefined') {
        alert('Browser Anda tidak mendukung download file Excel. Silakan gunakan browser yang lebih baru.');
        resolve(false);
        return;
      }
      
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${sanitizedFilename}.xls`);
      link.style.visibility = 'hidden';
      
      // Add to DOM, click, and cleanup
      document.body.appendChild(link);
      link.click();
      
      // Cleanup with timeout
      setTimeout(() => {
        try {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } catch (cleanupError) {
          console.warn('Error during cleanup:', cleanupError);
        }
      }, 100);
      
      console.log(`✅ Excel export successful: ${sanitizedFilename}.xls (${data.length} rows)`);
      resolve(true);
      
    } catch (error) {
      console.error('❌ Error exporting to Excel:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Gagal mengekspor data ke Excel: ${errorMessage}`);
      resolve(false);
    }
  });
}