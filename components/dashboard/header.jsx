'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import NotificacionesDropdown from '@/components/notificaciones/notificaciones-dropdown';
import { Bars3Icon } from '@heroicons/react/24/outline';

export default function Header({ user, openSidebar }) {
  const pathname = usePathname();

  // Generar título basado en la ruta actual
  const getTitle = () => {
    // Mapeo de rutas a títulos
    const routeTitles = {
      '/dashboard': 'Dashboard',
      '/clientes': 'Gestión de Clientes',
      '/prestamos': 'Gestión de Préstamos',
      '/cobranzas': 'Control de Cobranzas',
      '/finanzas': 'Administración Financiera',
      '/metas': 'Gestión de Metas',
      '/configuracion': 'Configuración del Sistema',
    };

    // Buscar coincidencia exacta primero
    if (routeTitles[pathname]) return routeTitles[pathname];

    // Si no hay coincidencia exacta, buscar parcial
    for (const [route, routeTitle] of Object.entries(routeTitles)) {
      if (pathname.startsWith(`${route}/`)) return routeTitle;
    }

    return 'ProFinanzas';
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8 py-4 md:py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            {/* Botón para abrir el sidebar en móviles */}
            {openSidebar && (
              <button 
                onClick={openSidebar}
                className="mr-3 md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                aria-label="Abrir menú"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
            )}
            {/* Título con truncado para móviles */}
            <h1 className="text-xl md:text-2xl font-semibold text-gray-900 truncate">{getTitle()}</h1>
          </div>
          
          {/* Asegurar que el ícono de notificaciones siempre sea visible */}
          <div className="flex items-center">
            <NotificacionesDropdown user={user} />
          </div>
        </div>
      </div>
    </header>
  );
}