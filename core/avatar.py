# core/avatar.py - Canonical Avatar Registry and Resolver
from typing import Optional, Dict

AVATAR_REGISTRY: Dict[str, str] = {
    'avatar_01': '/avatars/Ma_01.png',
    'avatar_02': '/avatars/fa_01.png',
    'avatar_03': '/avatars/MA_02.png',
    'avatar_04': '/avatars/fa_02.png',
    'avatar_05': '/avatars/Ma_03.png',
    'avatar_06': '/avatars/fa_03.png',
    'avatar_07': '/avatars/Ma_04.png',
    'avatar_08': '/avatars/fa_04.png',
    'avatar_09': '/avatars/Ma_05.png',
    'avatar_10': '/avatars/Ma_06.png',
}

# Reverse lookup: path -> key
PATH_TO_AVATAR_KEY = {v.lower(): k for k, v in AVATAR_REGISTRY.items()}
# Also handle case variations and leading slashes
for k, v in AVATAR_REGISTRY.items():
    PATH_TO_AVATAR_KEY[v] = k
    PATH_TO_AVATAR_KEY[v.lstrip('/')] = k
    PATH_TO_AVATAR_KEY[v.lstrip('/').lower()] = k

DEFAULT_AVATAR_KEY = 'avatar_01'

def normalize_avatar_key(value: Optional[str]) -> Optional[str]:
    """
    Given an avatar key (e.g. 'avatar_01') or path (e.g. '/avatars/Ma_01.png'),
    returns the canonical avatar key (e.g. 'avatar_01') if approved, else None.
    Rejects any arbitrary external URLs.
    """
    if not value or not isinstance(value, str):
        return None
    
    val = value.strip()
    if not val:
        return None
        
    # Check direct key match
    if val in AVATAR_REGISTRY:
        return val
        
    lower_val = val.lower()
    if lower_val in AVATAR_REGISTRY:
        return lower_val
        
    # Check path match
    if val in PATH_TO_AVATAR_KEY:
        return PATH_TO_AVATAR_KEY[val]
    if lower_val in PATH_TO_AVATAR_KEY:
        return PATH_TO_AVATAR_KEY[lower_val]
        
    return None

def resolve_avatar_url(key_or_path: Optional[str]) -> Optional[str]:
    """
    Resolves canonical avatar key or path to approved static asset URL.
    Returns None if key is unrecognized or missing.
    """
    key = normalize_avatar_key(key_or_path)
    if key and key in AVATAR_REGISTRY:
        return AVATAR_REGISTRY[key]
    return None

def is_valid_avatar(value: Optional[str]) -> bool:
    """Check if value corresponds to an approved application avatar."""
    return normalize_avatar_key(value) is not None
