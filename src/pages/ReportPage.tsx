import { useState, useMemo, useEffect, useRef } from "react";
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
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  Moon,
  Activity,
  BookOpen,
  Heart,
  Download,
} from "lucide-react";
import { useSleepStore, useDreamStore } from "@/stores";
import { DREAM_EMOTIONS, DREAM_EMOTION_COLORS } from "@/types";
import { getMonthRange, formatMinutes } from "@/utils/calc";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip
);

export default function ReportPage() {
  const [monthOffset, setMonthOffset] = useState(0);
  const reportRef = useRef<HTMLDivElement>(null);
  const sleepRecords = useSleepStore((s) => s.records);
  const dreamRecords = useDreamStore((s) => s.records);
  const fetchSleep = useSleepStore((s) => s.fetchRecords);
  const fetchDream = useDreamStore((s) => s.fetchRecords);

  useEffect(() => {
    fetchSleep();
    fetchDream();
  }, []);

  const targetDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);

  const range = useMemo(() => getMonthRange(targetDate), [targetDate]);

  const monthLabel = useMemo(() => {
    return `${targetDate.getFullYear()}年${targetDate.getMonth() + 1}月`;
  }, [targetDate]);

  const filteredSleep = useMemo(() => {
    return sleepRecords.filter(
      (r) => r.date >= range.start && r.date <= range.end
    );
  }, [sleepRecords, range]);

  const filteredDream = useMemo(() => {
    return dreamRecords.filter(
      (r) => r.date >= range.start && r.date <= range.end
    );
  }, [dreamRecords, range]);

  const avgDuration = useMemo(() => {
    if (filteredSleep.length === 0) return 0;
    const total = filteredSleep.reduce((s, r) => s + r.sleepDuration, 0);
    return total / filteredSleep.length;
  }, [filteredSleep]);

  const avgEfficiency = useMemo(() => {
    if (filteredSleep.length === 0) return 0;
    const total = filteredSleep.reduce((s, r) => s + r.sleepEfficiency, 0);
    return Math.round(total / filteredSleep.length);
  }, [filteredSleep]);

  const dreamDays = filteredDream.length;

  const topEmotion = useMemo(() => {
    if (filteredDream.length === 0) return "无";
    const counts = new Map<string, number>();
    for (const d of filteredDream) {
      for (const e of d.emotions) {
        counts.set(e, (counts.get(e) || 0) + 1);
      }
    }
    let max = 0;
    let result = "无";
    counts.forEach((v, k) => {
      if (v > max) { max = v; result = k; }
    });
    return result;
  }, [filteredDream]);

  const hasNightmares = useMemo(() => {
    return filteredDream.some((d) => d.dreamType === "噩梦");
  }, [filteredDream]);

  const hasCaffeineCorrelation = useMemo(() => {
    const caffeineSleep = filteredSleep.filter((r) =>
      r.factors.some((f) => f === "咖啡" || f === "茶")
    );
    if (caffeineSleep.length === 0) return false;
    const avgCaffeine =
      caffeineSleep.reduce((s, r) => s + r.sleepDuration, 0) /
      caffeineSleep.length;
    return avgCaffeine < avgDuration;
  }, [filteredSleep, avgDuration]);

  const suggestions = useMemo(() => {
    const items: string[] = [];
    if (avgDuration > 0 && avgDuration < 420) {
      items.push("建议提前30分钟上床，确保充足睡眠时间");
    }
    if (avgEfficiency > 0 && avgEfficiency < 85) {
      items.push("入睡耗时较长，尝试减少睡前蓝光暴露");
    }
    if (hasNightmares) {
      items.push("噩梦频发，建议记录压力来源并尝试放松训练");
    }
    if (hasCaffeineCorrelation) {
      items.push("咖啡因可能影响睡眠，建议下午2点后避免摄入");
    }
    if (items.length === 0) {
      items.push("睡眠状况良好，继续保持健康作息！");
    }
    return items;
  }, [avgDuration, avgEfficiency, hasNightmares, hasCaffeineCorrelation]);

  const chartData = useMemo(() => {
    const sorted = [...filteredSleep].sort((a, b) =>
      a.date.localeCompare(b.date)
    );
    const labels = sorted.map((r) => {
      const d = new Date(r.date);
      return `${d.getMonth() + 1}/${d.getDate()}`;
    });
    return {
      labels,
      datasets: [
        {
          data: sorted.map((r) => +(r.sleepDuration / 60).toFixed(1)),
          borderColor: "#8B5CF6",
          backgroundColor: "rgba(139,92,246,0.15)",
          fill: true,
          tension: 0.4,
          pointRadius: 2,
          borderWidth: 2,
        },
      ],
    };
  }, [filteredSleep]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(15,10,26,0.85)",
          titleColor: "#FFD700",
          bodyColor: "#e2e8f0",
          cornerRadius: 8,
          padding: 8,
        },
      },
      scales: {
        x: {
          ticks: { color: "#94a3b8", font: { size: 10 } },
          grid: { color: "rgba(255,255,255,0.05)" },
          border: { display: false },
        },
        y: {
          ticks: { color: "#94a3b8", font: { size: 10 } },
          grid: { color: "rgba(255,255,255,0.05)" },
          border: { display: false },
          title: { display: true, text: "小时", color: "#94a3b8", font: { size: 10 } },
        },
      },
    }),
    []
  );

  const handleExport = async () => {
    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current, {
      scale: 2,
      backgroundColor: null,
    });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = (canvas.height * pdfW) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);
    pdf.save(`DreamLog_${monthLabel}_睡眠报告.pdf`);
  };

  const stats = [
    {
      icon: <Moon size={18} />,
      label: "平均睡眠时长",
      value: avgDuration > 0 ? formatMinutes(Math.round(avgDuration)) : "--",
      color: "text-indigo-400",
    },
    {
      icon: <Activity size={18} />,
      label: "平均睡眠效率",
      value: avgEfficiency > 0 ? `${avgEfficiency}%` : "--",
      color: "text-cyan-400",
    },
    {
      icon: <BookOpen size={18} />,
      label: "梦境记录天数",
      value: dreamDays > 0 ? `${dreamDays}天` : "--",
      color: "text-amber-400",
    },
    {
      icon: <Heart size={18} />,
      label: "高频情绪",
      value: topEmotion,
      color:
        topEmotion !== "无" ? DREAM_EMOTION_COLORS[topEmotion as typeof DREAM_EMOTIONS[number]] : "text-slate-400",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="section-title flex items-center gap-2">
          <FileText className="w-5 h-5" />
          月度报告
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMonthOffset((o) => o - 1)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-white/80 font-medium min-w-[120px] text-center">
            {monthLabel}
          </span>
          <button
            onClick={() => setMonthOffset((o) => o + 1)}
            disabled={monthOffset >= 0}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div
        ref={reportRef}
        className="glass-card p-8"
        style={{ background: "rgba(255,255,255,0.03)" }}
      >
        <div className="text-center mb-8">
          <h3 className="text-xl font-bold text-white/90">
            DreamLog 月度睡眠报告
          </h3>
          <p className="text-white/50 text-sm mt-1">{monthLabel}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl p-4"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              <div className={`flex items-center gap-2 mb-2 ${s.color}`}>
                {s.icon}
                <span className="text-xs text-white/50">{s.label}</span>
              </div>
              <p className="text-lg font-bold text-white/90">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="mb-8">
          <h4 className="text-white/70 text-sm font-medium mb-3">
            睡眠时长趋势
          </h4>
          <div style={{ height: 200 }}>
            {filteredSleep.length > 0 ? (
              <Line data={chartData} options={chartOptions} />
            ) : (
              <p className="text-slate-500 text-center py-8 text-sm">
                本月暂无睡眠数据
              </p>
            )}
          </div>
        </div>

        <div className="mb-8">
          <h4 className="text-white/70 text-sm font-medium mb-3">
            改善建议
          </h4>
          <ul className="space-y-2">
            {suggestions.map((s, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-white/70"
              >
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                {s}
              </li>
            ))}
          </ul>
        </div>

        <div className="text-center text-white/30 text-xs pt-6 border-t border-white/5">
          <p>由 DreamLog 生成</p>
          <p className="mt-0.5">{new Date().toLocaleDateString("zh-CN")}</p>
        </div>
      </div>

      <div className="flex justify-center">
        <button onClick={handleExport} className="btn-primary flex items-center gap-2">
          <Download size={16} />
          导出 PDF
        </button>
      </div>
    </div>
  );
}
