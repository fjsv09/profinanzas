'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { clientesService, prestamosService, usuariosService, supabase } from '@/lib/supabase';
import { PencilSquareIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { getCurrentUser } from '@/lib/auth';
import toast from 'react-hot-toast';
import ClienteCard from '@/components/clientes/cliente-card';

export default function ClienteDetallePage() {
  const { id } = useParams(); // Accede a 'id' directamente desde el objeto devuelto por useParams()
  const [cliente, setCliente] = useState(null);
    const [asesor, setAsesor] = useState(null);
  const [prestamos, setPrestamos] = useState([]);
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchClienteData = async () => {
      try {
        setLoading(true);
        // Obtener el usuario actual
        const currentUser = await getCurrentUser();
        setUsuario(currentUser);

        // Obtener datos del cliente y los prestamos desde Supabase
        const clienteData = await clientesService.getById(id);
        setCliente(clienteData);

        const asesorData = await usuariosService.getById(clienteData.asesor_id);
        setAsesor(asesorData);

        // Obtener préstamos del cliente desde Supabase
        const prestamosData = await prestamosService.getByCliente(id);
        setPrestamos(prestamosData);
      } catch (error) {
        console.error('Error al obtener datos del cliente:', error);
        toast.error('Error al cargar los datos del cliente');
      } finally {
        setLoading(false);
      }
    };

    fetchClienteData();
  }, [id]);

  // Verificación de acceso al cliente
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const currentUser = await getCurrentUser();

        // Verificar si el usuario tiene acceso a este cliente específico
        if (currentUser.rol === 'asesor') {
          // Verificar si el cliente pertenece a este asesor
          if (cliente && cliente.asesor_id !== currentUser.id) {
            toast.error('No tienes permiso para ver este cliente Asesor');
            router.push('/clientes');
            return;
          }
        } else if (currentUser.rol === 'supervisor') {
          // Obtener los IDs de los asesores que supervisa
          const { data: asesores, error: errorAsesores } = await supabase
            .from('usuarios')
            .select('id')
            .eq('supervisor_id', currentUser.id);
          
          if (errorAsesores) {
            throw errorAsesores;
          }

          // Verificar si el cliente pertenece a un asesor supervisado
          const asesorIds = asesores?.map(asesor => asesor.id) || [];
          if (cliente && !asesorIds.includes(cliente.asesor_id)) {
            toast.error('No tienes permiso para ver este cliente Supervisor');
            router.push('/clientes');
            return;
          }
        }
        // Los administradores pueden ver todos los clientes
      } catch (error) {
        console.error('Error al verificar permisos:', error);
        toast.error('Error al verificar permisos');
      }
    };

    if (cliente) {
      checkAccess();
    }
  }, [cliente, router]);

   const getEstadoPrestamo = (prestamo) => {
    // Obtener el monto total de cuotas pagada
    const totalPagado = prestamo.detalles_pago.reduce(
      (sum, detalle) => sum + detalle.monto_aplicado,
      0
    );
  
    // Calcular el monto restante por pagar
    const montoRestante = prestamo.monto_total - totalPagado;
  
    // Determinar el estado del préstamo
    if (montoRestante <= 0) {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
          Completado
        </span>
      );
    } else if (prestamo.estado === 'atrasado') {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
          Atrasado
        </span>
      );
    } else {
      return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Activo</span>;
    }
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
        <h2 className="text-xl font-semibold text-gray-800">Detalles del Cliente</h2>
        <div className="space-x-2">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Volver
          </button>
          {usuario && (usuario.rol === 'admin_sistema' || usuario.rol === 'administrador') && (
            <button
              onClick={() => router.push(`/clientes/${id}/editar`)}
              className="px-4 py-2 text-sm text-white bg-yellow-500 rounded-md hover:bg-yellow-600 transition-colors"
            >
              <PencilSquareIcon className="h-4 w-4 inline mr-1" />
              Editar
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información del cliente */}
        <div className="lg:col-span-1">
          <ClienteCard cliente={cliente} showActions={false} />
          {usuario && usuario.rol !== 'asesor' && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Asesor asignado</h3>
              <p className="text-sm text-gray-900"> <span className="font-medium">Nombre:</span>{' '}

                {asesor ? `${asesor.nombre} ${asesor.apellido}` : "No asignado"}
                
                </p>
            </div>
          )}
        </div>

        {/* Préstamos del cliente */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="flex justify-between items-center px-6 py-5 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Préstamos</h3>
              <button
                onClick={() => router.push(`/prestamos/nuevo?cliente=${id}`)}
                className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
              >
                <CurrencyDollarIcon className="h-4 w-4 inline mr-1" />
                Nuevo Préstamo
              </button>
            </div>

            <div className="overflow-x-auto">
              {prestamos.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Monto
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Frecuencia
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Progreso
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {prestamos.map((prestamo) => (
                      <tr key={prestamo.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          #{prestamo.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          S/ {prestamo.monto.toFixed(2)}
                          <div className="text-xs text-gray-500">
                            Total: S/ {prestamo.monto_total.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                          {prestamo.frecuencia_pago}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <span className="mr-2">
                                {prestamo.detalles_pago.reduce((sum, detalle) => sum + detalle.monto_aplicado, 0)} / {prestamo.monto_total}
                             </span>
                            <div className="w-24 bg-gray-200 rounded-full h-2.5">
                              <div
                                className="bg-indigo-600 h-2.5 rounded-full"
                                style={{ width: `${(prestamo.detalles_pago.reduce((sum, detalle) => sum + detalle.monto_aplicado, 0) / prestamo.monto_total) * 100}%` }}
                              ></div>

                           </div>
                           
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {getEstadoPrestamo(prestamo)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => router.push(`/prestamos/${prestamo.id}`)}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                          >
                            Ver
                          </button>
                          {prestamo.estado === 'activo' && (
                            <button
                              onClick={() => router.push(`/cobranzas/nuevo?prestamo=${prestamo.id}`)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Registrar pago
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  <p>Este cliente no tiene préstamos registrados</p>
                  <button
                    onClick={() => router.push(`/prestamos/nuevo?cliente=${id}`)}
                    className="mt-2 text-indigo-600 hover:text-indigo-900"
                  >
                    Crear un préstamo
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Actividad reciente - Este sería un componente adicional en un sistema real */}
          <div className="mt-6 bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Actividad Reciente</h3>
            </div>
            <div className="divide-y divide-gray-200">
              <div className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Pago de cuota realizado</p>
                    <p className="text-sm text-gray-500">Préstamo #101 - S/ 36.70</p>
                  </div>
                  <p className="text-sm text-gray-500">Hoy</p>
                </div>
              </div>
              <div className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Préstamo creado</p>
                    <p className="text-sm text-gray-500">Préstamo #101 - S/ 1,000.00</p>
                  </div>
                  <p className="text-sm text-gray-500">01/03/2025</p>
                </div>
              </div>
              <div className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Préstamo completado</p>
                    <p className="text-sm text-gray-500">Préstamo #102 - S/ 500.00</p>
                  </div>
                  <p className="text-sm text-gray-500">15/02/2025</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

