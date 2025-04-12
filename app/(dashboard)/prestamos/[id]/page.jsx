'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { prestamosService } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import PrestamoDetails from '@/components/prestamos/prestamo-details';
import toast from 'react-hot-toast';
import { use } from 'react'; // Importa use desde React

export default function PrestamoDetallePage({ params }) {
  // Usa React.use() para desenvolver el objeto params
  const unwrappedParams = use(params);
  const prestamoId = unwrappedParams.id;
  const [prestamo, setPrestamo] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchPrestamoData = async () => {
      try {
        // Obtener el usuario actual
        const currentUser = await getCurrentUser();
        setUsuario(currentUser);

        // En un sistema real, estos datos vendrían de Supabase
        // Por ahora, usamos datos de ejemplo
        const prestamoData = {
          id: parseInt(prestamoId),
          cliente: {
            id: 1,
            nombre: 'María',
            apellido: 'López',
            dni: '45678912',
            asesor_id: '843515ad-da66-4c94-98c5-b6e89a53e6a0' 
          },
          monto: 1000,
          interes: 10,
          monto_total: 1100,
          frecuencia_pago: 'diario',
          total_cuotas: 30,
          cuotas_pagadas: 15,
          estado: 'activo',
          fecha_inicio: '2025-03-01T14:30:00',
          created_at: '2025-03-01T14:30:00'
        };
        
        setPrestamo(prestamoData);
      } catch (error) {
        console.error('Error al obtener datos del préstamo:', error);
        toast.error('Error al cargar los datos del préstamo');
      } finally {
        setLoading(false);
      }
    };

    fetchPrestamoData();
  }, [prestamoId]);

  // Verificación de acceso al préstamo
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const currentUser = await getCurrentUser();
        
        // Verificar si el usuario tiene acceso a este préstamo específico
        if (currentUser.rol === 'asesor') {
          // Verificar si el préstamo pertenece a un cliente de este asesor
          if (prestamo && prestamo.cliente.asesor_id !== currentUser.id) {
            toast.error('No tienes permiso para ver este préstamo');
            router.push('/prestamos');
            return;
          }
        } else if (currentUser.rol === 'supervisor') {
          // Verificar si el préstamo pertenece a un cliente de un asesor supervisado
          // Simulamos asesores supervisados
          const asesoresSupervisa = 
            currentUser.id === 'a9ce19f1-1ce0-4d78-a657-fd92eae4bfef' ? ['843515ad-da66-4c94-98c5-b6e89a53e6a0', '2'] : 
            currentUser.id === '2' ? ['3', '4'] : [];
          
          if (prestamo && !asesoresSupervisa.includes(prestamo.cliente.asesor_id)) {
            toast.error('No tienes permiso para ver este préstamo');
            router.push('/prestamos');
            return;
          }
        }
        // Los administradores pueden ver todos los préstamos
      } catch (error) {
        console.error('Error al verificar permisos:', error);
      }
    };
    
    if (prestamo) {
      checkAccess();
    }
  }, [prestamo, router]);

  const handleDelete = async () => {
    // Verificar si el usuario tiene permisos para eliminar
    if (usuario && !['administrador', 'admin_sistema'].includes(usuario.rol)) {
      toast.error('No tienes permisos para eliminar este préstamo');
      return;
    }

    if (confirm('¿Está seguro que desea eliminar este préstamo?')) {
      try {
        // En un sistema real, esto eliminaría el préstamo
        // await prestamosService.delete(prestamoId);
        toast.success('Préstamo eliminado con éxito');
        router.push('/prestamos');
      } catch (error) {
        console.error('Error al eliminar préstamo:', error);
        toast.error('Error al eliminar el préstamo');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!prestamo) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-semibold text-gray-800">Préstamo no encontrado</h2>
        <button
          onClick={() => router.push('/prestamos')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          Volver a Préstamos
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Detalles del Préstamo #{prestamo.id}</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Volver
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Componente de detalles del préstamo */}
        <PrestamoDetails 
          prestamo={prestamo} 
          usuario={usuario}
          onDelete={handleDelete} 
        />
      </div>
    </div>
  );
}