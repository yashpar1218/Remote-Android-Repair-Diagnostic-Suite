import { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';

const emptyForm = {
  title: '',
  device_brand: '',
  issue_category: '',
  summary: '',
  content: '',
  tags: ''
};

export default function KnowledgeArticleEditor({
  article,
  open,
  submitting = false,
  onCancel,
  onSubmit
}) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm({
      title: article?.title || '',
      device_brand: article?.device_brand || '',
      issue_category: article?.issue_category || '',
      summary: article?.summary || '',
      content: article?.content || '',
      tags: Array.isArray(article?.tags) ? article.tags.join(', ') : ''
    });
  }, [article, open]);

  if (!open) {
    return null;
  }

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSubmit({
      title: form.title.trim(),
      device_brand: form.device_brand.trim(),
      issue_category: form.issue_category.trim(),
      summary: form.summary.trim(),
      content: form.content.trim(),
      tags: form.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
    });
  };

  const isDisabled = submitting || !form.title.trim() || !form.device_brand.trim() || !form.issue_category.trim() || !form.summary.trim() || !form.content.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="form-card max-h-[90vh] w-full max-w-3xl overflow-y-auto border border-slate-700">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">
              {article ? 'Edit Article' : 'Create Article'}
            </h2>
            <p className="text-sm text-slate-400">
              Technicians can maintain troubleshooting guides and repair documentation here.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(event) => handleChange('title', event.target.value)}
              className="form-input"
              placeholder="Fix Bootloop on Xiaomi Devices"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="form-label">Device Brand</label>
              <input
                type="text"
                value={form.device_brand}
                onChange={(event) => handleChange('device_brand', event.target.value)}
                className="form-input"
                placeholder="Xiaomi"
              />
            </div>
            <div>
              <label className="form-label">Issue Category</label>
              <input
                type="text"
                value={form.issue_category}
                onChange={(event) => handleChange('issue_category', event.target.value)}
                className="form-input"
                placeholder="Bootloop"
              />
            </div>
          </div>

          <div>
            <label className="form-label">Summary</label>
            <textarea
              value={form.summary}
              onChange={(event) => handleChange('summary', event.target.value)}
              className="form-input"
              rows={3}
              placeholder="Short summary technicians can scan from the article list."
            />
          </div>

          <div>
            <label className="form-label">Full Content</label>
            <textarea
              value={form.content}
              onChange={(event) => handleChange('content', event.target.value)}
              className="form-input"
              rows={10}
              placeholder="Full troubleshooting guide..."
            />
          </div>

          <div>
            <label className="form-label">Tags</label>
            <input
              type="text"
              value={form.tags}
              onChange={(event) => handleChange('tags', event.target.value)}
              className="form-input"
              placeholder="xiaomi, bootloop, recovery"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg bg-slate-700 px-4 py-2 text-white transition-colors hover:bg-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isDisabled}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? <Loader2 className="animate-spin" size={18} /> : null}
              {article ? 'Save Changes' : 'Create Article'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
