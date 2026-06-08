import { useState, useEffect, useRef } from "react";
import { BookOpen, Trash2, Save, Cloud } from "lucide-react";
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

export default function DreamPage() {
  const { records, fetchRecords, addRecord, deleteRecord } = useDreamStore();
  const [date, setDate] = useState(getTodayString());
  const [content, setContent] = useState("");
  const [dreamType, setDreamType] = useState<DreamType>("普通梦");
  const [emotions, setEmotions] = useState<DreamEmotion[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

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

  async function handleSave() {
    if (!content.trim()) return;
    const now = Date.now();
    const record: DreamRecord = {
      id: generateId(),
      date,
      content: content.trim(),
      dreamType,
      emotions,
      createdAt: now,
      updatedAt: now,
    };
    await addRecord(record);
    setContent("");
    setEmotions([]);
    setDreamType("普通梦");
    setDate(getTodayString());
  }

  async function handleDelete(id: string) {
    await deleteRecord(id);
  }

  function drawWordCloud() {
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

        <button className="btn-primary flex items-center gap-2" onClick={handleSave}>
          <Save size={16} />
          保存梦境
        </button>
      </div>

      <div className="glass-card p-6 space-y-3">
        <h3 className="section-title text-lg flex items-center gap-2">
          <Cloud size={20} />
          梦境主题词云
        </h3>
        <canvas
          ref={canvasRef}
          className="w-full h-[300px] rounded-xl"
          style={{ width: "100%", height: 300 }}
        />
      </div>

      <div className="space-y-3">
        {records.map((record) => (
          <div key={record.id} className="glass-card p-4 flex justify-between items-start gap-3">
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
            <button
              className="text-white/30 hover:text-red-400 transition-colors shrink-0"
              onClick={() => handleDelete(record.id)}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
