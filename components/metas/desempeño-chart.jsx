'use client';
import { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { TrophyIcon, UserGroupIcon, CurrencyDollarIcon, ExclamationCircleIcon, ChartBarIcon } from '@heroicons/react/24/outline';

export default function DesempeñoChart({ datos, periodo }) {
  const [screenWidth, setScreenWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [datosEquipo, setDatosEquipo] = useState({
    promedios: {
      clientes: 0,
      cobranza: 0,
      morosidad: 0,
      cartera: 0
    },
    rendimiento: {
      sobresaliente: 0,
      objetivo: 0,
      mejorable: 0
    }
  });
  
  // Listener para cambios de tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (datos && datos.length > 0) {
      // Calcular promedios
      const totalAsesores = datos.length;
      const promedios = {
        clientes: datos.reduce((acc, asesor) => acc +
          calcularPorcentajeCumplimiento(asesor.metas.clientes.actual,
          asesor.metas.clientes.meta), 0) / totalAsesores,
        cobranza: datos.reduce((acc, asesor) => acc +
          calcularPorcentajeCumplimiento(asesor.metas.cobranza.actual,
          asesor.metas.cobranza.meta), 0) / totalAsesores,
        morosidad: datos.reduce((acc, asesor) => acc +
          calcularPorcentajeMorosidad(asesor.metas.morosidad.actual,
          asesor.metas.morosidad.meta), 0) / totalAsesores,
        cartera: datos.reduce((acc, asesor) => acc +
          calcularPorcentajeCumplimiento(asesor.metas.cartera.actual,
          asesor.metas.cartera.meta), 0) / totalAsesores
      };
      // Contar rendimiento por categoría
      const rendimiento = {
        sobresaliente: datos.filter(a => a.bonificacion === 'sobresaliente').length,
        objetivo: datos.filter(a => a.bonificacion === 'objetivo').length,
        mejorable: datos.filter(a => a.bonificacion === 'mejorable').length
      };
      setDatosEquipo({
        promedios,
        rendimiento
      });
    }
  }, [datos]);

  // Función para calcular el porcentaje de cumplimiento
  const calcularPorcentajeCumplimiento = (realizado, meta) => {
    if (meta === 0) return 0;
    return (realizado / meta) * 100;
  };

  // Función para calcular el porcentaje de morosidad (donde menor es mejor)
  const calcularPorcentajeMorosidad = (actual, meta) => {
    if (meta === 0) return 0;
    return (actual / meta) * 100;
  };

  // Función para obtener el color según el porcentaje
  const getColorClase = (porcentaje, inverso = false) => {
    if (inverso) {
      // Para métricas donde menor es mejor
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

  // Datos para el gráfico de distribución de rendimiento
  const datosGraficoPie = [
    { name: 'Bono Extra', value: datosEquipo.rendimiento.sobresaliente, color: '#10B981' },
    { name: 'Pago Normal', value: datosEquipo.rendimiento.objetivo, color: '#F59E0B' },
    { name: 'Menor Compensación', value: datosEquipo.rendimiento.mejorable, color: '#EF4444' }
  ];

  // Datos para el gráfico de barras
  const datosGraficoBarras = [
    { name: 'Clientes', porcentaje: datosEquipo.promedios.clientes, meta: 100, color: '#6366F1' },
    { name: 'Cobranza', porcentaje: datosEquipo.promedios.cobranza, meta: 100, color: '#8B5CF6' },
    { name: 'Morosidad', porcentaje: datosEquipo.promedios.morosidad, meta: 100, color: '#EC4899', inverso: true },
    { name: 'Cartera', porcentaje: datosEquipo.promedios.cartera, meta: 100, color: '#14B8A6' }
  ];

  // Determinar si estamos en pantalla móvil
  const isMobile = screenWidth < 640;

  return (
    <div className="space-y-6">
      {/* Título del reporte con periodo */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Resumen del Equipo - {periodo}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <UserGroupIcon className="h-5 w-5 text-indigo-500 mr-2" />
              <h4 className="text-sm font-medium text-gray-700">Clientes</h4>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{datosEquipo.promedios.clientes.toFixed(1)}%</p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full ${getColorClase(datosEquipo.promedios.clientes)}`}
                style={{ width: `${Math.min(datosEquipo.promedios.clientes, 100)}%` }}
              ></div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <CurrencyDollarIcon className="h-5 w-5 text-purple-500 mr-2" />
              <h4 className="text-sm font-medium text-gray-700">Cobranza</h4>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{datosEquipo.promedios.cobranza.toFixed(1)}%</p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full ${getColorClase(datosEquipo.promedios.cobranza)}`}
                style={{ width: `${Math.min(datosEquipo.promedios.cobranza, 100)}%` }}
              ></div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <ExclamationCircleIcon className="h-5 w-5 text-pink-500 mr-2" />
              <h4 className="text-sm font-medium text-gray-700">Morosidad</h4>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{datosEquipo.promedios.morosidad.toFixed(1)}%</p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full ${getColorClase(datosEquipo.promedios.morosidad, true)}`}
                style={{ width: `${Math.min(datosEquipo.promedios.morosidad, 100)}%` }}
              ></div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <ChartBarIcon className="h-5 w-5 text-teal-500 mr-2" />
              <h4 className="text-sm font-medium text-gray-700">Cartera</h4>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{datosEquipo.promedios.cartera.toFixed(1)}%</p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full ${getColorClase(datosEquipo.promedios.cartera)}`}
                style={{ width: `${Math.min(datosEquipo.promedios.cartera, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Tarjetas de distribución de bonificaciones */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Distribución de Bonificaciones</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <TrophyIcon className="h-5 w-5 text-green-600 mr-1" />
              <h4 className="text-sm font-medium text-green-800">Bono Extra</h4>
            </div>
            <p className="text-3xl font-bold text-green-600">{datosEquipo.rendimiento.sobresaliente}</p>
            <p className="text-sm text-green-800 mt-1">
              {((datosEquipo.rendimiento.sobresaliente / (datos?.length || 1)) * 100).toFixed(0)}% de asesores
            </p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 text-center">
            <h4 className="text-sm font-medium text-yellow-800 mb-2">Pago Normal</h4>
            <p className="text-3xl font-bold text-yellow-600">{datosEquipo.rendimiento.objetivo}</p>
            <p className="text-sm text-yellow-800 mt-1">
              {((datosEquipo.rendimiento.objetivo / (datos?.length || 1)) * 100).toFixed(0)}% de asesores
            </p>
          </div>
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <h4 className="text-sm font-medium text-red-800 mb-2">Menor Compensación</h4>
            <p className="text-3xl font-bold text-red-600">{datosEquipo.rendimiento.mejorable}</p>
            <p className="text-sm text-red-800 mt-1">
              {((datosEquipo.rendimiento.mejorable / (datos?.length || 1)) * 100).toFixed(0)}% de asesores
            </p>
          </div>
        </div>
      </div>

      {/* Gráficos responsivos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gráfico de barras de cumplimiento */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Cumplimiento por Categoría</h3>
          <div className={`${isMobile ? 'h-64' : 'h-80'}`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={datosGraficoBarras}
                margin={{ top: 5, right: 5, left: isMobile ? -25 : 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: isMobile ? 10 : 12 }} />
                <YAxis domain={[0, 120]} tick={{ fontSize: isMobile ? 10 : 12 }} />
                <Tooltip
                  formatter={(value) => [`${value.toFixed(1)}%`, 'Cumplimiento']}
                  labelFormatter={(label) => `Categoría: ${label}`}
                  contentStyle={{ fontSize: isMobile ? 10 : 12 }}
                />
                <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 12 }} />
                <ReferenceLine y={100} stroke="#666" strokeDasharray="3 3" />
                <Bar dataKey="porcentaje" name="Cumplimiento (%)" fill="#6366F1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico circular de distribución de bonificaciones */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Distribución de Bonificaciones</h3>
          <div className={`${isMobile ? 'h-64' : 'h-80'}`}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={datosGraficoPie}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={isMobile ? 70 : 80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({name, percent}) => 
                    isMobile ? 
                      `${(percent * 100).toFixed(0)}%` : 
                      `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {datosGraficoPie.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [value, 'Cantidad']}
                  labelFormatter={(label) => `${label}`}
                  contentStyle={{ fontSize: isMobile ? 10 : 12 }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: isMobile ? 10 : 12 }}
                  layout={isMobile ? "horizontal" : "vertical"}
                  verticalAlign={isMobile ? "bottom" : "middle"}
                  align={isMobile ? "center" : "right"}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Ranking de asesores (adaptado para móvil) */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 sm:px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Ranking de Asesores</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ranking
                </th>
                <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Asesor
                </th>
                <th scope="col" className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Promedio
                </th>
                <th scope="col" className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bonificación
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {datos
                ?.sort((a, b) => b.promedio_cumplimiento - a.promedio_cumplimiento)
                .map((asesor, index) => {
                  const bonificacion =
                    asesor.bonificacion === 'sobresaliente' ? { texto: 'Bono Extra', clase: 'bg-green-100 text-green-800' } :
                    asesor.bonificacion === 'objetivo' ? { texto: 'Pago Normal', clase: 'bg-yellow-100 text-yellow-800' } :
                    { texto: 'Menor Compensación', clase: 'bg-red-100 text-red-800' };
                  return (
                    <tr key={asesor.id || index} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {asesor.nombre}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm font-medium text-gray-900">{asesor.promedio_cumplimiento.toFixed(1)}%</span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-2 py-1 text-xs rounded-full ${bonificacion.clase}`}>
                          {isMobile && bonificacion.texto.length > 10 
                            ? (bonificacion.texto === 'Menor Compensación' ? 'M. Comp.' : bonificacion.texto)
                            : bonificacion.texto
                          }
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}