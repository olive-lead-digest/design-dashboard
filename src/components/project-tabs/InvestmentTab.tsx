'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, CircleDollarSign, Pencil, Plus, Printer, Target, Trash2 } from 'lucide-react';
import type { InvestmentRequirement, PaymentPhase } from '@/types';
import { api } from '@/lib/api';
import { useToast } from '@/components/common/Toast';
import { useCountUp } from '@/hooks/useCountUp';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Modal from '@/components/common/Modal';
import EmptyState from '@/components/common/EmptyState';
import CostBreakdownChart from '@/components/charts/CostBreakdownChart';
import { cn, formatDate, formatINR, percent } from '@/lib/utils';

interface Props {
  projectId: string;
  investment: InvestmentRequirement | null;
}

export default function InvestmentTab({ projectId, investment }: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();
  const animatedTotal = useCountUp(investment?.total_investment ?? 0, 1100);

  const approvalMut = useMutation({
    mutationFn: (approve: boolean) =>
      api<{ status: string }>(`/api/projects/${projectId}/investment/owner-approval`, {
        method: 'POST',
        body: JSON.stringify({ owner_approval: approve }),
      }),
    onSuccess: (_res, approve) => {
      toast(approve ? '✅ Marked as approved by owner' : 'Owner approval withdrawn', approve ? 'success' : 'info');
      qc.invalidateQueries({ queryKey: ['project', projectId] });
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Update failed', 'error'),
  });

  if (!investment) {
    return (
      <>
        <EmptyState
          title="Investment not set up yet"
          message="Define the total requirement, cost breakdown, ROI and payment schedule."
          actionLabel="Set Up Investment"
          onAction={() => setEditOpen(true)}
          icon={<CircleDollarSign size={26} />}
        />
        <InvestmentEditModal open={editOpen} onClose={() => setEditOpen(false)} projectId={projectId} investment={null} />
      </>
    );
  }

  const breakdown = investment.breakdown;
  const rows = breakdown
    ? ([
        ['Land', breakdown.land],
        ['Construction', breakdown.construction],
        ['Design', breakdown.design],
        ['Contingency', breakdown.contingency],
      ] as const)
    : [];

  return (
    <div className="space-y-5">
      {/* Summary row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="label">Total Investment Required</p>
              <p className="text-4xl sm:text-5xl font-heading font-bold text-primary tabular-nums leading-tight">
                {formatINR(Math.round(animatedTotal))}
              </p>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className="badge bg-gray-50 text-gray-500 border-gray-200 font-mono">{investment.currency}</span>
                {investment.approved_by_owner && (
                  <span className="badge bg-success/10 text-success border-success/30">
                    <BadgeCheck size={12} aria-hidden /> Approved by owner
                  </span>
                )}
                <span className="text-[11px] text-gray-400">Updated {formatDate(investment.updated_at)}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" className="!py-2 text-xs border border-gray-200" onClick={() => setEditOpen(true)}>
                <Pencil size={13} /> Edit
              </Button>
              <Button
                variant="ghost"
                className="!py-2 text-xs border border-gray-200"
                onClick={() => {
                  toast('🖨 Use your browser dialog to save as PDF', 'info');
                  setTimeout(() => window.print(), 350);
                }}
              >
                <Printer size={13} /> Download
              </Button>
            </div>
          </div>

          {/* Owner approval toggle */}
          <div className="flex items-center justify-between mt-6 rounded-xl border border-gray-100 bg-gray-50/70 px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Owner Approval</p>
              <p className="text-[11px] text-gray-400">Track whether the owner has signed off on this requirement</p>
            </div>
            <button
              role="switch"
              aria-checked={investment.approved_by_owner}
              aria-label="Toggle owner approval"
              disabled={approvalMut.isPending}
              onClick={() => approvalMut.mutate(!investment.approved_by_owner)}
              className={cn(
                'relative w-12 h-7 rounded-full transition-colors duration-200 shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary',
                investment.approved_by_owner ? 'bg-success' : 'bg-gray-300',
              )}
            >
              <span
                className={cn(
                  'absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all duration-200',
                  investment.approved_by_owner ? 'left-6' : 'left-1',
                )}
                aria-hidden
              />
            </button>
          </div>
        </div>

        {/* ROI card */}
        <div className="card p-6 flex flex-col items-center justify-center text-center">
          <span className="w-11 h-11 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-3">
            <Target size={20} aria-hidden />
          </span>
          <p className="label">Estimated ROI</p>
          <p className="text-5xl font-heading font-bold text-primary tabular-nums">
            {investment.estimated_roi_percent ?? '—'}
            <span className="text-xl text-gray-400">%</span>
          </p>
          <p className="text-[11px] text-gray-400 mt-2">Calculation basis: project pro-forma</p>
        </div>
      </div>

      {/* Breakdown */}
      {breakdown && breakdown.total > 0 && (
        <div className="card p-6">
          <h3 className="font-heading font-bold text-sm mb-4">Cost Breakdown</h3>
          <div className="grid gap-6 md:grid-cols-2 items-center">
            <CostBreakdownChart breakdown={breakdown} />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] font-bold uppercase tracking-wide text-gray-500 border-b border-gray-100">
                    <th className="py-2">Component</th>
                    <th className="py-2 text-right">Amount</th>
                    <th className="py-2 text-right">% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(([label, value]) => (
                    <tr key={label} className="border-b border-gray-50 last:border-0">
                      <td className="py-2.5 text-gray-600">{label}</td>
                      <td className="py-2.5 text-right font-semibold tabular-nums">{formatINR(value)}</td>
                      <td className="py-2.5 text-right text-gray-500 tabular-nums">{percent(value, breakdown.total)}%</td>
                    </tr>
                  ))}
                  <tr>
                    <td className="py-3 font-bold text-primary">Total</td>
                    <td className="py-3 text-right font-bold text-primary tabular-nums">{formatINR(breakdown.total)}</td>
                    <td className="py-3 text-right font-bold text-primary tabular-nums">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Payment schedule */}
      <div className="card p-6">
        <h3 className="font-heading font-bold text-sm mb-4">Payment Schedule</h3>
        {investment.payment_schedule.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No payment phases defined yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[420px]">
              <thead>
                <tr className="text-left text-[11px] font-bold uppercase tracking-wide text-gray-500 border-b border-gray-100">
                  <th className="py-2">Phase</th>
                  <th className="py-2 text-right">Amount</th>
                  <th className="py-2 text-right">Date</th>
                  <th className="py-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {investment.payment_schedule.map((p, i) => {
                  const past = new Date(p.date).getTime() < Date.now();
                  return (
                    <tr key={`${p.phase}-${i}`} className={cn('border-b border-gray-50 last:border-0', past && 'opacity-50')}>
                      <td className="py-3 font-medium">{p.phase}</td>
                      <td className="py-3 text-right font-semibold tabular-nums">{formatINR(p.amount)}</td>
                      <td className="py-3 text-right text-gray-600">{formatDate(p.date)}</td>
                      <td className="py-3 text-right">
                        <span className={cn('badge', past ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-accent/10 text-accent border-accent/30')}>
                          {past ? 'Past' : 'Upcoming'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <InvestmentEditModal open={editOpen} onClose={() => setEditOpen(false)} projectId={projectId} investment={investment} />
    </div>
  );
}

/* ================= Edit modal ================= */

function InvestmentEditModal({
  open,
  onClose,
  projectId,
  investment,
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
  investment: InvestmentRequirement | null;
}) {
  const [land, setLand] = useState(0);
  const [construction, setConstruction] = useState(0);
  const [design, setDesign] = useState(0);
  const [contingency, setContingency] = useState(0);
  const [roi, setRoi] = useState('');
  const [schedule, setSchedule] = useState<PaymentPhase[]>([]);
  const qc = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    setLand(investment?.breakdown?.land ?? 0);
    setConstruction(investment?.breakdown?.construction ?? 0);
    setDesign(investment?.breakdown?.design ?? 0);
    setContingency(investment?.breakdown?.contingency ?? 0);
    setRoi(investment?.estimated_roi_percent != null ? String(investment.estimated_roi_percent) : '');
    setSchedule(investment?.payment_schedule ?? []);
  }, [open, investment]);

  const total = land + construction + design + contingency;

  const mutation = useMutation({
    mutationFn: () =>
      api<InvestmentRequirement>(`/api/projects/${projectId}/investment`, {
        method: 'PUT',
        body: JSON.stringify({
          total_investment: total,
          currency: investment?.currency ?? 'INR',
          breakdown: { currency: investment?.currency ?? 'INR', land, construction, design, contingency, total },
          estimated_roi_percent: roi === '' ? null : Number(roi),
          payment_schedule: schedule.filter((s) => s.phase.trim()),
        }),
      }),
    onSuccess: () => {
      toast('💰 Investment details saved');
      qc.invalidateQueries({ queryKey: ['project', projectId] });
      onClose();
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Save failed', 'error'),
  });

  const numField = (label: string, value: number, set: (n: number) => void) => (
    <div>
      <label className="label">{label}</label>
      <input
        type="number"
        min={0}
        step={100000}
        className="input"
        value={value || ''}
        placeholder="0"
        onChange={(e) => set(Number(e.target.value) || 0)}
        aria-label={label}
      />
    </div>
  );

  return (
    <Modal open={open} onClose={onClose} title="Edit Investment" wide>
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {numField('Land (₹)', land, setLand)}
          {numField('Construction (₹)', construction, setConstruction)}
          {numField('Design (₹)', design, setDesign)}
          {numField('Contingency (₹)', contingency, setContingency)}
        </div>

        <div className="flex items-center justify-between rounded-xl bg-primary/5 border border-primary/10 px-4 py-3">
          <p className="text-sm font-semibold text-primary">Auto-summed total</p>
          <p className="text-lg font-heading font-bold text-primary tabular-nums">{formatINR(total)}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Estimated ROI (%)"
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={roi}
            onChange={(e) => setRoi(e.target.value)}
            placeholder="24.5"
          />
        </div>

        {/* Payment schedule editor */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="label !mb-0">Payment Schedule</span>
            <button
              type="button"
              onClick={() => setSchedule((s) => [...s, { phase: '', amount: 0, date: new Date().toISOString().slice(0, 10) }])}
              className="text-xs font-semibold text-secondary hover:underline flex items-center gap-1"
            >
              <Plus size={12} aria-hidden /> Add phase
            </button>
          </div>
          {schedule.length === 0 && <p className="text-xs text-gray-400 py-2">No phases — add the first one.</p>}
          <div className="space-y-2">
            {schedule.map((row, i) => (
              <div key={i} className="grid grid-cols-[1fr,120px,140px,36px] gap-2 items-center">
                <input
                  className="input !py-2 text-xs"
                  placeholder="Phase name"
                  value={row.phase}
                  aria-label={`Phase ${i + 1} name`}
                  onChange={(e) => setSchedule((s) => s.map((r, j) => (j === i ? { ...r, phase: e.target.value } : r)))}
                />
                <input
                  className="input !py-2 text-xs"
                  type="number"
                  min={0}
                  placeholder="Amount"
                  value={row.amount || ''}
                  aria-label={`Phase ${i + 1} amount`}
                  onChange={(e) =>
                    setSchedule((s) => s.map((r, j) => (j === i ? { ...r, amount: Number(e.target.value) || 0 } : r)))
                  }
                />
                <input
                  className="input !py-2 text-xs"
                  type="date"
                  value={row.date.slice(0, 10)}
                  aria-label={`Phase ${i + 1} date`}
                  onChange={(e) => setSchedule((s) => s.map((r, j) => (j === i ? { ...r, date: e.target.value } : r)))}
                />
                <button
                  type="button"
                  aria-label={`Remove phase ${i + 1}`}
                  onClick={() => setSchedule((s) => s.filter((_, j) => j !== i))}
                  className="p-2 rounded-lg text-gray-300 hover:text-warning hover:bg-warning/5 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="secondary" loading={mutation.isPending}>
            Save Investment
          </Button>
        </div>
      </form>
    </Modal>
  );
}
