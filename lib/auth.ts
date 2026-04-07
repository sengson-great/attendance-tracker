import { SignJWT, jwtVerify } from 'jose';

const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const key = new TextEncoder().encode(secretKey);

export async function signSession(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key);
}

export async function verifySession(token: string) {
  try {
    const { payload } = await jwtVerify(token, key);
    return payload;
  } catch (error) {
    return null;
  }
}
