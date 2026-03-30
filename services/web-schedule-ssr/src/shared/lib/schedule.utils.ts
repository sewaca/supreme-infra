/** Format Date as YYYY-MM-DD in local timezone (avoids UTC shift from toISOString) */
function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getWeekRange(date: Date): { dateFrom: string; dateTo: string } {
  const d = new Date(date);
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  const saturday = new Date(monday);
  saturday.setDate(monday.getDate() + 5);

  return { dateFrom: toDateStr(monday), dateTo: toDateStr(saturday) };
}

/** Initial SSR load: current week ±1 (3 weeks total). Further data lazy-loaded client-side. */
export function getExtendedRange(dateFrom: string): { extendedFrom: string; extendedTo: string } {
  const d = new Date(`${dateFrom}T12:00:00`); // noon to avoid DST edge cases
  const from = new Date(d);
  from.setDate(d.getDate() - 7);
  const to = new Date(d);
  to.setDate(d.getDate() + 13);
  return { extendedFrom: toDateStr(from), extendedTo: toDateStr(to) };
}
