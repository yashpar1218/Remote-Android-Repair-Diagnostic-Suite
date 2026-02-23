import { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  FileText,
  Video,
  Download,
  ExternalLink,
  Tag
} from 'lucide-react';

// Mock knowledge base articles
const mockArticles = [
  { 
    id: '1', 
    title: 'How to Enable USB Debugging', 
    category: 'Guides',
    type: 'article',
    views: 1250,
    lastUpdated: '2024-02-10',
    content: 'Step by step guide to enable USB debugging...'
  },
  { 
    id: '2', 
    title: 'Samsung Galaxy S21 Firmware Flash', 
    category: 'Tutorials',
    type: 'video',
    views: 890,
    lastUpdated: '2024-02-08',
    content: 'Video tutorial on flashing firmware...'
  },
  { 
    id: '3', 
    title: 'Common ADB Commands Reference', 
    category: 'Reference',
    type: 'article',
    views: 2340,
    lastUpdated: '2024-02-05',
    content: 'List of commonly used ADB commands...'
  },
  { 
    id: '4', 
    title: 'Bootloop Fix Guide', 
    category: 'Troubleshooting',
    type: 'article',
    views: 1560,
    lastUpdated: '2024-02-01',
    content: 'How to fix bootloop issues...'
  },
  { 
    id: '5', 
    title: 'FRP Bypass Methods 2024', 
    category: 'Security',
    type: 'article',
    views: 3200,
    lastUpdated: '2024-01-28',
    content: 'Latest FRP bypass methods...'
  },
  { 
    id: '6', 
    title: 'Fastboot Mode Explained', 
    category: 'Guides',
    type: 'article',
    views: 780,
    lastUpdated: '2024-01-25',
    content: 'Understanding Fastboot mode...'
  },
];

const categories = ['All', 'Guides', 'Tutorials', 'Reference', 'Troubleshooting', 'Security'];
const types = ['article', 'video', 'download'];

export default function KnowledgeBase() {
  const [articles, setArticles] = useState(mockArticles);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || article.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getTypeIcon = (type) => {
    switch (type) {
      case 'video': return <Video size={16} className="text-red-400" />;
      case 'download': return <Download size={16} className="text-green-400" />;
      default: return <FileText size={16} className="text-blue-400" />;
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Guides': 'bg-blue-500/20 text-blue-400',
      'Tutorials': 'bg-purple-500/20 text-purple-400',
      'Reference': 'bg-green-500/20 text-green-400',
      'Troubleshooting': 'bg-yellow-500/20 text-yellow-400',
      'Security': 'bg-red-500/20 text-red-400',
    };
    return colors[category] || 'bg-slate-500/20 text-slate-400';
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Knowledge Base</h1>
          <p className="text-slate-400">Manage manuals, guides, and tutorials</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
        >
          <Plus size={20} />
          Add Article
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="form-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Articles</p>
              <p className="text-2xl font-bold text-white">{articles.length}</p>
            </div>
            <BookOpen className="text-blue-400" size={24} />
          </div>
        </div>
        <div className="form-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Views</p>
              <p className="text-2xl font-bold text-green-400">
                {articles.reduce((acc, a) => acc + a.views, 0).toLocaleString()}
              </p>
            </div>
            <Eye className="text-green-400" size={24} />
          </div>
        </div>
        <div className="form-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Video Tutorials</p>
              <p className="text-2xl font-bold text-red-400">{articles.filter(a => a.type === 'video').length}</p>
            </div>
            <Video className="text-red-400" size={24} />
          </div>
        </div>
        <div className="form-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Categories</p>
              <p className="text-2xl font-bold text-purple-400">{categories.length - 1}</p>
            </div>
            <Tag className="text-purple-400" size={24} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="form-card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pl-10"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredArticles.map((article) => (
          <div key={article.id} className="form-card hover:border-blue-500 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {getTypeIcon(article.type)}
                <span className={`px-2 py-1 rounded text-xs ${getCategoryColor(article.category)}`}>
                  {article.category}
                </span>
              </div>
              <div className="flex items-center gap-1 text-slate-400 text-sm">
                <Eye size={14} />
                {article.views.toLocaleString()}
              </div>
            </div>
            
            <h3 className="font-semibold text-white mb-2 line-clamp-2">{article.title}</h3>
            
            <p className="text-slate-400 text-sm mb-4 line-clamp-2">
              {article.content}
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-slate-700">
              <span className="text-slate-500 text-xs">
                Updated: {article.lastUpdated}
              </span>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white">
                  <Eye size={16} />
                </button>
                <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white">
                  <Edit size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredArticles.length === 0 && (
        <div className="form-card text-center py-12">
          <BookOpen className="mx-auto text-slate-600 mb-4" size={48} />
          <p className="text-slate-400">No articles found</p>
        </div>
      )}
    </div>
  );
}
