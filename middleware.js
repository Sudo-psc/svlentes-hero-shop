import { NextResponse } from 'next/server';

export function middleware(request) {
  // Forçar headers corretos para arquivos JavaScript
  if (request.nextUrl.pathname.includes('/_next/static/') &&
      request.nextUrl.pathname.endsWith('.js')) {

    const response = NextResponse.next();

    // Garantir MIME type correto para JavaScript
    response.headers.set('Content-Type', 'application/javascript; charset=utf-8');

    // Cabeçalhos de cache
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    return response;
  }

  // Para arquivos CSS
  if (request.nextUrl.pathname.includes('/_next/static/') &&
      request.nextUrl.pathname.endsWith('.css')) {

    const response = NextResponse.next();
    response.headers.set('Content-Type', 'text/css; charset=utf-8');
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    return response;
  }

  return NextResponse.next();
}