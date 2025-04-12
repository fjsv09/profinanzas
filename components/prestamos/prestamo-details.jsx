'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  DocumentTextIcon, 
  ArrowPathIcon, 
  UserIcon, 
  CurrencyDollarIcon, 
  TrashIcon,
  PencilSquareIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function PrestamoDetails({ prestamo, usuario, onDelete }) {
  const router = useRouter();
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Verificar si el usuario puede editar un préstamo
  const puedeEditar = () => {
    if (!usuario) return false;
    if (['administrador', 'admin_sistema'].includes(usuario.rol)) return true;
    // Los supervisores no pueden editar préstamos
    // Los asesores no pueden editar préstamos
    return false;
  };

  // Verificar si el usuario puede eliminar un préstamo
  const puedeEliminar = () => {
    if (!usuario) return false;
    return ['administrador', 'admin_sistema'].includes(usuario.rol);
  };

  // Verificar si el usuario puede registrar pagos
  const puedeRegistrarPagos = () => {
    if (!usuario) return false;
    // Todos los roles pueden registrar pagos
    return ['admin_sistema', 'administrador', 'supervisor', 'asesor'].includes(usuario.rol);
  };

  // Verificar si el usuario puede renovar préstamos
  const puedeRenovar = () => {
    if (!usuario) return false;
    if (['administrador', 'admin_sistema'].includes(usuario.rol)) return true;
    // Los supervisores no pueden renovar préstamos
    // Los asesores solo pueden solicitar renovaciones, no aprobarlas directamente
    if (usuario.rol === 'asesor') return true;
    return false;
  };
  
  useEffect(() => {
    const fetchPagos = async () => {
      if (!prestamo) return;
      
      try {
        // En un sistema real, estos datos vendrían de una API
        // Aquí solo simulamos los pagos basado en el préstamo
        const pagosSimulados = [];
        const fechaBase = new Date(prestamo.fecha_inicio);
        const montoCuota = prestamo.monto_total / prestamo.total_cuotas;
        
        for (let i = 0; i < prestamo.cuotas_pagadas; i++) {
          const fechaPago = new Date(fechaBase);
          fechaPago.setDate(fechaPago.getDate() + (i+1));
          
          pagosSimulados.push({
            id: i + 1,
            prestamo_id: prestamo.id,
            monto: montoCuota.toFixed(2),
            fecha_pago: fechaPago.toISOString(),
            metodo_pago: i % 2 === 0 ? 'efectivo' : 'yape',
            created_at: fechaPago.toISOString(),
            created_by: 'Usuario Ejemplo'
          });
        }
        
        setPagos(pagosSimulados);
        setLoading(false);
      } catch (error) {
        console.error('Error al cargar pagos:', error);
        toast.error('Error al cargar el historial de pagos');
        setLoading(false);
      }
    };
    
    fetchPagos();
  }, [prestamo]);
  
  if (!prestamo) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <p className="text-gray-500">No se encontró información del préstamo</p>
      </div>
    );
  }
  
  const calcularProximaFecha = () => {
    if (prestamo.cuotas_pagadas >= prestamo.total_cuotas) {
      return 'Préstamo completado';
    }
    
    const ultimoPago = pagos.length > 0
      ? new Date(pagos[pagos.length - 1].fecha_pago)
      : new Date(prestamo.fecha_inicio);
    
    const incrementoDias = {
      'diario': 1,
      'semanal': 7,
      'quincenal': 15,
      'mensual': 30
    };
    
    const proximaFecha = new Date(ultimoPago);
    proximaFecha.setDate(proximaFecha.getDate() + incrementoDias[prestamo.frecuencia_pago]);
    
    return proximaFecha.toLocaleDateString();
  };
  
  const montoCuota = prestamo.monto_total / prestamo.total_cuotas;
  const progresoTotalPorcentaje = (prestamo.cuotas_pagadas / prestamo.total_cuotas) * 100;
  const proximaFecha = calcularProximaFecha();
  
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <h3 className="text-lg font-medium text-gray-900">Detalles del Préstamo #{prestamo.id}</h3>
          <div className="flex flex-wrap gap-2">
            {puedeEditar() && (
              <button
                onClick={() => router.push(`/prestamos/${prestamo.id}/editar`)}
                className="px-3 py-1 text-sm text-white bg-yellow-600 rounded-md hover:bg-yellow-700 transition-colors flex items-center"
              >
                <PencilSquareIcon className="h-4 w-4 mr-1" />
                Editar
              </button>
            )}
            <button
              onClick={() => router.push(`/prestamos/${prestamo.id}/contrato`)}
              className="px-3 py-1 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors flex items-center"
            >
              <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
              Ver contrato
            </button>
            
            {prestamo.estado === 'activo' && (
              <>
                {puedeRegistrarPagos() && (
                  <button
                    onClick={() => router.push(`/cobranzas?prestamo=${prestamo.id}`)}
                    className="px-3 py-1 text-sm text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors flex items-center"
                  >
                    <DocumentTextIcon className="h-4 w-4 mr-1" />
                    Registrar pago
                  </button>
                )}
                
                {puedeRenovar() && (
                  <button
                    onClick={() => router.push(`/prestamos/renovacion/${prestamo.id}`)}
                    className="px-3 py-1 text-sm text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-colors flex items-center"
                  >
                    <ArrowPathIcon className="h-4 w-4 mr-1" />
                    {usuario?.rol === 'asesor' ? 'Solicitar renovación' : 'Renovar'}
                  </button>
                )}
              </>
            )}
            
            {puedeEliminar() && (
              <button
                onClick={onDelete}
                className="px-3 py-1 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors flex items-center"
              >
                <TrashIcon className="h-4 w-4 mr-1" />
                Eliminar
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Información del cliente */}
          <div className="md:col-span-1 bg-gray-50 rounded-lg p-4">
            <div className="flex items-center mb-4">
              <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
              <div>
                <p className="text-sm font-medium text-gray-500">Cliente</p>
                <p className="text-sm text-gray-900">{prestamo.cliente.nombre} {prestamo.cliente.apellido}</p>
                <p className="text-xs text-gray-500">DNI: {prestamo.cliente.dni}</p>
              </div>
            </div>
            <button
              onClick={() => router.push(`/clientes/${prestamo.cliente.id}`)}
              className="mt-2 text-sm text-indigo-600 hover:text-indigo-900"
            >
              Ver perfil del cliente
            </button>
          </div>
          
          {/* Información del préstamo */}
          <div className="md:col-span-2 bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div>
                <p className="text-sm font-medium text-gray-500">Monto</p>
                <p className="text-sm text-gray-900">S/ {prestamo.monto.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Interés</p>
                <p className="text-sm text-gray-900">{prestamo.interes}%</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total a pagar</p>
                <p className="text-sm text-gray-900">S/ {prestamo.monto_total.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Frecuencia</p>
                <p className="text-sm text-gray-900 capitalize">{prestamo.frecuencia_pago}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Cuota</p>
                <p className="text-sm text-gray-900">S/ {montoCuota.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Estado</p>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  prestamo.estado === 'activo'
                    ? 'bg-green-100 text-green-800'
                    : prestamo.estado === 'completado'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {prestamo.estado.charAt(0).toUpperCase() + prestamo.estado.slice(1)}
                </span>
              </div>
            </div>
            
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-500">Progreso de pago</p>
              <div className="flex items-center">
                <span className="mr-2 text-sm text-gray-700">
                  {prestamo.cuotas_pagadas} de {prestamo.total_cuotas} cuotas
                </span>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${
                      prestamo.estado === 'atrasado' ? 'bg-red-600' : 'bg-indigo-600'
                    }`}
                    style={{ width: `${progresoTotalPorcentaje}%` }}
                  ></div>
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Próxima fecha de pago: <span className="font-medium text-gray-900">{proximaFecha}</span>
              </p>
            </div>
            
            {/* Información de aprobación */}
            {prestamo.estado_aprobacion && (
              <div className="mt-4 p-4 rounded-lg border">
                <h4 className="text-md font-medium mb-2">Estado de Aprobación</h4>
                <div className="flex items-center">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    prestamo.estado_aprobacion === 'aprobado'
                      ? 'bg-green-100 text-green-800'
                      : prestamo.estado_aprobacion === 'rechazado'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {prestamo.estado_aprobacion === 'aprobado'
                      ? 'Aprobado'
                      : prestamo.estado_aprobacion === 'rechazado'
                      ? 'Rechazado'
                      : 'Pendiente'}
                  </span>
                  
                  {prestamo.fecha_aprobacion && (
                    <span className="ml-2 text-sm text-gray-500">
                      {new Date(prestamo.fecha_aprobacion).toLocaleDateString()}
                    </span>
                  )}
                </div>
                
                {prestamo.comentarios_aprobacion && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Comentarios: </span>
                      {prestamo.comentarios_aprobacion}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Historial de pagos */}
        <div className="mt-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Historial de pagos</h4>
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
          ) : pagos.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N°</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pagos.map((pago, index) => (
                    <tr key={pago.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(pago.fecha_pago).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        S/ {parseFloat(pago.monto).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                        {pago.metodo_pago}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
              No hay pagos registrados para este préstamo
            </div>
          )}
        </div>
      </div>
      
      {/* Área de acciones rápidas al final */}
      <div className="px-6 py-5 bg-gray-50 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {puedeEditar() && (
            <button
              onClick={() => router.push(`/prestamos/${prestamo.id}/editar`)}
              className="px-4 py-2 text-sm text-center border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center"
            >
              <PencilSquareIcon className="h-4 w-4 mr-1" />
              Editar préstamo
            </button>
          )}
          <button
            onClick={() => router.push(`/prestamos/${prestamo.id}/contrato`)}
            className="px-4 py-2 text-sm text-center border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center"
          >
            <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
            Ver contrato
          </button>
          <button
            onClick={() => router.push(`/prestamos/nuevo?cliente=${prestamo.cliente.id}`)}
            className="px-4 py-2 text-sm text-center border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center"
          >
            <CurrencyDollarIcon className="h-4 w-4 mr-1" />
            Nuevo préstamo al cliente
          </button>
          {puedeEliminar() && (
            <button
              onClick={onDelete}
              className="px-4 py-2 text-sm text-center border border-red-300 text-red-600 rounded-md hover:bg-red-50 transition-colors flex items-center justify-center"
            >
              <TrashIcon className="h-4 w-4 mr-1" />
              Eliminar préstamo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}