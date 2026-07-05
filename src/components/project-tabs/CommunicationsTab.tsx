'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckCircle2, Eye, MessageSquare, Search, Send } from 'lucide-react';
import type { Communication, CommunicationType, EmailPreview, Project } from '@/types';
import { api } from '@/lib/api';
import { buildEmailPreview } from '@/lib/email';
import { useToast } from '@/components/common/Toast';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import EmptyState from '@/components/common/EmptyState';
import EmailPreviewModal from '@/components/modals/EmailPreviewModal';
import { cn, displayName, timeAgo } from '@/lib/utils';

const TYPE_OPTIONS: { value: CommunicationType; label: string }[] = [
  { value: 'status_update', label: 'Status Update' },
  { value: 'email', label: 'Email' },
  { value: 'dashboard_notification', label: 'Dashboard Notification' },
];

const TYPE_LABELS: Record<string, string> = {
  status_update: 'Status Update',
  email: 'Email',
  dashboard_notification: 'Notification',
  feasibility_sent: 'Feasibility Sent',
  floor_plan_sent: 'Floor Plan Sent',
};

interface Props {
  projectId: string;
  project: Project;
  communications: Communication[];
}

export default function CommunicationsTab({ projectId, project, communications }: Props) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<CommunicationType>('status_update');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const [sendTarget, setSendTarget] = useState<Communication | null>(null);
  const [preview, setPreview] = useState<EmailPreview | null>(null);
  const qc = useQueryClient();
  const { toast } = useToast();

  const createMut = useMutation({
    mutationFn: () =>
      api<Communication>(`/api/projects/${projectId}/communications`, {
        method: 'POST',
        body: JSON.stringify({ subject: subject.trim(), message: message.trim(), communication_type: type }),
      }),
    onSuccess: () => {
      toast('💬 Communication logged');
      setSubject('');
      setMessage('');
      qc.invalidateQueries({ queryKey: ['project', projectId] });
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Failed to post', 'error'),
  });

  const sendMut = useMutation({
    mutationFn: (communicationId: string) =>
      api<{ status: string; email_preview: EmailPreview }>(`/api/projects/${projectId}/communications/send-to-owner`, {
        method: 'POST',
        body: JSON.stringify({ communication_id: communicationId }),
      }),
    onSuccess: () => {
      toast('📧 Email preview sent (test mode) — logged to communications');
      setPreview(null);
      setSendTarget(null);
      qc.invalidateQueries({ queryKey: ['project', projectId] });
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Send failed', 'error'),
  });

  const openSendPreview = (c: Communication) => {
    setSendTarget(c);
    setPreview(
      buildEmailPreview({
        subject: c.subject ?? `${project.name} — Project Update`,
        projectName: project.name,
        location: project.property_location,
        updateType: TYPE_LABELS[c.communication_type] ?? 'Project Update',
        summary: c.message,
        productionRecipient: project.owner_email,
      }),
    );
  };

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = communications.filter(
      (c) =>
        !q ||
        (c.subject ?? '').toLowerCase().includes(q) ||
        c.message.toLowerCase().includes(q) ||
        c.sent_by_email.toLowerCase().includes(q),
    );
    list.sort((a, b) => {
      const cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sort === 'newest' ? -cmp : cmp;
    });
    return list;
  }, [communications, search, sort]);

  return (
    <div className="space-y-6">
      {/* Compose */}
      <div className="card p-5">
        <h3 className="font-heading font-bold text-sm mb-4 flex items-center gap-2">
          <MessageSquare size={15} className="text-secondary" aria-hidden /> New Communication
        </h3>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!subject.trim() || !message.trim()) {
              toast('Subject and message are required', 'error');
              return;
            }
            createMut.mutate();
          }}
        >
          <div className="grid gap-3 sm:grid-cols-[1fr,200px]">
            <Input label="Subject" placeholder="Design development update…" value={subject} onChange={(e) => setSubject(e.target.value)} />
            <div>
              <label htmlFor="comm-type" className="label">
                Type
              </label>
              <select id="comm-type" className="input" value={type} onChange={(e) => setType(e.target.value as CommunicationType)}>
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="comm-message" className="label">
              Message
            </label>
            <textarea
              id="comm-message"
              className="input min-h-[90px] resize-y"
              placeholder="Write the update…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" variant="secondary" loading={createMut.isPending}>
              Post Update
            </Button>
          </div>
        </form>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] sm:max-w-xs">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden />
          <input
            className="input pl-9"
            placeholder="Search communications…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search communications"
          />
        </div>
        <select
          aria-label="Sort communications"
          className="input !w-auto !py-2 text-xs ml-auto"
          value={sort}
          onChange={(e) => setSort(e.target.value as 'newest' | 'oldest')}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </div>

      {/* Timeline thread */}
      {visible.length === 0 ? (
        <EmptyState
          title="No communications yet"
          message="Post the first update above — then send it to the owner with a locked test-mode preview."
          icon={<MessageSquare size={26} />}
        />
      ) : (
        <ol className="relative border-l-2 border-gray-100 ml-3 sm:ml-4 space-y-5" aria-label="Communication timeline">
          {visible.map((c) => {
            const sent = c.sent_to_owner;
            return (
              <motion.li
                key={c.id}
                initial={{ opacity: 0, x: sent ? 28 : -28 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25 }}
                className="pl-6 relative"
              >
                <span
                  className={cn(
                    'absolute -left-[9px] top-2 w-4 h-4 rounded-full border-[3px] border-white shadow-sm',
                    sent ? 'bg-secondary' : 'bg-gray-300',
                  )}
                  aria-hidden
                />
                <div
                  className={cn(
                    'card p-4 sm:max-w-[92%]',
                    sent ? 'border-secondary/40 bg-secondary/[0.04] sm:ml-auto' : '',
                  )}
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="text-sm font-bold leading-snug">{c.subject ?? 'Update'}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {displayName(c.sent_by_email)} · {timeAgo(c.created_at)} ·{' '}
                        <span className="uppercase tracking-wide font-semibold">{TYPE_LABELS[c.communication_type] ?? c.communication_type}</span>
                      </p>
                    </div>
                    {sent ? (
                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        <span className="badge bg-secondary/10 text-secondary border-secondary/30">
                          <CheckCircle2 size={11} aria-hidden /> Sent to owner
                        </span>
                        {c.owner_read_at && (
                          <span className="badge bg-blue-50 text-blue-600 border-blue-200" title={`Read ${timeAgo(c.owner_read_at)}`}>
                            <Eye size={11} aria-hidden /> Read
                          </span>
                        )}
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        className="!py-1.5 !px-3 text-xs border border-gray-200 shrink-0"
                        onClick={() => openSendPreview(c)}
                      >
                        <Send size={12} /> Send to Owner
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed mt-2.5 whitespace-pre-line">{c.message}</p>
                </div>
              </motion.li>
            );
          })}
        </ol>
      )}

      <EmailPreviewModal
        open={!!preview}
        onClose={() => {
          setPreview(null);
          setSendTarget(null);
        }}
        preview={preview}
        onConfirm={() => {
          if (sendTarget) sendMut.mutate(sendTarget.id);
        }}
        confirmLoading={sendMut.isPending}
      />
    </div>
  );
}
