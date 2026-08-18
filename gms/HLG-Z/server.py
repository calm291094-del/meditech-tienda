#!/usr/bin/env python3
"""Servidor local para Holguín de los Muertos"""
import http.server
import socketserver
import webbrowser
import threading
import os
import sys
import time

PORT = 8000
HOST = "127.0.0.1"
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        super().end_headers()
    
    def log_message(self, format, *args):
        if args and "404" in str(args[0]):
            super().log_message(format, *args)

def find_free_port(start_port):
    for port in range(start_port, start_port + 20):
        try:
            with socketserver.TCPServer((HOST, port), None) as s:
                return port
        except OSError:
            continue
    return None

def open_browser_delayed(url, delay=1.0):
    time.sleep(delay)
    try:
        webbrowser.open(url)
    except Exception as e:
        print(f"[!] Abre manualmente: {url}")

def main():
    print()
    print("=" * 60)
    print("  HOLGUIN DE LOS MUERTOS - SERVIDOR LOCAL")
    print("=" * 60)
    print()
    
    port = find_free_port(PORT)
    if port is None:
        print("[ERROR] No se encontro puerto disponible.")
        input("Presiona ENTER para salir...")
        sys.exit(1)
    
    url = f"http://{HOST}:{port}/"
    
    try:
        httpd = socketserver.TCPServer((HOST, port), QuietHandler)
        httpd.allow_reuse_address = True
    except OSError as e:
        print(f"[ERROR] No se pudo iniciar el servidor: {e}")
        input("Presiona ENTER para salir...")
        sys.exit(1)
    
    print(f"  Servidor en: {url}")
    print(f"  Abriendo navegador...")
    print()
    print("  Controles: WASD mover · A/D rotar · Clic disparar")
    print("             E interactuar · C crafting · J misiones")
    print()
    print("  Presiona Ctrl+C para detener")
    print("-" * 60)
    
    threading.Thread(target=open_browser_delayed, args=(url, 0.8), daemon=True).start()
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[i] Servidor detenido.")
        httpd.shutdown()
        httpd.server_close()

if __name__ == "__main__":
    main()