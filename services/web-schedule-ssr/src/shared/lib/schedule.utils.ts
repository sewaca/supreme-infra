import type { DaySchedule } from '@supreme-int/api-client/src/generated/core-schedule';

export type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor?: string;
  borderColor?: string;
  extendedProps: {
    teacher_name: string | null;
    classroom_name: string | null;
    lesson_type: string;
    is_override: boolean;
    override_comment?: string | null;
    group_name: string;
  };
};

/** Pastel palette — light backgrounds with colored left-border */
const LESSON_TYPE_COLORS: Record<string, { bg: string; border: string }> = {
  lecture: { bg: '#e3f2fd', border: '#64b5f6' },
  лекция: { bg: '#e3f2fd', border: '#64b5f6' },
  seminar: { bg: '#e8f5e9', border: '#81c784' },
  семинар: { bg: '#e8f5e9', border: '#81c784' },
  практ: { bg: '#e8f5e9', border: '#81c784' },
  lab: { bg: '#fce4ec', border: '#f48fb1' },
  лаб: { bg: '#fce4ec', border: '#f48fb1' },
};

function getLessonColor(lessonType: string): { bg: string; border: string } {
  const key = lessonType.toLowerCase();
  for (const [pattern, colors] of Object.entries(LESSON_TYPE_COLORS)) {
    if (key.includes(pattern)) return colors;
  }
  return { bg: '#f5f5f5', border: '#e0e0e0' };
}

/** Darker shade for lesson-type chip text in list view */
export const LESSON_TYPE_CHIP_COLORS: Record<string, string> = {
  lecture: '#1565c0',
  лекция: '#1565c0',
  seminar: '#2e7d32',
  семинар: '#2e7d32',
  практ: '#2e7d32',
  lab: '#ad1457',
  лаб: '#ad1457',
};

export function getLessonChipColor(lessonType: string): string {
  const key = lessonType.toLowerCase();
  for (const [pattern, color] of Object.entries(LESSON_TYPE_CHIP_COLORS)) {
    if (key.includes(pattern)) return color;
  }
  return '#616161';
}

export function scheduleToEvents(schedule: DaySchedule[]): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  for (const day of schedule) {
    for (const lesson of day.lessons) {
      const colors = getLessonColor(lesson.lesson_type);
      events.push({
        id: `${day.date}-${lesson.slot_number}-${lesson.group_name}`,
        title: lesson.subject_name,
        start: `${day.date}T${lesson.start_time}`,
        end: `${day.date}T${lesson.end_time}`,
        backgroundColor: lesson.is_override ? '#ffebee' : colors.bg,
        borderColor: lesson.is_override ? '#ef9a9a' : colors.border,
        extendedProps: {
          teacher_name: lesson.teacher_name,
          classroom_name: lesson.classroom_name,
          lesson_type: lesson.lesson_type,
          is_override: lesson.is_override ?? false,
          override_comment: lesson.override_comment,
          group_name: lesson.group_name,
        },
      });
    }
  }
  return events;
}

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
