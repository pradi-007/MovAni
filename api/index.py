import os
import sys
import traceback

# Ensure repository root is in sys.path for modular imports
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

try:
    from backend.app import app
except Exception as e:
    err_tb = traceback.format_exc()
    from flask import Flask, jsonify
    app = Flask(__name__)

    @app.route("/<path:path>", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
    @app.route("/", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
    def error_fallback(path=""):
        return jsonify({
            "error": "Startup Exception on Vercel Serverless Function",
            "details": str(e),
            "traceback": err_tb,
            "sys_path": sys.path,
            "root_dir_contents": os.listdir(ROOT_DIR) if os.path.exists(ROOT_DIR) else [],
            "cwd": os.getcwd(),
            "cwd_contents": os.listdir(os.getcwd()) if os.path.exists(os.getcwd()) else []
        }), 500

# Vercel serverless WSGI entrypoint
handler = app

