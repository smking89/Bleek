const timeFmt = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });
const dayFmt = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" });
const shortDayFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

export function timeLabel(ts: number): string {
  return timeFmt.format(new Date(ts));
}

export function dayKey(ts: number): string {
  return new Date(ts).toDateString();
}

export function dayLabel(ts: number): string {
  const date = new Date(ts);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return shortDayFmt.format(date);
}

export function fullTimeLabel(ts: number): string {
  const date = new Date(ts);
  const today = new Date();
  const sameYear = date.getFullYear() === today.getFullYear();
  const label = sameYear ? shortDayFmt.format(date) : dayFmt.format(date);
  return `${label} at ${timeLabel(ts)}`;
}

export function isSameDay(a: number, b: number): boolean {
  return dayKey(a) === dayKey(b);
}

export function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 45_000) return "just now";
  const minutes = Math.round(diff / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}
