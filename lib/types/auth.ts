export interface LogtoUser {
    id: string;
    username?: string;
    name?: string;
    email?: string;
    emailVerified?: boolean;
    phone?: string;
    phoneVerified?: boolean;
    avatar?: string;
    profile?: Record<string, unknown>;
    createdAt?: number;
    updatedAt?: number;
  }
  
  export interface TokenSet {
    accessToken: string;
    refreshToken?: string;
    idToken?: string;
    expiresIn?: number;
  }
  
  export interface AuthSession {
    isAuthenticated: boolean;
    user?: LogtoUser;
  }
  
  export interface OidcConfig {
    authorizationEndpoint: string;
    tokenEndpoint: string;
    userinfoEndpoint: string;
    issuer: string;
    jwksUri: string;
  }