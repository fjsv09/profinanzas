import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CurrencyDollarIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

/**
 * Componente para mostrar una tabla de pagos o cobranzas pendientes
 * @param {Object} props - Propiedades del componente
 * @param {Array} props.pagos - Lista de pagos realizados (opcional)
 * @param {Array} props.pendientes - Lista de pagos pendientes (opcional)
 * @param {string} props.tipo - Tipo de tabla: 'realizados' o 'pendientes'
 * @param {Function} props.onRegistrarPago - Función para registrar un nuevo pago
 */
export default function CobranzasTable({ 
  pagos = [], 
  pendientes = [], 
  tipo = 'realizados', 
  onRegistrarPago 
}) {
  const router = useRouter();
  const [filtroFecha, setFiltroFecha] = useState('todas');
  
  // Filtrar pagos por fecha si es necesario
  const getPagosFiltrados = () => {
    if (tipo === 'pendientes') return pendientes;
    
    if (filtroFecha === 'todas') return pagos;
    
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);
    const semanaAnterior = new Date(hoy);
    semanaAnterior.setDate(semanaAnterior.getDate() - 7);
    
    return pagos.filter(pago => {
      const fechaPago = new Date(pago.fecha_pago);
      switch (filtroFecha) {
        case 'hoy':
          return fechaPago.toDateString() === hoy.toDateString();
        case 'ayer':
          return fechaPago.toDateString() === ayer.toDateString();
        case 'semana':
          return fechaPago >= semanaAnterior;
        default:
          return true;
      }
    });
  };
  
  const pagosFiltrados = getPagosFiltrados();
  
  // Renderizar la tabla según el tipo
  if (tipo === 'realizados') {
    return (
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Pagos Realizados</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setFiltroFecha('todas')}
              className={`px-3 py-1 text-xs rounded-md ${
                filtroFecha === 'todas'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFiltroFecha('hoy')}
              className={`px-3 py-1 text-xs rounded-md ${
                filtroFecha === 'hoy'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => setFiltroFecha('semana')}
              className={`px-3 py-1 text-xs rounded-md ${
                filtroFecha === 'semana'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Esta semana
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          {pagosFiltrados.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Préstamo
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Método
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pagosFiltrados.map((pago) => (
                  <tr key={pago.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{pago.cliente}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">#{pago.prestamo_id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{new Date(pago.fecha_pago).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-500">{new Date(pago.fecha_pago).toLocaleTimeString()}</div>
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
          ) : (
            <div className="py-6 text-center text-gray-500">
              No hay pagos registrados
            </div>
          )}
        </div>
      </div>
    );
  } else {
    // Tabla de pagos pendientes
    return (
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Pagos Pendientes para Hoy</h3>
        </div>
        <div className="overflow-x-auto">
          {pendientes.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Préstamo
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendientes.map((pendiente) => (
                  <tr key={pendiente.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{pendiente.cliente}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">#{pendiente.prestamo_id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      S/ {parseFloat(pendiente.monto).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => onRegistrarPago(pendiente.prestamo_id)}
                        className="text-indigo-600 hover:text-indigo-900 flex items-center justify-end"
                      >
                        <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                        Registrar pago
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-6 text-center text-gray-500">
              No hay pagos pendientes para hoy
            </div>
          )}
        </div>
      </div>
    );
  }
}