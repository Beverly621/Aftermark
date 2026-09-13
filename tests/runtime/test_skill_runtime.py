from __future__ import annotations

import json
import hashlib
import os
import shutil
import struct
import subprocess
import sys
import tempfile
import unittest
import zlib
from pathlib import Path
from unittest.mock import MagicMock, patch

SKILL_ROOT = Path(__file__).resolve().parents[2]
SCRIPTS = SKILL_ROOT / "scripts"
sys.path.insert(0, str(SCRIPTS))

from launch_studio import available_port  # noqa: E402
from runtime_common import (  # noqa: E402
    REQUEST_SCHEMA,
    STATUS_SCHEMA,
    RuntimeValidationError,
    atomic_write_json,
    load_session,
    resolve_user_project,
    utc_now,
    validate_request,
)


class SkillRuntimeTests(unittest.TestCase):
    def create_project(self, root: str) -> Path:
        project = Path(root) / "user-project"
        result = subprocess.run(
            [sys.executable, str(SCRIPTS / "create_session.py"), "--project", str(project)],
            cwd=SKILL_ROOT,
            check=False,
            capture_output=True,
            text=True,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        return project

    def write_request(self, project: Path, *, session_id: str | None = None) -> dict[str, object]:
        session = load_session(project)
        source = project / "assets/source.png"
        shutil.copyfile(SKILL_ROOT / "assets/benchmark-inputs/G01_DAY_LANDSCAPE_COAST.png", source)
        request = {
            "schemaVersion": REQUEST_SCHEMA,
            "sessionId": session_id or session["sessionId"],
            "sourceImagePath": "assets/source.png",
            "stylePack": "neon_scribble",
            "doodleDensity": "medium",
            "compositionMode": "text_led",
            "material": "classic",
            "userMessage": "summer never ended",
            "createdAt": utc_now(),
        }
        atomic_write_json(project / "request.json", request)
        return request

    def write_status(self, project: Path, state: str) -> None:
        session = load_session(project)
        atomic_write_json(project / "status.json", {
            "schemaVersion": STATUS_SCHEMA,
            "sessionId": session["sessionId"],
            "state": state,
            "updatedAt": utc_now(),
        })

    def test_session_creation_and_resume(self) -> None:
        with tempfile.TemporaryDirectory(prefix="aftermark-session-") as temporary:
            project = self.create_project(temporary)
            session = load_session(project)
            self.assertRegex(session["sessionId"], r"^am_")
            for relative in ("aftermark-session.json", "status.json", "assets", "output", "logs/session.log"):
                self.assertTrue((project / relative).exists())
            resumed = subprocess.run(
                [sys.executable, str(SCRIPTS / "create_session.py"), "--project", str(project)],
                cwd=SKILL_ROOT,
                check=False,
                capture_output=True,
                text=True,
            )
            self.assertEqual(resumed.returncode, 0, resumed.stderr)
            self.assertTrue(json.loads(resumed.stdout)["resumed"])
            self.assertEqual(load_session(project)["sessionId"], session["sessionId"])

    def test_project_inside_skill_is_rejected(self) -> None:
        with self.assertRaises(RuntimeValidationError):
            resolve_user_project(str(SKILL_ROOT / "user-assets"), create=False)

    def test_request_schema_session_mismatch_and_wait_behavior(self) -> None:
        with tempfile.TemporaryDirectory(prefix="aftermark-wait-") as temporary:
            project = self.create_project(temporary)
            request = self.write_request(project)
            session = load_session(project)
            self.assertEqual(validate_request(request, session, project)["compositionMode"], "text_led")
            with self.assertRaisesRegex(RuntimeValidationError, "different Aftermark session"):
                validate_request({**request, "sessionId": "am_wrong_session_123"}, session, project)
            self.write_status(project, "request_ready")
            waited = subprocess.run(
                [sys.executable, str(SCRIPTS / "wait_for_request.py"), "--project", str(project), "--timeout", "2"],
                cwd=SKILL_ROOT,
                check=False,
                capture_output=True,
                text=True,
            )
            self.assertEqual(waited.returncode, 0, waited.stderr)
            self.assertEqual(json.loads(waited.stdout)["sessionId"], session["sessionId"])

    def test_waiter_does_not_return_before_request_ready_status(self) -> None:
        with tempfile.TemporaryDirectory(prefix="aftermark-wait-race-") as temporary:
            project = self.create_project(temporary)
            self.write_request(project)

            waiting = subprocess.run(
                [
                    sys.executable,
                    str(SCRIPTS / "wait_for_request.py"),
                    "--project",
                    str(project),
                    "--timeout",
                    "0.3",
                    "--poll-interval",
                    "0.05",
                ],
                cwd=SKILL_ROOT,
                check=False,
                capture_output=True,
                text=True,
            )
            self.assertEqual(waiting.returncode, 3, waiting.stderr)
            self.assertEqual(waiting.stdout, "")

            self.write_status(project, "request_ready")
            resumed = subprocess.run(
                [sys.executable, str(SCRIPTS / "wait_for_request.py"), "--project", str(project), "--timeout", "1"],
                cwd=SKILL_ROOT,
                check=False,
                capture_output=True,
                text=True,
            )
            self.assertEqual(resumed.returncode, 0, resumed.stderr)

    def test_dev_pipeline_requires_no_provider_credentials(self) -> None:
        with tempfile.TemporaryDirectory(prefix="aftermark-pipeline-") as temporary:
            project = self.create_project(temporary)
            self.write_request(project)
            self.write_status(project, "request_ready")
            environment = os.environ.copy()
            for name in list(environment):
                if "API_KEY" in name or name in {"OPENAI_API_KEY", "GEMINI_API_KEY", "GOOGLE_API_KEY", "BFL_API_KEY"}:
                    environment.pop(name, None)
            result = subprocess.run(
                [
                    "node",
                    "--conditions=react-server",
                    "--import",
                    "tsx",
                    "scripts/process-studio-request.ts",
                    "--project",
                    str(project),
                ],
                cwd=SKILL_ROOT,
                env=environment,
                check=False,
                capture_output=True,
                text=True,
                timeout=90,
            )
            self.assertEqual(result.returncode, 0, result.stderr)
            status = json.loads((project / "status.json").read_text(encoding="utf-8"))
            self.assertEqual(status["state"], "complete")
            for relative in ("assets/outer-art.png", "output/record.png", "output/share-card.png"):
                self.assertGreater((project / relative).stat().st_size, 1000)

    def test_native_prepare_and_finalize_resume_safe_without_provider_credentials(self) -> None:
        with tempfile.TemporaryDirectory(prefix="aftermark-native-") as temporary:
            project = self.create_project(temporary)
            request = self.write_request(project)
            self.write_status(project, "analyzing_source")
            source = (project / request["sourceImagePath"]).read_bytes()
            analysis = {
                "schemaVersion": "aftermark-source-analysis-v1",
                "sessionId": request["sessionId"],
                "sourceImageSha256": hashlib.sha256(source).hexdigest(),
                "sourceSummary": "daylight coastal cliff and sea",
                "palette": {
                    "primary": ["#4c91ae", "#d4c49b"],
                    "neutral": ["#f1eee6"],
                    "surprise": ["#ff5b9e"],
                },
                "motifs": [
                    {"name": "wave", "visualShorthand": "single loose curling wave line", "salience": "high"},
                    {"name": "cliff", "visualShorthand": "broken vertical contour", "salience": "high"},
                    {"name": "bird", "visualShorthand": "tiny two stroke bird", "salience": "medium"},
                ],
                "mood": ["open air", "late summer", "bright"],
                "avoidMotifs": [],
            }
            atomic_write_json(project / "analysis.json", analysis)
            environment = os.environ.copy()
            for name in list(environment):
                if "API_KEY" in name:
                    environment.pop(name, None)
            prepared = subprocess.run(
                ["npm", "run", "studio:prepare", "--", "--project", str(project)],
                cwd=SKILL_ROOT,
                env=environment,
                check=False,
                capture_output=True,
                text=True,
                timeout=30,
            )
            self.assertEqual(prepared.returncode, 0, prepared.stderr)
            plan = json.loads((project / "generation-plan.json").read_text(encoding="utf-8"))
            self.assertNotIn(request["userMessage"], plan["compiledPrompt"])
            self.assertEqual(plan["assetRole"], "outer_art_overlay")
            (project / "assets/outer-art.raw.png").write_bytes(test_outer_art_png())

            finalized = subprocess.run(
                ["npm", "run", "studio:finalize", "--", "--project", str(project), "--attempt", "1", "--visual-text-check", "pass"],
                cwd=SKILL_ROOT,
                env=environment,
                check=False,
                capture_output=True,
                text=True,
                timeout=90,
            )
            self.assertEqual(finalized.returncode, 0, finalized.stderr)
            status = json.loads((project / "status.json").read_text(encoding="utf-8"))
            self.assertEqual(status["state"], "complete")
            qa = json.loads((project / "outer-art-qa.json").read_text(encoding="utf-8"))
            self.assertTrue(qa["accepted"])
            self.assertEqual(qa["attemptCount"], 1)
            for relative in ("analysis.json", "generation-plan.json", "assets/outer-art.raw.png", "assets/outer-art.png", "output/record.png", "output/share-card.png"):
                self.assertGreater((project / relative).stat().st_size, 100)

            resumed = subprocess.run(
                ["npm", "run", "studio:finalize", "--", "--project", str(project), "--attempt", "1", "--visual-text-check", "pass"],
                cwd=SKILL_ROOT,
                env=environment,
                check=False,
                capture_output=True,
                text=True,
                timeout=30,
            )
            self.assertEqual(resumed.returncode, 0, resumed.stderr)
            self.assertTrue(json.loads(last_json_line(resumed.stdout))["resumed"])

            third_attempt = subprocess.run(
                ["npm", "run", "studio:finalize", "--", "--project", str(project), "--attempt", "3", "--visual-text-check", "pass"],
                cwd=SKILL_ROOT,
                env=environment,
                check=False,
                capture_output=True,
                text=True,
                timeout=30,
            )
            self.assertNotEqual(third_attempt.returncode, 0)
            self.assertIn("--attempt <1|2>", third_attempt.stderr)

    def test_preferred_port_falls_back_when_occupied(self) -> None:
        occupied = MagicMock()
        occupied.__enter__.return_value.bind.side_effect = OSError("occupied")
        fallback = MagicMock()
        with patch("launch_studio.socket.socket", side_effect=[occupied, fallback]):
            self.assertEqual(available_port(3100), 3101)


def test_outer_art_png() -> bytes:
    width = height = 64
    rows = []
    for y in range(height):
        row = bytearray([0])
        for x in range(width):
            opaque = 8 <= x <= 50 and not (22 <= x <= 42 and 22 <= y <= 42)
            row.extend((255, 91, 158, 255 if opaque else 0))
        rows.append(bytes(row))
    raw = b"".join(rows)

    def chunk(kind: bytes, payload: bytes) -> bytes:
        return struct.pack(">I", len(payload)) + kind + payload + struct.pack(">I", zlib.crc32(kind + payload) & 0xFFFFFFFF)

    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)) + chunk(b"IDAT", zlib.compress(raw)) + chunk(b"IEND", b"")


def last_json_line(output: str) -> str:
    return next(line for line in reversed(output.splitlines()) if line.startswith("{"))


if __name__ == "__main__":
    unittest.main()
