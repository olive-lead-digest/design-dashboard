'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FileUp } from 'lucide-react';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { useToast } from '@/components/common/Toast';
import { api } from '@/lib/api';
import { FILE_CATEGORIES } from '@/lib/constants';
import type { DocumentType, FileCategory, ProjectDocument } from '@/types';

interface UploadResponse {
  document: ProjectDocument;
  generating_feasibility: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  projectId: string;
  /** Pre-filled from the dropped/browsed file's name. */
  initialFileName?: string;
  onUploaded?: (doc: ProjectDocument, generatingFeasibility: boolean) => void;
}

export default function DocumentUploadModal({ open, onClose, projectId, initialFileName, onUploaded }: Props) {
  const [fileName, setFileName] = useState('');
  const [docType, setDocType] = useState<DocumentType>('client');
  const [category, setCategory] = useState<FileCategory>('Agreement');
  const [error, setError] = useState<string | undefined>();
  const qc = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setFileName(initialFileName ?? '');
      setDocType('client');
      setCategory('Agreement');
      setError(undefined);
    }
  }, [open, initialFileName]);

  const mutation = useMutation({
    mutationFn: () =>
      api<UploadResponse>(`/api/projects/${projectId}/documents`, {
        method: 'POST',
        body: JSON.stringify({ file_name: fileName.trim(), document_type: docType, file_category: category }),
      }),
    onSuccess: (res) => {
      toast('📄 Document added');
      if (res.generating_feasibility) {
        toast('🤖 Feasibility study generation triggered', 'info');
      }
      qc.invalidateQueries({ queryKey: ['project', projectId] });
      onUploaded?.(res.document, res.generating_feasibility);
      onClose();
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Upload failed', 'error'),
  });

  return (
    <Modal open={open} onClose={onClose} title="Add Document">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!fileName.trim()) {
            setError('File name is required');
            return;
          }
          setError(undefined);
          mutation.mutate();
        }}
        noValidate
      >
        <div className="rounded-xl bg-secondary/5 border border-secondary/20 px-4 py-3 flex items-center gap-3 text-xs text-gray-600">
          <FileUp size={16} className="text-secondary shrink-0" aria-hidden />
          Tester mode stores document metadata only — no file bytes are uploaded.
        </div>

        <Input
          label="File Name"
          placeholder="lease_agreement_v1.pdf"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          error={error}
        />

        <div>
          <span className="label">Document Type</span>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Document type">
            {(['client', 'internal'] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={docType === t}
                onClick={() => setDocType(t)}
                className={`rounded-xl border px-3 py-2.5 text-sm font-semibold capitalize transition-colors ${
                  docType === t
                    ? 'border-secondary bg-secondary/10 text-secondary'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="doc-category" className="label">
            Category
          </label>
          <select
            id="doc-category"
            className="input"
            value={category}
            onChange={(e) => setCategory(e.target.value as FileCategory)}
          >
            {FILE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="secondary" loading={mutation.isPending}>
            Add Document
          </Button>
        </div>
      </form>
    </Modal>
  );
}
