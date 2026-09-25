/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { isPublicPath, updateSession } from '@/lib/supabase/middleware';

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(),
}));

const createServerClientMock = createServerClient as jest.Mock;

function requestFor(pathname: string) {
  return new NextRequest(new URL(pathname, 'http://localhost:3000'));
}

describe('middleware de sesión', () => {
  beforeEach(() => {
    createServerClientMock.mockReset();
  });

  it('deja pública solo /l/ y el login, no /s/ ni /chat', () => {
    expect(isPublicPath('/l/audifonos')).toBe(true);
    expect(isPublicPath('/login')).toBe(true);
    expect(isPublicPath('/auth/callback')).toBe(true);
    expect(isPublicPath('/chat')).toBe(false);
    expect(isPublicPath('/s/tienda')).toBe(false);
  });

  it('un anónimo no entra a /chat y sí abre /l/ publicada', async () => {
    createServerClientMock.mockReturnValue({
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
      },
    });

    const chat = await updateSession(requestFor('/chat'));
    expect(chat.headers.get('location')).toContain('/login');

    const landing = await updateSession(requestFor('/l/oferta-publicada'));
    expect(landing.headers.get('location')).toBeNull();
    expect(landing.status).not.toBe(307);
  });

  it('si la sesión falla, no abre la app privada', async () => {
    createServerClientMock.mockImplementation(() => {
      throw new Error('supabase caído');
    });

    const chat = await updateSession(requestFor('/chat'));
    expect(chat.status).toBe(503);

    const landing = await updateSession(requestFor('/l/oferta-publicada'));
    expect(landing.status).not.toBe(503);
  });
});
