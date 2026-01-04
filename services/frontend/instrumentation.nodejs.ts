import {
  getNodeAutoInstrumentations,
  type InstrumentationConfigMap,
} from '@opentelemetry/auto-instrumentations-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { NodeSDK } from '@opentelemetry/sdk-node';

let sdk: NodeSDK | null = null;

export async function register() {
  try {
    const prometheusExporter = new PrometheusExporter({
      port: 9464,
      endpoint: '/metrics',
    });

    const nextInstrumentationConfig: InstrumentationConfigMap = {
      '@opentelemetry/instrumentation-fs': {
        enabled: false,
      },
      '@opentelemetry/instrumentation-http': {
        enabled: true,
      },
    };

    sdk = new NodeSDK({
      serviceName: 'frontend',
      metricReader: prometheusExporter,
      instrumentations: [getNodeAutoInstrumentations(nextInstrumentationConfig)],
    });

    sdk.start();

    console.log('OpenTelemetry SDK started for frontend service');
    console.log('Prometheus metrics endpoint: http://localhost:9464/metrics');

    process.on('SIGTERM', () => {
      if (sdk) {
        sdk
          .shutdown()
          .then(() => console.log('OpenTelemetry SDK shut down successfully'))
          .catch((error) =>
            console.log('Error shutting down OpenTelemetry SDK', error),
          )
          .finally(() => process.exit(0));
      }
    });
  } catch (error) {
    console.error('Failed to initialize OpenTelemetry SDK:', error);
    throw error;
  }
}
