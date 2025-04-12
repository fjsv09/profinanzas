'use client';
import { useRouter } from 'next/navigation';
import PrestamoForm from '@/components/prestamos/prestamo-form';

export default function NuevoPrestamoPage() {
  const router = useRouter();
  
  const handleSuccess = () => {
    router.push('/prestamos');
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Nuevo Préstamo</h2>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          Volver
        </button>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <PrestamoForm
          onSuccess={handleSuccess}
          onCancel={() => router.back()}
        />
      </div>
    </div>
  );
}