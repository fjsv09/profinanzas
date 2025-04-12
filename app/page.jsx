// app/page.jsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
          // Usuario ya autenticado, redirigir al dashboard
          router.replace('/dashboard');
        } else {
          // Usuario no autenticado, redirigir al login
          router.replace('/login');
        }
      } catch (error) {
        console.error('Error al verificar sesión:', error);
        router.replace('/login');
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  );
}