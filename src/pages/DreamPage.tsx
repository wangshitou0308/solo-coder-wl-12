import { useState, useEffect, useRef } from "react";
import { BookOpen, Trash2, Save, Cloud, Edit3, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import {
  DreamRecord,
  DreamType,
  DreamEmotion,
  DREAM_TYPES,
  DREAM_EMOTIONS,
  DREAM_EMOTION_COLORS,
  WordCloudItem,
} from "@/types";
import { useDreamStore } from "@/stores";
import { generateId, getTodayString, formatDate, extractKeywords } from "@/utils/calc";
import ConfirmModal from "@/components/ConfirmModal";
import EmptyState from "@/components/EmptyState";

export default function DreamPage() {
  const { records, fetchRecords, addRecord, updateRecord, deleteRecord } = useDreamStore();
  const [searchParams] = useSearchParams();
  const [date, setDate] = useState(getTodayString());
  const [content, setContent] = useState("");
  const [dreamType, setDreamType] = useState<DreamType>("普通梦");
  const [emotions, setEmotions] = useState<DreamEmotion[]>([]);
  const [saveMsg, setSaveMsg] = useState("");
  const [saveError, setSaveError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    kind: "delete" | "overwrite";
    recordId: string | null;
    overwrite?: {
      originalRecordId: string;
      targetRecordId: string;
      targetDate: string;
    } | null;
  }>({
    open: false,
    kind: "delete" as const,
    recordId: null,
    overwrite: null,
  });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  useEffect(() => {
    const dateParam = searchParams.get("date");
    if (dateParam) {
      setDate(dateParam);
    }
  }, [searchParams]);

  useEffect(() => {
    drawWordCloud();
  }, [records]);

  function toggleEmotion(emotion: DreamEmotion) {
    setEmotions((prev) =>
      prev.includes(emotion)
        ? prev.filter((e) => e !== emotion)
        : [...prev, emotion]
    );
  }

  function resetFormContent() {
    setContent("");
    setEmotions([]);
    setDreamType("普通梦");
  }

  function handleEdit(record: DreamRecord) {
    setDate(record.date);
    setContent(record.content);
    setDreamType(record.dreamType);
    setEmotions(record.emotions);
    setEditingId(record.id);
  }

  function handleCancelEdit() {
    resetFormContent();
    setEditingId(null);
  }

  function handleConfirmDelete(recordId: string) {
    setConfirmModal({
      open: true,
      kind: "delete",
      recordId,
      overwrite: null,
    });
  }

  async function performSave(opts?: { forceDeleteId?: string; forceOverwriteId?: string }) {
    if (!content.trim()) return;

    const now = Date.now();
    const isEditing = editingId !== null;
    const originalRecord = isEditing ? records.find((r) => r.id === editingId) : undefined;
    const sameDateRecord = records.find((r) => r.date === date);

    let recordId: string;
    if (opts?.forceOverwriteId) recordId = opts.forceOverwriteId;
    else if (isEditing) recordId = editingId!;
    else if (sameDateRecord) recordId = sameDateRecord.id;
    else recordId = generateId();

    let createdAt: number;
    if (opts?.forceOverwriteId) {
      const target = records.find((r) => r.id === opts.forceOverwriteId);
      createdAt = target ? target.createdAt : now;
    } else if (isEditing && originalRecord) createdAt = originalRecord.createdAt;
    else if (sameDateRecord) createdAt = sameDateRecord.createdAt;
    else createdAt = now;

    const record: DreamRecord = {
      id: recordId,
      date,
      content: content.trim(),
      dreamType,
      emotions,
      createdAt,
      updatedAt: now,
    };

    try {
      if (opts?.forceDeleteId) await deleteRecord(opts.forceDeleteId);

      const isUpdate = isEditing || !!sameDateRecord || !!opts?.forceOverwriteId;
      if (isUpdate) {
        await updateRecord(record);
        setSaveMsg(
          opts?.forceOverwriteId
            ? `已覆盖 ${formatDate(date)} 的梦境`
            : editingId
              ? "编辑已保存"
              : "已更新该日期梦境"
        );
      } else {
        await addRecord(record);
        setSaveMsg("保存成功");
      }

      setTimeout(() => setSaveMsg(""), 2500);
      resetFormContent();
      setEditingId(null);
    } catch (e) {
      console.error("保存失败", e);
      setSaveError("保存失败，可能日期已存在或数据库异常，请重试");
      setTimeout(() => setSaveError(""), 3500);
    }
  }

  async function handleSave() {
    if (!content.trim()) return;
    setSaveMsg("");
    setSaveError("");

    const isEditing = editingId !== null;
    const originalRecord = isEditing ? records.find((r) => r.id === editingId) : undefined;
    const sameDateRecord = records.find((r) => r.date === date);

    if (
      isEditing &&
      originalRecord &&
      originalRecord.date !== date &&
      sameDateRecord &&
      sameDateRecord.id !== editingId
    ) {
      setConfirmModal({
        open: true,
        kind: "overwrite",
        recordId: null,
        overwrite: {
          originalRecordId: editingId,
          targetRecordId: sameDateRecord.id,
          targetDate: date,
        },
      });
      return;
    }

    await performSave();
  }

  async function handleConfirmOk() {
    if (confirmModal.kind === "delete" && confirmModal.recordId) {
      await deleteRecord(confirmModal.recordId);
      setConfirmModal({
        open: false,
        kind: "delete",
        recordId: null,
        overwrite: null,
      });
    } else if (confirmModal.kind === "overwrite" && confirmModal.overwrite) {
      const { originalRecordId, targetRecordId, targetDate } = confirmModal.overwrite;
      setDate(targetDate);
      setConfirmModal({
        open: false,
        kind: "delete",
        recordId: null,
        overwrite: null,
      });
      await performSave({
        forceDeleteId: originalRecordId,
        forceOverwriteId: targetRecordId,
      });
    }
  }

  function handleConfirmCancel() {
    setConfirmModal({
      open: false,
      kind: "delete",
      recordId: null,
      overwrite: null,
    });
  }

  function drawWordCloud() {
    if (records.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const allText = records.map((r) => r.content).join(" ");
    if (!allText.trim()) return;

    const freqMap = extractKeywords(allText);
    const items: WordCloudItem[] = Array.from(freqMap.entries())
      .map(([text, value]) => ({ text, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 50);

    if (items.length === 0) return;

    const maxCount = items[0].value;
    const minCount = items[items.length - 1].value;
    const colorValues = Object.values(DREAM_EMOTION_COLORS);
    const placedBoxes: { x: number; y: number; w: number; h: number }[] = [];

    for (const item of items) {
      const ratio =
        maxCount === minCount
          ? 1
          : (item.value - minCount) / (maxCount - minCount);
      const fontSize = Math.round(14 + ratio * 34);
      ctx.font = `${fontSize}px "Noto Sans SC", sans-serif`;
      const metrics = ctx.measureText(item.text);
      const textW = metrics.width + 8;
      const textH = fontSize + 8;

      let placed = false;
      for (let attempt = 0; attempt < 200; attempt++) {
        const x = Math.random() * (rect.width - textW);
        const y = fontSize + Math.random() * (rect.height - textH - fontSize);
        const box = { x, y: y - fontSize, w: textW, h: textH };

        const overlaps = placedBoxes.some(
          (b) =>
            box.x < b.x + b.w &&
            box.x + box.w > b.x &&
            box.y < b.y + b.h &&
            box.y + box.h > b.y
        );

        if (!overlaps) {
          const color = colorValues[Math.floor(Math.random() * colorValues.length)];
          ctx.fillStyle = color;
          ctx.globalAlpha = 0.7 + ratio * 0.3;
          ctx.fillText(item.text, x, y);
          ctx.globalAlpha = 1;
          placedBoxes.push(box);
          placed = true;
          break;
        }
      }
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="section-title">梦境日记</h2>
      {editingId !== null && (
        <p className="text-sm text-aurora -mt-3">
          正在编辑 {formatDate(date)} 的梦境
        </p>
      )}

      <div className="glass-card p-6 space-y-4">
        <div>
          <label className="text-sm text-white/60 mb-1 block">日期</label>
          <input
            type="date"
            className="input-field w-full"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm text-white/60 mb-1 block">梦境内容</label>
          <textarea
            className="input-field min-h-[120px] resize-y w-full"
            placeholder="描述你的梦境..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm text-white/60 mb-2 block">梦境类型</label>
          <div className="flex flex-wrap gap-2">
            {DREAM_TYPES.map((type) => (
              <span
                key={type}
                className={`tag-pill ${dreamType === type ? "tag-pill-active" : ""}`}
                onClick={() => setDreamType(type)}
              >
                {type}
              </span>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm text-white/60 mb-2 block">情绪标签</label>
          <div className="flex flex-wrap gap-2">
            {DREAM_EMOTIONS.map((emotion) => (
              <span
                key={emotion}
                className={`tag-pill ${emotions.includes(emotion) ? "tag-pill-active" : ""}`}
                onClick={() => toggleEmotion(emotion)}
              >
                {emotion}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {saveMsg && (
            <span className="text-sm text-stargold animate-pulse">{saveMsg}</span>
          )}
          {saveError && (
            <span className="text-sm text-red-400">{saveError}</span>
          )}
          <button className="btn-primary flex items-center gap-2" onClick={handleSave}>
            <Save size={16} />
            保存梦境
          </button>
          {editingId !== null && (
            <button
              className="btn-ghost flex items-center gap-2"
              onClick={handleCancelEdit}
            >
              <X size={16} />
              取消编辑
            </button>
          )}
        </div>
      </div>

      <div className="glass-card p-6 space-y-3">
        <h3 className="section-title text-lg flex items-center gap-2">
          <Cloud size={20} />
          梦境主题词云
        </h3>
        {records.length === 0 ? (
          <EmptyState
            title="梦境词云暂无数据"
            description="记录一些梦境后，这里会生成你的梦境主题词云"
          />
        ) : (
          <canvas
            ref={canvasRef}
            className="w-full h-[300px] rounded-xl"
            style={{ width: "100%", height: 300 }}
          />
        )}
      </div>

      {records.length === 0 ? (
        <EmptyState
          title="还没有梦境记录"
          description="记录下你的第一个梦境，留住那些奇妙的故事"
        />
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <div
              key={record.id}
              className={`glass-card p-4 flex justify-between items-start gap-3 cursor-pointer transition-colors ${
                editingId === record.id
                  ? "ring-2 ring-aurora border-aurora/50"
                  : "hover:bg-white/5"
              }`}
              onClick={() => handleEdit(record)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen size={14} className="text-stargold shrink-0" />
                  <span className="text-sm text-white/60">{formatDate(record.date)}</span>
                  <span className="tag-pill text-xs py-0 px-2">{record.dreamType}</span>
                </div>
                <p className="text-sm text-white/80 line-clamp-2">{record.content}</p>
                {record.emotions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {record.emotions.map((e) => (
                      <span
                        key={e}
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: DREAM_EMOTION_COLORS[e] + "33",
                          color: DREAM_EMOTION_COLORS[e],
                        }}
                      >
                        {e}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  className="text-white/30 hover:text-aurora transition-colors p-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(record);
                  }}
                >
                  <Edit3 size={16} />
                </button>
                <button
                  className="text-white/30 hover:text-red-400 transition-colors p-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleConfirmDelete(record.id);
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={confirmModal.open}
        title={
          confirmModal.kind === "delete"
            ? "删除梦境记录"
            : "日期冲突，是否覆盖？"
        }
        message={
          confirmModal.kind === "delete"
            ? "确定要删除这条梦境记录吗？这个梦将从你的记忆中消失。"
            : `目标日期 ${formatDate(confirmModal.overwrite!.targetDate)} 已经有一条梦境记录。用当前内容覆盖后，原来正在编辑的梦境将被删除，目标日期的旧内容会被替换。`
        }
        type="danger"
        onConfirm={handleConfirmOk}
        onCancel={handleConfirmCancel}
      />
    </div>
  );
}
