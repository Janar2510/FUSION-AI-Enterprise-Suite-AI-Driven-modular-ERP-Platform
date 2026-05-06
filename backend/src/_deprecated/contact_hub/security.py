"""
Security module for Contact Hub
Handles authentication and authorization for contact hub operations
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from typing import Optional, List
from datetime import datetime, timedelta
import jwt
from jwt import PyJWTError
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.config import get_settings
from ...core.database import get_async_session
from ...api.v1.endpoints.auth import UserResponse

settings = get_settings()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

# Define roles and permissions
CONTACT_HUB_PERMISSIONS = {
    "contact_hub_admin": [
        "read_contacts",
        "write_contacts",
        "delete_contacts",
        "read_companies",
        "write_companies",
        "delete_companies",
        "read_activities",
        "write_activities",
        "delete_activities",
        "read_relationships",
        "write_relationships",
        "delete_relationships",
        "export_data",
        "manage_permissions"
    ],
    "contact_hub_manager": [
        "read_contacts",
        "write_contacts",
        "read_companies",
        "write_companies",
        "read_activities",
        "write_activities",
        "read_relationships",
        "write_relationships",
        "export_data"
    ],
    "contact_hub_user": [
        "read_contacts",
        "read_companies",
        "read_activities",
        "read_relationships"
    ],
    "contact_hub_viewer": [
        "read_contacts",
        "read_companies"
    ]
}

class ContactHubSecurity:
    """Security service for Contact Hub operations"""
    
    @staticmethod
    async def get_current_user(
        token: str = Depends(oauth2_scheme),
        db: AsyncSession = Depends(get_async_session)
    ) -> UserResponse:
        """Get current user from JWT token"""
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
        try:
            payload = jwt.decode(
                token, 
                settings.JWT_SECRET_KEY, 
                algorithms=[settings.JWT_ALGORITHM]
            )
            user_id: str = payload.get("sub")
            email: str = payload.get("email")
            
            if user_id is None or email is None:
                raise credentials_exception
                
        except PyJWTError:
            raise credentials_exception
            
        # In a real implementation, we would fetch the user from the database
        # For now, we'll return a mock user based on the token
        user = UserResponse(
            id=user_id,
            email=email,
            name="Contact Hub User",
            role="contact_hub_user",
            permissions=CONTACT_HUB_PERMISSIONS.get("contact_hub_user", [])
        )
        
        return user
    
    @staticmethod
    async def get_current_active_user(
        current_user: UserResponse = Depends(get_current_user)
    ) -> UserResponse:
        """Get current active user"""
        # In a real implementation, we would check if the user is active
        return current_user
    
    @staticmethod
    def has_permission(
        user: UserResponse,
        required_permission: str
    ) -> bool:
        """Check if user has required permission"""
        return required_permission in user.permissions
    
    @staticmethod
    def has_role(
        user: UserResponse,
        required_role: str
    ) -> bool:
        """Check if user has required role"""
        return user.role == required_role
    
    @staticmethod
    def require_permission(required_permission: str):
        """Dependency to require specific permission"""
        def permission_checker(
            current_user: UserResponse = Depends(ContactHubSecurity.get_current_active_user)
        ) -> UserResponse:
            if not ContactHubSecurity.has_permission(current_user, required_permission):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Permission '{required_permission}' required"
                )
            return current_user
        return permission_checker
    
    @staticmethod
    def require_role(required_role: str):
        """Dependency to require specific role"""
        def role_checker(
            current_user: UserResponse = Depends(ContactHubSecurity.get_current_active_user)
        ) -> UserResponse:
            if not ContactHubSecurity.has_role(current_user, required_role):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Role '{required_role}' required"
                )
            return current_user
        return role_checker

# Convenience dependencies
get_current_user = ContactHubSecurity.get_current_user
get_current_active_user = ContactHubSecurity.get_current_active_user

# Permission-based dependencies
require_read_contacts = ContactHubSecurity.require_permission("read_contacts")
require_write_contacts = ContactHubSecurity.require_permission("write_contacts")
require_delete_contacts = ContactHubSecurity.require_permission("delete_contacts")
require_read_companies = ContactHubSecurity.require_permission("read_companies")
require_write_companies = ContactHubSecurity.require_permission("write_companies")
require_delete_companies = ContactHubSecurity.require_permission("delete_companies")
require_read_activities = ContactHubSecurity.require_permission("read_activities")
require_write_activities = ContactHubSecurity.require_permission("write_activities")
require_delete_activities = ContactHubSecurity.require_permission("delete_activities")
require_read_relationships = ContactHubSecurity.require_permission("read_relationships")
require_write_relationships = ContactHubSecurity.require_permission("write_relationships")
require_delete_relationships = ContactHubSecurity.require_permission("delete_relationships")
require_export_data = ContactHubSecurity.require_permission("export_data")
require_manage_permissions = ContactHubSecurity.require_permission("manage_permissions")

# Role-based dependencies
require_admin_role = ContactHubSecurity.require_role("contact_hub_admin")
require_manager_role = ContactHubSecurity.require_role("contact_hub_manager")
require_user_role = ContactHubSecurity.require_role("contact_hub_user")
require_viewer_role = ContactHubSecurity.require_role("contact_hub_viewer")