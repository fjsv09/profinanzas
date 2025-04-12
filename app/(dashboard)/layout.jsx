// app/(dashboard)/layout.jsx
'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser } from '@/lib/auth';
import Sidebar from '@/components/dashboard/sidebar';
import Header from '@/components/dashboard/header';
import RoleGuard from '@/components/RoleGuard';

export default function DashboardLayout({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Error al obtener usuario:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <RoleGuard>
      <div className="flex h-screen bg-gray-100">
        <Sidebar 
          user={user} 
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
        />
        <div className="flex-1 flex flex-col w-full md:pl-64">
          <Header 
            user={user} 
            openSidebar={() => setSidebarOpen(true)} 
          />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}