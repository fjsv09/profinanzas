'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { prestamosService } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import { PlusIcon, CalculatorIcon } from '@heroicons/react/24/outline';
import PrestamosTable from '@/components/prestamos/prestamos-table';
import toast from 'react-hot-toast';

export default function PrestamosPage() {
  const [prestamos, setPrestamos] = useState([]);
  const [filteredPrestamos, setFilteredPrestamos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchPrestamosYUsuario = async () => {
      try {
        // Obtener el usuario actual
        const currentUser = await getCurrentUser();
        setUsuario(currentUser);

        // En un sistema real, estos datos vendrían filtrados de Supabase
        const prestamosData = [
          {
            id: 101,
            cliente: { 
              id: 1, 
              nombre: 'María', 
              apellido: 'López', 
              dni: '45678912',
              asesor_id: '843515ad-da66-4c94-98c5-b6e89a53e6a0' 
            },
            monto: 1000,
            interes: 10,
            monto_total: 1100,
            frecuencia_pago: 'diario',
            total_cuotas: 30,
            cuotas_pagadas: 15,
            estado: 'activo',
            created_at: '2025-03-01T14:30:00'
          },
          {
            id: 102,
            cliente: { 
              id: 1, 
              nombre: 'María', 
              apellido: 'López 2', 
              dni: '45678912',
              asesor_id: '843515ad-da66-4c94-98c5-b6e89a53e6a0' 
            },
            monto: 500,
            interes: 10,
            monto_total: 550,
            frecuencia_pago: 'semanal',
            total_cuotas: 8,
            cuotas_pagadas: 8,
            estado: 'completado',
            created_at: '2025-01-15T09:45:00'
          },
          {
            id: 103,
            cliente: { 
              id: 2, 
              nombre: 'Juan', 
              apellido: 'Pérez', 
              dni: '12345678',
              asesor_id: '2' 
            },
            monto: 2000,
            interes: 15,
            monto_total: 2300,
            frecuencia_pago: 'quincenal',
            total_cuotas: 10,
            cuotas_pagadas: 3,
            estado: 'activo',
            created_at: '2025-02-20T11:15:00'
          },
          {
            id: 104,
            cliente: { 
              id: 3, 
              nombre: 'Ana', 
              apellido: 'García', 
              dni: '87654321',
              asesor_id: '3' 
            },
            monto: 1500,
            interes: 12,
            monto_total: 1680,
            frecuencia_pago: 'mensual',
            total_cuotas: 6,
            cuotas_pagadas: 2,
            estado: 'activo',
            created_at: '2025-02-10T16:30:00'
          },
          {
            id: 105,
            cliente: { 
              id: 4, 
              nombre: 'Carlos', 
              apellido: 'Rodríguez', 
              dni: '78912345',
              asesor_id: '4' 
            },
            monto: 800,
            interes: 10,
            monto_total: 880,
            frecuencia_pago: 'diario',
            total_cuotas: 20,
            cuotas_pagadas: 5,
            estado: 'atrasado',
            created_at: '2025-03-05T10:00:00'
          }
        ];

        // Filtrar según el rol del usuario
        let filteredPrestamos = [...prestamosData];
        
        if (currentUser) {
          if (currentUser.rol === 'asesor') {
            // El asesor solo ve préstamos de sus clientes
            filteredPrestamos = prestamosData.filter(
              prestamo => prestamo.cliente.asesor_id === currentUser.id
            );
          } else if (currentUser.rol === 'supervisor') {
            // Simulamos asesores supervisados
            // En un sistema real, esto vendría de la base de datos
            const asesoresSupervisa = 
              currentUser.id === 'a9ce19f1-1ce0-4d78-a657-fd92eae4bfef' ? ['843515ad-da66-4c94-98c5-b6e89a53e6a0', '2'] : 
              currentUser.id === '2' ? ['3', '4'] : [];
            
            filteredPrestamos = prestamosData.filter(
              prestamo => asesoresSupervisa.includes(prestamo.cliente.asesor_id)
            );
          }
          // Administradores ven todos los préstamos
        }

        setPrestamos(filteredPrestamos);
        setFilteredPrestamos(filteredPrestamos);
      } catch (error) {
        console.error('Error al obtener préstamos:', error);
        toast.error('Error al cargar los préstamos');
      } finally {
        setLoading(false);
      }
    };

    fetchPrestamosYUsuario();
  }, [router]);

  useEffect(() => {
    // Filtrar préstamos según el término de búsqueda y el filtro de estado
    let filtrados = prestamos;
    
    // Aplicar filtro de estado
    if (filtroEstado !== 'todos') {
      filtrados = filtrados.filter(prestamo => prestamo.estado === filtroEstado);
    }
    
    // Aplicar término de búsqueda
    if (searchTerm.trim() !== '') {
      filtrados = filtrados.filter(
        prestamo =>
          prestamo.cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          prestamo.cliente.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
          prestamo.cliente.dni.includes(searchTerm) ||
          prestamo.id.toString().includes(searchTerm)
      );
    }
    
    setFilteredPrestamos(filtrados);
  }, [searchTerm, filtroEstado, prestamos]);

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleFiltroEstadoChange = (estado) => {
    setFiltroEstado(estado);
  };

  // Nueva función para manejar la eliminación de préstamos
  const handleDelete = async (prestamoId) => {
    if (confirm('¿Está seguro que desea eliminar este préstamo?')) {
      try {
        // En un sistema real, esto eliminaría el préstamo
        // await prestamosService.delete(prestamoId);

        // Actualizar estado local para reflejar la eliminación
        const updatedPrestamos = prestamos.filter(p => p.id !== prestamoId);
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
        <h2 className="text-xl font-semibold text-gray-800 mb-4 sm:mb-0">Gestión de Préstamos</h2>
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
      
      {/* Mostrar la tabla de préstamos con función de eliminación */}
      <PrestamosTable
        prestamos={filteredPrestamos}
        onSearch={handleSearch}
        filtroEstado={filtroEstado}
        onFiltroEstadoChange={handleFiltroEstadoChange}
        onDelete={handleDelete}
        usuario={usuario}
      />
      
      {/* Información adicional */}
      {filteredPrestamos.length > 0 && (
        <div className="mt-4 text-sm text-gray-500">
          Mostrando {filteredPrestamos.length} de {prestamos.length} préstamos.
        </div>
      )}
    </div>
  );
}