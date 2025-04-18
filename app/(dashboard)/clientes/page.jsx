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
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchClientesYUsuario = async () => {
      setLoading(true);
      setError(null);
      try {
        // Obtener el usuario actual
        const currentUser = await getCurrentUser();
        setUsuario(currentUser);

        // Obtener los clientes filtrados por rol
        if (currentUser) {
          const clientesData = await clientesService.getAll(currentUser);
          setClientes(clientesData);
        }
      } catch (err) {
        setError(err);
        console.error('Error al obtener clientes:', err);
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
        setLoading(true);
        // Eliminar el cliente de Supabase
        await clientesService.delete(id);
        // Actualizar el estado local (eliminar el cliente de la lista)
        setClientes(clientes.filter(cliente => cliente.id !== id));
        toast.success('Cliente eliminado con éxito');
      } catch (err) {
        console.error('Error al eliminar cliente:', err);
        toast.error('Error al eliminar el cliente');
      } finally {
        setLoading(false);
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
  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Error: {error.message}</p>
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
