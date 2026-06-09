import { AlertTriangle, Info } from "lucide-react";

interface ConfirmModalProps {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title = "确认操作",
  message,
  confirmText = "确认",
  cancelText = "取消",
  type = "default",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  const Icon = type === "danger" ? AlertTriangle : Info;
  const iconColor = type === "danger" ? "text-red-400" : "text-aurora";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="glass-card relative z-10 w-full max-w-sm p-6 mx-4 space-y-5">
        <div className="flex items-start gap-4">
          <div
            className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
              type === "danger" ? "bg-red-500/15" : "bg-dream-purple/20"
            }`}
          >
            <Icon size={20} className={iconColor} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
            <p className="text-sm text-white/70 whitespace-pre-line">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button className="btn-ghost" onClick={onCancel}>
            {cancelText}
          </button>
          <button
            className={
              type === "danger"
                ? "px-6 py-2.5 rounded-full bg-gradient-to-r from-red-500 to-rose-600 text-white font-medium shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:scale-105 transition-all duration-300"
                : "btn-primary"
            }
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
