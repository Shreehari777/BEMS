/**
 * Helper to get the current logged-in user from localStorage.
 * Used by all pages to pass user ID in API calls for data isolation.
 */
export function getCurrentUser(): { id: string; username: string; role: string; displayName: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('bems_user');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Build fetch headers that include the x-user-id for data isolation.
 */
export function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const user = getCurrentUser();
  return {
    'Content-Type': 'application/json',
    ...(user?.id ? { 'x-user-id': user.id } : {}),
    ...(extra || {}),
  };
}
