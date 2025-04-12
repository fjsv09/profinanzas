// Archivo: app/(dashboard)/prestamos/[id]/ver-solicitud/page.jsx
'use client';
import { useParams } from 'next/navigation';
import VerSolicitudPrestamoPage from '@/components/prestamos/ver-solicitud-prestamo';

export default function VerSolicitudPage() {
  const params = useParams();
  
  return <VerSolicitudPrestamoPage params={params} />;
}