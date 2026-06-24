import { afterEach, describe, expect, it, vi } from 'vitest';
import { getServerEnv, hasGoogleSheetsEnv } from '../server-env';

describe('server env', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('accepts GOOGLE_SERVICE_ACCOUNT_EMAIL as a backward-compatible Google client email alias', () => {
    vi.stubEnv('GOOGLE_SHEET_ID', 'sheet-id');
    vi.stubEnv('GOOGLE_CLIENT_EMAIL', '');
    vi.stubEnv('GOOGLE_SERVICE_ACCOUNT_EMAIL', 'service-account@example.iam.gserviceaccount.com');
    vi.stubEnv('GOOGLE_PRIVATE_KEY', '-----BEGIN PRIVATE KEY-----\\nkey\\n-----END PRIVATE KEY-----');

    const env = getServerEnv();

    expect(env.googleClientEmail).toBe('service-account@example.iam.gserviceaccount.com');
    expect(hasGoogleSheetsEnv()).toBe(true);
  });
});
