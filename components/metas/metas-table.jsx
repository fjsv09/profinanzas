'use client';
import { PencilSquareIcon } from '@heroicons/react/24/outline';

export default function MetasTable({ metas, onEdit }) {
  // No hay metas para mostrar
  if (!metas || metas.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <p className="text-gray-500">No hay metas definidas para este período</p>
      </div>
    );
  }

  // Función para obtener el color de la barra de progreso basado en el porcentaje
  const getColorClase = (porcentaje, inverso = false) => {
    if (inverso) {
      // Para métricas donde menor es mejor (ej: morosidad)
      if (porcentaje <= 80) return 'bg-green-600';
      if (porcentaje <= 100) return 'bg-yellow-500';
      return 'bg-red-600';
    } else {
      // Para métricas donde mayor es mejor
      if (porcentaje >= 100) return 'bg-green-600';
      if (porcentaje >= 80) return 'bg-yellow-500';
      return 'bg-red-600';
    }
  };

  // Función para calcular el porcentaje de cumplimiento
  const calcularPorcentajeCumplimiento = (realizado, meta) => {
    if (meta === 0) return 0;
    return (realizado / meta) * 100;
  };

  // Versión para móviles (tarjetas)
  const MobileCards = () => (
    <div className="space-y-4 sm:hidden">
      {metas.map((meta) => {
        // Calcular porcentajes de cumplimiento
        const clientesPorcentaje = calcularPorcentajeCumplimiento(meta.clientes_captados, meta.meta_clientes);
        const cobranzaPorcentaje = calcularPorcentajeCumplimiento(meta.cobranza_realizada, meta.meta_cobranza);
        const morosidadPorcentaje = meta.meta_morosidad > 0 ? (meta.morosidad_actual / meta.meta_morosidad) * 100 : 0;
        const carteraPorcentaje = calcularPorcentajeCumplimiento(meta.cartera_actual, meta.meta_cartera);
        
        return (
          <div key={meta.id} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-medium text-gray-900">{meta.asesor.nombre} {meta.asesor.apellido}</h3>
              <button
                onClick={() => onEdit(meta)}
                className="text-indigo-600 hover:text-indigo-900"
              >
                <PencilSquareIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Clientes */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">Clientes</span>
                  <span className="text-sm text-gray-900">{meta.clientes_captados} / {meta.meta_clientes}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${getColorClase(clientesPorcentaje)}`}
                    style={{ width: `${Math.min(clientesPorcentaje, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Cobranza */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">Cobranza</span>
                  <span className="text-sm text-gray-900">
                    S/ {meta.cobranza_realizada.toLocaleString('es-PE')} / {meta.meta_cobranza.toLocaleString('es-PE')}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${getColorClase(cobranzaPorcentaje)}`}
                    style={{ width: `${Math.min(cobranzaPorcentaje, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Morosidad */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">Morosidad</span>
                  <span className="text-sm text-gray-900">
                    {meta.morosidad_actual}% / {meta.meta_morosidad}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${getColorClase(morosidadPorcentaje, true)}`}
                    style={{ width: `${Math.min(morosidadPorcentaje, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Cartera */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">Cartera</span>
                  <span className="text-sm text-gray-900">
                    S/ {meta.cartera_actual.toLocaleString('es-PE')} / {meta.meta_cartera.toLocaleString('es-PE')}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${getColorClase(carteraPorcentaje)}`}
                    style={{ width: `${Math.min(carteraPorcentaje, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  // Versión para pantallas más grandes (tabla)
  const DesktopTable = () => (
    <div className="hidden sm:block bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Metas del Período</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Asesor
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Clientes
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cobranza
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Morosidad
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cartera
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {metas.map((meta) => {
              // Calcular porcentajes de cumplimiento
              const clientesPorcentaje = calcularPorcentajeCumplimiento(meta.clientes_captados, meta.meta_clientes);
              const cobranzaPorcentaje = calcularPorcentajeCumplimiento(meta.cobranza_realizada, meta.meta_cobranza);
              const morosidadPorcentaje = meta.meta_morosidad > 0 ? (meta.morosidad_actual / meta.meta_morosidad) * 100 : 0;
              const carteraPorcentaje = calcularPorcentajeCumplimiento(meta.cartera_actual, meta.meta_cartera);
              
              return (
                <tr key={meta.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{meta.asesor.nombre} {meta.asesor.apellido}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{meta.clientes_captados} / {meta.meta_clientes}</div>
                    <div className="w-24 bg-gray-200 rounded-full h-2.5 mt-1">
                      <div
                        className={`h-2.5 rounded-full ${getColorClase(clientesPorcentaje)}`}
                        style={{ width: `${Math.min(clientesPorcentaje, 100)}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      S/ {meta.cobranza_realizada.toLocaleString('es-PE')} / {meta.meta_cobranza.toLocaleString('es-PE')}
                    </div>
                    <div className="w-24 bg-gray-200 rounded-full h-2.5 mt-1">
                      <div
                        className={`h-2.5 rounded-full ${getColorClase(cobranzaPorcentaje)}`}
                        style={{ width: `${Math.min(cobranzaPorcentaje, 100)}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {meta.morosidad_actual}% / {meta.meta_morosidad}%
                    </div>
                    <div className="w-24 bg-gray-200 rounded-full h-2.5 mt-1">
                      <div
                        className={`h-2.5 rounded-full ${getColorClase(morosidadPorcentaje, true)}`}
                        style={{ width: `${Math.min(morosidadPorcentaje, 100)}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      S/ {meta.cartera_actual.toLocaleString('es-PE')} / {meta.meta_cartera.toLocaleString('es-PE')}
                    </div>
                    <div className="w-24 bg-gray-200 rounded-full h-2.5 mt-1">
                      <div
                        className={`h-2.5 rounded-full ${getColorClase(carteraPorcentaje)}`}
                        style={{ width: `${Math.min(carteraPorcentaje, 100)}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => onEdit(meta)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <PencilSquareIcon className="h-5 w-5 inline" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <>
      <MobileCards />
      <DesktopTable />
    </>
  );
}