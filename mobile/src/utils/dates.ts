// Local-timezone date helpers (avoid UTC off-by-one from toISOString)

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseISODate(s: string): Date {
  return new Date(`${s}T00:00:00`);
}

export function mondayOf(d: Date): Date {
  const copy = new Date(d);
  const offset = (copy.getDay() + 6) % 7; // 0 for Monday
  copy.setDate(copy.getDate() - offset);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function weekLabel(weekStart: Date): string {
  const thisMonday = mondayOf(new Date());
  const diffDays = Math.round(
    (weekStart.getTime() - thisMonday.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays === 0) return 'This Week';
  if (diffDays === -7) return 'Last Week';
  if (diffDays === 7) return 'Next Week';
  const end = addDays(weekStart, 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${fmt(weekStart)} – ${fmt(end)}`;
}

export function dayIndexToday(weekStart: Date): number | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
  return diff >= 0 && diff <= 6 ? diff : null;
}
