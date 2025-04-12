// En app/(dashboard)/clientes/page.jsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { clientesService } from '@/lib/supabase';
import { PlusIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import ClientesTable from '@/components/clientes/clientes-table';
import { getCurrentUser } from '@/lib/auth';

export default function ClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchClientesYUsuario = async () => {
      try {
        // Obtener el usuario actual
        const currentUser = await getCurrentUser();
        setUsuario(currentUser);

        // En un sistema real, estos datos vendrían de Supabase con filtros basados en el rol
        // Por ahora, simulamos los datos y el filtrado
        let clientesData = [
          { id: 1, nombre: 'María', apellido: 'López', dni: '45678912', telefono: '987654321', direccion: 'Av. Los Pinos 123', created_at: '2025-02-15T10:30:00', asesor_id: '843515ad-da66-4c94-98c5-b6e89a53e6a0' },
          { id: 2, nombre: 'Juan', apellido: 'Pérez', dni: '12345678', telefono: '987123456', direccion: 'Jr. Las Flores 456', created_at: '2025-03-01T14:20:00', asesor_id: '2' },
          { id: 3, nombre: 'Ana', apellido: 'García', dni: '87654321', telefono: '987789123', direccion: 'Calle Los Alamos 789', created_at: '2025-03-05T16:45:00', asesor_id: '3' },
          { id: 4, nombre: 'Carlos', apellido: 'Rodríguez', dni: '78912345', telefono: '987456789', direccion: 'Av. La Marina 234', created_at: '2025-03-10T09:15:00', asesor_id: '4' },
          { id: 5, nombre: 'Lucía', apellido: 'Mendoza', dni: '56789123', telefono: '987321654', direccion: 'Jr. Huallaga 567', created_at: '2025-03-12T11:30:00', asesor_id: '843515ad-da66-4c94-98c5-b6e89a53e6a0' }
        ];

        // Filtrar según el rol del usuario (simulación del filtrado de la base de datos)
        if (currentUser) {
          if (currentUser.rol === 'asesor') {
            // El asesor solo ve sus clientes
            clientesData = clientesData.filter(cliente => cliente.asesor_id === currentUser.id);
          } else if (currentUser.rol === 'supervisor') {
            // Simulamos que el supervisor 1 supervisa a los asesores 1 y 2
            const asesoresSupervisa = currentUser.id === 'a9ce19f1-1ce0-4d78-a657-fd92eae4bfef' ? ['843515ad-da66-4c94-98c5-b6e89a53e6a0', '2'] : 
                                     currentUser.id === '2' ? ['3', '4'] : [];
            clientesData = clientesData.filter(cliente => asesoresSupervisa.includes(cliente.asesor_id));
          }
          // Los administradores ven todos los clientes
        }

        setClientes(clientesData);
      } catch (error) {
        console.error('Error al obtener clientes:', error);
        toast.error('Error al cargar los clientes');
      } finally {
        setLoading(false);
      }
    };

    fetchClientesYUsuario();
  }, [router]);

  const handleDelete = async (id) => {
    if (confirm('¿Está seguro que desea eliminar este cliente?')) {
      try {
        // En un sistema real, esto llamaría a clientesService.delete(id)
        // Por ahora, simplemente actualizamos el estado
        setClientes(clientes.filter(cliente => cliente.id !== id));
        toast.success('Cliente eliminado con éxito');
      } catch (error) {
        console.error('Error al eliminar cliente:', error);
        toast.error('Error al eliminar el cliente');
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

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 sm:mb-0">Gestión de Clientes</h2>
        {/* Solo mostrar botón de nuevo cliente a asesores, supervisores y administradores */}
        {usuario && ['asesor', 'supervisor', 'administrador'].includes(usuario.rol) && (
          <button
            onClick={() => router.push('/clientes/nuevo')}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nuevo Cliente
          </button>
        )}
      </div>
      {/* Componente de tabla de clientes */}
      <ClientesTable
        clientes={clientes}
        onDelete={handleDelete}
        usuario={usuario}
      />
    </div>
  );
}