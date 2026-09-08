import { OAuth2Client } from 'google-auth-library';

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/auth/google/callback';

export const googleClient = new OAuth2Client(clientId, clientSecret, redirectUri);

export function getGoogleAuthUrl(state: string) {
  return googleClient.generateAuthUrl({
    access_type: 'offline',
    scope: ['email', 'profile', 'openid'],
    state,
    prompt: 'consent',
  });
}

export async function exchangeCodeForTokens(code: string) {
  const { tokens } = await googleClient.getToken(code);
  return tokens;
}

export async function verifyGoogleIdToken(idToken: string) {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: clientId,
  });
  
  const payload = ticket.getPayload();
  
  if (!payload) {
    throw new Error('Invalid ID token payload');
  }
  
  return {
    sub: payload.sub,
    email: payload.email as string,
    name: payload.name,
    picture: payload.picture,
  };
}
