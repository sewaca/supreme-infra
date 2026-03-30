/**
 * Kubernetes rejects ConfigMaps larger than 1 MiB (whole object, including keys).
 * We pack migration files into multiple maps so each stays under a safe budget.
 */
/** Leave room for YAML quoting/indent when Helm renders the ConfigMap (total object must stay under 1 MiB). */
export const K8S_CONFIGMAP_DATA_BUDGET_BYTES = 520_000;

export function splitMigrationsIntoConfigMapParts(migrations: Record<string, string>): Record<string, string>[] {
  const entries = Object.entries(migrations).sort(([a], [b]) => a.localeCompare(b));
  if (entries.length === 0) {
    return [];
  }

  const parts: Record<string, string>[] = [];
  let current: Record<string, string> = {};
  let currentSize = 0;

  for (const [filename, content] of entries) {
    const entrySize = filename.length + content.length + 96;

    if (entrySize > 1_048_576) {
      console.warn(
        `  ⚠ Migration "${filename}" alone exceeds 1 MiB; Kubernetes ConfigMap will still reject it. Split the SQL file or use another delivery path.`,
      );
    }

    if (currentSize > 0 && currentSize + entrySize > K8S_CONFIGMAP_DATA_BUDGET_BYTES) {
      parts.push(current);
      current = {};
      currentSize = 0;
    }
    current[filename] = content;
    currentSize += entrySize;
  }

  if (Object.keys(current).length > 0) {
    parts.push(current);
  }

  if (parts.length > 1) {
    console.log(`  ✓ Split migrations into ${parts.length} ConfigMap part(s) (Kubernetes 1 MiB limit)`);
  }

  return parts;
}
