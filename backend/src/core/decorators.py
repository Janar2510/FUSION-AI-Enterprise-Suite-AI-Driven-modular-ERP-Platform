from functools import wraps
from typing import Callable, Any
import asyncio
import logging

logger = logging.getLogger(__name__)

def track_contact_activity(
    activity_type,
    entity_type: str,
    extract_contact_id: Callable = None
):
    """Decorator to automatically track contact activities in any module"""
    
    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            # Execute the original function
            result = await func(*args, **kwargs)
            
            # Extract contact information
            contact_id = None
            if extract_contact_id:
                contact_id = extract_contact_id(args, kwargs, result)
            elif 'contact_id' in kwargs:
                contact_id = kwargs['contact_id']
            elif hasattr(result, 'contact_id'):
                contact_id = result.contact_id
            
            # Track the activity
            if contact_id or (result and hasattr(result, 'email')):
                try:
                    from .contact_tracker import ContactTracker
                    from .database import get_db
                    
                    # Get database session
                    db = next(get_db())
                    tracker = ContactTracker(db)
                    
                    await tracker.track_activity(
                        contact_id=contact_id,
                        activity_type=activity_type,
                        module=func.__module__.split('.')[3] if len(func.__module__.split('.')) > 3 else 'unknown',
                        entity_type=entity_type,
                        entity_id=result.id if hasattr(result, 'id') else None,
                        metadata={
                            'function': func.__name__,
                            'email': getattr(result, 'email', None),
                            'content': getattr(result, 'description', None) or getattr(result, 'title', None)
                        }
                    )
                except Exception as e:
                    logger.error(f"Failed to track activity: {e}")
            
            return result
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            # Execute the original function
            result = func(*args, **kwargs)
            
            # Extract contact information
            contact_id = None
            if extract_contact_id:
                contact_id = extract_contact_id(args, kwargs, result)
            elif 'contact_id' in kwargs:
                contact_id = kwargs['contact_id']
            elif hasattr(result, 'contact_id'):
                contact_id = result.contact_id
            
            # Track the activity (async in sync function)
            if contact_id or (result and hasattr(result, 'email')):
                try:
                    import asyncio
                    from .contact_tracker import ContactTracker
                    from .database import get_db
                    
                    # Get database session
                    db = next(get_db())
                    tracker = ContactTracker(db)
                    
                    # Run async tracking
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                    try:
                        loop.run_until_complete(tracker.track_activity(
                            contact_id=contact_id,
                            activity_type=activity_type,
                            module=func.__module__.split('.')[3] if len(func.__module__.split('.')) > 3 else 'unknown',
                            entity_type=entity_type,
                            entity_id=result.id if hasattr(result, 'id') else None,
                            metadata={
                                'function': func.__name__,
                                'email': getattr(result, 'email', None),
                                'content': getattr(result, 'description', None) or getattr(result, 'title', None)
                            }
                        ))
                    finally:
                        loop.close()
                except Exception as e:
                    logger.error(f"Failed to track activity: {e}")
            
            return result
        
        # Return appropriate wrapper based on function type
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator

def extract_contact_from_email(args, kwargs, result):
    """Helper function to extract contact_id from email in function arguments"""
    # Look for email in various argument positions
    for arg in args:
        if hasattr(arg, 'email') and arg.email:
            # This would need to query the database to get contact_id
            return None  # Placeholder
        elif isinstance(arg, str) and '@' in arg:
            # Email string found
            return None  # Placeholder
    
    # Check kwargs
    if 'email' in kwargs and kwargs['email']:
        return None  # Placeholder
    
    return None

def extract_contact_from_result(args, kwargs, result):
    """Helper function to extract contact_id from function result"""
    if result and hasattr(result, 'contact_id'):
        return result.contact_id
    elif result and hasattr(result, 'email'):
        # Would need to query database
        return None
    return None


