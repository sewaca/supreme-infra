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

const LESSON_TYPE_COLORS: Record<string, { bg: string; border: string }> = {
  lecture: { bg: '#1976d2', border: '#1565c0' },
  лекция: { bg: '#1976d2', border: '#1565c0' },
  seminar: { bg: '#388e3c', border: '#2e7d32' },
  семинар: { bg: '#388e3c', border: '#2e7d32' },
  lab: { bg: '#7b1fa2', border: '#6a1b9a' },
  лаб: { bg: '#7b1fa2', border: '#6a1b9a' },
  практика: { bg: '#7b1fa2', border: '#6a1b9a' },
};

function getLessonColor(lessonType: string): { bg: string; border: string } {
  const key = lessonType.toLowerCase();
  for (const [pattern, colors] of Object.entries(LESSON_TYPE_COLORS)) {
    if (key.includes(pattern)) return colors;
  }
  return { bg: '#757575', border: '#616161' };
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
        backgroundColor: lesson.is_override ? '#d32f2f' : colors.bg,
        borderColor: lesson.is_override ? '#b71c1c' : colors.border,
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

export function getWeekRange(date: Date): { dateFrom: string; dateTo: string } {
  const d = new Date(date);
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  const saturday = new Date(monday);
  saturday.setDate(monday.getDate() + 5);

  return {
    dateFrom: monday.toISOString().slice(0, 10),
    dateTo: saturday.toISOString().slice(0, 10),
  };
}
