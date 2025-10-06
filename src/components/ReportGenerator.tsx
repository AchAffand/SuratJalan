import React, { useState, useMemo } from 'react';
import { DeliveryNote } from '../types';
import { formatWeight, formatCurrency } from '../utils/format';
import { 
  FileText, Download, Filter
} from 'lucide-react';
import dayjs from '../lib/dayjs';

interface ReportGeneratorProps {
  notes: DeliveryNote[];
  purchaseOrders: any[];
  onExport: (reportData: any, format: string) => void;
}

interface ReportData {
  summary: {
    totalDeliveries: number;
    totalWeight: number;
    totalRevenue: number;
    averageDeliveryPerDay: number;
    onTimeDeliveryRate: number;
    topDestinations: Array<{ name: string; count: number; weight: number; revenue: number }>;
    vehicleUtilization: Array<{ plate: string; trips: number; totalWeight: number; efficiency: number }>;
    driverPerformance: Array<{ name: string; trips: number; totalWeight: number; avgWeight: number; rating: string }>;
    poPerformance: Array<{ po_number: string; progress: number; remaining: number; value: number }>;
  };
  details: {
    deliveries: DeliveryNote[];
    monthlyBreakdown: Array<{ month: string; deliveries: number; weight: number; revenue: number }>;
    statusBreakdown: { menunggu: number; dalamPerjalanan: number; selesai: number };
    weightDistribution: { under1Ton: number; oneToFiveTon: number; overFiveTon: number };
  };
  metadata: {
    reportDate: string;
    period: string;
    generatedBy: string;
    companyInfo: {
      name: string;
      address: string;
      phone: string;
      email: string;
      website: string;
    };
  };
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({ notes, purchaseOrders, onExport }) => {
  const [reportType, setReportType] = useState<'operational' | 'delivery' | 'vehicle' | 'driver'>('operational');
  const [dateRange, setDateRange] = useState<'all' | 'this-month' | 'last-month' | 'this-year' | 'custom'>('this-month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>([]);
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv'>('excel');
  const [showPreview, setShowPreview] = useState(false);

  const filteredNotes = useMemo(() => {
    let filtered = notes;

    // Filter by date range
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

    // Filter by destinations
    if (selectedDestinations.length > 0) {
      filtered = filtered.filter(note => selectedDestinations.includes(note.destination));
    }

    // Filter by vehicles
    if (selectedVehicles.length > 0) {
      filtered = filtered.filter(note => selectedVehicles.includes(note.vehiclePlate));
    }

    // Filter by drivers
    if (selectedDrivers.length > 0) {
      filtered = filtered.filter(note => selectedDrivers.includes(note.driverName));
    }

    return filtered;
  }, [notes, dateRange, customStartDate, customEndDate, selectedDestinations, selectedVehicles, selectedDrivers]);

  const reportData = useMemo((): ReportData => {
    const totalDeliveries = filteredNotes.length;
    const totalWeight = filteredNotes.reduce((sum, n) => sum + (n.netWeight || 0), 0);
    
    const totalRevenue = filteredNotes.reduce((sum, n) => {
      if (n.poNumber) {
        const po = purchaseOrders.find(p => p.po_number === n.poNumber);
        if (po && n.netWeight) {
          return sum + (n.netWeight * po.price_per_ton);
        }
      }
      return sum;
    }, 0);

    // Calculate average delivery per day based on actual date range
    let averageDeliveryPerDay = 0;
    if (filteredNotes.length > 0) {
      const dates = filteredNotes.map(n => dayjs(n.date)).sort();
      const startDate = dates[0];
      const endDate = dates[dates.length - 1];
      const daysDiff = Math.max(1, endDate.diff(startDate, 'day') + 1);
      averageDeliveryPerDay = totalDeliveries / daysDiff;
    }

    // Calculate on-time delivery rate based on status completion
    const completedDeliveries = filteredNotes.filter(n => n.status === 'selesai').length;
    const onTimeDeliveryRate = totalDeliveries > 0 ? (completedDeliveries / totalDeliveries) * 100 : 0;

    // Top destinations with revenue
    const destinationStats = filteredNotes.reduce((acc, n) => {
      if (!acc[n.destination]) {
        acc[n.destination] = { count: 0, weight: 0, revenue: 0 };
      }
      acc[n.destination].count++;
      acc[n.destination].weight += n.netWeight || 0;
      
      if (n.poNumber) {
        const po = purchaseOrders.find(p => p.po_number === n.poNumber);
        if (po && n.netWeight) {
          acc[n.destination].revenue += n.netWeight * po.price_per_ton;
        }
      }
      return acc;
    }, {} as Record<string, { count: number; weight: number; revenue: number }>);

    const topDestinations = Object.entries(destinationStats)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Vehicle utilization with efficiency
    const vehicleStats = filteredNotes.reduce((acc, n) => {
      if (!acc[n.vehiclePlate]) {
        acc[n.vehiclePlate] = { trips: 0, totalWeight: 0 };
      }
      acc[n.vehiclePlate].trips++;
      acc[n.vehiclePlate].totalWeight += n.netWeight || 0;
      return acc;
    }, {} as Record<string, { trips: number; totalWeight: number }>);

    const vehicleUtilization = Object.entries(vehicleStats)
      .map(([plate, stats]) => ({
        plate,
        ...stats,
        efficiency: (stats.totalWeight / stats.trips) / 5000 * 100 // Assuming 5 ton capacity
      }))
      .sort((a, b) => b.trips - a.trips)
      .slice(0, 10);

    // Driver performance with rating
    const driverStats = filteredNotes.reduce((acc, n) => {
      if (!acc[n.driverName]) {
        acc[n.driverName] = { trips: 0, totalWeight: 0 };
      }
      acc[n.driverName].trips++;
      acc[n.driverName].totalWeight += n.netWeight || 0;
      return acc;
    }, {} as Record<string, { trips: number; totalWeight: number }>);

    const driverPerformance = Object.entries(driverStats)
      .map(([name, stats]) => {
        const avgWeight = stats.totalWeight / stats.trips;
        let rating = 'Good';
        if (avgWeight > 4000) rating = 'Excellent';
        else if (avgWeight < 2000) rating = 'Needs Improvement';
        
        return {
          name,
          ...stats,
          avgWeight,
          rating
        };
      })
      .sort((a, b) => b.trips - a.trips)
      .slice(0, 10);

    // PO Performance Analysis
    const poPerformance = purchaseOrders.map(po => {
      const relatedDeliveries = filteredNotes.filter(n => n.poNumber === po.po_number);
      const shippedWeight = relatedDeliveries.reduce((sum, n) => sum + (n.netWeight || 0), 0);
      const progress = (shippedWeight / po.total_tonnage) * 100;
      
      return {
        po_number: po.po_number,
        progress: Math.min(progress, 100),
        remaining: po.remaining_tonnage,
        value: po.total_value
      };
    }).sort((a, b) => b.progress - a.progress);

    // Monthly breakdown
    const monthlyStats = filteredNotes.reduce((acc, n) => {
      const month = dayjs(n.date).format('MMM YYYY');
      if (!acc[month]) {
        acc[month] = { deliveries: 0, weight: 0, revenue: 0 };
      }
      acc[month].deliveries++;
      acc[month].weight += n.netWeight || 0;
      
      if (n.poNumber) {
        const po = purchaseOrders.find(p => p.po_number === n.poNumber);
        if (po && n.netWeight) {
          acc[month].revenue += n.netWeight * po.price_per_ton;
        }
      }
      return acc;
    }, {} as Record<string, { deliveries: number; weight: number; revenue: number }>);

    const monthlyBreakdown = Object.entries(monthlyStats)
      .map(([month, stats]) => ({ month, ...stats }))
      .sort((a, b) => dayjs(a.month, 'MMM YYYY').valueOf() - dayjs(b.month, 'MMM YYYY').valueOf());

    // Status breakdown
    const statusBreakdown = {
      menunggu: filteredNotes.filter(n => n.status === 'menunggu').length,
      dalamPerjalanan: filteredNotes.filter(n => n.status === 'dalam-perjalanan').length,
      selesai: filteredNotes.filter(n => n.status === 'selesai').length,
    };

    // Weight distribution
    const weightDistribution = {
      under1Ton: filteredNotes.filter(n => (n.netWeight || 0) < 1000).length,
      oneToFiveTon: filteredNotes.filter(n => (n.netWeight || 0) >= 1000 && (n.netWeight || 0) < 5000).length,
      overFiveTon: filteredNotes.filter(n => (n.netWeight || 0) >= 5000).length,
    };

    return {
      summary: {
        totalDeliveries,
        totalWeight,
        totalRevenue,
        averageDeliveryPerDay,
        onTimeDeliveryRate,
        topDestinations,
        vehicleUtilization,
        driverPerformance,
        poPerformance,
      },
      details: {
        deliveries: filteredNotes,
        monthlyBreakdown,
        statusBreakdown,
        weightDistribution,
      },
      metadata: {
        reportDate: dayjs().format('DD MMMM YYYY'),
        period: dateRange === 'custom' && customStartDate && customEndDate
          ? `${dayjs(customStartDate).format('DD MMMM YYYY')} - ${dayjs(customEndDate).format('DD MMMM YYYY')}`
          : dateRange === 'this-month' ? 'Bulan Ini'
          : dateRange === 'last-month' ? 'Bulan Lalu'
          : dateRange === 'this-year' ? 'Tahun Ini'
          : 'Sepanjang Waktu',
        generatedBy: 'Sistem Surat Jalan',
        companyInfo: {
          name: 'PT. SAMUDERA BERKAH SENTOSA',
          address: 'Jl. Kahuripan Nirwana Avenue No.20 Sidoarjo - Jawa Timur',
          phone: '( 031 ) 58281617',
          email: 'admin@idptsbs.com',
          website: 'ptsamuderaberkahsentosa.com',
        },
      },
    };
  }, [filteredNotes, purchaseOrders, dateRange, customStartDate, customEndDate]);

  // Bangun HTML cetak yang meniru pratinjau
  const printableHTML = useMemo(() => {
    const title = (
      reportType === 'operational' ? 'LAPORAN OPERASIONAL SURAT JALAN' :
      reportType === 'delivery' ? 'LAPORAN DETAIL PENGIRIMAN' :
      reportType === 'vehicle' ? 'LAPORAN KINERJA KENDARAAN' :
      'LAPORAN KINERJA SUPIR'
    );
    const subtitle = (
      reportType === 'operational' ? 'Analisis Operasional Harian dan Kinerja Bisnis' :
      reportType === 'delivery' ? 'Analisis Detail Pengiriman dan Status' :
      reportType === 'vehicle' ? 'Analisis Efisiensi dan Utilisasi Kendaraan' :
      'Analisis Kinerja dan Produktivitas Supir'
    );
    const style = `
      * {
        box-sizing: border-box;
      }
      body { 
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
        color: #1a1a1a; 
        margin: 0;
        padding: 20mm;
        background: white;
        line-height: 1.5;
        font-size: 11pt;
      }
      
      /* Header Styles */
      .header { 
        text-align: center; 
        border-bottom: 3px solid #1e40af; 
        padding-bottom: 20px; 
        margin-bottom: 30px;
        position: relative;
      }
      .company-logo {
        font-size: 28pt;
        font-weight: 900;
        color: #1e40af;
        margin-bottom: 8px;
        letter-spacing: 1px;
      }
      .company-tagline {
        font-size: 10pt;
        color: #64748b;
        margin-bottom: 15px;
        font-style: italic;
      }
      .company-address {
        font-size: 9pt;
        color: #64748b;
        line-height: 1.3;
      }
      
      /* Report Title */
      .report-title {
        background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
        color: white;
        padding: 20px;
        margin: 30px 0;
        text-align: center;
        border-radius: 8px;
      }
      .report-title h1 {
        font-size: 20pt;
        margin: 0 0 8px 0;
        font-weight: 700;
        letter-spacing: 0.5px;
      }
      .report-subtitle {
        font-size: 12pt;
        margin: 0 0 10px 0;
        opacity: 0.9;
      }
      .report-meta {
        font-size: 10pt;
        opacity: 0.8;
        border-top: 1px solid rgba(255,255,255,0.3);
        padding-top: 10px;
        margin-top: 10px;
      }
      
      /* Section Styles */
      .section { 
        margin: 25px 0; 
        page-break-inside: avoid;
      }
      .section-header {
        background: #f8fafc;
        border-left: 4px solid #1e40af;
        padding: 12px 16px;
        margin-bottom: 15px;
        border-radius: 0 6px 6px 0;
      }
      .section-title {
        font-size: 14pt;
        font-weight: 700;
        color: #1e40af;
        margin: 0;
        display: flex;
        align-items: center;
      }
      .section-icon {
        margin-right: 8px;
        font-size: 16pt;
      }
      
      /* KPI Grid */
      .kpi-container {
        display: table;
        width: 100%;
        margin: 20px 0;
        border-collapse: separate;
        border-spacing: 10px;
      }
      .kpi-row {
        display: table-row;
      }
      .kpi-card {
        display: table-cell;
        width: 25%;
        border: 2px solid #1e40af;
        border-radius: 8px;
        padding: 15px;
        background: #f8fafc;
        text-align: center;
        vertical-align: top;
      }
      .kpi-label {
        font-size: 9pt;
        color: #1e40af;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 8px;
        display: block;
      }
      .kpi-value {
        font-size: 16pt;
        font-weight: 800;
        color: #1e40af;
        margin-bottom: 6px;
        display: block;
      }
      .kpi-desc {
        font-size: 8pt;
        color: #64748b;
        font-style: italic;
        display: block;
      }
      
      /* Table Styles */
      .table-container {
        margin: 20px 0;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      table { 
        width: 100%;
        border-collapse: collapse;
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
      
      /* Analysis Sections */
      .analysis-grid {
        display: table;
        width: 100%;
        margin: 25px 0;
        border-collapse: separate;
        border-spacing: 15px;
      }
      .analysis-row {
        display: table-row;
      }
      .analysis-card {
        display: table-cell;
        width: 33.33%;
        border: 2px solid #e2e8f0;
        border-radius: 8px;
        padding: 16px;
        background: white;
        vertical-align: top;
      }
      .analysis-title {
        font-size: 11pt;
        font-weight: 700;
        color: #1e40af;
        margin-bottom: 12px;
        text-align: center;
        border-bottom: 2px solid #1e40af;
        padding-bottom: 8px;
      }
      .metric-row {
        margin: 8px 0;
        padding: 6px 0;
        border-bottom: 1px solid #f1f5f9;
      }
      .metric-label {
        font-size: 9pt;
        color: #64748b;
        display: block;
        margin-bottom: 4px;
      }
      .metric-value {
        font-size: 10pt;
        font-weight: 600;
        color: #1a1a1a;
        display: block;
        text-align: right;
      }
      
      /* Footer */
      .footer {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 2px solid #e2e8f0;
      }
      .footer-grid {
        display: table;
        width: 100%;
        border-collapse: separate;
        border-spacing: 20px;
      }
      .footer-row {
        display: table-row;
      }
      .footer-section {
        display: table-cell;
        width: 50%;
        padding: 16px;
        background: #f8fafc;
        border-radius: 6px;
        border-left: 4px solid #1e40af;
        vertical-align: top;
      }
      .footer-title {
        font-size: 10pt;
        font-weight: 700;
        color: #1e40af;
        margin-bottom: 8px;
      }
      .footer-content {
        font-size: 9pt;
        color: #64748b;
        line-height: 1.4;
      }
      
      /* Print Optimization */
      @media print {
        body { 
          margin: 0;
          padding: 12mm;
          font-size: 9pt;
          line-height: 1.3;
        }
        .no-print { 
          display: none !important; 
        }
        .section {
          page-break-inside: avoid;
          margin: 15px 0;
        }
        .kpi-container {
          border-spacing: 5px;
        }
        .kpi-card {
          padding: 10px;
          font-size: 8pt;
        }
        .kpi-value {
          font-size: 14pt;
        }
        .analysis-grid {
          border-spacing: 10px;
        }
        .analysis-card {
          padding: 12px;
        }
        .footer-grid {
          border-spacing: 15px;
        }
        table {
          font-size: 8pt;
        }
        th, td {
          padding: 6px 4px;
        }
        @page {
          margin: 12mm;
          size: A4 portrait;
        }
      }
      
      /* Responsive adjustments for screen */
      @media screen and (max-width: 768px) {
        .kpi-container,
        .analysis-grid,
        .footer-grid {
          display: block;
        }
        .kpi-card,
        .analysis-card,
        .footer-section {
          display: block;
          width: 100%;
          margin-bottom: 15px;
        }
      }
    `;


    // Calculate additional metrics for professional report with error handling
    const avgDeliveryValue = reportData.summary.totalDeliveries > 0 ? 
      reportData.summary.totalRevenue / reportData.summary.totalDeliveries : 0;
    const avgTonnagePerDelivery = reportData.summary.totalDeliveries > 0 ? 
      reportData.summary.totalWeight / reportData.summary.totalDeliveries : 0;
    const completionRate = reportData.summary.totalDeliveries > 0 ? 
      (reportData.details.statusBreakdown.selesai / reportData.summary.totalDeliveries) * 100 : 0;
    
    // Safe slicing with fallback for empty arrays
    const topDestinationsAnalysis = reportData.summary.topDestinations.slice(0, 5);
    const vehicleEfficiency = reportData.summary.vehicleUtilization.slice(0, 5);
    const driverPerformance = reportData.summary.driverPerformance.slice(0, 5);

    return `
      <!DOCTYPE html>
      <html lang="id">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>${title} - ${reportData.metadata.companyInfo.name}</title>
          <style>${style}</style>
        </head>
        <body>
          <!-- Company Header -->
          <div class="header">
            <div class="company-logo">${reportData.metadata.companyInfo.name}</div>
            <div class="company-tagline">Sistem Manajemen Logistik & Surat Jalan</div>
            <div class="company-address">
              ${reportData.metadata.companyInfo.address}<br>
              Telp: ${reportData.metadata.companyInfo.phone} | Email: ${reportData.metadata.companyInfo.email}<br>
              Website: ${reportData.metadata.companyInfo.website}
            </div>
          </div>

          <!-- Report Title Section -->
          <div class="report-title">
            <h1>${title}</h1>
            <div class="report-subtitle">${subtitle}</div>
            <div class="report-meta">
              <strong>Periode Laporan:</strong> ${reportData.metadata.period} | 
              <strong>Tanggal Dibuat:</strong> ${reportData.metadata.reportDate} | 
              <strong>Dibuat oleh:</strong> ${reportData.metadata.generatedBy}
            </div>
          </div>

          <!-- Executive Summary -->
          <div class="section">
            <div class="section-header">
              <h2 class="section-title">
                <span class="section-icon">📊</span>
                RINGKASAN EKSEKUTIF
              </h2>
            </div>
            <div class="kpi-container">
              <div class="kpi-row">
                <div class="kpi-card">
                  <div class="kpi-label">Total Pengiriman</div>
                  <div class="kpi-value">${reportData.summary.totalDeliveries.toLocaleString('id-ID')}</div>
                  <div class="kpi-desc">Surat jalan yang diproses</div>
                </div>
                <div class="kpi-card">
                  <div class="kpi-label">Total Tonase</div>
                  <div class="kpi-value">${formatWeight(reportData.summary.totalWeight)}</div>
                  <div class="kpi-desc">Berat bersih keseluruhan</div>
                </div>
                <div class="kpi-card">
                  <div class="kpi-label">Total Revenue</div>
                  <div class="kpi-value">${formatCurrency(reportData.summary.totalRevenue)}</div>
                  <div class="kpi-desc">Nilai bisnis yang dihasilkan</div>
                </div>
                <div class="kpi-card">
                  <div class="kpi-label">Tingkat Penyelesaian</div>
                  <div class="kpi-value">${completionRate.toFixed(1)}%</div>
                  <div class="kpi-desc">Pengiriman yang selesai</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Key Performance Indicators -->
          <div class="section">
            <div class="section-header">
              <h2 class="section-title">
                <span class="section-icon">🎯</span>
                INDIKATOR KINERJA UTAMA
              </h2>
            </div>
            <div class="analysis-grid">
              <div class="analysis-row">
                <div class="analysis-card">
                  <div class="analysis-title">📈 Efisiensi Operasional</div>
                  <div class="metric-row">
                    <div class="metric-label">Rata-rata Pengiriman/Hari:</div>
                    <div class="metric-value">${reportData.summary.averageDeliveryPerDay.toFixed(1)}</div>
                  </div>
                  <div class="metric-row">
                    <div class="metric-label">Rata-rata Tonase/Pengiriman:</div>
                    <div class="metric-value">${(avgTonnagePerDelivery / 1000).toFixed(2)} ton</div>
                  </div>
                  <div class="metric-row">
                    <div class="metric-label">Nilai Rata-rata/Pengiriman:</div>
                    <div class="metric-value">${formatCurrency(avgDeliveryValue)}</div>
                  </div>
                </div>
                <div class="analysis-card">
                  <div class="analysis-title">🚛 Status Kendaraan</div>
                  <div class="metric-row">
                    <div class="metric-label">Total Kendaraan Tersedia:</div>
                    <div class="metric-value">${vehicleEfficiency.length}</div>
                  </div>
                  <div class="metric-row">
                    <div class="metric-label">Total Trip Selesai:</div>
                    <div class="metric-value">${vehicleEfficiency.reduce((sum, v) => sum + v.trips, 0)}</div>
                  </div>
                  <div class="metric-row">
                    <div class="metric-label">Total Tonase Diangkut:</div>
                    <div class="metric-value">${(vehicleEfficiency.reduce((sum, v) => sum + v.totalWeight, 0) / 1000).toFixed(1)} ton</div>
                  </div>
                </div>
                <div class="analysis-card">
                  <div class="analysis-title">👥 Status SDM</div>
                  <div class="metric-row">
                    <div class="metric-label">Total Sopir Tersedia:</div>
                    <div class="metric-value">${driverPerformance.length}</div>
                  </div>
                  <div class="metric-row">
                    <div class="metric-label">Total Trip Dikerjakan:</div>
                    <div class="metric-value">${driverPerformance.reduce((sum, d) => sum + d.trips, 0)}</div>
                  </div>
                  <div class="metric-row">
                    <div class="metric-label">Total Tonase Dikirim:</div>
                    <div class="metric-value">${(driverPerformance.reduce((sum, d) => sum + d.totalWeight, 0) / 1000).toFixed(1)} ton</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Top Destinations Analysis -->
          <div class="section">
            <div class="section-header">
              <h2 class="section-title">
                <span class="section-icon">🗺️</span>
                ANALISIS TUJUAN PENGIRIMAN TERATAS
              </h2>
            </div>
            <div class="table-container">
            <table>
              <thead>
                <tr>
                    <th>Ranking</th>
                    <th>Tujuan Pengiriman</th>
                    <th>Jumlah Pengiriman</th>
                    <th>Total Tonase</th>
                    <th>Total Revenue</th>
                    <th>Persentase</th>
                    <th>Rata-rata per Pengiriman</th>
                </tr>
              </thead>
                <tbody>
                  ${topDestinationsAnalysis.length > 0 ? topDestinationsAnalysis.map((dest, index) => `
                    <tr>
                      <td><strong>#${index + 1}</strong></td>
                      <td><strong>${dest.name}</strong></td>
                      <td>${dest.count.toLocaleString('id-ID')} pengiriman</td>
                      <td>${formatWeight(dest.weight)}</td>
                      <td>${formatCurrency(dest.revenue)}</td>
                      <td>${reportData.summary.totalDeliveries > 0 ? ((dest.count / reportData.summary.totalDeliveries) * 100).toFixed(1) : 0}%</td>
                      <td>${dest.count > 0 ? formatWeight(dest.weight / dest.count) : '0 kg'}</td>
                    </tr>
                  `).join('') : `
                    <tr>
                      <td colspan="7" style="text-align: center; color: #6b7280; font-style: italic;">
                        Tidak ada data tujuan pengiriman untuk periode ini
                      </td>
                    </tr>
                  `}
                </tbody>
            </table>
            </div>
          </div>

          <!-- Monthly Performance Trend -->
          <div class="section">
            <div class="section-header">
              <h2 class="section-title">
                <span class="section-icon">📈</span>
                TREN KINERJA BULANAN
              </h2>
            </div>
            <div class="table-container">
            <table>
              <thead>
                <tr>
                    <th>Periode</th>
                    <th>Total Pengiriman</th>
                    <th>Total Tonase</th>
                    <th>Total Revenue</th>
                    <th>Rata-rata Harian</th>
                    <th>Growth Rate</th>
                </tr>
              </thead>
                <tbody>
                  ${reportData.details.monthlyBreakdown.length > 0 ? reportData.details.monthlyBreakdown.map((month, index) => {
                    const prevMonth = reportData.details.monthlyBreakdown[index - 1];
                    const growthRate = prevMonth && prevMonth.deliveries > 0 ? 
                      ((month.deliveries - prevMonth.deliveries) / prevMonth.deliveries * 100) : 0;
                    return `
                      <tr>
                        <td><strong>${month.month}</strong></td>
                        <td>${month.deliveries.toLocaleString('id-ID')}</td>
                        <td>${formatWeight(month.weight)}</td>
                        <td>${formatCurrency(month.revenue)}</td>
                        <td>${(month.deliveries / 30).toFixed(1)}</td>
                        <td style="color: ${growthRate >= 0 ? '#059669' : '#dc2626'}">
                          ${growthRate >= 0 ? '+' : ''}${growthRate.toFixed(1)}%
                        </td>
                      </tr>
                    `;
                  }).join('') : `
                    <tr>
                      <td colspan="6" style="text-align: center; color: #6b7280; font-style: italic;">
                        Tidak ada data bulanan untuk periode ini
                      </td>
                    </tr>
                  `}
                </tbody>
            </table>
            </div>
          </div>

          <!-- Vehicle Performance Analysis -->
          <div class="section">
            <div class="section-header">
              <h2 class="section-title">
                <span class="section-icon">🚛</span>
                ANALISIS KINERJA KENDARAAN
              </h2>
            </div>
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Ranking</th>
                    <th>Plat Nomor</th>
                    <th>Total Trip</th>
                    <th>Total Tonase</th>
                    <th>Rata-rata per Trip</th>
                    <th>Efisiensi</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${vehicleEfficiency.length > 0 ? vehicleEfficiency.map((vehicle, index) => `
                    <tr>
                      <td><strong>#${index + 1}</strong></td>
                      <td><strong>${vehicle.plate}</strong></td>
                      <td>${vehicle.trips.toLocaleString('id-ID')}</td>
                      <td>${formatWeight(vehicle.totalWeight)}</td>
                      <td>${vehicle.trips > 0 ? formatWeight(vehicle.totalWeight / vehicle.trips) : '0 kg'}</td>
                      <td>${vehicle.efficiency.toFixed(1)}%</td>
                      <td>
                        <span style="color: ${vehicle.efficiency >= 80 ? '#059669' : vehicle.efficiency >= 60 ? '#d97706' : '#dc2626'}">
                          ${vehicle.efficiency >= 80 ? 'Excellent' : vehicle.efficiency >= 60 ? 'Good' : 'Needs Improvement'}
                        </span>
                      </td>
                    </tr>
                  `).join('') : `
                    <tr>
                      <td colspan="7" style="text-align: center; color: #6b7280; font-style: italic;">
                        Tidak ada data kendaraan untuk periode ini
                      </td>
                    </tr>
                  `}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <div class="footer-grid">
              <div class="footer-row">
                <div class="footer-section">
                  <div class="footer-title">📋 Informasi Laporan</div>
                  <div class="footer-content">
                    <strong>Disiapkan oleh:</strong> ${reportData.metadata.generatedBy}<br>
                    <strong>Tanggal Pembuatan:</strong> ${reportData.metadata.reportDate}<br>
                    <strong>Periode Data:</strong> ${reportData.metadata.period}<br>
                    <strong>Total Data Diproses:</strong> ${reportData.summary.totalDeliveries.toLocaleString('id-ID')} record
            </div>
                </div>
                <div class="footer-section">
                  <div class="footer-title">🏢 Informasi Perusahaan</div>
                  <div class="footer-content">
                    <strong>${reportData.metadata.companyInfo.name}</strong><br>
                    ${reportData.metadata.companyInfo.address}<br>
                    Telp: ${reportData.metadata.companyInfo.phone}<br>
                    Email: ${reportData.metadata.companyInfo.email}
                  </div>
                </div>
              </div>
            </div>
            <div style="text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 9pt; color: #64748b;">
              <em>Laporan ini dibuat secara otomatis oleh Sistem Manajemen Surat Jalan - ${reportData.metadata.companyInfo.name}</em><br>
              <strong>Confidential & Proprietary</strong> - Dokumen ini hanya untuk penggunaan internal perusahaan
            </div>
          </div>

          <!-- Print Instructions -->
          <div class="no-print" style="position: fixed; top: 15px; right: 15px; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 15px; border-radius: 10px; z-index: 1000; font-size: 11pt; max-width: 280px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
            <div style="font-weight: 700; margin-bottom: 8px;">📄 Panduan Ekspor PDF</div>
            <div style="font-size: 9pt; line-height: 1.4;">
              <strong>1.</strong> Tekan <kbd style="background: rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 3px;">Ctrl+P</kbd> (Windows) atau <kbd style="background: rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 3px;">Cmd+P</kbd> (Mac)<br>
              <strong>2.</strong> Pilih "Save as PDF" atau "Microsoft Print to PDF"<br>
              <strong>3.</strong> Atur orientasi ke <strong>Portrait</strong><br>
              <strong>4.</strong> Klik <strong>Save/Print</strong>
            </div>
            <div style="margin-top: 8px; font-size: 8pt; opacity: 0.8; font-style: italic;">
              Dialog print akan terbuka otomatis dalam 2 detik
            </div>
          </div>

          <script>
            // Enhanced auto-print with better timing
            window.addEventListener('load', function() {
              // Wait for fonts and styles to load
              setTimeout(function() {
                console.log('🖨️ Opening print dialog for professional report...');
                window.print();
              }, 2000);
            });
            
            // Optimize print styles dynamically
            const printOptimization = document.createElement('style');
            printOptimization.textContent = \`
              @media print {
                * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
                .no-print { display: none !important; }
                body { margin: 0 !important; padding: 10mm !important; font-size: 9pt !important; }
                .kpi-container, .analysis-grid, .footer-grid { 
                  border-spacing: 5px !important; 
                }
                .kpi-card, .analysis-card, .footer-section { 
                  padding: 8px !important; 
                  border: 1px solid #1e40af !important;
                }
                .section { 
                  page-break-inside: avoid !important; 
                  margin: 10px 0 !important;
                }
                table { 
                  page-break-inside: avoid !important; 
                  font-size: 8pt !important;
                }
                th, td {
                  padding: 4px !important;
                }
                @page { 
                  margin: 10mm !important; 
                  size: A4 portrait !important; 
                }
              }
            \`;
            document.head.appendChild(printOptimization);
          </script>
        </body>
      </html>
    `;
  }, [reportData, reportType]);

  const handleExport = () => {
    onExport({ ...reportData, printableHTML }, exportFormat);
  };

  const getReportTitle = () => {
    switch (reportType) {
      case 'operational': return 'LAPORAN OPERASIONAL SURAT JALAN';
      case 'delivery': return 'LAPORAN DETAIL PENGIRIMAN';
      case 'vehicle': return 'LAPORAN KINERJA KENDARAAN';
      case 'driver': return 'LAPORAN KINERJA SUPIR';
      default: return 'LAPORAN OPERASIONAL';
    }
  };

  const getReportSubtitle = () => {
    switch (reportType) {
      case 'operational': return 'Analisis Operasional Harian dan Kinerja Bisnis';
      case 'delivery': return 'Analisis Detail Pengiriman dan Status';
      case 'vehicle': return 'Analisis Efisiensi dan Utilisasi Kendaraan';
      case 'driver': return 'Analisis Kinerja dan Produktivitas Supir';
      default: return 'Laporan Operasional';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Generator Laporan</h2>
              <p className="text-gray-600"></p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {showPreview ? 'Sembunyikan Pratinjau' : 'Tampilkan Pratinjau'}
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Ekspor {exportFormat.toUpperCase()}</span>
            </button>
          </div>
        </div>

        {/* Report Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Laporan</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="operational">Laporan Operasional</option>
              <option value="delivery">Laporan Pengiriman</option>
              <option value="vehicle">Laporan Kendaraan</option>
              <option value="driver">Laporan Supir</option>
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

          {/* Custom Date Range */}
          {dateRange === 'custom' && (
            <>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Selesai</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </>
          )}

          {/* Export Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Format Export</label>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
              <option value="csv">CSV</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Filter className="w-5 h-5 mr-2 text-blue-600" />
          Filter Lanjutan
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Destinations */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tujuan Pengiriman</label>
            <select
              multiple
              value={selectedDestinations}
              onChange={(e) => setSelectedDestinations(Array.from(e.target.selectedOptions, option => option.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {Array.from(new Set(notes.map(n => n.destination))).map(dest => (
                <option key={dest} value={dest}>{dest}</option>
              ))}
            </select>
          </div>

          {/* Vehicles */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Kendaraan</label>
            <select
              multiple
              value={selectedVehicles}
              onChange={(e) => setSelectedVehicles(Array.from(e.target.selectedOptions, option => option.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {Array.from(new Set(notes.map(n => n.vehiclePlate))).map(plate => (
                <option key={plate} value={plate}>{plate}</option>
              ))}
            </select>
          </div>

          {/* Drivers */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sopir</label>
            <select
              multiple
              value={selectedDrivers}
              onChange={(e) => setSelectedDrivers(Array.from(e.target.selectedOptions, option => option.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {Array.from(new Set(notes.map(n => n.driverName))).map(driver => (
                <option key={driver} value={driver}>{driver}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Report Preview */}
      {showPreview && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="max-w-4xl mx-auto">
            {/* Company Header */}
            <div className="text-center border-b-4 border-blue-600 pb-6 mb-8">
              <div className="text-3xl font-black text-blue-600 mb-2">{reportData.metadata.companyInfo.name}</div>
              <div className="text-sm text-gray-600 italic mb-4">Sistem Manajemen Logistik & Surat Jalan Terintegrasi</div>
              <div className="text-xs text-gray-600 leading-tight">
                {reportData.metadata.companyInfo.address}<br/>
                Telp: {reportData.metadata.companyInfo.phone} | Email: {reportData.metadata.companyInfo.email}<br/>
                Website: {reportData.metadata.companyInfo.website}
              </div>
            </div>

            {/* Report Title */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-lg text-center mb-8">
              <h1 className="text-2xl font-bold mb-2">{getReportTitle()}</h1>
              <div className="text-sm mb-3">{getReportSubtitle()}</div>
              <div className="text-xs border-t border-blue-400 pt-3 mt-3">
                <strong>Periode Laporan:</strong> {reportData.metadata.period} | 
                <strong> Tanggal Dibuat:</strong> {reportData.metadata.reportDate} | 
                <strong> Dibuat oleh:</strong> {reportData.metadata.generatedBy}
              </div>
            </div>

            {/* Executive Summary */}
            <div className="mb-8">
              <div className="bg-gray-50 border-l-4 border-blue-600 p-3 rounded-r-lg mb-4">
                <h3 className="text-lg font-bold text-blue-600 flex items-center">
                  <span className="mr-2">📊</span>
                RINGKASAN EKSEKUTIF
              </h3>
                    </div>
              <div className="w-full">
                <table className="w-full border-separate" style={{borderSpacing: '10px'}}>
                  <tr>
                    <td className="w-1/4 border-2 border-blue-600 rounded-lg p-4 bg-blue-50 text-center">
                      <div className="text-xs font-bold text-blue-600 uppercase mb-2">Total Pengiriman</div>
                      <div className="text-xl font-bold text-blue-600 mb-1">{reportData.summary.totalDeliveries.toLocaleString('id-ID')}</div>
                      <div className="text-xs text-gray-600">Surat jalan yang diproses</div>
                    </td>
                    <td className="w-1/4 border-2 border-blue-600 rounded-lg p-4 bg-blue-50 text-center">
                      <div className="text-xs font-bold text-blue-600 uppercase mb-2">Total Tonase</div>
                      <div className="text-xl font-bold text-blue-600 mb-1">{formatWeight(reportData.summary.totalWeight)}</div>
                      <div className="text-xs text-gray-600">Berat bersih keseluruhan</div>
                    </td>
                    <td className="w-1/4 border-2 border-blue-600 rounded-lg p-4 bg-blue-50 text-center">
                      <div className="text-xs font-bold text-blue-600 uppercase mb-2">Total Revenue</div>
                      <div className="text-xl font-bold text-blue-600 mb-1">{formatCurrency(reportData.summary.totalRevenue)}</div>
                      <div className="text-xs text-gray-600">Nilai bisnis yang dihasilkan</div>
                    </td>
                    <td className="w-1/4 border-2 border-blue-600 rounded-lg p-4 bg-blue-50 text-center">
                      <div className="text-xs font-bold text-blue-600 uppercase mb-2">Tingkat Penyelesaian</div>
                      <div className="text-xl font-bold text-blue-600 mb-1">{((reportData.details.statusBreakdown.selesai / Math.max(1, reportData.summary.totalDeliveries)) * 100).toFixed(1)}%</div>
                      <div className="text-xs text-gray-600">Pengiriman yang selesai</div>
                    </td>
                  </tr>
                </table>
                  </div>
                </div>

            {/* Key Performance Indicators */}
            <div className="mb-8">
              <div className="bg-gray-50 border-l-4 border-blue-600 p-3 rounded-r-lg mb-4">
                <h3 className="text-lg font-bold text-blue-600 flex items-center">
                  <span className="mr-2">🎯</span>
                  INDIKATOR KINERJA UTAMA
                </h3>
                    </div>
              <div className="w-full">
                <table className="w-full border-separate" style={{borderSpacing: '15px'}}>
                  <tr>
                    <td className="w-1/3 border-2 border-gray-200 rounded-lg p-4 bg-white">
                      <div className="text-center border-b-2 border-blue-600 pb-2 mb-3">
                        <h4 className="text-sm font-bold text-blue-600">📈 Efisiensi Operasional</h4>
                  </div>
                      <div className="space-y-2">
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Rata-rata Pengiriman/Hari:</div>
                          <div className="text-sm font-semibold text-right">{reportData.summary.averageDeliveryPerDay.toFixed(1)}</div>
                </div>
                    <div>
                          <div className="text-xs text-gray-600 mb-1">Rata-rata Tonase/Pengiriman:</div>
                          <div className="text-sm font-semibold text-right">{reportData.summary.totalDeliveries > 0 ? ((reportData.summary.totalWeight / reportData.summary.totalDeliveries) / 1000).toFixed(2) : 0} ton</div>
                    </div>
                    <div>
                          <div className="text-xs text-gray-600 mb-1">Nilai Rata-rata/Pengiriman:</div>
                          <div className="text-sm font-semibold text-right">{reportData.summary.totalDeliveries > 0 ? formatCurrency(reportData.summary.totalRevenue / reportData.summary.totalDeliveries) : 'Rp 0'}</div>
                    </div>
                  </div>
                    </td>
                    <td className="w-1/3 border-2 border-gray-200 rounded-lg p-4 bg-white">
                      <div className="text-center border-b-2 border-blue-600 pb-2 mb-3">
                        <h4 className="text-sm font-bold text-blue-600">🚛 Status Kendaraan</h4>
                </div>
                  <div className="space-y-2">
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Total Kendaraan Tersedia:</div>
                          <div className="text-sm font-semibold text-right">{reportData.summary.vehicleUtilization.length}</div>
                    </div>
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Total Trip Selesai:</div>
                          <div className="text-sm font-semibold text-right">{reportData.summary.vehicleUtilization.reduce((sum, v) => sum + v.trips, 0)}</div>
                    </div>
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Total Tonase Diangkut:</div>
                          <div className="text-sm font-semibold text-right">{(reportData.summary.vehicleUtilization.reduce((sum, v) => sum + v.totalWeight, 0) / 1000).toFixed(1)} ton</div>
                  </div>
                </div>
                    </td>
                    <td className="w-1/3 border-2 border-gray-200 rounded-lg p-4 bg-white">
                      <div className="text-center border-b-2 border-blue-600 pb-2 mb-3">
                        <h4 className="text-sm font-bold text-blue-600">👥 Status SDM</h4>
                    </div>
                  <div className="space-y-2">
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Total Sopir Tersedia:</div>
                          <div className="text-sm font-semibold text-right">{reportData.summary.driverPerformance.length}</div>
                    </div>
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Total Trip Dikerjakan:</div>
                          <div className="text-sm font-semibold text-right">{reportData.summary.driverPerformance.reduce((sum, d) => sum + d.trips, 0)}</div>
                    </div>
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Total Tonase Dikirim:</div>
                          <div className="text-sm font-semibold text-right">{(reportData.summary.driverPerformance.reduce((sum, d) => sum + d.totalWeight, 0) / 1000).toFixed(1)} ton</div>
                  </div>
                </div>
                    </td>
                  </tr>
                </table>
              </div>
            </div>

            {/* Top Destinations Analysis */}
            <div className="mb-8">
              <div className="bg-gray-50 border-l-4 border-blue-600 p-3 rounded-r-lg mb-4">
                <h3 className="text-lg font-bold text-blue-600 flex items-center">
                  <span className="mr-2">🗺️</span>
                ANALISIS TUJUAN PENGIRIMAN TERATAS
              </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Tujuan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Jumlah Pengiriman</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Total Tonase</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Revenue</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">% dari Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.summary.topDestinations.slice(0, 8).map((dest, index) => (
                      <tr key={dest.name} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dest.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{dest.count.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatWeight(dest.weight)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(dest.revenue)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {((dest.count / reportData.summary.totalDeliveries) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Monthly Performance Trend */}
            <div className="mb-8">
              <div className="bg-gray-50 border-l-4 border-blue-600 p-3 rounded-r-lg mb-4">
                <h3 className="text-lg font-bold text-blue-600 flex items-center">
                  <span className="mr-2">📈</span>
                TREN KINERJA BULANAN
              </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Bulan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Pengiriman</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Tonase</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Revenue</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Rata-rata per Hari</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.details.monthlyBreakdown.map((month, index) => (
                      <tr key={month.month} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{month.month}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{month.deliveries.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatWeight(month.weight)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(month.revenue)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {(month.deliveries / 30).toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PO Performance Analysis */}
            <div className="mb-8">
              <div className="bg-gray-50 border-l-4 border-blue-600 p-3 rounded-r-lg mb-4">
                <h3 className="text-lg font-bold text-blue-600 flex items-center">
                  <span className="mr-2">🚛</span>
                  ANALISIS KINERJA KENDARAAN
              </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Nomor PO</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Progress</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Sisa Tonase</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Nilai PO</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.summary.poPerformance.slice(0, 10).map((po, index) => (
                      <tr key={po.po_number} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{po.po_number}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  po.progress >= 80 ? 'bg-green-500' : 
                                  po.progress >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${po.progress}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold">{po.progress.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatWeight(po.remaining)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(po.value)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            po.progress >= 80 ? 'bg-green-100 text-green-800' : 
                            po.progress >= 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {po.progress >= 80 ? 'Excellent' : po.progress >= 50 ? 'Good' : 'Needs Attention'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-12 pt-6 border-t-2 border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Disiapkan oleh:</h4>
                  <p className="text-sm text-gray-600">{reportData.metadata.generatedBy}</p>
                  <p className="text-sm text-gray-600">Tanggal: {reportData.metadata.reportDate}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Untuk Direksi:</h4>
                  <p className="text-sm text-gray-600">PT. SAMUDERA BERKAH SENTOSA</p>
                  <p className="text-sm text-gray-600">Laporan ini dibuat secara otomatis oleh sistem</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
