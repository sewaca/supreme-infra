"""add_test_data

Revision ID: 001
Revises: 
Create Date: 2026-03-10 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Test user ID for all test data
    test_user_id = '550e8400-e29b-41d4-a716-446655440000'
    
    # Insert test user settings
    op.execute(f"""
        INSERT INTO user_settings (id, user_id, is_new_message_notifications_enabled, is_schedule_change_notifications_enabled, telegram_token, vk_token)
        VALUES (
            '11111111-1111-1111-1111-111111111111',
            '{test_user_id}',
            TRUE,
            TRUE,
            NULL,
            NULL
        )
        ON CONFLICT (user_id) DO NOTHING;
    """)
    
    # Insert test student stats
    op.execute(f"""
        INSERT INTO student_stats (id, user_id, course, faculty, specialty, "group", average_grade, education_form, university, start_year, end_year, student_card_number)
        VALUES (
            '22222222-2222-2222-2222-222222222222',
            '{test_user_id}',
            4,
            'ИТПИ',
            '09.03.04 - Программная инженерия',
            'ИКПИ-25',
            4.75,
            'Очная',
            'Университет телекоммуникаций',
            2022,
            2026,
            'СТ-2022-12345'
        )
        ON CONFLICT (user_id) DO NOTHING;
    """)
    
    # Insert test rating level
    op.execute(f"""
        INSERT INTO rating_level (id, user_id, level, current_xp)
        VALUES (
            '33333333-3333-3333-3333-333333333333',
            '{test_user_id}',
            'advanced',
            850
        )
        ON CONFLICT (user_id) DO NOTHING;
    """)
    
    # Insert test ranking positions
    op.execute(f"""
        INSERT INTO ranking_position (id, user_id, ranking_type, position, total, percentile)
        VALUES 
            ('44444444-4444-4444-4444-444444444444', '{test_user_id}', 'byCourse', 5, 120, 95.83),
            ('44444444-4444-4444-4444-444444444445', '{test_user_id}', 'byFaculty', 15, 500, 97.00),
            ('44444444-4444-4444-4444-444444444446', '{test_user_id}', 'byUniversity', 42, 5000, 99.16);
    """)
    
    # Insert test achievements
    op.execute(f"""
        INSERT INTO user_achievement (id, user_id, achievement_id, unlocked, unlocked_at, progress, max_progress, times_earned)
        VALUES 
            ('55555555-5555-5555-5555-555555555555', '{test_user_id}', 'excellent_student', TRUE, '2025-12-15 10:00:00+00', 1, 1, 2),
            ('55555555-5555-5555-5555-555555555556', '{test_user_id}', 'perfect_attendance', TRUE, '2025-11-01 10:00:00+00', 1, 1, 1),
            ('55555555-5555-5555-5555-555555555557', '{test_user_id}', 'quick_learner', FALSE, NULL, 7, 10, 0);
    """)
    
    # Insert test streak
    op.execute(f"""
        INSERT INTO streak (id, user_id, current, best, last_updated)
        VALUES (
            '66666666-6666-6666-6666-666666666666',
            '{test_user_id}',
            15,
            42,
            '2026-03-10 08:00:00+00'
        )
        ON CONFLICT (user_id) DO NOTHING;
    """)
    
    # Insert test grades
    op.execute(f"""
        INSERT INTO user_grade (id, user_id, subject, grade, grade_type, grade_date)
        VALUES 
            ('77777777-7777-7777-7777-777777777777', '{test_user_id}', 'Математический анализ', 5.0, 'exam', '2026-01-20 10:00:00+00'),
            ('77777777-7777-7777-7777-777777777778', '{test_user_id}', 'Программирование', 5.0, 'exam', '2026-01-22 14:00:00+00'),
            ('77777777-7777-7777-7777-777777777779', '{test_user_id}', 'Базы данных', 4.0, 'exam', '2026-01-25 10:00:00+00'),
            ('77777777-7777-7777-7777-77777777777a', '{test_user_id}', 'Английский язык', 5.0, 'credit', '2026-01-18 12:00:00+00');
    """)
    
    # Insert test subject choice
    op.execute(f"""
        INSERT INTO subject_choice (id, choice_id, deadline_date, is_active)
        VALUES (
            'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
            'math_electives_2026',
            '2026-04-01 23:59:59+00',
            TRUE
        )
        ON CONFLICT (choice_id) DO NOTHING;
    """)
    
    # Insert test user subject priorities
    op.execute(f"""
        INSERT INTO user_subject_priority (id, user_id, choice_id, subject_id, priority)
        VALUES 
            ('cccccccc-cccc-cccc-cccc-cccccccccccc', '{test_user_id}', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'math-1', 0),
            ('cccccccc-cccc-cccc-cccc-cccccccccccd', '{test_user_id}', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'math-3', 1),
            ('cccccccc-cccc-cccc-cccc-ccccccccccce', '{test_user_id}', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'math-2', 2);
    """)


def downgrade() -> None:
    test_user_id = '550e8400-e29b-41d4-a716-446655440000'
    
    op.execute(f"DELETE FROM user_subject_priority WHERE user_id = '{test_user_id}';")
    op.execute(f"DELETE FROM subject_choice WHERE choice_id = 'math_electives_2026';")
    op.execute(f"DELETE FROM user_grade WHERE user_id = '{test_user_id}';")
    op.execute(f"DELETE FROM streak WHERE user_id = '{test_user_id}';")
    op.execute(f"DELETE FROM user_achievement WHERE user_id = '{test_user_id}';")
    op.execute(f"DELETE FROM ranking_position WHERE user_id = '{test_user_id}';")
    op.execute(f"DELETE FROM rating_level WHERE user_id = '{test_user_id}';")
    op.execute(f"DELETE FROM student_stats WHERE user_id = '{test_user_id}';")
    op.execute(f"DELETE FROM user_settings WHERE user_id = '{test_user_id}';")
