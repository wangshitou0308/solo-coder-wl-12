import { useState, useEffect } from "react";
import { Moon, Sun, Clock, Star, Trash2, Save, Edit3, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SleepRecord, SleepFactor, SLEEP_FACTORS } from "@/types";
import { useSleepStore } from "@/stores";
import {
  calculateSleepDuration,
  calculateSleepEfficiency,
  formatMinutes,
  generateId,
  getTodayString,
  formatDate,
} from "@/utils/calc";
import ConfirmModal from "@/components/ConfirmModal";
import EmptyState from "@/components/EmptyState";

export default function SleepPage() {
  const { records, fetchRecords, addRecord, updateRecord, deleteRecord } = useSleepStore();
  const navigate = useNavigate();

  const [date, setDate] = useState(getTodayString());
  const [bedTime, setBedTime] = useState("23:00");
  const [wakeTime, setWakeTime] = useState("07:00");
  const [fallAsleepMinutes, setFallAsleepMinutes] = useState(15);
  const [qualityRating, setQualityRating] = useState(3);
  const [factors, setFactors] = useState<SleepFactor[]>([]);
  const [saveMsg, setSaveMsg] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; recordId: string | null }>({
    open: false,
    recordId: null,
  });
  const [showDreamPrompt, setShowDreamPrompt] = useState(false);
  const [lastSavedDate, setLastSavedDate] = useState("");

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const sleepDuration =
    bedTime && wakeTime ? calculateSleepDuration(bedTime, wakeTime) : 0;
  const clampedFallAsleep = Math.max(0, fallAsleepMinutes);
  const sleepEfficiency =
    sleepDuration > 0
      ? calculateSleepEfficiency(sleepDuration, clampedFallAsleep)
      : 0;

  const toggleFactor = (factor: SleepFactor) => {
    setFactors((prev) =>
      prev.includes(factor)
        ? prev.filter((f) => f !== factor)
        : [...prev, factor]
    );
  };

  const resetForm = () => {
    setDate(getTodayString());
    setBedTime("23:00");
    setWakeTime("07:00");
    setFallAsleepMinutes(15);
    setQualityRating(3);
    setFactors([]);
    setEditingId(null);
  };

  const handleEdit = (record: SleepRecord) => {
    setDate(record.date);
    setBedTime(record.bedTime);
    setWakeTime(record.wakeTime);
    setFallAsleepMinutes(record.fallAsleepMinutes);
    setQualityRating(record.qualityRating);
    setFactors(record.factors);
    setEditingId(record.id);
  };

  const handleCancelEdit = () => {
    resetForm();
  };

  const handleConfirmDelete = (recordId: string) => {
    setConfirmModal({ open: true, recordId });
  };

  const handleDeleteConfirmed = () => {
    if (confirmModal.recordId) {
      deleteRecord(confirmModal.recordId);
    }
    setConfirmModal({ open: false, recordId: null });
  };

  const handleSave = async () => {
    if (!date || !bedTime || !wakeTime) return;
    const now = Date.now();
    const existing = records.find((r) => r.date === date);
    const isEditing = editingId !== null;
    const record: SleepRecord = {
      id: isEditing ? editingId! : existing ? existing.id : generateId(),
      date,
      bedTime,
      wakeTime,
      fallAsleepMinutes: clampedFallAsleep,
      sleepDuration,
      sleepEfficiency,
      qualityRating,
      factors,
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
    };
    if (existing || isEditing) {
      await updateRecord(record);
      setSaveMsg("已更新该日期记录");
    } else {
      await addRecord(record);
      setSaveMsg("保存成功");
      setShowDreamPrompt(true);
      setLastSavedDate(date);
    }
    resetForm();
    setTimeout(() => setSaveMsg(""), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="section-title">睡眠记录</h2>
        {editingId !== null && (
          <p className="text-xs text-aurora/80 mt-1">
            正在编辑 {formatDate(date)} 的记录
          </p>
        )}
      </div>

      <div className="glass-card p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm text-white/60">
              <Moon className="w-4 h-4" /> 日期
            </label>
            <input
              type="date"
              className="input-field w-full"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm text-white/60">
              <Moon className="w-4 h-4" /> 入睡时间
            </label>
            <input
              type="time"
              className="input-field w-full"
              value={bedTime}
              onChange={(e) => setBedTime(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm text-white/60">
              <Sun className="w-4 h-4" /> 起床时间
            </label>
            <input
              type="time"
              className="input-field w-full"
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm text-white/60">
              <Clock className="w-4 h-4" /> 入睡耗时(分钟)
            </label>
            <input
              type="number"
              className="input-field w-full"
              value={fallAsleepMinutes}
              min={0}
              onChange={(e) => {
                const v = Number(e.target.value);
                setFallAsleepMinutes(v < 0 ? 0 : v);
              }}
            />
          </div>
        </div>

        {sleepDuration > 0 && (
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-gradient-to-r from-dream-purple/30 to-aurora/20 border border-dream-purple/20 p-4 text-center">
              <p className="text-xs text-white/50 mb-1">睡眠时长</p>
              <p className="text-lg font-semibold bg-gradient-to-r from-stargold to-aurora bg-clip-text text-transparent">
                {formatMinutes(sleepDuration)}
              </p>
            </div>
            <div className="rounded-xl bg-gradient-to-r from-aurora/20 to-dream-purple/30 border border-aurora/20 p-4 text-center">
              <p className="text-xs text-white/50 mb-1">睡眠效率</p>
              <p className="text-lg font-semibold bg-gradient-to-r from-stargold to-aurora bg-clip-text text-transparent">
                {sleepEfficiency}%
              </p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm text-white/60">睡眠质量</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setQualityRating(i)}
                className="p-1 transition-transform hover:scale-125"
              >
                <Star
                  className={`w-6 h-6 ${
                    i <= qualityRating
                      ? "text-stargold fill-stargold"
                      : "text-white/20"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-white/60">影响因素</p>
          <div className="flex flex-wrap gap-2">
            {SLEEP_FACTORS.map((factor) => (
              <button
                key={factor}
                type="button"
                onClick={() => toggleFactor(factor)}
                className={`tag-pill ${
                  factors.includes(factor) ? "tag-pill-active" : ""
                }`}
              >
                {factor}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          {saveMsg && (
            <span className="text-sm text-stargold animate-pulse">{saveMsg}</span>
          )}
          {editingId !== null && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="btn-ghost flex items-center gap-2"
            >
              <X className="w-4 h-4" /> 取消编辑
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            className="btn-primary flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> 保存记录
          </button>
        </div>
      </div>

      {showDreamPrompt && (
        <div className="glass-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-white/80 text-sm">
            睡眠记录已保存，是否去记录今晚的梦境？
          </p>
          <div className="flex gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setShowDreamPrompt(false)}
              className="btn-ghost text-sm"
            >
              稍后再说
            </button>
            <button
              type="button"
              onClick={() => {
                navigate(`/dream?date=${lastSavedDate}`);
                setShowDreamPrompt(false);
              }}
              className="btn-primary text-sm"
            >
              去记录梦境
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-lg font-medium text-white/80">历史记录</h3>
        {records.length === 0 ? (
          <EmptyState
            title="还没有睡眠记录"
            description="记录第一天的睡眠，开启你的睡眠追踪之旅"
          />
        ) : (
          records.map((record) => (
            <div
              key={record.id}
              onClick={() => handleEdit(record)}
              className={`glass-card p-4 flex items-center justify-between cursor-pointer transition-all ${
                editingId === record.id
                  ? "border-stargold/50 shadow-lg shadow-stargold/10"
                  : ""
              }`}
            >
              <div className="space-y-1">
                <p className="font-medium">{formatDate(record.date)}</p>
                <p className="text-sm text-white/50">
                  {record.bedTime} - {record.wakeTime} ·{" "}
                  {formatMinutes(record.sleepDuration)} · 效率{" "}
                  {record.sleepEfficiency}%
                </p>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i <= record.qualityRating
                          ? "text-stargold fill-stargold"
                          : "text-white/20"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(record);
                  }}
                  className="p-2 text-white/30 hover:text-aurora transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleConfirmDelete(record.id);
                  }}
                  className="p-2 text-white/30 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmModal
        open={confirmModal.open}
        title="删除睡眠记录"
        message="确定要删除这条睡眠记录吗？此操作无法撤销。"
        type="danger"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setConfirmModal({ open: false, recordId: null })}
      />
    </div>
  );
}
