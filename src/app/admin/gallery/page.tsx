'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { uploadImageToStorage } from '@/lib/supabase/storage';
import { DbGallery } from '@/types/database';
import { galleryItems } from '@/data/gallery';

export default function AdminGalleryPage() {
  const [items, setItems] = useState<DbGallery[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DbGallery | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState<Partial<DbGallery>>({
    title: '',
    image: '/images/hero-bride.jpg',
    alt_text: '',
    category: 'Bridal',
    featured: false,
    active: true,
    display_order: 1,
  });

  const loadGallery = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .order('display_order', { ascending: true });

      if (data && !error && data.length > 0) {
        setItems(data as DbGallery[]);
      } else {
        const fallback = galleryItems.map((g, i) => ({
          id: g.id,
          title: g.title,
          image: g.image,
          alt_text: g.caption,
          category: g.categoryLabel,
          featured: i < 3,
          active: true,
          display_order: i + 1,
        }));
        setItems(fallback);
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
          .from('gallery')
          .select('*')
          .order('display_order', { ascending: true });

        if (ignore) return;
        if (data && !error && data.length > 0) {
          setItems(data as DbGallery[]);
        } else {
          const fallback = galleryItems.map((g, i) => ({
            id: g.id,
            title: g.title,
            image: g.image,
            alt_text: g.caption,
            category: g.categoryLabel,
            featured: i < 3,
            active: true,
            display_order: i + 1,
          }));
          setItems(fallback);
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
    setEditingItem(null);
    setFormData({
      title: '',
      image: '/images/hero-bride.jpg',
      alt_text: '',
      category: 'Bridal',
      featured: false,
      active: true,
      display_order: items.length + 1,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: DbGallery) => {
    setEditingItem(item);
    setFormData(item);
    setIsModalOpen(true);
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setStatusMsg(null);

    const { url, error } = await uploadImageToStorage(file, 'gallery');
    if (error) {
      setStatusMsg({ type: 'error', text: `Upload error: ${error}` });
    } else if (url) {
      setFormData((prev) => ({ ...prev, image: url }));
      setStatusMsg({ type: 'success', text: 'Photo uploaded to Supabase Storage!' });
    }
    setUploadingImage(false);
  };

  const handleToggleActive = async (item: DbGallery) => {
    const newActive = !item.active;
    try {
      const supabase = createClient();
      await supabase.from('gallery').update({ active: newActive }).eq('id', item.id);
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, active: newActive } : i))
      );
    } catch {
      // Fallback
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this gallery photo?')) return;

    try {
      const supabase = createClient();
      await supabase.from('gallery').delete().eq('id', id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      setStatusMsg({ type: 'success', text: 'Gallery photo removed.' });
    } catch {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);

    try {
      const supabase = createClient();

      if (editingItem) {
        const { error } = await supabase
          .from('gallery')
          .update({
            title: formData.title,
            image: formData.image,
            alt_text: formData.alt_text,
            category: formData.category,
            featured: formData.featured,
            active: formData.active,
            display_order: Number(formData.display_order) || 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingItem.id);

        if (error) throw error;
        setStatusMsg({ type: 'success', text: 'Gallery item updated successfully!' });
      } else {
        const { error } = await supabase.from('gallery').insert([
          {
            title: formData.title,
            image: formData.image,
            alt_text: formData.alt_text,
            category: formData.category,
            featured: formData.featured,
            active: formData.active,
            display_order: Number(formData.display_order) || 1,
          },
        ]);

        if (error) throw error;
        setStatusMsg({ type: 'success', text: 'New gallery item created successfully!' });
      }

      setIsModalOpen(false);
      loadGallery();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error saving gallery item';
      setStatusMsg({
        type: 'error',
        text: `${msg}. (Run supabase/schema.sql in Supabase SQL editor if table is not yet created)`,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 sm:p-10 max-w-7xl w-full mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#EADBCE]">
        <div>
          <span className="text-xs uppercase tracking-wider font-bold text-[#B95945]">
            Visual Portfolio
          </span>
          <h1 className="font-serif-heading text-3xl sm:text-4xl font-semibold text-[#261B16] mt-1">
            Photo Gallery
          </h1>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4E2714] text-white text-xs sm:text-sm font-semibold hover:bg-[#381A0E] transition-all shadow-md self-start sm:self-auto"
        >
          <span>+ Upload Gallery Photo</span>
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

      {/* Visual Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-[#847269]">
          Loading gallery photos...
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#EADFD3]">
          <p className="text-sm text-[#847269]">
            No photos found in gallery. Click &quot;Upload Gallery Photo&quot; to begin.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl overflow-hidden border border-[#EADFD3] shadow-xs flex flex-col justify-between"
            >
              <div className="relative aspect-[4/3] w-full bg-[#FAF3EE]">
                <Image
                  src={item.image}
                  alt={item.alt_text || item.title}
                  fill
                  className="object-cover"
                />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-white/90 text-[#4E2714] shadow-xs">
                  {item.category}
                </span>
              </div>

              <div className="p-4 flex flex-col justify-between flex-grow">
                <div>
                  <h3 className="font-semibold text-sm text-[#261B16]">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#847269] mt-1 line-clamp-1">
                    {item.alt_text}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#F5ECE4] flex items-center justify-between">
                  <button
                    onClick={() => handleToggleActive(item)}
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold ${item.active
                        ? 'bg-[#EAFBF0] text-[#1EBE5D]'
                        : 'bg-red-50 text-red-500'
                      }`}
                  >
                    {item.active ? 'Visible' : 'Hidden'}
                  </button>

                  <div className="space-x-2">
                    <button
                      onClick={() => openEditModal(item)}
                      className="text-xs font-semibold text-[#4E2714] hover:text-[#B95945]"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-xs font-semibold text-red-600 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Dialog for Upload / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full border border-[#EADFD3] shadow-2xl my-8">
            <h2 className="font-serif-heading text-2xl font-semibold text-[#261B16]">
              {editingItem ? 'Edit Gallery Photo' : 'Upload Gallery Photo'}
            </h2>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#58463D] mb-1">
                  Photo Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Royal Maharani Bridal Palms"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FCF9F4] border border-[#D6C1AF] text-sm text-[#261B16] focus:outline-none focus:ring-2 focus:ring-[#4E2714]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#58463D] mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, category: e.target.value }))
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FCF9F4] border border-[#D6C1AF] text-sm text-[#261B16] focus:outline-none focus:ring-2 focus:ring-[#4E2714]"
                  >
                    <option value="Bridal">Bridal Couture</option>
                    <option value="Arabic">Modern Arabic</option>
                    <option value="Traditional">Traditional / Mandala</option>
                    <option value="Bridal Feet">Bridal Feet</option>
                    <option value="Minimal">Minimalist</option>
                    <option value="Custom">Custom / Studio</option>
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
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FCF9F4] border border-[#D6C1AF] text-sm text-[#261B16] focus:outline-none focus:ring-2 focus:ring-[#4E2714]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#58463D] mb-1">
                  Image URL or Upload *
                </label>
                <input
                  type="text"
                  required
                  value={formData.image}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, image: e.target.value }))
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FCF9F4] border border-[#D6C1AF] text-sm text-[#261B16] focus:outline-none focus:ring-2 focus:ring-[#4E2714] mb-2"
                />
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="text-xs text-[#703D24] file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#FAF3EE] file:text-[#4E2714]"
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
                  Alt Text / Caption
                </label>
                <input
                  type="text"
                  value={formData.alt_text || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, alt_text: e.target.value }))
                  }
                  placeholder="Bridal mehndi photoshoot in Indiranagar"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FCF9F4] border border-[#D6C1AF] text-sm text-[#261B16] focus:outline-none focus:ring-2 focus:ring-[#4E2714]"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
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
                  <span>Feature in Lookbook Highlights</span>
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
                  <span>Active (Visible)</span>
                </label>
              </div>

              <div className="pt-4 border-t border-[#F0E5D8] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#D6C1AF] text-xs font-semibold text-[#58463D] hover:bg-[#FAF3EE]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingImage}
                  className="px-5 py-2 rounded-xl bg-[#4E2714] text-white text-xs font-semibold hover:bg-[#381A0E] disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingItem ? 'Update Photo' : 'Add to Gallery'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
