'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AiConversation, AiMessage, AiConversationDetail } from '@/types/ai-chat';
import { WhatsAppIcon } from '@/components/ui/icons';
import { UserProfilePanel } from '@/components/admin/user-profile-panel';

export default function AdminAiConversationsPage() {
  // List state
  const [conversations, setConversations] = useState<AiConversation[]>([]);
  const [totalConversations, setTotalConversations] = useState<number>(0);
  const [loadingList, setLoadingList] = useState<boolean>(true);
  const [errorList, setErrorList] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'resolved' | 'closed' | 'archived'>('all');
  const [unreadOnly, setUnreadOnly] = useState<boolean>(false);
  const [sortBy] = useState<'latest' | 'oldest' | 'messages'>('latest');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Selected conversation & detail
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<AiConversationDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  // Mobile & panel navigation
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(true);

  // Actions state
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);

  // Scroll to bottom ref
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset page on new search
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch conversations list (for manual refresh)
  const fetchConversations = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoadingList(true);
    setErrorList(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '30',
        sortBy,
      });

      if (debouncedSearch.trim()) {
        params.append('search', debouncedSearch.trim());
      }
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (unreadOnly) {
        params.append('unreadOnly', 'true');
      }

      const res = await fetch(`/api/admin/ai/conversations?${params.toString()}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to load conversations');
      }

      const data = await res.json();
      setConversations(data.conversations || []);
      setTotalConversations(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setErrorList(message);
    } finally {
      if (!isSilent) setLoadingList(false);
    }
  }, [page, debouncedSearch, statusFilter, unreadOnly, sortBy]);

  // Initial load and filter change
  useEffect(() => {
    let ignore = false;
    async function loadData() {
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '30',
          sortBy,
        });

        if (debouncedSearch.trim()) {
          params.append('search', debouncedSearch.trim());
        }
        if (statusFilter !== 'all') {
          params.append('status', statusFilter);
        }
        if (unreadOnly) {
          params.append('unreadOnly', 'true');
        }

        const res = await fetch(`/api/admin/ai/conversations?${params.toString()}`);
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to load conversations');
        }

        const data = await res.json();
        if (!ignore) {
          setConversations(data.conversations || []);
          setTotalConversations(data.total || 0);
          setTotalPages(data.totalPages || 1);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          setErrorList(message);
        }
      } finally {
        if (!ignore) {
          setLoadingList(false);
        }
      }
    }

    loadData();
    return () => {
      ignore = true;
    };
  }, [page, debouncedSearch, statusFilter, unreadOnly, sortBy]);

  // Fetch conversation detail
  const fetchDetail = useCallback(async (conversationId: string, markRead = true) => {
    setLoadingDetail(true);
    setErrorDetail(null);

    try {
      const res = await fetch(`/api/admin/ai/conversations/${conversationId}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to load conversation history');
      }

      const data: AiConversationDetail = await res.json();
      setSelectedDetail(data);

      // If it was unread, update local state
      if (markRead && data.unread_by_admin) {
        setConversations(prev =>
          prev.map(c => (c.id === conversationId ? { ...c, unread_by_admin: false } : c))
        );
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setErrorDetail(message);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  // Handle selecting a conversation
  const handleSelectConversation = (conv: AiConversation) => {
    setSelectedConversationId(conv.id);
    setIsMobileDetailOpen(true);
    // On desktop (xl: 1280px+), open profile side-by-side; on mobile/tablet (< xl), keep profile closed so user sees the chat
    if (typeof window !== 'undefined' && window.innerWidth >= 1280) {
      setIsProfileOpen(true);
    } else {
      setIsProfileOpen(false);
    }
    fetchDetail(conv.id, true);
  };

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (selectedDetail?.messages?.length) {
      chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedDetail?.messages]);

  // Status toggle
  const handleStatusChange = async (newStatus: 'active' | 'resolved' | 'closed' | 'archived') => {
    if (!selectedConversationId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/ai/conversations/${selectedConversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setSelectedDetail(prev => (prev ? { ...prev, status: newStatus } : null));
        setConversations(prev =>
          prev.map(c => (c.id === selectedConversationId ? { ...c, status: newStatus } : c))
        );
      }
    } catch {
      // Ignored
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Unread
  const handleToggleUnread = async () => {
    if (!selectedConversationId || !selectedDetail) return;
    const newUnread = !selectedDetail.unread_by_admin;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/ai/conversations/${selectedConversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unread_by_admin: newUnread }),
      });
      if (res.ok) {
        setSelectedDetail(prev => (prev ? { ...prev, unread_by_admin: newUnread } : null));
        setConversations(prev =>
          prev.map(c => (c.id === selectedConversationId ? { ...c, unread_by_admin: newUnread } : c))
        );
      }
    } catch {
      // Ignored
    } finally {
      setActionLoading(false);
    }
  };

  // Delete conversation
  const handleDeleteConversation = async () => {
    if (!selectedConversationId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/ai/conversations/${selectedConversationId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDeleteModalOpen(false);
        setConversations(prev => prev.filter(c => c.id !== selectedConversationId));
        setSelectedConversationId(null);
        setSelectedDetail(null);
        setIsMobileDetailOpen(false);
        setTotalConversations(prev => Math.max(0, prev - 1));
      }
    } catch {
      // Ignored
    } finally {
      setActionLoading(false);
    }
  };

  // Format relative timestamp
  const formatTime = (isoString?: string | null) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const formatMessageTime = (isoString?: string | null) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateHeader = (isoString: string) => {
    const date = new Date(isoString);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
  };

  // Group messages by date
  const groupMessagesByDate = (messages: AiMessage[]) => {
    const groups: { date: string; messages: AiMessage[] }[] = [];
    messages.forEach(msg => {
      const dateHeader = formatDateHeader(msg.created_at);
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.date === dateHeader) {
        lastGroup.messages.push(msg);
      } else {
        groups.push({ date: dateHeader, messages: [msg] });
      }
    });
    return groups;
  };

  return (
    <div className="flex flex-col h-full bg-[#F7F4EF] overflow-hidden">
      {/* Top Bar Header */}
      <header className="bg-white border-b border-[#E5D9CE] px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 flex-shrink-0 z-10">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif-heading text-lg lg:text-xl font-bold text-[#261B16]">
              AI Assistant Chat History
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#F2E8DC] text-[#786052] border border-[#E5D9CE]">
              {totalConversations} {totalConversations === 1 ? 'chat' : 'chats'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchConversations()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5D9CE] bg-white text-xs font-medium text-[#4E2714] hover:bg-[#F7F4EF] hover:border-[#B95945] transition-colors cursor-pointer"
            title="Refresh conversations list"
          >
            <span>🔄</span>
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <Link
            href="/admin/ai-settings"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2E160C] text-xs font-medium text-white hover:bg-[#432314] transition-colors"
          >
            <span>⚙️</span>
            <span className="hidden sm:inline">AI Settings</span>
          </Link>
        </div>
      </header>

      {/* Main Two-Pane Chat Container */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* ======================================================== */}
        {/* LEFT SIDEBAR: Conversation List                          */}
        {/* ======================================================== */}
        <aside
          className={`w-full lg:w-72 xl:w-80 flex-shrink-0 flex flex-col bg-white border-r border-[#E5D9CE] z-20 transition-all duration-200 ${isMobileDetailOpen ? 'hidden lg:flex' : 'flex'
            }`}
        >
          {/* Search & Filters Header */}
          <div className="p-3 border-b border-[#E5D9CE] bg-[#FDFBF7] space-y-2.5 flex-shrink-0">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search user, visitor ID, or query..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-white border border-[#E5D9CE] focus:outline-none focus:border-[#B95945] focus:ring-1 focus:ring-[#B95945] text-[#261B16] placeholder-[#A39184]"
              />
              <span className="absolute left-2.5 top-2 text-xs text-[#A39184]">🔍</span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-xs text-[#A39184] hover:text-[#261B16]"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Tabs & Unread Toggle */}
            <div className="flex items-center justify-between gap-1 text-[11px]">
              <div className="flex items-center gap-1 bg-[#F2E8DC] p-0.5 rounded-lg">
                {(['all', 'active', 'resolved', 'closed', 'archived'] as const).map(st => (
                  <button
                    key={st}
                    onClick={() => {
                      setStatusFilter(st);
                      setPage(1);
                    }}
                    className={`px-2 py-0.5 rounded-md font-medium capitalize transition-colors ${statusFilter === st
                      ? 'bg-white text-[#4E2714] shadow-xs'
                      : 'text-[#786052] hover:text-[#261B16]'
                      }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  setUnreadOnly(!unreadOnly);
                  setPage(1);
                }}
                className={`px-2 py-1 rounded-md border flex items-center gap-1 font-medium transition-colors ${unreadOnly
                  ? 'bg-[#B95945] text-white border-[#B95945]'
                  : 'bg-white text-[#786052] border-[#E5D9CE] hover:border-[#B95945]'
                  }`}
                title="Filter only unread conversations"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                Unread
              </button>
            </div>
          </div>

          {/* Conversations List Scrollable */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#F2E8DC]">
            {loadingList ? (
              <div className="p-8 text-center text-xs text-[#786052] space-y-2">
                <div className="animate-spin w-6 h-6 border-2 border-[#B95945] border-t-transparent rounded-full mx-auto" />
                <p>Loading conversations...</p>
              </div>
            ) : errorList ? (
              <div className="p-6 text-center text-xs">
                <p className="text-red-600 mb-2 font-medium">⚠️ {errorList}</p>
                <p className="text-[#786052] text-[11px] mb-3">
                  Please make sure the Supabase tables are created and migration is applied.
                </p>
                <button
                  onClick={() => fetchConversations()}
                  className="px-3 py-1 rounded bg-[#2E160C] text-white text-xs font-medium hover:bg-[#432314]"
                >
                  Retry
                </button>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-[#786052] space-y-2">
                <span className="text-2xl block">💬</span>
                <p className="text-xs font-semibold text-[#261B16]">No conversations found</p>
                <p className="text-[11px] text-[#A39184]">
                  {searchQuery || statusFilter !== 'all' || unreadOnly
                    ? 'Try clearing the search or active filters.'
                    : 'Visitors who ask questions to the AI Assistant will appear here immediately.'}
                </p>
              </div>
            ) : (
              conversations.map(conv => {
                const isSelected = selectedConversationId === conv.id;
                const displayName =
                  conv.user_name ||
                  conv.user_email ||
                  (conv.visitor_id ? `Visitor #${conv.visitor_id.slice(-6)}` : 'Website Visitor');

                return (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`p-3.5 cursor-pointer transition-all border-l-4 ${isSelected
                      ? 'bg-[#F9F5F0] border-l-[#B95945]'
                      : 'border-l-transparent hover:bg-[#FAF7F2]'
                      } ${conv.unread_by_admin ? 'bg-amber-50/40' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        {/* Avatar */}
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${conv.user_email
                            ? 'bg-[#4E2714] text-[#C29B4D]'
                            : 'bg-[#E5D9CE] text-[#4E2714]'
                            }`}
                        >
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-xs text-[#261B16] truncate block">
                          {displayName}
                        </span>
                        {conv.unread_by_admin && (
                          <span
                            className="w-2 h-2 rounded-full bg-[#B95945] flex-shrink-0 animate-pulse"
                            title="Unread"
                          />
                        )}
                      </div>
                      <span className="text-[10px] text-[#A39184] flex-shrink-0 font-medium">
                        {formatTime(conv.last_message_at || conv.created_at)}
                      </span>
                    </div>

                    {/* Conversation Title / Topic */}
                    {conv.title && (
                      <div className="text-[11px] font-medium text-[#786052] truncate mb-0.5 pl-9">
                        {conv.title}
                      </div>
                    )}

                    {/* Last message preview */}
                    <p className="text-xs text-[#A39184] truncate pl-9 line-clamp-1">
                      {conv.last_message_preview || 'No messages yet'}
                    </p>

                    {/* Badges footer */}
                    <div className="flex items-center justify-between pl-9 mt-1.5 text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-semibold ${conv.status === 'resolved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : conv.status === 'archived'
                              ? 'bg-gray-100 text-gray-700'
                              : 'bg-blue-50 text-blue-700'
                            }`}
                        >
                          {conv.status}
                        </span>
                        {conv.user_email && (
                          <span className="text-[#786052] truncate max-w-[110px]">
                            {conv.user_email}
                          </span>
                        )}
                      </div>
                      {conv.visitor_id && (
                        <span className="text-[9px] text-[#A39184] font-mono">
                          #{conv.visitor_id.slice(-4)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="p-2 border-t border-[#E5D9CE] bg-[#FDFBF7] flex items-center justify-between text-xs text-[#786052] flex-shrink-0">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded border border-[#E5D9CE] bg-white disabled:opacity-40 hover:bg-[#F7F4EF]"
              >
                ← Prev
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded border border-[#E5D9CE] bg-white disabled:opacity-40 hover:bg-[#F7F4EF]"
              >
                Next →
              </button>
            </div>
          )}
        </aside>

        {/* ======================================================== */}
        {/* RIGHT CHAT BOX: Active Conversation Thread               */}
        {/* ======================================================== */}
        <section
          className={`flex-1 flex flex-col bg-[#FAF8F5] relative transition-all duration-200 overflow-hidden ${!isMobileDetailOpen ? 'hidden lg:flex' : 'flex'
            }`}
        >
          {selectedConversationId && selectedDetail ? (
            <>
              {/* Chat Thread Header */}
              <div className="bg-white border-b border-[#E5D9CE] px-3.5 sm:px-4 py-2.5 sm:py-3 flex flex-col md:flex-row md:items-center justify-between gap-2.5 flex-shrink-0 z-10 shadow-xs">
                {/* User / Visitor Identity */}
                <div
                  onClick={() => setIsProfileOpen(true)}
                  className="flex items-center gap-2.5 sm:gap-3 min-w-0 cursor-pointer group flex-1"
                  title="Click to view full user profile & tracking details"
                >
                  {/* Mobile Back Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMobileDetailOpen(false);
                    }}
                    className="lg:hidden p-1.5 rounded-lg border border-[#E5D9CE] text-[#4E2714] hover:bg-[#F7F4EF] mr-0.5 flex-shrink-0 cursor-pointer"
                    title="Back to conversation list"
                  >
                    ←
                  </button>

                  {/* Avatar */}
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#4E2714] text-[#C29B4D] flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                    {(
                      selectedDetail.user_name ||
                      selectedDetail.user_email ||
                      'V'
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <h2 className="font-serif-heading font-bold text-sm lg:text-base text-[#261B16] truncate group-hover:text-[#B95945] transition-colors">
                        {selectedDetail.user_name ||
                          selectedDetail.user_email ||
                          (selectedDetail.visitor_id
                            ? `Visitor #${selectedDetail.visitor_id.slice(-6)}`
                            : 'Website Visitor')}
                      </h2>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] uppercase font-semibold tracking-wider ${selectedDetail.status === 'resolved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : selectedDetail.status === 'archived'
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-blue-50 text-blue-700'
                          }`}
                      >
                        {selectedDetail.status}
                      </span>
                    </div>

                    {/* Metadata Subheader */}
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10px] sm:text-[11px] text-[#786052]">
                      {selectedDetail.user_email && (
                        <span className="truncate max-w-[180px]">📧 {selectedDetail.user_email}</span>
                      )}
                      {selectedDetail.visitor_id && (
                        <span className="font-mono text-[10px]">
                          Visitor: #{selectedDetail.visitor_id.slice(-6)}
                        </span>
                      )}
                      <span>
                        Started: {new Date(selectedDetail.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span>
                        {selectedDetail.messages.length} msg{selectedDetail.messages.length === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Header Actions */}
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-between md:justify-end flex-shrink-0 pt-1 md:pt-0 border-t md:border-t-0 border-[#F0E5D8]">
                  {/* User Profile Toggle Button */}
                  <button
                    onClick={() => setIsProfileOpen((v) => !v)}
                    className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${isProfileOpen
                      ? 'border-[#B95945] bg-[#FAF3EE] text-[#B95945]'
                      : 'border-[#E5D9CE] bg-white text-[#4E2714] hover:bg-[#F7F4EF]'
                      }`}
                    title={isProfileOpen ? 'Hide User Profile' : 'View User Profile Details'}
                  >
                    <span>👤</span>
                    <span>
                      {isProfileOpen ? 'Profile' : 'Profile'}
                    </span>
                  </button>

                  {/* Status Dropdown */}
                  <select
                    value={selectedDetail.status}
                    onChange={e =>
                      handleStatusChange(e.target.value as 'active' | 'resolved' | 'closed' | 'archived')
                    }
                    disabled={actionLoading}
                    aria-label="Conversation status"
                    className="text-xs px-2 py-1.5 rounded-lg border border-[#E5D9CE] bg-white text-[#261B16] focus:outline-none focus:border-[#B95945] cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                    <option value="archived">Archived</option>
                  </select>

                  {/* Mark as Unread / Read button */}
                  <button
                    onClick={handleToggleUnread}
                    disabled={actionLoading}
                    className="px-2 sm:px-2.5 py-1.5 rounded-lg border border-[#E5D9CE] bg-white text-xs font-medium text-[#4E2714] hover:bg-[#F7F4EF] hover:border-[#B95945] transition-colors cursor-pointer"
                    title={
                      selectedDetail.unread_by_admin
                        ? 'Mark as Read'
                        : 'Mark as Unread'
                    }
                  >
                    {selectedDetail.unread_by_admin ? '✓ Read' : '✉ Unread'}
                  </button>

                  {/* Delete Conversation */}
                  <button
                    onClick={() => setDeleteModalOpen(true)}
                    disabled={actionLoading}
                    className="p-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors text-xs cursor-pointer"
                    title="Delete Conversation"
                    aria-label="Delete Conversation"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Chat Messages Stream */}
              <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6"
              >
                {loadingDetail ? (
                  <div className="flex flex-col items-center justify-center h-full text-xs text-[#786052] space-y-2">
                    <div className="animate-spin w-8 h-8 border-2 border-[#B95945] border-t-transparent rounded-full" />
                    <p>Loading complete conversation history...</p>
                  </div>
                ) : errorDetail ? (
                  <div className="p-6 text-center text-xs text-red-600 bg-red-50 rounded-xl max-w-md mx-auto my-auto">
                    <p className="font-semibold mb-1">Failed to load messages</p>
                    <p className="text-[11px] mb-3">{errorDetail}</p>
                    <button
                      onClick={() => fetchDetail(selectedConversationId)}
                      className="px-3 py-1 rounded bg-[#2E160C] text-white text-xs"
                    >
                      Retry
                    </button>
                  </div>
                ) : selectedDetail.messages.length === 0 ? (
                  <div className="text-center text-xs text-[#786052] my-auto space-y-1">
                    <p className="font-medium">No messages in this conversation</p>
                    <p className="text-[11px] text-[#A39184]">
                      Conversation was initialized without messages.
                    </p>
                  </div>
                ) : (
                  groupMessagesByDate(selectedDetail.messages).map(group => (
                    <div key={group.date} className="space-y-4">
                      {/* Date Badge */}
                      <div className="flex items-center justify-center my-2">
                        <span className="px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-[#E5D9CE]/60 text-[#786052] shadow-2xs">
                          {group.date}
                        </span>
                      </div>

                      {/* Messages within Date Group */}
                      {group.messages.map(msg => {
                        const isUser = msg.role === 'user';

                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
                          >
                            {/* Role Label & Timestamp */}
                            <div className="flex items-center gap-1.5 px-1 text-[11px] text-[#786052]">
                              <span className="font-semibold">
                                {isUser ? 'Visitor / User' : 'Henna AI Assistant'}
                              </span>
                              {msg.provider && (
                                <span className="px-1 py-0.2 rounded text-[9px] bg-amber-100 text-[#4E2714] font-mono">
                                  {msg.provider}
                                </span>
                              )}
                              <span className="text-[#A39184] text-[10px]">
                                {formatMessageTime(msg.created_at)}
                              </span>
                            </div>

                            {/* Message Bubble */}
                            <div
                              className={`max-w-[90%] sm:max-w-[78%] rounded-2xl p-3.5 sm:p-4 text-xs leading-relaxed shadow-xs break-words [overflow-wrap:anywhere] ${isUser
                                ? 'bg-[#2E160C] text-[#FDFBF7] rounded-tr-xs'
                                : 'bg-white border border-[#E5D9CE] text-[#261B16] rounded-tl-xs'
                                }`}
                            >
                              {/* Message Text with preserved paragraphs */}
                              <div className="whitespace-pre-wrap font-sans space-y-2 break-words [overflow-wrap:anywhere]">
                                {msg.content}
                              </div>

                              {/* Design Recommendations Preview (if any) */}
                              {msg.recommendations && msg.recommendations.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-[#E5D9CE]/70 space-y-2">
                                  <div className="flex items-center gap-1 text-[11px] font-bold text-[#B95945]">
                                    <span>✨ Recommended Designs ({msg.recommendations.length}):</span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {msg.recommendations.map(rec => (
                                      <div
                                        key={rec.id}
                                        className="flex items-center gap-2 p-2 rounded-lg bg-[#FAF8F5] border border-[#E5D9CE]/80 text-[11px]"
                                      >
                                        {rec.image ? (
                                          <div className="relative w-12 h-12 rounded-md overflow-hidden flex-shrink-0 bg-[#E5D9CE]">
                                            <Image
                                              src={rec.image}
                                              alt={rec.title}
                                              fill
                                              sizes="48px"
                                              className="object-cover"
                                            />
                                          </div>
                                        ) : (
                                          <div className="w-12 h-12 rounded-md bg-[#E5D9CE] flex items-center justify-center text-base flex-shrink-0">
                                            🌿
                                          </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                          <span className="font-semibold text-[#261B16] block truncate">
                                            {rec.title}
                                          </span>
                                          <span className="text-[10px] text-[#786052] block capitalize">
                                            {rec.categoryLabel || rec.category}
                                          </span>
                                          {rec.slug && (
                                            <Link
                                              href={`/designs/${rec.slug}`}
                                              target="_blank"
                                              className="text-[10px] text-[#B95945] font-semibold hover:underline inline-block mt-0.5"
                                            >
                                              View design →
                                            </Link>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* WhatsApp Consultation Action Preview */}
                              {msg.action && (
                                <div className="mt-3 pt-2.5 border-t border-[#E5D9CE]/70">
                                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366]/10 border border-[#25D366]/30 text-[#128C7E] text-[11px] font-semibold">
                                    <WhatsAppIcon size={14} className="text-[#25D366]" />
                                    <span>
                                      Action: {msg.action.label || 'WhatsApp Consultation Prompted'}
                                    </span>
                                  </div>
                                </div>
                              )}

                              {/* Follow-up question badge */}
                              {msg.follow_up_question && (
                                <div className="mt-2.5 pt-2 border-t border-[#E5D9CE]/50 text-[11px] text-[#786052]">
                                  <span className="font-semibold text-[#4E2714]">Follow-up: </span>
                                  <em>&ldquo;{msg.follow_up_question}&rdquo;</em>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
                <div ref={chatMessagesEndRef} />
              </div>

              {/* Chat Bottom Info Bar */}
              <div className="bg-white border-t border-[#E5D9CE] px-4 py-2.5 flex items-center justify-between text-[11px] text-[#786052] flex-shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  <span>AI Chat History mode (Read-only historical view)</span>
                </div>
                <div className="font-mono text-[10px] text-[#A39184]">
                  ID: {selectedDetail.id}
                </div>
              </div>
            </>
          ) : (
            /* Empty State when no conversation is selected */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#FAF8F5]">
              <div className="w-16 h-16 rounded-2xl bg-[#F2E8DC] flex items-center justify-center text-3xl mb-4 text-[#B95945] shadow-xs">
                💬
              </div>
              <h2 className="font-serif-heading text-lg font-bold text-[#261B16] mb-1">
                Select a Conversation
              </h2>
              <p className="text-xs text-[#786052] max-w-sm mb-4">
                Choose any visitor or user conversation from the left sidebar to view the full
                chronological transcript, AI answers, and design suggestions.
              </p>
              <div className="p-3 bg-white border border-[#E5D9CE] rounded-xl text-left text-xs max-w-sm text-[#4E2714] space-y-1.5 shadow-2xs">
                <div className="font-semibold text-xs flex items-center gap-1.5 text-[#261B16]">
                  <span>✨ Features</span>
                </div>
                <p className="text-[11px] text-[#786052]">• View user queries and full AI answers</p>
                <p className="text-[11px] text-[#786052]">• Review recommended mehndi designs</p>
                <p className="text-[11px] text-[#786052]">• Filter by unread, active, or resolved status</p>
              </div>
            </div>
          )}
        </section>

        {/* ======================================================== */}
        {/* RIGHT PANEL: Complete User Profile & Telemetry View     */}
        {/* ======================================================== */}
        {selectedConversationId && selectedDetail && (
          <UserProfilePanel
            profile={selectedDetail.user_profile}
            conversation={selectedDetail}
            isOpen={isProfileOpen}
            onClose={() => setIsProfileOpen(false)}
          />
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#E5D9CE] max-w-md w-full p-5 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2.5 text-red-600">
              <span className="text-xl">⚠️</span>
              <h3 className="font-bold text-sm text-[#261B16]">Delete Conversation</h3>
            </div>
            <p className="text-xs text-[#786052]">
              Are you sure you want to permanently delete this conversation and all associated
              messages? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-[#E5D9CE] text-xs font-medium text-[#4E2714] hover:bg-[#F7F4EF]"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConversation}
                disabled={actionLoading}
                className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
