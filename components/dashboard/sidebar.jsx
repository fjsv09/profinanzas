'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ChartBarIcon,
  TrophyIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  CheckIcon, // Ícono para aprobaciones
} from '@heroicons/react/24/outline';
import { signOut } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { prestamosService } from '@/lib/supabase'; // Import para consulta de aprobaciones pendientes

export default function Sidebar({ user, isOpen, setIsOpen }) {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);

  // Cierra el menú móvil cuando cambia la ruta
  useEffect(() => {
    setIsOpen(false);
  }, [pathname, setIsOpen]);

  // Obtener conteo de aprobaciones pendientes
  useEffect(() => {
    // Solo cargar para administradores
    if (user?.rol === 'administrador' || user?.rol === 'admin_sistema') {
      const fetchPendingApprovals = async () => {
        try {
          const count = await prestamosService.getPendingApprovalsCount();
          setPendingApprovalsCount(count);
        } catch (error) {
            if (error.message === 'Cannot read properties of null (reading \'count\')') {
                console.warn('No se encontraron aprobaciones pendientes.');
                setPendingApprovalsCount(0);
            }
          console.error('Error al obtener conteo de aprobaciones pendientes:', error);
          setPendingApprovalsCount(0);
        }
      };
      
      fetchPendingApprovals();
      // Opcionalmente, configurar un intervalo para actualizar cada cierto tiempo
    }
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  // Menú basado en el rol del usuario
  const getMenuItems = () => {
    const baseItems = [
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: HomeIcon,
        roles: ['admin_sistema', 'administrador', 'supervisor', 'asesor'],
      },
    ];

    const roleSpecificItems = [
      {
        name: 'Clientes',
        href: '/clientes',
        icon: UserGroupIcon,
        roles: ['administrador', 'supervisor', 'asesor'],
      },
      {
        name: 'Préstamos',
        href: '/prestamos',
        icon: CurrencyDollarIcon,
        roles: ['administrador', 'supervisor', 'asesor'],
      },
      // Nuevo ítem de menú para aprobaciones de préstamos
      {
        name: 'Aprobación',
        href: '/prestamos/aprobaciones',
        icon: CheckIcon,
        roles: ['administrador'],
        badge: true // Para mostrar un badge con notificaciones
      },
      {
        name: 'Cobranzas',
        href: '/cobranzas',
        icon: DocumentTextIcon,
        roles: ['administrador', 'supervisor', 'asesor'],
      },
      {
        name: 'Finanzas',
        href: '/finanzas',
        icon: ChartBarIcon,
        roles: ['administrador'],
      },
      {
        name: 'Metas',
        href: '/metas',
        icon: TrophyIcon,
        roles: ['administrador', 'supervisor'],
      },
      {
        name: 'Configuración',
        href: '/configuracion',
        icon: Cog6ToothIcon,
        roles: ['admin_sistema'],
      },
    ];
    
    // Filtrar los elementos según el rol del usuario
    return [
      ...baseItems,
      ...roleSpecificItems.filter(item => item.roles.includes(user?.rol || ''))
    ];
  };

  const menuItems = getMenuItems();

  return (
    <>
      {/* Sidebar para escritorio */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-indigo-800">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <h1 className="text-white text-2xl font-bold">ProFinanzas</h1>
            </div>
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`${
                    pathname === item.href || pathname.startsWith(`${item.href}/`)
                      ? 'bg-indigo-900 text-white'
                      : 'text-indigo-100 hover:bg-indigo-700'
                  } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                >
                  <item.icon className="mr-3 h-6 w-6" aria-hidden="true" />
                  {item.name}
                  {/* Badge para notificaciones */}
                  {item.badge && pendingApprovalsCount > 0 && (
                    <span className="inline-flex ml-auto items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {pendingApprovalsCount}
                    </span>
                  )}
                </Link>
              ))}
              <button
                onClick={handleSignOut}
                className="text-indigo-100 hover:bg-indigo-700 w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md"
              >
                <ArrowLeftOnRectangleIcon className="mr-3 h-6 w-6" aria-hidden="true" />
                Cerrar sesión
              </button>
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-indigo-700 p-4">
            <div className="flex-shrink-0 w-full group block">
              <div className="flex items-center">
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">{user?.nombre} {user?.apellido}</p>
                  <p className="text-xs font-medium text-indigo-200">{user?.rol}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Botón de menú móvil */}
      <div className="md:hidden fixed top-0 left-0 w-full bg-indigo-800 z-50">
        <div className="flex items-center justify-between h-16 px-4">
          <h1 className="text-white text-xl font-bold">ProFinanzas</h1>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-md text-indigo-100 hover:bg-indigo-700"
          >
            <svg
              className="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              {isOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Menú móvil */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setIsOpen(false)} />
          <div className="fixed inset-y-0 left-0 flex flex-col w-full max-w-xs bg-indigo-800 z-50">
            <div className="flex-1 flex flex-col min-h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center justify-between px-4">
                <h1 className="text-white text-xl font-bold">ProFinanzas</h1>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-md text-indigo-100 hover:bg-indigo-700"
                >
                  <svg
                    className="h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {menuItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${
                      pathname === item.href || pathname.startsWith(`${item.href}/`)
                        ? 'bg-indigo-900 text-white'
                        : 'text-indigo-100 hover:bg-indigo-700'
                    } group flex items-center px-2 py-2 text-base font-medium rounded-md`}
                    onClick={() => setIsOpen(false)}
                  >
                    <item.icon className="mr-3 h-6 w-6" aria-hidden="true" />
                    {item.name}
                    {/* Badge para notificaciones (versión móvil) */}
                    {item.badge && pendingApprovalsCount > 0 && (
                      <span className="inline-flex ml-auto items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {pendingApprovalsCount}
                      </span>
                    )}
                  </Link>
                ))}
                <button
                  onClick={handleSignOut}
                  className="text-indigo-100 hover:bg-indigo-700 w-full group flex items-center px-2 py-2 text-base font-medium rounded-md"
                >
                  <ArrowLeftOnRectangleIcon className="mr-3 h-6 w-6" aria-hidden="true" />
                  Cerrar sesión
                </button>
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-indigo-700 p-4">
              <div className="flex-shrink-0 w-full group block">
                <div className="flex items-center">
                  <div className="ml-3">
                    <p className="text-sm font-medium text-white">{user?.nombre} {user?.apellido}</p>
                    <p className="text-xs font-medium text-indigo-200">{user?.rol}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}