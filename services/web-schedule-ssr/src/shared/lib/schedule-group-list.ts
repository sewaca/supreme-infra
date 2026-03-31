/** Normalizes API payloads that must be a JSON array of group name strings. */
export function parseGroupNameList(data: unknown): string[] {
  if (!Array.isArray(data)) return [];
  return data.filter((g): g is string => typeof g === 'string');
}

/** Union of groups from profile DB, schedule templates, and the viewer's profile.group. */
export function mergeScheduleGroupOptions(
  fromUserTable: string[],
  fromScheduleTemplates: string[],
  profileGroup: string | null | undefined,
): string[] {
  const s = new Set<string>([...fromUserTable, ...fromScheduleTemplates]);
  if (profileGroup) s.add(profileGroup);
  return [...s].sort((a, b) => a.localeCompare(b, 'ru'));
}
