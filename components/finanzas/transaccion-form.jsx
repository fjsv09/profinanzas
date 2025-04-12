'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';

/**
 * Componente para registrar transacciones financieras (ingresos y egresos)
 * @param {Object} props - Propiedades del componente
 * @param {Function} props.onSubmit - Función a ejecutar cuando se envía el formulario
 * @param {Function} props.onCancel - Función a ejecutar cuando se cancela el formulario
 * @param {Object} props.initialData - Datos iniciales para el formulario (en caso de edición)
 */
export default function TransaccionForm({ onSubmit, onCancel, initialData = null }) {
  const isEditing = !!initialData;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    tipo: initialData?.tipo || 'ingreso',
    monto: initialData?.monto || '',
    categoria: initialData?.categoria || '',
    descripcion: initialData?.descripcion || '',
    cuenta: initialData?.cuenta || 'caja'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.monto || !formData.categoria) {
      toast.error('Por favor complete todos los campos obligatorios');
      return;
    }

    if (parseFloat(formData.monto) <= 0) {
      toast.error('El monto debe ser mayor a cero');
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepara los datos para enviar
      const transaccionData = {
        ...formData,
        monto: parseFloat(formData.monto),
        fecha: new Date().toISOString()
      };

      // Llama a la función onSubmit proporcionada por el componente padre
      await onSubmit(transaccionData);
      
      // Resetear el formulario después de un envío exitoso (si no estamos editando)
      if (!isEditing) {
        setFormData({
          tipo: 'ingreso',
          monto: '',
          categoria: '',
          descripcion: '',
          cuenta: 'caja'
        });
      }
    } catch (error) {
      console.error('Error al registrar transacción:', error);
      toast.error('Error al registrar la transacción');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tipo de Transacción
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              formData.tipo === 'ingreso'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setFormData(prev => ({ ...prev, tipo: 'ingreso' }))}
          >
            Ingreso
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              formData.tipo === 'egreso'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setFormData(prev => ({ ...prev, tipo: 'egreso' }))}
          >
            Egreso
          </button>
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="monto" className="block text-sm font-medium text-gray-700 mb-1">
          Monto (S/)
        </label>
        <input
          id="monto"
          name="monto"
          type="number"
          step="0.01"
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          value={formData.monto}
          onChange={handleInputChange}
        />
      </div>

      <div className="mb-4">
        <label htmlFor="categoria" className="block text-sm font-medium text-gray-700 mb-1">
          Categoría
        </label>
        <select
          id="categoria"
          name="categoria"
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          value={formData.categoria}
          onChange={handleInputChange}
        >
          <option value="">Seleccionar categoría</option>
          {formData.tipo === 'ingreso' ? (
            <>
              <option value="Cobranza">Cobranza</option>
              <option value="Préstamo Nuevo">Préstamo Nuevo</option>
              <option value="Renovación">Renovación</option>
              <option value="Otros Ingresos">Otros Ingresos</option>
            </>
          ) : (
            <>
              <option value="Gastos Operativos">Gastos Operativos</option>
              <option value="Salarios">Salarios</option>
              <option value="Transporte">Transporte</option>
              <option value="Capital para Préstamos">Capital para Préstamos</option>
              <option value="Otros Egresos">Otros Egresos</option>
            </>
          )}
        </select>
      </div>

      <div className="mb-4">
        <label htmlFor="cuenta" className="block text-sm font-medium text-gray-700 mb-1">
          Cuenta
        </label>
        <select
          id="cuenta"
          name="cuenta"
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          value={formData.cuenta}
          onChange={handleInputChange}
        >
          <option value="caja">Caja</option>
          <option value="yape">Yape</option>
          <option value="banco">Banco</option>
          <option value="otro">Otro</option>
        </select>
      </div>

      <div className="mb-4">
        <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">
          Descripción
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          rows="2"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          value={formData.descripcion}
          onChange={handleInputChange}
        ></textarea>
      </div>

      <div className="flex justify-end space-x-3 mt-6">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            formData.tipo === 'ingreso'
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-red-600 hover:bg-red-700'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
        >
          {isSubmitting ? 'Registrando...' : isEditing ? 'Actualizar Transacción' : 'Registrar Transacción'}
        </button>
      </div>
    </form>
  );
}