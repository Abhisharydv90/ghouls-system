import { NextResponse } from 'next/server';

export function middleware(request) {
  const response = NextResponse.next();
  
  // The ultimate wildcard security policy. 
  // This explicitly permits React to compile and allows ALL WebSocket connections.
  response.headers.set(
    'Content-Security-Policy',
    "default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; connect-src * 'unsafe-inline'; img-src * data: blob: 'unsafe-inline'; frame-src *; style-src * 'unsafe-inline';"
  );
  
  return response;
}