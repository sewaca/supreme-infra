from opentelemetry import metrics

_meter = metrics.get_meter("authorization-py", "1.0.0")

jwt_verify_duration = _meter.create_histogram(
    name="auth_jwt_verify_duration_ms",
    description="Duration of JWT verification in milliseconds",
    unit="ms",
)

jwt_verify_total = _meter.create_counter(
    name="auth_jwt_verify_total",
    description="Total number of JWT verifications by result",
)

session_check_duration = _meter.create_histogram(
    name="auth_session_check_duration_ms",
    description="Duration of session check via core-auth in milliseconds",
    unit="ms",
)

session_check_total = _meter.create_counter(
    name="auth_session_check_total",
    description="Total number of session checks by status",
)
