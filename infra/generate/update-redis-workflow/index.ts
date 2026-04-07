import * as fs from 'node:fs';
import * as path from 'node:path';
import * as yaml from 'yaml';

export function updateRedisWorkflow(): void {
  console.log('→ Starting Redis workflow update');

  const projectRoot = path.join(__dirname, '../../..');
  const redisDir = path.join(projectRoot, 'infra/redis');

  if (!fs.existsSync(redisDir)) {
    console.log('⚠️  No infra/redis directory found, skipping');
    return;
  }

  const instanceNames: string[] = [];

  for (const entry of fs.readdirSync(redisDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const serviceYamlPath = path.join(redisDir, entry.name, 'service.yaml');
    if (fs.existsSync(serviceYamlPath)) {
      instanceNames.push(entry.name);
    }
  }

  if (instanceNames.length === 0) {
    console.log('⚠️  No Redis instances found, skipping workflow update');
    return;
  }

  instanceNames.sort();

  console.log(`→ Found ${instanceNames.length} Redis instance(s): ${instanceNames.join(', ')}`);

  const workflowPath = path.join(projectRoot, '.github/workflows/deploy-redis.yml');
  const workflowContent = fs.readFileSync(workflowPath, 'utf-8');
  const workflow = yaml.parseDocument(workflowContent);

  const redisTargetInput = workflow.getIn(['on', 'workflow_dispatch', 'inputs', 'redis_target']) as
    | yaml.YAMLMap
    | undefined;

  if (redisTargetInput && yaml.isMap(redisTargetInput)) {
    redisTargetInput.set('options', instanceNames);
    redisTargetInput.set('default', instanceNames[0]);
  }

  fs.writeFileSync(workflowPath, workflow.toString(), 'utf-8');

  console.log('✓ Updated: .github/workflows/deploy-redis.yml');
  console.log(`→   Instances: ${instanceNames.join(', ')}`);
  console.log(`→   Default: ${instanceNames[0]}`);
}
