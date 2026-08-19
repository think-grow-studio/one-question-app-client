export interface GoogleAuthRequest {
  idToken: string;
  email?: string;
  name?: string;
}

export interface AppleAuthRequest {
  identityToken: string;
  name?: string;
  authorizationCode?: string;
  rawNonce?: string;
}

export interface ReissueTokenRequest {
  refreshToken: string;
}

export interface AnonymousAuthRequest {
  idToken: string;
}

export interface CheckGoogleLinkRequest {
  idToken: string;
}

export interface CheckGoogleLinkResponse {
  exists: boolean;
}

export interface LinkToGoogleRequest {
  idToken: string;
  email?: string;
  name?: string;
}

export interface CheckAppleLinkRequest {
  identityToken: string;
  rawNonce?: string;
}

export interface CheckAppleLinkResponse {
  exists: boolean;
}

export interface LinkToAppleRequest {
  identityToken: string;
  name?: string;
  authorizationCode?: string;
  rawNonce?: string;
}
