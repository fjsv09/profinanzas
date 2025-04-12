import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

/**
 * Componente para registrar un nuevo pago de préstamo
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.prestamo - Datos del préstamo para el que se registra el pago
 * @param {Function} props.onPagoRegistrado - Función a llamar cuando se completa el registro
 * @param {Function} props.onCancel - Función para cancelar el registro
 */
export default function RegistroPago({ prestamo, onPagoRegistrado, onCancel }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  
  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    defaultValues: {
      monto: '',
      comentario: ''
    }
  });

  useEffect(() => {
    // Si hay un préstamo, calcular el monto de la cuota
    if (prestamo) {
      const montoCuota = prestamo.monto_total / prestamo.total_cuotas;
      setValue('monto', montoCuota.toFixed(2));
    }
  }, [prestamo, setValue]);

  const onSubmit = async (data) => {
    if (!prestamo) {
      toast.error('Debe seleccionar un préstamo');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Preparar datos del pago
      const pagoData = {
        prestamo_id: prestamo.id,
        monto: parseFloat(data.monto),
        fecha_pago: new Date().toISOString(),
        metodo_pago: metodoPago,
        comentario: data.comentario,
        created_by: 'usuario_actual' // En un sistema real, esto sería el ID del usuario logueado
      };
      
      // En un sistema real, esto llamaría a un servicio para guardar el pago
      console.log('Datos del pago a crear:', pagoData);
      
      // Simulación de latencia
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Pago registrado con éxito');
      
      if (onPagoRegistrado) {
        onPagoRegistrado(pagoData);
      }
    } catch (error) {
      console.error('Error al registrar pago:', error);
      toast.error('Error al registrar el pago');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        {prestamo ? 'Registrar Pago' : 'Seleccione un Préstamo'}
      </h3>
      
      {prestamo ? (
        <>
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-900">
              {prestamo.cliente.nombre} {prestamo.cliente.apellido}
            </p>
            <p className="text-xs text-gray-500">DNI: {prestamo.cliente.dni}</p>
            <p className="text-xs text-gray-500 mt-2">
              Préstamo: S/ {prestamo.monto.toFixed(2)} - {prestamo.cuotas_pagadas} de {prestamo.total_cuotas} cuotas pagadas
            </p>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
              <div
                className="bg-indigo-600 h-1.5 rounded-full"
                style={{ width: `${(prestamo.cuotas_pagadas / prestamo.total_cuotas) * 100}%` }}
              ></div>
            </div>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="mb-4">
              <label htmlFor="monto" className="block text-sm font-medium text-gray-700 mb-1">
                Monto a Pagar (S/)
              </label>
              <input
                id="monto"
                type="number"
                step="0.01"
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.monto ? 'border-red-500' : ''}`}
                {...register('monto', {
                  required: 'Este campo es obligatorio',
                  min: { value: 0.01, message: 'El monto debe ser mayor a 0' }
                })}
              />
              {errors.monto && (
                <p className="mt-1 text-sm text-red-600">{errors.monto.message}</p>
              )}
            </div>
            
            <div className="mb-4">
              <label htmlFor="metodo_pago" className="block text-sm font-medium text-gray-700 mb-1">
                Método de Pago
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    metodoPago === 'efectivo'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setMetodoPago('efectivo')}
                >
                  Efectivo
                </button>
                <button
                  type="button"
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    metodoPago === 'yape'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setMetodoPago('yape')}
                >
                  Yape
                </button>
                <button
                  type="button"
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    metodoPago === 'transferencia'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setMetodoPago('transferencia')}
                >
                  Transferencia
                </button>
                <button
                  type="button"
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    metodoPago === 'otro'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setMetodoPago('otro')}
                >
                  Otro
                </button>
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="comentario" className="block text-sm font-medium text-gray-700 mb-1">
                Comentario (opcional)
              </label>
              <textarea
                id="comentario"
                rows="3"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                {...register('comentario')}
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
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {isSubmitting ? 'Registrando pago...' : 'Registrar pago'}
              </button>
            </div>
          </form>
        </>
      ) : (
        <div className="text-center py-6">
          <p className="text-gray-500 mb-4">
            Seleccione un préstamo para registrar un pago
          </p>
          <button
            onClick={() => window.location.href = '/prestamos'}
            className="px-4 py-2 text-sm text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors"
          >
            Ver todos los préstamos
          </button>
        </div>
      )}
    </div>
  );
}