import { describe, it, expect } from 'vitest';

describe('Question Sharing & Deep-Linking Suite', () => {
  const origin = 'https://aica.app';

  describe('1. Share URL & Deep-Link Generation', () => {
    it('generates standard workspace deep-link from problem slug', () => {
      const problem = {
        id: '6745123456789abcdef01234',
        title: 'Predict Output: Async/Await Microtask Interleaving',
        slug: 'predict-output-async-await-interleaving',
        difficulty: 'HARD'
      };

      const problemIdentifier = problem.slug || problem.id;
      const shareUrl = `${origin}/workspace/${problemIdentifier}`;

      expect(shareUrl).toBe('https://aica.app/workspace/predict-output-async-await-interleaving');
    });

    it('falls back to problem ID if slug is not present', () => {
      const problem = {
        id: '6745123456789abcdef01234',
        title: 'Custom Problem Without Slug',
        difficulty: 'MEDIUM'
      };

      const problemIdentifier = (problem as any).slug || problem.id;
      const shareUrl = `${origin}/workspace/${problemIdentifier}`;

      expect(shareUrl).toBe('https://aica.app/workspace/6745123456789abcdef01234');
    });
  });

  describe('2. WhatsApp Share Formatting & Encoding', () => {
    it('formats WhatsApp message with emoji, bold title, difficulty and direct link', () => {
      const problem = {
        id: '123',
        title: 'Two Sum Optimal',
        slug: 'two-sum-optimal',
        difficulty: 'EASY'
      };

      const shareUrl = `${origin}/workspace/${problem.slug}`;
      const message = `🔥 Check out this coding challenge on AiCA:\n*${problem.title}* [${problem.difficulty}]\n\n👉 Solve it directly here: ${shareUrl}`;
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;

      expect(whatsappUrl).toContain('https://api.whatsapp.com/send?text=');
      expect(decodeURIComponent(whatsappUrl)).toContain('*Two Sum Optimal* [EASY]');
      expect(decodeURIComponent(whatsappUrl)).toContain('https://aica.app/workspace/two-sum-optimal');
    });
  });

  describe('3. Protected Route & Deep-Link Redirect Handshake', () => {
    it('encodes redirect URL when unauthenticated user opens question', () => {
      const targetPath = '/workspace/predict-output-async-await-interleaving';
      const redirectParam = encodeURIComponent(targetPath);
      const loginUrl = `/login?redirect=${redirectParam}`;

      expect(loginUrl).toBe('/login?redirect=%2Fworkspace%2Fpredict-output-async-await-interleaving');

      // Decoding on login page
      const searchParams = new URLSearchParams(loginUrl.split('?')[1]);
      const extractedRedirect = searchParams.get('redirect');
      expect(extractedRedirect).toBe(targetPath);
    });

    it('preserves deep-link redirect when navigating from Login to Register', () => {
      const redirectUrl = '/workspace/container-with-most-water';
      const registerLink = redirectUrl ? `/register?redirect=${encodeURIComponent(redirectUrl)}` : '/register';

      expect(registerLink).toBe('/register?redirect=%2Fworkspace%2Fcontainer-with-most-water');

      const params = new URLSearchParams(registerLink.split('?')[1]);
      expect(params.get('redirect')).toBe('/workspace/container-with-most-water');
    });

    it('identifies problem redirect to display friendly challenge-specific banner', () => {
      const checkIsProblemRedirect = (url: string | null) => {
        return Boolean(url && (url.includes('/workspace/') || url.includes('/problems/')));
      };

      expect(checkIsProblemRedirect('/workspace/two-sum')).toBe(true);
      expect(checkIsProblemRedirect('/problems/reverse-string')).toBe(true);
      expect(checkIsProblemRedirect('/dashboard')).toBe(false);
      expect(checkIsProblemRedirect('/admin/problems')).toBe(false);
      expect(checkIsProblemRedirect(null)).toBe(false);
    });
  });

  describe('4. Dual Route Scheme Compatibility', () => {
    it('validates both /workspace/:id and /problems/:id map to identical target problem', () => {
      const slug = 'async-await-interleaving';
      const workspaceRoute = `/workspace/${slug}`;
      const problemRoute = `/problems/${slug}`;

      // Both extract the same identifier
      const idFromWorkspace = workspaceRoute.replace('/workspace/', '');
      const idFromProblem = problemRoute.replace('/problems/', '');

      expect(idFromWorkspace).toBe(slug);
      expect(idFromProblem).toBe(slug);
    });
  });
});
