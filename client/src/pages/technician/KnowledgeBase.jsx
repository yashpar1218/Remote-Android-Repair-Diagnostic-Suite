import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  BookOpen,
  Plus,
  Search,
  Loader2,
  Eye,
  Pencil,
  Trash2,
  Smartphone,
  Tags,
  Calendar
} from 'lucide-react';
import KnowledgeArticleEditor from '../../components/knowledge/KnowledgeArticleEditor';

const API_URL = 'http://localhost:5000/api/knowledge';

export default function KnowledgeBase() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(API_URL);
      setArticles(response.data || []);
    } catch (err) {
      console.error('Error fetching knowledge articles:', err);
      setError('Failed to load the knowledge base.');
    } finally {
      setLoading(false);
    }
  };

  const brands = useMemo(
    () => [...new Set(articles.map((article) => article.device_brand).filter(Boolean))].sort(),
    [articles]
  );

  const categories = useMemo(
    () => [...new Set(articles.map((article) => article.issue_category).filter(Boolean))].sort(),
    [articles]
  );

  const filteredArticles = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();

    return articles.filter((article) => {
      const matchesSearch = !needle || [
        article.title,
        article.summary,
        article.content,
        article.device_brand,
        article.issue_category,
        ...(article.tags || [])
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(needle));

      const matchesBrand = brandFilter === 'all' || article.device_brand === brandFilter;
      const matchesCategory = categoryFilter === 'all' || article.issue_category === categoryFilter;

      return matchesSearch && matchesBrand && matchesCategory;
    });
  }, [articles, searchTerm, brandFilter, categoryFilter]);

  const handleCreate = () => {
    setSelectedArticle(null);
    setEditorOpen(true);
  };

  const handleEdit = (article) => {
    setSelectedArticle(article);
    setEditorOpen(true);
  };

  const handleSubmit = async (payload) => {
    try {
      setSubmitting(true);
      if (selectedArticle?._id) {
        await axios.put(`${API_URL}/${selectedArticle._id}`, payload);
      } else {
        await axios.post(API_URL, payload);
      }

      setEditorOpen(false);
      setSelectedArticle(null);
      await fetchArticles();
    } catch (err) {
      console.error('Error saving knowledge article:', err);
      alert(err.response?.data?.error || 'Failed to save the article.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (article) => {
    const confirmed = window.confirm(`Delete "${article.title}"? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/${article._id}`);
      await fetchArticles();
    } catch (err) {
      console.error('Error deleting knowledge article:', err);
      alert(err.response?.data?.error || 'Failed to delete the article.');
    }
  };

  const formatDate = (value) => {
    if (!value) {
      return 'N/A';
    }

    return new Date(value).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Knowledge Base</h1>
          <p className="text-slate-400">Technician-maintained repair guides, diagnostics, and troubleshooting documentation.</p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
        >
          <Plus size={18} />
          New Article
        </button>
      </div>

      {error ? (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-300">{error}</div>
      ) : null}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Articles" value={articles.length} icon={<BookOpen className="text-blue-400" size={22} />} />
        <StatCard label="Brands" value={brands.length} icon={<Smartphone className="text-green-400" size={22} />} />
        <StatCard label="Issue Categories" value={categories.length} icon={<Tags className="text-amber-400" size={22} />} />
      </div>

      <div className="form-card mb-6">
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search titles, brands, issues, summaries, or tags..."
              className="form-input pl-10"
            />
          </div>
          <select
            value={brandFilter}
            onChange={(event) => setBrandFilter(event.target.value)}
            className="rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white"
          >
            <option value="all">All Brands</option>
            {brands.map((brand) => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-white"
          >
            <option value="all">All Issue Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="animate-spin text-blue-400" size={32} />
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="form-card py-12 text-center">
          <BookOpen className="mx-auto mb-4 text-slate-600" size={46} />
          <p className="text-lg text-white">No articles found</p>
          <p className="mt-2 text-sm text-slate-400">Try a different search or create the first article for this topic.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {filteredArticles.map((article) => (
            <article key={article._id} className="form-card border border-slate-700 transition-colors hover:border-blue-500/60">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <div className="mb-2 flex flex-wrap gap-2">
                    <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-medium text-blue-300">{article.device_brand}</span>
                    <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-300">{article.issue_category}</span>
                  </div>
                  <h2 className="text-lg font-semibold text-white">{article.title}</h2>
                </div>
                <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                  <Calendar size={14} />
                  {formatDate(article.updated_at || article.created_at)}
                </span>
              </div>

              <p className="mb-4 text-sm text-slate-300">{article.summary}</p>

              {article.tags?.length ? (
                <div className="mb-4 flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-slate-700 px-3 py-1 text-xs text-slate-300">
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="mb-4 rounded-lg bg-slate-800/60 p-3 text-sm text-slate-400">
                <p className="line-clamp-3 whitespace-pre-wrap">{article.content}</p>
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-700 pt-4 md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-slate-400">
                  Created by <span className="text-slate-200">{article.created_by?.name || 'System migration'}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    to={`/technician/knowledge-base/${article._id}`}
                    className="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-3 py-2 text-sm text-white transition-colors hover:bg-slate-600"
                  >
                    <Eye size={16} />
                    Open
                  </Link>
                  <button
                    onClick={() => handleEdit(article)}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white transition-colors hover:bg-blue-700"
                  >
                    <Pencil size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(article)}
                    className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm text-white transition-colors hover:bg-red-700"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <KnowledgeArticleEditor
        open={editorOpen}
        article={selectedArticle}
        submitting={submitting}
        onCancel={() => {
          setEditorOpen(false);
          setSelectedArticle(null);
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="form-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
        {icon}
      </div>
    </div>
  );
}
