import { useState, useEffect, useMemo } from "react";
import { Clock, Star, Moon, Filter } from "lucide-react";
import {
  DreamRecord,
  DreamEmotion,
  DREAM_EMOTIONS,
  DREAM_TYPE_COLORS,
  DREAM_EMOTION_COLORS,
} from "@/types";
import { useDreamStore, useSleepStore } from "@/stores";
import { formatDate, formatMinutes } from "@/utils/calc";

type EmotionFilter = DreamEmotion | "全部";

const EMOTION_OPTIONS: EmotionFilter[] = ["全部", ...DREAM_EMOTIONS];

export default function TimelinePage() {
  const { records: dreamRecords, fetchRecords: fetchDreams } = useDreamStore();
  const { records: sleepRecords, fetchRecords: fetchSleep } = useSleepStore();
  const [activeEmotion, setActiveEmotion] = useState<EmotionFilter>("全部");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetchDreams();
    fetchSleep();
  }, [fetchDreams, fetchSleep]);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    const sorted = [...dreamRecords].sort(
      (a, b) => b.date.localeCompare(a.date)
    );
    if (activeEmotion === "全部") return sorted;
    return sorted.filter((r) => r.emotions.includes(activeEmotion as DreamEmotion));
  }, [dreamRecords, activeEmotion]);

  const sleepMap = useMemo(() => {
    const map = new Map<string, { qualityRating: number; sleepDuration: number }>();
    for (const s of sleepRecords) {
      map.set(s.date, { qualityRating: s.qualityRating, sleepDuration: s.sleepDuration });
    }
    return map;
  }, [sleepRecords]);

  function renderStars(rating: number) {
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            size={12}
            className={i < rating ? "text-stargold fill-stargold" : "text-white/20"}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="section-title">梦境回溯</h2>

      <div className="flex items-center gap-3 flex-wrap">
        <Filter size={16} className="text-white/40" />
        {EMOTION_OPTIONS.map((emotion) => (
          <span
            key={emotion}
            className={`tag-pill ${activeEmotion === emotion ? "tag-pill-active" : ""}`}
            onClick={() => setActiveEmotion(emotion)}
          >
            {emotion}
          </span>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-white/30">
          <Moon size={48} className="mb-4" />
          <p className="text-lg">暂无梦境记录</p>
        </div>
      ) : (
        <div className="relative pl-6">
          <div
            className="absolute left-[7px] top-2 bottom-2 w-px"
            style={{
              background:
                "linear-gradient(to bottom, #8B5CF6, #00CED1, #FFD700)",
              boxShadow: "0 0 8px 1px rgba(255,215,0,0.25)",
            }}
          />

          <div className="space-y-8">
            {filtered.map((record, index) => {
              const sleep = sleepMap.get(record.date);
              return (
                <div
                  key={record.id}
                  className="relative"
                  style={{
                    opacity: visible ? 1 : 0,
                    transform: visible ? "translateY(0)" : "translateY(16px)",
                    transition: `opacity 0.5s ease ${index * 0.08}s, transform 0.5s ease ${index * 0.08}s`,
                  }}
                >
                  <div
                    className="absolute left-[-21px] top-2 w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: "#FFD700",
                      boxShadow:
                        "0 0 6px 2px rgba(255,215,0,0.5), 0 0 12px 4px rgba(255,215,0,0.2)",
                    }}
                  />

                  <div className="glass-card-hover p-4 ml-2">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Clock size={14} className="text-white/40" />
                      <span className="text-sm text-white/60">
                        {formatDate(record.date)}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: DREAM_TYPE_COLORS[record.dreamType] + "33",
                          color: DREAM_TYPE_COLORS[record.dreamType],
                        }}
                      >
                        {record.dreamType}
                      </span>
                    </div>

                    <p className="text-sm text-white/80 line-clamp-3 mb-3">
                      {record.content}
                    </p>

                    <div className="flex items-center gap-2 flex-wrap">
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

                    {sleep && (
                      <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-white/40">睡眠质量</span>
                          {renderStars(sleep.qualityRating)}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-white/40">时长</span>
                          <span className="text-xs text-aurora">
                            {formatMinutes(sleep.sleepDuration)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
