'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SimuladorPrestamo() {
  const router = useRouter();
  const [monto, setMonto] = useState(1000);
  const [interes, setInteres] = useState(10);
  const [plazo, setPlazo] = useState(30);
  const [frecuenciaPago, setFrecuenciaPago] = useState('diario');
  const [cuotas, setCuotas] = useState([]);

  useEffect(() => {
    calcularCuotas();
  }, [monto, interes, plazo, frecuenciaPago]);

  const calcularCuotas = () => {
    const montoTotal = monto * (1 + interes / 100);
    const montoCuota = parseFloat((montoTotal / plazo).toFixed(2));
    const cuotasGeneradas = [];
    
    // Función para determinar el incremento de días según la frecuencia
    const incrementoDias = {
      'diario': 1,
      'semanal': 7,
      'quincenal': 15,
      'mensual': 30
    };
    
    const incremento = incrementoDias[frecuenciaPago];
    const fechaActual = new Date();
    
    for (let i = 0; i < plazo; i++) {
      const fechaPago = new Date(fechaActual);
      fechaPago.setDate(fechaPago.getDate() + incremento * (i + 1));
      cuotasGeneradas.push({
        numero: i + 1,
        fecha: fechaPago.toLocaleDateString(),
        monto: montoCuota
      });
    }
    
    setCuotas(cuotasGeneradas);
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Simulador de Préstamo</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="mb-4">
            <label htmlFor="monto" className="block text-sm font-medium text-gray-700 mb-1">
              Monto del préstamo (S/)
            </label>
            <input
              type="number"
              id="monto"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={monto}
              onChange={(e) => setMonto(parseFloat(e.target.value) || 0)}
              min="0"
              step="100"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="interes" className="block text-sm font-medium text-gray-700 mb-1">
              Interés (%)
            </label>
            <input
              type="number"
              id="interes"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={interes}
              onChange={(e) => setInteres(parseFloat(e.target.value) || 0)}
              min="0"
              step="1"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="frecuencia" className="block text-sm font-medium text-gray-700 mb-1">
              Frecuencia de pago
            </label>
            <select
              id="frecuencia"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={frecuenciaPago}
              onChange={(e) => setFrecuenciaPago(e.target.value)}
            >
              <option value="diario">Diario</option>
              <option value="semanal">Semanal</option>
              <option value="quincenal">Quincenal</option>
              <option value="mensual">Mensual</option>
            </select>
          </div>
          <div className="mb-4">
            <label htmlFor="plazo" className="block text-sm font-medium text-gray-700 mb-1">
              Número de cuotas
            </label>
            <input
              type="number"
              id="plazo"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={plazo}
              onChange={(e) => setPlazo(parseInt(e.target.value) || 0)}
              min="1"
              step="1"
            />
          </div>
          <div className="mt-6">
            <button
              type="button"
              onClick={() => router.push(`/prestamos/nuevo?monto=${monto}&interes=${interes}&plazo=${plazo}&frecuencia=${frecuenciaPago}`)}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-full"
            >
              Crear préstamo con estos valores
            </button>
          </div>
        </div>
        <div>
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Monto del préstamo</p>
                <p className="text-xl font-semibold text-gray-900">S/ {monto.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Monto total a pagar</p>
                <p className="text-xl font-semibold text-gray-900">S/ {(monto * (1 + interes / 100)).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Valor de cada cuota</p>
                <p className="text-xl font-semibold text-gray-900">S/ {cuotas.length > 0 ? cuotas[0].monto.toFixed(2) : '0.00'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Número de cuotas</p>
                <p className="text-xl font-semibold text-gray-900">{plazo}</p>
              </div>
            </div>
          </div>
          <div className="border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N°</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cuotas.slice(0, 10).map((cuota) => (
                  <tr key={cuota.numero}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{cuota.numero}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{cuota.fecha}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">S/ {cuota.monto.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {cuotas.length > 10 && (
              <div className="px-4 py-2 text-center text-sm text-gray-500 border-t">
                Y {cuotas.length - 10} cuotas más...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}