type GroupId = 'math' | 'physics' | 'programming';
type SubjectInfo = { id: string; name: string; teacher: string };

export const getAvailableChoices = async () => {
  return JSON.parse(
    '[{"id":"math","subjects":[{"id":"math-1","name":"Математический анализ","teacher":"Иванова Г. Ю."},{"id":"math-2","name":"Линейная алгебра и геометрия","teacher":"Смирнов М. В."},{"id":"math-3","name":"Дискретная математика","teacher":"Павлов С. Н."},{"id":"math-4","name":"Теория вероятностей и статистика","teacher":"Морозова Е. А."}]},{"id":"physics","subjects":[{"id":"physics-1","name":"Физика (механика)","teacher":"Белов О. И."},{"id":"physics-2","name":"Физика (электричество и магнетизм)","teacher":"Кузнецова Т. С."}]},{"id":"programming","subjects":[{"id":"programming-1","name":"Программирование на Python","teacher":"Петренко Д. А."},{"id":"programming-2","name":"Введение в алгоритмы и структуры данных","teacher":"Романова А. В."},{"id":"programming-3","name":"Основы веб‑разработки","teacher":"Попов И. М."}]}]',
  ) as { id: GroupId; subjects: SubjectInfo[] }[];
};
