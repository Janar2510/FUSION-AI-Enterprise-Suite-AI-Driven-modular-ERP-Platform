"""
Authentication utilities for FusionAI Enterprise Suite
"""

from fastapi import Depends
from src.api.v1.endpoints.auth import get_current_user

__all__ = ["get_current_user"]