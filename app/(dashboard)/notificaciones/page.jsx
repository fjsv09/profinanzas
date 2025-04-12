'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { BellIcon, CheckCircleIcon, XCircleIcon, ClockIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function NotificacionesPage() {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.push('/login');
          return;
        }
        setUser(currentUser);
      } catch (error) {
        console.error('Error al obtener usuario:', error);
        toast.error('Error al cargar los datos');
      }
    };
    
    fetchUser();
  }, [router]);

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
        //   .order('created_at', { ascending: false });
        
        // Simulación para el ejemplo
        let notificacionesSimuladas = [];
        
        if (user.rol === 'administrador' || user.rol === 'admin_sistema') {
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
            },
            {
              id: 5,
              tipo: 'aprobacion_pendiente',
              titulo: 'Préstamo pendiente de aprobación',
              mensaje: 'Nueva solicitud de préstamo por S/ 800.00 para Ana García',
              entidad_id: 203,
              fecha: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 horas atrás
              leida: true
            }
          ];
        } else {
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
            },
            {
              id: 6,
              tipo: 'prestamo_aprobado',
              titulo: 'Préstamo aprobado',
              mensaje: 'El préstamo para Juan Pérez por S/ 2,000.00 ha sido aprobado',
              entidad_id: 204,
              fecha: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 día atrás
              leida: true
            }
          ];
        }
        
        setNotificaciones(notificacionesSimuladas);
      } catch (error) {
        console.error('Error al cargar notificaciones:', error);
        toast.error('Error al cargar notificaciones');
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotificaciones();
  }, [user, router]);

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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    
    // Si es hoy, mostrar la hora
    if (date.toDateString() === now.toDateString()) {
      return `Hoy a las ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    }
    
    // Si es ayer
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Ayer a las ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    }
    
    // Otro día
    return date.toLocaleDateString([], {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleMarcarTodoLeido = () => {
    setNotificaciones(prev => prev.map(item => ({ ...item, leida: true })));
    toast.success('Todas las notificaciones marcadas como leídas');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <button
            onClick={() => router.back()}
            className="p-2 mr-2 text-gray-500 rounded-full hover:bg-gray-100"
            aria-label="Volver"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <h2 className="text-xl font-semibold text-gray-800">
            Notificaciones
          </h2>
        </div>
        
        {notificaciones.some(n => !n.leida) && (
          <button
            onClick={handleMarcarTodoLeido}
            className="px-4 py-2 text-sm text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors"
          >
            Marcar todo como leído
          </button>
        )}
      </div>
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {notificaciones.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {notificaciones.map((notificacion) => (
              <li 
                key={notificacion.id}
                className={`hover:bg-gray-50 cursor-pointer ${!notificacion.leida ? 'bg-blue-50' : ''}`}
                onClick={() => handleNotificacionClick(notificacion)}
              >
                <div className="px-6 py-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 pt-1">
                      {getNotificationIcon(notificacion.tipo)}
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium text-gray-900 ${!notificacion.leida ? 'font-semibold' : ''}`}>
                          {notificacion.titulo}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(notificacion.fecha)}
                        </p>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">
                        {notificacion.mensaje}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="py-8 text-center text-gray-500">
            No tienes notificaciones
          </div>
        )}
      </div>
    </div>
  );
}