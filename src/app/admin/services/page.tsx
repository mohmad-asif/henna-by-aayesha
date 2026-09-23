'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DbService } from '@/types/database';
import { servicesData } from '@/data/services';

export default function AdminServicesPage() {
  const [services, setServices] = useState<DbService[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState<DbService | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState<Partial<DbService>>({
    title: '',
    slug: '',
    short_description: '',
    description: '',
    price_text: 'Custom Quote on WhatsApp',
    duration_text: '4 - 6 hours',
    image: '/images/hero-bride.jpg',
    featured: false,
    active: true,
    display_order: 1,
  });

  const loadServices = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('display_order', { ascending: true });

      if (data && !error && data.length > 0) {
        setServices(data as DbService[]);
      } else {
        const fallback = servicesData.map((s, i) => ({
          id: s.id,
          title: s.title,
          slug: s.slug,
          short_description: s.subtitle,
          description: s.description,
          price_text: 'Custom Quote on WhatsApp',
          duration_text: s.duration,
          image: '/images/hero-bride.jpg',
          featured: !!s.recommendedForBridal,
          active: true,
          display_order: i + 1,
        }));
        setServices(fallback);
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
          .from('services')
          .select('*')
          .order('display_order', { ascending: true });

        if (ignore) return;
        if (data && !error && data.length > 0) {
          setServices(data as DbService[]);
        } else {
          const fallback = servicesData.map((s, i) => ({
            id: s.id,
            title: s.title,
            slug: s.slug,
            short_description: s.subtitle,
            description: s.description,
            price_text: 'Custom Quote on WhatsApp',
            duration_text: s.duration,
            image: '/images/hero-bride.jpg',
            featured: !!s.recommendedForBridal,
            active: true,
            display_order: i + 1,
          }));
          setServices(fallback);
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
    setEditingService(null);
    setFormData({
      title: '',
      slug: '',
      short_description: '',
      description: '',
      price_text: 'Custom Quote on WhatsApp',
      duration_text: '4 - 6 hours',
      image: '/images/hero-bride.jpg',
      featured: false,
      active: true,
      display_order: services.length + 1,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (service: DbService) => {
    setEditingService(service);
    setFormData(service);
    setIsModalOpen(true);
  };

  const handleTitleChange = (val: string) => {
    setFormData((prev) => ({
      ...prev,
      title: val,
      slug: prev.slug || val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
    }));
  };

  const handleToggleActive = async (service: DbService) => {
    const newActive = !service.active;
    try {
      const supabase = createClient();
      await supabase.from('services').update({ active: newActive }).eq('id', service.id);
      setServices((prev) =>
        prev.map((s) => (s.id === service.id ? { ...s, active: newActive } : s))
      );
    } catch {
      // Fallback
    }
  };

  const handleToggleFeatured = async (service: DbService) => {
    const newFeatured = !service.featured;
    try {
      const supabase = createClient();
      await supabase.from('services').update({ featured: newFeatured }).eq('id', service.id);
      setServices((prev) =>
        prev.map((s) => (s.id === service.id ? { ...s, featured: newFeatured } : s))
      );
    } catch {
      // Fallback
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service package?')) return;

    try {
      const supabase = createClient();
      await supabase.from('services').delete().eq('id', id);
      setServices((prev) => prev.filter((s) => s.id !== id));
      setStatusMsg({ type: 'success', text: 'Service package removed.' });
    } catch {
      setServices((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);

    try {
      const supabase = createClient();

      if (editingService) {
        const { error } = await supabase
          .from('services')
          .update({
            title: formData.title,
            slug: formData.slug,
            short_description: formData.short_description,
            description: formData.description,
            price_text: formData.price_text,
            duration_text: formData.duration_text,
            image: formData.image,
            featured: formData.featured,
            active: formData.active,
            display_order: Number(formData.display_order) || 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingService.id);

        if (error) throw error;
        setStatusMsg({ type: 'success', text: 'Service package updated successfully!' });
      } else {
        const { error } = await supabase.from('services').insert([
          {
            title: formData.title,
            slug: formData.slug,
            short_description: formData.short_description,
            description: formData.description,
            price_text: formData.price_text,
            duration_text: formData.duration_text,
            image: formData.image,
            featured: formData.featured,
            active: formData.active,
            display_order: Number(formData.display_order) || 1,
          },
        ]);

        if (error) throw error;
        setStatusMsg({ type: 'success', text: 'Service package created successfully!' });
      }

      setIsModalOpen(false);
      loadServices();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error saving service';
      setStatusMsg({
        type: 'error',
        text: `${msg}. (Note: If tables are not yet created, run supabase/schema.sql in your Supabase SQL editor)`,
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
            Service Offerings
          </span>
          <h1 className="font-serif-heading text-3xl sm:text-4xl font-semibold text-[#261B16] mt-1">
            Services & Packages
          </h1>
          <p className="text-xs sm:text-sm text-[#703D24] mt-1">
            Manage bridal packages, sangeet group rates, and festival appointments in Bangalore.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4E2714] text-white text-xs sm:text-sm font-semibold hover:bg-[#381A0E] transition-all shadow-md self-start sm:self-auto"
        >
          <span>+ Add Service Package</span>
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

      {/* Services Table */}
      <div className="bg-white rounded-3xl border border-[#EADFD3] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#FAF6F0] border-b border-[#EADBCE] text-[#847269] uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Service Title</th>
                <th className="py-3.5 px-4 font-semibold">Duration</th>
                <th className="py-3.5 px-4 font-semibold">Price / Booking Note</th>
                <th className="py-3.5 px-4 font-semibold text-center">Featured</th>
                <th className="py-3.5 px-4 font-semibold text-center">Active</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5ECE4]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-[#847269]">
                    Loading services...
                  </td>
                </tr>
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-[#847269]">
                    No service packages configured yet.
                  </td>
                </tr>
              ) : (
                services.map((service) => (
                  <tr key={service.id} className="hover:bg-[#FAF9F6] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#261B16]">{service.title}</div>
                      <div className="text-xs text-[#847269] line-clamp-1 mt-0.5">
                        {service.short_description}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[#703D24] font-medium">
                      {service.duration_text}
                    </td>
                    <td className="py-3.5 px-4 text-[#58463D]">
                      {service.price_text}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleFeatured(service)}
                        className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                          service.featured
                            ? 'bg-[#F9F5EA] text-[#7E5E1C] border border-[#ECDDBF]'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {service.featured ? '★ Most Popular' : 'Standard'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleActive(service)}
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-colors ${
                          service.active
                            ? 'bg-[#EAFBF0] text-[#1EBE5D] border border-[#D0F4DE]'
                            : 'bg-red-50 text-red-500 border border-red-200'
                        }`}
                      >
                        {service.active ? 'Active' : 'Hidden'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(service)}
                        className="text-xs font-semibold text-[#4E2714] hover:text-[#B95945] px-2 py-1 rounded hover:bg-[#FAF3EE]"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(service.id)}
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
              {editingService ? 'Edit Service Package' : 'Add Service Package'}
            </h2>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#58463D] mb-1">
                  Package Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="The Signature Royal Bridal Package"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FCF9F4] border border-[#D6C1AF] text-sm text-[#261B16] focus:outline-none focus:ring-2 focus:ring-[#4E2714]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#58463D] mb-1">
                  Slug (URL identifier) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, slug: e.target.value }))
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FCF9F4] border border-[#D6C1AF] text-sm font-mono text-[#261B16] focus:outline-none focus:ring-2 focus:ring-[#4E2714]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#58463D] mb-1">
                    Duration Text *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.duration_text}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        duration_text: e.target.value,
                      }))
                    }
                    placeholder="6 – 8 hours"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FCF9F4] border border-[#D6C1AF] text-sm text-[#261B16] focus:outline-none focus:ring-2 focus:ring-[#4E2714]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#58463D] mb-1">
                    Price Note *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.price_text}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        price_text: e.target.value,
                      }))
                    }
                    placeholder="Custom Quote on WhatsApp"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FCF9F4] border border-[#D6C1AF] text-sm text-[#261B16] focus:outline-none focus:ring-2 focus:ring-[#4E2714]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#58463D] mb-1">
                  Subtitle / Short Description
                </label>
                <input
                  type="text"
                  value={formData.short_description || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      short_description: e.target.value,
                    }))
                  }
                  placeholder="Full arms up to elbows and bridal feet"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FCF9F4] border border-[#D6C1AF] text-sm text-[#261B16] focus:outline-none focus:ring-2 focus:ring-[#4E2714]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#58463D] mb-1">
                  Full Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
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
                  <span>Popular Bridal Choice</span>
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
                  {saving ? 'Saving...' : editingService ? 'Update Package' : 'Create Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
