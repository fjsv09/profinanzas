'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import {
  UserGroupIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalClientes: 0,
    nuevosClientes: 0,
    prestamosActivos: 0,
    cobranzasPendientes: 0,
    cobranzasVencidas: 0
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.push('/login');
          return;
        }
        setUser(currentUser);
        
        // Aquí se cargarían los datos del dashboard
        // En un sistema real, estos datos vendrían de la API
        // Por ahora, usamos datos de ejemplo
        setStats({
          totalClientes: 135,
          nuevosClientes: 12,
          prestamosActivos: 87,
          cobranzasPendientes: 45,
          cobranzasVencidas: 8
        });
      } catch (error) {
        console.error('Error al obtener usuario o datos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          Bienvenido, {user?.nombre}
        </h2>
        <p className="text-gray-600">
          Aquí tienes un resumen de la actividad reciente.
        </p>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total de Clientes"
          value={stats.totalClientes}
          icon={UserGroupIcon}
          description={`${stats.nuevosClientes} nuevos este mes`}
          color="bg-blue-500"
        />
        <StatCard
          title="Préstamos Activos"
          value={stats.prestamosActivos}
          icon={CurrencyDollarIcon}
          description="Préstamos en curso"
          color="bg-green-500"
        />
        <StatCard
          title="Cobranzas Pendientes"
          value={stats.cobranzasPendientes}
          icon={DocumentTextIcon}
          description="Por cobrar hoy"
          color="bg-yellow-500"
        />
        <StatCard
          title="Cobranzas Vencidas"
          value={stats.cobranzasVencidas}
          icon={ExclamationCircleIcon}
          description="Requieren atención"
          color="bg-red-500"
        />
      </div>

      {/* Secciones adicionales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clientes recientes */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Clientes Recientes</h3>
          <ul className="space-y-4">
            {[
              { id: 1, nombre: 'María López', fecha: '15/03/2025', telefono: '987-654-321' },
              { id: 2, nombre: 'Juan Pérez', fecha: '12/03/2025', telefono: '987-123-456' },
              { id: 3, nombre: 'Ana García', fecha: '10/03/2025', telefono: '987-789-123' },
              { id: 4, nombre: 'Carlos Rodríguez', fecha: '08/03/2025', telefono: '987-456-789' }
            ].map((cliente) => (
              <li key={cliente.id} className="flex justify-between items-center border-b pb-2">
                <div>
                  <p className="font-medium">{cliente.nombre}</p>
                  <p className="text-sm text-gray-500">Registro: {cliente.fecha}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">{cliente.telefono}</p>
                  <button 
                    className="text-sm text-indigo-600 hover:text-indigo-800"
                    onClick={() => router.push(`/clientes/${cliente.id}`)}
                  >
                    Ver detalles
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <button 
            className="mt-4 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
            onClick={() => router.push('/clientes')}
          >
            Ver todos los clientes →
          </button>
        </div>

        {/* Cobranzas para hoy */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Cobranzas Para Hoy</h3>
          <ul className="space-y-4">
            {[
              { id: 1, cliente: 'Roberto Silva', monto: 'S/ 150.00', estado: 'Pendiente' },
              { id: 2, cliente: 'Carmen Torres', monto: 'S/ 200.00', estado: 'Pendiente' },
              { id: 3, cliente: 'Miguel Sánchez', monto: 'S/ 100.00', estado: 'Pagado' },
              { id: 4, cliente: 'Lucía Mendoza', monto: 'S/ 180.00', estado: 'Pendiente' }
            ].map((cobranza) => (
              <li key={cobranza.id} className="flex justify-between items-center border-b pb-2">
                <div>
                  <p className="font-medium">{cobranza.cliente}</p>
                  <p className="text-sm text-gray-500">Monto: {cobranza.monto}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    cobranza.estado === 'Pagado' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {cobranza.estado}
                  </span>
                  <button 
                    className="block mt-1 text-sm text-indigo-600 hover:text-indigo-800"
                    onClick={() => router.push(`/cobranzas`)}
                  >
                    {cobranza.estado === 'Pagado' ? 'Ver detalles' : 'Registrar pago'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <button 
            className="mt-4 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
            onClick={() => router.push('/cobranzas')}
          >
            Ver todas las cobranzas →
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, description, color }) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-5">
        <div className="flex items-center">
          <div className={`rounded-md p-3 ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="ml-5">
            <p className="text-gray-500 text-sm font-medium">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        </div>
        <p className="mt-2 text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
}