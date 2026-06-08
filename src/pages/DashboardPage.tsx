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
import { TrendingUp, Calendar } from "lucide-react";
import { useSleepStore } from "@/stores";
import { getWeekRange, getMonthRange } from "@/utils/calc";

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
  const { records, fetchRecords } = useSleepStore();
  const heatmapRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const filtered = useMemo(() => {
    const range = period === "week" ? getWeekRange() : getMonthRange();
    return records
      .filter((r) => r.date >= range.start && r.date <= range.end)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [records, period]);

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
      <div className="flex items-center justify-between">
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
        </div>
      </div>

      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} className="text-dream-purple" />
          <span className="text-white/80 font-medium">平均睡眠时长曲线</span>
        </div>
        <div className="h-64">
          <Line data={durationChart} options={chartOptions} />
        </div>
      </div>

      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={18} className="text-stargold" />
          <span className="text-white/80 font-medium">入睡时间漂移热力图</span>
        </div>
        <canvas
          ref={heatmapRef}
          className="w-full"
          style={{ height: 260 }}
        />
      </div>

      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} className="text-aurora" />
          <span className="text-white/80 font-medium">睡眠效率变化趋势</span>
        </div>
        <div className="h-64">
          <Line data={efficiencyChart} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}
