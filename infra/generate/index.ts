import { generateValuesForAllServices } from './generate-overrides/generate-overrides';
import { generateRouterConfigs } from './generate-router';
import { updateCdWorkflow } from './update-cd-workflow';
import { updateIngressValues } from './update-ingress-values';
import { updateSecurityChecks } from './update-security-checks';

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🚀 Supreme Infrastructure Generator');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  console.log('📋 Step 1/5: Generating router configurations...');
  console.log('───────────────────────────────────────────────────────────');
  await generateRouterConfigs();
  console.log('');

  console.log('📋 Step 2/5: Updating ingress values...');
  console.log('───────────────────────────────────────────────────────────');
  updateIngressValues();
  console.log('');

  console.log('📋 Step 3/5: Updating security checks...');
  console.log('───────────────────────────────────────────────────────────');
  updateSecurityChecks();
  console.log('');

  console.log('📋 Step 4/5: Updating CD workflow...');
  console.log('───────────────────────────────────────────────────────────');
  updateCdWorkflow();
  console.log('');

  console.log('📋 Step 5/5: Generating values files...');
  console.log('───────────────────────────────────────────────────────────');
  generateValuesForAllServices();
  console.log('');

  console.log('═══════════════════════════════════════════════════════════');
  console.log('✅ All generation tasks completed successfully!');
  console.log('═══════════════════════════════════════════════════════════');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
