"""
Specialized AI agents for different ERP modules
"""

from .accounting import AccountingAgent
from .crm import CRMAgent
from .inventory import InventoryAgent
from .hr import HRAgent
from .project import ProjectAgent
from .sales import SalesAgent
from .purchase import PurchaseAgent
from .helpdesk import HelpdeskAgent
from .marketing import MarketingAgent
from .manufacturing import ManufacturingAgent

__all__ = [
    "AccountingAgent",
    "CRMAgent", 
    "InventoryAgent",
    "HRAgent",
    "ProjectAgent",
    "SalesAgent",
    "PurchaseAgent",
    "HelpdeskAgent",
    "MarketingAgent",
    "ManufacturingAgent",
]




