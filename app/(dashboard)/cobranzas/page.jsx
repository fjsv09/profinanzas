'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { prestamosService, pagosService } from '@/lib/supabase';
import toast from 'react-hot-toast';

// Importamos el componente RegistroPago
import RegistroPago from '@/components/cobranzas/registro-pago';
// Importamos el componente CobranzasTable
import CobranzasTable from '@/components/cobranzas/cobranzas-table';

export default function CobranzasPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prestamoIdParam = searchParams.get('prestamo');

  const [prestamo, setPrestamo] = useState(null);
  const [pagosRecientes, setPagosRecientes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Si hay un préstamo específico en la URL, cargar sus datos
        if (prestamoIdParam) {
          // En un sistema real, estos datos vendrían de Supabase
          // Por ahora, usamos datos de ejemplo
          const prestamoData = {
            id: parseInt(prestamoIdParam),
            cliente: {
              id: 1,
              nombre: 'María',
              apellido: 'López',
              dni: '45678912'
            },
            monto: 1000,
            interes: 10,
            monto_total: 1100,
            frecuencia_pago: 'diario',
            total_cuotas: 30,
            cuotas_pagadas: 15,
            estado: 'activo',
            fecha_inicio: '2025-03-01T14:30:00'
          };

          setPrestamo(prestamoData);
        }

        // Cargar algunos pagos recientes para mostrar en la página
        const pagosRecientesData = [
          {
            id: 1001,
            prestamo_id: 101,
            cliente: 'María López',
            monto: 36.70,
            fecha_pago: new Date().toISOString(),
            metodo_pago: 'efectivo',
            created_at: new Date().toISOString(),
            created_by: 'usuario_ejemplo'
          },
          {
            id: 1002,
            prestamo_id: 103,
            cliente: 'Juan Pérez',
            monto: 230.00,
            fecha_pago: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Ayer
            metodo_pago: 'yape',
            created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            created_by: 'usuario_ejemplo'
          },
          {
            id: 1003,
            prestamo_id: 104,
            cliente: 'Ana García',
            monto: 280.00,
            fecha_pago: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // Anteayer
            metodo_pago: 'efectivo',
            created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
            created_by: 'usuario_ejemplo'
          }
        ];

        setPagosRecientes(pagosRecientesData);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        toast.error('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [prestamoIdParam]);

  // Función para manejar cuando se registra un pago exitosamente
  const handlePagoRegistrado = (pago) => {
    // Actualizar la lista de pagos recientes
    setPagosRecientes([pago, ...pagosRecientes]);
    
    // Redireccionar a la página del préstamo (opcional)
    router.push(`/prestamos/${pago.prestamo_id}`);
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Registro de Pagos</h2>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => router.push('/cobranzas/cuadre-caja')}
            className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Cuadre de Caja
          </button>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Volver
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario de registro de pago - Ahora usando el componente RegistroPago */}
        <div className="lg:col-span-1">
          <RegistroPago 
            prestamo={prestamo}
            onPagoRegistrado={handlePagoRegistrado}
            onCancel={() => router.push('/prestamos')}
          />
        </div>

        {/* Lista de pagos recientes */}
        <div className="lg:col-span-2">
          <CobranzasTable 
            pagos={pagosRecientes} 
            tipo="realizados" 
          />

          {/* Próximos pagos para hoy (si no hay préstamo seleccionado) */}
          {!prestamo && (
            <div className="mt-6">
              <CobranzasTable 
                pendientes={[
                  { id: 1, cliente: 'Roberto Silva', prestamo_id: 106, monto: 36.70 },
                  { id: 2, cliente: 'Carmen Torres', prestamo_id: 107, monto: 73.40 },
                  { id: 3, cliente: 'Miguel Sánchez', prestamo_id: 108, monto: 42.50 }
                ]} 
                tipo="pendientes" 
                onRegistrarPago={(prestamo_id) => router.push(`/cobranzas?prestamo=${prestamo_id}`)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}