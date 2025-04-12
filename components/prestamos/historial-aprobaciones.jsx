'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { prestamosService } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import toast from 'react-hot-toast';
import { MagnifyingGlassIcon, EyeIcon } from '@heroicons/react/24/outline';

export default function HistorialAprobacionesPage() {
  const [user, setUser] = useState(null);
  const [aprobaciones, setAprobaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchUserAndData = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.push('/login');
          return;
        }

        // Verificar que el usuario sea administrador
        if (currentUser.rol !== 'administrador' && currentUser.rol !== 'admin_sistema') {
          toast.error('No tienes permisos para acceder a esta sección');
          router.push('/dashboard');
          return;
        }

        setUser(currentUser);
        await cargarHistorialAprobaciones();
      } catch (error) {
        console.error('Error al obtener datos:', error);
        toast.error('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndData();
  }, [router]);

  const cargarHistorialAprobaciones = async () => {
    try {
      setLoading(true);
      
      // En un sistema real, esta sería una llamada a la API
      // const data = await prestamosService.getHistorialAprobaciones();
      
      // Datos de ejemplo para simulación
      const historialData = [
        {
          id: 205,
          cliente: { id: 1, nombre: 'María', apellido: 'López', dni: '45678912' },
          monto: 1500,
          interes: 10,
          monto_total: 1650,
          estado_aprobacion: 'aprobado',
          fecha_solicitud: '2025-03-10T10:30:00',
          fecha_aprobacion: '2025-03-10T14:45:00',
          aprobado_por: { id: 6, nombre: 'Lucia', apellido: 'Ramírez' },
          tipo: 'nuevo'
        },
        {
          id: 204,
          cliente: { id: 2, nombre: 'Juan', apellido: 'Pérez', dni: '12345678' },
          monto: 2000,
          interes: 12,
          monto_total: 2240,
          estado_aprobacion: 'rechazado',
          fecha_solicitud: '2025-03-08T14:45:00',
          fecha_aprobacion: '2025-03-09T09:15:00',
          aprobado_por: { id: 6, nombre: 'Lucia', apellido: 'Ramírez' },
          comentarios_aprobacion: 'Cliente con alto riesgo de morosidad',
          tipo: 'renovacion'
        },
        {
          id: 203,
          cliente: { id: 3, nombre: 'Ana', apellido: 'García', dni: '87654321' },
          monto: 1200,
          interes: 10,
          monto_total: 1320,
          estado_aprobacion: 'aprobado',
          fecha_solicitud: '2025-03-05T09:30:00',
          fecha_aprobacion: '2025-03-05T11:20:00',
          aprobado_por: { id: 6, nombre: 'Lucia', apellido: 'Ramírez' },
          tipo: 'nuevo'
        }
      ];
      
      setAprobaciones(historialData);
    } catch (error) {
      console.error('Error al cargar historial de aprobaciones:', error);
      toast.error('Error al cargar el historial');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar aprobaciones según filtro y término de búsqueda
  const aprobacionesFiltradas = aprobaciones
    .filter(item => {
      if (filtro === 'todos') return true;
      return item.estado_aprobacion === filtro;
    })
    .filter(item => {
      if (!searchTerm.trim()) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        item.cliente.nombre.toLowerCase().includes(searchLower) ||
        item.cliente.apellido.toLowerCase().includes(searchLower) ||
        item.cliente.dni.includes(searchTerm) ||
        item.id.toString().includes(searchTerm)
      );
    });

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
        <h2 className="text-xl font-semibold text-gray-800">Historial de Aprobaciones</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => router.push('/prestamos/aprobaciones')}
            className="px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
          >
            Aprobaciones pendientes
          </button>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
      
      {/* Filtros y búsqueda */}
      <div className="mb-4 flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
        <div className="md:w-48">
          <select
            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          >
            <option value="todos">Todos los estados</option>
            <option value="aprobado">Aprobados</option>
            <option value="rechazado">Rechazados</option>
          </select>
        </div>
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 p-2.5"
            placeholder="Buscar por cliente o ID de préstamo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {/* Tabla de historial */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Solicitado
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resolución
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revisado por
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {aprobacionesFiltradas.length > 0 ? (
                aprobacionesFiltradas.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      #{item.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {item.cliente.nombre} {item.cliente.apellido}
                      </div>
                      <div className="text-xs text-gray-500">
                        DNI: {item.cliente.dni}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      S/ {item.monto.toFixed(2)}
                      <div className="text-xs text-gray-500">
                        {item.tipo === 'nuevo' ? 'Nuevo préstamo' : 'Renovación'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(item.fecha_solicitud).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        item.estado_aprobacion === 'aprobado' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {item.estado_aprobacion === 'aprobado' ? 'Aprobado' : 'Rechazado'}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(item.fecha_aprobacion).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.aprobado_por.nombre} {item.aprobado_por.apellido}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                      <button
                        onClick={() => router.push(`/prestamos/${item.id}`)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <EyeIcon className="h-5 w-5 inline" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                    No se encontraron registros
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}