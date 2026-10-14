"""
MOVAni API Route Blueprints
"""
from .catalog import catalog_bp
from .user import user_bp
from .search import search_bp
from .tmdb import tmdb_bp
from .ott import ott_bp
from .kannada import kannada_bp
from .auth import auth_bp
from .streaming import streaming_bp
from .open_library import open_library_bp

__all__ = [
    "catalog_bp",
    "user_bp",
    "search_bp",
    "tmdb_bp",
    "ott_bp",
    "kannada_bp",
    "auth_bp",
    "streaming_bp",
    "open_library_bp"
]

