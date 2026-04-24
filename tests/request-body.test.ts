import { describe, expect, it } from 'vitest';

import { ApiError } from '../lib/server/api-error';
import { readJsonBody } from '../lib/server/request-body';

describe('readJsonBody', () => {
  it('parses a valid JSON request body', async () => {
    const request = new Request('http://localhost/api/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        campus: 'main',
        email: 'faculty@sdca.edu.ph',
      }),
    });

    await expect(readJsonBody(request)).resolves.toEqual({
      campus: 'main',
      email: 'faculty@sdca.edu.ph',
    });
  });

  it('rejects a request with no body', async () => {
    const request = new Request('http://localhost/api/test', {
      method: 'POST',
    });

    await expect(readJsonBody(request)).rejects.toBeInstanceOf(ApiError);
    await expect(readJsonBody(new Request('http://localhost/api/test', {
      method: 'POST',
    }))).rejects.toMatchObject({
      code: 'missing_body',
      status: 400,
    });
  });

  it('rejects malformed JSON', async () => {
    const request = new Request('http://localhost/api/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: '{"campus":"main"',
    });

    await expect(readJsonBody(request)).rejects.toMatchObject({
      code: 'invalid_json',
      status: 400,
    });
  });
});
