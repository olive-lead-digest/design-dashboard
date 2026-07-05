'use client';

import { useState } from 'react';
import { Lock, Moon, Send, Sun } from 'lucide-react';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import type { EmailPreview } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  preview: EmailPreview | null;
  onConfirm: () => void | Promise<void>;
  confirmLoading?: boolean;
}

/**
 * 🔴 Email Preview Modal — the ONLY send surface in the app.
 * In tester mode From/To are locked to the test addresses and cannot be
 * changed. "Send" only logs the communication — nothing is dispatched.
 */
export default function EmailPreviewModal({ open, onClose, preview, onConfirm, confirmLoading }: Props) {
  const [dark, setDark] = useState(false);
  if (!preview) return null;

  return (
    <Modal open={open} onClose={onClose} title="Email Preview" wide>
      <div className="space-y-4">
        {preview.testerMode && (
          <div className="rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-xs font-medium text-accent leading-relaxed">
            🧪 TESTER MODE — routing is locked to the test addresses below. No real email will be sent; clicking
            &ldquo;Send&rdquo; only logs this communication.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
            <p className="label mb-0.5 flex items-center gap-1">
              From {preview.testerMode && <Lock size={11} className="text-accent" aria-label="Locked in tester mode" />}
            </p>
            <p className="font-mono text-xs font-semibold">{preview.from}</p>
          </div>
          <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
            <p className="label mb-0.5 flex items-center gap-1">
              To {preview.testerMode && <Lock size={11} className="text-accent" aria-label="Locked in tester mode" />}
            </p>
            <p className="font-mono text-xs font-semibold">{preview.to}</p>
          </div>
        </div>

        <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
          <p className="label mb-0.5">Subject</p>
          <p className="text-sm font-semibold">{preview.subject}</p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="label mb-0">Body</p>
            <button
              onClick={() => setDark((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-ink rounded-lg px-2 py-1 hover:bg-gray-100 transition-colors"
              aria-pressed={dark}
            >
              {dark ? <Sun size={13} /> : <Moon size={13} />} {dark ? 'Light' : 'Dark'} preview
            </button>
          </div>
          <div className={`rounded-xl border border-gray-200 overflow-hidden transition-colors ${dark ? 'bg-gray-900' : 'bg-white'}`}>
            <iframe
              title="Email body preview"
              srcDoc={preview.html}
              sandbox=""
              className="w-full h-[420px] border-0"
              style={dark ? { filter: 'invert(0.92) hue-rotate(180deg)' } : undefined}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-1">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={onConfirm} loading={confirmLoading}>
            <Send size={15} /> {preview.testerMode ? 'Send (test mode — logs only)' : 'Send'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
