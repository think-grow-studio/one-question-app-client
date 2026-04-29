import * as Crypto from 'expo-crypto';

export interface AppleNonce {
  rawNonce: string;
  hashedNonce: string;
}

export async function createAppleNonce(): Promise<AppleNonce> {
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce,
    { encoding: Crypto.CryptoEncoding.HEX }
  );
  return { rawNonce, hashedNonce };
}
