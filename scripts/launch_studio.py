#!/usr/bin/env python3
"""Launch the project-bound Aftermark Studio on localhost only."""

from __future__ import annotations

import argparse
import json
import os
import shutil
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request
import webbrowser

from runtime_common import RuntimeValidationError, load_session, resolve_user_project, skill_root

PROVIDER_SECRET_NAMES = {
    "AFTERMARK_ARTWORK_PROVIDER_API_KEY",
    "AFTERMARK_OPENAI_API_KEY",
    "AFTERMARK_GOOGLE_API_KEY",
    "AFTERMARK_BFL_API_KEY",
    "OPENAI_API_KEY",
    "GEMINI_API_KEY",
    "GOOGLE_API_KEY",
    "BFL_API_KEY",
}


def available_port(preferred: int) -> int:
    for port in range(preferred, preferred + 21):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as probe:
            try:
                probe.bind(("127.0.0.1", port))
            except OSError:
                continue
            return port
    raise RuntimeValidationError("No localhost port is available in the preferred fallback range.")


def wait_until_ready(url: str, process: subprocess.Popen[bytes], timeout: float = 30) -> None:
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if process.poll() is not None:
            raise RuntimeValidationError("Aftermark Studio exited before becoming ready.")
        try:
            with urllib.request.urlopen(f"{url}/api/studio/session", timeout=1) as response:
                if response.status == 200:
                    return
        except (urllib.error.URLError, TimeoutError):
            time.sleep(0.2)
    raise RuntimeValidationError("Aftermark Studio did not become ready in time.")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project", required=True)
    parser.add_argument("--port", type=int, default=3000)
    parser.add_argument("--no-open", action="store_true")
    args = parser.parse_args()

    process: subprocess.Popen[bytes] | None = None
    try:
        project = resolve_user_project(args.project)
        session = load_session(project)
        npm = shutil.which("npm")
        if not npm:
            raise RuntimeValidationError("npm is required to launch Aftermark Studio.")
        port = available_port(args.port)
        url = f"http://127.0.0.1:{port}"
        environment = os.environ.copy()
        for name in PROVIDER_SECRET_NAMES:
            environment.pop(name, None)
        environment.update({
            "AFTERMARK_STUDIO_PROJECT": str(project),
            "AFTERMARK_STUDIO_SESSION_ID": session["sessionId"],
            "AFTERMARK_ARTWORK_PROVIDER": "development",
            "NEXT_TELEMETRY_DISABLED": "1",
        })
        command = [npm, "run", "dev", "--", "--hostname", "127.0.0.1", "--port", str(port)]
        process = subprocess.Popen(command, cwd=skill_root(), env=environment)
        wait_until_ready(url, process)
        print(json.dumps({"url": url, "project": str(project), "sessionId": session["sessionId"]}), flush=True)
        if not args.no_open:
            webbrowser.open(url)
        return process.wait()
    except KeyboardInterrupt:
        if process and process.poll() is None:
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
        return 130
    except (RuntimeValidationError, OSError) as error:
        if process and process.poll() is None:
            process.terminate()
        print(f"Aftermark Studio error: {error}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
