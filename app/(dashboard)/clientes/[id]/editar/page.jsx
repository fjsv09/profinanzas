'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { clientesService } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import ClienteForm from '@/components/clientes/cliente-form';
import toast from 'react-hot-toast';
import { use } from 'react'; // Importa use desde React

export default function EditarClientePage({ params }) {
  // Usa React.use() para desenvolver el objeto params
  const unwrappedParams = use(params);
  const clienteId = unwrappedParams.id;
  const [cliente, setCliente] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [asesores, setAsesores] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener usuario actual
        const currentUser = await getCurrentUser();
        setUsuario(currentUser);

        // En un sistema real, estos datos vendrían de Supabase
        // Por ahora, usamos datos de ejemplo
        const clienteData = {
          id: parseInt(clienteId),
          nombre: 'María',
          apellido: 'López',
          dni: '45678912',
          telefono: '987654321',
          direccion: 'Av. Los Pinos 123',
          referencias: 'Cerca al mercado central',
          created_at: '2025-02-15T10:30:00',
          asesor_id: '1' // Añadimos el ID del asesor asignado
        };
        
        setCliente(clienteData);
        
        // Obtener lista de asesores según el rol
        let asesoresData = [];
        if (currentUser) {
          if (['administrador', 'admin_sistema'].includes(currentUser.rol)) {
            // Los administradores pueden ver todos los asesores
            asesoresData = [
              { id: '1', nombre: 'Juan', apellido: 'Pérez' },
              { id: '2', nombre: 'María', apellido: 'López' },
              { id: '3', nombre: 'Carlos', apellido: 'González' },
              { id: '4', nombre: 'Ana', apellido: 'Martínez' }
            ];
          } else if (currentUser.rol === 'supervisor') {
            // Los supervisores ven solo los asesores que supervisan
            asesoresData = [
              { id: '1', nombre: 'Juan', apellido: 'Pérez' },
              { id: '2', nombre: 'María', apellido: 'López' }
            ];
          }
          // Los asesores no necesitan cargar la lista
        }
        
        setAsesores(asesoresData);
      } catch (error) {
        console.error('Error al obtener datos:', error);
        toast.error('Error al cargar los datos del cliente');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [clienteId]);
  
  const handleSuccess = () => {
    router.push(`/clientes/${clienteId}`);
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  if (!cliente) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-semibold text-gray-800">Cliente no encontrado</h2>
        <button
          onClick={() => router.push('/clientes')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          Volver a Clientes
        </button>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Editar Cliente</h2>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          Volver
        </button>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <ClienteForm
          cliente={cliente}
          usuario={usuario}
          asesores={asesores}
          onSuccess={handleSuccess}
          onCancel={() => router.back()}
        />
      </div>
    </div>
  );
}