import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { apiMessage } from '@/lib/api';
import { tagService } from '@/services/tag.service';
import type { BlogTag } from '@/types/blog';

export default function TagsPage() {
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [name, setName] = useState('');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [editing, setEditing] = useState<BlogTag | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BlogTag | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setDebounced(search);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  function load() {
    setLoading(true);
    setError('');
    tagService.getAdminTags({ page, limit: 10, search: debounced })
      .then((result) => {
        setTags(result.items);
        setTotalPages(result.totalPages);
      })
      .catch((loadError) => setError(apiMessage(loadError, 'Could not load tags.')))
      .finally(() => setLoading(false));
  }

  useEffect(load, [debounced, page]);

  async function save() {
    const trimmedName = name.trim();
    if (!trimmedName) return toast.error('Tag name is required.');
    if (tags.some((tag) => tag.name.toLowerCase() === trimmedName.toLowerCase() && tag.id !== editing?.id)) {
      return toast.error('A tag with this name already exists.');
    }
    setSaving(true);
    try {
      if (editing) {
        await tagService.updateTag(editing.id, { name: trimmedName, isActive: editing.isActive });
        toast.success('Tag updated.');
      } else {
        await tagService.createTag({ name: trimmedName, isActive: true });
        toast.success('Tag created.');
      }
      resetForm();
      load();
    } catch (saveError) {
      toast.error(apiMessage(saveError, 'Could not save tag.'));
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(tag: BlogTag) {
    setSaving(true);
    try {
      await tagService.updateTag(tag.id, { name: tag.name, isActive: !tag.isActive });
      toast.success(tag.isActive === false ? 'Tag activated.' : 'Tag deactivated.');
      load();
    } catch (toggleError) {
      toast.error(apiMessage(toggleError, 'Could not update tag status.'));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await tagService.deleteTag(deleteTarget.id);
      toast.success('Tag deleted.');
      setDeleteTarget(null);
      load();
    } catch (deleteError) {
      toast.error(apiMessage(deleteError, 'Delete is not available for this tag.'));
    } finally {
      setSaving(false);
    }
  }

  function startEdit(tag: BlogTag) {
    setEditing(tag);
    setName(tag.name);
  }

  function resetForm() {
    setName('');
    setEditing(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#a9793d]">Admin desk</p>
          <h2 className="mt-1 font-serif text-3xl font-semibold text-[#231b17]">Tags</h2>
        </div>
        <div className="relative w-full md:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#a19184]" />
          <Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tags" />
        </div>
      </div>
      <Card>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_auto]">
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Tag name" />
          <div className="flex gap-2">
            <Button type="button" disabled={saving} onClick={() => void save()}>{editing ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</Button>
            {editing && <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          {error && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#fff4f2] p-3 text-sm text-[#8c2f2f]">
              <span>{error}</span>
              <Button type="button" size="sm" variant="outline" onClick={load}><RefreshCw className="h-4 w-4" /> Retry</Button>
            </div>
          )}
          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-16 animate-pulse rounded-xl bg-[#eee6da]" />)}</div>
          ) : tags.length ? (
            <div className="space-y-3">
              {tags.map((tag) => (
                <div key={tag.id} className="flex flex-col gap-3 rounded-xl border border-[#ded3c4] bg-[#f4efe6] p-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-serif text-xl font-semibold text-[#231b17]">{tag.name}</p>
                      <span className="rounded-full bg-[#eee6da] px-2 py-0.5 text-xs font-semibold text-[#74685f]">{tag.isActive === false ? 'Inactive' : 'Active'}</span>
                      <span className="text-xs font-medium text-[#a19184]">{tag.usageCount ?? tag.blogCount ?? tag.blogsCount ?? tag.count ?? 0} uses</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => startEdit(tag)}><Pencil className="h-4 w-4" /> Edit</Button>
                    <Button type="button" size="sm" variant="outline" disabled={saving} onClick={() => void toggleActive(tag)}>{tag.isActive === false ? 'Activate' : 'Deactivate'}</Button>
                    <Button type="button" size="sm" variant="destructive" disabled={saving} onClick={() => setDeleteTarget(tag)}><Trash2 className="h-4 w-4" /> Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#74685f]">No tags match this search.</p>
          )}
        </CardContent>
      </Card>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete tag"
        message={`Delete "${deleteTarget?.name ?? 'this tag'}"? If the backend prevents deleting used tags, deactivate it instead.`}
        confirmLabel={saving ? 'Deleting...' : 'Delete'}
        onConfirm={() => void remove()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
