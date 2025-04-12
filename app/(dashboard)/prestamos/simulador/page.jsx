'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SimuladorPrestamo from '@/components/prestamos/simulador-prestamo';

export default function SimuladorPrestamosPage() {
  const router = useRouter();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Simulador de Préstamos</h2>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          Volver
        </button>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        {/* Componente del simulador de préstamos */}
        <SimuladorPrestamo />
        
        {/* Información adicional sobre préstamos */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Información Importante</h3>
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              Este simulador le permite calcular el valor de las cuotas y el cronograma de pagos 
              según los parámetros que usted defina.
            </p>
            <p>
              Los valores calculados son aproximados y pueden variar ligeramente al momento de 
              formalizar el préstamo debido a ajustes por redondeo o políticas específicas.
            </p>
            <p>
              Si desea crear un préstamo con estos valores, puede usar el botón "Crear préstamo 
              con estos valores" que le llevará directamente al formulario de préstamo con los datos
              precargados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}