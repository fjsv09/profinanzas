'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { prestamosService } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import { PlusIcon, CalculatorIcon } from '@heroicons/react/24/outline';
import PrestamosTable from '@/components/prestamos/prestamos-table';
import toast from 'react-hot-toast';

export default function PrestamosPage() {
  const [prestamos, setPrestamos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchPrestamosYUsuario = async () => {
    try {
        const currentUser = await getCurrentUser();
        setUsuario(currentUser);
        const prestamosData = await prestamosService.getAll(currentUser); //se envia el usuario como parametro
        setPrestamos(prestamosData);
    } catch (error) {
        console.error('Error al obtener préstamos:', error);
        toast.error('Error al cargar los préstamos');
    } finally {
        setLoading(false);
    }
    };

    fetchPrestamosYUsuario();
}, []);

  // Función para calcular el estado de un préstamo
  const getEstadoPrestamo = (prestamo) => {
    // Verificar si detalles_pago existe antes de usar reduce
    const totalPagado = prestamo.detalles_pago
      ? prestamo.detalles_pago.reduce(
          (sum, detalle) => sum + detalle.monto_aplicado,
          0
        )
      : 0;

    const montoRestante = prestamo.monto_total - totalPagado;

    if (montoRestante <= 0) {
      return 'completado';
    } else if (prestamo.estado === 'atrasado') {
      return 'atrasado';
    } else if (prestamo.estado === 'activo') {
      return 'activo';
    } else {
      return 'pendiente';
    }
  };

  // Filtrar y ordenar los préstamos con useMemo
  const filteredPrestamos = useMemo(() => {
    let filtrados = prestamos.map((prestamo) => ({
      ...prestamo,
      estadoCalculado: getEstadoPrestamo(prestamo),
    })); // Calcular el estado del préstamo

    // Aplicar filtro de estado
    if (filtroEstado !== 'todos') {
      filtrados = filtrados.filter(
        (prestamo) => prestamo.estadoCalculado === filtroEstado
      );
    }

    // Aplicar término de búsqueda
    if (searchTerm.trim() !== '') {
      filtrados = filtrados.filter((prestamo) =>
        (prestamo.clientes.nombre + ' ' + prestamo.clientes.apellido)
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        prestamo.clientes.dni.includes(searchTerm) ||
        prestamo.id.toString().includes(searchTerm)
      );
    }

    return filtrados;
  }, [searchTerm, filtroEstado, prestamos]);

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleFiltroEstadoChange = (estado) => {
    setFiltroEstado(estado);
  };

  const handleDelete = async (prestamoId) => {
    if (confirm('¿Está seguro que desea eliminar este préstamo?')) {
      try {
        // En un sistema real, esto eliminaría el préstamo
        // await prestamosService.delete(prestamoId);

        // Actualizar estado local para reflejar la eliminación
        const updatedPrestamos = prestamos.filter(
          (p) => p.id !== prestamoId
        );
        setPrestamos(updatedPrestamos);
        toast.success('Préstamo eliminado con éxito');
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

  return (
    <div className="grid grid-cols-1">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 sm:mb-0">
          Gestión de Préstamos
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => router.push('/prestamos/simulador')}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors flex items-center"
          >
            <CalculatorIcon className="h-5 w-5 mr-2" />
            Simulador
          </button>
          <button
            onClick={() => router.push('/prestamos/nuevo')}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nuevo Préstamo
          </button>
        </div>
      </div>

      <PrestamosTable
        prestamos={filteredPrestamos}
        onSearch={handleSearch}
        filtroEstado={filtroEstado}
        onFiltroEstadoChange={handleFiltroEstadoChange}
        onDelete={handleDelete}
        usuario={usuario}
      />

      {filteredPrestamos.length > 0 && (
        <div className="mt-4 text-sm text-gray-500">
          Mostrando {filteredPrestamos.length} de {prestamos.length} préstamos.
        </div>
      )}
    </div>
  );
}
