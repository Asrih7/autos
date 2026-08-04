import { JwtPayloadClaims } from '../dtos/auth.dto';

export function decodeJwtClaims(token: string): JwtPayloadClaims | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload) as JwtPayloadClaims;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;

  const claims = decodeJwtClaims(token);
  if (!claims || !claims.exp) return true;

  const expirationTimeMs = claims.exp * 1000;
  
  const nowMs = Date.now();
  
  return nowMs >= (expirationTimeMs - 10000);
}
