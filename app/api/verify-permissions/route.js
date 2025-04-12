// app/api/auth/verify-permissions/route.js
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
  try {
    const { pathname } = await request.json();
    
    // Verificar sesión activa
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session.session) {
      return NextResponse.json({ 
        authorized: false, 
        message: 'No autenticado' 
      }, { status: 401 });
    }
    
    // Obtener información del usuario, incluyendo rol
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('rol, activo')
      .eq('id', session.session.user.id)
      .single();
    
    if (userError || !userData) {
      return NextResponse.json({ 
        authorized: false, 
        message: 'Usuario no encontrado' 
      }, { status: 401 });
    }
    
    // Verificar si el usuario está activo
    if (!userData.activo) {
      return NextResponse.json({ 
        authorized: false, 
        message: 'Cuenta desactivada' 
      }, { status: 403 });
    }
    
    // Mapeo de roles a rutas permitidas
    const ROLE_ROUTES = {
      'admin_sistema': ['/dashboard', '/usuarios', '/configuracion', '/clientes', '/prestamos', '/cobranzas', '/finanzas', '/metas'],
      'administrador': ['/dashboard', '/clientes', '/prestamos', '/cobranzas', '/finanzas', '/metas'],
      'supervisor': ['/dashboard', '/clientes', '/prestamos', '/cobranzas', '/metas'],
      'asesor': ['/dashboard', '/clientes', '/prestamos', '/cobranzas']
    };
    
    // Verificar acceso basado en rol
    const allowedRoutes = ROLE_ROUTES[userData.rol] || [];
    const authorized = allowedRoutes.some(route => 
      pathname === route || pathname.startsWith(`${route}/`)
    );
    
    if (!authorized) {
      return NextResponse.json({ 
        authorized: false, 
        message: 'Acceso denegado' 
      }, { status: 403 });
    }
    
    // Verificaciones adicionales específicas según la ruta
    if (pathname.includes('/finanzas/reportes') && userData.rol === 'supervisor') {
      return NextResponse.json({ 
        authorized: false, 
        message: 'Acceso restringido' 
      }, { status: 403 });
    }
    
    // Usuario autorizado
    return NextResponse.json({ 
      authorized: true, 
      rol: userData.rol 
    });
    
  } catch (error) {
    console.error('Error verificando permisos:', error);
    return NextResponse.json({ 
      authorized: false, 
      message: 'Error en verificación' 
    }, { status: 500 });
  }
}