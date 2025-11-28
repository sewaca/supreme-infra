import { updateCdWorkflow } from './update-cd-workflow';
import { updateSecurityChecks } from './update-security-checks';

console.log('Updating security checks...');
updateSecurityChecks();

console.log('Updating CD workflow...');
updateCdWorkflow();

console.log('Generation finished');
