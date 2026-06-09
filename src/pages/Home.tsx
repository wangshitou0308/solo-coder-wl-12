import { useEffect, useMemo } from "react";
import {
  CalendarCheck,
  Moon,
  BookOpen,
  TrendingUp,
  Wind,
  Heart,
  Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  useSleepStore,
  useDreamStore,
} from "@/stores";
import {
  DREAM_EMOTION_COLORS,
  DREAM_TYPE_COLORS,
  DreamEmotion,
  DreamType,
} from "@/types";
import {
  getWeekRange,
  getTodayString,
  formatMinutes,
} from "@/utils/calc";

export default function Home() {
  const { records: sleepRecords, fetchRecords: fetchSleepRecords } = useSleepStore();
  const { records: dreamRecords, fetchRecords: fetchDreamRecords } = useDreamStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSleepRecords();
    fetchDreamRecords();
  }, [fetchSleepRecords, fetchDreamRecords]);

  const hour = new Date().getHours();
  const greeting =
    hour < 6
      ? "夜深了"
      : hour < 12
      ? "早上好"
      : hour < 18
      ? "下午好"
      : "晚上好";

  const today = getTodayString();
  const todaySleep = sleepRecords.find((r) => r.date === today);
  const todayDream = dreamRecords.find((r) => r.date === today);

  const weekRange = getWeekRange();
  const weekSleepRecords = useMemo(
    () =>
      sleepRecords.filter(
        (r) => r.date >= weekRange.start && r.date <= weekRange.end
      ),
    [sleepRecords, weekRange]
  );

  const { avgDuration, avgEfficiency } = useMemo(() => {
    if (weekSleepRecords.length === 0) return { avgDuration: 0, avgEfficiency: 0 };
    const totalDuration = weekSleepRecords.reduce(
      (sum, r) => sum + r.sleepDuration,
      0
    );
    const totalEfficiency = weekSleepRecords.reduce(
      (sum, r) => sum + r.sleepEfficiency,
      0
    );
    return {
      avgDuration: Math.round(totalDuration / weekSleepRecords.length),
      avgEfficiency: Math.round(totalEfficiency / weekSleepRecords.length),
    };
  }, [weekSleepRecords]);

  const recentDreams = useMemo(() => {
    const sorted = [...dreamRecords].sort((a, b) =>
      b.date.localeCompare(a.date)
    );
    return sorted.slice(0, 10);
  }, [dreamRecords]);

  const topEmotions = useMemo(() => {
    if (recentDreams.length === 0) return [];
    const emotionCount = new Map<DreamEmotion, number>();
    for (const dream of recentDreams) {
      for (const emotion of dream.emotions) {
        emotionCount.set(emotion, (emotionCount.get(emotion) || 0) + 1);
      }
    }
    return Array.from(emotionCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [recentDreams]);

  const topDreamType = useMemo(() => {
    if (recentDreams.length === 0) return null;
    const typeCount = new Map<DreamType, number>();
    for (const dream of recentDreams) {
      typeCount.set(dream.dreamType, (typeCount.get(dream.dreamType) || 0) + 1);
    }
    const sorted = Array.from(typeCount.entries()).sort((a, b) => b[1] - a[1]);
    return sorted[0] ? sorted[0][0] : null;
  }, [recentDreams]);

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div>
        <h2 className="section-title">{greeting}，DreamLog 总览</h2>
        <p className="text-sm text-white/50 mt-1">
          记录睡眠，追溯梦境，探索你的潜意识世界
        </p>
      </div>

      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <CalendarCheck className="w-5 h-5 text-stargold" />
          <span className="text-white/80 font-medium">今日状态</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">睡眠记录</span>
              <Moon className="w-4 h-4 text-dream-purple" />
            </div>
            {todaySleep ? (
              <div className="space-y-1">
                <p className="text-sm font-medium text-white/80">
                  ✅ 睡眠已记录
                </p>
                <p className="text-xs text-white/50">
                  {todaySleep.bedTime} - {todaySleep.wakeTime}
                </p>
                <p className="text-sm font-semibold bg-gradient-to-r from-stargold to-aurora bg-clip-text text-transparent">
                  {formatMinutes(todaySleep.sleepDuration)} · 效率{" "}
                  {todaySleep.sleepEfficiency}%
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-white/60">⏰ 还未记录今日睡眠</p>
                <button
                  className="btn-primary text-sm py-2 px-4"
                  onClick={() => navigate("/sleep")}
                >
                  去记录
                </button>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">梦境记录</span>
              <BookOpen className="w-4 h-4 text-aurora" />
            </div>
            {todayDream ? (
              <div className="space-y-1">
                <p className="text-sm font-medium text-white/80">
                  ✅ 梦境已记录
                </p>
                <p className="text-xs text-white/50 line-clamp-2">
                  {todayDream.content}
                </p>
                <span
                  className="inline-block text-xs px-2 py-0.5 rounded-full mt-1"
                  style={{
                    backgroundColor:
                      DREAM_TYPE_COLORS[todayDream.dreamType] + "33",
                    color: DREAM_TYPE_COLORS[todayDream.dreamType],
                  }}
                >
                  {todayDream.dreamType}
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-white/60">💤 还未记录今日梦境</p>
                <button
                  className="btn-primary text-sm py-2 px-4"
                  onClick={() => navigate("/dream")}
                  style={{
                    background: "linear-gradient(to right, #8B5CF6, #06B6D4)",
                  }}
                >
                  去记录
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-dream-purple" />
            <span className="text-white/80 font-medium">本周平均</span>
          </div>

          {weekSleepRecords.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-gradient-to-br from-dream-purple/20 to-aurora/10 border border-dream-purple/20 p-4 text-center">
                  <p className="text-xs text-white/50 mb-1 flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3" />
                    睡眠时长
                  </p>
                  <p className="text-lg font-semibold bg-gradient-to-r from-stargold to-aurora bg-clip-text text-transparent">
                    {formatMinutes(avgDuration)}
                  </p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-aurora/10 to-dream-purple/20 border border-aurora/20 p-4 text-center">
                  <p className="text-xs text-white/50 mb-1 flex items-center justify-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    睡眠效率
                  </p>
                  <p className="text-lg font-semibold bg-gradient-to-r from-stargold to-aurora bg-clip-text text-transparent">
                    {avgEfficiency}%
                  </p>
                </div>
              </div>
              <p className="text-xs text-white/40 text-center">
                共 {weekSleepRecords.length} 天数据
              </p>
            </div>
          ) : (
            <div className="py-8 text-center text-white/40 text-sm">
              本周暂无睡眠记录
            </div>
          )}
        </div>

        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-400" />
            <span className="text-white/80 font-medium">最近情绪</span>
          </div>

          {recentDreams.length > 0 ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-white/50 mb-2">高频情绪</p>
                <div className="flex flex-wrap gap-2">
                  {topEmotions.length > 0 ? (
                    topEmotions.map(([emotion]) => (
                      <span
                        key={emotion}
                        className="text-xs px-3 py-1 rounded-full"
                        style={{
                          backgroundColor:
                            DREAM_EMOTION_COLORS[emotion] + "33",
                          color: DREAM_EMOTION_COLORS[emotion],
                        }}
                      >
                        {emotion}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-white/40">暂无情绪标签</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs text-white/50 mb-2">常见梦境</p>
                {topDreamType ? (
                  <span
                    className="text-xs px-3 py-1 rounded-full"
                    style={{
                      backgroundColor:
                        DREAM_TYPE_COLORS[topDreamType] + "33",
                      color: DREAM_TYPE_COLORS[topDreamType],
                    }}
                  >
                    {topDreamType}
                  </span>
                ) : (
                  <span className="text-xs text-white/40">暂无梦境类型</span>
                )}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-white/40 text-sm">
              暂无近期梦境记录
            </div>
          )}
        </div>
      </div>

      <div>
        <p className="text-sm text-white/60 mb-3 ml-1">快捷入口</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div
            className="glass-card-hover p-5 flex flex-col items-center justify-center gap-2 cursor-pointer text-center"
            onClick={() => navigate("/sleep")}
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
              <Moon size={22} className="text-white" />
            </div>
            <span className="text-sm text-white/80 font-medium">记录睡眠</span>
          </div>

          <div
            className="glass-card-hover p-5 flex flex-col items-center justify-center gap-2 cursor-pointer text-center"
            onClick={() => navigate("/dream")}
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center">
              <BookOpen size={22} className="text-white" />
            </div>
            <span className="text-sm text-white/80 font-medium">记录梦境</span>
          </div>

          <div
            className="glass-card-hover p-5 flex flex-col items-center justify-center gap-2 cursor-pointer text-center"
            onClick={() => navigate("/dashboard")}
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center">
              <TrendingUp size={22} className="text-white" />
            </div>
            <span className="text-sm text-white/80 font-medium">数据看板</span>
          </div>

          <div
            className="glass-card-hover p-5 flex flex-col items-center justify-center gap-2 cursor-pointer text-center"
            onClick={() => navigate("/tools")}
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-sky-600 flex items-center justify-center">
              <Wind size={22} className="text-white" />
            </div>
            <span className="text-sm text-white/80 font-medium">助眠工具</span>
          </div>
        </div>
      </div>
    </div>
  );
}
