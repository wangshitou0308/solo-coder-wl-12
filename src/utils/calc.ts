export function calculateSleepDuration(bedTime: string, wakeTime: string): number {
  const [bh, bm] = bedTime.split(":").map(Number);
  const [wh, wm] = wakeTime.split(":").map(Number);
  let bedMinutes = bh * 60 + bm;
  let wakeMinutes = wh * 60 + wm;
  if (wakeMinutes <= bedMinutes) {
    wakeMinutes += 24 * 60;
  }
  return wakeMinutes - bedMinutes;
}

export function calculateSleepEfficiency(
  sleepDurationMinutes: number,
  fallAsleepMinutes: number
): number {
  if (sleepDurationMinutes <= 0) return 0;
  const totalTimeInBed = sleepDurationMinutes + fallAsleepMinutes;
  return Math.round((sleepDurationMinutes / totalTimeInBed) * 100);
}

export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}分钟`;
  if (m === 0) return `${h}小时`;
  return `${h}小时${m}分钟`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
  return `${month}月${day}日 周${weekdays[d.getDay()]}`;
}

export function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

export function getWeekRange(): { start: string; end: string } {
  const now = new Date();
  const day = now.getDay() || 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - day + 1);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday.toISOString().split("T")[0],
    end: sunday.toISOString().split("T")[0],
  };
}

export function getMonthRange(date?: Date): { start: string; end: string } {
  const d = date || new Date();
  const year = d.getFullYear();
  const month = d.getMonth();
  const start = new Date(year, month, 1).toISOString().split("T")[0];
  const end = new Date(year, month + 1, 0).toISOString().split("T")[0];
  return { start, end };
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

export function extractKeywords(text: string): Map<string, number> {
  const stopWords = new Set([
    "的", "了", "在", "是", "我", "有", "和", "就", "不", "人", "都", "一", "一个",
    "上", "也", "很", "到", "说", "要", "去", "你", "会", "着", "没有", "看", "好",
    "自己", "这", "他", "她", "它", "们", "那", "些", "什么", "怎么", "又", "或",
    "但", "而", "如果", "所以", "因为", "然后", "可以", "这个", "那个", "里",
    "中", "下", "吗", "吧", "啊", "呢", "还", "把", "被", "让", "给", "从",
    "向", "对", "与", "为", "以", "及", "等", "之", "其", "如", "地", "得",
  ]);

  const words = new Map<string, number>();
  const segments = text.match(/[\u4e00-\u9fff]{2,4}/g) || [];
  for (const seg of segments) {
    for (let len = 2; len <= Math.min(4, seg.length); len++) {
      for (let i = 0; i <= seg.length - len; i++) {
        const word = seg.substring(i, i + len);
        if (!stopWords.has(word)) {
          words.set(word, (words.get(word) || 0) + 1);
        }
      }
    }
  }
  return words;
}

export function getBedtimeHour(bedTime: string): number {
  const [h] = bedTime.split(":").map(Number);
  return h;
}
