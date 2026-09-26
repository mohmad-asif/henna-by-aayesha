'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { UserProfileDetails, AiConversation } from '@/types/ai-chat';
import { WhatsAppIcon } from '@/components/ui/icons';

interface UserProfilePanelProps {
  profile?: UserProfileDetails | null;
  conversation: AiConversation;
  isOpen: boolean;
  onClose: () => void;
}

export function UserProfilePanel({
  profile,
  conversation,
  isOpen,
  onClose,
}: UserProfilePanelProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showIpHistory, setShowIpHistory] = useState<boolean>(true);
  const [showUserAgent, setShowUserAgent] = useState<boolean>(false);

  // Close drawer on Escape key
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleCopy = (key: string, value?: string | null) => {
    if (!value || value === 'Not available') return;
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((curr) => (curr === key ? null : curr));
    }, 2000);
  };

  const formatDateTime = (isoString?: string | null) => {
    if (!isoString) return 'Not available';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return 'Not available';
      return date.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Not available';
    }
  };

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return 'Not available';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return 'Not available';
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return 'Not available';
    }
  };

  if (!isOpen) return null;

  const displayName = profile?.full_name || conversation.user_name || 'Not available';
  const displayEmail = profile?.email || conversation.user_email || 'Not available';
  const displayPhone = profile?.phone || 'Not available';
  const displayUsername = profile?.username || 'Not available';
  const displayUserId = profile?.user_id || conversation.user_id || 'Not available';
  const displayVisitorId = profile?.visitor_id || conversation.visitor_id || 'Not available';
  const displayRole = profile?.role || (profile?.is_authenticated ? 'Authenticated User' : 'Website Visitor');
  const currentIp = profile?.current_ip || 'Not available';

  const avatarInitial = (
    displayName !== 'Not available'
      ? displayName
      : displayEmail !== 'Not available'
      ? displayEmail
      : 'V'
  )
    .charAt(0)
    .toUpperCase();

  return (
    <>
      {/* Mobile Backdrop (< xl screens) */}
      <div
        className="fixed inset-0 bg-black/40 z-40 backdrop-blur-xs xl:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main Profile Panel Container */}
      <aside
        className={`w-full max-w-full sm:w-[380px] xl:w-[370px] 2xl:w-[410px] flex-shrink-0 flex flex-col bg-white border-l border-[#E5D9CE] z-50 xl:z-20 h-full overflow-hidden transition-all duration-200 ${
          /* On smaller screens, act as a fixed drawer. On large screens, act as an in-flow panel */
          'fixed inset-y-0 right-0 xl:static shadow-2xl xl:shadow-none'
        }`}
      >
        {/* Panel Header */}
        <div className="px-5 py-3.5 border-b border-[#E5D9CE] bg-[#FDFBF7] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-base">👤</span>
            <div>
              <h2 className="font-serif-heading font-bold text-sm text-[#261B16]">
                User Profile &amp; Tracking
              </h2>
              <p className="text-[11px] text-[#786052]">
                Verified database &amp; tracking records
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg border border-[#E5D9CE] flex items-center justify-center text-xs text-[#786052] hover:text-[#261B16] hover:bg-[#F7F4EF] transition-colors cursor-pointer"
            title="Close profile panel"
            aria-label="Close profile panel"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs text-[#261B16]">
          {/* 1. Profile Hero Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FAF3EE] via-[#FCF9F4] to-[#F5ECE3] border border-[#EADBCE] shadow-xs space-y-3">
            <div className="flex items-center gap-3">
              {profile?.avatar_url ? (
                <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-[#4E2714] flex-shrink-0 shadow-xs">
                  <Image
                    src={profile.avatar_url}
                    alt={displayName}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-full bg-[#4E2714] text-[#C29B4D] flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-xs border-2 border-[#FAF3EE]">
                  {avatarInitial}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="font-serif-heading font-bold text-base text-[#261B16] truncate">
                    {displayName}
                  </h3>
                </div>

                <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      profile?.is_authenticated
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-[#F2E8DC] text-[#786052] border border-[#E5D9CE]'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        profile?.is_authenticated ? 'bg-emerald-600' : 'bg-[#A39184]'
                      }`}
                    />
                    {displayRole}
                  </span>

                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold capitalize ${
                      conversation.status === 'resolved'
                        ? 'bg-emerald-50 text-emerald-700'
                        : conversation.status === 'closed'
                        ? 'bg-gray-100 text-gray-700'
                        : conversation.status === 'archived'
                        ? 'bg-stone-100 text-stone-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    Chat: {conversation.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Email & Phone Summary */}
            <div className="pt-2 border-t border-[#E8D9CD]/70 space-y-1 text-[11px]">
              <div className="flex items-center justify-between text-[#786052]">
                <span>Email:</span>
                <span className="font-medium text-[#261B16] truncate max-w-[200px]" title={displayEmail}>
                  {displayEmail}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#786052]">
                <span>Phone:</span>
                <span className="font-medium text-[#261B16]">
                  {displayPhone}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Core Identity Details */}
          <section className="space-y-2.5">
            <div className="flex items-center justify-between border-b border-[#F0E5D8] pb-1.5">
              <h4 className="text-[11px] uppercase tracking-wider font-bold text-[#B95945] flex items-center gap-1.5">
                <span>🪪</span>
                <span>Account Identity</span>
              </h4>
              {profile?.is_authenticated && (
                <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  auth.users linked
                </span>
              )}
            </div>

            <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#EADBCE] space-y-2">
              <ProfileField
                label="Full Name"
                value={displayName}
              />
              <ProfileField
                label="Email"
                value={displayEmail}
                copyable
                onCopy={() => handleCopy('email', displayEmail)}
                isCopied={copiedKey === 'email'}
              />
              <ProfileField
                label="Phone Number"
                value={displayPhone}
                copyable={displayPhone !== 'Not available'}
                onCopy={() => handleCopy('phone', displayPhone)}
                isCopied={copiedKey === 'phone'}
                actionNode={
                  displayPhone !== 'Not available' ? (
                    <a
                      href={`https://wa.me/${displayPhone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-emerald-700 hover:underline flex items-center gap-1 ml-1"
                      title="Open WhatsApp chat"
                    >
                      <WhatsAppIcon size={12} className="text-[#25D366]" />
                      <span>WhatsApp</span>
                    </a>
                  ) : null
                }
              />
              <ProfileField
                label="Username"
                value={displayUsername}
              />
              <ProfileField
                label="User ID"
                value={displayUserId}
                mono
                copyable={displayUserId !== 'Not available'}
                onCopy={() => handleCopy('userId', displayUserId)}
                isCopied={copiedKey === 'userId'}
              />
              <ProfileField
                label="Visitor ID"
                value={displayVisitorId}
                mono
                copyable={displayVisitorId !== 'Not available'}
                onCopy={() => handleCopy('visitorId', displayVisitorId)}
                isCopied={copiedKey === 'visitorId'}
              />
              <ProfileField
                label="Account Created"
                value={formatDate(profile?.created_at)}
              />
              <ProfileField
                label="Last Active"
                value={formatDateTime(profile?.last_active_at)}
              />
              {profile?.last_sign_in_at && (
                <ProfileField
                  label="Last Sign-in"
                  value={formatDateTime(profile.last_sign_in_at)}
                />
              )}
            </div>
          </section>

          {/* 3. IP Address & Network Tracking */}
          <section className="space-y-2.5">
            <div className="flex items-center justify-between border-b border-[#F0E5D8] pb-1.5">
              <h4 className="text-[11px] uppercase tracking-wider font-bold text-[#B95945] flex items-center gap-1.5">
                <span>🌐</span>
                <span>Network &amp; IP Tracking</span>
              </h4>
              <span className="text-[10px] text-[#847269]">
                Live visitor telemetry
              </span>
            </div>

            {/* Current / Latest IP Highlight Box */}
            <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#D6C1AF] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#58463D]">
                  Current / Latest IP Address
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EAFBF0] text-[#1EBE5D] border border-[#D0F4DE]">
                  Active IP
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <span
                  className={`font-mono text-sm font-bold ${
                    currentIp !== 'Not available' ? 'text-[#261B16]' : 'text-[#847269]'
                  }`}
                >
                  {currentIp}
                </span>

                {currentIp !== 'Not available' && (
                  <button
                    onClick={() => handleCopy('currentIp', currentIp)}
                    className="px-2 py-1 rounded-md text-[11px] border border-[#D6C1AF] bg-white text-[#4E2714] hover:bg-[#F7F4EF] hover:border-[#B95945] transition-colors cursor-pointer"
                  >
                    {copiedKey === 'currentIp' ? '✓ Copied' : '📋 Copy'}
                  </button>
                )}
              </div>
            </div>

            {/* IP History Section */}
            {profile?.ip_history && profile.ip_history.length > 0 ? (
              <div className="border border-[#EADBCE] rounded-xl overflow-hidden bg-white">
                <button
                  type="button"
                  onClick={() => setShowIpHistory((v) => !v)}
                  className="w-full px-3 py-2 bg-[#FBF9F5] border-b border-[#EADBCE] flex items-center justify-between text-left cursor-pointer hover:bg-[#F5EFE6] transition-colors"
                >
                  <span className="font-semibold text-[11px] text-[#4E2714]">
                    IP History ({profile.ip_history.length}{' '}
                    {profile.ip_history.length === 1 ? 'address' : 'addresses'})
                  </span>
                  <span className="text-[10px] text-[#847269]">
                    {showIpHistory ? '▲ Hide' : '▼ View History'}
                  </span>
                </button>

                {showIpHistory && (
                  <div className="divide-y divide-[#F0E5D8] max-h-48 overflow-y-auto">
                    {profile.ip_history.map((record, idx) => (
                      <div
                        key={`${record.ip}-${idx}`}
                        className="p-2.5 hover:bg-[#FAF8F5] transition-colors space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] font-semibold text-[#261B16]">
                            {record.ip}
                          </span>
                          <span className="text-[10px] text-[#786052]">
                            {record.session_count || 1}{' '}
                            {(record.session_count || 1) === 1 ? 'session' : 'sessions'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-[#847269]">
                          <span>
                            {record.device_type ? `${record.device_type} • ` : ''}
                            {record.browser || 'Unknown browser'}
                          </span>
                          <span>{formatDate(record.last_seen)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EADBCE] text-[11px] text-[#847269]">
                <span>IP History: </span>
                <span className="font-medium text-[#261B16]">Not available</span>
              </div>
            )}
          </section>

          {/* 4. Geolocation Information */}
          <section className="space-y-2.5">
            <div className="flex items-center justify-between border-b border-[#F0E5D8] pb-1.5">
              <h4 className="text-[11px] uppercase tracking-wider font-bold text-[#B95945] flex items-center gap-1.5">
                <span>📍</span>
                <span>Location Telemetry</span>
              </h4>
            </div>

            <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#EADBCE] space-y-2">
              <ProfileField
                label="City"
                value={profile?.city || 'Not available'}
              />
              <ProfileField
                label="State / Region"
                value={profile?.region || 'Not available'}
              />
              <ProfileField
                label="Country"
                value={profile?.country || 'Not available'}
              />
              <ProfileField
                label="Full Location"
                value={profile?.location_display || 'Not available'}
              />
              <ProfileField
                label="Timezone"
                value={profile?.timezone || 'Not available'}
              />
            </div>
          </section>

          {/* 5. Device & Technology Environment */}
          <section className="space-y-2.5">
            <div className="flex items-center justify-between border-b border-[#F0E5D8] pb-1.5">
              <h4 className="text-[11px] uppercase tracking-wider font-bold text-[#B95945] flex items-center gap-1.5">
                <span>💻</span>
                <span>Device &amp; Environment</span>
              </h4>
            </div>

            <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#EADBCE] space-y-2">
              <ProfileField
                label="Device Type"
                value={
                  profile?.device_type ? (
                    <span className="inline-flex items-center gap-1 capitalize">
                      {profile.device_type === 'mobile' ? '📱' : '💻'}
                      {profile.device_type}
                    </span>
                  ) : (
                    'Not available'
                  )
                }
              />
              <ProfileField
                label="Browser"
                value={profile?.browser || 'Not available'}
              />
              <ProfileField
                label="Operating System"
                value={profile?.os || 'Not available'}
              />
              <ProfileField
                label="Screen Resolution"
                value={profile?.screen_size || 'Not available'}
              />
              <ProfileField
                label="Language"
                value={profile?.language || 'Not available'}
              />

              {/* User Agent Drawer / Box */}
              <div className="pt-1.5 border-t border-[#EADBCE]/70">
                <button
                  type="button"
                  onClick={() => setShowUserAgent((v) => !v)}
                  className="w-full text-left flex items-center justify-between text-[11px] font-semibold text-[#786052] hover:text-[#261B16] cursor-pointer"
                >
                  <span>User Agent String</span>
                  <span className="text-[10px] text-[#A39184]">
                    {showUserAgent ? '▲ Hide' : '▼ View'}
                  </span>
                </button>

                {showUserAgent && (
                  <div className="mt-1.5 p-2 rounded-lg bg-white border border-[#EADBCE] font-mono text-[10px] text-[#4E2714] break-all leading-relaxed">
                    {profile?.user_agent || 'Not available'}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* 6. AI Activity & Engagement Statistics */}
          <section className="space-y-2.5">
            <div className="flex items-center justify-between border-b border-[#F0E5D8] pb-1.5">
              <h4 className="text-[11px] uppercase tracking-wider font-bold text-[#B95945] flex items-center gap-1.5">
                <span>🤖</span>
                <span>AI Engagement</span>
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EADBCE] text-center">
                <span className="text-xl font-bold font-serif-heading text-[#4E2714] block">
                  {profile?.total_ai_conversations ?? 1}
                </span>
                <span className="text-[10px] text-[#786052] block uppercase tracking-wider mt-0.5">
                  Total Chats
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EADBCE] text-center">
                <span className="text-xl font-bold font-serif-heading text-[#B95945] block">
                  {profile?.total_ai_messages ?? conversation.message_count ?? 0}
                </span>
                <span className="text-[10px] text-[#786052] block uppercase tracking-wider mt-0.5">
                  Total Messages
                </span>
              </div>
            </div>

            <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#EADBCE] space-y-2">
              <ProfileField
                label="Latest AI Chat"
                value={formatDateTime(profile?.latest_ai_conversation_at || conversation.last_message_at)}
              />
              <ProfileField
                label="Chat Status"
                value={
                  <span className="capitalize font-semibold text-[#4E2714]">
                    {conversation.status}
                  </span>
                }
              />
              <ProfileField
                label="Conversation ID"
                value={conversation.id}
                mono
                copyable
                onCopy={() => handleCopy('convId', conversation.id)}
                isCopied={copiedKey === 'convId'}
              />
            </div>
          </section>

          {/* 7. Visitor Tracking History */}
          {(profile?.visit_count != null || profile?.landing_page || profile?.initial_source) && (
            <section className="space-y-2.5 pb-4">
              <div className="flex items-center justify-between border-b border-[#F0E5D8] pb-1.5">
                <h4 className="text-[11px] uppercase tracking-wider font-bold text-[#B95945] flex items-center gap-1.5">
                  <span>📊</span>
                  <span>Session History</span>
                </h4>
              </div>

              <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#EADBCE] space-y-2">
                <ProfileField
                  label="Total Visits"
                  value={profile?.visit_count != null ? String(profile.visit_count) : 'Not available'}
                />
                <ProfileField
                  label="Total Page Views"
                  value={profile?.page_views_count != null ? String(profile.page_views_count) : 'Not available'}
                />
                <ProfileField
                  label="Landing Page"
                  value={profile?.landing_page || 'Not available'}
                />
                <ProfileField
                  label="Last Visited Page"
                  value={profile?.last_page || 'Not available'}
                />
                <ProfileField
                  label="Acquisition Source"
                  value={profile?.initial_source || profile?.initial_referrer || 'Not available'}
                />
              </div>
            </section>
          )}
        </div>
      </aside>
    </>
  );
}

interface ProfileFieldProps {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  copyable?: boolean;
  onCopy?: () => void;
  isCopied?: boolean;
  actionNode?: React.ReactNode;
}

function ProfileField({
  label,
  value,
  mono = false,
  copyable = false,
  onCopy,
  isCopied = false,
  actionNode,
}: ProfileFieldProps) {
  const isString = typeof value === 'string';
  const isAvailable = !isString || (value !== 'Not available' && value.trim().length > 0);

  return (
    <div className="flex items-start justify-between gap-2 py-1 text-[11px]">
      <span className="text-[#786052] font-medium flex-shrink-0">{label}:</span>
      <div className="flex items-center gap-1.5 text-right min-w-0 flex-wrap justify-end">
        <span
          className={`break-all [overflow-wrap:anywhere] ${mono ? 'font-mono text-[10px]' : ''} ${
            isAvailable ? 'text-[#261B16] font-semibold' : 'text-[#A39184] font-normal italic'
          }`}
        >
          {value}
        </span>
        {actionNode}
        {copyable && isAvailable && (
          <button
            type="button"
            onClick={onCopy}
            className="p-1 text-[10px] text-[#786052] hover:text-[#B95945] rounded hover:bg-[#F2E8DC] transition-colors cursor-pointer"
            title="Copy to clipboard"
            aria-label={`Copy ${label}`}
          >
            {isCopied ? '✓' : '📋'}
          </button>
        )}
      </div>
    </div>
  );
}
