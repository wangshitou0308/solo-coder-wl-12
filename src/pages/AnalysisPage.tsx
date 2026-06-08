import { useState, useMemo, useEffect } from "react";
import { Chart as ChartJS, registerables } from "chart.js";
import { Scatter, Bar } from "react-chartjs-2";
import { BarChart3, Calendar } from "lucide-react";
import {
  DREAM_TYPES,
  DREAM_TYPE_COLORS,
  DreamType,
  SleepRecord,
  DreamRecord,
} from "@/types";
import { useSleepStore, useDreamStore } from "@/stores";
import { isLateBedtime } from "@/utils/calc";

ChartJS.register(...registerables);

const DREAM_TYPE_INDEX: Record<DreamType, number> = {
  清晰梦: 1,
  噩梦: 2,
  反复梦: 3,
  预知梦: 4,
  普通梦: 5,
};

type TimeRange = 7 | 30;

export default function AnalysisPage() {
  const [range, setRange] = useState<TimeRange>(7);
  const sleepRecords = useSleepStore((s) => s.records);
  const dreamRecords = useDreamStore((s) => s.records);
  const fetchSleep = useSleepStore((s) => s.fetchRecords);
  const fetchDream = useDreamStore((s) => s.fetchRecords);

  useEffect(() => {
    fetchSleep();
    fetchDream();
  }, []);

  const cutoffDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - range);
    return d.toISOString().split("T")[0];
  }, [range]);

  const joinedData = useMemo(() => {
    const sleepMap = new Map<string, SleepRecord>();
    for (const r of sleepRecords) {
      if (r.date >= cutoffDate) sleepMap.set(r.date, r);
    }
    const result: { sleep: SleepRecord; dream: DreamRecord }[] = [];
    for (const d of dreamRecords) {
      if (d.date >= cutoffDate) {
        const sleep = sleepMap.get(d.date);
        if (sleep) result.push({ sleep, dream: d });
      }
    }
    return result;
  }, [sleepRecords, dreamRecords, cutoffDate]);

  const scatterData = useMemo(() => {
    const datasets = DREAM_TYPES.map((type) => ({
      label: type,
      data: joinedData
        .filter((j) => j.dream.dreamType === type)
        .map((j) => ({
          x: j.sleep.sleepDuration / 60,
          y: DREAM_TYPE_INDEX[type],
        })),
      backgroundColor: DREAM_TYPE_COLORS[type],
      borderColor: DREAM_TYPE_COLORS[type],
      pointRadius: 6,
      pointHoverRadius: 8,
    }));
    return { datasets };
  }, [joinedData]);

  const barData = useMemo(() => {
    const caffeineYes = joinedData.filter((j) =>
      j.sleep.factors.some((f) => f === "咖啡" || f === "茶")
    );
    const caffeineNo = joinedData.filter(
      (j) => !j.sleep.factors.some((f) => f === "咖啡" || f === "茶")
    );
    const lateBed = joinedData.filter(
      (j) => isLateBedtime(j.sleep.bedTime)
    );
    const earlyBed = joinedData.filter(
      (j) => !isLateBedtime(j.sleep.bedTime)
    );

    const labels = [
      "咖啡因摄入日",
      "无咖啡因日",
      "凌晨1-6点入睡",
      "正常时间入睡",
    ];
    const groups = [caffeineYes, caffeineNo, lateBed, earlyBed];

    const datasets = DREAM_TYPES.map((type) => ({
      label: type,
      data: groups.map(
        (g) => g.filter((j) => j.dream.dreamType === type).length
      ),
      backgroundColor: DREAM_TYPE_COLORS[type],
    }));

    return { labels, datasets };
  }, [joinedData]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="section-title flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          关联分析
        </h2>
        <div className="flex gap-2">
          {([7, 30] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                range === r
                  ? "bg-indigo-500/30 text-indigo-300 border border-indigo-400/40"
                  : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              最近{r}天
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="text-white/90 font-medium mb-4">
          睡眠时长 vs 梦境类型
        </h3>
        {joinedData.length > 0 ? (
          <Scatter
            data={scatterData}
            options={{
              responsive: true,
              plugins: {
                legend: { labels: { color: "#94a3b8" } },
                tooltip: {
                  callbacks: {
                    label: (ctx) => {
                      const type = DREAM_TYPES[ctx.datasetIndex];
                      return `${type}: ${ctx.parsed.x.toFixed(1)}h`;
                    },
                  },
                },
              },
              scales: {
                x: {
                  title: {
                    display: true,
                    text: "睡眠时长（小时）",
                    color: "#94a3b8",
                  },
                  ticks: { color: "#94a3b8" },
                  grid: { color: "rgba(148,163,184,0.1)" },
                },
                y: {
                  title: {
                    display: true,
                    text: "梦境类型",
                    color: "#94a3b8",
                  },
                  ticks: {
                    color: "#94a3b8",
                    stepSize: 1,
                    callback: (v: string | number) => {
                      const numV = Number(v);
                      const match = DREAM_TYPES.find(
                        (t) => DREAM_TYPE_INDEX[t] === numV
                      );
                      return match ?? "";
                    },
                  },
                  min: 0.5,
                  max: 5.5,
                  grid: { color: "rgba(148,163,184,0.1)" },
                },
              },
            }}
          />
        ) : (
          <p className="text-slate-500 text-center py-8">暂无足够数据</p>
        )}
      </div>

      <div className="glass-card p-6">
        <h3 className="text-white/90 font-medium mb-4">
          影响因素与噩梦/清晰梦概率
        </h3>
        {joinedData.length > 0 ? (
          <Bar
            data={barData}
            options={{
              responsive: true,
              plugins: {
                legend: { labels: { color: "#94a3b8" } },
              },
              scales: {
                x: {
                  ticks: { color: "#94a3b8" },
                  grid: { color: "rgba(148,163,184,0.1)" },
                  stacked: true,
                },
                y: {
                  ticks: { color: "#94a3b8" },
                  grid: { color: "rgba(148,163,184,0.1)" },
                  stacked: true,
                },
              },
            }}
          />
        ) : (
          <p className="text-slate-500 text-center py-8">暂无足够数据</p>
        )}
      </div>
    </div>
  );
}
