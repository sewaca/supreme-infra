import * as fs from 'node:fs';
import * as prettier from 'prettier';

/**
 * Formats a workflow YAML file with Prettier so output matches `pnpm format`.
 * The `yaml` package's `Document#toString()` uses its own serialization style
 * (e.g. spaces inside `[ a, b ]`, line breaks), which Prettier then rewrites and
 * causes noisy diffs.
 */
export async function formatWorkflowYamlWithPrettier(filePath: string): Promise<void> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const formatted = await prettier.format(content, { filepath: filePath });
  fs.writeFileSync(filePath, formatted, 'utf-8');
}
