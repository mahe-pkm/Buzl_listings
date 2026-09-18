'use client';

import { useState, useMemo, useCallback, useTransition } from 'react';
import type { CategoryWithDetails, CategorySummaryMetrics } from '@/types/category';
import {
  createCategory,
  updateCategory,
  toggleCategoryActive,
} from '@/lib/category-actions';

interface CategoryManagementViewProps {
  initialCategories: CategoryWithDetails[];
  initialMetrics: CategorySummaryMetrics;
  canManage: boolean;
}

export default function CategoryManagementView({
  initialCategories,
  initialMetrics,
  canManage,
}: CategoryManagementViewProps) {
  const [categories, setCategories] = useState<CategoryWithDetails[]>(initialCategories);
  const [metrics, setMetrics] = useState<CategorySummaryMetrics>(initialMetrics);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [hierarchyFilter, setHierarchyFilter] = useState<'all' | 'root' | 'sub'>('all');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryWithDetails | null>(null);
  const [deactivatingCategory, setDeactivatingCategory] = useState<CategoryWithDetails | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formParentId, setFormParentId] = useState<string>('');
  const [formSortOrder, setFormSortOrder] = useState<number>(0);
  const [formActive, setFormActive] = useState<boolean>(true);
  const [autoSlug, setAutoSlug] = useState<boolean>(true);

  const [formError, setFormError] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [isPending, startTransition] = useTransition();

  // Helper to recompute metrics
  const refreshMetrics = (list: CategoryWithDetails[]) => {
    let active = 0;
    let inactive = 0;
    let topLevel = 0;
    let inUse = 0;

    for (const c of list) {
      if (c.active) active += 1;
      else inactive += 1;
      if (!c.parent_id) topLevel += 1;
      if (c.total_listings > 0) inUse += 1;
    }

    setMetrics({
      total: list.length,
      active,
      inactive,
      topLevel,
      inUse,
    });
  };

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      // Status filter
      if (statusFilter === 'active' && !c.active) return false;
      if (statusFilter === 'inactive' && c.active) return false;

      // Hierarchy filter
      if (hierarchyFilter === 'root' && c.parent_id) return false;
      if (hierarchyFilter === 'sub' && !c.parent_id) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = c.name.toLowerCase().includes(q);
        const slugMatch = c.slug.toLowerCase().includes(q);
        const parentMatch = c.parent_name?.toLowerCase().includes(q) ?? false;
        if (!nameMatch && !slugMatch && !parentMatch) {
          return false;
        }
      }

      return true;
    });
  }, [categories, statusFilter, hierarchyFilter, searchQuery]);

  const hasFiltersApplied = searchQuery.trim() !== '' || statusFilter !== 'all' || hierarchyFilter !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setHierarchyFilter('all');
  };

  // Find descendant IDs of a category to prevent circular parent assignment
  const getDescendantIds = useCallback((catId: string): Set<string> => {
    const descendants = new Set<string>();
    const queue = [catId];
    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const c of categories) {
        if (c.parent_id === current && !descendants.has(c.id)) {
          descendants.add(c.id);
          queue.push(c.id);
        }
      }
    }
    return descendants;
  }, [categories]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormName('');
    setFormSlug('');
    setFormParentId('');
    setFormSortOrder(0);
    setFormActive(true);
    setAutoSlug(true);
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (cat: CategoryWithDetails) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setFormParentId(cat.parent_id || '');
    setFormSortOrder(cat.sort_order);
    setFormActive(cat.active);
    setAutoSlug(false);
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  // Handle Name change with auto-slug
  const handleNameChange = (val: string) => {
    setFormName(val);
    if (autoSlug) {
      const generated = val
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setFormSlug(generated);
    }
  };

  // Save (Create or Update)
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = formName.trim();
    if (!trimmedName) {
      setFormError('Category name is required.');
      return;
    }

    const trimmedSlug = formSlug.trim();
    if (!trimmedSlug) {
      setFormError('Category slug is required.');
      return;
    }

    startTransition(async () => {
      if (editingCategory) {
        // Update
        const result = await updateCategory(editingCategory.id, {
          name: trimmedName,
          slug: trimmedSlug,
          parent_id: formParentId || null,
          sort_order: Number(formSortOrder) || 0,
          active: formActive,
        });

        if (!result.success) {
          setFormError(result.error || 'Failed to update category.');
          return;
        }

        // Update local state
        const parentCat = categories.find((c) => c.id === formParentId);
        const updatedList = categories.map((c) => {
          if (c.id === editingCategory.id) {
            return {
              ...c,
              name: trimmedName,
              slug: trimmedSlug,
              parent_id: formParentId || null,
              parent_name: parentCat ? parentCat.name : null,
              sort_order: Number(formSortOrder) || 0,
              active: formActive,
            };
          }
          return c;
        });

        setCategories(updatedList);
        refreshMetrics(updatedList);
        setIsCreateModalOpen(false);
        setNoticeMessage({ type: 'success', text: `Category "${trimmedName}" updated successfully.` });
      } else {
        // Create
        const result = await createCategory({
          name: trimmedName,
          slug: trimmedSlug,
          parent_id: formParentId || null,
          sort_order: Number(formSortOrder) || 0,
          active: formActive,
        });

        if (!result.success || !result.category) {
          setFormError(result.error || 'Failed to create category.');
          return;
        }

        const parentCat = categories.find((c) => c.id === formParentId);
        const newCat: CategoryWithDetails = {
          ...result.category,
          parent_name: parentCat ? parentCat.name : null,
        };

        const updatedList = [...categories, newCat].sort(
          (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)
        );

        setCategories(updatedList);
        refreshMetrics(updatedList);
        setIsCreateModalOpen(false);
        setNoticeMessage({ type: 'success', text: `Category "${trimmedName}" created successfully.` });
      }
    });
  };

  // Toggle Active directly or open modal
  const handleToggleClick = (cat: CategoryWithDetails) => {
    if (cat.active) {
      // Deactivating: confirm
      setDeactivatingCategory(cat);
    } else {
      // Activating: immediate
      startTransition(async () => {
        const res = await toggleCategoryActive(cat.id, true);
        if (res.success) {
          const updated = categories.map((c) => (c.id === cat.id ? { ...c, active: true } : c));
          setCategories(updated);
          refreshMetrics(updated);
          setNoticeMessage({ type: 'success', text: `Category "${cat.name}" activated.` });
        } else {
          setNoticeMessage({ type: 'error', text: res.error || 'Failed to activate category.' });
        }
      });
    }
  };

  const handleConfirmDeactivation = () => {
    if (!deactivatingCategory) return;
    const cat = deactivatingCategory;

    startTransition(async () => {
      const res = await toggleCategoryActive(cat.id, false);
      if (res.success) {
        const updated = categories.map((c) => (c.id === cat.id ? { ...c, active: false } : c));
        setCategories(updated);
        refreshMetrics(updated);
        setDeactivatingCategory(null);
        setNoticeMessage({ type: 'success', text: `Category "${cat.name}" deactivated.` });
      } else {
        setNoticeMessage({ type: 'error', text: res.error || 'Failed to deactivate category.' });
        setDeactivatingCategory(null);
      }
    });
  };

  // Allowed parents for the dropdown (exclude self and descendants)
  const eligibleParents = useMemo(() => {
    if (!editingCategory) {
      return categories.filter((c) => c.active);
    }
    const descendants = getDescendantIds(editingCategory.id);
    return categories.filter((c) => c.id !== editingCategory.id && !descendants.has(c.id) && c.active);
  }, [categories, editingCategory, getDescendantIds]);

  return (
    <div className="space-y-6">
      {/* Toast Notice Banner */}
      {noticeMessage && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl text-sm font-medium border ${
            noticeMessage.type === 'success'
              ? 'bg-[#E3F2EA] text-[#087C3C] border-[#BCE5CF]'
              : 'bg-[#FDECEE] text-[#E36B5D] border-[#F8C8CE]'
          }`}
          role="alert"
        >
          <span>{noticeMessage.text}</span>
          <button
            type="button"
            onClick={() => setNoticeMessage(null)}
            className="text-xs underline hover:opacity-75"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2A3547]">Category Taxonomy</h1>
          <p className="text-sm text-[#5D6776] mt-1">
            Browse the directory category tree, inspect listing adoption, and maintain classifications.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!canManage && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#F2F5FA] text-[#5D6776] border border-[#DCE2E8]">
              <svg className="w-3.5 h-3.5 text-[#7D8795]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Read-Only Reference
            </span>
          )}
          {canManage && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#004AAD] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#003C8A] transition-colors focus:outline-none focus:ring-2 focus:ring-[#004AAD] focus:ring-offset-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Category
            </button>
          )}
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="rounded-xl border border-[#DCE2E8] bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#5D6776]">Total Categories</div>
          <div className="mt-2 text-2xl font-bold text-[#2A3547]">{metrics.total}</div>
          <div className="mt-1 text-xs text-[#5D6776]">Taxonomy size</div>
        </div>
        <div className="rounded-xl border border-[#DCE2E8] bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#087C3C]">Active</div>
          <div className="mt-2 text-2xl font-bold text-[#087C3C]">{metrics.active}</div>
          <div className="mt-1 text-xs text-[#5D6776]">Available for listings</div>
        </div>
        <div className="rounded-xl border border-[#DCE2E8] bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#9A6700]">Inactive</div>
          <div className="mt-2 text-2xl font-bold text-[#9A6700]">{metrics.inactive}</div>
          <div className="mt-1 text-xs text-[#5D6776]">Archived / disabled</div>
        </div>
        <div className="rounded-xl border border-[#DCE2E8] bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#004AAD]">Top-Level</div>
          <div className="mt-2 text-2xl font-bold text-[#004AAD]">{metrics.topLevel}</div>
          <div className="mt-1 text-xs text-[#5D6776]">Root classifications</div>
        </div>
        <div className="rounded-xl border border-[#DCE2E8] bg-white p-4 shadow-sm col-span-2 sm:col-span-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#6929C4]">In Use</div>
          <div className="mt-2 text-2xl font-bold text-[#6929C4]">{metrics.inUse}</div>
          <div className="mt-1 text-xs text-[#5D6776]">Has active listings</div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="rounded-xl border border-[#DCE2E8] bg-white p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#5D6776]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by category name, slug, or parent..."
              className="w-full pl-9 pr-8 py-2 rounded-lg border border-[#DCE2E8] text-sm text-[#2A3547] placeholder-[#A0AEC0] focus:outline-none focus:ring-2 focus:ring-[#004AAD] focus:border-transparent"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#5D6776] hover:text-[#2A3547]"
                aria-label="Clear search"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="status-filter" className="text-xs font-semibold text-[#5D6776] whitespace-nowrap">
                Status:
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                className="rounded-lg border border-[#DCE2E8] py-2 px-3 text-sm text-[#2A3547] bg-white focus:outline-none focus:ring-2 focus:ring-[#004AAD] focus:border-transparent font-medium"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>

            {/* Hierarchy Filter */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="hierarchy-filter" className="text-xs font-semibold text-[#5D6776] whitespace-nowrap">
                Hierarchy:
              </label>
              <select
                id="hierarchy-filter"
                value={hierarchyFilter}
                onChange={(e) => setHierarchyFilter(e.target.value as 'all' | 'root' | 'sub')}
                className="rounded-lg border border-[#DCE2E8] py-2 px-3 text-sm text-[#2A3547] bg-white focus:outline-none focus:ring-2 focus:ring-[#004AAD] focus:border-transparent font-medium"
              >
                <option value="all">All Levels</option>
                <option value="root">Top-Level Only</option>
                <option value="sub">Subcategories Only</option>
              </select>
            </div>
          </div>
        </div>

        {hasFiltersApplied && (
          <div className="flex items-center justify-between pt-2 border-t border-[#F2F5FA] text-xs">
            <span className="text-[#5D6776]">Active filters applied</span>
            <button
              type="button"
              onClick={resetFilters}
              className="font-semibold text-[#004AAD] hover:underline"
            >
              Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* Filter Summary */}
      <div className="flex items-center justify-between text-xs text-[#5D6776] px-1">
        <span>
          Showing <strong className="text-[#2A3547]">{filteredCategories.length}</strong> of{' '}
          <strong className="text-[#2A3547]">{categories.length}</strong> categories
        </span>
      </div>

      {/* Desktop Table (Visible on md+) */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-[#DCE2E8] bg-white shadow-sm">
        <table className="min-w-full text-left text-sm divide-y divide-[#DCE2E8]">
          <thead className="bg-[#F2F5FA] text-[#5D6776] text-xs uppercase tracking-wider font-semibold">
            <tr>
              <th className="py-3.5 px-4">Category Name</th>
              <th className="py-3.5 px-4">Slug</th>
              <th className="py-3.5 px-4">Hierarchy</th>
              <th className="py-3.5 px-4">Sort Order</th>
              <th className="py-3.5 px-4">Listings Usage</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DCE2E8] bg-white">
            {filteredCategories.length > 0 ? (
              filteredCategories.map((cat) => (
                <tr key={cat.id} className="hover:bg-[#F9FAFC] transition-colors">
                  {/* Category Name */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      {cat.parent_id && (
                        <span className="text-[#A0AEC0] font-mono text-sm select-none pl-2">↳</span>
                      )}
                      <div>
                        <div className="font-semibold text-[#2A3547]">{cat.name}</div>
                        {cat.child_count > 0 && (
                          <div className="text-xs text-[#5D6776] mt-0.5">
                            {cat.child_count} {cat.child_count === 1 ? 'subcategory' : 'subcategories'}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Slug */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#F2F5FA] text-[#2A3547] border border-[#DCE2E8]">
                      {cat.slug}
                    </span>
                  </td>

                  {/* Hierarchy */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {cat.parent_name ? (
                      <span className="inline-flex items-center gap-1 text-xs text-[#5D6776]">
                        <span className="text-[#A0AEC0]">in</span>
                        <strong className="text-[#2A3547] font-medium">{cat.parent_name}</strong>
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#ECF4FF] text-[#004AAD] border border-[#BEDBFE]">
                        Top-Level
                      </span>
                    )}
                  </td>

                  {/* Sort Order */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-xs text-[#5D6776] font-mono">
                    {cat.sort_order}
                  </td>

                  {/* Listings Usage */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {cat.total_listings > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-[#E3F2EA] text-[#087C3C] border border-[#BCE5CF]"
                          title={`${cat.published_listings} published listing(s)`}
                        >
                          {cat.published_listings} pub
                        </span>
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#F2F5FA] text-[#5D6776] border border-[#DCE2E8]"
                          title={`${cat.total_listings} total listing(s)`}
                        >
                          {cat.total_listings} tot
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-[#A0AEC0]">0 listings</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {cat.active ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E3F2EA] text-[#087C3C] border border-[#BCE5CF]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#087C3C]" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFF6DF] text-[#9A6700] border border-[#FFE7A8]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#9A6700]" />
                        Inactive
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-right">
                    {canManage ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(cat)}
                          disabled={isPending}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-[#004AAD] bg-[#ECF4FF] hover:bg-[#004AAD] hover:text-white transition-colors border border-[#BEDBFE]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleClick(cat)}
                          disabled={isPending}
                          className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors border ${
                            cat.active
                              ? 'text-[#C93B2B] bg-[#FDECEE] hover:bg-[#C93B2B] hover:text-white border-[#F8C8CE]'
                              : 'text-[#087C3C] bg-[#E3F2EA] hover:bg-[#087C3C] hover:text-white border-[#BCE5CF]'
                          }`}
                        >
                          {cat.active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-[#A0AEC0] italic select-none">View only</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-12 px-4 text-center">
                  <div className="flex flex-col items-center justify-center text-[#5D6776]">
                    <div className="w-12 h-12 rounded-full bg-[#F2F5FA] flex items-center justify-center mb-3 text-[#A0AEC0]">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    <div className="font-semibold text-base text-[#2A3547]">No categories found</div>
                    <div className="text-sm mt-1 max-w-sm text-[#5D6776]">
                      No categories matched your search criteria or selected filters.
                    </div>
                    {hasFiltersApplied && (
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="mt-4 px-4 py-2 rounded-lg bg-[#004AAD] text-white text-xs font-semibold hover:bg-[#003C8A] transition-colors"
                      >
                        Clear all filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Card View (Visible on < md) */}
      <div className="block md:hidden space-y-3">
        {filteredCategories.length > 0 ? (
          filteredCategories.map((cat) => (
            <div
              key={cat.id}
              className="rounded-xl border border-[#DCE2E8] bg-white p-4 shadow-sm space-y-3"
            >
              {/* Card Header: Name & Status */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-[#2A3547] text-sm flex items-center gap-1.5">
                    {cat.parent_id && <span className="text-[#A0AEC0] font-mono text-xs">↳</span>}
                    <span>{cat.name}</span>
                  </div>
                  <div className="font-mono text-xs text-[#5D6776] mt-0.5">{cat.slug}</div>
                </div>
                <div>
                  {cat.active ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#E3F2EA] text-[#087C3C] border border-[#BCE5CF]">
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#FFF6DF] text-[#9A6700] border border-[#FFE7A8]">
                      Inactive
                    </span>
                  )}
                </div>
              </div>

              {/* Hierarchy & Usage Info */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-[#F2F5FA]">
                <div>
                  <span className="text-[#5D6776]">Hierarchy: </span>
                  <span className="font-medium text-[#2A3547]">
                    {cat.parent_name ? `Sub of ${cat.parent_name}` : 'Top-Level'}
                  </span>
                </div>
                <div>
                  <span className="text-[#5D6776]">Listings: </span>
                  <span className="font-medium text-[#2A3547]">
                    {cat.total_listings} ({cat.published_listings} published)
                  </span>
                </div>
              </div>

              {/* Mobile Actions */}
              {canManage && (
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F2F5FA]">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(cat)}
                    disabled={isPending}
                    className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-[#004AAD] bg-[#ECF4FF] hover:bg-[#004AAD] hover:text-white transition-colors border border-[#BEDBFE]"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleClick(cat)}
                    disabled={isPending}
                    className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors border ${
                      cat.active
                        ? 'text-[#C93B2B] bg-[#FDECEE] hover:bg-[#C93B2B] hover:text-white border-[#F8C8CE]'
                        : 'text-[#087C3C] bg-[#E3F2EA] hover:bg-[#087C3C] hover:text-white border-[#BCE5CF]'
                    }`}
                  >
                    {cat.active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-[#DCE2E8] bg-white p-8 text-center text-[#5D6776]">
            <div className="font-semibold text-sm text-[#2A3547]">No categories found</div>
            <p className="text-xs mt-1">Try adjusting your search query or filters.</p>
          </div>
        )}
      </div>

      {/* Accessible Create / Edit Modal (Admin Only) */}
      {isCreateModalOpen && canManage && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="category-modal-title"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#DCE2E8] space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-[#DCE2E8] pb-3">
              <h2 id="category-modal-title" className="text-lg font-bold text-[#2A3547]">
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </h2>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-[#5D6776] hover:text-[#2A3547]"
                aria-label="Close dialog"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {formError && (
              <div
                className="p-3 rounded-lg bg-[#FDECEE] text-[#E36B5D] text-xs font-medium border border-[#F8C8CE]"
                role="alert"
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveCategory} className="space-y-4">
              {/* Category Name */}
              <div>
                <label htmlFor="cat-name" className="block text-xs font-semibold text-[#2A3547] mb-1">
                  Category Name <span className="text-[#C93B2B]">*</span>
                </label>
                <input
                  id="cat-name"
                  type="text"
                  required
                  maxLength={100}
                  value={formName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Health & Medical"
                  className="w-full px-3 py-2 rounded-lg border border-[#DCE2E8] text-sm text-[#2A3547] focus:outline-none focus:ring-2 focus:ring-[#004AAD]"
                />
              </div>

              {/* Slug */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="cat-slug" className="block text-xs font-semibold text-[#2A3547]">
                    Slug <span className="text-[#C93B2B]">*</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-[#5D6776] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoSlug}
                      onChange={(e) => setAutoSlug(e.target.checked)}
                      className="rounded border-[#DCE2E8] text-[#004AAD] focus:ring-[#004AAD]"
                    />
                    <span>Auto-sync with name</span>
                  </label>
                </div>
                <input
                  id="cat-slug"
                  type="text"
                  required
                  maxLength={100}
                  value={formSlug}
                  onChange={(e) => {
                    setFormSlug(e.target.value);
                    setAutoSlug(false);
                  }}
                  placeholder="e.g. health-medical"
                  className="w-full px-3 py-2 rounded-lg border border-[#DCE2E8] text-sm font-mono text-[#2A3547] focus:outline-none focus:ring-2 focus:ring-[#004AAD]"
                />
                <p className="text-[11px] text-[#5D6776] mt-1">
                  Lowercase letters, numbers, and hyphens only. Used in URL routing.
                </p>
              </div>

              {/* Parent Category */}
              <div>
                <label htmlFor="cat-parent" className="block text-xs font-semibold text-[#2A3547] mb-1">
                  Parent Category (Optional)
                </label>
                <select
                  id="cat-parent"
                  value={formParentId}
                  onChange={(e) => setFormParentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#DCE2E8] text-sm text-[#2A3547] bg-white focus:outline-none focus:ring-2 focus:ring-[#004AAD]"
                >
                  <option value="">None (Top-Level Category)</option>
                  {eligibleParents.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.parent_name ? `(sub of ${p.parent_name})` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-[#5D6776] mt-1">
                  Select a parent to nest this category under a parent classification.
                </p>
              </div>

              {/* Sort Order */}
              <div>
                <label htmlFor="cat-sort" className="block text-xs font-semibold text-[#2A3547] mb-1">
                  Sort Order
                </label>
                <input
                  id="cat-sort"
                  type="number"
                  min={0}
                  value={formSortOrder}
                  onChange={(e) => setFormSortOrder(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 rounded-lg border border-[#DCE2E8] text-sm text-[#2A3547] focus:outline-none focus:ring-2 focus:ring-[#004AAD]"
                />
                <p className="text-[11px] text-[#5D6776] mt-1">
                  Lower numbers display first (0 is highest priority).
                </p>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  id="cat-active"
                  type="checkbox"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  className="h-4 w-4 rounded border-[#DCE2E8] text-[#004AAD] focus:ring-[#004AAD]"
                />
                <label htmlFor="cat-active" className="text-sm font-medium text-[#2A3547]">
                  Active category (available for listing creation and search)
                </label>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#DCE2E8]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isPending}
                  className="px-4 py-2 rounded-lg border border-[#DCE2E8] text-sm font-medium text-[#5D6776] hover:bg-[#F2F5FA] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#004AAD] text-sm font-semibold text-white hover:bg-[#003C8A] transition-colors focus:outline-none focus:ring-2 focus:ring-[#004AAD] focus:ring-offset-2 disabled:opacity-50"
                >
                  {isPending && (
                    <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  )}
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deactivation Confirmation Modal */}
      {deactivatingCategory && canManage && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="deactivate-modal-title"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#DCE2E8] space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-[#DCE2E8] pb-3">
              <h2 id="deactivate-modal-title" className="text-lg font-bold text-[#C93B2B]">
                Deactivate Category
              </h2>
              <button
                type="button"
                onClick={() => setDeactivatingCategory(null)}
                className="text-[#5D6776] hover:text-[#2A3547]"
                aria-label="Close dialog"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="text-sm text-[#2A3547] space-y-3">
              <p>
                Are you sure you want to deactivate{' '}
                <strong className="text-[#2A3547]">&quot;{deactivatingCategory.name}&quot;</strong>?
              </p>

              {deactivatingCategory.published_listings > 0 ? (
                <div className="p-3 rounded-lg bg-[#FFF6DF] border border-[#FFE7A8] text-[#9A6700] text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Cannot Deactivate (Published Listings Exist)
                  </div>
                  <p>
                    This category is currently assigned to{' '}
                    <strong>{deactivatingCategory.published_listings} published listing(s)</strong>.
                    Database integrity rules prevent deactivating a category that has active published
                    businesses. Please reassign or unpublish those listings first.
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-[#F2F5FA] border border-[#DCE2E8] text-[#5D6776] text-xs">
                  This category currently has 0 published listings ({deactivatingCategory.total_listings} draft/pending).
                  Deactivating it will prevent business owners and members from selecting it for new listings.
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#DCE2E8]">
              <button
                type="button"
                onClick={() => setDeactivatingCategory(null)}
                disabled={isPending}
                className="px-4 py-2 rounded-lg border border-[#DCE2E8] text-sm font-medium text-[#5D6776] hover:bg-[#F2F5FA] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeactivation}
                disabled={isPending || deactivatingCategory.published_listings > 0}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#C93B2B] text-sm font-semibold text-white hover:bg-[#A82E20] transition-colors focus:outline-none focus:ring-2 focus:ring-[#C93B2B] focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isPending && (
                  <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                )}
                Confirm Deactivation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
