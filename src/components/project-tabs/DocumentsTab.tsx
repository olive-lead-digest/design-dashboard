'use client';

import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, FileText, Search, Trash2, Upload, User } from 'lucide-react';
import type { ProjectDocument } from '@/types';
import { FILE_CATEGORIES } from '@/lib/constants';
import { api } from '@/lib/api';
import { useToast } from '@/components/common/Toast';
import { Spinner } from '@/components/common/Loading';
import EmptyState from '@/components/common/EmptyState';
import DocumentUploadModal from '@/components/modals/DocumentUploadModal';
import { cn, displayName, formatDate } from '@/lib/utils';

interface Props {
  projectId: string;
  documents: ProjectDocument[];
}

interface ProcessingState {
  id: string;
  phase: 'working' | 'done';
}

export default function DocumentsTab({ projectId, documents }: Props) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [droppedName, setDroppedName] = useState<string | undefined>();
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [processing, setProcessing] = useState<ProcessingState | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();
  const { toast } = useToast();

  const deleteMut = useMutation({
    mutationFn: (docId: string) =>
      api<{ status: string }>(`/api/projects/${projectId}/documents/${docId}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast('🗑 Document removed');
      qc.invalidateQueries({ queryKey: ['project', projectId] });
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Delete failed', 'error'),
    onSettled: () => setConfirmDeleteId(null),
  });

  const openWithFile = (name?: string) => {
    setDroppedName(name);
    setUploadOpen(true);
  };

  const onUploaded = (doc: ProjectDocument, generating: boolean) => {
    if (!generating) return;
    setProcessing({ id: doc.id, phase: 'working' });
    setTimeout(() => setProcessing({ id: doc.id, phase: 'done' }), 1900);
    setTimeout(() => setProcessing(null), 6000);
  };

  const filtered = documents.filter((d) => {
    const catOk = category === 'All' || d.file_category === category;
    const q = search.trim().toLowerCase();
    const searchOk = !q || d.file_name.toLowerCase().includes(q) || d.uploaded_by.toLowerCase().includes(q);
    return catOk && searchOk;
  });

  const groups: { key: 'client' | 'internal'; label: string }[] = [
    { key: 'client', label: 'Client Documents' },
    { key: 'internal', label: 'Internal Documents' },
  ];

  return (
    <div className="space-y-6">
      {/* Drag & drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragActive(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          const file = e.dataTransfer.files?.[0];
          openWithFile(file?.name);
        }}
        className={cn(
          'rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200',
          dragActive ? 'border-secondary bg-secondary/5 scale-[1.01]' : 'border-gray-200 bg-gray-50/50',
        )}
      >
        <div
          className={cn(
            'w-12 h-12 mx-auto rounded-2xl flex items-center justify-center mb-3 transition-colors',
            dragActive ? 'bg-secondary text-white' : 'bg-secondary/10 text-secondary',
          )}
        >
          <Upload size={22} aria-hidden />
        </div>
        <p className="font-semibold text-sm">{dragActive ? 'Drop to add document' : 'Drag & drop a document here'}</p>
        <p className="text-xs text-gray-400 mt-1 mb-4">
          Metadata only in tester mode · Agreements auto-trigger the feasibility study
        </p>
        <input
          ref={fileInputRef}
          type="file"
          className="sr-only"
          aria-label="Browse files"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) openWithFile(file.name);
            e.target.value = '';
          }}
        />
        <button onClick={() => fileInputRef.current?.click()} className="btn-secondary !py-2">
          Browse Files
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1.5 flex-wrap" role="group" aria-label="Filter by category">
          {['All', ...FILE_CATEGORIES].map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                category === c
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300',
              )}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="relative ml-auto w-full sm:w-60">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden />
          <input
            className="input pl-9"
            placeholder="Search documents…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search documents"
          />
        </div>
      </div>

      {/* Grouped list */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No documents found"
          message={
            documents.length === 0
              ? 'Upload your first document — agreements automatically trigger the feasibility study.'
              : 'No documents match the current filters.'
          }
          actionLabel={documents.length === 0 ? 'Add Document' : undefined}
          onAction={documents.length === 0 ? () => openWithFile(undefined) : undefined}
          icon={<FileText size={26} />}
        />
      ) : (
        groups.map((g) => {
          const docs = filtered.filter((d) => d.document_type === g.key);
          if (docs.length === 0) return null;
          return (
            <div key={g.key}>
              <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2.5">
                {g.label} <span className="text-gray-300 font-semibold">({docs.length})</span>
              </h3>
              <ul className="space-y-2 stagger">
                {docs.map((d) => (
                  <li key={d.id} className="card px-4 py-3.5 flex items-center gap-3.5">
                    <span className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center shrink-0">
                      <FileText size={17} aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{d.file_name}</p>
                      <p className="text-[11px] text-gray-400 flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="badge bg-gray-50 border-gray-200 text-gray-500 !text-[10px] !py-0">
                          {d.file_category}
                        </span>
                        <User size={11} aria-hidden />
                        {displayName(d.uploaded_by)}
                        <span aria-hidden>·</span>
                        {formatDate(d.uploaded_at)}
                      </p>
                    </div>

                    {/* Auto-processing indicator */}
                    {processing?.id === d.id ? (
                      processing.phase === 'working' ? (
                        <span className="flex items-center gap-1.5 text-xs text-gray-500 shrink-0">
                          <Spinner size={14} /> Processing…
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-secondary shrink-0 anim-fade-in">
                          <CheckCircle2 size={14} aria-hidden /> Feasibility triggered
                        </span>
                      )
                    ) : d.auto_processed ? (
                      <span
                        className="hidden sm:flex items-center gap-1 text-[11px] font-semibold text-secondary shrink-0"
                        title="Key info extracted automatically"
                      >
                        <CheckCircle2 size={13} aria-hidden /> Auto-processed
                      </span>
                    ) : null}

                    <button
                      aria-label={confirmDeleteId === d.id ? `Confirm delete ${d.file_name}` : `Delete ${d.file_name}`}
                      onClick={() => {
                        if (confirmDeleteId === d.id) {
                          deleteMut.mutate(d.id);
                        } else {
                          setConfirmDeleteId(d.id);
                          setTimeout(() => setConfirmDeleteId((v) => (v === d.id ? null : v)), 3000);
                        }
                      }}
                      className={cn(
                        'shrink-0 rounded-lg px-2 py-2 text-xs font-semibold transition-all',
                        confirmDeleteId === d.id
                          ? 'bg-warning text-white'
                          : 'text-gray-300 hover:text-warning hover:bg-warning/5',
                      )}
                    >
                      {confirmDeleteId === d.id ? 'Confirm?' : <Trash2 size={15} aria-hidden />}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })
      )}

      <DocumentUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        projectId={projectId}
        initialFileName={droppedName}
        onUploaded={onUploaded}
      />
    </div>
  );
}
