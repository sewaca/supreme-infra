import { generateValuesForAllServices } from './generate-overrides/generate-overrides';
import { generateRouterConfigs } from './generate-router';
import { updateCdWorkflow } from './update-cd-workflow';
import { updateSecurityChecks } from './update-security-checks';

console.log('═══════════════════════════════════════════════════════════');
console.log('🚀 Supreme Infrastructure Generator');
console.log('═══════════════════════════════════════════════════════════');
console.log('');

console.log('📋 Step 1/4: Generating router configurations...');
console.log('───────────────────────────────────────────────────────────');
generateRouterConfigs();
console.log('');

console.log('📋 Step 2/4: Updating security checks...');
console.log('───────────────────────────────────────────────────────────');
updateSecurityChecks();
console.log('');

console.log('📋 Step 3/4: Updating CD workflow...');
console.log('───────────────────────────────────────────────────────────');
updateCdWorkflow();
console.log('');

console.log('📋 Step 4/4: Generating values files...');
console.log('───────────────────────────────────────────────────────────');
generateValuesForAllServices();
console.log('');

console.log('═══════════════════════════════════════════════════════════');
console.log('✅ All generation tasks completed successfully!');
console.log('═══════════════════════════════════════════════════════════');
