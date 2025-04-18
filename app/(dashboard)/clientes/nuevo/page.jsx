'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { supabase, clientesService } from '@/lib/supabase';
import ClienteForm from '@/components/clientes/cliente-form';
import toast from 'react-hot-toast';

export default function NuevoClientePage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState(null);
  const [asesores, setAsesores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Obtener usuario actual
        const currentUser = await getCurrentUser();
        setUsuario(currentUser);

        // Obtener lista de asesores según el rol
        let asesoresData = [];
        if (currentUser) {
          if (['administrador', 'admin_sistema'].includes(currentUser.rol)) {
            // Los administradores pueden ver todos los asesores
            const { data, error } = await supabase
              .from('usuarios')
              .select('id, nombre, apellido')
              .eq('rol', 'asesor');
            if (error) throw error;
            asesoresData = data;
          } 
          // Los asesores no necesitan cargar la lista ya que se les asigna automáticamente y los supervisores tampoco porque no pueden editar
        }

        setAsesores(asesoresData);
      } catch (err) {
        setError(err);
        console.error('Error al cargar datos:', err);
        toast.error('Error al cargar datos necesarios');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSuccess = () => {
    router.push('/clientes');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Error: {error.message}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Nuevo Cliente</h2>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          Volver
        </button>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <ClienteForm
          usuario={usuario}
          asesores={asesores}
          onSuccess={handleSuccess}
          onCancel={() => router.back()}
        />
      </div>
    </div>
  );
}