import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { BookOpen, Loader2, Search } from 'lucide-react';

const API_URL = 'http://localhost:5000/api/knowledge';

export default function KnowledgeBase() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await axios.get(API_URL);
        setArticles(response.data || []);
      } catch (err) {
        console.error('Error fetching knowledge articles:', err);
        setError('Failed to load knowledge base articles.');
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  const filteredArticles = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    if (!needle) {
      return articles;
    }

    return articles.filter((article) =>
      [article.title, article.summary, article.device_brand, article.issue_category]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(needle))
    );
  }, [articles, searchTerm]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Knowledge Base</h1>
        <p className="text-slate-400">Admins can review the article library here. Technicians manage content from the technician portal.</p>
      </div>

      {error ? <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-300">{error}</div> : null}

      <div className="form-card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search articles..."
            className="form-input pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="animate-spin text-blue-400" size={30} />
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="form-card py-12 text-center">
          <BookOpen className="mx-auto mb-4 text-slate-600" size={44} />
          <p className="text-white">No articles found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {filteredArticles.map((article) => (
            <div key={article._id} className="form-card border border-slate-700">
              <div className="mb-2 flex flex-wrap gap-2">
                <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs text-blue-300">{article.device_brand}</span>
                <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs text-amber-300">{article.issue_category}</span>
              </div>
              <h2 className="text-lg font-semibold text-white">{article.title}</h2>
              <p className="mt-2 text-sm text-slate-300">{article.summary}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
