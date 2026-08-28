#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# ============================================================
# Servidor local para Worl Kalm
# Uso:
#   python server.py
#   python server.py 8080
#   python server.py --no-browser
# ============================================================

import http.server
import socketserver
import os
import sys
import webbrowser
import threading
import json
import time
import socket
import urllib.parse


# ============================================================
# CONFIGURACIÓN
# ============================================================

# Carpeta que se va a servir.
# Por defecto, la carpeta donde está este server.py.
ROOT = os.path.dirname(os.path.abspath(__file__))

# Páginas que se abren automáticamente al entrar a "/"
DEFAULT_PAGES = [
    "index.html",
    "worl-kalm.html",
    "main.html",
]

# Activa o desactiva la recarga automática
ENABLE_LIVERELOAD = True

# Carpetas que el livereload no debe escanear
IGNORED_DIRS = {
    ".git",
    "__pycache__",
    "node_modules",
    ".vscode",
    ".idea",
    "dist",
    "build",
}

# Script que se inyecta en los HTML para recargar automáticamente
LIVE_RELOAD_SCRIPT = b"""
<script>
(function () {
  let stamp = null;

  async function checkChanges() {
    try {
      const res = await fetch('/__changes', { cache: 'no-store' });
      const data = await res.json();

      if (stamp !== null && stamp !== data.stamp) {
        location.reload();
        return;
      }

      stamp = data.stamp;
    } catch (e) {}
  }

  setInterval(checkChanges, 1000);
  checkChanges();
})();
</script>
"""

# Cache para no escanear todo el proyecto cada segundo
_stamp_cache = {
    "stamp": 0,
    "time": 0,
}


# ============================================================
# UTILIDADES
# ============================================================

def get_project_stamp():
    """
    Devuelve la última fecha de modificación del proyecto.
    Si algún archivo cambia, cambia el stamp y el navegador recarga.
    """
    now = time.time()

    # Pequeña cache para no escanear demasiado
    if now - _stamp_cache["time"] < 0.7:
        return _stamp_cache["stamp"]

    latest = 0

    for dirpath, dirnames, filenames in os.walk(ROOT):
        # Ignorar carpetas pesadas
        dirnames[:] = [d for d in dirnames if d not in IGNORED_DIRS]

        for filename in filenames:
            filepath = os.path.join(dirpath, filename)

            try:
                mtime = os.path.getmtime(filepath)
                if mtime > latest:
                    latest = mtime
            except OSError:
                pass

    _stamp_cache["stamp"] = latest
    _stamp_cache["time"] = now

    return latest


def get_lan_ip():
    """
    Obtiene una IP local aproximada para probar desde otros dispositivos.
    """
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return None


# ============================================================
# HANDLER HTTP
# ============================================================

class Handler(http.server.SimpleHTTPRequestHandler):

    # MIME types correctos para juegos web
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript; charset=utf-8",
        ".mjs": "text/javascript; charset=utf-8",
        ".json": "application/json; charset=utf-8",
        ".wasm": "application/wasm",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".svg": "image/svg+xml",
        ".css": "text/css; charset=utf-8",
        ".html": "text/html; charset=utf-8",
        ".htm": "text/html; charset=utf-8",
    }

    # --------------------------------------------------------
    # Headers sin caché
    # --------------------------------------------------------
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()

    # --------------------------------------------------------
    # Logs: ignoramos el polling del livereload
    # --------------------------------------------------------
    def log_message(self, fmt, *args):
        path = getattr(self, "path", "")

        if path.startswith("/__changes"):
            return

        super().log_message(fmt, *args)

    # --------------------------------------------------------
    # GET
    # --------------------------------------------------------
    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        # Endpoint para livereload
        if path == "/__changes":
            return self.send_json({
                "stamp": get_project_stamp(),
            })

        filesystem_path = self.translate_path(path)

        # Si es carpeta
        if os.path.isdir(filesystem_path):

            # Redirigir /carpeta a /carpeta/
            if not path.endswith("/"):
                self.send_response(301)
                self.send_header("Location", path + "/")
                self.end_headers()
                return

            # Buscar página por defecto
            for page in DEFAULT_PAGES:
                candidate = os.path.join(filesystem_path, page)

                if os.path.isfile(candidate):
                    return self.serve_file(candidate)

            # Si no hay página por defecto, mostrar listado de carpeta
            return super().do_GET()

        # HTML: inyectar livereload
        if path.endswith((".html", ".htm")):
            return self.serve_file(filesystem_path)

        # Otros archivos
        return super().do_GET()

    # --------------------------------------------------------
    # Servir archivo manualmente
    # --------------------------------------------------------
    def serve_file(self, filesystem_path):
        if not os.path.isfile(filesystem_path):
            return self.send_error(404, "Archivo no encontrado")

        try:
            with open(filesystem_path, "rb") as f:
                data = f.read()
        except OSError as e:
            return self.send_error(404, str(e))

        ctype = self.guess_type(filesystem_path)

        if ctype.startswith("text/html"):
            ctype = "text/html; charset=utf-8"

            if ENABLE_LIVERELOAD:
                if b"</body>" in data:
                    data = data.replace(b"</body>", LIVE_RELOAD_SCRIPT + b"</body>", 1)
                else:
                    data += LIVE_RELOAD_SCRIPT

        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    # --------------------------------------------------------
    # Respuesta JSON
    # --------------------------------------------------------
    def send_json(self, obj):
        body = json.dumps(obj).encode("utf-8")

        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()

        self.wfile.write(body)


# ============================================================
# SERVIDOR MULTI-HILO
# ============================================================

try:
    class Server(http.server.ThreadingHTTPServer):
        allow_reuse_address = True
        daemon_threads = True

except AttributeError:
    class Server(socketserver.ThreadingMixIn, http.server.HTTPServer):
        allow_reuse_address = True
        daemon_threads = True


# ============================================================
# MAIN
# ============================================================

def main():
    args = sys.argv[1:]

    no_browser = any(x in args for x in ["--no-browser", "-nb"])

    port_args = [int(x) for x in args if x.isdigit()]
    start_port = port_args[0] if port_args else 8000

    # Servir siempre desde la carpeta del proyecto
    os.chdir(ROOT)

    httpd = None
    chosen_port = None

    # Buscar puerto libre
    for port in range(start_port, start_port + 20):
        try:
            httpd = Server(("0.0.0.0", port), Handler)
            chosen_port = port
            break
        except OSError:
            print(f"⚠️  Puerto {port} ocupado, probando siguiente...")

    if httpd is None:
        print("❌ No se encontró un puerto libre.")
        sys.exit(1)

    url = f"http://localhost:{chosen_port}/"
    lan_ip = get_lan_ip()

    print()
    print("=" * 55)
    print("🌍 Servidor Worl Kalm iniciado")
    print("=" * 55)
    print(f"📁 Carpeta servida : {ROOT}")
    print(f"🌐 URL local       : {url}")

    if lan_ip:
        print(f"📱 URL en red LAN  : http://{lan_ip}:{chosen_port}/")

    print()
    print("🔁 Recarga automática activada" if ENABLE_LIVERELOAD else "🔁 Recarga automática desactivada")
    print("🛑 Para detener el servidor presiona Ctrl+C")
    print("=" * 55)
    print()

    if not no_browser:
        threading.Timer(0.8, lambda: webbrowser.open(url)).start()

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Servidor detenido.")
    finally:
        httpd.server_close()


if __name__ == "__main__":
    main()