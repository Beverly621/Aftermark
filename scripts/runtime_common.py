#!/usr/bin/env python3
"""Shared validation and atomic-file helpers for the Aftermark local runtime."""

from __future__ import annotations

import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

SESSION_SCHEMA = "aftermark-session-v1"
REQUEST_SCHEMA = "aftermark-request-v1"
STATUS_SCHEMA = "aftermark-status-v1"
STATUS_STATES = {
    "waiting_for_user",
    "request_ready",
    "analyzing_source",
    "planning_art",
    "generating_outer_art",
    "validating_outer_art",
    "compositing",
    "complete",
    "error",
}
REQUEST_RESUMABLE_STATES = STATUS_STATES - {"waiting_for_user"}
SOURCE_PATTERN = re.compile(r"^assets/source\.(png|jpe?g|webp)$", re.IGNORECASE)
SESSION_PATTERN = re.compile(r"^am_[a-z0-9_-]{12,80}$", re.IGNORECASE)
CJK_PATTERN = re.compile(r"[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff\uac00-\ud7af]")


class RuntimeValidationError(ValueError):
    """Raised when a local-runtime protocol file is invalid."""


def skill_root() -> Path:
    return Path(__file__).resolve().parents[1]


def resolve_user_project(value: str, *, create: bool = False) -> Path:
    project = Path(value).expanduser().resolve()
    root = skill_root()
    if project == root or root in project.parents:
        raise RuntimeValidationError("The user project must stay outside the reusable Aftermark Skill directory.")
    if create:
        project.mkdir(parents=True, exist_ok=True)
    if not project.is_dir():
        raise RuntimeValidationError(f"Project directory does not exist: {project}")
    return project


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def parse_timestamp(value: Any, field: str) -> datetime:
    if not isinstance(value, str):
        raise RuntimeValidationError(f"{field} must be an ISO-8601 timestamp.")
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as error:
        raise RuntimeValidationError(f"{field} must be an ISO-8601 timestamp.") from error
    if parsed.tzinfo is None:
        raise RuntimeValidationError(f"{field} must include a timezone.")
    return parsed.astimezone(timezone.utc)


def atomic_write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f".{path.name}.{os.getpid()}.tmp")
    encoded = (json.dumps(payload, indent=2, ensure_ascii=False) + "\n").encode("utf-8")
    try:
        with temporary.open("xb") as handle:
            handle.write(encoded)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary, path)
        directory_fd = os.open(path.parent, os.O_RDONLY)
        try:
            os.fsync(directory_fd)
        finally:
            os.close(directory_fd)
    finally:
        if temporary.exists():
            temporary.unlink()


def read_json(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as error:
        raise RuntimeValidationError(f"Required runtime file is missing: {path.name}") from error
    except (OSError, json.JSONDecodeError) as error:
        raise RuntimeValidationError(f"Runtime file is not valid JSON: {path.name}") from error
    if not isinstance(value, dict):
        raise RuntimeValidationError(f"Runtime file must contain a JSON object: {path.name}")
    return value


def validate_session(value: dict[str, Any]) -> dict[str, Any]:
    if set(value) != {"schemaVersion", "sessionId", "createdAt"}:
        raise RuntimeValidationError("aftermark-session.json has unexpected fields.")
    if value.get("schemaVersion") != SESSION_SCHEMA:
        raise RuntimeValidationError("Unsupported Aftermark session schema.")
    session_id = value.get("sessionId")
    if not isinstance(session_id, str) or not SESSION_PATTERN.fullmatch(session_id):
        raise RuntimeValidationError("Invalid Aftermark session ID.")
    parse_timestamp(value.get("createdAt"), "createdAt")
    return value


def load_session(project: Path) -> dict[str, Any]:
    return validate_session(read_json(project / "aftermark-session.json"))


def count_message(value: str) -> int:
    cjk_count = len(CJK_PATTERN.findall(value.strip()))
    remainder = CJK_PATTERN.sub(" ", value.strip()).strip()
    word_count = len(remainder.split()) if remainder else 0
    return cjk_count + word_count


def validate_request(value: dict[str, Any], session: dict[str, Any], project: Path) -> dict[str, Any]:
    project = project.resolve()
    required = {
        "schemaVersion",
        "sessionId",
        "sourceImagePath",
        "stylePack",
        "doodleDensity",
        "compositionMode",
        "material",
        "userMessage",
        "createdAt",
    }
    if set(value) != required:
        raise RuntimeValidationError("request.json has missing or unexpected fields.")
    if value.get("schemaVersion") != REQUEST_SCHEMA:
        raise RuntimeValidationError("Unsupported Aftermark request schema.")
    if value.get("sessionId") != session["sessionId"]:
        raise RuntimeValidationError("request.json belongs to a different Aftermark session.")
    source_path = value.get("sourceImagePath")
    if not isinstance(source_path, str) or not SOURCE_PATTERN.fullmatch(source_path):
        raise RuntimeValidationError("request.json contains an unsafe source image path.")
    resolved_source = (project / source_path).resolve()
    if project not in resolved_source.parents:
        raise RuntimeValidationError("Source image escapes the user project.")
    if value.get("stylePack") != "neon_scribble":
        raise RuntimeValidationError("Task 2C01 supports only neon_scribble.")
    if value.get("doodleDensity") != "medium":
        raise RuntimeValidationError("Task 2C01 supports only medium density.")
    if value.get("compositionMode") not in {"text_led", "motif_led"}:
        raise RuntimeValidationError("Invalid composition mode.")
    if value.get("material") != "classic":
        raise RuntimeValidationError("Task 2C01 supports only classic material.")
    message = value.get("userMessage")
    if not isinstance(message, str) or count_message(message) > 30:
        raise RuntimeValidationError("The user message exceeds the 30-word/character limit.")
    request_time = parse_timestamp(value.get("createdAt"), "createdAt")
    session_time = parse_timestamp(session.get("createdAt"), "session createdAt")
    if request_time < session_time:
        raise RuntimeValidationError("request.json is stale for this session.")
    return value


def validate_status(value: dict[str, Any], session: dict[str, Any]) -> dict[str, Any]:
    allowed = {"schemaVersion", "sessionId", "state", "updatedAt", "message", "output"}
    if not set(value).issubset(allowed):
        raise RuntimeValidationError("status.json has unexpected fields.")
    if value.get("schemaVersion") != STATUS_SCHEMA or value.get("sessionId") != session["sessionId"]:
        raise RuntimeValidationError("status.json does not match this session.")
    if value.get("state") not in STATUS_STATES:
        raise RuntimeValidationError("status.json contains an invalid state.")
    parse_timestamp(value.get("updatedAt"), "updatedAt")
    return value


def load_and_validate_request(project: Path) -> dict[str, Any]:
    session = load_session(project)
    request = validate_request(read_json(project / "request.json"), session, project)
    if not (project / request["sourceImagePath"]).is_file():
        raise RuntimeValidationError("The request source image is missing.")
    return request


def load_request_when_ready(project: Path) -> dict[str, Any] | None:
    """Return a valid request only after its matching status leaves the pre-submit state."""
    session = load_session(project)
    request = validate_request(read_json(project / "request.json"), session, project)
    if not (project / request["sourceImagePath"]).is_file():
        raise RuntimeValidationError("The request source image is missing.")
    status = validate_status(read_json(project / "status.json"), session)
    if status["state"] == "waiting_for_user":
        return None
    if status["state"] not in REQUEST_RESUMABLE_STATES:
        raise RuntimeValidationError("The request status is not resumable.")
    return request


def append_log(project: Path, message: str) -> None:
    log_path = project / "logs" / "session.log"
    log_path.parent.mkdir(parents=True, exist_ok=True)
    with log_path.open("a", encoding="utf-8") as handle:
        handle.write(f"{utc_now()} {message}\n")
