'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { FaqItem } from '@/types';
import { PlusIcon, TrashIcon, EditIcon, SearchIcon } from '@/components/ui/icons';

const DEFAULT_CATEGORIES = ['general', 'booking', 'aftercare', 'bridal', 'travel'];

export default function AdminFaqsPage() {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterPublished, setFilterPublished] = useState<string>('all');

  // Form state
  const [formData, setFormData] = useState<Partial<FaqItem>>({
    question: '',
    answer: '',
    category: 'general',
    displayOrder: 1,
    published: true,
  });

  const loadFaqs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/faqs');
      if (res.ok) {
        const data = await res.json();
        if (data.faqs) {
          setFaqs(data.faqs);
        }
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Failed to load FAQs' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const res = await fetch('/api/admin/faqs');
        if (res.ok && !ignore) {
          const data = await res.json();
          if (data.faqs) {
            setFaqs(data.faqs);
          }
        }
      } catch {
        if (!ignore) {
          setStatusMsg({ type: 'error', text: 'Failed to load FAQs' });
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
    setEditingFaq(null);
    setFormData({
      question: '',
      answer: '',
      category: 'general',
      displayOrder: faqs.length + 1,
      published: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (faq: FaqItem) => {
    setEditingFaq(faq);
    setFormData({ ...faq });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;

    try {
      const res = await fetch(`/api/admin/faqs?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setFaqs((prev) => prev.filter((f) => f.id !== id));
        setStatusMsg({ type: 'success', text: 'FAQ deleted successfully.' });
      } else {
        const err = await res.json();
        setStatusMsg({ type: 'error', text: err.error || 'Failed to delete FAQ' });
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Failed to delete FAQ' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.question?.trim() || !formData.answer?.trim()) {
      setStatusMsg({ type: 'error', text: 'Both question and answer are required.' });
      return;
    }

    setSaving(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/admin/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const resData = await res.json();

      if (!res.ok) {
        setStatusMsg({ type: 'error', text: resData.error || 'Failed to save FAQ' });
      } else {
        setStatusMsg({
          type: 'success',
          text: editingFaq ? 'FAQ updated successfully!' : 'FAQ created successfully!',
        });
        setIsModalOpen(false);
        loadFaqs();
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Network error saving FAQ' });
    } finally {
      setSaving(false);
    }
  };

  const filteredFaqs = useMemo(() => {
    return faqs.filter((faq) => {
      const matchesSearch =
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat =
        selectedCategory === 'all' || faq.category?.toLowerCase() === selectedCategory.toLowerCase();

      const matchesPub =
        filterPublished === 'all' ||
        (filterPublished === 'published' && faq.published) ||
        (filterPublished === 'draft' && !faq.published);

      return matchesSearch && matchesCat && matchesPub;
    });
  }, [faqs, searchQuery, selectedCategory, filterPublished]);

  const categories = useMemo(() => {
    const set = new Set(DEFAULT_CATEGORIES);
    faqs.forEach((f) => {
      if (f.category) set.add(f.category.toLowerCase());
    });
    return Array.from(set);
  }, [faqs]);

  if (loading) {
    return (
      <div className="p-10 max-w-6xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-[#B95945] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-10 max-w-6xl w-full mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider font-bold text-[#B95945]">
            Content Management
          </span>
          <h1 className="font-serif-heading text-3xl sm:text-4xl font-semibold text-[#261B16] mt-1">
            Frequently Asked Questions (FAQ)
          </h1>
          <p className="text-xs sm:text-sm text-[#703D24] mt-1">
            Manage FAQs displayed on public pages and used by the AI Assistant knowledge base.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#B95945] text-white text-xs sm:text-sm font-semibold hover:bg-[#A04533] transition-colors shadow-xs self-start sm:self-auto"
        >
          <PlusIcon size={16} />
          <span>Add New FAQ</span>
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

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#EADFD3] flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <SearchIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A39184]" />
          <input
            type="text"
            placeholder="Search questions or answers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-[#EADFD3] focus:outline-none focus:border-[#B95945]"
          />
        </div>

        <div className="flex flex-wrap gap-2.5">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-[#EADFD3] bg-white text-[#261B16] focus:outline-none focus:border-[#B95945]"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>

          <select
            value={filterPublished}
            onChange={(e) => setFilterPublished(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-[#EADFD3] bg-white text-[#261B16] focus:outline-none focus:border-[#B95945]"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* FAQs List */}
      <div className="space-y-4">
        {filteredFaqs.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-[#EADFD3]">
            <p className="text-[#703D24] text-sm">No FAQs found matching your criteria.</p>
          </div>
        ) : (
          filteredFaqs.map((faq) => (
            <div
              key={faq.id}
              className="bg-white rounded-2xl p-5 border border-[#EADFD3] shadow-xs flex flex-col md:flex-row md:items-start justify-between gap-4 transition-all hover:border-[#D4C3B3]"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F5ECE4] text-[#703D24]">
                    {faq.category || 'General'}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      faq.published
                        ? 'bg-[#EAFBF0] text-[#1EBE5D]'
                        : 'bg-[#FDF2F2] text-[#9B2C2C]'
                    }`}
                  >
                    {faq.published ? 'Published' : 'Draft'}
                  </span>
                  <span className="text-[11px] text-[#A39184]">
                    Order #{faq.displayOrder}
                  </span>
                </div>

                <h3 className="font-serif-heading text-base sm:text-lg font-semibold text-[#261B16]">
                  {faq.question}
                </h3>
                <p className="text-xs sm:text-sm text-[#703D24] leading-relaxed whitespace-pre-line">
                  {faq.answer}
                </p>
              </div>

              <div className="flex items-center gap-2 self-end md:self-start pt-2 md:pt-0">
                <button
                  onClick={() => openEditModal(faq)}
                  className="p-2 rounded-xl text-[#703D24] hover:bg-[#F5ECE4] hover:text-[#261B16] transition-colors"
                  title="Edit FAQ"
                >
                  <EditIcon size={16} />
                </button>
                <button
                  onClick={() => handleDelete(faq.id)}
                  className="p-2 rounded-xl text-[#B95945] hover:bg-[#FDF2F2] transition-colors"
                  title="Delete FAQ"
                >
                  <TrashIcon size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 border border-[#EADFD3] shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="font-serif-heading text-xl font-bold text-[#261B16] mb-4">
              {editingFaq ? 'Edit FAQ' : 'Add New FAQ'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#703D24] mb-1 uppercase tracking-wider">
                  Question
                </label>
                <input
                  type="text"
                  required
                  value={formData.question || ''}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="e.g. How far in advance should I book my bridal mehndi?"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-[#EADFD3] focus:outline-none focus:border-[#B95945]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#703D24] mb-1 uppercase tracking-wider">
                  Answer
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.answer || ''}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  placeholder="Provide a clear, detailed answer..."
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-[#EADFD3] focus:outline-none focus:border-[#B95945]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#703D24] mb-1 uppercase tracking-wider">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category || 'general'}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="general, booking, bridal, aftercare"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-[#EADFD3] focus:outline-none focus:border-[#B95945]"
                  />
                </div>

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
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-[#EADFD3] focus:outline-none focus:border-[#B95945]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.published ?? true}
                    onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                    className="w-4 h-4 rounded text-[#B95945] focus:ring-[#B95945]"
                  />
                  <span className="text-xs sm:text-sm font-medium text-[#261B16]">
                    Publish on public website & AI knowledge base
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#F0E5D8]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs sm:text-sm rounded-xl border border-[#EADFD3] text-[#703D24] hover:bg-[#F5ECE4]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs sm:text-sm rounded-xl bg-[#B95945] text-white font-semibold hover:bg-[#A04533] disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingFaq ? 'Update FAQ' : 'Create FAQ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
