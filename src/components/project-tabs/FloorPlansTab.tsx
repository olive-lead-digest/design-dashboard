'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Box, CheckCircle2, History, Layers, Plus, Printer, Ruler, Send, Table2 } from 'lucide-react';
import type { EmailPreview, FloorPlan, Project } from '@/types';
import type { PlanLayout } from '@/lib/floorplan';
import type { Model3D } from '@/components/viewers/FloorPlan3DViewer';
import { api } from '@/lib/api';
import { buildEmailPreview } from '@/lib/email';
import { useToast } from '@/components/common/Toast';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Modal from '@/components/common/Modal';
import EmptyState from '@/components/common/EmptyState';
import { PageLoader } from '@/components/common/Loading';
import EmailPreviewModal from '@/components/modals/EmailPreviewModal';
import FloorPlan2DViewer from '@/components/viewers/FloorPlan2DViewer';
import { cn, formatDate, timeAgo } from '@/lib/utils';

const FloorPlan3DViewer = dynamic(() => import('@/components/viewers/FloorPlan3DViewer'), {
  ssr: false,
  loading: () => <PageLoader label="Loading 3D engine…" />,
});

interface PlanDetail {
  plan: FloorPlan;
  layout: PlanLayout;
  svg: string;
  model3d: Model3D;
}

const DESIGN_TYPES = ['Residential', 'Commercial', 'Co-living', 'Renovation'] as const;
type SubTab = '2d' | '3d' | 'dims';

interface Props {
  projectId: string;
  project: Project;
  plans: FloorPlan[];
}

export default function FloorPlansTab({ projectId, project, plans }: Props) {
  const sorted = [...plans].sort((a, b) => a.plan_version - b.plan_version);
  const latest = sorted[sorted.length - 1];
  const [selectedId, setSelectedId] = useState<string | null>(latest?.id ?? null);
  const [subTab, setSubTab] = useState<SubTab>('2d');
  const [generateOpen, setGenerateOpen] = useState(false);
  const [preview, setPreview] = useState<EmailPreview | null>(null);
  const qc = useQueryClient();
  const { toast } = useToast();

  // Keep a valid selection when plans list changes
  useEffect(() => {
    if (sorted.length > 0 && !sorted.some((p) => p.id === selectedId)) {
      setSelectedId(sorted[sorted.length - 1].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plans.length]);

  const detail = useQuery({
    queryKey: ['floor-plan', projectId, selectedId],
    enabled: !!selectedId,
    queryFn: () => api<PlanDetail>(`/api/projects/${projectId}/floor-plans/${selectedId}`),
  });

  const selectedPlan = sorted.find((p) => p.id === selectedId) ?? null;

  const sendMut = useMutation({
    mutationFn: () =>
      api<{ status: string; email_preview: EmailPreview }>(
        `/api/projects/${projectId}/floor-plans/${selectedId}/send-to-owner`,
        { method: 'POST', body: JSON.stringify({}) },
      ),
    onSuccess: () => {
      toast('📧 Email preview sent (test mode) — logged to communications');
      setPreview(null);
      qc.invalidateQueries({ queryKey: ['project', projectId] });
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Send failed', 'error'),
  });

  const exportMut = useMutation({
    mutationFn: () =>
      api<{ pdf_url: string; download_link: string; note: string }>(
        `/api/projects/${projectId}/floor-plans/${selectedId}/export-pdf`,
        { method: 'POST', body: JSON.stringify({}) },
      ),
    onSuccess: (res) => {
      toast(res.note || '🖨 Export prepared — use your browser dialog to save as PDF', 'info');
      setTimeout(() => window.print(), 400);
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Export failed', 'error'),
  });

  const openSendPreview = () => {
    if (!selectedPlan) return;
    const roomCount = selectedPlan.dimensions_json?.rooms.length ?? 0;
    setPreview(
      buildEmailPreview({
        subject: `Your ${project.name} — Floor Plan V${selectedPlan.plan_version} Ready`,
        projectName: project.name,
        location: project.property_location,
        updateType: `Floor Plan V${selectedPlan.plan_version}`,
        summary:
          selectedPlan.design_notes ??
          `Version ${selectedPlan.plan_version}: ${selectedPlan.dimensions_json?.total_sqft ?? '—'} sqft across ${roomCount} rooms. Interactive 2D/3D views are live on your dashboard.`,
        productionRecipient: project.owner_email,
      }),
    );
  };

  if (plans.length === 0) {
    return (
      <>
        <EmptyState
          title="No floor plans yet"
          message="Generate the first version — 2D and 3D views are created instantly from property dimensions."
          actionLabel="Generate Floor Plan"
          onAction={() => setGenerateOpen(true)}
          icon={<Ruler size={26} />}
        />
        <GeneratePlanModal
          open={generateOpen}
          onClose={() => setGenerateOpen(false)}
          projectId={projectId}
          onGenerated={(plan) => setSelectedId(plan.id)}
        />
      </>
    );
  }

  return (
    <div className="space-y-4">
      {/* Version chips + actions */}
      <div className="card p-4 flex items-center gap-3 flex-wrap">
        <div className="flex gap-1.5 flex-wrap" role="group" aria-label="Plan versions">
          {sorted.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              aria-pressed={selectedId === p.id}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors',
                selectedId === p.id
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300',
              )}
            >
              V{p.plan_version}
              {p.sent_to_owner_at && <span className="ml-1 text-secondary" aria-label="Sent to owner">✓</span>}
            </button>
          ))}
        </div>
        <div className="flex gap-2 ml-auto flex-wrap">
          <Button variant="ghost" className="!py-2 text-xs border border-gray-200" onClick={() => setGenerateOpen(true)}>
            <Plus size={13} /> Generate New Version
          </Button>
          <Button variant="secondary" className="!py-2 text-xs" onClick={openSendPreview} disabled={!selectedPlan}>
            <Send size={13} /> Send to Owner
          </Button>
          <Button
            variant="ghost"
            className="!py-2 text-xs border border-gray-200"
            onClick={() => exportMut.mutate()}
            loading={exportMut.isPending}
            disabled={!selectedId}
          >
            <Printer size={13} /> Export PDF
          </Button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 border-b border-gray-200" role="tablist" aria-label="Plan views">
        {(
          [
            { id: '2d', label: '2D Plan', icon: <Layers size={14} aria-hidden /> },
            { id: '3d', label: '3D Model', icon: <Box size={14} aria-hidden /> },
            { id: 'dims', label: 'Dimensions', icon: <Table2 size={14} aria-hidden /> },
          ] as { id: SubTab; label: string; icon: React.ReactNode }[]
        ).map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={subTab === t.id}
            onClick={() => setSubTab(t.id)}
            className={cn(
              'relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors',
              subTab === t.id ? 'text-secondary' : 'text-gray-500 hover:text-ink',
            )}
          >
            {t.icon}
            {t.label}
            {subTab === t.id && (
              <motion.span layoutId="plan-subtab" className="absolute inset-x-2 -bottom-px h-0.5 bg-secondary rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Viewer area */}
      {detail.isLoading ? (
        <PageLoader label="Loading plan…" />
      ) : detail.isError || !detail.data ? (
        <EmptyState title="Couldn't load this plan" actionLabel="Retry" onAction={() => detail.refetch()} />
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={subTab + (selectedId ?? '')}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {subTab === '2d' && (
              <FloorPlan2DViewer
                svg={detail.data.svg}
                fileName={`${project.name.toLowerCase().replace(/\s+/g, '-')}-v${detail.data.plan.plan_version}.svg`}
              />
            )}
            {subTab === '3d' && <FloorPlan3DViewer model={detail.data.model3d} />}
            {subTab === 'dims' && <DimensionsPanel plan={detail.data.plan} />}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Version history mini-timeline */}
      <div className="card p-5">
        <h4 className="font-heading font-bold text-sm mb-4 flex items-center gap-2">
          <History size={15} className="text-gray-400" aria-hidden /> Version History
        </h4>
        <ol className="relative border-l-2 border-gray-100 ml-2 space-y-4">
          {[...sorted].reverse().map((p) => (
            <li key={p.id} className="pl-5 relative">
              <span
                className={cn(
                  'absolute -left-[7px] top-1 w-3 h-3 rounded-full border-2 border-white',
                  p.id === selectedId ? 'bg-secondary' : 'bg-gray-300',
                )}
                aria-hidden
              />
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedId(p.id)}
                  className="text-sm font-bold text-primary hover:text-secondary transition-colors"
                >
                  Version {p.plan_version}
                </button>
                <span className="text-[11px] text-gray-400">{formatDate(p.created_at)} · {timeAgo(p.created_at)}</span>
                {p.sent_to_owner_at && (
                  <span className="badge bg-secondary/10 text-secondary border-secondary/30 !text-[10px]">
                    <CheckCircle2 size={10} aria-hidden /> Sent to owner
                  </span>
                )}
              </div>
              {p.design_notes && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{p.design_notes}</p>}
            </li>
          ))}
        </ol>
      </div>

      <GeneratePlanModal
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
        projectId={projectId}
        onGenerated={(plan) => setSelectedId(plan.id)}
      />
      <EmailPreviewModal
        open={!!preview}
        onClose={() => setPreview(null)}
        preview={preview}
        onConfirm={() => sendMut.mutate()}
        confirmLoading={sendMut.isPending}
      />
    </div>
  );
}

/* ================= Dimensions ================= */

function DimensionsPanel({ plan }: { plan: FloorPlan }) {
  const rooms = plan.dimensions_json?.rooms ?? [];
  const materials = plan.materials_json ?? {};
  return (
    <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[420px]">
          <thead className="border-b border-gray-100 bg-gray-50/60">
            <tr className="text-left text-[11px] font-bold uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3">Room</th>
              <th className="px-4 py-3 text-right">Dimensions (ft)</th>
              <th className="px-4 py-3 text-right">Area</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((r) => (
              <tr key={r.name} className="border-b border-gray-50 last:border-0">
                <td className="px-4 py-3 font-medium">{r.name}</td>
                <td className="px-4 py-3 text-right text-gray-600 font-mono text-xs">{r.dimensions}</td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums">{r.sqft.toLocaleString('en-IN')} sqft</td>
              </tr>
            ))}
            <tr className="bg-gray-50/60">
              <td className="px-4 py-3.5 font-bold text-primary">Total</td>
              <td />
              <td className="px-4 py-3.5 text-right font-bold text-primary tabular-nums">
                {(plan.dimensions_json?.total_sqft ?? 0).toLocaleString('en-IN')} sqft
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="card p-5">
        <h4 className="font-heading font-bold text-sm mb-3">Materials</h4>
        {Object.keys(materials).length === 0 ? (
          <p className="text-sm text-gray-400">No materials specified</p>
        ) : (
          <ul className="space-y-3">
            {Object.entries(materials).map(([key, value]) => (
              <li key={key}>
                <p className="label !mb-0.5">{key}</p>
                <p className="text-sm text-gray-600 leading-snug">{value}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ================= Generate modal ================= */

function GeneratePlanModal({
  open,
  onClose,
  projectId,
  onGenerated,
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
  onGenerated: (plan: FloorPlan) => void;
}) {
  const [widthFt, setWidthFt] = useState('80');
  const [depthFt, setDepthFt] = useState('60');
  const [rooms, setRooms] = useState('6');
  const [designType, setDesignType] = useState<string>('Residential');
  const qc = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: () =>
      api<{ status: string; plan: FloorPlan }>(`/api/projects/${projectId}/floor-plans`, {
        method: 'POST',
        body: JSON.stringify({
          property_dimensions: { widthFt: Number(widthFt) || 60, depthFt: Number(depthFt) || 40 },
          number_of_rooms: Number(rooms) || 6,
          design_type: designType,
        }),
      }),
    onSuccess: (res) => {
      toast(`🏗️ Floor plan V${res.plan.plan_version} generated`);
      qc.invalidateQueries({ queryKey: ['project', projectId] });
      onGenerated(res.plan);
      onClose();
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Generation failed', 'error'),
  });

  return (
    <Modal open={open} onClose={onClose} title="Generate Floor Plan">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        <p className="text-xs text-gray-500 -mt-1">
          A new version is generated instantly with architectural 2D + interactive 3D views. $0 — no external services.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Width (ft)" type="number" min={30} max={300} value={widthFt} onChange={(e) => setWidthFt(e.target.value)} />
          <Input label="Depth (ft)" type="number" min={20} max={300} value={depthFt} onChange={(e) => setDepthFt(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Number of Rooms" type="number" min={3} max={9} value={rooms} onChange={(e) => setRooms(e.target.value)} />
          <div>
            <label htmlFor="design-type" className="label">
              Design Type
            </label>
            <select id="design-type" className="input" value={designType} onChange={(e) => setDesignType(e.target.value)}>
              {DESIGN_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="secondary" loading={mutation.isPending}>
            <Ruler size={15} /> Generate
          </Button>
        </div>
      </form>
    </Modal>
  );
}
