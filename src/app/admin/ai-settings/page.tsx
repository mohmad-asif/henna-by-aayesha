'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ClientAIProvider } from '@/lib/ai/types';
import { ClientEmbeddingSettings } from '@/lib/ai/embeddings/types';

interface KnowledgeDocItem {
  id: string;
  source_type: string;
  source_id: string;
  title: string;
  status: string;
  error?: string | null;
  updated_at: string;
  snippet: string;
}

interface KnowledgeStats {
  total: number;
  indexed: number;
  pending: number;
  failed: number;
  last_indexed: string | null;
  embedding_provider: string;
  embedding_model: string;
  dimensions: number;
  requires_reindex: boolean;
}

import { AIRecommendationSettings, DEFAULT_RECOMMENDATION_SETTINGS } from '@/lib/ai/design/types';

export default function AdminAISettingsPage() {
  const [activeTab, setActiveTab] = useState<'chat' | 'embedding' | 'knowledge' | 'recommendations'>('chat');

  // Chat Providers state
  const [providers, setProviders] = useState<ClientAIProvider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [testingKey, setTestingKey] = useState<string | null>(null);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  // Chat Key Edit Modal
  const [activeEditKey, setActiveEditKey] = useState<string | null>(null);
  const [newApiKeyInput, setNewApiKeyInput] = useState<string>('');
  const [newAccountIdInput, setNewAccountIdInput] = useState<string>('');
  const [showKeyText, setShowKeyText] = useState(false);

  // Embedding Configuration state
  const [embeddingSettings, setEmbeddingSettings] = useState<ClientEmbeddingSettings | null>(null);
  const [loadingEmbedding, setLoadingEmbedding] = useState(true);
  const [savingEmbedding, setSavingEmbedding] = useState(false);
  const [testingEmbedding, setTestingEmbedding] = useState(false);
  const [embeddingKeyInput, setEmbeddingKeyInput] = useState('');
  const [showEmbeddingKeyText, setShowEmbeddingKeyText] = useState(false);

  // Knowledge Base state
  const [knowledgeStats, setKnowledgeStats] = useState<KnowledgeStats | null>(null);
  const [knowledgeDocs, setKnowledgeDocs] = useState<KnowledgeDocItem[]>([]);
  const [loadingKnowledge, setLoadingKnowledge] = useState(true);
  const [indexingKnowledge, setIndexingKnowledge] = useState(false);

  // Recommendation Settings state
  const [recSettings, setRecSettings] = useState<AIRecommendationSettings>(DEFAULT_RECOMMENDATION_SETTINGS);
  const [loadingRec, setLoadingRec] = useState(true);
  const [savingRec, setSavingRec] = useState(false);

  // Global Alert Message
  const [statusAlert, setStatusAlert] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Load chat providers from database
  const loadProviders = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/ai-providers', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.providers) setProviders(data.providers);
    } catch (err) {
      console.error('[Admin AI Settings] loadProviders error:', err);
    } finally {
      setLoadingProviders(false);
    }
  }, []);

  // Load embedding configuration
  const loadEmbeddingSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/embedding-config');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.settings) setEmbeddingSettings(data.settings);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingEmbedding(false);
    }
  }, []);

  // Load knowledge base stats & documents
  const loadKnowledgeBase = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/knowledge-base');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.stats) setKnowledgeStats(data.stats);
      if (data.documents) setKnowledgeDocs(data.documents);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingKnowledge(false);
    }
  }, []);

  // Load recommendation settings
  const loadRecommendationSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/recommendation-settings');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.settings) setRecSettings(data.settings);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRec(false);
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function initAll() {
      await Promise.all([
        loadProviders(),
        loadEmbeddingSettings(),
        loadKnowledgeBase(),
        loadRecommendationSettings(),
      ]);
      if (isCancelled) return;
    }

    void initAll();

    return () => {
      isCancelled = true;
    };
  }, [loadProviders, loadEmbeddingSettings, loadKnowledgeBase, loadRecommendationSettings]);

  // Chat Provider save
  const handleSaveProvider = async (
    provider: ClientAIProvider,
    newKey?: string,
    newAccountId?: string
  ) => {
    setSavingKey(provider.provider_key);
    setStatusAlert(null);

    try {
      const res = await fetch('/api/admin/ai-providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider_key: provider.provider_key,
          enabled: provider.enabled,
          model: provider.model,
          priority: provider.priority,
          api_key: newKey || undefined,
          account_id: newAccountId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save provider configuration.');

      setStatusAlert({
        type: 'success',
        message: `${provider.display_name} configuration saved successfully!`,
      });

      if (activeEditKey === provider.provider_key) {
        setActiveEditKey(null);
        setNewApiKeyInput('');
        setNewAccountIdInput('');
      }

      await loadProviders();
      await loadEmbeddingSettings(); // Key might be shared with embedding
    } catch (err) {
      setStatusAlert({
        type: 'error',
        message: err instanceof Error ? err.message : 'Save failed.',
      });
    } finally {
      setSavingKey(null);
    }
  };

  // Immediate toggle provider enabled status with database persistence
  const handleToggleProvider = async (provider: ClientAIProvider) => {
    const nextEnabled = !provider.enabled;
    setTogglingKey(provider.provider_key);
    setStatusAlert(null);

    // Optimistically update React state immediately
    setProviders((prev) =>
      prev.map((p) =>
        p.provider_key === provider.provider_key ? { ...p, enabled: nextEnabled } : p
      )
    );

    try {
      const res = await fetch('/api/admin/ai-providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider_key: provider.provider_key,
          enabled: nextEnabled,
          model: provider.model,
          priority: provider.priority,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update provider status.');

      setStatusAlert({
        type: 'success',
        message: `${provider.display_name} is now ${nextEnabled ? 'enabled' : 'disabled'}. Saved to database!`,
      });

      // Re-fetch to ensure local state perfectly matches Supabase
      await loadProviders();
    } catch (err) {
      // Revert optimistic update on failure
      setProviders((prev) =>
        prev.map((p) =>
          p.provider_key === provider.provider_key ? { ...p, enabled: !nextEnabled } : p
        )
      );
      setStatusAlert({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to update provider status.',
      });
    } finally {
      setTogglingKey(null);
    }
  };

  // Immediate priority update with database persistence
  const handlePriorityChange = async (provider: ClientAIProvider, newPriority: number) => {
    setStatusAlert(null);

    // Optimistically update React state
    setProviders((prev) =>
      prev.map((p) =>
        p.provider_key === provider.provider_key ? { ...p, priority: newPriority } : p
      )
    );

    try {
      const res = await fetch('/api/admin/ai-providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider_key: provider.provider_key,
          enabled: provider.enabled,
          model: provider.model,
          priority: newPriority,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update provider priority.');

      setStatusAlert({
        type: 'success',
        message: `${provider.display_name} priority set to #${newPriority}. Saved to database!`,
      });

      // Re-fetch to update sorted state from Supabase
      await loadProviders();
    } catch (err) {
      setStatusAlert({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to update priority.',
      });
      await loadProviders(); // Rollback from database
    }
  };

  // Chat Provider test
  const handleTestProvider = async (
    provider: ClientAIProvider,
    explicitKey?: string,
    explicitAccountId?: string
  ) => {
    setTestingKey(provider.provider_key);
    setStatusAlert(null);

    // Prioritize explicit key, or the key currently typed in the active edit drawer
    const keyToTest =
      explicitKey !== undefined
        ? explicitKey
        : activeEditKey === provider.provider_key && newApiKeyInput.trim()
          ? newApiKeyInput.trim()
          : undefined;

    const accountIdToTest =
      explicitAccountId !== undefined
        ? explicitAccountId
        : activeEditKey === provider.provider_key && newAccountIdInput.trim()
          ? newAccountIdInput.trim()
          : undefined;

    try {
      const res = await fetch('/api/admin/ai-providers/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider_key: provider.provider_key,
          model: provider.model,
          api_key: keyToTest,
          account_id: accountIdToTest,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStatusAlert({
          type: 'success',
          message: `✓ ${provider.display_name} Connected! (${data.latencyMs} ms) ${data.message || ''}`,
        });
      } else {
        setStatusAlert({
          type: 'error',
          message: `✗ ${provider.display_name} Connection Failed: ${data.error || 'Check credentials and model.'}`,
        });
      }

      await loadProviders();
    } catch (err) {
      setStatusAlert({
        type: 'error',
        message: err instanceof Error ? err.message : 'Test request failed.',
      });
    } finally {
      setTestingKey(null);
    }
  };

  // Embedding Settings save
  const handleSaveEmbeddingSettings = async () => {
    if (!embeddingSettings) return;
    setSavingEmbedding(true);
    setStatusAlert(null);

    try {
      const res = await fetch('/api/admin/embedding-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider_key: embeddingSettings.provider_key,
          model: embeddingSettings.model,
          dimensions: embeddingSettings.dimensions,
          enabled: embeddingSettings.enabled,
          api_key: embeddingKeyInput || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save embedding configuration.');

      setStatusAlert({
        type: 'success',
        message: 'Embedding configuration saved successfully!',
      });
      setEmbeddingKeyInput('');

      await loadEmbeddingSettings();
      await loadKnowledgeBase();
    } catch (err) {
      setStatusAlert({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to save embedding settings.',
      });
    } finally {
      setSavingEmbedding(false);
    }
  };

  // Embedding Provider test
  const handleTestEmbedding = async () => {
    if (!embeddingSettings) return;
    setTestingEmbedding(true);
    setStatusAlert(null);

    try {
      const res = await fetch('/api/admin/embedding-config/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider_key: embeddingSettings.provider_key,
          model: embeddingSettings.model,
          api_key: embeddingKeyInput || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStatusAlert({
          type: 'success',
          message: `✓ Embedding Provider Connected! (${data.latencyMs} ms)`,
        });
      } else {
        setStatusAlert({
          type: 'error',
          message: `✗ Embedding Test Failed: ${data.error || 'Check API key and model.'}`,
        });
      }

      await loadEmbeddingSettings();
    } catch (err) {
      setStatusAlert({
        type: 'error',
        message: err instanceof Error ? err.message : 'Test request failed.',
      });
    } finally {
      setTestingEmbedding(false);
    }
  };

  // Knowledge Base indexing trigger
  const handleSyncKnowledge = async (forceReindex: boolean) => {
    setIndexingKnowledge(true);
    setStatusAlert(null);

    try {
      const res = await fetch('/api/admin/knowledge-base', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: forceReindex ? 'reindex' : 'sync',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to sync knowledge base.');

      setStatusAlert({
        type: 'success',
        message: data.message || 'Knowledge base synchronized successfully!',
      });

      await loadKnowledgeBase();
      await loadEmbeddingSettings();
    } catch (err) {
      setStatusAlert({
        type: 'error',
        message: err instanceof Error ? err.message : 'Indexing failed.',
      });
    } finally {
      setIndexingKnowledge(false);
    }
  };

  const isLoadingTotal = loadingProviders && loadingEmbedding && loadingKnowledge;

  if (isLoadingTotal) {
    return (
      <div className="p-10 max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-[#B95945] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const sortedProviders = [...providers].sort((a, b) => a.priority - b.priority);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#EADBCE]">
        <div>
          <span className="text-xs uppercase tracking-wider font-bold text-[#B95945]">
            AI Management
          </span>
          <h1 className="font-serif-heading text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#261B16] mt-1">
            AI Settings
          </h1>
          <p className="text-xs sm:text-sm text-[#703D24] mt-1 max-w-3xl">
            Configure multi-provider chat routing, Supabase pgvector embeddings, and knowledge base
            indexing.
          </p>
        </div>

        <button
          onClick={() => {
            loadProviders();
            loadEmbeddingSettings();
            loadKnowledgeBase();
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-[#4E2714] bg-[#F5ECE4] hover:bg-[#EBDDCF] border border-[#E4D2C3] rounded-xl transition-colors w-full sm:w-auto cursor-pointer"
        >
          <span>↻ Refresh All</span>
        </button>
      </div>

      {/* Global Alert */}
      {statusAlert && (
        <div
          className={`p-4 rounded-xl text-sm flex items-start justify-between gap-3 border ${statusAlert.type === 'success'
            ? 'bg-[#EAFBF0] border-[#A8EBC0] text-[#1E7E34]'
            : statusAlert.type === 'error'
              ? 'bg-[#FDF2F0] border-[#F8C8C2] text-[#9B2A1E]'
              : 'bg-[#F0F7FF] border-[#CCE4FF] text-[#0A58CA]'
            }`}
        >
          <span className="leading-snug">{statusAlert.message}</span>
          <button
            onClick={() => setStatusAlert(null)}
            className="text-xs font-bold opacity-60 hover:opacity-100 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-[#EADBCE] pb-1 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('chat')}
          className={`shrink-0 whitespace-nowrap px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-colors border-b-2 -mb-[3px] cursor-pointer ${activeTab === 'chat'
            ? 'border-[#B95945] text-[#B95945] bg-white'
            : 'border-transparent text-[#703D24] hover:text-[#261B16] hover:bg-[#FAF6F0]'
            }`}
        >
          💬 Chat Providers ({providers.filter((p) => p.enabled).length} Active)
        </button>

        <button
          onClick={() => setActiveTab('embedding')}
          className={`shrink-0 whitespace-nowrap px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-colors border-b-2 -mb-[3px] cursor-pointer ${activeTab === 'embedding'
            ? 'border-[#B95945] text-[#B95945] bg-white'
            : 'border-transparent text-[#703D24] hover:text-[#261B16] hover:bg-[#FAF6F0]'
            }`}
        >
          ⚡ Embedding Configuration ({embeddingSettings?.model || '768d'})
        </button>

        <button
          onClick={() => setActiveTab('knowledge')}
          className={`shrink-0 whitespace-nowrap px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-colors border-b-2 -mb-[3px] cursor-pointer ${activeTab === 'knowledge'
            ? 'border-[#B95945] text-[#B95945] bg-white'
            : 'border-transparent text-[#703D24] hover:text-[#261B16] hover:bg-[#FAF6F0]'
            }`}
        >
          📚 Knowledge Base ({knowledgeStats?.indexed ?? 0} Indexed)
        </button>

        <button
          onClick={() => setActiveTab('recommendations')}
          className={`shrink-0 whitespace-nowrap px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-colors border-b-2 -mb-[3px] cursor-pointer ${activeTab === 'recommendations'
            ? 'border-[#B95945] text-[#B95945] bg-white'
            : 'border-transparent text-[#703D24] hover:text-[#261B16] hover:bg-[#FAF6F0]'
            }`}
        >
          ✨ Recommendations ({recSettings.enabled ? 'Active' : 'Disabled'})
        </button>
      </div>

      {/* TAB 1: CHAT PROVIDERS */}
      {activeTab === 'chat' && (
        <div className="space-y-6">
          {/* Active AI Provider Status Banner */}
          {sortedProviders.filter((p) => p.enabled).length === 0 ? (
            <div className="p-4 rounded-2xl bg-[#FFF8EB] border border-[#FAD7A0] text-[#7E5109] flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-start sm:items-center gap-3">
                <span className="text-xl">⚠</span>
                <div>
                  <strong className="block text-sm font-semibold">
                    No active AI provider configured.
                  </strong>
                  <span className="text-xs text-[#8C5D0D]">
                    All AI chat providers are currently disabled. The website chat assistant will show the direct WhatsApp fallback until you enable at least one configured provider below.
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-[#EAFBF0] border border-[#C6EFD2] text-[#1E7E34] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div>
                <strong className="block text-sm font-semibold">
                  Active AI Routing ({sortedProviders.filter((p) => p.enabled).length} Enabled)
                </strong>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {sortedProviders
                  .filter((p) => p.enabled)
                  .map((p, idx) => (
                    <span
                      key={p.provider_key}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white border border-[#A8EBC0] text-[#1E7E34] shadow-2xs"
                    >
                      <span className="w-2 h-2 rounded-full bg-[#1E7E34]" />
                      #{p.priority} {p.display_name} {idx === 0 ? '(Primary)' : ``}
                    </span>
                  ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-[#EADBCE] shadow-xs overflow-hidden">
            <div className="p-5 border-b border-[#EADBCE] flex items-center justify-between">
              <div>
                <h2 className="font-serif-heading text-xl font-semibold text-[#261B16]">
                  AI Chat Providers
                </h2>
              </div>
            </div>

            <div className="divide-y divide-[#F1E9DF]">
              {sortedProviders.map((provider) => {
                const isSaving = savingKey === provider.provider_key;
                const isTesting = testingKey === provider.provider_key;
                const isToggling = togglingKey === provider.provider_key;
                const isEditingThisKey = activeEditKey === provider.provider_key;

                return (
                  <div
                    key={provider.provider_key}
                    className={`p-5 sm:p-6 transition-colors ${provider.enabled ? 'bg-white' : 'bg-[#FCFBF9]'
                      }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Info */}
                      <div className="flex items-start sm:items-center gap-3.5">
                        <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-[#F5ECE4] border border-[#E4D2C3] text-[#4E2714] flex-shrink-0">
                          <span className="text-[10px] uppercase font-bold tracking-tight text-[#847269]">
                            Rank
                          </span>
                          <span className="text-base font-extrabold text-[#4E2714]">
                            #{provider.priority}
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-base text-[#261B16]">
                              {provider.display_name}
                            </h3>
                            {provider.enabled ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#EAFBF0] text-[#1E7E34] border border-[#C6EFD2]">
                                ● Enabled
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#F1E9DF] text-[#847269]">
                                Disabled
                              </span>
                            )}
                            {provider.last_status === 'connected' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#EAFBF0] text-[#1E7E34]">
                                ✓ Healthy
                              </span>
                            )}
                            {provider.last_status === 'error' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FDF2F0] text-[#9B2A1E]">
                                ⚠ Error
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-[#847269] mt-1 flex-wrap">

                            {provider.provider_key === 'cloudflare' && (
                              <>
                                <span>
                                  Account ID:{' '}
                                  {provider.has_account_id ? (
                                    <code className="bg-[#F5ECE4] px-1.5 py-0.5 rounded text-[11px] text-[#4E2714]">
                                      {provider.masked_account_id || '••••••••••••'}
                                    </code>
                                  ) : (
                                    <span className="text-[#9B2A1E] font-medium">Not configured</span>
                                  )}
                                </span>
                              </>
                            )}
                            <span>
                              {provider.provider_key === 'cloudflare' ? 'API Token' : 'Key'}:{' '}
                              {provider.has_api_key ? (
                                <code className="bg-[#F5ECE4] px-1.5 py-0.5 rounded text-[11px] text-[#4E2714]">
                                  {provider.masked_key || '••••••••••••'}
                                </code>
                              ) : (
                                <span className="text-[#9B2A1E] font-medium">Not configured</span>
                              )}
                            </span>
                            {provider.last_tested_at && (
                              <>
                                <span>•</span>
                                <span className="text-[11px] text-[#A39184]">
                                  Tested: {new Date(provider.last_tested_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2.5 flex-wrap self-end lg:self-auto">
                        <div className="flex items-center gap-1.5 text-xs">
                          <label className="text-[#847269] font-medium">Priority:</label>
                          <select
                            value={provider.priority}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              handlePriorityChange(provider, val);
                            }}
                            className="px-2.5 py-1.5 text-xs bg-white border border-[#EADBCE] rounded-lg text-[#261B16] focus:ring-1 focus:ring-[#B95945]"
                          >
                            {[1, 2, 3, 4, 5, 6].map((num) => (
                              <option key={num} value={num}>
                                #{num}
                              </option>
                            ))}
                          </select>
                        </div>

                        <button
                          type="button"
                          disabled={isToggling}
                          onClick={() => handleToggleProvider(provider)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 ${provider.enabled
                            ? 'bg-[#EAFBF0] hover:bg-[#D5F5DF] text-[#1E7E34] border border-[#C6EFD2]'
                            : 'bg-[#F5ECE4] hover:bg-[#EBDDCF] text-[#703D24] border border-[#E4D2C3]'
                            }`}
                        >
                          {isToggling ? (
                            <span className="inline-flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full border border-current border-t-transparent animate-spin" />
                              Saving...
                            </span>
                          ) : provider.enabled ? (
                            'Enabled'
                          ) : (
                            'Disabled'
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (isEditingThisKey) {
                              setActiveEditKey(null);
                              setNewApiKeyInput('');
                              setNewAccountIdInput('');
                            } else {
                              setActiveEditKey(provider.provider_key);
                              setNewApiKeyInput('');
                              setNewAccountIdInput('');
                            }
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-[#4E2714] bg-[#F5ECE4] hover:bg-[#EBDDCF] border border-[#E4D2C3] rounded-lg"
                        >
                          {isEditingThisKey
                            ? 'Cancel'
                            : provider.provider_key === 'cloudflare'
                              ? 'Update Value'
                              : 'Update Key'}
                        </button>

                        <button
                          type="button"
                          disabled={
                            isTesting ||
                            (!provider.has_api_key && (!isEditingThisKey || !newApiKeyInput.trim())) ||
                            (provider.provider_key === 'cloudflare' && !provider.has_account_id && (!isEditingThisKey || !newAccountIdInput.trim()))
                          }
                          onClick={() => handleTestProvider(provider)}
                          className="px-3 py-1.5 text-xs font-semibold text-[#4E2714] bg-white hover:bg-[#FAF6F0] border border-[#EADBCE] rounded-lg disabled:opacity-40"
                        >
                          {isTesting ? 'Testing...' : 'Test'}
                        </button>

                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => handleSaveProvider(provider)}
                          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#B95945] hover:bg-[#9B4230] rounded-lg shadow-xs disabled:opacity-50"
                        >
                          {isSaving ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </div>

                    {/* Edit Key / Account Drawer */}
                    {isEditingThisKey && (
                      <div className="mt-4 p-4 rounded-xl bg-[#FAF6F0] border border-[#E4D2C3] space-y-3">
                        {provider.provider_key === 'cloudflare' ? (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-[#58463D] mb-1">
                                Cloudflare Account ID <span className="text-[#B95945]">*</span>
                              </label>
                              <input
                                type="text"
                                value={newAccountIdInput}
                                onChange={(e) => setNewAccountIdInput(e.target.value)}
                                placeholder={provider.has_account_id ? provider.masked_account_id : 'e.g. 1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d'}
                                className="w-full px-3 py-2 text-xs bg-white border border-[#EADBCE] rounded-lg text-[#261B16] font-mono"
                              />
                              <span className="text-[10px] text-[#847269] mt-0.5 block">
                                32-character hex ID found on Cloudflare overview.
                              </span>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-[#58463D] mb-1">
                                Cloudflare API Token <span className="text-[#B95945]">*</span>
                              </label>
                              <div className="relative">
                                <input
                                  type={showKeyText ? 'text' : 'password'}
                                  value={newApiKeyInput}
                                  onChange={(e) => setNewApiKeyInput(e.target.value)}
                                  placeholder={provider.has_api_key ? provider.masked_key : 'Paste Workers AI API token'}
                                  className="w-full px-3 py-2 pr-16 text-xs bg-white border border-[#EADBCE] rounded-lg text-[#261B16]"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowKeyText(!showKeyText)}
                                  className="absolute right-2 top-2 text-[10px] font-semibold text-[#847269]"
                                >
                                  {showKeyText ? 'Hide' : 'Show'}
                                </button>
                              </div>
                              <span className="text-[10px] text-[#847269] mt-0.5 block">
                                Requires Workers AI Read/Edit permissions.
                              </span>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-[#58463D] mb-1">
                                Workers AI Model
                              </label>
                              <select
                                value={provider.model}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setProviders((prev) =>
                                    prev.map((p) =>
                                      p.provider_key === provider.provider_key
                                        ? { ...p, model: val }
                                        : p
                                    )
                                  );
                                }}
                                className="w-full px-3 py-2 text-xs bg-white border border-[#EADBCE] rounded-lg text-[#261B16]"
                              >
                                {provider.supported_models.map((m) => (
                                  <option key={m} value={m}>
                                    {m}
                                  </option>
                                ))}
                              </select>
                              <span className="text-[10px] text-[#847269] mt-0.5 block">
                                Select or configure Workers AI model.
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-[#58463D] mb-1">
                                New API Key
                              </label>
                              <div className="relative">
                                <input
                                  type={showKeyText ? 'text' : 'password'}
                                  value={newApiKeyInput}
                                  onChange={(e) => setNewApiKeyInput(e.target.value)}
                                  placeholder="Paste API key here"
                                  className="w-full px-3 py-2 pr-16 text-xs bg-white border border-[#EADBCE] rounded-lg text-[#261B16]"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowKeyText(!showKeyText)}
                                  className="absolute right-2 top-2 text-[10px] font-semibold text-[#847269]"
                                >
                                  {showKeyText ? 'Hide' : 'Show'}
                                </button>
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-[#58463D] mb-1">
                                Model Identifier
                              </label>
                              <input
                                type="text"
                                value={provider.model}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setProviders((prev) =>
                                    prev.map((p) =>
                                      p.provider_key === provider.provider_key
                                        ? { ...p, model: val }
                                        : p
                                    )
                                  );
                                }}
                                className="w-full px-3 py-2 text-xs bg-white border border-[#EADBCE] rounded-lg text-[#261B16]"
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-2 pt-2 flex-wrap">
                          <div className="text-[11px] text-[#847269]">
                            {provider.provider_key === 'cloudflare'
                              ? newAccountIdInput.trim() || newApiKeyInput.trim()
                                ? 'Credentials entered. You can test before saving or save directly.'
                                : 'Enter your Cloudflare Account ID and API Token to configure Workers AI.'
                              : newApiKeyInput.trim()
                                ? 'Key entered. You can test before saving or save directly.'
                                : 'Enter an API key to enable live connection testing.'}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveEditKey(null);
                                setNewApiKeyInput('');
                                setNewAccountIdInput('');
                              }}
                              className="px-3 py-1.5 text-xs text-[#847269] hover:text-[#4E2714]"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              disabled={
                                isTesting ||
                                (provider.provider_key === 'cloudflare'
                                  ? (!newApiKeyInput.trim() && !provider.has_api_key) ||
                                  (!newAccountIdInput.trim() && !provider.has_account_id)
                                  : !newApiKeyInput.trim() && !provider.has_api_key)
                              }
                              onClick={() =>
                                handleTestProvider(
                                  provider,
                                  newApiKeyInput.trim() || undefined,
                                  newAccountIdInput.trim() || undefined
                                )
                              }
                              className="px-3.5 py-1.5 text-xs font-semibold text-[#4E2714] bg-white hover:bg-[#FAF6F0] border border-[#EADBCE] rounded-lg disabled:opacity-40"
                            >
                              {isTesting ? 'Testing...' : 'Test Connection'}
                            </button>
                            <button
                              type="button"
                              disabled={isSaving}
                              onClick={() =>
                                handleSaveProvider(
                                  provider,
                                  newApiKeyInput.trim() || undefined,
                                  newAccountIdInput.trim() || undefined
                                )
                              }
                              className="px-4 py-1.5 text-xs font-semibold text-white bg-[#B95945] hover:bg-[#9B4230] rounded-lg shadow-xs"
                            >
                              {isSaving ? 'Saving...' : 'Save Settings'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EMBEDDING CONFIGURATION */}
      {activeTab === 'embedding' && embeddingSettings && (
        <div className="space-y-6">
          {/* Model Re-index Warning Banner */}
          {embeddingSettings.requires_reindex && (
            <div className="p-4 rounded-2xl bg-[#FFF8EB] border border-[#FAD7A0] text-[#7E5109] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <strong className="block text-sm">⚠ Re-index Required</strong>
                <span className="text-xs">
                  The embedding model or provider was changed. Existing vectors must be re-indexed
                  so they align with the new embedding space.
                </span>
              </div>
              <button
                type="button"
                disabled={indexingKnowledge}
                onClick={() => handleSyncKnowledge(true)}
                className="px-4 py-2 rounded-xl bg-[#C29B4D] hover:bg-[#A98336] text-white text-xs font-semibold shadow-xs flex-shrink-0"
              >
                {indexingKnowledge ? 'Re-indexing...' : 'Re-index Knowledge Base Now'}
              </button>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-[#EADBCE] p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-[#EADBCE] pb-4">
              <div>
                <h2 className="font-serif-heading text-xl font-semibold text-[#261B16]">
                  Embedding Provider & Model
                </h2>
                <p className="text-xs text-[#847269] mt-0.5">
                  Generates vector embeddings for website knowledge documents and user chat queries.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {embeddingSettings.last_status === 'connected' && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#EAFBF0] text-[#1E7E34]">
                    ✓ Connected
                  </span>
                )}
                {embeddingSettings.last_status === 'error' && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FDF2F0] text-[#9B2A1E]">
                    ⚠ Connection Error
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Provider Selection */}
              <div>
                <label className="block text-xs font-semibold text-[#4E2714] mb-1.5">
                  Embedding Provider
                </label>
                <select
                  value={embeddingSettings.provider_key}
                  onChange={(e) => {
                    const key = e.target.value as import('@/lib/ai/embeddings/types').EmbeddingProviderKey;
                    let defaultModel = 'gemini-embedding-2';
                    let dims = 768;
                    if (key === 'cohere') {
                      defaultModel = 'embed-english-v3.0';
                      dims = 1024;
                    } else if (key === 'mistral') {
                      defaultModel = 'mistral-embed';
                      dims = 1024;
                    } else if (key === 'openrouter') {
                      defaultModel = 'openai/text-embedding-3-small';
                      dims = 1536;
                    }
                    setEmbeddingSettings({
                      ...embeddingSettings,
                      provider_key: key,
                      model: defaultModel,
                      dimensions: dims,
                    });
                  }}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#EADBCE] rounded-xl text-[#261B16] focus:ring-1 focus:ring-[#B95945]"
                >
                  <option value="gemini">Google Gemini (gemini-embedding-2 - 768d Recommended)</option>
                  <option value="cohere">Cohere (embed-english-v3.0)</option>
                  <option value="mistral">Mistral AI (mistral-embed)</option>
                  <option value="openrouter">OpenRouter (openai/text-embedding-3-small)</option>
                </select>
                <span className="text-[11px] text-[#847269] mt-1 block">
                  Decoupled from chat providers. You can use Gemini for embeddings and Groq for chat.
                </span>
              </div>

              {/* Model */}
              <div>
                <label className="block text-xs font-semibold text-[#4E2714] mb-1.5">
                  Embedding Model Identifier
                </label>
                <input
                  type="text"
                  value={embeddingSettings.model}
                  onChange={(e) =>
                    setEmbeddingSettings({ ...embeddingSettings, model: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#EADBCE] rounded-xl text-[#261B16] focus:ring-1 focus:ring-[#B95945]"
                />
                <span className="text-[11px] text-[#847269] mt-1 block">
                  Output dimension: <strong>{embeddingSettings.dimensions} dimensions</strong> (must
                  match database pgvector column)
                </span>
              </div>

              {/* API Key */}
              <div>
                <label className="block text-xs font-semibold text-[#4E2714] mb-1.5">
                  Provider API Key
                </label>
                <div className="relative">
                  <input
                    type={showEmbeddingKeyText ? 'text' : 'password'}
                    value={embeddingKeyInput}
                    onChange={(e) => setEmbeddingKeyInput(e.target.value)}
                    placeholder={
                      embeddingSettings.has_api_key
                        ? embeddingSettings.masked_key
                        : 'Paste dedicated embedding API key'
                    }
                    className="w-full px-3.5 py-2.5 pr-16 text-xs bg-white border border-[#EADBCE] rounded-xl text-[#261B16] focus:ring-1 focus:ring-[#B95945]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEmbeddingKeyText(!showEmbeddingKeyText)}
                    className="absolute right-3 top-2.5 text-xs text-[#847269]"
                  >
                    {showEmbeddingKeyText ? 'Hide' : 'Show'}
                  </button>
                </div>
                <span className="text-[11px] text-[#847269] mt-1 block">
                  Leave blank to reuse key configured in Chat Providers for this vendor.
                </span>
              </div>

              {/* Status & Actions */}
              <div className="flex flex-col justify-end space-y-2">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={testingEmbedding}
                    onClick={handleTestEmbedding}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-[#EADBCE] bg-white hover:bg-[#FAF6F0] text-xs font-semibold text-[#4E2714] transition-colors"
                  >
                    {testingEmbedding ? 'Testing...' : 'Test Connection'}
                  </button>
                  <button
                    type="button"
                    disabled={savingEmbedding}
                    onClick={handleSaveEmbeddingSettings}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-[#B95945] hover:bg-[#9B4230] text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    {savingEmbedding ? 'Saving...' : 'Save Configuration'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: KNOWLEDGE BASE */}
      {activeTab === 'knowledge' && (
        <div className="space-y-6">
          {/* Knowledge Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-[#EADBCE] p-5 shadow-xs">
              <span className="text-xs uppercase tracking-wider text-[#847269] font-medium block">
                Total Documents
              </span>
              <span className="text-2xl font-bold text-[#261B16] mt-2 block">
                {knowledgeStats?.total ?? 0}
              </span>
              <span className="text-xs text-[#847269] mt-1 block">Designs, services, FAQs, info</span>
            </div>

            <div className="bg-white rounded-2xl border border-[#EADBCE] p-5 shadow-xs">
              <span className="text-xs uppercase tracking-wider text-[#847269] font-medium block">
                Indexed in pgvector
              </span>
              <span className="text-2xl font-bold text-[#1E7E34] mt-2 block">
                {knowledgeStats?.indexed ?? 0}
              </span>
              <span className="text-xs text-[#847269] mt-1 block">Active vector searchable</span>
            </div>

            <div className="bg-white rounded-2xl border border-[#EADBCE] p-5 shadow-xs">
              <span className="text-xs uppercase tracking-wider text-[#847269] font-medium block">
                Vector Dimensions
              </span>
              <span className="text-2xl font-bold text-[#4E2714] mt-2 block">
                {knowledgeStats?.dimensions ?? 768}d
              </span>
              <span className="text-xs text-[#847269] mt-1 block">
                {knowledgeStats?.embedding_model ?? 'text-embedding-004'}
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-[#EADBCE] p-5 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider text-[#847269] font-medium block">
                  Actions
                </span>
                <span className="text-xs text-[#847269] mt-1 block">
                  Sync changed items or re-index all
                </span>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <button
                  type="button"
                  disabled={indexingKnowledge}
                  onClick={() => handleSyncKnowledge(false)}
                  className="flex-1 px-3 py-2 text-xs font-semibold rounded-xl bg-[#FAF6F0] hover:bg-[#F5ECE4] border border-[#EADBCE] text-[#4E2714]"
                >
                  {indexingKnowledge ? 'Syncing...' : 'Sync New'}
                </button>
                <button
                  type="button"
                  disabled={indexingKnowledge}
                  onClick={() => handleSyncKnowledge(true)}
                  className="flex-1 px-3 py-2 text-xs font-semibold rounded-xl bg-[#B95945] hover:bg-[#9B4230] text-white shadow-xs"
                >
                  {indexingKnowledge ? 'Re-indexing...' : 'Re-index All'}
                </button>
              </div>
            </div>
          </div>

          {/* Documents Table */}
          <div className="bg-white rounded-2xl border border-[#EADBCE] shadow-xs overflow-hidden">
            <div className="p-5 border-b border-[#EADBCE] flex items-center justify-between">
              <div>
                <h2 className="font-serif-heading text-xl font-semibold text-[#261B16]">
                  Indexed Knowledge Documents
                </h2>
                <span className="text-xs text-[#847269]">
                  Individual records indexed in Supabase pgvector
                </span>
              </div>
            </div>

            <div className="divide-y divide-[#F1E9DF]">
              {knowledgeDocs.length === 0 ? (
                <div className="p-10 text-center text-xs text-[#847269]">
                  No documents indexed yet. Click &quot;Sync New&quot; above to ingest designs,
                  services, and studio policies.
                </div>
              ) : (
                knowledgeDocs.map((doc) => (
                  <div key={doc.id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-1 max-w-3xl">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#F5ECE4] text-[#4E2714] border border-[#E4D2C3]">
                          {doc.source_type.replace('_', ' ')}
                        </span>
                        <h4 className="font-bold text-sm text-[#261B16]">{doc.title}</h4>
                        {doc.status === 'indexed' && (
                          <span className="text-[10px] font-semibold text-[#1E7E34] bg-[#EAFBF0] px-2 py-0.5 rounded-full">
                            ✓ Indexed
                          </span>
                        )}
                        {doc.status === 'failed' && (
                          <span className="text-[10px] font-semibold text-[#9B2A1E] bg-[#FDF2F0] px-2 py-0.5 rounded-full">
                            ✗ Failed
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#58463D] line-clamp-2">{doc.snippet}</p>
                    </div>

                    <span className="text-[10px] text-[#A39184] flex-shrink-0 self-end sm:self-auto">
                      {new Date(doc.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: RECOMMENDATIONS SETTINGS */}
      {activeTab === 'recommendations' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#EADBCE] shadow-xs overflow-hidden">
            <div className="p-5 border-b border-[#EADBCE] flex items-center justify-between">
              <div>
                <h2 className="font-serif-heading text-xl font-semibold text-[#261B16]">
                  AI Mehndi Design Recommendations
                </h2>
                <span className="text-xs text-[#847269]">
                  Configure hybrid search, candidate limits, and semantic similarity thresholds
                </span>
              </div>

              <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${recSettings.enabled ? 'bg-[#EAFBF0] text-[#1E7E34]' : 'bg-[#FAF0E6] text-[#703D24]'
                }`}>
                {recSettings.enabled ? 'Feature Enabled' : 'Feature Disabled'}
              </span>
            </div>

            <div className="p-6 space-y-6">
              {loadingRec ? (
                <div className="text-xs text-[#847269]">Loading recommendation settings...</div>
              ) : (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setSavingRec(true);
                    setStatusAlert(null);
                    try {
                      const res = await fetch('/api/admin/recommendation-settings', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(recSettings),
                      });
                      if (!res.ok) throw new Error(`HTTP ${res.status}`);
                      setStatusAlert({
                        type: 'success',
                        message: 'Recommendation settings saved successfully.',
                      });
                    } catch (err) {
                      setStatusAlert({
                        type: 'error',
                        message: err instanceof Error ? err.message : 'Failed to save settings.',
                      });
                    } finally {
                      setSavingRec(false);
                    }
                  }}
                  className="space-y-6 max-w-2xl"
                >
                  {/* Enable Master Switch */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-[#FAF6F0] border border-[#EADBCE]">
                    <div>
                      <label className="text-sm font-bold text-[#261B16] block">
                        Enable Design Recommendations
                      </label>
                      <p className="text-xs text-[#703D24]">
                        When enabled, the AI Design Assistant extracts visitor preferences and recommends real designs.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={recSettings.enabled}
                      onChange={(e) =>
                        setRecSettings((prev) => ({ ...prev, enabled: e.target.checked }))
                      }
                      className="w-5 h-5 accent-[#B95945] rounded cursor-pointer"
                    />
                  </div>

                  {/* Max Recommendations */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#4E2714] block">
                      Maximum Design Recommendations ({recSettings.maxRecommendations})
                    </label>
                    <p className="text-xs text-[#847269]">
                      Controls how many matching design cards are returned per visitor inquiry (1 to 5).
                    </p>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      step={1}
                      value={recSettings.maxRecommendations}
                      onChange={(e) =>
                        setRecSettings((prev) => ({
                          ...prev,
                          maxRecommendations: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-[#B95945]"
                    />
                    <div className="flex justify-between text-[11px] text-[#A39184]">
                      <span>1 design (Minimal)</span>
                      <span>3 designs (Recommended)</span>
                      <span>5 designs (Maximum)</span>
                    </div>
                  </div>

                  {/* Similarity Threshold */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#4E2714] block">
                      Minimum Vector Similarity Threshold ({recSettings.minSimilarityThreshold.toFixed(2)})
                    </label>
                    <p className="text-xs text-[#847269]">
                      Minimum cosine similarity required for pgvector matching. Higher values require closer semantic relevance.
                    </p>
                    <input
                      type="range"
                      min={0.2}
                      max={0.7}
                      step={0.05}
                      value={recSettings.minSimilarityThreshold}
                      onChange={(e) =>
                        setRecSettings((prev) => ({
                          ...prev,
                          minSimilarityThreshold: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-[#B95945]"
                    />
                    <div className="flex justify-between text-[11px] text-[#A39184]">
                      <span>0.20 (Broad)</span>
                      <span>0.35 (Optimal)</span>
                      <span>0.70 (Strict)</span>
                    </div>
                  </div>

                  {/* Feature Toggles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="p-3.5 rounded-xl border border-[#EADBCE] bg-[#FAF6F0] flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-[#261B16] block">
                          Semantic Vector Search
                        </span>
                        <span className="text-[11px] text-[#703D24]">
                          Use pgvector embeddings
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={recSettings.enableSemantic}
                        onChange={(e) =>
                          setRecSettings((prev) => ({ ...prev, enableSemantic: e.target.checked }))
                        }
                        className="w-4 h-4 accent-[#B95945] rounded"
                      />
                    </div>

                    <div className="p-3.5 rounded-xl border border-[#EADBCE] bg-[#FAF6F0] flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-[#261B16] block">
                          Metadata Attribute Filtering
                        </span>
                        <span className="text-[11px] text-[#703D24]">
                          Match style, occasion, coverage
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={recSettings.enableMetadata}
                        onChange={(e) =>
                          setRecSettings((prev) => ({ ...prev, enableMetadata: e.target.checked }))
                        }
                        className="w-4 h-4 accent-[#B95945] rounded"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4 border-t border-[#EADBCE]">
                    <button
                      type="submit"
                      disabled={savingRec}
                      className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#4E2714] hover:bg-[#381A0E] rounded-xl shadow-xs transition-colors disabled:opacity-50"
                    >
                      {savingRec ? 'Saving Settings...' : 'Save Recommendation Settings'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

