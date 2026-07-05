'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Sparkles } from 'lucide-react';
import Shell from '@/components/layout/Shell';
import Button from '@/components/common/Button';
import EmptyState from '@/components/common/EmptyState';
import { SkeletonGrid } from '@/components/common/Loading';
import { useToast } from '@/components/common/Toast';
import ProjectionsGrid from '@/components/projections/ProjectionsGrid';
import ProjectionRecipientsModal from '@/components/modals/ProjectionRecipientsModal';
import EmailPreviewModal from '@/components/modals/EmailPreviewModal';
import { useProjections } from '@/hooks/useProjections';
import { api } from '@/lib/api';
import { buildEmailPreview } from '@/lib/email';
import type { EmailPreview, Projection } from '@/types';

export default function ProjectionsPage() {
  const { data: projections, isLoading } = useProjections();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [sendTarget, setSendTarget] = useState<Projection | null>(null);
  const [recipients, setRecipients] = useState<string[]>([]);
  const [preview, setPreview] = useState<EmailPreview | null>(null);

  const generateMut = useMutation({
    mutationFn: () => api<{ status: string }>('/api/projections', { method: 'POST', body: JSON.stringify({}) }),
    onSuccess: () => {
      toast('✨ Projections refreshed across the portfolio');
      qc.invalidateQueries({ queryKey: ['projections'] });
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Generation failed', 'error'),
  });

  const sendMut = useMutation({
    mutationFn: () =>
      api<{ status: string; note?: string }>(`/api/projections/${sendTarget!.id}/send`, {
        method: 'POST',
        body: JSON.stringify({ recipient_emails: recipients }),
      }),
    onSuccess: (res) => {
      toast(`📧 Email preview sent (test mode) — ${res.note ?? 'logged to communications'}`, 'info');
      setPreview(null);
      setSendTarget(null);
      qc.invalidateQueries({ queryKey: ['projections'] });
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Send failed', 'error'),
  });

  const openPreview = (emails: string[]) => {
    if (!sendTarget) return;
    setRecipients(emails);
    const insights = (sendTarget.data.insights ?? []).slice(0, 2).join(' · ') || sendTarget.projection_title;
    setPreview(
      buildEmailPreview({
        subject: sendTarget.projection_title,
        projectName: 'Olive Living Portfolio',
        updateType: 'Projections Report',
        summary: insights,
      }),
    );
  };

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3 anim-fade-slide-up">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-primary">Automated Projections</h1>
            <p className="text-sm text-gray-500 mt-1">
              Timeline, budget, ROI and risk outlooks generated from live portfolio metrics.
            </p>
          </div>
          <Button variant="secondary" loading={generateMut.isPending} onClick={() => generateMut.mutate()}>
            {generateMut.isPending ? <RefreshCw size={15} className="animate-spin" /> : <Sparkles size={15} />}
            Generate Projections
          </Button>
        </div>

        {isLoading ? (
          <SkeletonGrid count={4} />
        ) : !projections || projections.length === 0 ? (
          <EmptyState
            title="No projections yet"
            message="Generate the first portfolio projections — timeline, budget, ROI and risk."
            actionLabel="Generate Projections"
            onAction={() => generateMut.mutate()}
          />
        ) : (
          <ProjectionsGrid projections={projections} refreshing={generateMut.isPending} onSend={setSendTarget} />
        )}
      </div>

      <ProjectionRecipientsModal
        open={!!sendTarget && !preview}
        onClose={() => setSendTarget(null)}
        projectionTitle={sendTarget?.projection_title ?? ''}
        onNext={openPreview}
      />
      <EmailPreviewModal
        open={!!preview}
        onClose={() => {
          setPreview(null);
          setSendTarget(null);
        }}
        preview={preview}
        onConfirm={() => sendMut.mutate()}
        confirmLoading={sendMut.isPending}
      />
    </Shell>
  );
}
