from opentelemetry import metrics, trace
from opentelemetry.exporter.otlp.proto.http._log_exporter import OTLPLogExporter
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.exporter.prometheus import PrometheusMetricReader
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor
from opentelemetry.sdk._logs import LoggerProvider, LoggingHandler
from opentelemetry.sdk._logs.export import BatchLogRecordProcessor
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.resources import SERVICE_NAME, Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from prometheus_client import start_http_server

from app.config import settings

_resource = Resource(attributes={SERVICE_NAME: "core-client-info"})


def setup_metrics() -> None:
    reader = PrometheusMetricReader()
    provider = MeterProvider(resource=_resource, metric_readers=[reader])
    metrics.set_meter_provider(provider)
    start_http_server(port=9464, addr="0.0.0.0")


def setup_tracing() -> None:
    exporter = OTLPSpanExporter(endpoint=f"{settings.loki_endpoint}/v1/traces")
    provider = TracerProvider(resource=_resource)
    provider.add_span_processor(BatchSpanProcessor(exporter))
    trace.set_tracer_provider(provider)


def setup_logging() -> None:
    exporter = OTLPLogExporter(endpoint=settings.loki_endpoint)
    provider = LoggerProvider(resource=_resource)
    provider.add_log_record_processor(BatchLogRecordProcessor(exporter))
    handler = LoggingHandler(level=0, logger_provider=provider)

    import logging

    logging.getLogger().addHandler(handler)


def setup_instrumentation() -> None:
    setup_metrics()
    setup_tracing()
    setup_logging()
    HTTPXClientInstrumentor().instrument()


def instrument_app(app) -> None:
    FastAPIInstrumentor.instrument_app(app)
