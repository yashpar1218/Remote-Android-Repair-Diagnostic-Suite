import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft,
  Calendar,
  Loader2,
  Pencil,
  Tags,
  Trash2,
  User
} from 'lucide-react';
import KnowledgeArticleEditor from '../../components/knowledge/KnowledgeArticleEditor';

const API_URL = 'http://localhost:5000/api/knowledge';

export default function KnowledgeArticleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchArticle();
  }, [id]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(`${API_URL}/${id}`);
      setArticle(response.data);
    } catch (err) {
      console.error('Error fetching article:', err);
      setError(err.response?.data?.error || 'Failed to load the article.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (payload) => {
    try {
      setSubmitting(true);
      const response = await axios.put(`${API_URL}/${id}`, payload);
      setArticle(response.data);
      setEditorOpen(false);
    } catch (err) {
      console.error('Error updating article:', err);
      alert(err.response?.data?.error || 'Failed to update the article.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!article) {
      return;
    }

    const confirmed = window.confirm(`Delete "${article.title}"? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/${id}`);
      navigate('/technician/knowledge-base');
    } catch (err) {
      console.error('Error deleting article:', err);
      alert(err.response?.data?.error || 'Failed to delete the article.');
    }
  };

  const formatDate = (value) => {
    if (!value) {
      return 'N/A';
    }

    return new Date(value).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-blue-400" size={32} /></div>;
  }

  if (error || !article) {
    return (
      <div className="form-card py-10 text-center">
        <p className="text-lg text-white">Article unavailable</p>
        <p className="mt-2 text-slate-400">{error || 'The requested article could not be found.'}</p>
        <Link to="/technician/knowledge-base" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          <ArrowLeft size={16} />
          Back to Knowledge Base
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <Link to="/technician/knowledge-base" className="mb-3 inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300">
            <ArrowLeft size={16} />
            Back to Knowledge Base
          </Link>
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-medium text-blue-300">{article.device_brand}</span>
            <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-300">{article.issue_category}</span>
          </div>
          <h1 className="text-3xl font-bold text-white">{article.title}</h1>
          <p className="mt-3 max-w-3xl text-slate-300">{article.summary}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setEditorOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            <Pencil size={16} />
            Edit Article
          </button>
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetaCard icon={<User size={18} className="text-blue-400" />} label="Author" value={article.created_by?.name || 'System migration'} />
        <MetaCard icon={<Calendar size={18} className="text-green-400" />} label="Created" value={formatDate(article.created_at)} />
        <MetaCard icon={<Tags size={18} className="text-amber-400" />} label="Tags" value={article.tags?.length ? article.tags.join(', ') : 'No tags'} />
      </div>

      <div className="form-card">
        <div className="mb-4 border-b border-slate-700 pb-4">
          <h2 className="text-lg font-semibold text-white">Full Content</h2>
          <p className="mt-1 text-sm text-slate-400">Detailed steps, notes, and troubleshooting guidance for technicians.</p>
        </div>
        <div className="whitespace-pre-wrap leading-7 text-slate-200">
          {article.content}
        </div>
      </div>

      <KnowledgeArticleEditor
        open={editorOpen}
        article={article}
        submitting={submitting}
        onCancel={() => setEditorOpen(false)}
        onSubmit={handleUpdate}
      />
    </div>
  );
}

function MetaCard({ icon, label, value }) {
  return (
    <div className="form-card">
      <div className="mb-3 inline-flex rounded-lg bg-slate-800 p-2">
        {icon}
      </div>
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-1 text-white">{value}</p>
    </div>
  );
}
