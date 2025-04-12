'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { metasService } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import toast from 'react-hot-toast';
import { ArrowDownTrayIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

// Importar el componente DesempeñoChart
import DesempeñoChart from '@/components/metas/desempeño-chart';

export default function MetasReportesPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('mes');
  const [periodoActual, setPeriodoActual] = useState('');
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('');
  // Nuevo estado para controlar la expansión del selector de periodo en móviles
  const [periodSelectorExpanded, setPeriodSelectorExpanded] = useState(false);
  const [reporteData, setReporteData] = useState({
    asesores: [],
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
  const [exportando, setExportando] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    const fetchUserAndData = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.push('/login');
          return;
        }
        setUser(currentUser);

        // Establecer el período actual (mes actual en formato YYYY-MM)
        const today = new Date();
        const periodoActual = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        setPeriodoActual(periodoActual);
        setPeriodoSeleccionado(periodoActual);

        await cargarDatosReporte(periodoActual);
      } catch (error) {
        console.error('Error al obtener usuario:', error);
        toast.error('Error al cargar datos del usuario');
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndData();
  }, [router]);

  const cargarDatosReporte = async (periodo) => {
    setLoading(true);
    try {
      // En un sistema real, estos datos vendrían de Supabase
      // Por ahora, usamos datos de ejemplo
      
      const asesoresData = [
        {
          id: '1',
          nombre: 'Juan Pérez',
          metas: {
            clientes: { meta: 20, actual: 18, porcentaje: 90 },
            cobranza: { meta: 15000, actual: 14200, porcentaje: 94.67 },
            morosidad: { meta: 5, actual: 3, porcentaje: 60 }, // Menor es mejor
            cartera: { meta: 50000, actual: 48000, porcentaje: 96 }
          },
          promedio_cumplimiento: 95.17, // Calculado excluyendo morosidad
          bonificacion: 'sobresaliente' // > 100% = sobresaliente, 80-100% = objetivo, < 80% = mejorable
        },
        {
          id: '2',
          nombre: 'María López',
          metas: {
            clientes: { meta: 25, actual: 25, porcentaje: 100 },
            cobranza: { meta: 18000, actual: 19500, porcentaje: 108.33 },
            morosidad: { meta: 4, actual: 3.5, porcentaje: 87.5 },
            cartera: { meta: 60000, actual: 62000, porcentaje: 103.33 }
          },
          promedio_cumplimiento: 103.89,
          bonificacion: 'sobresaliente'
        },
        {
          id: '3',
          nombre: 'Carlos González',
          metas: {
            clientes: { meta: 18, actual: 12, porcentaje: 66.67 },
            cobranza: { meta: 12000, actual: 8500, porcentaje: 70.83 },
            morosidad: { meta: 6, actual: 7, porcentaje: 116.67 }, // Aquí mayor es peor
            cartera: { meta: 40000, actual: 35000, porcentaje: 87.5 }
          },
          promedio_cumplimiento: 75,
          bonificacion: 'mejorable'
        },
        {
          id: '4',
          nombre: 'Ana Martínez',
          metas: {
            clientes: { meta: 22, actual: 19, porcentaje: 86.36 },
            cobranza: { meta: 16000, actual: 15200, porcentaje: 95 },
            morosidad: { meta: 5, actual: 4.5, porcentaje: 90 },
            cartera: { meta: 55000, actual: 50000, porcentaje: 90.91 }
          },
          promedio_cumplimiento: 90.76,
          bonificacion: 'objetivo'
        }
      ];
      
      // Calcular promedios
      const totalAsesores = asesoresData.length;
      const promedios = {
        clientes: asesoresData.reduce((acc, asesor) => acc + asesor.metas.clientes.porcentaje, 0) / totalAsesores,
        cobranza: asesoresData.reduce((acc, asesor) => acc + asesor.metas.cobranza.porcentaje, 0) / totalAsesores,
        morosidad: asesoresData.reduce((acc, asesor) => acc + asesor.metas.morosidad.porcentaje, 0) / totalAsesores,
        cartera: asesoresData.reduce((acc, asesor) => acc + asesor.metas.cartera.porcentaje, 0) / totalAsesores
      };
      
      // Contar rendimiento por categoría
      const rendimiento = {
        sobresaliente: asesoresData.filter(a => a.bonificacion === 'sobresaliente').length,
        objetivo: asesoresData.filter(a => a.bonificacion === 'objetivo').length,
        mejorable: asesoresData.filter(a => a.bonificacion === 'mejorable').length
      };
      
      setReporteData({
        asesores: asesoresData,
        promedios,
        rendimiento
      });
    } catch (error) {
      console.error('Error al cargar datos del reporte:', error);
      toast.error('Error al generar el reporte');
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodoChange = (nuevoPeriodo) => {
    setPeriodo(nuevoPeriodo);
    setPeriodSelectorExpanded(false); // Cerrar el selector en móviles después de elegir
    
    const today = new Date();
    let periodoNuevo;
    
    switch (nuevoPeriodo) {
      case 'mes':
        // Mes actual
        periodoNuevo = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'trimestre':
        // Usar el mes actual pero para visualizar es trimestre
        periodoNuevo = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'anual':
        // Usar el mes actual pero para visualizar es anual
        periodoNuevo = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        break;
      default:
        periodoNuevo = periodoActual;
    }
    
    setPeriodoSeleccionado(periodoNuevo);
    cargarDatosReporte(periodoNuevo);
  };

  const handleExportar = () => {
    setExportando(true);
    
    // Simular una exportación
    setTimeout(() => {
      toast.success('Reporte exportado exitosamente');
      setExportando(false);
    }, 1500);
  };
  
  // Función para formatear periodo para mostrar de forma más amigable
  const formatPeriodo = (periodo) => {
    if (!periodo) return '';
    const [year, month] = periodo.split('-');
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-full px-2 sm:px-4 lg:px-6">
      {/* Encabezado responsivo */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
        <h2 className="text-xl font-semibold text-gray-800">Reportes de Desempeño</h2>
        <div className="flex flex-wrap w-full sm:w-auto gap-2">
          <button
            onClick={() => router.back()}
            className="flex items-center px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            <span>Volver</span>
          </button>
          <button
            onClick={handleExportar}
            disabled={exportando}
            className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 w-full sm:w-auto"
          >
            {exportando ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                <span>Exportando...</span>
              </>
            ) : (
              <>
                <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                <span>Exportar</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Selector de período responsivo */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div 
            className="mb-4 sm:mb-0 w-full sm:w-auto cursor-pointer sm:cursor-default"
            onClick={() => setPeriodSelectorExpanded(!periodSelectorExpanded)}
          >
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              {periodo === 'mes' 
                ? `Reporte Mensual: ${formatPeriodo(periodoSeleccionado)}` 
                : periodo === 'trimestre' 
                  ? 'Reporte Trimestral' 
                  : 'Reporte Anual'
              }
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-5 w-5 ml-2 transition-transform duration-200 sm:hidden ${periodSelectorExpanded ? 'rotate-180' : ''}`} 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </h3>
          </div>
          <div className={`flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto ${periodSelectorExpanded ? 'block' : 'hidden sm:flex'}`}>
            <button
              onClick={() => handlePeriodoChange('mes')}
              className={`flex-1 sm:flex-none px-4 py-2 text-sm rounded-md transition-colors ${
                periodo === 'mes'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Mensual
            </button>
            <button
              onClick={() => handlePeriodoChange('trimestre')}
              className={`flex-1 sm:flex-none px-4 py-2 text-sm rounded-md transition-colors ${
                periodo === 'trimestre'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Trimestral
            </button>
            <button
              onClick={() => handlePeriodoChange('anual')}
              className={`flex-1 sm:flex-none px-4 py-2 text-sm rounded-md transition-colors ${
                periodo === 'anual'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Anual
            </button>
          </div>
        </div>
      </div>

      {/* Asegurarse de que el componente DesempeñoChart sea responsivo */}
      <div className="overflow-x-auto">
        <DesempeñoChart 
          datos={reporteData.asesores} 
          periodo={
            periodo === 'mes' 
              ? `Mensual: ${formatPeriodo(periodoSeleccionado)}` 
              : periodo === 'trimestre' 
                ? 'Trimestral' 
                : 'Anual'
          }
        />
      </div>
    </div>
  );
}