from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.schedule_override import ScheduleOverride
from app.models.schedule_template import ScheduleTemplate
from app.models.semester import Semester
from app.models.session_event import SessionEvent
from app.schemas.schedule import DaySchedule, LessonSlot
from app.schemas.session_event import SessionEventResponse
from app.schemas.template import DayTemplate, TemplateResponse, TemplateSlotResponse

DAY_NAMES = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"]


def _week_number(d: date, anchor: date) -> int:
    """Determine which week (1 or 2) a date falls in relative to the cycle anchor."""
    delta_days = (d - anchor).days
    return (delta_days // 7) % 2 + 1


def _time_str(t) -> str:
    return t.strftime("%H:%M") if t else ""


def _slot_to_response(t: ScheduleTemplate) -> TemplateSlotResponse:
    return TemplateSlotResponse(
        id=t.id,
        semester_id=t.semester_id,
        week_number=t.week_number,
        day_of_week=t.day_of_week,
        slot_number=t.slot_number,
        start_time=_time_str(t.start_time),
        end_time=_time_str(t.end_time),
        subject_name=t.subject_name,
        lesson_type=t.lesson_type,
        teacher_name=t.teacher_name,
        group_name=t.group_name,
        classroom_name=t.classroom_name,
    )


def _session_to_response(e: SessionEvent) -> SessionEventResponse:
    return SessionEventResponse(
        id=e.id,
        semester_id=e.semester_id,
        date=e.date,
        slot_number=e.slot_number,
        start_time=_time_str(e.start_time),
        end_time=_time_str(e.end_time),
        subject_name=e.subject_name,
        lesson_type=e.lesson_type,
        teacher_name=e.teacher_name,
        group_name=e.group_name,
        classroom_name=e.classroom_name,
    )


async def get_active_semester(db: AsyncSession) -> Semester | None:
    result = await db.execute(select(Semester).where(Semester.is_active.is_(True)).limit(1))
    return result.scalar_one_or_none()


async def get_semester_by_id(db: AsyncSession, semester_id) -> Semester | None:
    result = await db.execute(select(Semester).where(Semester.id == semester_id))
    return result.scalar_one_or_none()


async def resolve_group_schedule(
    db: AsyncSession, group_name: str, date_from: date, date_to: date, semester: Semester
) -> list[DaySchedule]:
    templates = (
        (
            await db.execute(
                select(ScheduleTemplate).where(
                    ScheduleTemplate.semester_id == semester.id,
                    ScheduleTemplate.group_name == group_name,
                )
            )
        )
        .scalars()
        .all()
    )

    overrides = (
        (
            await db.execute(
                select(ScheduleOverride).where(
                    ScheduleOverride.semester_id == semester.id,
                    ScheduleOverride.group_name == group_name,
                    ScheduleOverride.date >= date_from,
                    ScheduleOverride.date <= date_to,
                )
            )
        )
        .scalars()
        .all()
    )

    session_events = (
        (
            await db.execute(
                select(SessionEvent).where(
                    SessionEvent.semester_id == semester.id,
                    SessionEvent.group_name == group_name,
                    SessionEvent.date >= date_from,
                    SessionEvent.date <= date_to,
                )
            )
        )
        .scalars()
        .all()
    )

    return _assemble_calendar(templates, overrides, session_events, date_from, date_to, semester)


async def resolve_teacher_schedule(
    db: AsyncSession, teacher_name: str, date_from: date, date_to: date, semester: Semester
) -> list[DaySchedule]:
    templates = (
        (
            await db.execute(
                select(ScheduleTemplate).where(
                    ScheduleTemplate.semester_id == semester.id,
                    ScheduleTemplate.teacher_name == teacher_name,
                )
            )
        )
        .scalars()
        .all()
    )

    overrides_q = select(ScheduleOverride).where(
        ScheduleOverride.semester_id == semester.id,
        ScheduleOverride.date >= date_from,
        ScheduleOverride.date <= date_to,
    )
    all_overrides = (await db.execute(overrides_q)).scalars().all()

    # For teacher view, we need overrides that either:
    # 1. Cancel a slot where the teacher was teaching (need to match via template)
    # 2. Replace a slot with this teacher as new_teacher_name
    template_keys = {(t.week_number, t.day_of_week, t.slot_number, t.group_name) for t in templates}
    relevant_overrides = []
    for ov in all_overrides:
        wn = _week_number(ov.date, semester.cycle_anchor_date)
        dow = ov.date.weekday()
        key = (wn, dow, ov.slot_number, ov.group_name)
        if key in template_keys or ov.new_teacher_name == teacher_name:
            relevant_overrides.append(ov)

    session_events = (
        (
            await db.execute(
                select(SessionEvent).where(
                    SessionEvent.semester_id == semester.id,
                    SessionEvent.teacher_name == teacher_name,
                    SessionEvent.date >= date_from,
                    SessionEvent.date <= date_to,
                )
            )
        )
        .scalars()
        .all()
    )

    return _assemble_calendar(templates, relevant_overrides, session_events, date_from, date_to, semester)


def _assemble_calendar(
    templates: list[ScheduleTemplate],
    overrides: list[ScheduleOverride],
    session_events: list[SessionEvent],
    date_from: date,
    date_to: date,
    semester: Semester,
) -> list[DaySchedule]:
    # Index templates by (week_number, day_of_week)
    tmpl_by_day: dict[tuple[int, int], list[ScheduleTemplate]] = {}
    for t in templates:
        key = (t.week_number, t.day_of_week)
        tmpl_by_day.setdefault(key, []).append(t)

    # Index overrides by (date, slot_number, group_name)
    override_map: dict[tuple[date, int, str], ScheduleOverride] = {}
    for ov in overrides:
        override_map[(ov.date, ov.slot_number, ov.group_name)] = ov

    # Index session events by date
    events_by_date: dict[date, list[SessionEvent]] = {}
    for ev in session_events:
        events_by_date.setdefault(ev.date, []).append(ev)

    days: list[DaySchedule] = []
    current = date_from
    while current <= date_to:
        dow = current.weekday()
        if dow == 6:  # Skip Sunday
            current += timedelta(days=1)
            continue

        wn = _week_number(current, semester.cycle_anchor_date)
        day_templates = tmpl_by_day.get((wn, dow), [])

        lessons: list[LessonSlot] = []
        for t in day_templates:
            ov = override_map.get((current, t.slot_number, t.group_name))
            if ov is not None:
                if ov.action == "cancel":
                    continue
                if ov.action == "replace":
                    lessons.append(
                        LessonSlot(
                            slot_number=t.slot_number,
                            start_time=_time_str(ov.new_start_time or t.start_time),
                            end_time=_time_str(ov.new_end_time or t.end_time),
                            subject_name=ov.new_subject_name or t.subject_name,
                            lesson_type=ov.new_lesson_type or t.lesson_type,
                            teacher_name=ov.new_teacher_name if ov.new_teacher_name is not None else t.teacher_name,
                            group_name=t.group_name,
                            classroom_name=ov.new_classroom_name
                            if ov.new_classroom_name is not None
                            else t.classroom_name,
                            is_override=True,
                            override_comment=ov.comment,
                        )
                    )
                    continue
            lessons.append(
                LessonSlot(
                    slot_number=t.slot_number,
                    start_time=_time_str(t.start_time),
                    end_time=_time_str(t.end_time),
                    subject_name=t.subject_name,
                    lesson_type=t.lesson_type,
                    teacher_name=t.teacher_name,
                    group_name=t.group_name,
                    classroom_name=t.classroom_name,
                )
            )

        # Add session events for this date
        for ev in events_by_date.get(current, []):
            lessons.append(  # noqa: PERF401
                LessonSlot(
                    slot_number=ev.slot_number,
                    start_time=_time_str(ev.start_time),
                    end_time=_time_str(ev.end_time),
                    subject_name=ev.subject_name,
                    lesson_type=ev.lesson_type,
                    teacher_name=ev.teacher_name,
                    group_name=ev.group_name,
                    classroom_name=ev.classroom_name,
                )
            )

        lessons.sort(key=lambda l: (l.slot_number or 0, l.start_time))  # noqa: E741

        if lessons:
            days.append(
                DaySchedule(
                    date=current,
                    day_of_week=dow,
                    day_name=DAY_NAMES[dow],
                    lessons=lessons,
                )
            )

        current += timedelta(days=1)

    return days


async def get_group_template(db: AsyncSession, group_name: str, semester: Semester) -> TemplateResponse:
    templates = (
        (
            await db.execute(
                select(ScheduleTemplate)
                .where(
                    ScheduleTemplate.semester_id == semester.id,
                    ScheduleTemplate.group_name == group_name,
                )
                .order_by(ScheduleTemplate.week_number, ScheduleTemplate.day_of_week, ScheduleTemplate.slot_number)
            )
        )
        .scalars()
        .all()
    )

    return _build_template_response(templates, semester)


async def get_teacher_template(db: AsyncSession, teacher_name: str, semester: Semester) -> TemplateResponse:
    templates = (
        (
            await db.execute(
                select(ScheduleTemplate)
                .where(
                    ScheduleTemplate.semester_id == semester.id,
                    ScheduleTemplate.teacher_name == teacher_name,
                )
                .order_by(ScheduleTemplate.week_number, ScheduleTemplate.day_of_week, ScheduleTemplate.slot_number)
            )
        )
        .scalars()
        .all()
    )

    return _build_template_response(templates, semester)


def _build_template_response(templates: list[ScheduleTemplate], semester: Semester) -> TemplateResponse:
    week_1_days: dict[int, list[TemplateSlotResponse]] = {}
    week_2_days: dict[int, list[TemplateSlotResponse]] = {}

    for t in templates:
        resp = _slot_to_response(t)
        target = week_1_days if t.week_number == 1 else week_2_days
        target.setdefault(t.day_of_week, []).append(resp)

    def build_days(day_map: dict[int, list[TemplateSlotResponse]]) -> list[DayTemplate]:
        return [
            DayTemplate(day_of_week=dow, day_name=DAY_NAMES[dow], slots=slots) for dow, slots in sorted(day_map.items())
        ]

    return TemplateResponse(
        semester_id=semester.id,
        semester_name=semester.name,
        week_1=build_days(week_1_days),
        week_2=build_days(week_2_days),
    )


async def get_group_exams(db: AsyncSession, group_name: str, semester: Semester) -> list[SessionEventResponse]:
    events = (
        (
            await db.execute(
                select(SessionEvent)
                .where(
                    SessionEvent.semester_id == semester.id,
                    SessionEvent.group_name == group_name,
                )
                .order_by(SessionEvent.date, SessionEvent.start_time)
            )
        )
        .scalars()
        .all()
    )

    return [_session_to_response(e) for e in events]


async def get_teacher_exams(db: AsyncSession, teacher_name: str, semester: Semester) -> list[SessionEventResponse]:
    events = (
        (
            await db.execute(
                select(SessionEvent)
                .where(
                    SessionEvent.semester_id == semester.id,
                    SessionEvent.teacher_name == teacher_name,
                )
                .order_by(SessionEvent.date, SessionEvent.start_time)
            )
        )
        .scalars()
        .all()
    )

    return [_session_to_response(e) for e in events]
