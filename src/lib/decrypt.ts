export interface EncryptedGigFile {
  algorithm: string
  iv: number[]
  ciphertext: number[]
  key: JsonWebKey
  exportedAt: string
  gigCount: number
}

export interface GigData {
  id: string
  title: string
  url: string
  seller: string
  price: string
  rating: string
  thumbnail: string
  collectedAt: string
}

export async function decryptGigFile(encFile: EncryptedGigFile): Promise<GigData[]> {
  const key = await crypto.subtle.importKey(
    'jwk',
    encFile.key,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  )

  const iv = new Uint8Array(encFile.iv)
  const ciphertext = new Uint8Array(encFile.ciphertext)

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  )

  const text = new TextDecoder().decode(decrypted)
  return JSON.parse(text) as GigData[]
}
