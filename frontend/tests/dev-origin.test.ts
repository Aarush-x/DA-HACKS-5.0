import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('local server origin', () => {
  it('uses the hostname authorized by the deployed API CORS policy', () => {
    const packageJson = JSON.parse(
      readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
    ) as { scripts: Record<string, string> };

    expect(packageJson.scripts.dev).toBe('vite --host localhost');
    expect(packageJson.scripts.preview).toBe('vite preview --host localhost');
  });
});
