'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { uploadImageToStorage } from '@/lib/supabase/storage';
import { DbDesign } from '@/types/database';
import { mehndiDesigns } from '@/data/designs';

export default function AdminDesignsPage() {
  const [designs, setDesigns] = useState<DbDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDesign, setEditingDesign] = useState<DbDesign | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<DbDesign>>({
    title: '',
    slug: '',
    category: 'Bridal',
    description: '',
    image: '/images/hero-bride.jpg',
    alt_text: '',
    featured: false,
    active: true,
    display_order: 1,
  });

  const loadDesigns = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('mehndi_designs')
        .select('*')
        .order('display_order', { ascending: true });

      if (data && !error && data.length > 0) {
        setDesigns(data as DbDesign[]);
      } else {
        const fallback = mehndiDesigns.map((d, i) => ({
          id: d.id,
          title: d.title,
          slug: d.slug,
          category: (d.categoryLabel.includes('Arabic') ? 'Arabic' : d.categoryLabel.includes('Bridal') ? 'Bridal' : 'Traditional') as DbDesign['category'],
          description: d.shortDescription,
          image: d.image,
          alt_text: d.title,
          featured: !!d.featured,
          active: true,
          display_order: i + 1,
        }));
        setDesigns(fallback);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('mehndi_designs')
          .select('*')
          .order('display_order', { ascending: true });

        if (ignore) return;
        if (data && !error && data.length > 0) {
          setDesigns(data as DbDesign[]);
        } else {
          const fallback = mehndiDesigns.map((d, i) => ({
            id: d.id,
            title: d.title,
            slug: d.slug,
            category: (d.categoryLabel.includes('Arabic') ? 'Arabic' : d.categoryLabel.includes('Bridal') ? 'Bridal' : 'Traditional') as DbDesign['category'],
            description: d.shortDescription,
            image: d.image,
            alt_text: d.title,
            featured: !!d.featured,
            active: true,
            display_order: i + 1,
          }));
          setDesigns(fallback);
        }
      } catch {
        // Fallback
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const openAddModal = () => {
    setEditingDesign(null);
    setFormData({
      title: '',
      slug: '',
      category: 'Bridal',
      description: '',
      image: '/images/hero-bride.jpg',
      alt_text: '',
      featured: false,
      active: true,
      display_order: designs.length + 1,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (design: DbDesign) => {
    setEditingDesign(design);
    setFormData(design);
    setIsModalOpen(true);
  };

  const handleTitleChange = (val: string) => {
    setFormData((prev) => ({
      ...prev,
      title: val,
      slug: prev.slug || val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
    }));
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setStatusMsg(null);

    const { url, error } = await uploadImageToStorage(file, 'designs');
    if (error) {
      setStatusMsg({ type: 'error', text: `Upload failed: ${error}` });
    } else if (url) {
      setFormData((prev) => ({ ...prev, image: url }));
      setStatusMsg({ type: 'success', text: 'Image uploaded to Supabase Storage!' });
    }
    setUploadingImage(false);
  };

  const handleToggleActive = async (design: DbDesign) => {
    const newActive = !design.active;
    try {
      const supabase = createClient();
      await supabase
        .from('mehndi_designs')
        .update({ active: newActive })
        .eq('id', design.id);

      setDesigns((prev) =>
        prev.map((d) => (d.id === design.id ? { ...d, active: newActive } : d))
      );
    } catch {
      // Fallback
    }
  };

  const handleToggleFeatured = async (design: DbDesign) => {
    const newFeatured = !design.featured;
    try {
      const supabase = createClient();
      await supabase
        .from('mehndi_designs')
        .update({ featured: newFeatured })
        .eq('id', design.id);

      setDesigns((prev) =>
        prev.map((d) => (d.id === design.id ? { ...d, featured: newFeatured } : d))
      );
    } catch {
      // Fallback
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this design?')) return;

    try {
      const supabase = createClient();
      const { error } = await supabase.from('mehndi_designs').delete().eq('id', id);

      if (!error) {
        setDesigns((prev) => prev.filter((d) => d.id !== id));
        setStatusMsg({ type: 'success', text: 'Design deleted successfully.' });
      }
    } catch {
      setDesigns((prev) => prev.filter((d) => d.id !== id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);

    try {
      const supabase = createClient();

      if (editingDesign) {
        const { error } = await supabase
          .from('mehndi_designs')
          .update({
            title: formData.title,
            slug: formData.slug,
            category: formData.category,
            description: formData.description,
            image: formData.image,
            alt_text: formData.alt_text,
            featured: formData.featured,
            active: formData.active,
            display_order: Number(formData.display_order) || 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingDesign.id);

        if (error) throw error;
        setStatusMsg({ type: 'success', text: 'Design updated successfully!' });
      } else {
        const { error } = await supabase.from('mehndi_designs').insert([
          {
            title: formData.title,
            slug: formData.slug,
            category: formData.category,
            description: formData.description,
            image: formData.image,
            alt_text: formData.alt_text,
            featured: formData.featured,
            active: formData.active,
            display_order: Number(formData.display_order) || 1,
          },
        ]);

        if (error) throw error;
        setStatusMsg({ type: 'success', text: 'New design created successfully!' });
      }

      setIsModalOpen(false);
      loadDesigns();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error saving design';
      setStatusMsg({
        type: 'error',
        text: `${msg}. (Note: If tables are not yet created, run supabase/schema.sql in your Supabase SQL editor)`,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#EADBCE]">
        <div>
          <span className="text-xs uppercase tracking-wider font-bold text-[#B95945]">
            Portfolio Content
          </span>
          <h1 className="font-serif-heading text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#261B16] mt-1">
            Mehndi Designs
          </h1>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#4E2714] text-white text-xs sm:text-sm font-semibold hover:bg-[#381A0E] transition-all shadow-md w-full sm:w-auto cursor-pointer"
        >
          <span>+ Add New Design</span>
        </button>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed border ${statusMsg.type === 'success'
              ? 'bg-[#EAFBF0] border-[#D0F4DE] text-[#1EBE5D]'
              : 'bg-[#FDF2F2] border-[#F8D7DA] text-[#9B2C2C]'
            }`}
        >
          {statusMsg.text}
        </div>
      )}

      {/* Designs Table / Card List */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#EADFD3] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm min-w-[640px]">
            <thead className="bg-[#FAF6F0] border-b border-[#EADBCE] text-[#847269] uppercase tracking-wider text-[11px] whitespace-nowrap">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Image</th>
                <th className="py-3.5 px-4 font-semibold">Title & Slug</th>
                <th className="py-3.5 px-4 font-semibold">Category</th>
                <th className="py-3.5 px-4 font-semibold text-center">Featured</th>
                <th className="py-3.5 px-4 font-semibold text-center">Active</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5ECE4]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-[#847269]">
                    Loading mehndi designs...
                  </td>
                </tr>
              ) : designs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-[#847269]">
                    No designs found. Click &quot;Add New Design&quot; to create your first design.
                  </td>
                </tr>
              ) : (
                designs.map((design) => (
                  <tr key={design.id} className="hover:bg-[#FAF9F6] transition-colors">
                    <td className="py-3 px-4">
                      <div className="w-14 h-14 relative rounded-xl overflow-hidden bg-[#F5ECE4] border border-[#EADBCE] shrink-0">
                        <Image
                          src={design.image}
                          alt={design.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#261B16]">{design.title}</div>
                      <div className="text-[11px] text-[#847269] font-mono mt-0.5">
                        /{design.slug}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FAF3EE] text-[#4E2714] border border-[#EADBCE]">
                        {design.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleToggleFeatured(design)}
                        className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors cursor-pointer ${design.featured
                            ? 'bg-[#F9F5EA] text-[#7E5E1C] border border-[#ECDDBF]'
                            : 'bg-gray-100 text-gray-500'
                          }`}
                      >
                        {design.featured ? '★ Featured' : 'Normal'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(design)}
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-colors cursor-pointer ${design.active
                            ? 'bg-[#EAFBF0] text-[#1EBE5D] border border-[#D0F4DE]'
                            : 'bg-red-50 text-red-500 border border-red-200'
                          }`}
                      >
                        {design.active ? 'Active' : 'Hidden'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                      <button
                        onClick={() => openEditModal(design)}
                        className="text-xs font-semibold text-[#4E2714] hover:text-[#B95945] px-2 py-1 rounded hover:bg-[#FAF3EE] cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(design.id)}
                        className="text-xs font-semibold text-red-600 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Dialog for Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-xl w-full border border-[#EADFD3] shadow-2xl my-auto max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-[#F0E5D8] flex items-center justify-between gap-4 shrink-0 bg-[#FAF8F5]/80">
              <h2 className="font-serif-heading text-xl sm:text-2xl font-semibold text-[#261B16]">
                {editingDesign ? 'Edit Mehndi Design' : 'Add New Mehndi Design'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#847269] hover:text-[#261B16] hover:bg-[#FAF3EE] transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#58463D] mb-1">
                    Design Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="e.g. Royal Maharani Bridal Ensemble"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FCF9F4] border border-[#D6C1AF] text-sm text-[#261B16] focus:outline-none focus:ring-2 focus:ring-[#4E2714]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#58463D] mb-1">
                    Slug (URL path) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, slug: e.target.value }))
                    }
                    placeholder="royal-maharani-bridal"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FCF9F4] border border-[#D6C1AF] text-sm font-mono text-[#261B16] focus:outline-none focus:ring-2 focus:ring-[#4E2714]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#58463D] mb-1">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          category: e.target.value as DbDesign['category'],
                        }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FCF9F4] border border-[#D6C1AF] text-sm text-[#261B16] focus:outline-none focus:ring-2 focus:ring-[#4E2714] cursor-pointer"
                    >
                      <option value="Bridal">Bridal</option>
                      <option value="Arabic">Arabic</option>
                      <option value="Traditional">Traditional</option>
                      <option value="Minimal">Minimal</option>
                      <option value="Modern">Modern</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#58463D] mb-1">
                      Display Order
                    </label>
                    <input
                      type="number"
                      value={formData.display_order}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          display_order: parseInt(e.target.value, 10) || 1,
                        }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FCF9F4] border border-[#D6C1AF] text-sm text-[#261B16] focus:outline-none focus:ring-2 focus:ring-[#4E2714]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#58463D] mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FCF9F4] border border-[#D6C1AF] text-sm text-[#261B16] focus:outline-none focus:ring-2 focus:ring-[#4E2714]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#58463D] mb-1">
                    Design Image URL or Upload *
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      required
                      value={formData.image}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, image: e.target.value }))
                      }
                      placeholder="/images/hero-bride.jpg or Supabase storage URL"
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#FCF9F4] border border-[#D6C1AF] text-sm text-[#261B16] focus:outline-none focus:ring-2 focus:ring-[#4E2714]"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="text-xs text-[#703D24] file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#FAF3EE] file:text-[#4E2714] hover:file:bg-[#F5ECE4] cursor-pointer"
                    />
                    {uploadingImage && (
                      <span className="text-xs text-[#B95945] animate-pulse">
                        Uploading to Supabase...
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#58463D] mb-1">
                    Image Alt Text
                  </label>
                  <input
                    type="text"
                    value={formData.alt_text || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, alt_text: e.target.value }))
                    }
                    placeholder="Bridal mehndi hands in Bangalore"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FCF9F4] border border-[#D6C1AF] text-sm text-[#261B16] focus:outline-none focus:ring-2 focus:ring-[#4E2714]"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#4E2714]">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          featured: e.target.checked,
                        }))
                      }
                      className="rounded text-[#4E2714] focus:ring-[#4E2714]"
                    />
                    <span>Feature on Homepage</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#4E2714]">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          active: e.target.checked,
                        }))
                      }
                      className="rounded text-[#4E2714] focus:ring-[#4E2714]"
                    />
                    <span>Active (Visible to public)</span>
                  </label>
                </div>
              </div>

              <div className="p-4 sm:p-6 border-t border-[#F0E5D8] bg-[#FAF8F5]/80 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#D6C1AF] text-xs font-semibold text-[#58463D] hover:bg-white transition-colors cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingImage}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#4E2714] text-white text-xs font-semibold hover:bg-[#381A0E] transition-all disabled:opacity-50 cursor-pointer text-center shadow-xs"
                >
                  {saving ? 'Saving...' : editingDesign ? 'Update Design' : 'Create Design'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
