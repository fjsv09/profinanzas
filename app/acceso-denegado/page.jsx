// app/acceso-denegado/page.jsx
'use client';

import Link from 'next/link';

export default function AccesoDenegadoPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h1>
          <p className="text-gray-600 mb-6">
            No tienes permisos para acceder a esta sección.
          </p>
          <Link 
            href="/dashboard" 
            className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Volver al Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}