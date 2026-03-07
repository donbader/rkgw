import { test, expect } from '@playwright/test';

test.describe('Auth error handling', () => {
  test('request without API key returns 401', async ({ request }) => {
    const response = await request.get('/v1/models', {
      headers: {
        'Authorization': '',
      },
    });
    expect([401, 403]).toContain(response.status());
  });

  test('request with invalid API key returns 401 or 403', async ({ request }) => {
    const response = await request.get('/v1/models', {
      headers: {
        'Authorization': 'Bearer invalid-key-that-does-not-exist',
      },
    });
    expect([401, 403]).toContain(response.status());
  });
});
