// frontend/src/utils/avatarUtils.js - Canonical Avatar Registry & Resolver

export const AVATAR_REGISTRY = {
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
};

export const AVATAR_LIST = Object.entries(AVATAR_REGISTRY).map(([key, path]) => ({
  key,
  path
}));

export const DEFAULT_AVATAR_KEY = 'avatar_01';
export const DEFAULT_AVATAR_URL = AVATAR_REGISTRY[DEFAULT_AVATAR_KEY];

// Reverse lookup map
const PATH_TO_KEY = {};
Object.entries(AVATAR_REGISTRY).forEach(([key, path]) => {
  PATH_TO_KEY[path] = key;
  PATH_TO_KEY[path.toLowerCase()] = key;
  PATH_TO_KEY[path.replace(/^\//, '')] = key;
  PATH_TO_KEY[path.replace(/^\//, '').toLowerCase()] = key;
});

/**
 * Normalizes an avatar value (key or path) into a stable canonical avatar key (e.g. 'avatar_01').
 * Rejects untrusted arbitrary URLs.
 */
export function normalizeAvatarKey(val) {
  if (!val || typeof val !== 'string') return null;
  const trimmed = val.trim();
  if (AVATAR_REGISTRY[trimmed]) return trimmed;
  const lower = trimmed.toLowerCase();
  if (AVATAR_REGISTRY[lower]) return lower;
  if (PATH_TO_KEY[trimmed]) return PATH_TO_KEY[trimmed];
  if (PATH_TO_KEY[lower]) return PATH_TO_KEY[lower];
  return null;
}

/**
 * Resolves an avatar value (key or path) into an approved web asset URL (e.g. '/avatars/Ma_01.png').
 * Returns null if the value is not an approved avatar.
 */
export function resolveAvatarUrl(val) {
  const key = normalizeAvatarKey(val);
  if (key && AVATAR_REGISTRY[key]) {
    return AVATAR_REGISTRY[key];
  }
  return null;
}
