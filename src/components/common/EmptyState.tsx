import { FolderOpen } from 'lucide-react';
import Button from './Button';

interface Props {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export default function EmptyState({ title, message, actionLabel, onAction, icon }: Props) {
  return (
    <div className="card flex flex-col items-center justify-center text-center py-16 px-6 anim-fade-in">
      <div className="w-14 h-14 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center mb-4">
        {icon ?? <FolderOpen size={26} />}
      </div>
      <h3 className="font-bold text-base mb-1">{title}</h3>
      {message && <p className="text-sm text-gray-500 max-w-sm mb-5">{message}</p>}
      {actionLabel && onAction && (
        <Button variant="secondary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
