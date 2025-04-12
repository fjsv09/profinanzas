'use client';
import { useState, useEffect, useRef } from 'react';
import { BellIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export default function NotificacionesDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const router = useRouter();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error al obtener usuario:', error);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchNotificaciones = async () => {
      try {
        setLoading(true);

        // En un sistema real, obtendríamos las notificaciones de la base de datos
        // const { data, error } = await supabase
        //   .from('notificaciones')
        //   .select('*')
        //   .eq('usuario_id', user.id)
        //   .order('created_at', { ascending: false })
        //   .limit(5);

        // Simulación para el ejemplo
        let notificacionesSimuladas = [];

        if (user.rol === 'administrador') {
          // Notificaciones para administradores
          notificacionesSimuladas = [
            {
              id: 1,
              tipo: 'aprobacion_pendiente',
              titulo: 'Préstamo pendiente de aprobación',
              mensaje: 'Nueva solicitud de préstamo por S/ 1,500.00 para María López',
              entidad_id: 201,
              fecha: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutos atrás
              leida: false
            },
            {
              id: 2,
              tipo: 'aprobacion_pendiente',
              titulo: 'Renovación pendiente de aprobación',
              mensaje: 'Juan Pérez solicita renovación de préstamo por S/ 2,000.00',
              entidad_id: 202,
              fecha: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 horas atrás
              leida: false
            }
          ];
        } else if (user.rol === 'asesor') {
          // Notificaciones para asesores
          notificacionesSimuladas = [
            {
              id: 3,
              tipo: 'prestamo_aprobado',
              titulo: 'Préstamo aprobado',
              mensaje: 'El préstamo para María López por S/ 1,500.00 ha sido aprobado',
              entidad_id: 201,
              fecha: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 minutos atrás
              leida: false
            },
            {
              id: 4,
              tipo: 'prestamo_rechazado',
              titulo: 'Préstamo rechazado',
              mensaje: 'El préstamo para Carlos Rodríguez ha sido rechazado',
              entidad_id: 203,
              fecha: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 horas atrás
              leida: true
            }
          ];
        }

        setNotificaciones(notificacionesSimuladas);
      } catch (error) {
        console.error('Error al cargar notificaciones:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotificaciones();

    // Opcional: establecer un intervalo para actualizar periódicamente
    const interval = setInterval(fetchNotificaciones, 60000); // cada minuto

    return () => clearInterval(interval);
  }, [user]);

  const handleNotificacionClick = (notificacion) => {
    // Marcar como leída
    setNotificaciones(prev =>
      prev.map(item => item.id === notificacion.id ? { ...item, leida: true } : item)
    );

    // Redirigir según el tipo
    if (notificacion.tipo === 'aprobacion_pendiente') {
      router.push(`/prestamos/solicitud/${notificacion.entidad_id}`);
    } else if (notificacion.tipo === 'prestamo_aprobado' || notificacion.tipo === 'prestamo_rechazado') {
      router.push(`/prestamos/${notificacion.entidad_id}`);
    }

    setIsOpen(false);
  };

  const marcarTodasComoLeidas = () => {
    setNotificaciones(prev =>
      prev.map(item => ({ ...item, leida: true }))
    );
  };

  const getNotificationIcon = (tipo) => {
    switch (tipo) {
      case 'aprobacion_pendiente':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'prestamo_aprobado':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'prestamo_rechazado':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <BellIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const noLeidasCount = notificaciones.filter(n => !n.leida).length;

  // Cerrar el dropdown cuando se hace clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Manejar el escape para cerrar el dropdown
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        aria-expanded={isOpen}
      >
        <span className="sr-only">Notificaciones</span>
        <BellIcon className="h-6 w-6" aria-hidden="true" />
        {noLeidasCount > 0 && (
          <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
            {noLeidasCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Overlay para móviles */}
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 sm:hidden z-40" onClick={() => setIsOpen(false)}></div>
          
          {/* Dropdown para móviles */}
          <div className="fixed bottom-0 inset-x-0 rounded-t-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 w-full z-50 sm:hidden">
            <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
              <div className="px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-sm font-medium text-gray-900">Notificaciones</h3>
                {noLeidasCount > 0 && (
                  <button
                    onClick={marcarTodasComoLeidas}
                    className="text-xs text-indigo-600 hover:text-indigo-800"
                  >
                    Marcar todo como leído
                  </button>
                )}
              </div>

              {loading ? (
                <div className="px-4 py-3 text-center">
                  <div className="animate-spin inline-block h-5 w-5 border-t-2 border-b-2 border-indigo-500 rounded-full"></div>
                </div>
              ) : notificaciones.length > 0 ? (
                <div className="max-h-80 overflow-y-auto">
                  {notificaciones.map((notificacion) => (
                    <div
                      key={notificacion.id}
                      className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${!notificacion.leida ? 'bg-blue-50' : ''}`}
                      onClick={() => handleNotificacionClick(notificacion)}
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          {getNotificationIcon(notificacion.tipo)}
                        </div>
                        <div className="ml-3 w-0 flex-1">
                          <p className={`text-sm font-medium text-gray-900 ${!notificacion.leida ? 'font-semibold' : ''}`}>
                            {notificacion.titulo}
                          </p>
                          <p className="text-sm text-gray-500 line-clamp-2">
                            {notificacion.mensaje}
                          </p>
                          <p className="mt-1 text-xs text-gray-400">
                            {new Date(notificacion.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-3 text-center text-sm text-gray-500">
                  No tienes notificaciones
                </div>
              )}

              {notificaciones.length > 0 && (
                <div className="px-4 py-2 border-t border-gray-200 flex justify-center">
                  <button
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium py-2"
                    onClick={() => {
                      router.push('/notificaciones');
                      setIsOpen(false);
                    }}
                  >
                    Ver todas las notificaciones
                  </button>
                </div>
              )}
              
              {/* Botón de cerrar para móviles */}
              <div className="border-t border-gray-200 p-2">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full py-2 bg-gray-100 text-gray-600 rounded-md text-sm font-medium hover:bg-gray-200"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
          
          {/* Dropdown para escritorio */}
          <div className="hidden sm:block absolute right-0 mt-2 w-80 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
            <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
              <div className="px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-sm font-medium text-gray-900">Notificaciones</h3>
                {noLeidasCount > 0 && (
                  <button
                    onClick={marcarTodasComoLeidas}
                    className="text-xs text-indigo-600 hover:text-indigo-800"
                  >
                    Marcar todo como leído
                  </button>
                )}
              </div>

              {loading ? (
                <div className="px-4 py-3 text-center">
                  <div className="animate-spin inline-block h-5 w-5 border-t-2 border-b-2 border-indigo-500 rounded-full"></div>
                </div>
              ) : notificaciones.length > 0 ? (
                <div className="max-h-80 overflow-y-auto">
                  {notificaciones.map((notificacion) => (
                    <div
                      key={notificacion.id}
                      className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${!notificacion.leida ? 'bg-blue-50' : ''}`}
                      onClick={() => handleNotificacionClick(notificacion)}
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          {getNotificationIcon(notificacion.tipo)}
                        </div>
                        <div className="ml-3 w-0 flex-1">
                          <p className={`text-sm font-medium text-gray-900 ${!notificacion.leida ? 'font-semibold' : ''}`}>
                            {notificacion.titulo}
                          </p>
                          <p className="text-sm text-gray-500 line-clamp-2">
                            {notificacion.mensaje}
                          </p>
                          <p className="mt-1 text-xs text-gray-400">
                            {new Date(notificacion.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-3 text-center text-sm text-gray-500">
                  No tienes notificaciones
                </div>
              )}

              {notificaciones.length > 0 && (
                <div className="px-4 py-2 border-t border-gray-200 flex justify-center">
                  <button
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium py-2"
                    onClick={() => {
                      router.push('/notificaciones');
                      setIsOpen(false);
                    }}
                  >
                    Ver todas las notificaciones
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}