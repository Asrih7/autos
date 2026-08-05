export interface ApiAuthResponse {
  _embedded: {
    destino: string | null;
    contenedor: string | null;
    user_info: {
      username: string;
      nif: string | null;
      fullName: string;
      email: string | null;
      roles: string[];
      tema: string | null;
      embebido: boolean | null;
      idioma: string;
    };
    access_token: string;
    refresh_token: string;
  };
  _response: {
    status: number;
    timestamp: {
      init: string;
      end: string;
    };
    duration: number;
    path: string;
    api: string;
    version: string;
    trace_id: string;
    span_id: string;
  };
}

export interface JwtPayloadClaims {
  sub: string;
  iat: number;
  exp: number; // Unix expiration timestamp
  appNameOrigin?: string;
  cat?: string;
  roles: string[];
  mfa?: boolean;
  idioma: string;
  embedded?: boolean;
}
