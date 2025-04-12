'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { prestamosService, clientesService } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import { CheckCircleIcon, XCircleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function VerSolicitudPrestamoPage({ params }) {
  // Acceso directo al ID sin usar la función use()
  const prestamoId = params.id;
  const [user, setUser] = useState(null);
  const [prestamo, setPrestamo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aprobacionEnProceso, setAprobacionEnProceso] = useState(false);
  
  const [showRechazoModal, setShowRechazoModal] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  
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
        await fetchPrestamo();
      } catch (error) {
        console.error('Error al obtener datos:', error);
        toast.error('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndData();
  }, [prestamoId, router]);

  const fetchPrestamo = async () => {
    try {
      // En un sistema real, esto sería:
      // const prestamoData = await prestamosService.getById(prestamoId);
      
      // Simulación para el ejemplo
      const prestamoData = {
        id: parseInt(prestamoId),
        cliente: {
          id: 1,
          nombre: 'María',
          apellido: 'López',
          dni: '45678912',
          telefono: '987654321',
          direccion: 'Av. Los Pinos 123',
          historial_pagos: 'Bueno'
        },
        asesor: {
          id: 3,
          nombre: 'Carlos',
          apellido: 'González'
        },
        monto: 1500,
        interes: 10,
        monto_total: 1650,
        frecuencia_pago: 'diario',
        total_cuotas: 30,
        cuotas_pagadas: 0,
        estado: 'pendiente',
        estado_aprobacion: 'pendiente',
        fecha_solicitud: '2025-03-15T10:30:00',
        tipo: 'nuevo',
        historial_cliente: [
          { id: 120, monto: 1000, estado: 'completado', fecha: '2024-12-15' },
          { id: 105, monto: 800, estado: 'completado', fecha: '2024-09-10' }
        ]
      };

      setPrestamo(prestamoData);
    } catch (error) {
      console.error('Error al obtener préstamo:', error);
      toast.error('Error al cargar los datos del préstamo');
    }
  };

  const handleAprobarPrestamo = async () => {
    try {
      setAprobacionEnProceso(true);
      
      // En un sistema real, esta sería una llamada a la API
      // await prestamosService.aprobarPrestamo(prestamoId, {
      //   aprobado_por: user.id,
      //   fecha_aprobacion: new Date().toISOString()
      // });
      
      // Simulación
      await new Promise(resolve => setTimeout(resolve, 800));
      
      toast.success('Préstamo aprobado con éxito');
      router.push('/prestamos/aprobaciones');
    } catch (error) {
      console.error('Error al aprobar préstamo:', error);
      toast.error('Error al aprobar el préstamo');
    } finally {
      setAprobacionEnProceso(false);
    }
  };

  const handleRechazarPrestamo = async () => {
    if (!motivoRechazo.trim()) {
      toast.error('Debe ingresar un motivo de rechazo');
      return;
    }
    
    try {
      setAprobacionEnProceso(true);
      
      // En un sistema real, esta sería una llamada a la API
      // await prestamosService.rechazarPrestamo(prestamoId, {
      //   aprobado_por: user.id,
      //   fecha_aprobacion: new Date().toISOString(),
      //   comentarios_aprobacion: motivoRechazo
      // });
      
      // Simulación
      await new Promise(resolve => setTimeout(resolve, 800));
      
      toast.success('Préstamo rechazado');
      setShowRechazoModal(false);
      router.push('/prestamos/aprobaciones');
    } catch (error) {
      console.error('Error al rechazar préstamo:', error);
      toast.error('Error al rechazar el préstamo');
    } finally {
      setAprobacionEnProceso(false);
    }
  };

  if (loading || !prestamo) {
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
            Solicitud de Préstamo #{prestamo.id}
          </h2>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={handleAprobarPrestamo}
            disabled={aprobacionEnProceso}
            className="px-4 py-2 flex items-center text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <CheckCircleIcon className="h-5 w-5 mr-2" />
            {aprobacionEnProceso ? 'Procesando...' : 'Aprobar Préstamo'}
          </button>
          <button
            onClick={() => setShowRechazoModal(true)}
            disabled={aprobacionEnProceso}
            className="px-4 py-2 flex items-center text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            <XCircleIcon className="h-5 w-5 mr-2" />
            Rechazar
          </button>
        </div>
      </div>
      
      {/* Información del préstamo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Información del cliente */}
        <div className="md:col-span-1">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Información del Cliente</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-500">Nombre Completo</p>
                <p className="text-base text-gray-900">{prestamo.cliente.nombre} {prestamo.cliente.apellido}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">DNI</p>
                <p className="text-base text-gray-900">{prestamo.cliente.dni}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Teléfono</p>
                <p className="text-base text-gray-900">{prestamo.cliente.telefono}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Dirección</p>
                <p className="text-base text-gray-900">{prestamo.cliente.direccion}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Historial de Pagos</p>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  prestamo.cliente.historial_pagos === 'Bueno'
                    ? 'bg-green-100 text-green-800'
                    : prestamo.cliente.historial_pagos === 'Regular'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {prestamo.cliente.historial_pagos}
                </span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-500 mb-2">Préstamos anteriores</p>
              {prestamo.historial_cliente && prestamo.historial_cliente.length > 0 ? (
                <div className="space-y-2">
                  {prestamo.historial_cliente.map(historico => (
                    <div key={historico.id} className="flex justify-between text-sm">
                      <span>Préstamo #{historico.id}</span>
                      <span>S/ {historico.monto.toFixed(2)}</span>
                      <span className={`${
                        historico.estado === 'completado' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {historico.estado}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Sin préstamos anteriores</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Detalles del préstamo */}
        <div className="md:col-span-2">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Detalles de la Solicitud</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Tipo de solicitud</p>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  prestamo.tipo === 'nuevo' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-purple-100 text-purple-800'
                }`}>
                  {prestamo.tipo === 'nuevo' ? 'Préstamo Nuevo' : 'Renovación'}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Fecha de solicitud</p>
                <p className="text-base text-gray-900">{new Date(prestamo.fecha_solicitud).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Asesor responsable</p>
                <p className="text-base text-gray-900">{prestamo.asesor.nombre} {prestamo.asesor.apellido}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Monto solicitado</p>
                <p className="text-xl font-semibold text-gray-900">S/ {prestamo.monto.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Interés</p>
                <p className="text-base text-gray-900">{prestamo.interes}%</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Monto total a pagar</p>
                <p className="text-base text-gray-900">S/ {prestamo.monto_total.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Frecuencia de pago</p>
                <p className="text-base text-gray-900 capitalize">{prestamo.frecuencia_pago}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Número de cuotas</p>
                <p className="text-base text-gray-900">{prestamo.total_cuotas}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Valor de cuota</p>
                <p className="text-base text-gray-900">S/ {(prestamo.monto_total / prestamo.total_cuotas).toFixed(2)}</p>
              </div>
            </div>
            
            {/* Calculadora de capacidad de pago (simulado) */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-md font-medium text-gray-900 mb-4">Análisis de Capacidad de Pago</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-500">Ingresos estimados</p>
                    <p className="text-lg font-semibold text-gray-900">S/ 2,500.00</p>
                  </div>
                </div>
                <div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-500">Gastos estimados</p>
                    <p className="text-lg font-semibold text-gray-900">S/ 1,800.00</p>
                  </div>
                </div>
                <div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-500">Capacidad de pago</p>
                    <p className="text-lg font-semibold text-gray-900">S/ 700.00</p>
                  </div>
                </div>
                <div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-500">Recomendación</p>
                    <p className="text-lg font-semibold text-green-600">Aprobar</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal de rechazo */}
      {showRechazoModal && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <XCircleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Rechazar préstamo
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Estás a punto de rechazar la solicitud de préstamo de <span className="font-medium">{prestamo.cliente.nombre} {prestamo.cliente.apellido}</span>. Por favor, ingresa el motivo del rechazo.
                      </p>
                      <div className="mt-4">
                        <textarea
                          rows="3"
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          placeholder="Motivo del rechazo"
                          value={motivoRechazo}
                          onChange={(e) => setMotivoRechazo(e.target.value)}
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleRechazarPrestamo}
                  disabled={!motivoRechazo.trim() || aprobacionEnProceso}
                >
                  {aprobacionEnProceso ? 'Procesando...' : 'Rechazar'}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowRechazoModal(false)}
                  disabled={aprobacionEnProceso}
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