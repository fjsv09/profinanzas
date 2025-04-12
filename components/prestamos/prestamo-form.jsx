'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { prestamosService, clientesService } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import { MagnifyingGlassIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function PrestamoForm({ prestamoInicial, clienteId, onSuccess, onCancel }) {
  const isEditing = !!prestamoInicial;
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredClientes, setFilteredClientes] = useState([]);
  const [showClienteSelector, setShowClienteSelector] = useState(!clienteId && !prestamoInicial);
  const [calculatedCuotas, setCalculatedCuotas] = useState([]);
  
  const [formData, setFormData] = useState({
    monto: prestamoInicial?.monto || 1000,
    interes: prestamoInicial?.interes || 10,
    total_cuotas: prestamoInicial?.total_cuotas || 30,
    frecuencia_pago: prestamoInicial?.frecuencia_pago || 'diario'
  });

  // Obtener el usuario actual
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error al obtener el usuario actual:', error);
      }
    };
    
    fetchUser();
  }, []);

  useEffect(() => {
    // Cargar clientes
    const fetchClientes = async () => {
      try {
        // En un sistema real, estos datos vendrían de Supabase
        // Por ahora, usamos datos de ejemplo
        const clientesData = [
          { id: 1, nombre: 'María', apellido: 'López', dni: '45678912', telefono: '987654321' },
          { id: 2, nombre: 'Juan', apellido: 'Pérez', dni: '12345678', telefono: '987123456' },
          { id: 3, nombre: 'Ana', apellido: 'García', dni: '87654321', telefono: '987789123' },
          { id: 4, nombre: 'Carlos', apellido: 'Rodríguez', dni: '78912345', telefono: '987456789' },
          { id: 5, nombre: 'Lucía', apellido: 'Mendoza', dni: '56789123', telefono: '987321654' }
        ];
        
        setClientes(clientesData);
        setFilteredClientes(clientesData);
        
        // Si se proporciona un ID de cliente inicial o un préstamo, seleccionarlo automáticamente
        if (clienteId) {
          const clienteEncontrado = clientesData.find(c => c.id.toString() === clienteId.toString());
          if (clienteEncontrado) {
            setClienteSeleccionado(clienteEncontrado);
          }
        } else if (prestamoInicial && prestamoInicial.cliente) {
          setClienteSeleccionado(prestamoInicial.cliente);
        }
      } catch (error) {
        console.error('Error al obtener clientes:', error);
        toast.error('Error al cargar los clientes');
      }
    };

    fetchClientes();
  }, [clienteId, prestamoInicial]);

  useEffect(() => {
    // Calcular cuotas cada vez que cambien los parámetros relevantes
    calcularCuotas();
  }, [formData]);

  useEffect(() => {
    // Filtrar clientes basado en el término de búsqueda
    if (searchTerm.trim() === '') {
      setFilteredClientes(clientes);
    } else {
      const filtered = clientes.filter(
        cliente =>
          cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cliente.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cliente.dni.includes(searchTerm)
      );
      setFilteredClientes(filtered);
    }
  }, [searchTerm, clientes]);

  const calcularCuotas = () => {
    if (formData.monto <= 0 || formData.interes < 0 || formData.total_cuotas <= 0) return;

    const montoTotal = formData.monto * (1 + formData.interes / 100);
    const montoCuota = parseFloat((montoTotal / formData.total_cuotas).toFixed(2));
    const cuotasGeneradas = [];
    
    // Función para determinar el incremento de días según la frecuencia
    const incrementoDias = {
      'diario': 1,
      'semanal': 7,
      'quincenal': 15,
      'mensual': 30
    };
    
    const incremento = incrementoDias[formData.frecuencia_pago];
    const fechaActual = new Date();
    
    for (let i = 0; i < formData.total_cuotas; i++) {
      const fechaPago = new Date(fechaActual);
      fechaPago.setDate(fechaPago.getDate() + incremento * (i + 1));
      
      cuotasGeneradas.push({
        numero: i + 1,
        fecha: fechaPago.toLocaleDateString(),
        monto: montoCuota
      });
    }
    
    setCalculatedCuotas(cuotasGeneradas);
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const seleccionarCliente = (cliente) => {
    setClienteSeleccionado(cliente);
    setShowClienteSelector(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!clienteSeleccionado) {
      toast.error('Debe seleccionar un cliente');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Validar datos
      if (formData.monto <= 0 || formData.total_cuotas <= 0) {
        toast.error('Los valores deben ser mayores a cero');
        setIsSubmitting(false);
        return;
      }

      // Preparar datos del préstamo
      const montoTotal = formData.monto * (1 + formData.interes / 100);
      const prestamoData = {
        cliente_id: clienteSeleccionado.id,
        monto: formData.monto,
        interes: formData.interes,
        monto_total: parseFloat(montoTotal.toFixed(2)),
        frecuencia_pago: formData.frecuencia_pago,
        total_cuotas: formData.total_cuotas,
        cuotas_pagadas: prestamoInicial?.cuotas_pagadas || 0,
        // Nuevos campos para estado de aprobación
        estado: 'pendiente', // El estado inicial es pendiente en lugar de activo
        estado_aprobacion: 'pendiente',
        fecha_solicitud: new Date().toISOString(),
        tipo: isEditing || prestamoInicial ? 'renovacion' : 'nuevo',
        prestamo_anterior_id: prestamoInicial?.id || null, // Para renovaciones
        created_by: user?.id // ID del usuario que crea la solicitud
      };

      if (isEditing) {
        // Actualizar préstamo existente
        console.log('Actualizando préstamo:', { id: prestamoInicial.id, ...prestamoData });
        
        // En un sistema real, llamaríamos al servicio correspondiente
        // await prestamosService.update(prestamoInicial.id, prestamoData);
        
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulación de latencia
        toast.success('Préstamo actualizado con éxito. Pendiente de aprobación.');
      } else {
        // Crear nuevo préstamo
        console.log('Creando nuevo préstamo:', prestamoData);
        
        // En un sistema real, llamaríamos al servicio correspondiente
        // const nuevoPrestamo = await prestamosService.create(prestamoData);
        
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulación de latencia
        toast.success('Préstamo creado con éxito. Pendiente de aprobación.');
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/prestamos');
      }
    } catch (error) {
      console.error('Error al guardar préstamo:', error);
      toast.error('Error al guardar el préstamo');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {showClienteSelector ? (
        // Selector de cliente
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Seleccione un Cliente</h3>
          
          <div className="mb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 p-2.5"
                placeholder="Buscar por nombre o DNI..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-64 overflow-y-auto">
            {filteredClientes.map((cliente) => (
              <div 
                key={cliente.id}
                className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => seleccionarCliente(cliente)}
              >
                <div className="font-medium text-gray-900">{cliente.nombre} {cliente.apellido}</div>
                <div className="text-sm text-gray-500">DNI: {cliente.dni}</div>
                <div className="text-sm text-gray-500">Teléfono: {cliente.telefono}</div>
              </div>
            ))}
          </div>
          
          {filteredClientes.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              No se encontraron clientes con ese criterio
            </div>
          )}
        </div>
      ) : (
        // Información del cliente seleccionado
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Cliente</h3>
            {!isEditing && (
              <button
                onClick={() => setShowClienteSelector(true)}
                className="text-sm text-indigo-600 hover:text-indigo-900"
              >
                Cambiar cliente
              </button>
            )}
          </div>
          {clienteSeleccionado && (
            <div className="mt-3 p-4 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900">
                {clienteSeleccionado.nombre} {clienteSeleccionado.apellido}
              </p>
              <p className="text-sm text-gray-500">DNI: {clienteSeleccionado.dni}</p>
              <p className="text-sm text-gray-500">Teléfono: {clienteSeleccionado.telefono}</p>
            </div>
          )}
        </div>
      )}

      {/* Formulario de préstamo */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="monto" className="block text-sm font-medium text-gray-700 mb-1">
              Monto del préstamo (S/)
            </label>
            <input
              id="monto"
              name="monto"
              type="number"
              min="1"
              step="1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={formData.monto}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <label htmlFor="interes" className="block text-sm font-medium text-gray-700 mb-1">
              Interés (%)
            </label>
            <input
              id="interes"
              name="interes"
              type="number"
              min="0"
              step="0.1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={formData.interes}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <label htmlFor="frecuencia_pago" className="block text-sm font-medium text-gray-700 mb-1">
              Frecuencia de pago
            </label>
            <select
              id="frecuencia_pago"
              name="frecuencia_pago"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={formData.frecuencia_pago}
              onChange={handleInputChange}
              required
            >
              <option value="diario">Diario</option>
              <option value="semanal">Semanal</option>
              <option value="quincenal">Quincenal</option>
              <option value="mensual">Mensual</option>
            </select>
          </div>

          <div>
            <label htmlFor="total_cuotas" className="block text-sm font-medium text-gray-700 mb-1">
              Número de cuotas
            </label>
            <input
              id="total_cuotas"
              name="total_cuotas"
              type="number"
              min="1"
              step="1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={formData.total_cuotas}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        {/* Resumen del préstamo */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Resumen del Préstamo</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-500">Monto del préstamo</p>
              <p className="text-xl font-semibold text-gray-900">S/ {parseFloat(formData.monto).toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-500">Monto total a pagar</p>
              <p className="text-xl font-semibold text-gray-900">
                S/ {(parseFloat(formData.monto) * (1 + parseFloat(formData.interes) / 100)).toFixed(2)}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-500">Valor de cada cuota</p>
              <p className="text-xl font-semibold text-gray-900">
                S/ {calculatedCuotas.length > 0 ? calculatedCuotas[0].monto.toFixed(2) : '0.00'}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-500">Total de cuotas</p>
              <p className="text-xl font-semibold text-gray-900">{formData.total_cuotas}</p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Vista previa de cuotas</h4>
            {calculatedCuotas.length > 0 ? (
              <div className="border rounded-lg overflow-hidden bg-white">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        N°
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Monto
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {calculatedCuotas.slice(0, 5).map((cuota) => (
                      <tr key={cuota.numero}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          {cuota.numero}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                          {cuota.fecha}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                          S/ {cuota.monto.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {calculatedCuotas.length > 5 && (
                  <div className="px-4 py-2 text-center text-sm text-gray-500 border-t">
                    Y {calculatedCuotas.length - 5} cuotas más...
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                Configure los parámetros del préstamo para ver las cuotas.
              </div>
            )}
          </div>
        </div>

        {/* Mensaje informativo sobre aprobación */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <InformationCircleIcon className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Pendiente de aprobación</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Este préstamo necesitará ser aprobado por un administrador antes de ser activado.
                  Recibirás una notificación cuando sea revisado.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel || (() => router.back())}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !clienteSeleccionado}
            className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              !clienteSeleccionado ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
          >
            {isSubmitting
              ? (isEditing ? 'Enviando solicitud...' : 'Enviando solicitud...')
              : (isEditing ? 'Enviar para aprobación' : 'Enviar para aprobación')
            }
          </button>
        </div>
      </form>
    </div>
  );
}