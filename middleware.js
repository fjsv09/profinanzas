import { NextResponse } from 'next/server';

export async function middleware(req) {
  // No hacer nada por ahora, permitir todas las solicitudes
  return NextResponse.next();
}

export const config = {
  matcher: [] // No aplicar a ninguna ruta
};