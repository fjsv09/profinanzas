// En components/clientes/clientes-table.jsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PencilSquareIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function ClientesTable({ clientes, onDelete, onSearch, usuario }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  // Función para manejar la búsqueda
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    // Si se proporcionó una función de búsqueda externa, úsala
    if (onSearch) {
      onSearch(value);
    }
  };

  // Filtrar clientes localmente si no se proporciona onSearch
  const filteredClientes = onSearch ? clientes : clientes.filter(cliente =>
    cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.dni.includes(searchTerm)
  );

  // Verificar si el usuario tiene permisos para editar/eliminar un cliente
  const puedeEditar = (cliente) => {
    if (!usuario) return false;
    if (['administrador', 'admin_sistema'].includes(usuario.rol)) return true;
    if (usuario.rol === 'supervisor') {
      // Verificar si el cliente pertenece a un asesor que supervisa
      // En un sistema real, aquí habría una lógica más compleja
      return false; // Simplificado para el ejemplo
    }
    return false;
  };

  // Verificar si el usuario tiene permisos para eliminar
  const puedeEliminar = (cliente) => {
    if (!usuario) return false;
    if (['administrador', 'admin_sistema'].includes(usuario.rol)) return true;
    // Los supervisores y asesores no deberían poder eliminar clientes
    return false;
  };

  // Función para manejar el borrado de un cliente
  const handleDelete = (cliente) => {
    if (!puedeEliminar(cliente)) {
      toast.error('No tienes permisos para eliminar este cliente');
      return;
    }

    if (onDelete) {
      onDelete(cliente.id);
    } else {
      // Si no se proporcionó función de eliminación, mostrar solo mensaje
      toast.success('Cliente eliminado con éxito');
    }

  };

  // Función para determinar el color del badge de historial
  const getHistorialBadgeColor = (historial) => {
    switch (historial) {
      case 'Bueno':
        return 'bg-green-100 text-green-800';
      case 'Regular':
        return 'bg-yellow-100 text-yellow-800';
      case 'Malo':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  return (
    <div className="grid grid-cols-1">
      {/* Barra de búsqueda */}
      <div className="mb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 p-2.5"
            placeholder="Buscar por nombre o DNI..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
      </div>

      {/* Tabla de clientes */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DNI
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teléfono
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dirección
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Historial
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClientes.length > 0 ? (
                filteredClientes.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cliente.dni}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {cliente.nombre} {cliente.apellido}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {cliente.telefono}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {cliente.direccion}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {cliente.historial_pagos ? (
                        <span className={`px-2 py-1 text-xs rounded-full ${getHistorialBadgeColor(cliente.historial_pagos)}`}>
                          {cliente.historial_pagos}
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                          Nuevo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => router.push(`/clientes/${cliente.id}`)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                        title="Ver detalles"
                      >
                        <EyeIcon className="h-5 w-5 inline" />
                      </button>

                      {puedeEditar(cliente) && (
                        <button
                          onClick={() => router.push(`/clientes/${cliente.id}/editar`)}
                          className="text-yellow-600 hover:text-yellow-900 mr-3"
                          title="Editar"
                        >
                          <PencilSquareIcon className="h-5 w-5 inline" />
                        </button>
                      )}

                      {puedeEliminar(cliente) && (
                        <button
                          onClick={() => handleDelete(cliente)}
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar"
                        >
                          <TrashIcon className="h-5 w-5 inline" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    No se encontraron clientes
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}