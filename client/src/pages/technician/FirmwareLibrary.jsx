import { useState } from 'react';
import { 
  FileCode, 
  Search, 
  Download, 
  Upload, 
  Star, 
  Filter,
  HardDrive,
  Component,
  CreditCard,
  ExternalLink,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Smartphone
} from 'lucide-react';

// Mock firmware data
const mockFirmware = [
  {
    id: '1',
    brand: 'Samsung',
    model: 'Galaxy S21',
    codename: 'o1s',
    region: 'India',
    version: 'G991BXXU9HVE1',
    android: '13',
    security: '2024-01-01',
    size: '6.2 GB',
    downloaded: true,
    rating: 4.8,
    date: '2024-01-15'
  },
  {
    id: '2',
    brand: 'Samsung',
    model: 'Galaxy S21',
    codename: 'o1s',
    region: 'Europe',
    version: 'G991BXXU9HVF1',
    android: '13',
    security: '2024-02-01',
    size: '6.1 GB',
    downloaded: false,
    rating: 4.9,
    date: '2024-02-05'
  },
  {
    id: '3',
    brand: 'OnePlus',
    model: '9 Pro',
    codename: 'lemonade',
    region: 'Global',
    version: 'OxygenOS 13.1',
    android: '13',
    security: '2024-01-15',
    size: '4.8 GB',
    downloaded: false,
    rating: 4.7,
    date: '2024-01-20'
  },
  {
    id: '4',
    brand: 'Xiaomi',
    model: 'Mi 11',
    codename: 'venus',
    region: 'China',
    version: 'MIUI 14.0.5',
    android: '13',
    security: '2024-01-20',
    size: '5.2 GB',
    downloaded: true,
    rating: 4.5,
    date: '2024-01-25'
  },
  {
    id: '5',
    brand: 'Google',
    model: 'Pixel 6',
    codename: 'oriole',
    region: 'US',
    version: 'TQ2A.230505.002',
    android: '13',
    security: '2024-02-01',
    size: '3.8 GB',
    downloaded: false,
    rating: 4.9,
    date: '2024-02-01'
  },
  {
    id: '6',
    brand: 'Samsung',
    model: 'Galaxy A52',
    codename: 'a52x',
    region: 'India',
    version: 'A525FXXU6CVE1',
    android: '13',
    security: '2024-01-01',
    size: '5.5 GB',
    downloaded: false,
    rating: 4.6,
    date: '2024-01-10'
  }
];

const brands = ['All', 'Samsung', 'OnePlus', 'Xiaomi', 'Google', 'Motorola', 'Realme'];
const regions = ['All', 'India', 'Europe', 'US', 'China', 'Global'];
const androidVersions = ['All', '14', '13', '12', '11'];

export default function FirmwareLibrary() {
  const [firmware, setFirmware] = useState(mockFirmware);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [selectedAndroid, setSelectedAndroid] = useState('All');
  const [showDownloaded, setShowDownloaded] = useState(false);
  const [downloading, setDownloading] = useState(null);

  const handleDownload = (id) => {
    setDownloading(id);
    setTimeout(() => {
      setFirmware(prev => prev.map(f => 
        f.id === id ? { ...f, downloaded: true } : f
      ));
      setDownloading(null);
    }, 2000);
  };

  const filteredFirmware = firmware.filter(f => {
    const matchesSearch = f.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.version.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBrand = selectedBrand === 'All' || f.brand === selectedBrand;
    const matchesRegion = selectedRegion === 'All' || f.region === selectedRegion;
    const matchesAndroid = selectedAndroid === 'All' || f.android === selectedAndroid;
    const matchesDownloaded = !showDownloaded || f.downloaded;
    
    return matchesSearch && matchesBrand && matchesRegion && matchesAndroid && matchesDownloaded;
  });

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Firmware Library</h1>
          <p className="text-slate-400">Search and download stock ROMs</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white">
            <Upload size={18} />
            Upload Firmware
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="form-card mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search by model or version..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pl-10"
            />
          </div>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
            >
              {brands.map(brand => (
                <option key={brand} value={brand}>{brand} Brand</option>
              ))}
            </select>
            
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
            >
              {regions.map(region => (
                <option key={region} value={region}>{region} Region</option>
              ))}
            </select>
            
            <select
              value={selectedAndroid}
              onChange={(e) => setSelectedAndroid(e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
            >
              {androidVersions.map(ver => (
                <option key={ver} value={ver}>Android {ver}</option>
              ))}
            </select>

            <label className="flex items-center gap-2 px-3 py-2 bg-slate-700 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={showDownloaded}
                onChange={(e) => setShowDownloaded(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-white text-sm">Downloaded</span>
            </label>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="form-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Firmware</p>
              <p className="text-2xl font-bold text-white">{firmware.length}</p>
            </div>
            <FileCode className="text-blue-400" size={24} />
          </div>
        </div>
        <div className="form-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Downloaded</p>
              <p className="text-2xl font-bold text-green-400">{firmware.filter(f => f.downloaded).length}</p>
            </div>
            <Download className="text-green-400" size={24} />
          </div>
        </div>
        <div className="form-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Brands</p>
              <p className="text-2xl font-bold text-purple-400">{new Set(firmware.map(f => f.brand)).size}</p>
            </div>
<Smartphone className="text-purple-400" size={24} />
          </div>
        </div>
        <div className="form-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Size</p>
              <p className="text-2xl font-bold text-yellow-400">{(firmware.reduce((acc, f) => acc + parseFloat(f.size), 0)).toFixed(1)} GB</p>
            </div>
            <HardDrive className="text-yellow-400" size={24} />
          </div>
        </div>
      </div>

      {/* Firmware List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredFirmware.map((fw) => (
          <div key={fw.id} className="form-card hover:border-blue-500 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center">
<Smartphone className="text-green-400" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{fw.brand} {fw.model}</h3>
                  <p className="text-sm text-slate-400">{fw.codename} • {fw.region}</p>
                </div>
              </div>
              {fw.downloaded ? (
                <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                  <CheckCircle size={14} />
                  Downloaded
                </span>
              ) : (
                <span className="flex items-center gap-1 px-2 py-1 bg-slate-700 text-slate-400 text-xs rounded-full">
                  <AlertTriangle size={14} />
                  Not Downloaded
                </span>
              )}
            </div>

            <div className="bg-slate-700/50 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between mb-2">
                <code className="text-blue-400 text-sm">{fw.version}</code>
                <div className="flex items-center gap-1">
                  <Star className="text-yellow-400" size={14} />
                  <span className="text-white text-sm">{fw.rating}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-slate-400">Android</p>
                  <p className="text-white">{fw.android}</p>
                </div>
                <div>
                  <p className="text-slate-400">Security</p>
                  <p className="text-white">{fw.security}</p>
                </div>
                <div>
                  <p className="text-slate-400">Size</p>
                  <p className="text-white">{fw.size}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {fw.downloaded ? (
                <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm">
                  <Download size={16} />
                  Installed
                </button>
              ) : (
                <button
                  onClick={() => handleDownload(fw.id)}
                  disabled={downloading === fw.id}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-white text-sm"
                >
                  {downloading === fw.id ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      Download
                    </>
                  )}
                </button>
              )}
              <button className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white">
                <ExternalLink size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredFirmware.length === 0 && (
        <div className="form-card text-center py-12">
          <FileCode className="mx-auto text-slate-600 mb-4" size={48} />
          <p className="text-slate-400">No firmware found</p>
        </div>
      )}
    </div>
  );
}
