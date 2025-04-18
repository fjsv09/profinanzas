'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { clientesService } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function ClienteForm({ cliente, usuario, asesores = [], onSuccess, onCancel }) {
  const isEditing = !!cliente;
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    dni: cliente?.dni || '',
    nombre: cliente?.nombre || '',
    apellido: cliente?.apellido || '',
    telefono: cliente?.telefono || '',
    direccion: cliente?.direccion || '',
    referencias: cliente?.referencias || '',
    asesor_id: cliente?.asesor_id || (usuario?.rol === 'asesor' ? usuario.id : '')
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validación básica
      if (!formData.dni || !formData.nombre || !formData.apellido || !formData.telefono || !formData.direccion) {
        toast.error('Por favor complete todos los campos obligatorios');
        return;
      }

      // Validación de DNI (8 dígitos)
      if (!/^\d{8}$/.test(formData.dni)) {
        toast.error('El DNI debe tener 8 dígitos numéricos');
        return;
      }

      // Validación de teléfono (9 dígitos)
      if (!/^\d{9}$/.test(formData.telefono)) {
        toast.error('El teléfono debe tener 9 dígitos numéricos');
        return;
      }

      // Validar que se haya seleccionado un asesor
      if (!formData.asesor_id) {
        toast.error('Por favor asigne un asesor al cliente');
        return;
      }

      const clienteData = {
        ...formData,
        created_by: usuario.id,
      }

      if (isEditing) {
        // Actualizar cliente existente
        await clientesService.update(cliente.id, clienteData);
        toast.success('Cliente actualizado con éxito');
      } else {
        // Crear nuevo cliente
        await clientesService.create(clienteData);
        toast.success('Cliente creado con éxito');
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/clientes');
      }
    } catch (error) {
      console.error('Error al guardar cliente:', error);
      toast.error('Ha ocurrido un error al guardar el cliente');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="dni" className="block text-sm font-medium text-gray-700 mb-1">
            DNI <span className="text-red-500">*</span>
          </label>
          <input
            id="dni"
            name="dni"
            type="text"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={formData.dni}
            onChange={handleChange}
            disabled={isEditing} // El DNI no se debe modificar una vez creado
            required
          />
          {isEditing && (
            <p className="mt-1 text-xs text-gray-500">El DNI no se puede modificar</p>
          )}
        </div>

        <div>
          <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono <span className="text-red-500">*</span>
          </label>
          <input
            id="telefono"
            name="telefono"
            type="text"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={formData.telefono}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre <span className="text-red-500">*</span>
          </label>
          <input
            id="nombre"
            name="nombre"
            type="text"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={formData.nombre}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label htmlFor="apellido" className="block text-sm font-medium text-gray-700 mb-1">
            Apellido <span className="text-red-500">*</span>
          </label>
          <input
            id="apellido"
            name="apellido"
            type="text"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={formData.apellido}
            onChange={handleChange}
            required
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 mb-1">
            Dirección <span className="text-red-500">*</span>
          </label>
          <input
            id="direccion"
            name="direccion"
            type="text"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={formData.direccion}
            onChange={handleChange}
            required
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="referencias" className="block text-sm font-medium text-gray-700 mb-1">
            Referencias
          </label>
          <textarea
            id="referencias"
            name="referencias"
            rows="3"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={formData.referencias}
            onChange={handleChange}
          />
        </div>

        {/* Campo de asignación de asesor */}
        {(usuario && ['administrador', 'admin_sistema', 'supervisor'].includes(usuario.rol)) && (
          <div className="md:col-span-2">
            <label htmlFor="asesor_id" className="block text-sm font-medium text-gray-700 mb-1">
              Asesor Asignado <span className="text-red-500">*</span>
            </label>
            <select
              id="asesor_id"
              name="asesor_id"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={formData.asesor_id || ''}
              onChange={handleChange}
              required
            >
              <option value="">Seleccionar asesor</option>
              {asesores.map(asesor => (
                <option key={asesor.id} value={asesor.id}>
                  {asesor.nombre} {asesor.apellido}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Input oculto para asesores */}
        {(usuario && usuario.rol === 'asesor') && (
          <input type="hidden" name="asesor_id" value={usuario.id} />
        )}
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
          disabled={isSubmitting}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {isSubmitting
            ? (isEditing ? 'Actualizando...' : 'Creando...')
            : (isEditing ? 'Actualizar Cliente' : 'Crear Cliente')
          }
        </button>
      </div>
    </form>
  );
}