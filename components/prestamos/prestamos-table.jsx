'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  MagnifyingGlassIcon,
  EyeIcon,
  DocumentTextIcon,
  TrashIcon,
  PencilSquareIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';

export default function PrestamosTable({
  prestamos,
  onSearch,
  filtroEstado,
  onFiltroEstadoChange,
  onDelete,
  usuario,
}) {
  const router = useRouter();

  const handleSearch = (e) => {
    const value = e.target.value;
    onSearch(value);
  };

  // Verificar si el usuario puede editar un préstamo
  const puedeEditar = (prestamo) => {
    if (!usuario) return false;
    if (['administrador', 'admin_sistema'].includes(usuario.rol))
      return true;
    if (usuario.rol === 'supervisor') {
      // Verificar si el préstamo pertenece a un cliente de un asesor supervisado
      const asesoresSupervisa = usuario.asesoresAsignados || [];
      return asesoresSupervisa.includes(prestamo.clientes.asesor_id);
    }
    // Los asesores no pueden editar préstamos, sólo verlos
    return false;
  };

  // Verificar si el usuario puede eliminar un préstamo
  const puedeEliminar = (prestamo) => {
    if (!usuario) return false;
    if (['administrador', 'admin_sistema'].includes(usuario.rol))
      return true;
    // Los supervisores y asesores no pueden eliminar préstamos
    return false;
  };

  // Renderizar el estado del préstamo con un badge de color
  const getEstadoPrestamoBadge = (estadoCalculado) => {
    switch (estadoCalculado) {
      case 'pendiente':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-800">
            Pendiente
          </span>
        );
      case 'activo':
          return (
            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
              Activo
            </span>
          );
      case 'completado':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
            Completado
          </span>
        );
      case 'atrasado':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
            Atrasado
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
            {estadoCalculado}
          </span>
        );
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 p-2.5"
            placeholder="Buscar por cliente o número de préstamo..."
            onChange={handleSearch}
          />
        </div>
        <div className="md:w-64">
          <select
            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5"
            value={filtroEstado}
            onChange={(e) =>
              onFiltroEstadoChange && onFiltroEstadoChange(e.target.value)
            }
          >
            <option value="todos">Todos los estados</option>
            <option value="pendiente">Pendientes</option>
            <option value="activo">Activos</option>
            <option value="completado">Completados</option>
            <option value="atrasado">Atrasados</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                ID
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Cliente
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Monto
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Frecuencia
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Progreso
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Estado
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {prestamos.length > 0 ? (
              prestamos.map((prestamo) => (
                <tr key={prestamo.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    #{prestamo.id}
                    <div className="text-xs text-gray-500">
                      {new Date(prestamo.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {prestamo.clientes.nombre}{' '}
                      {prestamo.clientes.apellido}
                    </div>
                    <div className="text-xs text-gray-500">
                      DNI: {prestamo.clientes.dni}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    S/ {prestamo.monto.toFixed(2)}
                    <div className="text-xs text-gray-500">
                      Total: S/ {prestamo.monto_total.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                    {prestamo.frecuencia_pago}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <span className="mr-2">
                        {prestamo.cuotas_pagadas}/{prestamo.total_cuotas}
                      </span>
                      <div className="w-24 bg-gray-200 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full ${
                            prestamo.estadoCalculado === 'atrasado'
                              ? 'bg-red-600'
                              : 'bg-indigo-600'
                          }`}
                          style={{
                            width: `${
                              (prestamo.cuotas_pagadas /
                                prestamo.total_cuotas) *
                              100
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getEstadoPrestamoBadge(prestamo.estadoCalculado)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                    <button
                      onClick={() =>
                        router.push(`/prestamos/${prestamo.id}`)
                      }
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                      title="Ver detalles"
                    >
                      <EyeIcon className="h-5 w-5 inline" />
                    </button>

                    {puedeEditar(prestamo) && (
                      <button
                        onClick={() =>
                          router.push(`/prestamos/${prestamo.id}/editar`)
                        }
                        className="text-yellow-600 hover:text-yellow-900 mr-3"
                        title="Editar préstamo"
                      >
                        <PencilSquareIcon className="h-5 w-5 inline" />
                      </button>
                    )}

                    <button
                      onClick={() =>
                        router.push(`/prestamos/${prestamo.id}/contrato`)
                      }
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      title="Ver contrato"
                    >
                      <DocumentDuplicateIcon className="h-5 w-5 inline" />
                    </button>

                    {prestamo.estado === 'activo' && (
                      <button
                        onClick={() =>
                          router.push(`/cobranzas?prestamo=${prestamo.id}`)
                        }
                        className="text-green-600 hover:text-green-900 mr-3"
                        title="Registrar pago"
                      >
                        <DocumentTextIcon className="h-5 w-5 inline" />
                      </button>
                    )}

                    {puedeEliminar(prestamo) && (
                      <button
                        onClick={() => onDelete(prestamo.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Eliminar préstamo"
                      >
                        <TrashIcon className="h-5 w-5 inline" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="7"
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  No se encontraron préstamos
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
