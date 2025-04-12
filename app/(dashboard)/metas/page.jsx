'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { metasService, usuariosService } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import toast from 'react-hot-toast';
import { ChartBarIcon, PlusIcon } from '@heroicons/react/24/outline';

// Importar los componentes modularizados
import MetaForm from '@/components/metas/meta-form';
import MetasTable from '@/components/metas/metas-table';

export default function MetasPage() {
  const [user, setUser] = useState(null);
  const [asesores, setAsesores] = useState([]);
  const [metas, setMetas] = useState([]);
  const [periodoActual, setPeriodoActual] = useState('');
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('');
  const [loading, setLoading] = useState(true);
  const [metaEditando, setMetaEditando] = useState(null);
  // Estado para controlar si el selector de periodo está expandido en móviles
  const [periodControlExpanded, setPeriodControlExpanded] = useState(false);
  
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
        
        // Cargar asesores
        const asesoresData = [
          { id: '1', nombre: 'Juan', apellido: 'Pérez', rol: 'asesor', email: 'juan@profinanzas.com' },
          { id: '2', nombre: 'María', apellido: 'López', rol: 'asesor', email: 'maria@profinanzas.com' },
          { id: '3', nombre: 'Carlos', apellido: 'González', rol: 'asesor', email: 'carlos@profinanzas.com' },
          { id: '4', nombre: 'Ana', apellido: 'Martínez', rol: 'asesor', email: 'ana@profinanzas.com' }
        ];
        setAsesores(asesoresData);
        
        // Cargar metas
        const metasData = [
          {
            id: 1,
            asesor_id: '1',
            asesor: { nombre: 'Juan', apellido: 'Pérez' },
            periodo: periodoActual,
            meta_clientes: 20,
            meta_cobranza: 15000,
            meta_morosidad: 5,
            meta_cartera: 50000,
            clientes_captados: 15,
            cobranza_realizada: 12000,
            morosidad_actual: 3,
            cartera_actual: 45000
          },
          {
            id: 2,
            asesor_id: '2',
            asesor: { nombre: 'María', apellido: 'López' },
            periodo: periodoActual,
            meta_clientes: 25,
            meta_cobranza: 18000,
            meta_morosidad: 4,
            meta_cartera: 60000,
            clientes_captados: 22,
            cobranza_realizada: 17000,
            morosidad_actual: 3.5,
            cartera_actual: 58000
          },
          {
            id: 3,
            asesor_id: '3',
            asesor: { nombre: 'Carlos', apellido: 'González' },
            periodo: periodoActual,
            meta_clientes: 18,
            meta_cobranza: 12000,
            meta_morosidad: 6,
            meta_cartera: 40000,
            clientes_captados: 12,
            cobranza_realizada: 8000,
            morosidad_actual: 7,
            cartera_actual: 35000
          }
        ];
        setMetas(metasData);
        
      } catch (error) {
        console.error('Error al obtener datos:', error);
        toast.error('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndData();
  }, [router]);
  
  // Función para determinar asesores sin meta
  const asesoresSinMeta = () => {
    const idsConMeta = metas.map(m => m.asesor_id);
    return asesores.filter(a => !idsConMeta.includes(a.id));
  };

  // Manejadores de eventos para formulario de meta
  const handleNuevaMeta = () => {
    setMetaEditando('nueva');
    // Scroll hacia arriba en dispositivos móviles para mostrar el formulario
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditarMeta = (meta) => {
    setMetaEditando(meta.id);
    // Scroll hacia arriba en dispositivos móviles para mostrar el formulario
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleCancelarEdicion = () => {
    setMetaEditando(null);
  };
  
  const handleSubmitMeta = async (formData) => {
    // En un sistema real, esto se guardaría en la base de datos
    if (metaEditando === 'nueva') {
      // Crear nueva meta
      const asesorSeleccionado = asesores.find(a => a.id === formData.asesor_id);
      const nuevaMeta = {
        id: metas.length + 1,
        ...formData,
        periodo: periodoSeleccionado,
        clientes_captados: 0,
        cobranza_realizada: 0,
        morosidad_actual: 0,
        cartera_actual: 0,
        asesor: {
          nombre: asesorSeleccionado.nombre,
          apellido: asesorSeleccionado.apellido
        }
      };
      
      setMetas([...metas, nuevaMeta]);
      toast.success('Meta creada con éxito');
    } else {
      // Actualizar meta existente
      const metasActualizadas = metas.map(m => 
        m.id === metaEditando ? {
          ...m,
          meta_clientes: parseFloat(formData.meta_clientes),
          meta_cobranza: parseFloat(formData.meta_cobranza),
          meta_morosidad: parseFloat(formData.meta_morosidad),
          meta_cartera: parseFloat(formData.meta_cartera)
        } : m
      );
      
      setMetas(metasActualizadas);
      toast.success('Meta actualizada con éxito');
    }
    
    // Resetear formulario
    setMetaEditando(null);
  };
  
  // Función para navegar al periodo anterior
  const goToPreviousPeriod = () => {
    const [year, month] = periodoSeleccionado.split('-');
    const prevMonth = month === '01' ? '12' : String(parseInt(month) - 1).padStart(2, '0');
    const prevYear = month === '01' ? parseInt(year) - 1 : year;
    setPeriodoSeleccionado(`${prevYear}-${prevMonth}`);
  };

  // Función para navegar al periodo siguiente
  const goToNextPeriod = () => {
    const [year, month] = periodoSeleccionado.split('-');
    const nextMonth = month === '12' ? '01' : String(parseInt(month) + 1).padStart(2, '0');
    const nextYear = month === '12' ? parseInt(year) + 1 : year;
    const nextPeriodo = `${nextYear}-${nextMonth}`;
    if (nextPeriodo <= periodoActual) {
      setPeriodoSeleccionado(nextPeriodo);
    }
  };

  // Función para formatear el periodo a un formato más legible
  const formatPeriodo = (periodo) => {
    if (!periodo) return '';
    const [year, month] = periodo.split('-');
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
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
        <h2 className="text-xl font-semibold text-gray-800">Gestión de Metas</h2>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {metaEditando === null && (
            <button
              onClick={handleNuevaMeta}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              disabled={asesoresSinMeta().length === 0}
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              <span className="whitespace-nowrap">Nueva Meta</span>
            </button>
          )}
          <button
            onClick={() => router.push('/metas/reportes')}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            <ChartBarIcon className="h-5 w-5 mr-2" />
            <span className="whitespace-nowrap">Ver Reportes</span>
          </button>
        </div>
      </div>

      {/* Selector de período (responsivo) */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div 
            className="mb-4 sm:mb-0 w-full sm:w-auto cursor-pointer sm:cursor-default"
            onClick={() => setPeriodControlExpanded(!periodControlExpanded)}
          >
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              Período: <span className="ml-2 text-indigo-600">{formatPeriodo(periodoSeleccionado)}</span>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-5 w-5 ml-2 transition-transform duration-200 sm:hidden ${periodControlExpanded ? 'rotate-180' : ''}`} 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </h3>
            <p className="text-sm text-gray-500">
              {periodoSeleccionado === periodoActual ? 'Período actual' : 'Visualizando período pasado'}
            </p>
          </div>
          <div className={`flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto ${periodControlExpanded || window.innerWidth >= 640 ? 'block' : 'hidden'}`}>
            <button
              onClick={goToPreviousPeriod}
              className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors w-full sm:w-auto"
            >
              Mes Anterior
            </button>
            <button
              onClick={() => setPeriodoSeleccionado(periodoActual)}
              className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors w-full sm:w-auto"
              disabled={periodoSeleccionado === periodoActual}
            >
              Mes Actual
            </button>
            <button
              onClick={goToNextPeriod}
              className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors w-full sm:w-auto"
              disabled={periodoSeleccionado === periodoActual}
            >
              Mes Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* Formulario de nueva/edición meta (responsivo) */}
      {metaEditando !== null && (
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {metaEditando === 'nueva' ? 'Nueva Meta' : 'Editar Meta'}
          </h3>
          <MetaForm 
            meta={metaEditando !== 'nueva' ? metas.find(m => m.id === metaEditando) : null}
            asesores={asesores}
            asesoresSinMeta={asesoresSinMeta}
            periodo={periodoSeleccionado}
            onSubmit={handleSubmitMeta}
            onCancel={handleCancelarEdicion}
          />
        </div>
      )}

      {/* Tabla de metas (asegurarnos que el componente MetasTable sea responsivo) */}
      <div className="overflow-x-auto">
        <MetasTable 
          metas={metas.filter(meta => meta.periodo === periodoSeleccionado)}
          onEdit={handleEditarMeta}
        />
      </div>

      {/* Botón flotante para nueva meta en dispositivos móviles */}
      {metaEditando === null && asesoresSinMeta().length > 0 && (
        <div className="fixed bottom-6 right-6 sm:hidden">
          <button
            onClick={handleNuevaMeta}
            className="flex items-center justify-center w-14 h-14 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 transition-colors"
            aria-label="Nueva Meta"
          >
            <PlusIcon className="h-6 w-6" />
          </button>
        </div>
      )}
    </div>
  );
}