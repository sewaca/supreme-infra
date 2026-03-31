import { i18n } from '@supreme-int/i18n/src/i18n';
import type { DriveStep } from 'driver.js';

export const getRatingTourSteps = (): DriveStep[] => [
  {
    element: '[data-tour="student-stats"]',
    popover: {
      title: i18n('Информация о студенте'),
      description: i18n('Здесь отображается основная информация: курс, факультет, средний балл и форма обучения.'),
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="level-progress"]',
    popover: {
      title: i18n('Уровень студента'),
      description: i18n(
        'Твой уровень растёт от Новичка до Легенды. Шкала показывает, сколько XP осталось до следующего звания.',
      ),
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="level-progress"]',
    popover: {
      title: i18n('Как начисляется XP?'),
      description: i18n(
        'XP складывается из трёх источников:<br><br>• Средний балл × 200 — чем выше оценки, тем больше опыта<br>• Каждое разблокированное достижение +50 XP<br>• Каждый день серии без пропусков +10 XP',
      ),
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="streak-card"]',
    popover: {
      title: i18n('Серия без пропусков'),
      description: i18n('Поддерживай серию дней без пропусков! Чем длиннее серия, тем больше опыта ты получаешь.'),
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="ranking-cards"]',
    popover: {
      title: i18n('Твоя позиция в рейтинге'),
      description: i18n(
        'Смотри свою позицию по курсу, факультету, университету, специальности и посещаемости. Цвет и значок зависят от процентиля.',
      ),
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '[data-tour="achievements"]',
    popover: {
      title: i18n('Достижения'),
      description: i18n(
        'Получай достижения за академические успехи! Цифра в углу показывает, сколько раз ты получил это достижение.',
      ),
      side: 'top',
      align: 'center',
    },
  },
  {
    popover: {
      title: i18n('Продолжай в том же духе!'),
      description: i18n('Улучшай свои показатели, получай достижения и поднимайся в рейтинге. Удачи в учёбе!'),
      side: 'bottom',
      align: 'center',
    },
  },
];
