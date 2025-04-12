'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { prestamosService } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import toast from 'react-hot-toast';
import { 
  MagnifyingGlassIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

export default function AprobacionesPage() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('pendientes');
  const [solicitudesPendientes, setSolicitudesPendientes] = useState([]);
  const [historialAprobaciones, setHistorialAprobaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroHistorial, setFiltroHistorial] = useState('todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [solicitudActual, setSolicitudActual] = useState(null);
  const [comentarios, setComentarios] = useState('');
  const [modalTipo, setModalTipo] = useState('aprobar');
  const router = useRouter();

  useEffect(() => {
    const fetchUserAndData = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.push('/login');
          return;
        }

        // Verificar que el usuario sea administrador
        if (currentUser.rol !== 'administrador' && currentUser.rol !== 'admin_sistema') {
          toast.error('No tienes permisos para acceder a esta sección');
          router.push('/dashboard');
          return;
        }

        setUser(currentUser);
        await Promise.all([
          cargarSolicitudesPendientes(),
          cargarHistorialAprobaciones()
        ]);
      } catch (error) {
        console.error('Error al obtener datos:', error);
        toast.error('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndData();
  }, [router]);

  const cargarSolicitudesPendientes = async () => {
    try {
      // En un sistema real, esta sería una llamada a la API
      // const data = await prestamosService.getSolicitudesPendientes();
      
      // Datos de ejemplo para simulación
      const solicitudesData = [
        {
          id: 208,
          cliente: { id: 4, nombre: 'Carlos', apellido: 'Rodríguez', dni: '78912345', historial_pagos: 'Bueno' },
          monto: 2000,
          interes: 10,
          monto_total: 2200,
          fecha_solicitud: '2025-03-15T14:30:00',
          solicitado_por: { id: 3, nombre: 'Carlos', apellido: 'González' },
          tipo: 'nuevo',
          motivo: 'Inversión en negocio',
          prestamo_anterior: null
        },
        {
          id: 207,
          cliente: { id: 1, nombre: 'María', apellido: 'López', dni: '45678912', historial_pagos: 'Bueno' },
          monto: 1500,
          interes: 10,
          monto_total: 1650,
          fecha_solicitud: '2025-03-14T10:45:00',
          solicitado_por: { id: 2, nombre: 'María', apellido: 'López' },
          tipo: 'renovacion',
          motivo: 'Ampliación de capital',
          prestamo_anterior: { id: 101, monto: 1000, cuotas_pagadas: 30, total_cuotas: 30 }
        },
        {
          id: 206,
          cliente: { id: 5, nombre: 'Lucía', apellido: 'Mendoza', dni: '56789123', historial_pagos: 'Regular' },
          monto: 800,
          interes: 12,
          monto_total: 896,
          fecha_solicitud: '2025-03-13T16:15:00',
          solicitado_por: { id: 4, nombre: 'Ana', apellido: 'Martínez' },
          tipo: 'nuevo',
          motivo: 'Gastos familiares',
          prestamo_anterior: null
        }
      ];
      
      setSolicitudesPendientes(solicitudesData);
    } catch (error) {
      console.error('Error al cargar solicitudes pendientes:', error);
      toast.error('Error al cargar las solicitudes');
      throw error;
    }
  };

  const cargarHistorialAprobaciones = async () => {
    try {
      // En un sistema real, esta sería una llamada a la API
      // const data = await prestamosService.getHistorialAprobaciones();
      
      // Datos de ejemplo para simulación
      const historialData = [
        {
          id: 205,
          cliente: { id: 1, nombre: 'María', apellido: 'López', dni: '45678912' },
          monto: 1500,
          interes: 10,
          monto_total: 1650,
          estado_aprobacion: 'aprobado',
          fecha_solicitud: '2025-03-10T10:30:00',
          fecha_aprobacion: '2025-03-10T14:45:00',
          aprobado_por: { id: 6, nombre: 'Lucia', apellido: 'Ramírez' },
          tipo: 'nuevo'
        },
        {
          id: 204,
          cliente: { id: 2, nombre: 'Juan', apellido: 'Pérez', dni: '12345678' },
          monto: 2000,
          interes: 12,
          monto_total: 2240,
          estado_aprobacion: 'rechazado',
          fecha_solicitud: '2025-03-08T14:45:00',
          fecha_aprobacion: '2025-03-09T09:15:00',
          aprobado_por: { id: 6, nombre: 'Lucia', apellido: 'Ramírez' },
          comentarios_aprobacion: 'Cliente con alto riesgo de morosidad',
          tipo: 'renovacion'
        },
        {
          id: 203,
          cliente: { id: 3, nombre: 'Ana', apellido: 'García', dni: '87654321' },
          monto: 1200,
          interes: 10,
          monto_total: 1320,
          estado_aprobacion: 'aprobado',
          fecha_solicitud: '2025-03-05T09:30:00',
          fecha_aprobacion: '2025-03-05T11:20:00',
          aprobado_por: { id: 6, nombre: 'Lucia', apellido: 'Ramírez' },
          tipo: 'nuevo'
        }
      ];
      
      setHistorialAprobaciones(historialData);
    } catch (error) {
      console.error('Error al cargar historial de aprobaciones:', error);
      toast.error('Error al cargar el historial');
      throw error;
    }
  };

  // Filtrar solicitudes pendientes según término de búsqueda
  const solicitudesFiltradas = solicitudesPendientes.filter(item => {
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      item.cliente.nombre.toLowerCase().includes(searchLower) ||
      item.cliente.apellido.toLowerCase().includes(searchLower) ||
      item.cliente.dni.includes(searchTerm) ||
      item.id.toString().includes(searchTerm)
    );
  });

  // Filtrar historial según término de búsqueda y filtro de estado
  const historialFiltrado = historialAprobaciones
    .filter(item => {
      if (filtroHistorial === 'todos') return true;
      return item.estado_aprobacion === filtroHistorial;
    })
    .filter(item => {
      if (!searchTerm.trim()) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        item.cliente.nombre.toLowerCase().includes(searchLower) ||
        item.cliente.apellido.toLowerCase().includes(searchLower) ||
        item.cliente.dni.includes(searchTerm) ||
        item.id.toString().includes(searchTerm)
      );
    });

  const handleAprobar = (solicitud) => {
    setSolicitudActual(solicitud);
    setComentarios('');
    setModalTipo('aprobar');
    setIsModalOpen(true);
  };

  const handleRechazar = (solicitud) => {
    setSolicitudActual(solicitud);
    setComentarios('');
    setModalTipo('rechazar');
    setIsModalOpen(true);
  };

  const confirmarAccion = async () => {
    if (!solicitudActual) return;
    
    try {
      // En un sistema real, esto enviaría la aprobación o rechazo al backend
      const accion = modalTipo === 'aprobar' ? 'aprobada' : 'rechazada';
      
      // Simulación de llamada al servicio
      // await prestamosService.procesarSolicitud(solicitudActual.id, {
      //   estado: modalTipo === 'aprobar' ? 'aprobado' : 'rechazado',
      //   comentarios,
      //   aprobador_id: user.id
      // });
      
      // Quitar la solicitud procesada de la lista
      setSolicitudesPendientes(solicitudesPendientes.filter(s => s.id !== solicitudActual.id));
      
      // Agregar al historial
      const nuevaAprobacion = {
        ...solicitudActual,
        estado_aprobacion: modalTipo === 'aprobar' ? 'aprobado' : 'rechazado',
        fecha_aprobacion: new Date().toISOString(),
        aprobado_por: { id: user.id, nombre: user.nombre, apellido: user.apellido },
        comentarios_aprobacion: comentarios || undefined
      };
      
      setHistorialAprobaciones([nuevaAprobacion, ...historialAprobaciones]);
      
      setIsModalOpen(false);
      toast.success(`Solicitud ${accion} correctamente`);
    } catch (error) {
      console.error('Error al procesar solicitud:', error);
      toast.error(`Error al procesar la solicitud: ${error.message}`);
    }
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
        <h2 className="text-xl font-semibold text-gray-800">Gestión de Aprobaciones</h2>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          Volver
        </button>
      </div>
      
      {/* Pestañas de navegación */}
      <div className="mb-6">
        <nav className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('pendientes')}
            className={`py-4 px-6 font-medium text-sm ${
              activeTab === 'pendientes' 
                ? 'border-b-2 border-indigo-500 text-indigo-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Pendientes
            {solicitudesPendientes.length > 0 && (
              <span className="ml-2 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                {solicitudesPendientes.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('historial')}
            className={`py-4 px-6 font-medium text-sm ${
              activeTab === 'historial' 
                ? 'border-b-2 border-indigo-500 text-indigo-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Historial
          </button>
        </nav>
      </div>
      
      {/* Búsqueda y filtros */}
      <div className="mb-4 flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
        {activeTab === 'historial' && (
          <div className="md:w-48">
            <select
              className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5"
              value={filtroHistorial}
              onChange={(e) => setFiltroHistorial(e.target.value)}
            >
              <option value="todos">Todos los estados</option>
              <option value="aprobado">Aprobados</option>
              <option value="rechazado">Rechazados</option>
            </select>
          </div>
        )}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 p-2.5"
            placeholder={`Buscar por cliente o ID de ${activeTab === 'pendientes' ? 'solicitud' : 'préstamo'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {/* Contenido de la pestaña actual */}
      {activeTab === 'pendientes' ? (
        // Lista de solicitudes pendientes
        <div className="grid grid-cols-1 gap-4">
          {solicitudesFiltradas.length > 0 ? (
            solicitudesFiltradas.map((solicitud) => (
              <div key={solicitud.id} className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Solicitud #{solicitud.id} - {solicitud.tipo === 'nuevo' ? 'Nuevo préstamo' : 'Renovación'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Solicitado por: {solicitud.solicitado_por.nombre} {solicitud.solicitado_por.apellido} • {new Date(solicitud.fecha_solicitud).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => router.push(`/prestamos/${solicitud.id}`)}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                    >
                      Ver detalles
                    </button>
                    <button
                      onClick={() => handleRechazar(solicitud)}
                      className="px-3 py-1 text-sm bg-red-50 text-red-700 rounded-md hover:bg-red-100"
                    >
                      Rechazar
                    </button>
                    <button
                      onClick={() => handleAprobar(solicitud)}
                      className="px-3 py-1 text-sm bg-green-50 text-green-700 rounded-md hover:bg-green-100"
                    >
                      Aprobar
                    </button>
                  </div>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Cliente</h4>
                    <p className="text-sm font-semibold text-gray-900">{solicitud.cliente.nombre} {solicitud.cliente.apellido}</p>
                    <p className="text-xs text-gray-500">DNI: {solicitud.cliente.dni}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Historial: <span className={`px-1 py-0.5 rounded text-xs ${
                        solicitud.cliente.historial_pagos === 'Bueno' ? 'bg-green-100 text-green-800' :
                        solicitud.cliente.historial_pagos === 'Regular' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>{solicitud.cliente.historial_pagos}</span>
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Datos del préstamo</h4>
                    <p className="text-sm">
                      <span className="text-gray-600">Monto:</span> <span className="font-semibold text-gray-900">S/ {solicitud.monto.toFixed(2)}</span>
                    </p>
                    <p className="text-sm">
                      <span className="text-gray-600">Interés:</span> <span className="text-gray-900">{solicitud.interes}%</span>
                    </p>
                    <p className="text-sm">
                      <span className="text-gray-600">Total a pagar:</span> <span className="font-semibold text-gray-900">S/ {solicitud.monto_total.toFixed(2)}</span>
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Motivo</h4>
                    <p className="text-sm text-gray-900">{solicitud.motivo}</p>
                    {solicitud.tipo === 'renovacion' && solicitud.prestamo_anterior && (
                      <div className="mt-2 p-2 bg-blue-50 rounded-md">
                        <p className="text-xs text-blue-800">Préstamo anterior: #{solicitud.prestamo_anterior.id}</p>
                        <p className="text-xs text-blue-800">Monto: S/ {solicitud.prestamo_anterior.monto.toFixed(2)}</p>
                        <p className="text-xs text-blue-800">Cuotas pagadas: {solicitud.prestamo_anterior.cuotas_pagadas}/{solicitud.prestamo_anterior.total_cuotas}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <p className="text-gray-500">No hay solicitudes pendientes de aprobación</p>
            </div>
          )}
        </div>
      ) : (
        // Tabla de historial de aprobaciones
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Solicitado
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resolución
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revisado por
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {historialFiltrado.length > 0 ? (
                  historialFiltrado.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        #{item.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.cliente.nombre} {item.cliente.apellido}
                        </div>
                        <div className="text-xs text-gray-500">
                          DNI: {item.cliente.dni}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        S/ {item.monto.toFixed(2)}
                        <div className="text-xs text-gray-500">
                          {item.tipo === 'nuevo' ? 'Nuevo préstamo' : 'Renovación'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(item.fecha_solicitud).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          item.estado_aprobacion === 'aprobado' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {item.estado_aprobacion === 'aprobado' ? 'Aprobado' : 'Rechazado'}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(item.fecha_aprobacion).toLocaleDateString()}
                        </div>
                        {item.comentarios_aprobacion && (
                          <div className="text-xs text-gray-500 mt-1 italic">
                            "{item.comentarios_aprobacion}"
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.aprobado_por.nombre} {item.aprobado_por.apellido}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                        <button
                          onClick={() => router.push(`/prestamos/${item.id}`)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <EyeIcon className="h-5 w-5 inline" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                      No se encontraron registros
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Modal de confirmación */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${
                    modalTipo === 'aprobar' ? 'bg-green-100' : 'bg-red-100'
                  } sm:mx-0 sm:h-10 sm:w-10`}>
                    {modalTipo === 'aprobar' ? (
                      <CheckCircleIcon className="h-6 w-6 text-green-600" aria-hidden="true" />
                    ) : (
                      <XCircleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                    )}
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      {modalTipo === 'aprobar' ? 'Aprobar solicitud' : 'Rechazar solicitud'}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {modalTipo === 'aprobar' 
                          ? '¿Estás seguro de que deseas aprobar esta solicitud de préstamo?' 
                          : '¿Estás seguro de que deseas rechazar esta solicitud de préstamo?'
                        }
                      </p>
                      <div className="mt-4">
                        <label htmlFor="comentarios" className="block text-sm font-medium text-gray-700">
                          Comentarios {modalTipo === 'rechazar' && '(obligatorio)'}
                        </label>
                        <textarea
                          id="comentarios"
                          name="comentarios"
                          rows="3"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          placeholder={modalTipo === 'aprobar' ? 'Comentarios adicionales (opcional)' : 'Motivo del rechazo'}
                          value={comentarios}
                          onChange={(e) => setComentarios(e.target.value)}
                          required={modalTipo === 'rechazar'}
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${
                    modalTipo === 'aprobar' 
                      ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' 
                      : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                  }`}
                  onClick={confirmarAccion}
                  disabled={modalTipo === 'rechazar' && !comentarios.trim()}
                >
                  {modalTipo === 'aprobar' ? 'Aprobar' : 'Rechazar'}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}