# services/__init__.py
from services.auth_service import auth_service
from services.wallet_service import wallet_service
from services.payment_service import payment_service
from services.pricing_service import pricing_service
from services.campaign_service import campaign_service
from services.assessment_service import assessment_service
from services.stats_service import stats_service

__all__ = [
    'auth_service',
    'wallet_service',
    'payment_service',
    'pricing_service',
    'campaign_service',
    'assessment_service',
    'stats_service'
]
