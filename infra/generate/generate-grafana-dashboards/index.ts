import { generatePostgresDashboards } from './generate-postgres-dashboard';
import { generateRedisDashboards } from './generate-redis-dashboard';

export function generateInfraDashboards(): void {
  console.log('→ Generating PostgreSQL dashboards...');
  generatePostgresDashboards();

  console.log('→ Generating Redis dashboards...');
  generateRedisDashboards();
}
