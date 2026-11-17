import type { OpeningHours } from "@/data/nearby-places";

export function isOpenNow(openingHours: OpeningHours, now = new Date()): boolean {
  const schedule = openingHours.daily.trim();
  if (/all day|24 hours/i.test(schedule)) return true;
  const range = schedule.match(/(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/);
  if (!range) return false;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Tashkent", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(now);
  const hour = Number(parts.find(({ type }) => type === "hour")?.value ?? 0);
  const minute = Number(parts.find(({ type }) => type === "minute")?.value ?? 0);
  const currentMinutes = hour * 60 + minute;
  const opens = Number(range[1]) * 60 + Number(range[2]);
  const closes = Number(range[3]) * 60 + Number(range[4]);
  return closes >= opens ? currentMinutes >= opens && currentMinutes < closes : currentMinutes >= opens || currentMinutes < closes;
}
