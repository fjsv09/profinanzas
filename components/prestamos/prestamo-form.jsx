'use client';
import { useState, useEffect } from 'react';
import { clientesService } from '@/lib/supabase';
import {
  MagnifyingGlassIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { getCurrentUser } from '@/lib/auth';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const frecuenciaOptions = [
  { value: 'diario', label: 'Diario' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'quincenal', label: 'Quincenal' },
  { value: 'mensual', label: 'Mensual' },
];

const PrestamoForm = ({
  onSuccess,
  onCancel = () => router.back(),
  prestamo,
}) => {
  const router = useRouter();
  const [clientes, setClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showClienteSelector, setShowClienteSelector] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    monto: prestamo?.monto || '500',
    interes: prestamo?.interes || '20',
    frecuencia_pago: prestamo?.frecuencia_pago || 'diario',
    total_cuotas: prestamo?.total_cuotas || '24',
  });

  const [calculatedCuotas, setCalculatedCuotas] = useState([]);
  const [simpleInterest, setSimpleInterest] = useState(0);
  const submittingText = 'Enviando solicitud...';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

    useEffect(() => {
        const monto = parseFloat(formData.monto) || 0;
        const interes = parseFloat(formData.interes) || 0;
        setSimpleInterest(monto * (1 + interes / 100));
    }, [formData]);

  useEffect(() => {
    const calcularCuotas = () => {
      const monto = parseFloat(formData.monto) || 0;
      const interes = parseFloat(formData.interes) || 0;
      const totalCuotas = parseInt(formData.total_cuotas) || 0;

      if (monto > 0 && interes >= 0 && totalCuotas > 0) {
        const interesMensual = interes / 100;
        const montoTotal = monto * (1 + interesMensual);
        const montoCuota = montoTotal / totalCuotas;
        const cuotas = [];
        const fechaActual = new Date();

        for (let i = 1; i <= totalCuotas; i++) {
          const fechaCuota = new Date(fechaActual);
          fechaCuota.setDate(fechaActual.getDate() + i * 7); // Sumar 7 días por cuota semanal

          cuotas.push({
            numero: i,
            fecha: fechaCuota.toLocaleDateString(),
            monto: montoCuota,
          });
        }
        setCalculatedCuotas(cuotas);
      } else {
        setCalculatedCuotas([]);
      }
    };

    calcularCuotas();
  }, [formData]);

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          const clientesData = await clientesService.getAll(user);
          setClientes(clientesData);
        }
      } catch (error) {
        console.error('Error al obtener los clientes:', error);
        toast.error('Error al cargar los clientes');
      } finally {
        setLoading(false);
      }
    };
    fetchClientes();
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!clienteSeleccionado) {
      toast.error('Por favor, seleccione un cliente.');
      return;
    }

    if (
      !formData.monto ||
      !formData.interes ||
      !formData.frecuencia_pago ||
      !formData.total_cuotas
    ) {
      toast.error('Por favor, complete todos los campos.');
      return;
    }

    if (
      parseFloat(formData.monto) <= 0 ||
      parseFloat(formData.interes) < 0 ||
      parseInt(formData.total_cuotas) <= 0
    ) {
      toast.error('Por favor, ingrese valores válidos.');
      return;
    }

    setIsSubmitting(true);

    const prestamoData = {
      cliente_id: clienteSeleccionado.id,
      monto: parseFloat(formData.monto),
      interes: parseFloat(formData.interes),
      monto_total: simpleInterest,
      frecuencia_pago: formData.frecuencia_pago,
      total_cuotas: parseInt(formData.total_cuotas),
    };
    console.log(prestamoData);
    onSuccess(prestamoData);
  };

  const seleccionarCliente = (cliente) => {
    setClienteSeleccionado(cliente);
    setShowClienteSelector(false);
  };

  const filteredClientes = clientes.filter((cliente) => {
    const nombreCompleto = `${cliente.nombre} ${cliente.apellido}`.toLowerCase();
    const dni = cliente.dni.toLowerCase();
    const term = searchTerm.toLowerCase();
    return nombreCompleto.includes(term) || dni.includes(term);
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
      {showClienteSelector ? (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Seleccione un Cliente
          </h3>
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
                <div className="font-medium text-gray-900">
                  {cliente.nombre} {cliente.apellido}
                </div>
                <div className="text-sm text-gray-500">DNI: {cliente.dni}</div>
                <div className="text-sm text-gray-500">
                  Teléfono: {cliente.telefono}
                </div>
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
              <p className="text-sm text-gray-500">
                Teléfono: {clienteSeleccionado.telefono}
              </p>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label
              htmlFor="monto"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
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
            <label
              htmlFor="interes"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
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
            <label
              htmlFor="frecuencia_pago"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
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
              {frecuenciaOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="total_cuotas"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
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

        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Resumen del Préstamo
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-500">Monto del préstamo</p>
              <p className="text-xl font-semibold text-gray-900">
                S/ {parseFloat(formData.monto).toFixed(2)}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-500">Monto total a pagar</p>
              <p className="text-xl font-semibold text-gray-900">
                S/ {simpleInterest.toFixed(2)}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-500">Valor de cada cuota</p>
              <p className="text-xl font-semibold text-gray-900">
                S/ {calculatedCuotas.length > 0
                  ? calculatedCuotas[0].monto.toFixed(2)
                  : '0.00'}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-500">Total de cuotas</p>
              <p className="text-xl font-semibold text-gray-900">
                {formData.total_cuotas}
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Vista previa de cuotas
            </h4>
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

        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <InformationCircleIcon className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Pendiente de aprobación
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Este préstamo necesitará ser aprobado por un administrador
                  antes de ser activado. Recibirás una notificación cuando sea
                  revisado.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !clienteSeleccionado}
            className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              !clienteSeleccionado
                ? 'bg-indigo-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
          >
            {isSubmitting
              ? submittingText
              : isEditing
              ? 'Enviar para aprobación'
              : 'Enviar para aprobación'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PrestamoForm;