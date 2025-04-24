'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { prestamosService } from '@/lib/supabase'; // Importa el servicio de préstamos
import PrestamoForm from '@/components/prestamos/prestamo-form';
import toast from 'react-hot-toast';
import { getCurrentUser } from '@/lib/auth';

export default function NuevoPrestamoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [usuario, setUsuario] = useState(null);
  const clienteId = searchParams.get('cliente'); // Obtener el id del cliente desde los parametros de busqueda
  useEffect(() => {
    const fetchUsuario = async () => {
      try {
       const currentUser = await getCurrentUser();
        setUsuario(currentUser);
      } catch (error) {
        console.error('Error al obtener el usuario:', error);
        toast.error('Error al obtener el usuario');
      }
    };

    fetchUsuario();
  }, []);

  const handleSuccess = async (prestamoData) => {
    try {
      // Agregar el id del usuario y el id del cliente al objeto del prestamo
        const prestamoToCreate = {
          ...prestamoData,
          created_by: usuario.id // id del usuario
        }

        console.log(prestamoToCreate);
       

        // Crear el nuevo préstamo en la base de datos
      const newPrestamo = await prestamosService.create(prestamoToCreate);

      // Mostrar mensaje de éxito
      toast.success('Préstamo creado con éxito!');

      // Redirigir al usuario a la página de préstamos
      router.push('/prestamos');
    } catch (error) {
      console.error('Error al crear el préstamo:', error);
      console.log(error)
      toast.error('Error al crear el préstamo');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Nuevo Préstamo</h2>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          Volver
        </button>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <PrestamoForm
          onSuccess={handleSuccess} // Pasa la función handleSuccess al componente PrestamoForm
          onCancel={() => router.back()}
        />
      </div>
    </div>
  );
}