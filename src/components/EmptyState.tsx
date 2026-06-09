import React from "react";
import { Moon } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionText,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-dream-purple/30 to-aurora/20 flex items-center justify-center mb-5">
        <div className="text-white/40">
          {icon || <Moon size={36} />}
        </div>
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-white/50 max-w-sm mb-5">{description}</p>
      )}
      {actionText && onAction && (
        <button className="btn-primary" onClick={onAction}>
          {actionText}
        </button>
      )}
    </div>
  );
}
