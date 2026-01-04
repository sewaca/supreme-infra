import {
  getNodeAutoInstrumentations,
  type InstrumentationConfigMap,
} from '@opentelemetry/auto-instrumentations-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import {
  LoggerProvider,
  BatchLogRecordProcessor,
} from '@opentelemetry/sdk-logs';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

let sdk: NodeSDK | null = null;
let loggerProvider: LoggerProvider | null = null;

export async function register() {
  try {
    const prometheusExporter = new PrometheusExporter({
      port: 9464,
      endpoint: '/metrics',
    });

    // Configure logs export to Loki via OTLP
    const lokiEndpoint =
      process.env.LOKI_ENDPOINT ||
      'http://loki-gateway.monitoring.svc.cluster.local/otlp/v1/logs';

    const logExporter = new OTLPLogExporter({
      url: lokiEndpoint,
      headers: {},
    });

    loggerProvider = new LoggerProvider({
      resource: new Resource({
        [ATTR_SERVICE_NAME]: 'frontend',
      }),
    });

    loggerProvider.addLogRecordProcessor(
      new BatchLogRecordProcessor(logExporter),
    );

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
      logRecordProcessor: new BatchLogRecordProcessor(logExporter),
      instrumentations: [
        getNodeAutoInstrumentations(nextInstrumentationConfig),
      ],
    });

    sdk.start();

    console.log('OpenTelemetry SDK started for frontend service');
    console.log('Prometheus metrics endpoint: http://localhost:9464/metrics');
    console.log(`Logs exporter endpoint: ${lokiEndpoint}`);

    process.on('SIGTERM', () => {
      const shutdownPromises = [];
      if (sdk) {
        shutdownPromises.push(sdk.shutdown());
      }
      if (loggerProvider) {
        shutdownPromises.push(loggerProvider.shutdown());
      }
      Promise.all(shutdownPromises)
        .then(() => console.log('OpenTelemetry SDK shut down successfully'))
        .catch((error) =>
          console.log('Error shutting down OpenTelemetry SDK', error),
        )
        .finally(() => process.exit(0));
    });
  } catch (error) {
    console.error('Failed to initialize OpenTelemetry SDK:', error);
    throw error;
  }
}
