import React, { useEffect, useState } from 'react';
import { ViewType, OdooViewManager } from '@/components/views/OdooViewManager';
import { OdooDataGrid } from '@/components/shared/OdooDataGrid';
import { GlassCard } from '@/components/shared/GlassCard';
import { GradientButton } from '@/components/shared/GradientButton';
import { ChatterPanel } from '@/components/shared/ChatterPanel';
import { useStudioStore, StudioPage } from '../stores/studioStore';
import { Pencil, Globe, CheckCircle } from 'lucide-react';

const STAGE_COLORS: Record<string, string> = {
  draft: 'text-gray-400',
  published: 'text-green-400',
};

export const StudioModule: React.FC = () => {
  const { pages, fetch, create, update, remove, publish, loading } = useStudioStore();

  const [currentView, setCurrentView] = useState<ViewType>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [activePage, setActivePage] = useState<StudioPage | null>(null);
  const [formData, setFormData] = useState<Partial<StudioPage>>({});
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    void fetch();
  }, []);

  const handleNew = () => {
    setActivePage(null);
    setFormData({ name: 'New Page', slug: '', content: '', state: 'draft' });
    setShowForm(true);
  };

  const handleEdit = (page: StudioPage) => {
    setActivePage(page);
    setFormData({ ...page });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.name) return;
    if (activePage?.id) {
      await update(activePage.id, formData);
    } else {
      const slug = (formData.slug || formData.name || '')
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
      await create({ ...formData, slug });
    }
    setShowForm(false);
    await fetch();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Delete this page?')) {
      await remove(id);
      setActivePage(p => (p?.id === id ? null : p));
    }
  };

  const filtered = pages.filter(
    p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const renderGrid = () => (
    <OdooDataGrid
      columns={[
        {
          key: 'name',
          label: 'Name',
          cell: p => <span className="font-medium text-white">{p.name}</span>,
        },
        {
          key: 'slug',
          label: 'Slug',
          cell: p => <span className="text-gray-400 font-mono text-sm">{p.slug}</span>,
        },
        {
          key: 'state',
          label: 'State',
          cell: p => (
            <span className={`${STAGE_COLORS[p.state] || 'text-gray-400'} capitalize text-sm`}>
              {p.state}
            </span>
          ),
        },
        {
          key: 'publishedAt',
          label: 'Published',
          cell: p =>
            p.publishedAt ? (
              <span className="text-gray-400 text-sm flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-400" />
              </span>
            ) : (
              <span className="text-gray-600 text-sm">—</span>
            ),
        },
        {
          key: 'actions',
          label: 'Actions',
          cell: p => (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleEdit(p)}
                className="p-1.5 text-primary-400 hover:bg-gray-700 rounded"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => void handleDelete(p.id)}
                className="p-1.5 text-red-400 hover:bg-gray-700 rounded"
              >
                ✕
              </button>
            </div>
          ),
        },
      ]}
      data={filtered}
      readonly
    />
  );

  const renderForm = () => (
    <GlassCard>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Page Name</label>
          <input
            value={formData.name || ''}
            onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
            placeholder="Page name"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Slug</label>
          <input
            value={formData.slug || ''}
            onChange={e => setFormData(f => ({ ...f, slug: e.target.value }))}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-primary-500"
            placeholder="page-slug"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Content</label>
          <textarea
            value={formData.content || ''}
            onChange={e => setFormData(f => ({ ...f, content: e.target.value }))}
            rows={10}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500 font-mono text-sm"
            placeholder="HTML content..."
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Meta Title</label>
          <input
            value={formData.metaTitle || ''}
            onChange={e => setFormData(f => ({ ...f, metaTitle: e.target.value }))}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
            placeholder="SEO title"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Meta Description</label>
          <textarea
            value={formData.metaDescription || ''}
            onChange={e => setFormData(f => ({ ...f, metaDescription: e.target.value }))}
            rows={2}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
            placeholder="SEO description"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <GradientButton onClick={() => void handleSave()}>Save Page</GradientButton>
          <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-400 hover:text-white">
            Cancel
          </button>
        </div>
      </div>
    </GlassCard>
  );

  const chatterOwnerId = activePage?.id;

  return (
    <div className="flex gap-4 h-full">
      <div className="flex-1 overflow-auto">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-white">Website Studio</h2>
          <p className="text-sm text-gray-400">Create and manage public pages with SEO metadata</p>
        </div>
        {showForm ? (
          renderForm()
        ) : (
          <OdooViewManager
            title="Pages"
            currentView={currentView}
            onViewChange={setCurrentView}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onNew={handleNew}
            viewsAvailable={['list', 'kanban']}
          >
            {loading ? (
              <p className="text-sm text-white/40">Loading pages…</p>
            ) : (
              renderGrid()
            )}
          </OdooViewManager>
        )}
      </div>
      {(activePage || showForm) && (
        <div className="w-80 flex-shrink-0 space-y-3">
          {chatterOwnerId ? (
            <ChatterPanel ownerType="StudioPage" ownerId={chatterOwnerId} showTimeline />
          ) : showForm ? (
            <GlassCard>
              <p className="text-sm text-white/60">Save the page to enable record chatter and timeline.</p>
            </GlassCard>
          ) : null}
          {activePage && !showForm && (
            <GradientButton onClick={() => void publish(activePage.id)} className="w-full">
              <Globe className="w-4 h-4 mr-2" /> Publish
            </GradientButton>
          )}
        </div>
      )}
    </div>
  );
};
