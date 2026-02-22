type KeysetString = Record<string, string>;
export type Language = 'ru' | 'en';
export type KeysetDictionary = Record<Language, KeysetString>;

export const dictionary: KeysetDictionary = {
  en: {
    'order.field.comment': 'Comment',
    'order.field.startDate': 'Start Date',
    'order.field.endDate': 'End Date',
    'order.field.educationForm': 'Education Form',
    'order.field.educationType': 'Education Type',
    'order.field.direction': 'Direction/Specialty',
    'order.field.faculty': 'Faculty',
    'order.field.course': 'Course',
    'order.field.group': 'Group',
    'order.field.qualification': 'Qualification',
  },
  ru: {
    'order.field.comment': 'Комментарий',
    'order.field.startDate': 'Дата начала действия',
    'order.field.endDate': 'Дата окончания действия',
    'order.field.educationForm': 'Форма обучения',
    'order.field.educationType': 'Тип обучения',
    'order.field.direction': 'Направление/Специальность',
    'order.field.faculty': 'Факультет',
    'order.field.course': 'Курс',
    'order.field.group': 'Группа',
    'order.field.qualification': 'Квалификация',
  },
};
