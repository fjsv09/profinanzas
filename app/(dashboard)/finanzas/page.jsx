'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { finanzasService } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import toast from 'react-hot-toast';
import { ChartBarIcon } from '@heroicons/react/24/outline';

// Importamos los componentes
import TransaccionForm from '@/components/finanzas/transaccion-form';
import BalanceSummary from '@/components/finanzas/balance-summary';

export default function FinanzasPage() {
  const [user, setUser] = useState(null);
  const [transacciones, setTransacciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todos');
  const [resumen, setResumen] = useState({
    ingresos: 0,
    egresos: 0,
    balance: 0,
    efectivo: 0,
    yape: 0,
    banco: 0
  });
  
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

        // En un sistema real, estos datos vendrían de Supabase
        // Por ahora, usamos datos de ejemplo
        const transaccionesData = [
          {
            id: 1,
            tipo: 'ingreso',
            monto: 1500.00,
            categoria: 'Cobranza',
            descripcion: 'Cobranzas del día',
            cuenta: 'caja',
            fecha: new Date().toISOString(),
            created_at: new Date().toISOString(),
            created_by: 'Administrador'
          },
          {
            id: 2,
            tipo: 'ingreso',
            monto: 2000.00,
            categoria: 'Cobranza',
            descripcion: 'Cobranzas del día anterior',
            cuenta: 'yape',
            fecha: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Ayer
            created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            created_by: 'Administrador'
          },
          {
            id: 3,
            tipo: 'egreso',
            monto: 300.00,
            categoria: 'Gastos Operativos',
            descripcion: 'Papelería y suministros',
            cuenta: 'caja',
            fecha: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 días atrás
            created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            created_by: 'Administrador'
          },
          {
            id: 4,
            tipo: 'egreso',
            monto: 1200.00,
            categoria: 'Salarios',
            descripcion: 'Pago a asesor',
            cuenta: 'banco',
            fecha: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 días atrás
            created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            created_by: 'Administrador'
          }
        ];
        
        setTransacciones(transaccionesData);
        
        // Calcular resumen financiero
        calcularResumen(transaccionesData);
      } catch (error) {
        console.error('Error al obtener datos:', error);
        toast.error('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndData();
  }, [router]);

  const calcularResumen = (data) => {
    const resumenCalculado = data.reduce((acc, transaccion) => {
      // Sumar ingresos o egresos según el tipo
      if (transaccion.tipo === 'ingreso') {
        acc.ingresos += transaccion.monto;
      } else {
        acc.egresos += transaccion.monto;
      }
      
      // Sumar montos por cuenta
      switch (transaccion.cuenta) {
        case 'caja':
          acc.efectivo += transaccion.tipo === 'ingreso' ? transaccion.monto : -transaccion.monto;
          break;
        case 'yape':
          acc.yape += transaccion.tipo === 'ingreso' ? transaccion.monto : -transaccion.monto;
          break;
        case 'banco':
          acc.banco += transaccion.tipo === 'ingreso' ? transaccion.monto : -transaccion.monto;
          break;
        default:
          break;
      }
      
      return acc;
    }, {
      ingresos: 0,
      egresos: 0,
      balance: 0,
      efectivo: 0,
      yape: 0,
      banco: 0
    });
    
    // Calcular balance total
    resumenCalculado.balance = resumenCalculado.ingresos - resumenCalculado.egresos;
    
    setResumen(resumenCalculado);
  };

  // Manejador para la transacción enviada desde el componente TransaccionForm
  const handleTransaccionSubmit = async (transaccionData) => {
    try {
      // En un sistema real, esto se guardaría en la base de datos
      console.log('Nueva transacción:', transaccionData);
      
      // Simulación de guardado
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Actualizar el estado localmente
      const updatedTransacciones = [
        {
          ...transaccionData,
          id: transacciones.length + 1,
          created_at: new Date().toISOString(),
          created_by: user?.nombre || 'Usuario'
        },
        ...transacciones
      ];
      
      setTransacciones(updatedTransacciones);
      calcularResumen(updatedTransacciones);
      
      toast.success('Transacción registrada con éxito');
      
      return true; // Indicar éxito
    } catch (error) {
      console.error('Error al registrar transacción:', error);
      toast.error('Error al registrar la transacción');
      return false; // Indicar fallo
    }
  };

  // Manejador para el cambio de filtro en BalanceSummary
  const handleFilterChange = (newFilter) => {
    setFiltro(newFilter);
  };
  
  // Filtrar transacciones según el tipo seleccionado
  const filtrarTransacciones = () => {
    if (filtro === 'todos') {
      return transacciones;
    }
    return transacciones.filter(transaccion => transaccion.tipo === filtro);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 md:mb-0">Administración Financiera</h2>
        <div className="flex space-x-2">
          {/* Mantenemos solo un botón para ver reportes */}
          <button
            onClick={() => router.push('/finanzas/reportes')}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            <ChartBarIcon className="h-5 w-5 mr-2" />
            Ver Reportes Detallados
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario de nueva transacción usando el componente */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Registrar Transacción</h3>
            {/* Implementamos el componente TransaccionForm */}
            <TransaccionForm onSubmit={handleTransaccionSubmit} />
          </div>
        </div>

        {/* Columna del resumen y transacciones */}
        <div className="lg:col-span-2">
          {/* Implementamos el componente BalanceSummary */}
          <BalanceSummary 
            resumenData={resumen}
            transacciones={filtrarTransacciones()}
            onPeriodChange={() => {}} // No implementado en esta vista
          />
        </div>
      </div>
    </div>
  );
}