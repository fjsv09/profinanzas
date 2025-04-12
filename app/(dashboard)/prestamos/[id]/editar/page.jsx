'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { prestamosService } from '@/lib/supabase';
import PrestamoForm from '@/components/prestamos/prestamo-form';
import toast from 'react-hot-toast';
import { use } from 'react'; // Importa use desde React

export default function EditarPrestamoPage({ params }) {
  // Usa React.use() para desenvolver el objeto params
  const unwrappedParams = use(params);
  const prestamoId = unwrappedParams.id;
  const [prestamo, setPrestamo] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  useEffect(() => {
    const fetchPrestamo = async () => {
      try {
        // En un sistema real, estos datos vendrían de Supabase
        const prestamoData = {
          id: parseInt(prestamoId),
          cliente: {
            id: 1,
            nombre: 'María',
            apellido: 'López',
            dni: '45678912',
            telefono: '987654321'
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
      } catch (error) {
        console.error('Error al obtener préstamo:', error);
        toast.error('Error al cargar los datos del préstamo');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPrestamo();
  }, [prestamoId]);
  
  const handleSuccess = () => {
    router.push(`/prestamos/${prestamoId}`);
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
        <h2 className="text-xl font-semibold text-gray-800">Editar Préstamo #{prestamoId}</h2>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          Volver
        </button>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <PrestamoForm
          prestamoInicial={prestamo}
          onSuccess={handleSuccess}
          onCancel={() => router.back()}
        />
      </div>
    </div>
  );
}