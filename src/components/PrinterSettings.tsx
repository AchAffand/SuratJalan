import React, { useState, useEffect } from 'react';
import { 
  Printer, Settings, CheckCircle, AlertCircle, 
  Monitor, Wifi, Usb, 
  Save, RefreshCw, TestTube
} from 'lucide-react';

interface PrinterConfig {
  name: string;
  type: 'epson-lx300' | 'epson-lx310' | 'generic';
  connection: 'usb' | 'parallel' | 'serial';
  paperSize: 'ncr-9.5x11' | 'A4' | 'Letter' | 'Legal';
  orientation: 'portrait' | 'landscape';
  quality: 'draft' | 'normal' | 'high';
  colorMode: 'monochrome' | 'color';
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  fontSettings: {
    family: string;
    size: number;
    weight: 'normal' | 'bold';
  };
  advanced: {
    autoCut: boolean;
    printPreview: boolean;
    saveAsPDF: boolean;
    watermark: boolean;
    headerFooter: boolean;
    continuousFeed: boolean;
    tractorFeed: boolean;
  };
}

const DEFAULT_CONFIG: PrinterConfig = {
  name: 'Epson LX-310',
  type: 'epson-lx310',
  connection: 'parallel',
  paperSize: 'ncr-9.5x11',
  orientation: 'portrait',
  quality: 'normal',
  colorMode: 'monochrome',
  margin: {
    top: 0.3,
    right: 0.3,
    bottom: 0.3,
    left: 0.3
  },
  fontSettings: {
    family: 'Century Gothic',
    size: 10,
    weight: 'normal'
  },
  advanced: {
    autoCut: true,
    printPreview: true,
    saveAsPDF: true,
    watermark: false,
    headerFooter: true,
    continuousFeed: true,
    tractorFeed: true
  }
};

export const PrinterSettings: React.FC = () => {
  const [config, setConfig] = useState<PrinterConfig>(DEFAULT_CONFIG);
  const [isConnected, setIsConnected] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  // Load config from localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('printer-config');
    if (savedConfig) {
      try {
        setConfig(JSON.parse(savedConfig));
      } catch (error) {
        console.error('Error loading printer config:', error);
      }
    }
  }, []);

  // Check printer connection
  useEffect(() => {
    checkPrinterConnection();
  }, [config.connection]);

  const checkPrinterConnection = async () => {
    try {
      // Simulate printer connection check
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsConnected(true);
    } catch (error) {
      setIsConnected(false);
    }
  };

  const saveConfig = () => {
    try {
      localStorage.setItem('printer-config', JSON.stringify(config));
      alert('Konfigurasi printer berhasil disimpan!');
    } catch (error) {
      console.error('Error saving printer config:', error);
      alert('Gagal menyimpan konfigurasi printer!');
    }
  };

  const testPrint = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      // Simulate test print
      await new Promise(resolve => setTimeout(resolve, 2000));
      setTestResult('success');
    } catch (error) {
      setTestResult('error');
    } finally {
      setIsTesting(false);
    }
  };

  const resetConfig = () => {
    if (confirm('Apakah Anda yakin ingin mengembalikan ke konfigurasi default?')) {
      setConfig(DEFAULT_CONFIG);
      localStorage.removeItem('printer-config');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Printer className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Pengaturan Printer</h2>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
            isConnected 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {isConnected ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Terhubung</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4" />
                <span>Tidak Terhubung</span>
              </>
            )}
          </div>
          <button
            onClick={checkPrinterConnection}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Periksa Koneksi"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Printer Configuration */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Konfigurasi Printer
          </h3>

          <div className="space-y-6">
            {/* Basic Settings */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Pengaturan Dasar</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Printer
                  </label>
                  <input
                    type="text"
                    value={config.name}
                    onChange={(e) => setConfig({ ...config, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipe Printer
                  </label>
                  <select
                    value={config.type}
                    onChange={(e) => setConfig({ ...config, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                  <option value="epson-lx310">Epson LX-310</option>
                    <option value="generic">Generic Printer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Koneksi
                  </label>
                  <div className="flex space-x-4">
                    {[
                      { value: 'parallel', label: 'Parallel', icon: Usb },
                      { value: 'serial', label: 'Serial', icon: Wifi },
                      { value: 'usb', label: 'USB', icon: Monitor }
                    ].map(({ value, label, icon: Icon }) => (
                      <label key={value} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="connection"
                          value={value}
                          checked={config.connection === value}
                          onChange={(e) => setConfig({ ...config, connection: e.target.value as any })}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <Icon className="w-4 h-4" />
                        <span className="text-sm">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Paper Settings */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Pengaturan Kertas</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ukuran Kertas
                  </label>
                  <select
                    value={config.paperSize}
                    onChange={(e) => setConfig({ ...config, paperSize: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="ncr-9.5x11">NCR 9.5" x 11"</option>
                    <option value="A4">A4</option>
                    <option value="Letter">Letter</option>
                    <option value="Legal">Legal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Orientasi
                  </label>
                  <select
                    value={config.orientation}
                    onChange={(e) => setConfig({ ...config, orientation: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Quality Settings */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Pengaturan Kualitas</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kualitas Cetak
                  </label>
                  <select
                    value={config.quality}
                    onChange={(e) => setConfig({ ...config, quality: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mode Warna
                  </label>
                  <select
                    value={config.colorMode}
                    onChange={(e) => setConfig({ ...config, colorMode: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="monochrome">Monochrome</option>
                    <option value="color">Color</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Margin Settings */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Margin (inch)</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Atas
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={config.margin.top}
                    onChange={(e) => setConfig({
                      ...config,
                      margin: { ...config.margin, top: parseFloat(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bawah
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={config.margin.bottom}
                    onChange={(e) => setConfig({
                      ...config,
                      margin: { ...config.margin, bottom: parseFloat(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kiri
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={config.margin.left}
                    onChange={(e) => setConfig({
                      ...config,
                      margin: { ...config.margin, left: parseFloat(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kanan
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={config.margin.right}
                    onChange={(e) => setConfig({
                      ...config,
                      margin: { ...config.margin, right: parseFloat(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Font Settings */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Pengaturan Font</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Font Family
                  </label>
                  <select
                    value={config.fontSettings.family}
                    onChange={(e) => setConfig({
                      ...config,
                      fontSettings: { ...config.fontSettings, family: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Century Gothic">Century Gothic</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Arial">Arial</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Helvetica">Helvetica</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Font Size
                  </label>
                  <input
                    type="number"
                    value={config.fontSettings.size}
                    onChange={(e) => setConfig({
                      ...config,
                      fontSettings: { ...config.fontSettings, size: parseInt(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Advanced Settings */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Pengaturan Lanjutan</h4>
              <div className="space-y-2">
                {Object.entries(config.advanced).map(([key, value]) => (
                  <label key={key} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={value as boolean}
                      onChange={(e) => setConfig({
                        ...config,
                        advanced: { ...config.advanced, [key]: e.target.checked }
                      })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 capitalize">
                      {key === 'continuousFeed' ? 'Continuous Feed' :
                       key === 'tractorFeed' ? 'Tractor Feed' :
                       key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Printer Status & Actions */}
        <div className="space-y-6">
          {/* Printer Status */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Monitor className="w-5 h-5 mr-2" />
              Status Printer
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Koneksi</span>
                <div className={`flex items-center space-x-2 ${
                  isConnected ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isConnected ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">Terhubung</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">Tidak Terhubung</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Tipe Printer</span>
                <span className="text-sm text-gray-900">{config.name}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Koneksi</span>
                <span className="text-sm text-gray-900 capitalize">{config.connection}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Ukuran Kertas</span>
                <span className="text-sm text-gray-900">{config.paperSize}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Orientasi</span>
                <span className="text-sm text-gray-900 capitalize">{config.orientation}</span>
              </div>
            </div>
          </div>

          {/* Test Print */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TestTube className="w-5 h-5 mr-2" />
              Test Print
            </h3>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Test print untuk memastikan printer berfungsi dengan baik dan konfigurasi sudah benar.
              </p>

              <button
                onClick={testPrint}
                disabled={isTesting || !isConnected}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTesting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Testing...</span>
                  </>
                ) : (
                  <>
                    <TestTube className="w-4 h-4" />
                    <span>Test Print</span>
                  </>
                )}
              </button>

              {testResult && (
                <div className={`p-3 rounded-lg flex items-center space-x-2 ${
                  testResult === 'success' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {testResult === 'success' ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">Test print berhasil!</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">Test print gagal!</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Aksi</h3>
            <div className="space-y-3">
              <button
                onClick={saveConfig}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Konfigurasi</span>
              </button>

              <button
                onClick={resetConfig}
                className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Reset ke Default
              </button>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 rounded-xl p-6">
            <h4 className="font-medium text-blue-900 mb-3">Tips untuk Epson LX-310:</h4>
            <ul className="text-sm text-blue-800 space-y-2">
              <li>• Pastikan printer terhubung via Parallel atau Serial</li>
              <li>• Gunakan kertas NCR 9.5" x 11" untuk hasil terbaik</li>
              <li>• Periksa ribbon printer sebelum mencetak</li>
              <li>• Gunakan mode monochrome (dot matrix)</li>
              <li>• Margin 0.3 inch optimal untuk kertas NCR</li>
              <li>• Font Courier New 10px memberikan hasil terbaik</li>
              <li>• Aktifkan Continuous Feed dan Tractor Feed</li>
              <li>• Pastikan kertas terpasang dengan benar di tractor</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
