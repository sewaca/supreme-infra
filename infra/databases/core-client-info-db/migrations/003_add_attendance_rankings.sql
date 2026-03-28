-- Migration: Add per-scope attendance rankings for test user

INSERT INTO ranking_position (id, user_id, ranking_type, position, total, percentile)
VALUES
    ('44444444-4444-4444-4444-444444444449', '550e8400-e29b-41d4-a716-446655440000', 'byAttendanceCourse', 5, 120, 95.83),
    ('44444444-4444-4444-4444-44444444444a', '550e8400-e29b-41d4-a716-446655440000', 'byAttendanceFaculty', 22, 450, 95.11),
    ('44444444-4444-4444-4444-44444444444b', '550e8400-e29b-41d4-a716-446655440000', 'byAttendanceUniversity', 80, 2500, 96.80),
    ('44444444-4444-4444-4444-44444444444c', '550e8400-e29b-41d4-a716-446655440000', 'byAttendanceSpecialty', 10, 200, 95.00)
ON CONFLICT (user_id, ranking_type) DO NOTHING;
