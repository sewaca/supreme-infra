type GroupId = 'math' | 'physics' | 'programming';

export const getUserPriorities = async () => {
  return JSON.parse(
    '{"math":["math-3","math-2","math-1","math-4"],"programming":["programming-3","programming-2","programming-1"]}',
  ) as Partial<Record<GroupId, string[]>>;
};
