import * as fs from 'node:fs';
import * as prettier from 'prettier';
import * as yamlPlugin from 'prettier/plugins/yaml';

/**
 * Formats a workflow YAML file with Prettier so output matches `pnpm format`.
 * The `yaml` package's `Document#toString()` uses its own serialization style
 * (e.g. spaces inside `[ a, b ]`, line breaks), which Prettier then rewrites and
 * causes noisy diffs.
 *
 * Programmatic `prettier.format` must load the YAML plugin and merged config
 * explicitly — otherwise output differs from `pnpm exec prettier` (CLI loads
 * plugins and config in one path; the bare API does not).
 */
export async function formatWorkflowYamlWithPrettier(filePath: string): Promise<void> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const config = await prettier.resolveConfig(filePath);
  if (config === null) {
    throw new Error(`Prettier: no config found for ${filePath}`);
  }
  const plugin = (yamlPlugin as { default?: prettier.Plugin }).default ?? (yamlPlugin as unknown as prettier.Plugin);
  const formatted = await prettier.format(content, {
    ...config,
    filepath: filePath,
    plugins: [plugin],
  });
  fs.writeFileSync(filePath, formatted, 'utf-8');
}
