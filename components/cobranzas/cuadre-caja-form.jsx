import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

/**
 * Componente para realizar el cuadre de caja diario
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.resumenDia - Datos del resumen de cobros del día 
 * @param {Function} props.onCuadreGuardado - Función a llamar cuando se guarda el cuadre
 * @param {Function} props.onCancel - Función para cancelar el proceso
 */
export default function CuadreCajaForm({ resumenDia = {}, onCuadreGuardado, onCancel }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cuadreCaja, setCuadreCaja] = useState({
    montoEfectivo: 0,
    montoYape: 0,
    montoTransferencia: 0,
    montoOtro: 0,
    comentarios: ''
  });
  const [totalCuadre, setTotalCuadre] = useState(0);
  const [diferencia, setDiferencia] = useState(0);

  // Inicializar los valores del cuadre con los montos cobrados
  useEffect(() => {
    if (resumenDia) {
      setCuadreCaja({
        montoEfectivo: resumenDia.cobradoEfectivo || 0,
        montoYape: resumenDia.cobradoYape || 0,
        montoTransferencia: resumenDia.cobradoTransferencia || 0,
        montoOtro: resumenDia.cobradoOtro || 0,
        comentarios: ''
      });
    }
  }, [resumenDia]);

  // Calcular totales cuando cambian los valores
  useEffect(() => {
    const total = 
      parseFloat(cuadreCaja.montoEfectivo || 0) +
      parseFloat(cuadreCaja.montoYape || 0) +
      parseFloat(cuadreCaja.montoTransferencia || 0) +
      parseFloat(cuadreCaja.montoOtro || 0);
    
    setTotalCuadre(total);
    
    // Calcular diferencia si hay un resumen del día
    if (resumenDia && resumenDia.totalCobrado) {
      setDiferencia(resumenDia.totalCobrado - total);
    }
  }, [cuadreCaja, resumenDia]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCuadreCaja(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validar que la diferencia sea aceptable
      if (Math.abs(diferencia) > 1) {
        // Mostrar confirmación si hay una diferencia significativa
        if (!window.confirm(`Hay una diferencia de S/ ${diferencia.toFixed(2)} entre lo cobrado y lo cuadrado. ¿Desea continuar?`)) {
          setIsSubmitting(false);
          return;
        }
      }

      // En un sistema real, esto llamaría a un servicio para registrar el cuadre
      const cuadreData = {
        fecha: new Date().toISOString().split('T')[0],
        monto_efectivo: parseFloat(cuadreCaja.montoEfectivo),
        monto_yape: parseFloat(cuadreCaja.montoYape),
        monto_transferencia: parseFloat(cuadreCaja.montoTransferencia),
        monto_otro: parseFloat(cuadreCaja.montoOtro),
        monto_total: totalCuadre,
        diferencia: diferencia,
        comentarios: cuadreCaja.comentarios,
        estado: 'pendiente', // Pendiente de aprobación por el administrador
        created_at: new Date().toISOString()
      };
      
      // Simulación de latencia
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Datos del cuadre a guardar:', cuadreData);
      toast.success('Cuadre de caja registrado con éxito');
      
      if (onCuadreGuardado) {
        onCuadreGuardado(cuadreData);
      } else {
        router.push('/cobranzas');
      }
    } catch (error) {
      console.error('Error al registrar cuadre de caja:', error);
      toast.error('Error al registrar el cuadre de caja');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resumen del día */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Resumen de Cobranzas del Día</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Efectivo:</span>
              <span className="font-medium">S/ {(resumenDia.cobradoEfectivo || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Yape:</span>
              <span className="font-medium">S/ {(resumenDia.cobradoYape || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Transferencia:</span>
              <span className="font-medium">S/ {(resumenDia.cobradoTransferencia || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Otros medios:</span>
              <span className="font-medium">S/ {(resumenDia.cobradoOtro || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2 font-bold">
              <span>Total Cobrado:</span>
              <span>S/ {(resumenDia.totalCobrado || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Formulario de cuadre */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Registrar Cuadre</h3>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="montoEfectivo" className="block text-sm font-medium text-gray-700 mb-1">
                  Efectivo (S/)
                </label>
                <input
                  id="montoEfectivo"
                  name="montoEfectivo"
                  type="number"
                  step="0.01"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={cuadreCaja.montoEfectivo}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label htmlFor="montoYape" className="block text-sm font-medium text-gray-700 mb-1">
                  Yape (S/)
                </label>
                <input
                  id="montoYape"
                  name="montoYape"
                  type="number"
                  step="0.01"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={cuadreCaja.montoYape}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label htmlFor="montoTransferencia" className="block text-sm font-medium text-gray-700 mb-1">
                  Transferencia (S/)
                </label>
                <input
                  id="montoTransferencia"
                  name="montoTransferencia"
                  type="number"
                  step="0.01"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={cuadreCaja.montoTransferencia}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label htmlFor="montoOtro" className="block text-sm font-medium text-gray-700 mb-1">
                  Otros (S/)
                </label>
                <input
                  id="montoOtro"
                  name="montoOtro"
                  type="number"
                  step="0.01"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={cuadreCaja.montoOtro}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label htmlFor="comentarios" className="block text-sm font-medium text-gray-700 mb-1">
                  Comentarios
                </label>
                <textarea
                  id="comentarios"
                  name="comentarios"
                  rows="3"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Observaciones o detalles adicionales"
                  value={cuadreCaja.comentarios}
                  onChange={handleInputChange}
                ></textarea>
              </div>
            </div>
            
            <div className="mt-6">
              <div className="flex justify-between items-center py-2 mb-4 font-bold">
                <span>Total Cuadre:</span>
                <span>S/ {totalCuadre.toFixed(2)}</span>
              </div>
              <div className={`flex justify-between items-center py-2 mb-6 font-bold ${
                Math.abs(diferencia) > 0.01 ? 'text-red-600' : 'text-green-600'
              }`}>
                <span>Diferencia:</span>
                <span>S/ {diferencia.toFixed(2)}</span>
              </div>

              <div className="flex justify-end space-x-3">
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
                  className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar Cuadre de Caja'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}