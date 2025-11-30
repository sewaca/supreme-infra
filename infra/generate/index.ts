import { updateSecurityChecks } from '../generate-service/update-security-checks';
import { updateCdWorkflow } from '../generate-service/update-cd-workflow';
import { generateValuesForAllServices } from '../generate-values/generate-values';

console.log('═══════════════════════════════════════════════════════════');
console.log('🚀 Supreme Infrastructure Generator');
console.log('═══════════════════════════════════════════════════════════');
console.log('');

console.log('📋 Step 1/3: Updating security checks...');
console.log('───────────────────────────────────────────────────────────');
updateSecurityChecks();
console.log('');

console.log('📋 Step 2/3: Updating CD workflow...');
console.log('───────────────────────────────────────────────────────────');
updateCdWorkflow();
console.log('');

console.log('📋 Step 3/3: Generating values files...');
console.log('───────────────────────────────────────────────────────────');
generateValuesForAllServices();
console.log('');

console.log('═══════════════════════════════════════════════════════════');
console.log('✅ All generation tasks completed successfully!');
console.log('═══════════════════════════════════════════════════════════');

