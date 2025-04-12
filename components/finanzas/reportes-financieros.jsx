'use client';
import { useState, useEffect } from 'react';
import { ArrowDownTrayIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

/**
 * Componente para visualizar y exportar reportes financieros
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.datosReporte - Datos del reporte financiero
 * @param {Function} props.onPeriodoChange - Función a ejecutar cuando cambia el período
 * @param {Function} props.onExportar - Función a ejecutar cuando se exporta el reporte
 * @param {Function} props.onBuscar - Función a ejecutar al buscar dentro de un rango de fechas
 */
export default function ReportesFinancieros({ 
  datosReporte = {
    resumen: { totalIngresos: 0, totalEgresos: 0, balance: 0 },
    distribuciones: { ingresosPorCategoria: {}, egresosPorCategoria: {} },
    ingresos: [],
    egresos: []
  }, 
  onPeriodoChange, 
  onExportar, 
  onBuscar
}) {
  const router = useRouter();
  const [periodo, setPeriodo] = useState('mes');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Establecer fechas por defecto (último mes) al cargar el componente
  useEffect(() => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    setFechaInicio(formatDate(firstDayOfMonth));
    setFechaFin(formatDate(lastDayOfMonth));
  }, []);

  // Formato de fecha para inputs tipo date (YYYY-MM-DD)
  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  // Manejar cambio de período
  const handlePeriodoChange = (nuevoPeriodo) => {
    setPeriodo(nuevoPeriodo);
    
    const today = new Date();
    let inicio, fin;
    
    switch (nuevoPeriodo) {
      case 'semana':
        // Última semana
        inicio = new Date(today);
        inicio.setDate(today.getDate() - 7);
        fin = new Date(today);
        break;
      case 'mes':
        // Mes actual
        inicio = new Date(today.getFullYear(), today.getMonth(), 1);
        fin = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case 'trimestre':
        // Último trimestre
        inicio = new Date(today.getFullYear(), today.getMonth() - 3, 1);
        fin = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case 'anual':
        // Año actual
        inicio = new Date(today.getFullYear(), 0, 1);
        fin = new Date(today.getFullYear(), 11, 31);
        break;
      default:
        inicio = new Date(today.getFullYear(), today.getMonth(), 1);
        fin = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    }
    
    setFechaInicio(formatDate(inicio));
    setFechaFin(formatDate(fin));
    
    // Llamar a la función proporcionada por el componente padre
    if (onPeriodoChange) {
      onPeriodoChange(nuevoPeriodo, formatDate(inicio), formatDate(fin));
    }
  };

  // Manejar cambio en los inputs de fecha
  const handleFechaChange = (e) => {
    const { name, value } = e.target;
    if (name === 'fechaInicio') {
      setFechaInicio(value);
    } else {
      setFechaFin(value);
    }
  };

  // Manejar búsqueda con rango de fechas personalizado
  const handleBuscar = () => {
    if (!fechaInicio || !fechaFin) {
      toast.error('Debe seleccionar fechas válidas');
      return;
    }
    
    // Validar que la fecha de inicio no sea posterior a la fecha fin
    if (new Date(fechaInicio) > new Date(fechaFin)) {
      toast.error('La fecha de inicio no puede ser posterior a la fecha fin');
      return;
    }
    
    // Llamar a la función proporcionada por el componente padre
    if (onBuscar) {
      onBuscar(fechaInicio, fechaFin);
    }
  };

  // Manejar exportación del reporte
  const handleExportar = async () => {
    setIsExporting(true);
    try {
      // Llamar a la función proporcionada por el componente padre
      if (onExportar) {
        await onExportar(periodo, fechaInicio, fechaFin);
      }
      toast.success('Reporte exportado exitosamente');
    } catch (error) {
      console.error('Error al exportar reporte:', error);
      toast.error('Error al exportar el reporte');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div>
      {/* Cabecera del reporte */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 md:mb-0">Reportes Financieros</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => router.back()}
            className="flex items-center px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Volver
          </button>
          <button
            onClick={handleExportar}
            disabled={isExporting}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            {isExporting ? 'Exportando...' : 'Exportar'}
          </button>
        </div>
      </div>

      {/* Filtros de reporte */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filtros del Reporte</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Período
            </label>
            <div className="grid grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-2">
              <button
                onClick={() => handlePeriodoChange('semana')}
                className={`px-4 py-2 text-xs font-medium rounded-md ${
                  periodo === 'semana'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Semana
              </button>
              <button
                onClick={() => handlePeriodoChange('mes')}
                className={`px-4 py-2 text-xs font-medium rounded-md ${
                  periodo === 'mes'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Mes
              </button>
              <button
                onClick={() => handlePeriodoChange('trimestre')}
                className={`px-4 py-2 text-xs font-medium rounded-md ${
                  periodo === 'trimestre'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Trimestre
              </button>
              <button
                onClick={() => handlePeriodoChange('anual')}
                className={`px-4 py-2 text-xs font-medium rounded-md ${
                  periodo === 'anual'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Anual
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="fechaInicio" className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Inicio
            </label>
            <input
              type="date"
              id="fechaInicio"
              name="fechaInicio"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={fechaInicio}
              onChange={handleFechaChange}
            />
          </div>
          <div>
            <label htmlFor="fechaFin" className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Fin
            </label>
            <input
              type="date"
              id="fechaFin"
              name="fechaFin"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={fechaFin}
              onChange={handleFechaChange}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleBuscar}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Buscar
            </button>
          </div>
        </div>
      </div>

      {/* Resumen financiero */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Resumen del Período</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-500 mb-1">Total Ingresos</h4>
            <p className="text-2xl font-bold text-green-600">
              S/ {datosReporte?.resumen?.totalIngresos?.toFixed(2) || '0.00'}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-500 mb-1">Total Egresos</h4>
            <p className="text-2xl font-bold text-red-600">
              S/ {datosReporte?.resumen?.totalEgresos?.toFixed(2) || '0.00'}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-500 mb-1">Balance</h4>
            <p className={`text-2xl font-bold ${
              (datosReporte?.resumen?.balance >= 0) ? 'text-green-600' : 'text-red-600'
            }`}>
              S/ {datosReporte?.resumen?.balance?.toFixed(2) || '0.00'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Distribución de Ingresos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Distribución de Ingresos</h3>
          </div>
          <div className="p-6">
            {datosReporte?.distribuciones?.ingresosPorCategoria && 
             Object.keys(datosReporte.distribuciones.ingresosPorCategoria).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(datosReporte.distribuciones.ingresosPorCategoria).map(([categoria, monto]) => (
                  <div key={categoria}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">{categoria}</span>
                      <span className="text-sm font-medium text-gray-900">
                        S/ {monto.toFixed(2)} ({((monto / datosReporte.resumen.totalIngresos) * 100).toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-green-600 h-2.5 rounded-full"
                        style={{ width: `${(monto / datosReporte.resumen.totalIngresos) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-gray-500">
                No hay datos de ingresos para mostrar
              </div>
            )}
          </div>
        </div>
        
        {/* Distribución de Egresos */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Distribución de Egresos</h3>
          </div>
          <div className="p-6">
            {datosReporte?.distribuciones?.egresosPorCategoria && 
             Object.keys(datosReporte.distribuciones.egresosPorCategoria).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(datosReporte.distribuciones.egresosPorCategoria).map(([categoria, monto]) => (
                  <div key={categoria}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">{categoria}</span>
                      <span className="text-sm font-medium text-gray-900">
                        S/ {monto.toFixed(2)} ({((monto / datosReporte.resumen.totalEgresos) * 100).toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-red-600 h-2.5 rounded-full"
                        style={{ width: `${(monto / datosReporte.resumen.totalEgresos) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-gray-500">
                No hay datos de egresos para mostrar
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detalle de transacciones */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Detalle de Transacciones</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
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
                {datosReporte?.ingresos && datosReporte?.egresos ? (
                  [...datosReporte.ingresos, ...datosReporte.egresos]
                    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                    .map((transaccion) => (
                      <tr key={transaccion.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(transaccion.fecha).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            transaccion.tipo === 'ingreso'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {transaccion.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaccion.categoria}
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
                    ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      No hay transacciones para el período seleccionado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}