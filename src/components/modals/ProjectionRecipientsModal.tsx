'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, Users } from 'lucide-react';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import { BD_TEAM, DEPARTMENT_HEAD, TESTER_RECEIVER, TESTER_SENDER } from '@/lib/constants';
import { displayName, initials } from '@/lib/utils';

const PEOPLE: string[] = [...BD_TEAM, DEPARTMENT_HEAD];

interface Props {
  open: boolean;
  onClose: () => void;
  projectionTitle: string;
  /** Called with the selected @oliveliving.com emails; parent then opens the email preview. */
  onNext: (emails: string[]) => void;
}

export default function ProjectionRecipientsModal({ open, onClose, projectionTitle, onNext }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (open) {
      setSelected([DEPARTMENT_HEAD]);
      setQuery('');
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PEOPLE;
    return PEOPLE.filter((p) => p.toLowerCase().includes(q) || displayName(p).toLowerCase().includes(q));
  }, [query]);

  const toggle = (email: string) =>
    setSelected((s) => (s.includes(email) ? s.filter((e) => e !== email) : [...s, email]));

  return (
    <Modal open={open} onClose={onClose} title="Send Projection">
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          Choose recipients for <span className="font-semibold text-ink">{projectionTitle}</span>
        </p>

        <div className="rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-xs font-medium text-accent leading-relaxed">
          🧪 Testing mode: selections are ignored — email routes {TESTER_SENDER} → {TESTER_RECEIVER}
        </div>

        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden />
          <input
            className="input pl-9"
            placeholder="Search team members…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search team members"
          />
        </div>

        <div className="flex items-center justify-between text-xs">
          <p className="font-semibold text-gray-500 flex items-center gap-1.5">
            <Users size={13} aria-hidden /> Sending to {selected.length} {selected.length === 1 ? 'person' : 'people'} (Test)
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setSelected([...PEOPLE])}
              className="font-semibold text-secondary hover:underline"
            >
              Select all
            </button>
            <button type="button" onClick={() => setSelected([])} className="font-semibold text-gray-400 hover:underline">
              Clear
            </button>
          </div>
        </div>

        <ul className="space-y-1.5 max-h-64 overflow-y-auto pr-1" role="listbox" aria-label="Recipients" aria-multiselectable>
          {filtered.map((email) => {
            const checked = selected.includes(email);
            return (
              <li key={email}>
                <label
                  className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 cursor-pointer transition-colors ${
                    checked ? 'border-secondary/50 bg-secondary/5' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(email)}
                    className="w-4 h-4 rounded border-gray-300 text-secondary focus:ring-secondary/30 accent-[#14B8A6]"
                  />
                  <span
                    className="w-8 h-8 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0"
                    aria-hidden
                  >
                    {initials(email)}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold leading-tight">
                      {displayName(email)}
                      {email === DEPARTMENT_HEAD && (
                        <span className="ml-1.5 badge bg-primary/5 text-primary/70 border-primary/10 !text-[9px] !py-0">
                          Dept. Head
                        </span>
                      )}
                    </span>
                    <span className="block text-xs text-gray-400 truncate">{email}</span>
                  </span>
                </label>
              </li>
            );
          })}
          {filtered.length === 0 && <li className="text-sm text-gray-400 text-center py-6">No members match “{query}”</li>}
        </ul>

        <div className="flex justify-end gap-3 pt-1">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="secondary" disabled={selected.length === 0} onClick={() => onNext(selected)}>
            Next — Preview Email
          </Button>
        </div>
      </div>
    </Modal>
  );
}
