class TraceGraphError(Exception):
    """Base category for all TraceGraph exceptions."""

    pass


class ConstructionError(TraceGraphError):
    """Raised when graph generation fails."""

    pass


class AuditorError(TraceGraphError):
    """Raised when verification fails."""

    pass


class ValidationError(TraceGraphError):
    """Raised when JSON schema validation fails."""

    pass
