# Rating System — Mock Data Format & Sync

## Тестовый пользователь

```
user_id: 550e8400-e29b-41d4-a716-446655440000
```

---

## Уровни (Levels)

Конфиг уровней является источником правды. Он продублирован в двух местах — они **должны оставаться идентичными**:

- Frontend: `services/web-profile-ssr/src/entities/Rating/levelConfig.ts`
- Backend: `services/core-client-info/app/routers/rating.py` → `_LEVEL_CONFIGS`

| level        | title       | min_xp | color   |
| ------------ | ----------- | ------ | ------- |
| novice       | Новичок     | 0      | #9E9E9E |
| beginner     | Начинающий  | 100    | #8BC34A |
| intermediate | Продвинутый | 300    | #2196F3 |
| advanced     | Опытный     | 600    | #9C27B0 |
| expert       | Эксперт     | 1000   | #FF9800 |
| master       | Мастер      | 1500   | #F44336 |
| legend       | Легенда     | 2500   | #D4AF37 |

### XP-формула (расчёт нового XP при обновлении)

```
xp = (average_grade × 200) + (unlocked_achievements_count × 50) + (streak_days × 10)
```

### Mock: `rating_level`

```sql
level = 'expert'
current_xp = 1300
-- (4.75 × 200) + (4 × 50) + (15 × 10) = 950 + 200 + 150 = 1300
```

---

## Достижения (Achievements)

Метаданные (title, description, icon) — только на фронте:
`services/web-profile-ssr/src/entities/Rating/achievementsConfig.ts`

БД хранит только прогресс и статус разблокировки.

| achievement_id    | title            | description                                  | icon | max_progress | тип прогресса |
| ----------------- | ---------------- | -------------------------------------------- | ---- | ------------ | ------------- |
| excellent_student | Отличник         | Средний балл 4.6 и выше                      | 🏆   | 1            | boolean       |
| unstoppable       | Неудержимый      | Вошёл в топ 10% по посещаемости за всё время | 🔥   | 1            | boolean       |
| top_1_percent     | Топ 1%           | Вошёл в топ 1% по университету               | 👑   | 100          | процент       |
| first_try         | С первого раза   | Сдал все экзамены с первого раза             | 🎯   | 100          | процент       |
| perfectionist     | Перфекционист    | Средний балл 5.0 за сессию                   | 💎   | 100          | процент       |
| group_leader      | Староста         | Является старостой группы                    | ⭐   | 1            | boolean       |
| communicative     | Коммуникабельный | Вошёл в топ 5% по сообщениям в ЛК            | 💬   | 100          | процент       |
| early_bird        | Ранняя пташка    | Ни разу не пропустил первую пару за семестр  | 🌅   | 1            | boolean       |
| iron_man          | Железный человек | Посещаемость 100% за семестр                 | 🦾   | 100          | процент       |

### Mock: `user_achievement`

| achievement_id    | unlocked | progress | max_progress | times_earned |
| ----------------- | -------- | -------- | ------------ | ------------ |
| excellent_student | true     | 1        | 1            | 3            |
| unstoppable       | true     | 1        | 1            | 1            |
| top_1_percent     | false    | 45       | 100          | 0            |
| first_try         | false    | 60       | 100          | 0            |
| perfectionist     | false    | 30       | 100          | 0            |
| group_leader      | true     | 1        | 1            | 2            |
| communicative     | false    | 70       | 100          | 0            |
| early_bird        | true     | 1        | 1            | 4            |
| iron_man          | false    | 15       | 100          | 0            |

Unlocked-ачивки (times_earned >= 1) учитываются в XP-формуле: **4 разблокированных = +200 XP**.

---

## Рейтинговые позиции

### Mock: `ranking_position`

| ranking_type | position | total | percentile |
| ------------ | -------- | ----- | ---------- |
| byCourse     | 3        | 120   | 97.50      |
| byFaculty    | 15       | 450   | 96.67      |
| byUniversity | 45       | 2500  | 98.20      |
| bySpecialty  | 8        | 200   | 96.00      |
| byAttendance | 12       | 120   | 90.00      |

---

## Streak

### Mock: `streak`

```
current = 15   ← учитывается в XP: 15 × 10 = 150 XP
best    = 28
```

---

## Формат API-ответа `/rating/level`

```json
{
  "level": "expert",
  "current_xp": 1300,
  "title": "Эксперт",
  "color": "#FF9800",
  "next_level_xp": 1500
}
```

`title`, `color`, `next_level_xp` вычисляются бэкендом из `_LEVEL_CONFIGS` — не хранятся в БД.

---

## Правила синхронизации

1. При изменении порогов XP — обновить обе копии (`levelConfig.ts` и `_LEVEL_CONFIGS` в роутере) одним PR.
2. При добавлении новой ачивки — добавить запись в `achievementsConfig.ts` (title/description/icon) + вставить строку в `user_achievement` в миграции.
3. XP в БД для тестового пользователя пересчитывается при каждом изменении формулы: `grep -r "calculateXPFromGrades"` и обновить `002_fix_rating_mock_data.sql`.
