'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { clientesService, usuariosService } from '@/lib/supabase'; // Importa los servicios de Supabase
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
        setLoading(true);
        // Obtener usuario actual
        const currentUser = await getCurrentUser();
        setUsuario(currentUser);

        // Obtener datos del cliente desde Supabase
        const clienteData = await clientesService.getById(clienteId);
        setCliente(clienteData);

        // Obtener lista de asesores según el rol desde Supabase
        let asesoresData = [];
        if (currentUser) {
          if (['administrador', 'admin_sistema'].includes(currentUser.rol)) {
            // Los administradores pueden ver todos los usuarios con rol asesor
            const allUsers = await usuariosService.getAll();
            asesoresData = allUsers.filter(user => user.rol === 'asesor').map(asesor => ({
                id: asesor.id,
                nombre: asesor.nombre,
                apellido: asesor.apellido,
            }));
          } 
          // Los asesores no necesitan cargar la lista y los supervisores no pueden ver porque no pueden editar
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
