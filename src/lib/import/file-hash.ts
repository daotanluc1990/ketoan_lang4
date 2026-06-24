import crypto from 'node:crypto';

export function createFileHash(buffer: Buffer | string): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}
