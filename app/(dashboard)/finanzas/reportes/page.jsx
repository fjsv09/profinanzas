'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { finanzasService } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import toast from 'react-hot-toast';

// Importamos el componente ReportesFinancieros
import ReportesFinancieros from '@/components/finanzas/reportes-financieros';

export default function ReportesFinancierosPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [datosReporte, setDatosReporte] = useState({
    ingresos: [],
    egresos: [],
    resumen: {
      totalIngresos: 0,
      totalEgresos: 0,
      balance: 0
    },
    distribuciones: {
      ingresosPorCategoria: {},
      egresosPorCategoria: {},
      saldosPorCuenta: {}
    }
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
        
        // Las fechas por defecto se manejarán dentro del componente
        
        // Cargar datos iniciales con el mes actual
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        await cargarDatosReporte(firstDayOfMonth, lastDayOfMonth);
      } catch (error) {
        console.error('Error al obtener usuario:', error);
        toast.error('Error al cargar datos del usuario');
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndData();
  }, [router]);

  const cargarDatosReporte = async (inicio, fin) => {
    setLoading(true);
    try {
      // En un sistema real, estos datos vendrían de Supabase
      // Por ahora, usamos datos de ejemplo
      
      // Simular transacciones para el reporte
      const transacciones = [
        {
          id: 1,
          tipo: 'ingreso',
          monto: 5000.00,
          categoria: 'Cobranza',
          cuenta: 'caja',
          fecha: '2025-03-05'
        },
        {
          id: 2,
          tipo: 'ingreso',
          monto: 3000.00,
          categoria: 'Préstamo Nuevo',
          cuenta: 'yape',
          fecha: '2025-03-08'
        },
        {
          id: 3,
          tipo: 'ingreso',
          monto: 2000.00,
          categoria: 'Renovación',
          cuenta: 'banco',
          fecha: '2025-03-12'
        },
        {
          id: 4,
          tipo: 'ingreso',
          monto: 1500.00,
          categoria: 'Cobranza',
          cuenta: 'caja',
          fecha: '2025-03-15'
        },
        {
          id: 5,
          tipo: 'egreso',
          monto: 800.00,
          categoria: 'Gastos Operativos',
          cuenta: 'caja',
          fecha: '2025-03-07'
        },
        {
          id: 6,
          tipo: 'egreso',
          monto: 2500.00,
          categoria: 'Salarios',
          cuenta: 'banco',
          fecha: '2025-03-10'
        },
        {
          id: 7,
          tipo: 'egreso',
          monto: 300.00,
          categoria: 'Transporte',
          cuenta: 'caja',
          fecha: '2025-03-14'
        },
        {
          id: 8,
          tipo: 'egreso',
          monto: 1200.00,
          categoria: 'Capital para Préstamos',
          cuenta: 'banco',
          fecha: '2025-03-18'
        }
      ];
      
      // Filtrar por fecha
      const transaccionesFiltradas = transacciones.filter(t => {
        const fecha = new Date(t.fecha);
        return fecha >= new Date(inicio) && fecha <= new Date(fin);
      });
      
      // Separar ingresos y egresos
      const ingresos = transaccionesFiltradas.filter(t => t.tipo === 'ingreso');
      const egresos = transaccionesFiltradas.filter(t => t.tipo === 'egreso');
      
      // Calcular totales
      const totalIngresos = ingresos.reduce((sum, t) => sum + t.monto, 0);
      const totalEgresos = egresos.reduce((sum, t) => sum + t.monto, 0);
      const balance = totalIngresos - totalEgresos;
      
      // Distribución por categoría
      const ingresosPorCategoria = {};
      const egresosPorCategoria = {};
      
      ingresos.forEach(t => {
        ingresosPorCategoria[t.categoria] = (ingresosPorCategoria[t.categoria] || 0) + t.monto;
      });
      
      egresos.forEach(t => {
        egresosPorCategoria[t.categoria] = (egresosPorCategoria[t.categoria] || 0) + t.monto;
      });
      
      // Saldos por cuenta
      const saldosPorCuenta = {
        caja: 0,
        yape: 0,
        banco: 0
      };
      
      transaccionesFiltradas.forEach(t => {
        if (t.tipo === 'ingreso') {
          saldosPorCuenta[t.cuenta] = (saldosPorCuenta[t.cuenta] || 0) + t.monto;
        } else {
          saldosPorCuenta[t.cuenta] = (saldosPorCuenta[t.cuenta] || 0) - t.monto;
        }
      });
      
      // Actualizar estado
      setDatosReporte({
        ingresos,
        egresos,
        resumen: {
          totalIngresos,
          totalEgresos,
          balance
        },
        distribuciones: {
          ingresosPorCategoria,
          egresosPorCategoria,
          saldosPorCuenta
        }
      });
    } catch (error) {
      console.error('Error al cargar datos del reporte:', error);
      toast.error('Error al generar el reporte');
    } finally {
      setLoading(false);
    }
  };

  // Manejadores para los eventos del componente ReportesFinancieros
  
  const handlePeriodoChange = (periodo, fechaInicio, fechaFin) => {
    cargarDatosReporte(new Date(fechaInicio), new Date(fechaFin));
  };

  const handleBuscar = (fechaInicio, fechaFin) => {
    cargarDatosReporte(new Date(fechaInicio), new Date(fechaFin));
  };

  const handleExportar = async (periodo, fechaInicio, fechaFin) => {
    try {
      // En un sistema real, aquí se llamaría a una API para exportar el reporte
      console.log('Exportando reporte:', {
        periodo,
        fechaInicio,
        fechaFin,
        datosReporte
      });
      
      // Simulamos un tiempo de espera para la exportación
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return true;
    } catch (error) {
      console.error('Error al exportar:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <ReportesFinancieros 
      datosReporte={datosReporte}
      onPeriodoChange={handlePeriodoChange}
      onExportar={handleExportar}
      onBuscar={handleBuscar}
    />
  );
}