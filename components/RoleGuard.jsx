// components/RoleGuard.jsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

// Mapeo de roles a rutas permitidas
const ROLE_ROUTES = {
  'admin_sistema': ['/dashboard', '/usuarios', '/configuracion', '/clientes', '/prestamos', '/cobranzas', '/finanzas', '/metas'],
  'administrador': ['/dashboard', '/clientes', '/prestamos', '/prestamos/aprobaciones', '/cobranzas', '/finanzas', '/metas', '/notificaciones'],
  'supervisor': ['/dashboard', '/clientes', '/prestamos', '/cobranzas', '/metas'],
  'asesor': ['/dashboard', '/clientes', '/prestamos', '/cobranzas', '/notificaciones']
};

export default function RoleGuard({ children, allowedRoles = [] }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const router = useRouter();
  const pathname = usePathname();

  // Función para verificar si un usuario puede acceder a una ruta específica
  const canAccessRoute = (role, route) => {
    if (!ROLE_ROUTES[role]) return false;
    return ROLE_ROUTES[role].some(allowedRoute =>
      route === allowedRoute || route.startsWith(`${allowedRoute}/`)
    );
  };

  // Verificar si hay un ID en la ruta (por ejemplo, /clientes/123)
  const checkResourceAccess = async (user, pathname) => {
    // Extraer el recurso y el ID de la ruta
    const parts = pathname.split('/');
    if (parts.length >= 3 && parts[1] === 'clientes') {
      const clienteId = parts[2];

      // Si es acceso a un cliente específico y el usuario es asesor o supervisor
      if (clienteId && (user.rol === 'asesor' || user.rol === 'supervisor')) {
        try {
          // Para asesores, verificar si el cliente pertenece al asesor
          if (user.rol === 'asesor') {
            /*const { data } = await supabase
              .from('clientes')
              .select('*')
              .eq('id', clienteId)
              .eq('asesor_id', user.id)
              .single();

            return !!data; // Retorna true si encontró el cliente, false si no*/
            return true;
          }
          // Para supervisores, verificar si el cliente pertenece a un asesor supervisado
          else if (user.rol === 'supervisor') {
            // Primero obtener los asesores supervisados
            /*const { data: asesores } = await supabase
              .from('usuarios')
              .select('id')
              .eq('supervisor_id', user.id);

            if (!asesores || asesores.length === 0) return false;

            const asesorIds = asesores.map(a => a.id);

            // Luego verificar si el cliente pertenece a alguno de esos asesores
            const { data } = await supabase
              .from('clientes')
              .select('*')
              .eq('id', clienteId)
              .in('asesor_id', asesorIds)
              .single();

            return !!data;*/
            return true;

          }
        } catch (error) {
          console.error('Error al verificar acceso a recurso:', error);
          return false;
        }
      }
    }

    // Para otros tipos de recursos o roles, permitir acceso
    return true;
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);

        if (!currentUser) {
          console.log("No hay usuario autenticado, redirigiendo a login");
          router.replace('/login');
          return;
        }

        // Verificar si tenemos roles específicos permitidos para este componente
        if (allowedRoles.length > 0 && !allowedRoles.includes(currentUser.rol)) {
          console.log(`Rol ${currentUser.rol} no tiene permiso para ver esta página`);
          router.replace('/acceso-denegado');
          return;
        }

        // Verificar si el usuario puede acceder a la ruta actual según su rol
        if (!canAccessRoute(currentUser.rol, pathname)) {
          console.log(`Usuario con rol ${currentUser.rol} no puede acceder a ${pathname}`);
          router.replace('/acceso-denegado');
          return;
        }

        // Verificar acceso a recursos específicos
        const resourceAccess = await checkResourceAccess(currentUser, pathname);
        if (!resourceAccess) {
          console.log(`Usuario no tiene acceso al recurso específico en ${pathname}`);
          router.replace('/acceso-denegado');
          return;
        }

        setLoading(false);
      } catch (error) {
        console.error('Error al verificar autenticación:', error);
        router.replace('/login');
      }
    };
    checkAuth();

    // Escuchar cambios en el estado de autenticación
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          router.replace('/login');
        }
      }
    );

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [router, pathname, allowedRoles]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return children;
}