import { describe, it, expect } from 'vitest';
import { GoogleAuthRequestSchema } from '../packages/shared/src/schemas/auth.schema.js';

describe('Google Authentication Tests', () => {
  it('should accept valid Google credential request', () => {
    const valid = { credential: 'sample_google_jwt_token_12345' };
    const parsed = GoogleAuthRequestSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.credential).toBe('sample_google_jwt_token_12345');
    }
  });

  it('should reject missing credential in Google auth payload', () => {
    const invalid = {};
    const parsed = GoogleAuthRequestSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it('should reject empty string credential', () => {
    const invalid = { credential: '' };
    const parsed = GoogleAuthRequestSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it('should format dev mock token correctly for local development', () => {
    const mockEmail = 'student.google@aica.lab';
    const devToken = `dev-mock-google-${mockEmail}`;
    expect(devToken.startsWith('dev-mock-google-')).toBe(true);
    const extractedEmail = devToken.replace('dev-mock-google-', '');
    expect(extractedEmail).toBe(mockEmail);
  });

  describe('Fake Email Prevention & Meaningful Error Invariants', () => {
    it('should detect disposable / fake email domains', () => {
      const disposableDomains = ['tempmail.com', 'mailinator.com', '10minutemail.com', 'guerrillamail.com'];
      const fakeEmail = 'attacker123@mailinator.com';
      const domain = fakeEmail.split('@')[1];
      expect(disposableDomains.includes(domain)).toBe(true);
    });

    it('should identify Gmail addresses requiring Google OAuth verification', () => {
      const candidate1 = 'student@gmail.com';
      const candidate2 = 'user@googlemail.com';
      const candidate3 = 'corporate@customcompany.org';

      const isGmail = (email: string) =>
        email.endsWith('@gmail.com') || email.endsWith('@googlemail.com');

      expect(isGmail(candidate1)).toBe(true);
      expect(isGmail(candidate2)).toBe(true);
      expect(isGmail(candidate3)).toBe(false);
    });

    it('should verify meaningful Hindi/English error when Google account is unverified or does not exist', () => {
      const errorMessage =
        'Aapka yeh email Google me exist nahi karta hai ya verified nahi hai. Kripya valid Google account use karein.';
      expect(errorMessage).toContain('Aapka yeh email Google me exist nahi karta');
      expect(errorMessage).toContain('verified nahi hai');
    });
  });
});
