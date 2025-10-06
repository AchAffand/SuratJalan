import React, { useState, useEffect } from 'react';
import { 
  Settings, Save, Eye, Download, Upload, 
  Building2, FileText, Palette, Type, 
  X, Check, AlertCircle
} from 'lucide-react';

interface SuratJalanTemplate {
  id: string;
  name: string;
  companyInfo: {
    name: string;
    address: string;
    phone: string;
    email: string;
    logo?: string;
  };
  documentSettings: {
    title: string;
    showLogo: boolean;
    showCompanyInfo: boolean;
    showCustomerInfo: boolean;
    showItemsTable: boolean;
    showSignature: boolean;
    showFooter: boolean;
  };
  styling: {
    fontFamily: string;
    fontSize: number;
    lineHeight: number;
    margin: number;
    borderStyle: string;
    headerColor: string;
    textColor: string;
  };
  layout: {
    headerLayout: 'left' | 'center' | 'right';
    tableStyle: 'bordered' | 'striped' | 'minimal';
    signatureLayout: 'horizontal' | 'vertical';
  };
}

const DEFAULT_TEMPLATE: SuratJalanTemplate = {
  id: 'default',
  name: 'Template Default',
  companyInfo: {
    name: 'PT SAMUDERA BERKAH SENTOSA',
    address: 'Kawasan Pergudangan Safe N lock\nBlok E 1509 Rangkah kidul Sidoarjo',
    phone: '(031) 1234567',
    email: 'info@samuderaberkah.com'
  },
  documentSettings: {
    title: 'SURAT JALAN',
    showLogo: true,
    showCompanyInfo: true,
    showCustomerInfo: true,
    showItemsTable: true,
    showSignature: true,
    showFooter: true
  },
  styling: {
    fontFamily: 'Courier New',
    fontSize: 12,
    lineHeight: 1.2,
    margin: 0.5,
    borderStyle: 'solid',
    headerColor: '#000000',
    textColor: '#000000'
  },
  layout: {
    headerLayout: 'left',
    tableStyle: 'bordered',
    signatureLayout: 'horizontal'
  }
};

export const SuratJalanTemplate: React.FC = () => {
  const [template, setTemplate] = useState<SuratJalanTemplate>(DEFAULT_TEMPLATE);
  const [showPreview, setShowPreview] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'styling' | 'layout'>('general');

  // Load template from localStorage
  useEffect(() => {
    const savedTemplate = localStorage.getItem('surat-jalan-template');
    if (savedTemplate) {
      try {
        setTemplate(JSON.parse(savedTemplate));
      } catch (error) {
        console.error('Error loading template:', error);
      }
    }
  }, []);

  // Save template to localStorage
  const saveTemplate = () => {
    try {
      localStorage.setItem('surat-jalan-template', JSON.stringify(template));
      setIsEditing(false);
      alert('Template berhasil disimpan!');
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Gagal menyimpan template!');
    }
  };

  // Reset to default template
  const resetTemplate = () => {
    if (confirm('Apakah Anda yakin ingin mengembalikan ke template default?')) {
      setTemplate(DEFAULT_TEMPLATE);
      localStorage.removeItem('surat-jalan-template');
    }
  };

  // Export template
  const exportTemplate = () => {
    const dataStr = JSON.stringify(template, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `surat-jalan-template-${template.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import template
  const importTemplate = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedTemplate = JSON.parse(e.target?.result as string);
        setTemplate(importedTemplate);
        alert('Template berhasil diimpor!');
      } catch (error) {
        console.error('Error importing template:', error);
        alert('Gagal mengimpor template! Pastikan file valid.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Settings className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Template Surat Jalan</h2>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
          >
            <Eye className="w-4 h-4" />
            <span>{showPreview ? 'Sembunyikan Preview' : 'Tampilkan Preview'}</span>
          </button>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Settings className="w-4 h-4" />
            <span>{isEditing ? 'Selesai Edit' : 'Edit Template'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Template Editor */}
        <div className="space-y-6">
          {isEditing ? (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Edit Template</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={saveTemplate}
                    className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-1"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan</span>
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('general')}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'general'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Building2 className="w-4 h-4 inline mr-2" />
                  Umum
                </button>
                <button
                  onClick={() => setActiveTab('styling')}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'styling'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Palette className="w-4 h-4 inline mr-2" />
                  Styling
                </button>
                <button
                  onClick={() => setActiveTab('layout')}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'layout'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Type className="w-4 h-4 inline mr-2" />
                  Layout
                </button>
              </div>

              {/* General Tab */}
              {activeTab === 'general' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nama Template
                    </label>
                    <input
                      type="text"
                      value={template.name}
                      onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Judul Dokumen
                    </label>
                    <input
                      type="text"
                      value={template.documentSettings.title}
                      onChange={(e) => setTemplate({
                        ...template,
                        documentSettings: { ...template.documentSettings, title: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nama Perusahaan
                    </label>
                    <input
                      type="text"
                      value={template.companyInfo.name}
                      onChange={(e) => setTemplate({
                        ...template,
                        companyInfo: { ...template.companyInfo, name: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Alamat Perusahaan
                    </label>
                    <textarea
                      value={template.companyInfo.address}
                      onChange={(e) => setTemplate({
                        ...template,
                        companyInfo: { ...template.companyInfo, address: e.target.value }
                      })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Telepon
                      </label>
                      <input
                        type="text"
                        value={template.companyInfo.phone}
                        onChange={(e) => setTemplate({
                          ...template,
                          companyInfo: { ...template.companyInfo, phone: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={template.companyInfo.email}
                        onChange={(e) => setTemplate({
                          ...template,
                          companyInfo: { ...template.companyInfo, email: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Document Settings */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-3">Pengaturan Dokumen</h4>
                    <div className="space-y-2">
                      {Object.entries(template.documentSettings).map(([key, value]) => {
                        if (key === 'title') return null;
                        return (
                          <label key={key} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={value as boolean}
                              onChange={(e) => setTemplate({
                                ...template,
                                documentSettings: { ...template.documentSettings, [key]: e.target.checked }
                              })}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Styling Tab */}
              {activeTab === 'styling' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Font Family
                    </label>
                    <select
                      value={template.styling.fontFamily}
                      onChange={(e) => setTemplate({
                        ...template,
                        styling: { ...template.styling, fontFamily: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Courier New">Courier New</option>
                      <option value="Arial">Arial</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Helvetica">Helvetica</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Font Size (px)
                      </label>
                      <input
                        type="number"
                        value={template.styling.fontSize}
                        onChange={(e) => setTemplate({
                          ...template,
                          styling: { ...template.styling, fontSize: parseInt(e.target.value) }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Line Height
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={template.styling.lineHeight}
                        onChange={(e) => setTemplate({
                          ...template,
                          styling: { ...template.styling, lineHeight: parseFloat(e.target.value) }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Margin (inch)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={template.styling.margin}
                      onChange={(e) => setTemplate({
                        ...template,
                        styling: { ...template.styling, margin: parseFloat(e.target.value) }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Header Color
                      </label>
                      <input
                        type="color"
                        value={template.styling.headerColor}
                        onChange={(e) => setTemplate({
                          ...template,
                          styling: { ...template.styling, headerColor: e.target.value }
                        })}
                        className="w-full h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Text Color
                      </label>
                      <input
                        type="color"
                        value={template.styling.textColor}
                        onChange={(e) => setTemplate({
                          ...template,
                          styling: { ...template.styling, textColor: e.target.value }
                        })}
                        className="w-full h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Layout Tab */}
              {activeTab === 'layout' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Header Layout
                    </label>
                    <select
                      value={template.layout.headerLayout}
                      onChange={(e) => setTemplate({
                        ...template,
                        layout: { ...template.layout, headerLayout: e.target.value as any }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="left">Kiri</option>
                      <option value="center">Tengah</option>
                      <option value="right">Kanan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Table Style
                    </label>
                    <select
                      value={template.layout.tableStyle}
                      onChange={(e) => setTemplate({
                        ...template,
                        layout: { ...template.layout, tableStyle: e.target.value as any }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="bordered">Bordered</option>
                      <option value="striped">Striped</option>
                      <option value="minimal">Minimal</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Signature Layout
                    </label>
                    <select
                      value={template.layout.signatureLayout}
                      onChange={(e) => setTemplate({
                        ...template,
                        layout: { ...template.layout, signatureLayout: e.target.value as any }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="horizontal">Horizontal</option>
                      <option value="vertical">Vertical</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">{template.name}</h3>
                <p className="text-gray-600 mb-4">Template surat jalan yang sedang digunakan</p>
                <div className="space-y-2">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Edit Template
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={exportTemplate}
                      className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors flex items-center justify-center space-x-1"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export</span>
                    </button>
                    <label className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center space-x-1 cursor-pointer">
                      <Upload className="w-4 h-4" />
                      <span>Import</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={importTemplate}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <button
                    onClick={resetTemplate}
                    className="w-full px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    Reset ke Default
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview Template</h3>
            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <div 
                className="bg-white p-4 rounded border"
                style={{
                  fontFamily: template.styling.fontFamily,
                  fontSize: `${template.styling.fontSize}px`,
                  lineHeight: template.styling.lineHeight,
                  color: template.styling.textColor
                }}
              >
                {/* Header Preview */}
                <div className="flex justify-between items-start mb-4 pb-2 border-b-2 border-gray-800">
                  <div className="flex-1">
                    {template.documentSettings.showLogo && (
                      <div className="w-12 h-12 bg-blue-600 text-white rounded flex items-center justify-center text-xs font-bold mb-2">
                        SBS
                      </div>
                    )}
                    {template.documentSettings.showCompanyInfo && (
                      <div>
                        <div className="font-bold text-sm uppercase">{template.companyInfo.name}</div>
                        <div className="text-xs whitespace-pre-line">{template.companyInfo.address}</div>
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-1">
                    <div className="text-xs">
                      <div className="flex justify-between"><span>No. SJ:</span><span>075/CPO-NH-07/2025</span></div>
                      <div className="flex justify-between"><span>Tanggal:</span><span>11 Juli 2025</span></div>
                      <div className="flex justify-between"><span>No. PO:</span><span>NH20250527-A0709</span></div>
                    </div>
                  </div>
                </div>

                {/* Title Preview */}
                <div 
                  className="text-center font-bold text-lg border-2 border-gray-800 p-2 mb-4"
                  style={{ color: template.styling.headerColor }}
                >
                  {template.documentSettings.title}
                </div>

                {/* Customer Preview */}
                {template.documentSettings.showCustomerInfo && (
                  <div className="border border-gray-800 p-2 mb-4">
                    <div className="font-bold text-xs uppercase mb-1">Kepada Yth,</div>
                    <div className="text-xs">
                      <div className="font-bold">PT. NEW HOPE JAWA TIMUR - MOJOKERTO</div>
                      <div className="italic">NEW HOPE LIUHE GROUP</div>
                      <div className="whitespace-pre-line">Jl. Wonosari desa Sumber Tanggul\nKec. Mojosari Kab. Mojokerto 61382</div>
                      <div className="font-bold">Telp. (62-321) 6852666, 6852888, 6852999</div>
                    </div>
                  </div>
                )}

                {/* Table Preview */}
                {template.documentSettings.showItemsTable && (
                  <table className={`w-full border-collapse mb-4 ${
                    template.layout.tableStyle === 'bordered' ? 'border-2 border-gray-800' : ''
                  }`}>
                    <thead>
                      <tr className={template.layout.tableStyle === 'striped' ? 'bg-gray-100' : ''}>
                        <th className="border border-gray-800 p-1 text-xs font-bold text-center">NO</th>
                        <th className="border border-gray-800 p-1 text-xs font-bold text-center">NAMA BARANG</th>
                        <th className="border border-gray-800 p-1 text-xs font-bold text-center">JUMLAH</th>
                        <th className="border border-gray-800 p-1 text-xs font-bold text-center">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-800 p-1 text-xs text-center">1</td>
                        <td className="border border-gray-800 p-1 text-xs">CPO</td>
                        <td className="border border-gray-800 p-1 text-xs text-center">1 Tangki</td>
                        <td className="border border-gray-800 p-1 text-xs"></td>
                      </tr>
                    </tbody>
                  </table>
                )}

                {/* Signature Preview */}
                {template.documentSettings.showSignature && (
                  <div className={`flex ${template.layout.signatureLayout === 'vertical' ? 'flex-col space-y-4' : 'justify-between'} mt-8 pt-4 border-t border-gray-800`}>
                    <div className="text-center">
                      <div className="font-bold text-xs uppercase mb-2">Penerima</div>
                      <div className="border-b border-gray-800 h-8 mb-1"></div>
                      <div className="text-xs">(_________________)</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-xs uppercase mb-2">Hormat kami,</div>
                      <div className="border-b border-gray-800 h-8 mb-1"></div>
                      <div className="text-xs">(PT Samudera Berkah Sentosa)</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
