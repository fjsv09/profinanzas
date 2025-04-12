'use client';

import { useRouter } from 'next/navigation';
import { UserIcon, PhoneIcon, IdentificationIcon, MapPinIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

export default function ClienteCard({ cliente, showActions = true }) {
  const router = useRouter();

  // Verificar si el cliente existe
  if (!cliente) {
    return (
      <div className="bg-white shadow rounded-lg p-4">
        <p className="text-gray-500 text-center">Cliente no encontrado</p>
      </div>
    );
  }

  // Determinar el color del badge para el historial de pagos
  const getHistorialBadgeColor = (historial) => {
    switch (historial) {
      case 'Bueno':
        return 'bg-green-100 text-green-800';
      case 'Regular':
        return 'bg-yellow-100 text-yellow-800';
      case 'Malo':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            {cliente.nombre} {cliente.apellido}
          </h3>
          {cliente.historial_pagos && (
            <span className={`px-2 py-1 text-xs rounded-full ${getHistorialBadgeColor(cliente.historial_pagos)}`}>
              {cliente.historial_pagos}
            </span>
          )}
        </div>
      </div>
      
      <div className="p-6 space-y-4">
        <div className="flex items-center">
          <IdentificationIcon className="h-5 w-5 text-gray-400 mr-2" />
          <div>
            <p className="text-sm font-medium text-gray-500">DNI</p>
            <p className="text-sm text-gray-900">{cliente.dni}</p>
          </div>
        </div>
        
        <div className="flex items-center">
          <PhoneIcon className="h-5 w-5 text-gray-400 mr-2" />
          <div>
            <p className="text-sm font-medium text-gray-500">Teléfono</p>
            <p className="text-sm text-gray-900">{cliente.telefono}</p>
          </div>
        </div>
        
        <div className="flex items-start">
          <MapPinIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-500">Dirección</p>
            <p className="text-sm text-gray-900">{cliente.direccion}</p>
            {cliente.referencias && (
              <p className="text-xs text-gray-500 mt-1">
                <span className="font-medium">Referencias:</span> {cliente.referencias}
              </p>
            )}
          </div>
        </div>
        
        {cliente.fecha_registro && (
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 text-gray-400 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
            <div>
              <p className="text-sm font-medium text-gray-500">Fecha de registro</p>
              <p className="text-sm text-gray-900">
                {new Date(cliente.fecha_registro || cliente.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}
      </div>
      
      {showActions && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <button
              onClick={() => router.push(`/clientes/${cliente.id}`)}
              className="w-full px-4 py-2 text-sm text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors"
            >
              Ver detalles
            </button>
            <button
              onClick={() => router.push(`/prestamos/nuevo?cliente=${cliente.id}`)}
              className="w-full px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
            >
              <CurrencyDollarIcon className="h-4 w-4 inline mr-1" />
              Nuevo Préstamo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}