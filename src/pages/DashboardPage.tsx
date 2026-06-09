import { useState, useMemo, useRef, useEffect } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from "chart.js";
import { TrendingUp, Calendar, Settings, Target, Award, TrendingDown, AlertCircle, Lightbulb, X } from "lucide-react";
import { useSleepStore, useDreamStore, useSettingsStore } from "@/stores";
import { getWeekRange, getMonthRange, getPrevWeekRange, timeToMinutes, formatPercent } from "@/utils/calc";
import EmptyState from "@/components/EmptyState";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip
);

type Period = "week" | "month";

const WEEKDAY_LABELS = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
const TIME_SLOTS = ["22:00", "23:00", "0:00", "1:00", "2:00", "3:00"];

function getTimeSlotIndex(bedTime: string): number {
  const [h] = bedTime.split(":").map(Number);
  if (h >= 22) return h - 22;
  if (h <= 3) return h + 2;
  return -1;
}

function getWeekdayIndex(dateStr: string): number {
  const d = new Date(dateStr);
  const day = d.getDay();
  return day === 0 ? 6 : day - 1;
}

function lerpColor(t: number): string {
  const r = Math.round(45 + (255 - 45) * t);
  const g = Math.round(27 + (215 - 27) * t);
  const b = Math.round(78 + (0 - 78) * t);
  return `rgb(${r},${g},${b})`;
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "rgba(15,10,26,0.85)",
      borderColor: "rgba(139,92,246,0.3)",
      borderWidth: 1,
      titleColor: "#FFD700",
      bodyColor: "#e2e8f0",
      cornerRadius: 8,
      padding: 10,
    },
  },
  scales: {
    x: {
      ticks: { color: "rgba(226,232,240,0.5)", font: { size: 11 } },
      grid: { color: "rgba(255,255,255,0.05)" },
      border: { display: false },
    },
    y: {
      ticks: { color: "rgba(226,232,240,0.5)", font: { size: 11 } },
      grid: { color: "rgba(255,255,255,0.05)" },
      border: { display: false },
    },
  },
  elements: {
    point: { radius: 3, hoverRadius: 6, backgroundColor: "#8B5CF6" },
    line: { tension: 0.4, borderWidth: 2 },
  },
};

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>("week");
  const [showSettings, setShowSettings] = useState(false);
  const { records: sleepRecords, fetchRecords } = useSleepStore();
  const { settings, updateSettings } = useSettingsStore();
  const [editTargetMinutes, setEditTargetMinutes] = useState(settings.targetSleepMinutes);
  const [editTargetBedtime, setEditTargetBedtime] = useState(settings.targetBedtime);
  const { records: dreamRecords, fetchRecords: fetchDream } = useDreamStore();
  const heatmapRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (showSettings) {
      setEditTargetMinutes(settings.targetSleepMinutes);
      setEditTargetBedtime(settings.targetBedtime);
    }
  }, [showSettings, settings]);

  useEffect(() => {
    fetchRecords();
    fetchDream();
  }, [fetchRecords, fetchDream]);

  const filtered = useMemo(() => {
    const range = period === "week" ? getWeekRange() : getMonthRange();
    return sleepRecords
      .filter((r) => r.date >= range.start && r.date <= range.end)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [sleepRecords, period]);

  const durationData = useMemo(() => {
    const labels = filtered.map((r) => {
      const d = new Date(r.date);
      return `${d.getMonth() + 1}/${d.getDate()}`;
    });
    const values = filtered.map((r) => +(r.sleepDuration / 60).toFixed(1));
    return { labels, values };
  }, [filtered]);

  const efficiencyData = useMemo(() => {
    const labels = filtered.map((r) => {
      const d = new Date(r.date);
      return `${d.getMonth() + 1}/${d.getDate()}`;
    });
    const values = filtered.map((r) => r.sleepEfficiency);
    return { labels, values };
  }, [filtered]);

  const heatmapFreq = useMemo(() => {
    const grid: number[][] = Array.from({ length: 6 }, () =>
      new Array(7).fill(0)
    );
    for (const r of filtered) {
      const col = getWeekdayIndex(r.date);
      const row = getTimeSlotIndex(r.bedTime);
      if (row >= 0 && row < 6 && col >= 0 && col < 7) {
        grid[row][col]++;
      }
    }
    return grid;
  }, [filtered]);

  const durationChart = useMemo(() => {
    return {
      labels: durationData.labels,
      datasets: [
        {
          data: durationData.values,
          borderColor: "#8B5CF6",
          backgroundColor: (ctx: { chart: { ctx: CanvasRenderingContext2D; chartArea?: { top: number; bottom: number } } }) => {
            const { ctx: c, chartArea } = ctx.chart;
            if (!chartArea) return "rgba(139,92,246,0.1)";
            const grad = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            grad.addColorStop(0, "rgba(139,92,246,0.5)");
            grad.addColorStop(1, "rgba(139,92,246,0)");
            return grad;
          },
          fill: true,
        },
      ],
    };
  }, [durationData]);

  const efficiencyChart = useMemo(() => {
    return {
      labels: efficiencyData.labels,
      datasets: [
        {
          data: efficiencyData.values,
          borderColor: "#00CED1",
          backgroundColor: (ctx: { chart: { ctx: CanvasRenderingContext2D; chartArea?: { top: number; bottom: number } } }) => {
            const { ctx: c, chartArea } = ctx.chart;
            if (!chartArea) return "rgba(0,206,209,0.1)";
            const grad = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            grad.addColorStop(0, "rgba(0,206,209,0.5)");
            grad.addColorStop(1, "rgba(0,206,209,0)");
            return grad;
          },
          fill: true,
        },
      ],
    };
  }, [efficiencyData]);

  const targetMetrics = useMemo(() => {
    if (filtered.length === 0) {
      return {
        durationDays: 0,
        durationRate: "-",
        durationRateNum: 0,
        bedtimeDays: 0,
        bedtimeRate: "-",
        bedtimeRateNum: 0,
        total: 0,
      };
    }
    const targetBedtimeMinutes = timeToMinutes(settings.targetBedtime);
    let durationDays = 0;
    let bedtimeDays = 0;
    for (const r of filtered) {
      if (r.sleepDuration >= settings.targetSleepMinutes) durationDays++;
      if (timeToMinutes(r.bedTime) <= targetBedtimeMinutes) bedtimeDays++;
    }
    return {
      durationDays,
      durationRate: formatPercent(durationDays, filtered.length, 0),
      durationRateNum: Math.round((durationDays / filtered.length) * 100),
      bedtimeDays,
      bedtimeRate: formatPercent(bedtimeDays, filtered.length, 0),
      bedtimeRateNum: Math.round((bedtimeDays / filtered.length) * 100),
      total: filtered.length,
    };
  }, [filtered, settings]);

  const insights = useMemo(() => {
    type InsightIcon = "trendingUp" | "trendingDown" | "award" | "alert";
    const result: { text: string; icon: InsightIcon; color: string }[] = [];
    const prevWeekRange = getPrevWeekRange();

    if (period === "week") {
      const prevSleepRecords = sleepRecords.filter(
        (r) => r.date >= prevWeekRange.start && r.date <= prevWeekRange.end
      );
      if (prevSleepRecords.length >= 2 && filtered.length >= 2) {
        const prevAvg =
          prevSleepRecords.reduce((s, r) => s + r.sleepDuration, 0) /
          prevSleepRecords.length;
        const currAvg =
          filtered.reduce((s, r) => s + r.sleepDuration, 0) / filtered.length;
        const diff = Math.round(currAvg - prevAvg);
        if (diff >= 30) {
          result.push({
            text: `本周平均睡眠比上周多 ${diff} 分钟，睡眠质量提升明显！`,
            icon: "trendingUp",
            color: "text-emerald-400",
          });
        } else if (diff <= -30) {
          result.push({
            text: `本周平均睡眠比上周少 ${-diff} 分钟，建议早点休息`,
            icon: "trendingDown",
            color: "text-red-400",
          });
        }
      }
    }

    const range = period === "week" ? getWeekRange() : getMonthRange();
    const periodDreams = dreamRecords.filter(
      (d) => d.date >= range.start && d.date <= range.end
    );
    const joinedData: { sleep: (typeof filtered)[number]; dream?: (typeof periodDreams)[number] }[] = [];
    for (const s of filtered) {
      joinedData.push({ sleep: s, dream: periodDreams.find((d) => d.date === s.date) });
    }
    const stressDays = joinedData.filter((j) => j.sleep.factors.includes("压力"));
    const nonStressDays = joinedData.filter((j) => !j.sleep.factors.includes("压力"));
    if (stressDays.length >= 2 && nonStressDays.length >= 2) {
      const stressAnxiety = stressDays.filter(
        (j) => j.dream && j.dream.emotions.includes("焦虑")
      ).length;
      const nonStressAnxiety = nonStressDays.filter(
        (j) => j.dream && j.dream.emotions.includes("焦虑")
      ).length;
      const stressRate = stressAnxiety / stressDays.length;
      const nonStressRate = nonStressAnxiety / nonStressDays.length;
      const diffPp = Math.round((stressRate - nonStressRate) * 100);
      if (diffPp >= 15) {
        result.push({
          text: `压力标签出现后，焦虑梦境占比高出 ${diffPp}pp，建议关注压力调节`,
          icon: "alert",
          color: "text-amber-400",
        });
      }
    }

    const caffeineDays = filtered.filter(
      (r) => r.factors.includes("咖啡") || r.factors.includes("茶")
    );
    const nonCaffeineDays = filtered.filter(
      (r) => !r.factors.includes("咖啡") && !r.factors.includes("茶")
    );
    if (caffeineDays.length >= 2 && nonCaffeineDays.length >= 2) {
      const caffeineAvg =
        caffeineDays.reduce((s, r) => s + r.sleepDuration, 0) / caffeineDays.length;
      const nonCaffeineAvg =
        nonCaffeineDays.reduce((s, r) => s + r.sleepDuration, 0) /
        nonCaffeineDays.length;
      const diff = Math.round(nonCaffeineAvg - caffeineAvg);
      if (diff >= 30) {
        result.push({
          text: `含咖啡因日比不含日平均少睡 ${diff} 分钟`,
          icon: "alert",
          color: "text-amber-400",
        });
      }
    }

    if (targetMetrics.durationRateNum >= 80) {
      result.push({
        text: `太棒了！睡眠时长达标率 ${targetMetrics.durationRate}，继续保持！`,
        icon: "award",
        color: "text-stargold",
      });
    } else if (targetMetrics.durationRateNum < 50 && filtered.length >= 3) {
      result.push({
        text: `睡眠达标率仅 ${targetMetrics.durationRate}，试着提前 30 分钟上床试试`,
        icon: "alert",
        color: "text-aurora",
      });
    }

    if (period === "week" && filtered.length >= 5) {
      result.push({
        text: `本周已连续记录 ${filtered.length} 天，记录习惯养成中！`,
        icon: "award",
        color: "text-emerald-400",
      });
    } else if (period === "month" && filtered.length >= 20) {
      result.push({
        text: `本月已记录 ${filtered.length} 天，非常自律！`,
        icon: "award",
        color: "text-emerald-400",
      });
    }

    return result;
  }, [filtered, sleepRecords, dreamRecords, period, targetMetrics]);

  const handleSaveSettings = () => {
    updateSettings({
      targetSleepMinutes: editTargetMinutes,
      targetBedtime: editTargetBedtime,
    });
    setShowSettings(false);
  };

  useEffect(() => {
    const canvas = heatmapRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, cssW, cssH);

    const maxFreq = Math.max(1, ...heatmapFreq.flat());
    const padLeft = 48;
    const padTop = 28;
    const padRight = 16;
    const padBottom = 8;
    const cellW = (cssW - padLeft - padRight) / 7;
    const cellH = (cssH - padTop - padBottom) / 6;
    const gap = 3;

    ctx.fillStyle = "rgba(226,232,240,0.5)";
    ctx.font = "11px Noto Sans SC, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";

    for (let col = 0; col < 7; col++) {
      const x = padLeft + col * cellW + cellW / 2;
      ctx.fillText(WEEKDAY_LABELS[col], x, padTop - 6);
    }

    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let row = 0; row < 6; row++) {
      const y = padTop + row * cellH + cellH / 2;
      ctx.fillText(TIME_SLOTS[row], padLeft - 8, y);
    }

    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 7; col++) {
        const x = padLeft + col * cellW + gap;
        const y = padTop + row * cellH + gap;
        const w = cellW - gap * 2;
        const h = cellH - gap * 2;
        const freq = heatmapFreq[row][col];
        const t = freq / maxFreq;

        if (freq === 0) {
          ctx.fillStyle = "rgba(255,255,255,0.03)";
        } else {
          ctx.fillStyle = lerpColor(t);
        }

        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 4);
        ctx.fill();
      }
    }
  }, [heatmapFreq]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <h2 className="section-title">趋势看板</h2>
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-white/40" />
          <button
            className={period === "week" ? "btn-primary" : "btn-ghost"}
            onClick={() => setPeriod("week")}
          >
            本周
          </button>
          <button
            className={period === "month" ? "btn-primary" : "btn-ghost"}
            onClick={() => setPeriod("month")}
          >
            本月
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white/80 transition-colors"
          >
            <Settings size={14} />
            <span className="hidden sm:inline">目标设置</span>
          </button>
        </div>
      </div>

      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Target size={18} className="text-stargold" />
          <span className="text-white/80 font-medium">🎯 睡眠目标达标率</span>
        </div>
        {targetMetrics.total === 0 ? (
          <p className="text-white/40 text-sm">暂无记录数据</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-white/50 mb-1">
                睡眠时长达标 (目标 {settings.targetSleepMinutes / 60} 小时)
              </p>
              <p className="text-2xl font-bold bg-gradient-to-r from-stargold to-aurora bg-clip-text text-transparent mb-2">
                {targetMetrics.durationRate}
              </p>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-stargold to-aurora rounded-full transition-all duration-500"
                  style={{ width: `${targetMetrics.durationRateNum}%` }}
                />
              </div>
              <p className="text-xs text-white/40 mt-1">
                {targetMetrics.durationDays}/{targetMetrics.total} 天
              </p>
            </div>
            <div>
              <p className="text-xs text-white/50 mb-1">
                入睡时间达标 (目标 {settings.targetBedtime})
              </p>
              <p className="text-2xl font-bold bg-gradient-to-r from-dream-purple to-aurora bg-clip-text text-transparent mb-2">
                {targetMetrics.bedtimeRate}
              </p>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-dream-purple to-aurora rounded-full transition-all duration-500"
                  style={{ width: `${targetMetrics.bedtimeRateNum}%` }}
                />
              </div>
              <p className="text-xs text-white/40 mt-1">
                {targetMetrics.bedtimeDays}/{targetMetrics.total} 天
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="glass-card p-5 w-full overflow-x-auto">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} className="text-dream-purple" />
          <span className="text-white/80 font-medium">平均睡眠时长曲线</span>
        </div>
        {filtered.length >= 3 ? (
          <div className="h-64 min-w-[480px]">
            <Line data={durationChart} options={chartOptions} />
          </div>
        ) : (
          <EmptyState
            title="睡眠趋势暂无数据"
            description="至少记录 3 天睡眠后可查看趋势"
          />
        )}
      </div>

      <div className="glass-card p-5 w-full overflow-x-auto">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={18} className="text-stargold" />
          <span className="text-white/80 font-medium">入睡时间漂移热力图</span>
        </div>
        {filtered.length >= 3 ? (
          <div style={{ minWidth: 480 }}>
            <canvas
              ref={heatmapRef}
              className="w-full"
              style={{ height: 260, minHeight: 240 }}
            />
          </div>
        ) : (
          <EmptyState
            title="入睡热力图暂无数据"
            description="积累更多睡眠记录后将展示入睡时间分布"
          />
        )}
      </div>

      <div className="glass-card p-5 w-full overflow-x-auto">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} className="text-aurora" />
          <span className="text-white/80 font-medium">睡眠效率变化趋势</span>
        </div>
        {filtered.length >= 3 ? (
          <div className="h-64 min-w-[480px]">
            <Line data={efficiencyChart} options={chartOptions} />
          </div>
        ) : (
          <EmptyState
            title="睡眠效率暂无数据"
            description="持续记录可查看睡眠效率变化趋势"
          />
        )}
      </div>

      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb size={18} className="text-stargold" />
          <span className="text-white/80 font-medium">💡 睡眠洞察结论</span>
        </div>
        {insights.length === 0 ? (
          <p className="text-white/40 text-sm">
            继续积累更多记录，洞察结论将自动生成
          </p>
        ) : (
          <div className="space-y-3">
            {insights.map((insight, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <div className={`mt-0.5 flex-shrink-0 ${insight.color}`}>
                  {insight.icon === "trendingUp" && <TrendingUp size={16} />}
                  {insight.icon === "trendingDown" && <TrendingDown size={16} />}
                  {insight.icon === "award" && <Award size={16} />}
                  {insight.icon === "alert" && <AlertCircle size={16} />}
                </div>
                <p className="text-sm text-white/70 leading-relaxed">
                  {insight.text}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glass-card w-[360px] max-w-[90vw] p-6 relative">
            <button
              onClick={() => setShowSettings(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white/70 transition-colors"
            >
              <X size={18} />
            </button>
            <h3 className="section-title text-lg mb-4">睡眠目标设置</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-white/60 block mb-1">
                  目标睡眠时长（小时）
                </label>
                <select
                  className="input-field w-full"
                  value={editTargetMinutes}
                  onChange={(e) => setEditTargetMinutes(Number(e.target.value))}
                >
                  <option value={360}>6 小时</option>
                  <option value={390}>6.5 小时</option>
                  <option value={420}>7 小时</option>
                  <option value={450}>7.5 小时</option>
                  <option value={480}>8 小时</option>
                  <option value={510}>8.5 小时</option>
                  <option value={540}>9 小时</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-white/60 block mb-1">
                  目标入睡时间
                </label>
                <input
                  type="time"
                  className="input-field w-full"
                  value={editTargetBedtime}
                  onChange={(e) => setEditTargetBedtime(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={handleSaveSettings}
                className="btn-primary"
              >
                保存
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="btn-ghost ml-2"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
