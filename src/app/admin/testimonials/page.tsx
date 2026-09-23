'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DbTestimonial } from '@/types/database';
import { testimonialsData } from '@/data/testimonials';
import { StarIcon } from '@/components/ui/icons';

export default function AdminTestimonialsPage() {
  const [reviews, setReviews] = useState<DbTestimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<DbTestimonial | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState<Partial<DbTestimonial>>({
    customer_name: '',
    review: '',
    rating: 5,
    image: 'Sadashivanagar, Bangalore',
    active: true,
    featured: false,
    display_order: 1,
  });

  const loadReviews = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('display_order', { ascending: true });

      if (data && !error && data.length > 0) {
        setReviews(data as DbTestimonial[]);
      } else {
        const fallback = testimonialsData.map((t, i) => ({
          id: t.id,
          customer_name: t.clientName,
          review: t.quote,
          rating: t.rating,
          image: t.bangaloreArea,
          active: true,
          featured: !!t.featured,
          display_order: i + 1,
        }));
        setReviews(fallback);
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
          .from('testimonials')
          .select('*')
          .order('display_order', { ascending: true });

        if (ignore) return;
        if (data && !error && data.length > 0) {
          setReviews(data as DbTestimonial[]);
        } else {
          const fallback = testimonialsData.map((t, i) => ({
            id: t.id,
            customer_name: t.clientName,
            review: t.quote,
            rating: t.rating,
            image: t.bangaloreArea,
            active: true,
            featured: !!t.featured,
            display_order: i + 1,
          }));
          setReviews(fallback);
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
    setEditingReview(null);
    setFormData({
      customer_name: '',
      review: '',
      rating: 5,
      image: 'Koramangala, Bangalore',
      active: true,
      featured: false,
      display_order: reviews.length + 1,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (review: DbTestimonial) => {
    setEditingReview(review);
    setFormData(review);
    setIsModalOpen(true);
  };

  const handleToggleActive = async (review: DbTestimonial) => {
    const newActive = !review.active;
    try {
      const supabase = createClient();
      await supabase.from('testimonials').update({ active: newActive }).eq('id', review.id);
      setReviews((prev) =>
        prev.map((r) => (r.id === review.id ? { ...r, active: newActive } : r))
      );
    } catch {
      // Fallback
    }
  };

  const handleToggleFeatured = async (review: DbTestimonial) => {
    const newFeatured = !review.featured;
    try {
      const supabase = createClient();
      await supabase.from('testimonials').update({ featured: newFeatured }).eq('id', review.id);
      setReviews((prev) =>
        prev.map((r) => (r.id === review.id ? { ...r, featured: newFeatured } : r))
      );
    } catch {
      // Fallback
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this testimonial?')) return;

    try {
      const supabase = createClient();
      await supabase.from('testimonials').delete().eq('id', id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
      setStatusMsg({ type: 'success', text: 'Testimonial removed successfully.' });
    } catch {
      setReviews((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);

    try {
      const supabase = createClient();

      if (editingReview) {
        const { error } = await supabase
          .from('testimonials')
          .update({
            customer_name: formData.customer_name,
            review: formData.review,
            rating: Number(formData.rating) || 5,
            image: formData.image,
            active: formData.active,
            featured: formData.featured,
            display_order: Number(formData.display_order) || 1,
          })
          .eq('id', editingReview.id);

        if (error) throw error;
        setStatusMsg({ type: 'success', text: 'Testimonial updated!' });
      } else {
        const { error } = await supabase.from('testimonials').insert([
          {
            customer_name: formData.customer_name,
            review: formData.review,
            rating: Number(formData.rating) || 5,
            image: formData.image,
            active: formData.active,
            featured: formData.featured,
            display_order: Number(formData.display_order) || 1,
          },
        ]);

        if (error) throw error;
        setStatusMsg({ type: 'success', text: 'New testimonial added!' });
      }

      setIsModalOpen(false);
      loadReviews();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error saving testimonial';
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
            Client Praise
          </span>
          <h1 className="font-serif-heading text-3xl sm:text-4xl font-semibold text-[#261B16] mt-1">
            Testimonials & Reviews
          </h1>
          <p className="text-xs sm:text-sm text-[#703D24] mt-1">
            Manage feedback from Bangalore brides, ratings, and featured reviews on the homepage.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4E2714] text-white text-xs sm:text-sm font-semibold hover:bg-[#381A0E] transition-all shadow-md self-start sm:self-auto"
        >
          <span>+ Add Testimonial</span>
        </button>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed border ${
            statusMsg.type === 'success'
              ? 'bg-[#EAFBF0] border-[#D0F4DE] text-[#1EBE5D]'
              : 'bg-[#FDF2F2] border-[#F8D7DA] text-[#9B2C2C]'
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      {/* Reviews Table */}
      <div className="bg-white rounded-3xl border border-[#EADFD3] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#FAF6F0] border-b border-[#EADBCE] text-[#847269] uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Client Name & Area</th>
                <th className="py-3.5 px-4 font-semibold">Review</th>
                <th className="py-3.5 px-4 font-semibold text-center">Rating</th>
                <th className="py-3.5 px-4 font-semibold text-center">Featured</th>
                <th className="py-3.5 px-4 font-semibold text-center">Active</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5ECE4]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-[#847269]">
                    Loading testimonials...
                  </td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-[#847269]">
                    No client reviews added yet.
                  </td>
                </tr>
              ) : (
                reviews.map((r) => (
                  <tr key={r.id} className="hover:bg-[#FAF9F6] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#261B16]">{r.customer_name}</div>
                      <div className="text-xs text-[#847269] mt-0.5">{r.image || 'Bangalore'}</div>
                    </td>
                    <td className="py-3.5 px-4 max-w-md">
                      <p className="line-clamp-2 text-xs text-[#58463D] italic">
                        &ldquo;{r.review}&rdquo;
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center text-[#C29B4D] gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon key={i} size={14} filled={i < r.rating} />
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleFeatured(r)}
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          r.featured
                            ? 'bg-[#F9F5EA] text-[#7E5E1C] border border-[#ECDDBF]'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {r.featured ? '★ Homepage' : 'Standard'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleActive(r)}
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                          r.active
                            ? 'bg-[#EAFBF0] text-[#1EBE5D] border border-[#D0F4DE]'
                            : 'bg-red-50 text-red-500'
                        }`}
                      >
                        {r.active ? 'Visible' : 'Hidden'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(r)}
                        className="text-xs font-semibold text-[#4E2714] hover:text-[#B95945] px-2 py-1 rounded hover:bg-[#FAF3EE]"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="text-xs font-semibold text-red-600 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full border border-[#EADFD3] shadow-2xl my-8">
            <h2 className="font-serif-heading text-2xl font-semibold text-[#261B16]">
              {editingReview ? 'Edit Testimonial' : 'Add Testimonial'}
            </h2>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#58463D] mb-1">
                  Customer / Bride Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.customer_name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, customer_name: e.target.value }))
                  }
                  placeholder="Priya Sharma"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FCF9F4] border border-[#D6C1AF] text-sm text-[#261B16] focus:outline-none focus:ring-2 focus:ring-[#4E2714]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#58463D] mb-1">
                    Bangalore Area / Event Tag
                  </label>
                  <input
                    type="text"
                    value={formData.image || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, image: e.target.value }))
                    }
                    placeholder="Sadashivanagar, Bangalore"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FCF9F4] border border-[#D6C1AF] text-sm text-[#261B16] focus:outline-none focus:ring-2 focus:ring-[#4E2714]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#58463D] mb-1">
                    Rating (Stars) *
                  </label>
                  <select
                    value={formData.rating}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        rating: parseInt(e.target.value, 10) || 5,
                      }))
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FCF9F4] border border-[#D6C1AF] text-sm text-[#261B16] focus:outline-none focus:ring-2 focus:ring-[#4E2714]"
                  >
                    <option value={5}>5 Stars (Exceptional)</option>
                    <option value={4}>4 Stars (Very Good)</option>
                    <option value={3}>3 Stars (Good)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#58463D] mb-1">
                  Client Review / Testimonial *
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.review}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, review: e.target.value }))
                  }
                  placeholder="Aayesha is hands down the finest mehndi artist in Bangalore!..."
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
                  <span>Active (Visible on site)</span>
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
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-[#4E2714] text-white text-xs font-semibold hover:bg-[#381A0E] disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingReview ? 'Update Review' : 'Add Testimonial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
