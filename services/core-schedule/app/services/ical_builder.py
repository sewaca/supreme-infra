from app.schemas.schedule import DaySchedule


def _fmt_dt(d, time_str: str) -> str:
    """Format date + HH:MM time string to iCal datetime: 20260327T090000"""
    return d.strftime("%Y%m%d") + "T" + time_str.replace(":", "") + "00"


def _escape(value: str) -> str:
    """Escape special chars for iCal text fields."""
    return value.replace("\\", "\\\\").replace(";", "\\;").replace(",", "\\,").replace("\n", "\\n")


def build_ical(days: list[DaySchedule], calendar_name: str, uid_suffix: str) -> str:
    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Supreme Infra//core-schedule//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        f"X-WR-CALNAME:{_escape(calendar_name)}",
        "X-WR-TIMEZONE:Europe/Moscow",
    ]

    for day in days:
        for lesson in day.lessons:
            slot_num = lesson.slot_number or 0
            uid = f"{day.date.isoformat()}-{slot_num}-{uid_suffix}@core-schedule"
            dtstart = _fmt_dt(day.date, lesson.start_time)
            dtend = _fmt_dt(day.date, lesson.end_time)
            summary = f"{_escape(lesson.subject_name)} [{_escape(lesson.lesson_type)}]"
            teacher = lesson.teacher_name or "-"
            classroom = lesson.classroom_name or "-"
            description = _escape(f"Преподаватель: {teacher}\nАудитория: {classroom}")  # noqa: RUF001
            location = _escape(lesson.classroom_name or "")

            lines += [
                "BEGIN:VEVENT",
                f"UID:{uid}",
                f"DTSTART;TZID=Europe/Moscow:{dtstart}",
                f"DTEND;TZID=Europe/Moscow:{dtend}",
                f"SUMMARY:{summary}",
                f"DESCRIPTION:{description}",
                f"LOCATION:{location}",
                "STATUS:CONFIRMED",
                "END:VEVENT",
            ]

    lines.append("END:VCALENDAR")
    return "\r\n".join(lines) + "\r\n"
