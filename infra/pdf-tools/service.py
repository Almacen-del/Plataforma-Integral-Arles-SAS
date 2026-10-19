"""Local-only PDF compression. Arles authenticates requests before forwarding here."""
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from tempfile import TemporaryDirectory
import json
import subprocess

MAX_BYTES = 25 * 1024 * 1024
PRESETS = {"medium": "/ebook", "high": "/screen"}

class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_):
        pass

    def do_GET(self):
        if self.path != "/health":
            self.send_error(404)
            return
        version = subprocess.run(["gs", "--version"], capture_output=True, text=True, timeout=5).stdout.strip()
        self.respond(200, json.dumps({"ready": bool(version), "version": version}).encode(), "application/json")

    def respond(self, status, content, content_type):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(content)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(content)

    def do_POST(self):
        try:
            size = int(self.headers.get("Content-Length", "0"))
            quality = self.headers.get("X-PDF-Quality", "medium")
            if self.path != "/compress" or quality not in PRESETS or not 0 < size <= MAX_BYTES:
                self.respond(400, b'{"error":"Invalid PDF request"}', "application/json")
                return
            data = self.rfile.read(size)
            if len(data) != size or b"%PDF-" not in data[:1024]:
                self.respond(400, b'{"error":"Invalid PDF"}', "application/json")
                return
            with TemporaryDirectory(prefix="arles-pdf-") as directory:
                source = Path(directory) / "input.pdf"
                output = Path(directory) / "output.pdf"
                source.write_bytes(data)
                command = ["gs", "-dSAFER", "-dBATCH", "-dNOPAUSE", "-dQUIET", "-sDEVICE=pdfwrite", "-dCompatibilityLevel=1.7", "-dPDFSETTINGS=" + PRESETS[quality], "-dDetectDuplicateImages=true", "-dAutoRotatePages=/None", "-dPreserveAnnots=true", "-dNumRenderingThreads=1", "-sOutputFile=" + str(output), str(source)]
                subprocess.run(command, stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True, timeout=110)
                if not output.is_file() or not 0 < output.stat().st_size <= MAX_BYTES:
                    raise ValueError("Output exceeds size limit")
                result = output.read_bytes()
                self.respond(200, result if len(result) < len(data) else data, "application/pdf")
        except (subprocess.SubprocessError, OSError, ValueError):
            self.respond(503, b'{"error":"PDF compression failed"}', "application/json")

HTTPServer(("0.0.0.0", 8080), Handler).serve_forever()
