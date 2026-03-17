import { generateDatabaseValues } from './generate-database-values';
import { generateValuesForAllServices } from './generate-overrides/generate-overrides';
import { generatePgbouncerValues } from './generate-pgbouncer-values';
import { generateRouterConfigs } from './generate-router';
import { updateCdWorkflow } from './update-cd-workflow';
import { updateDatabaseWorkflow } from './update-database-workflow';
import { updateIngressValues } from './update-ingress-values';
import { updatePgbouncerWorkflow } from './update-pgbouncer-workflow';
import { updateSecurityChecks } from './update-security-checks';

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🚀 Supreme Infrastructure Generator');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  console.log('📋 Step 1/9: Generating router configurations...');
  console.log('───────────────────────────────────────────────────────────');
  await generateRouterConfigs();
  console.log('');

  console.log('📋 Step 2/9: Updating ingress values...');
  console.log('───────────────────────────────────────────────────────────');
  updateIngressValues();
  console.log('');

  console.log('📋 Step 3/9: Updating security checks...');
  console.log('───────────────────────────────────────────────────────────');
  updateSecurityChecks();
  console.log('');

  console.log('📋 Step 4/9: Updating CD workflow...');
  console.log('───────────────────────────────────────────────────────────');
  updateCdWorkflow();
  console.log('');

  console.log('📋 Step 5/9: Updating database workflow...');
  console.log('───────────────────────────────────────────────────────────');
  updateDatabaseWorkflow();
  console.log('');

  console.log('📋 Step 6/9: Updating PgBouncer workflow...');
  console.log('───────────────────────────────────────────────────────────');
  updatePgbouncerWorkflow();
  console.log('');

  console.log('📋 Step 7/9: Generating database values...');
  console.log('───────────────────────────────────────────────────────────');
  generateDatabaseValues();
  console.log('');

  console.log('📋 Step 8/9: Generating PgBouncer values...');
  console.log('───────────────────────────────────────────────────────────');
  generatePgbouncerValues();
  console.log('');

  console.log('📋 Step 9/9: Generating service values files...');
  console.log('───────────────────────────────────────────────────────────');
  generateValuesForAllServices();
  console.log('');

  console.log('═══════════════════════════════════════════════════════════');
  console.log('✅ All generation tasks completed successfully!');
  console.log('═══════════════════════════════════════════════════════════');

  process.exit(0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
