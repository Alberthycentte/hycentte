const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function generateTestGigs() {
  // Sample gig data
  const gigs = [
    {
      id: '1',
      title: 'I will create professional logo design',
      url: 'https://fiverr.com/gig/1',
      seller: 'designpro',
      price: '$25',
      rating: '4.8',
      thumbnail: 'https://example.com/thumb1.jpg',
      collectedAt: new Date().toISOString()
    },
    {
      id: '2',
      title: 'I will design beautiful website mockups',
      url: 'https://fiverr.com/gig/2',
      seller: 'webdesigner',
      price: '$50',
      rating: '4.9',
      thumbnail: 'https://example.com/thumb2.jpg',
      collectedAt: new Date().toISOString()
    },
    {
      id: '3',
      title: 'I will write SEO optimized content',
      url: 'https://fiverr.com/gig/3',
      seller: 'contentwriter',
      price: '$15',
      rating: '4.7',
      thumbnail: 'https://example.com/thumb3.jpg',
      collectedAt: new Date().toISOString()
    }
  ];

  // Generate encryption key and IV
  const key = crypto.randomBytes(32);
  const iv = crypto.randomBytes(12);

  // Encrypt data using AES-256-GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const plaintext = JSON.stringify(gigs);
  let encrypted = cipher.update(plaintext, 'utf8', 'binary');
  encrypted += cipher.final('binary');
  const authTag = cipher.getAuthTag();

  // Create key in JWK format for client-side decryption
  const jwkKey = {
    kty: 'oct',
    k: key.toString('base64'),
    alg: 'A256GCM',
    ext: true
  };

  // Create encrypted file structure
  const encryptedFile = {
    algorithm: 'AES-256-GCM',
    iv: Array.from(iv),
    ciphertext: Array.from(Buffer.from(encrypted + authTag.toString('binary'), 'binary')),
    key: jwkKey,
    exportedAt: new Date().toISOString(),
    gigCount: gigs.length
  };

  // Write to file
  const outputPath = path.join(__dirname, '..', 'public', 'test-gigs.enc.json');
  fs.writeFileSync(outputPath, JSON.stringify(encryptedFile, null, 2));
  console.log(`✓ Test gig file created at ${outputPath}`);
}

generateTestGigs();
