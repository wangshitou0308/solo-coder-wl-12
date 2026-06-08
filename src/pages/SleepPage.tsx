import { useState, useEffect } from "react";
import { Moon, Sun, Clock, Star, Trash2, Save } from "lucide-react";
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

export default function SleepPage() {
  const { records, fetchRecords, addRecord, updateRecord, deleteRecord } = useSleepStore();

  const [date, setDate] = useState(getTodayString());
  const [bedTime, setBedTime] = useState("23:00");
  const [wakeTime, setWakeTime] = useState("07:00");
  const [fallAsleepMinutes, setFallAsleepMinutes] = useState(15);
  const [qualityRating, setQualityRating] = useState(3);
  const [factors, setFactors] = useState<SleepFactor[]>([]);
  const [saveMsg, setSaveMsg] = useState("");

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

  const handleSave = async () => {
    if (!date || !bedTime || !wakeTime) return;
    const now = Date.now();
    const existing = records.find((r) => r.date === date);
    const record: SleepRecord = {
      id: existing ? existing.id : generateId(),
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
    if (existing) {
      await updateRecord(record);
      setSaveMsg("已更新该日期记录");
    } else {
      await addRecord(record);
      setSaveMsg("保存成功");
    }
    setTimeout(() => setSaveMsg(""), 2000);
  };

  const handleDelete = async (id: string) => {
    await deleteRecord(id);
  };

  return (
    <div className="space-y-6">
      <h2 className="section-title">睡眠记录</h2>

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
          <button
            type="button"
            onClick={handleSave}
            className="btn-primary flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> 保存记录
          </button>
        </div>
      </div>

      {records.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-white/80">历史记录</h3>
          {records.map((record) => (
            <div
              key={record.id}
              className="glass-card p-4 flex items-center justify-between"
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
              <button
                type="button"
                onClick={() => handleDelete(record.id)}
                className="p-2 text-white/30 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
