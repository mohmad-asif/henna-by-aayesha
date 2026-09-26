'use client';

import React, { useState, useEffect } from 'react';
import { WhyChooseUsItem } from '@/types';
import { PlusIcon, TrashIcon, EditIcon } from '@/components/ui/icons';

export default function AdminWhyChooseUsPage() {
  const [items, setItems] = useState<WhyChooseUsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WhyChooseUsItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState<Partial<WhyChooseUsItem>>({
    icon: '🌿',
    title: '',
    description: '',
    displayOrder: 1,
    published: true,
  });

  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/why-choose-us');
      if (res.ok) {
        const data = await res.json();
        if (data.items) {
          setItems(data.items);
        }
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Failed to load Why Choose Us items' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const res = await fetch('/api/admin/why-choose-us');
        if (res.ok && !ignore) {
          const data = await res.json();
          if (data.items) {
            setItems(data.items);
          }
        }
      } catch {
        if (!ignore) {
          setStatusMsg({ type: 'error', text: 'Failed to load Why Choose Us items' });
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, []);

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      icon: '🌿',
      title: '',
      description: '',
      displayOrder: items.length + 1,
      published: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: WhyChooseUsItem) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feature card?')) return;

    try {
      const res = await fetch(`/api/admin/why-choose-us?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== id));
        setStatusMsg({ type: 'success', text: 'Feature card removed.' });
      } else {
        const err = await res.json();
        setStatusMsg({ type: 'error', text: err.error || 'Failed to delete item' });
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Failed to delete item' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim() || !formData.description?.trim()) {
      setStatusMsg({ type: 'error', text: 'Both title and description are required.' });
      return;
    }

    setSaving(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/admin/why-choose-us', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const resData = await res.json();

      if (!res.ok) {
        setStatusMsg({ type: 'error', text: resData.error || 'Failed to save feature card' });
      } else {
        setStatusMsg({
          type: 'success',
          text: editingItem ? 'Card updated successfully!' : 'Card created successfully!',
        });
        setIsModalOpen(false);
        loadItems();
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Network error saving feature card' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-10 max-w-6xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-[#B95945] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#EADBCE]">
        <div>
          <span className="text-xs uppercase tracking-wider font-bold text-[#B95945]">
            Content Management
          </span>
          <h1 className="font-serif-heading text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#261B16] mt-1">
            Why Choose Us Cards
          </h1>
          <p className="text-xs sm:text-sm text-[#703D24] mt-1">
            Highlight your studio values, organic certifications, bespoke artistry, and client care.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#4E2714] text-white text-xs sm:text-sm font-semibold hover:bg-[#381A0E] transition-all shadow-md w-full sm:w-auto cursor-pointer"
        >
          <PlusIcon size={16} />
          <span>Add New Card</span>
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

      {/* Grid of Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl p-5 border border-[#EADFD3] shadow-xs flex flex-col justify-between transition-all hover:border-[#D4C3B3]"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl p-2 rounded-2xl bg-[#F5ECE4] inline-block">{item.icon}</span>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      item.published
                        ? 'bg-[#EAFBF0] text-[#1EBE5D]'
                        : 'bg-[#FDF2F2] text-[#9B2C2C]'
                    }`}
                  >
                    {item.published ? 'Published' : 'Draft'}
                  </span>
                  <span className="text-[11px] text-[#A39184]">#{item.displayOrder}</span>
                </div>
              </div>

              <h3 className="font-serif-heading text-lg font-semibold text-[#261B16] mb-2 break-words">
                {item.title}
              </h3>
              <p className="text-xs sm:text-sm text-[#703D24] leading-relaxed break-words">
                {item.description}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-[#F0E5D8]">
              <button
                onClick={() => openEditModal(item)}
                className="p-2 rounded-xl text-[#703D24] hover:bg-[#F5ECE4] hover:text-[#261B16] transition-colors cursor-pointer"
                title="Edit Card"
              >
                <EditIcon size={16} />
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="p-2 rounded-xl text-[#B95945] hover:bg-[#FDF2F2] transition-colors cursor-pointer"
                title="Delete Card"
              >
                <TrashIcon size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full border border-[#EADFD3] shadow-2xl my-auto max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-[#F0E5D8] flex items-center justify-between gap-4 shrink-0 bg-[#FAF8F5]/80">
              <h2 className="font-serif-heading text-xl sm:text-2xl font-semibold text-[#261B16]">
                {editingItem ? 'Edit Feature Card' : 'Add Feature Card'}
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
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-bold text-[#703D24] mb-1 uppercase tracking-wider">
                      Icon / Emoji
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.icon || '🌿'}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      className="w-full text-center px-3 py-2.5 text-lg rounded-xl border border-[#EADFD3] focus:outline-none focus:border-[#4E2714]"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-[#703D24] mb-1 uppercase tracking-wider">
                      Card Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title || ''}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. 100% Organic Henna"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#EADFD3] focus:outline-none focus:border-[#4E2714]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#703D24] mb-1 uppercase tracking-wider">
                    Description *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Explain why clients trust this aspect of your artistry..."
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#EADFD3] focus:outline-none focus:border-[#4E2714]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#703D24] mb-1 uppercase tracking-wider">
                      Display Order
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formData.displayOrder ?? 1}
                      onChange={(e) =>
                        setFormData({ ...formData, displayOrder: parseInt(e.target.value, 10) || 1 })
                      }
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#EADFD3] focus:outline-none focus:border-[#4E2714]"
                    />
                  </div>

                  <div className="flex items-center sm:pt-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.published ?? true}
                        onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                        className="w-4 h-4 rounded text-[#4E2714] focus:ring-[#4E2714]"
                      />
                      <span className="text-xs sm:text-sm font-medium text-[#261B16]">
                        Published
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6 border-t border-[#F0E5D8] bg-[#FAF8F5]/80 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold rounded-xl border border-[#EADFD3] text-[#703D24] hover:bg-white transition-colors cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold rounded-xl bg-[#4E2714] text-white hover:bg-[#381A0E] transition-all disabled:opacity-50 cursor-pointer text-center shadow-xs"
                >
                  {saving ? 'Saving...' : editingItem ? 'Update Card' : 'Create Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
