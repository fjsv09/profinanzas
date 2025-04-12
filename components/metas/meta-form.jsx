'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function MetaForm({ meta, asesores, asesoresSinMeta, periodo, onSubmit, onCancel }) {
  const isEditing = !!meta;
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    asesor_id: meta?.asesor_id || '',
    meta_clientes: meta?.meta_clientes || 0,
    meta_cobranza: meta?.meta_cobranza || 0,
    meta_morosidad: meta?.meta_morosidad || 0,
    meta_cartera: meta?.meta_cartera || 0
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('meta_') && name !== 'meta_morosidad' ?
        parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.asesor_id) {
      toast.error('Debe seleccionar un asesor');
      return;
    }
    setIsSubmitting(true);
    try {
      // Validación básica
      if (formData.meta_clientes < 0 || formData.meta_cobranza < 0 ||
          formData.meta_morosidad < 0 || formData.meta_cartera < 0) {
        toast.error('Los valores de las metas no pueden ser negativos');
        setIsSubmitting(false);
        return;
      }
      await onSubmit(formData);
    } catch (error) {
      console.error('Error al guardar meta:', error);
      toast.error('Error al guardar la meta');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Lista de asesores disponibles
  const getAsesoresOptions = () => {
    if (isEditing) {
      // Si estamos editando, solo mostramos el asesor actual
      return asesores.filter(a => a.id === formData.asesor_id);
    } else {
      // Si estamos creando, mostramos los asesores sin meta
      return asesoresSinMeta();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="col-span-1 md:col-span-2">
          <label htmlFor="asesor_id" className="block text-sm font-medium text-gray-700 mb-1">
            Asesor
          </label>
          {!isEditing ? (
            <select
              id="asesor_id"
              name="asesor_id"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm
              focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={formData.asesor_id}
              onChange={handleChange}
              required
              disabled={isEditing}
            >
              <option value="">Seleccionar asesor</option>
              {getAsesoresOptions().map(asesor => (
                <option key={asesor.id} value={asesor.id}>
                  {asesor.nombre} {asesor.apellido}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm
              focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-gray-100"
              value={asesores.find(a => a.id === formData.asesor_id)?.nombre + ' ' +
                    asesores.find(a => a.id === formData.asesor_id)?.apellido}
              disabled
            />
          )}
          {isEditing && (
            <p className="mt-1 text-xs text-gray-500">
              No es posible cambiar el asesor para una meta existente
            </p>
          )}
        </div>

        <div>
          <label htmlFor="meta_clientes" className="block text-sm font-medium text-gray-700 mb-1">
            Meta de Clientes (cantidad)
          </label>
          <input
            id="meta_clientes"
            name="meta_clientes"
            type="number"
            min="0"
            step="1"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm
            focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={formData.meta_clientes}
            onChange={handleChange}
            required
          />
        </div>
        
        <div>
          <label htmlFor="meta_cobranza" className="block text-sm font-medium text-gray-700 mb-1">
            Meta de Cobranza (S/)
          </label>
          <input
            id="meta_cobranza"
            name="meta_cobranza"
            type="number"
            min="0"
            step="100"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm
            focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={formData.meta_cobranza}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label htmlFor="meta_morosidad" className="block text-sm font-medium text-gray-700 mb-1">
            Meta de Morosidad (%)
          </label>
          <input
            id="meta_morosidad"
            name="meta_morosidad"
            type="number"
            min="0"
            max="100"
            step="0.1"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm
            focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={formData.meta_morosidad}
            onChange={handleChange}
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            Porcentaje máximo de morosidad aceptable (menor es mejor)
          </p>
        </div>

        <div>
          <label htmlFor="meta_cartera" className="block text-sm font-medium text-gray-700 mb-1">
            Meta de Cartera (S/)
          </label>
          <input
            id="meta_cartera"
            name="meta_cartera"
            type="number"
            min="0"
            step="1000"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm
            focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={formData.meta_cartera}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200 mt-6">
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto mt-3 sm:mt-0 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto mb-3 sm:mb-0 px-4 py-2 bg-indigo-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {isSubmitting
              ? (isEditing ? 'Guardando...' : 'Guardando...')
              : (isEditing ? 'Guardar' : 'Guardar')
            }
          </button>
        </div>
      </div>
    </form>
  );
}