'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

// Importamos el componente CuadreCajaForm
import CuadreCajaForm from '@/components/cobranzas/cuadre-caja-form';

export default function CuadreCajaPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resumenDia, setResumenDia] = useState({
    cobradoEfectivo: 0,
    cobradoYape: 0,
    cobradoTransferencia: 0,
    cobradoOtro: 0,
    totalCobrado: 0
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
        const pagosDelDia = {
          efectivo: 850.00,
          yape: 420.50,
          transferencia: 350.00,
          otro: 125.00
        };

        const totalCobrado = pagosDelDia.efectivo + pagosDelDia.yape + 
                             pagosDelDia.transferencia + pagosDelDia.otro;

        setResumenDia({
          cobradoEfectivo: pagosDelDia.efectivo,
          cobradoYape: pagosDelDia.yape,
          cobradoTransferencia: pagosDelDia.transferencia,
          cobradoOtro: pagosDelDia.otro,
          totalCobrado: totalCobrado
        });
      } catch (error) {
        console.error('Error al obtener datos:', error);
        toast.error('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndData();
  }, [router]);

  const handleCuadreGuardado = (cuadreData) => {
    // En un sistema real, aquí podríamos realizar acciones adicionales
    // como actualizar el estado global, enviar notificaciones, etc.
    toast.success('Cuadre de caja registrado con éxito');
    
    // Redirigir a la página de cobranzas después de registrar el cuadre
    router.push('/cobranzas');
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
        <h2 className="text-xl font-semibold text-gray-800">Cuadre de Caja</h2>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          Volver
        </button>
      </div>

      {/* Implementación del componente CuadreCajaForm */}
      <CuadreCajaForm 
        resumenDia={resumenDia}
        onCuadreGuardado={handleCuadreGuardado}
        onCancel={() => router.push('/cobranzas')}
      />
    </div>
  );
}