import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { apiMessage } from '@/lib/api';
import { categoryService } from '@/services/category.service';
import type { BlogCategory } from '@/types/blog';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [editing, setEditing] = useState<BlogCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BlogCategory | null>(null);
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
    categoryService.getAdminCategories({ page, limit: 10, search: debounced })
      .then((result) => {
        setCategories(result.items);
        setTotalPages(result.totalPages);
      })
      .catch((loadError) => setError(apiMessage(loadError, 'Could not load categories.')))
      .finally(() => setLoading(false));
  }

  useEffect(load, [debounced, page]);

  async function save() {
    const trimmedName = name.trim();
    if (!trimmedName) return toast.error('Category name is required.');
    if (categories.some((category) => category.name.toLowerCase() === trimmedName.toLowerCase() && category.id !== editing?.id)) {
      return toast.error('A category with this name already exists.');
    }
    setSaving(true);
    try {
      if (editing) {
        await categoryService.updateCategory(editing.id, { name: trimmedName, description: description.trim(), isActive: editing.isActive });
        toast.success('Category updated.');
      } else {
        await categoryService.createCategory({ name: trimmedName, description: description.trim(), isActive: true });
        toast.success('Category created.');
      }
      resetForm();
      load();
    } catch (saveError) {
      toast.error(apiMessage(saveError, 'Could not save category.'));
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(category: BlogCategory) {
    setSaving(true);
    try {
      await categoryService.updateCategory(category.id, { name: category.name, description: category.description, isActive: !category.isActive });
      toast.success(category.isActive === false ? 'Category activated.' : 'Category deactivated.');
      load();
    } catch (toggleError) {
      toast.error(apiMessage(toggleError, 'Could not update category status.'));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await categoryService.deleteCategory(deleteTarget.id);
      toast.success('Category deleted.');
      setDeleteTarget(null);
      load();
    } catch (deleteError) {
      toast.error(apiMessage(deleteError, 'Delete is not available for this category.'));
    } finally {
      setSaving(false);
    }
  }

  function startEdit(category: BlogCategory) {
    setEditing(category);
    setName(category.name);
    setDescription(category.description ?? '');
  }

  function resetForm() {
    setName('');
    setDescription('');
    setEditing(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#a9793d]">Admin desk</p>
          <h2 className="mt-1 font-serif text-3xl font-semibold text-[#231b17]">Categories</h2>
        </div>
        <div className="relative w-full md:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#a19184]" />
          <Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search categories" />
        </div>
      </div>
      <Card>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Category name" />
          <Input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description (optional)" />
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
          ) : categories.length ? (
            <div className="space-y-3">
              {categories.map((category) => (
                <div key={category.id} className="flex flex-col gap-3 rounded-xl border border-[#ded3c4] bg-[#f4efe6] p-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-serif text-xl font-semibold text-[#231b17]">{category.name}</p>
                      <span className="rounded-full bg-[#eee6da] px-2 py-0.5 text-xs font-semibold text-[#74685f]">{category.isActive === false ? 'Inactive' : 'Active'}</span>
                      <span className="text-xs font-medium text-[#a19184]">{category.blogCount ?? category.blogsCount ?? category.count ?? 0} blogs</span>
                    </div>
                    {category.description && <p className="mt-1 text-sm text-[#74685f]">{category.description}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => startEdit(category)}><Pencil className="h-4 w-4" /> Edit</Button>
                    <Button type="button" size="sm" variant="outline" disabled={saving} onClick={() => void toggleActive(category)}>{category.isActive === false ? 'Activate' : 'Deactivate'}</Button>
                    <Button type="button" size="sm" variant="destructive" disabled={saving} onClick={() => setDeleteTarget(category)}><Trash2 className="h-4 w-4" /> Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#74685f]">No categories match this search.</p>
          )}
        </CardContent>
      </Card>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete category"
        message={`Delete "${deleteTarget?.name ?? 'this category'}"? If the backend prevents deleting used categories, deactivate it instead.`}
        confirmLabel={saving ? 'Deleting...' : 'Delete'}
        onConfirm={() => void remove()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
