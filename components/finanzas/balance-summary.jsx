'use client';
import { useState } from 'react';

/**
 * Componente que muestra un resumen del balance financiero
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.resumenData - Datos del resumen financiero
 * @param {Array} props.transacciones - Lista de transacciones recientes
 * @param {Function} props.onPeriodChange - Función a ejecutar cuando cambia el período
 */
export default function BalanceSummary({ resumenData, transacciones = [], onPeriodChange }) {
  const [filtro, setFiltro] = useState('todos');
  
  // Filtrar transacciones según el tipo (ingreso, egreso, todos)
  const filtrarTransacciones = () => {
    if (filtro === 'todos') {
      return transacciones;
    }
    return transacciones.filter(transaccion => transaccion.tipo === filtro);
  };

  // Obtener el color para el balance (positivo: verde, negativo: rojo)
  const getBalanceColor = () => {
    return resumenData?.balance >= 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Resumen financiero en tarjetas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Balance General</h3>
          <p className={`text-2xl font-bold ${getBalanceColor()}`}>
            S/ {resumenData?.balance.toFixed(2) || '0.00'}
          </p>
          <div className="mt-2 flex justify-between text-sm">
            <span className="text-gray-500">
              Ingresos: <span className="text-green-600 font-medium">S/ {resumenData?.ingresos.toFixed(2) || '0.00'}</span>
            </span>
            <span className="text-gray-500">
              Egresos: <span className="text-red-600 font-medium">S/ {resumenData?.egresos.toFixed(2) || '0.00'}</span>
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Disponible en Efectivo</h3>
          <p className="text-2xl font-bold text-gray-900">S/ {resumenData?.efectivo.toFixed(2) || '0.00'}</p>
          <div className="mt-2 text-sm text-gray-500">En caja física</div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Otros Fondos</h3>
          <div className="flex justify-between">
            <div>
              <p className="text-lg font-semibold text-gray-900">S/ {resumenData?.yape.toFixed(2) || '0.00'}</p>
              <div className="text-xs text-gray-500">Yape</div>
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">S/ {resumenData?.banco.toFixed(2) || '0.00'}</p>
              <div className="text-xs text-gray-500">Banco</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros para las transacciones */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Transacciones Recientes</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setFiltro('todos')}
              className={`px-3 py-1 text-xs rounded-md ${
                filtro === 'todos'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFiltro('ingreso')}
              className={`px-3 py-1 text-xs rounded-md ${
                filtro === 'ingreso'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Ingresos
            </button>
            <button
              onClick={() => setFiltro('egreso')}
              className={`px-3 py-1 text-xs rounded-md ${
                filtro === 'egreso'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Egresos
            </button>
          </div>
        </div>

        {/* Tabla de transacciones */}
        <div className="overflow-x-auto">
          {filtrarTransacciones().length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Concepto
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cuenta
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtrarTransacciones().map((transaccion) => (
                  <tr key={transaccion.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(transaccion.fecha).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{transaccion.categoria}</div>
                      <div className="text-xs text-gray-500">{transaccion.descripcion}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {transaccion.cuenta}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                      <span className={transaccion.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'}>
                        {transaccion.tipo === 'ingreso' ? '+' : '-'} S/ {transaccion.monto.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-6 text-center text-gray-500">No hay transacciones para mostrar</div>
          )}
        </div>
      </div>
    </div>
  );
}