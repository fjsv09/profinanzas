'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { prestamosService, clientesService } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { use } from 'react';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { PrinterIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

// Estilos para el PDF
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  logo: {
    width: 150,
    height: 50,
  },
  title: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    borderBottom: '1px solid #ccc',
    paddingBottom: 5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  label: {
    width: '30%',
    fontWeight: 'bold',
  },
  value: {
    width: '70%',
  },
  footer: {
    marginTop: 30,
    textAlign: 'center',
    fontSize: 10,
    color: '#555',
  },
  firma: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 60,
  },
  firmaBox: {
    width: '40%',
    borderTop: '1px solid #333',
    textAlign: 'center',
    paddingTop: 10,
  },
});

// Componente PDF del Contrato
const ContratoPDF = ({ prestamo, cliente }) => {
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text>ProFinanzas</Text>
          <Text>{new Date().toLocaleDateString()}</Text>
        </View>

        <View style={styles.title}>
          <Text>CONTRATO DE PRÉSTAMO</Text>
          <Text style={{ fontSize: 14, fontWeight: 'normal', marginTop: 5 }}>
            N° {prestamo.id} - {formatDate(prestamo.created_at)}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DATOS DEL CLIENTE</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nombre:</Text>
            <Text style={styles.value}>{cliente.nombre} {cliente.apellido}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>DNI:</Text>
            <Text style={styles.value}>{cliente.dni}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Dirección:</Text>
            <Text style={styles.value}>{cliente.direccion}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Teléfono:</Text>
            <Text style={styles.value}>{cliente.telefono}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CONDICIONES DEL PRÉSTAMO</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Monto prestado:</Text>
            <Text style={styles.value}>S/ {prestamo.monto.toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Interés:</Text>
            <Text style={styles.value}>{prestamo.interes}%</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Monto total a pagar:</Text>
            <Text style={styles.value}>S/ {prestamo.monto_total.toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Frecuencia de pago:</Text>
            <Text style={styles.value}>{prestamo.frecuencia_pago.charAt(0).toUpperCase() + prestamo.frecuencia_pago.slice(1)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Número de cuotas:</Text>
            <Text style={styles.value}>{prestamo.total_cuotas}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Valor de cuota:</Text>
            <Text style={styles.value}>S/ {(prestamo.monto_total / prestamo.total_cuotas).toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Fecha de inicio:</Text>
            <Text style={styles.value}>{formatDate(prestamo.fecha_inicio)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TÉRMINOS Y CONDICIONES</Text>
          <Text style={{ marginBottom: 10, fontSize: 10 }}>
            El cliente se compromete a pagar las cuotas en las fechas establecidas según el cronograma de pagos. 
            El incumplimiento en el pago de las cuotas generará un recargo por mora del 5% sobre el valor de la cuota.
          </Text>
          <Text style={{ marginBottom: 10, fontSize: 10 }}>
            El cliente autoriza a ProFinanzas a realizar las gestiones de cobranza necesarias en caso de incumplimiento, 
            incluyendo visitas domiciliarias, llamadas telefónicas y notificaciones escritas.
          </Text>
          <Text style={{ fontSize: 10 }}>
            Este contrato tiene carácter de título ejecutivo y podrá ser utilizado para iniciar acciones legales en caso de incumplimiento prolongado.
          </Text>
        </View>

        <View style={styles.firma}>
          <View style={styles.firmaBox}>
            <Text>Firma del Cliente</Text>
            <Text style={{ fontSize: 10, marginTop: 5 }}>{cliente.nombre} {cliente.apellido}</Text>
            <Text style={{ fontSize: 10 }}>DNI: {cliente.dni}</Text>
          </View>
          <View style={styles.firmaBox}>
            <Text>Por ProFinanzas</Text>
            <Text style={{ fontSize: 10, marginTop: 5 }}>Representante Autorizado</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Este documento es válido sin tachaduras ni enmendaduras.</Text>
          <Text>ProFinanzas © {new Date().getFullYear()} - Todos los derechos reservados.</Text>
        </View>
      </Page>
    </Document>
  );
};

export default function ContratoPrestamoPage({ params }) {
  const unwrappedParams = use(params);
  const prestamoId = unwrappedParams.id;
  const [prestamo, setPrestamo] = useState(null);
  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // En un sistema real, estos datos vendrían de Supabase
        // Por ahora, usamos datos de ejemplo
        const prestamoData = {
          id: parseInt(prestamoId),
          cliente_id: 1,
          monto: 1000,
          interes: 10,
          monto_total: 1100,
          frecuencia_pago: 'diario',
          total_cuotas: 30,
          cuotas_pagadas: 15,
          estado: 'activo',
          fecha_inicio: '2025-03-01T14:30:00',
          created_at: '2025-03-01T14:30:00'
        };
        
        const clienteData = {
          id: 1,
          nombre: 'María',
          apellido: 'López',
          dni: '45678912',
          telefono: '987654321',
          direccion: 'Av. Los Pinos 123',
          referencias: 'Cerca al mercado central',
          created_at: '2025-02-15T10:30:00'
        };
        
        setPrestamo(prestamoData);
        setCliente(clienteData);
      } catch (error) {
        console.error('Error al obtener datos:', error);
        toast.error('Error al cargar los datos del préstamo');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [prestamoId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!prestamo || !cliente) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-semibold text-gray-800">Información no disponible</h2>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          Volver
        </button>
      </div>
    );
  }

  // Vista previa del contrato en HTML para mostrar en la página
  const ContratoPreview = () => {
    const formatDate = (dateString) => {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString('es-ES', options);
    };

    return (
      <div className="max-w-4xl mx-auto bg-white p-8 shadow-md border border-gray-200 print:shadow-none print:border-none">
        {/* Encabezado */}
        <div className="flex justify-between items-center mb-6 print:mb-10">
          <div className="text-2xl font-bold text-indigo-700">ProFinanzas</div>
          <div className="text-gray-500">{new Date().toLocaleDateString()}</div>
        </div>

        {/* Título */}
        <div className="text-center mb-8 print:mb-10">
          <h1 className="text-2xl font-bold text-gray-900">CONTRATO DE PRÉSTAMO</h1>
          <p className="text-gray-600 mt-1">N° {prestamo.id} - {formatDate(prestamo.created_at)}</p>
        </div>

        {/* Datos del cliente */}
        <div className="mb-8 print:mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">DATOS DEL CLIENTE</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex">
              <span className="w-32 font-medium text-gray-700">Nombre:</span>
              <span className="text-gray-900">{cliente.nombre} {cliente.apellido}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-medium text-gray-700">DNI:</span>
              <span className="text-gray-900">{cliente.dni}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-medium text-gray-700">Dirección:</span>
              <span className="text-gray-900">{cliente.direccion}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-medium text-gray-700">Teléfono:</span>
              <span className="text-gray-900">{cliente.telefono}</span>
            </div>
          </div>
        </div>

        {/* Condiciones del préstamo */}
        <div className="mb-8 print:mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">CONDICIONES DEL PRÉSTAMO</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex">
              <span className="w-40 font-medium text-gray-700">Monto prestado:</span>
              <span className="text-gray-900">S/ {prestamo.monto.toFixed(2)}</span>
            </div>
            <div className="flex">
              <span className="w-40 font-medium text-gray-700">Interés:</span>
              <span className="text-gray-900">{prestamo.interes}%</span>
            </div>
            <div className="flex">
              <span className="w-40 font-medium text-gray-700">Monto total a pagar:</span>
              <span className="text-gray-900">S/ {prestamo.monto_total.toFixed(2)}</span>
            </div>
            <div className="flex">
              <span className="w-40 font-medium text-gray-700">Frecuencia de pago:</span>
              <span className="text-gray-900 capitalize">{prestamo.frecuencia_pago}</span>
            </div>
            <div className="flex">
              <span className="w-40 font-medium text-gray-700">Número de cuotas:</span>
              <span className="text-gray-900">{prestamo.total_cuotas}</span>
            </div>
            <div className="flex">
              <span className="w-40 font-medium text-gray-700">Valor de cuota:</span>
              <span className="text-gray-900">S/ {(prestamo.monto_total / prestamo.total_cuotas).toFixed(2)}</span>
            </div>
            <div className="flex">
              <span className="w-40 font-medium text-gray-700">Fecha de inicio:</span>
              <span className="text-gray-900">{formatDate(prestamo.fecha_inicio)}</span>
            </div>
          </div>
        </div>

        {/* Términos y condiciones */}
        <div className="mb-10 print:mb-16">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">TÉRMINOS Y CONDICIONES</h2>
          <div className="text-gray-700 space-y-4 text-sm">
            <p>
              El cliente se compromete a pagar las cuotas en las fechas establecidas según el cronograma de pagos. 
              El incumplimiento en el pago de las cuotas generará un recargo por mora del 5% sobre el valor de la cuota.
            </p>
            <p>
              El cliente autoriza a ProFinanzas a realizar las gestiones de cobranza necesarias en caso de incumplimiento, 
              incluyendo visitas domiciliarias, llamadas telefónicas y notificaciones escritas.
            </p>
            <p>
              Este contrato tiene carácter de título ejecutivo y podrá ser utilizado para iniciar acciones legales en caso de incumplimiento prolongado.
            </p>
          </div>
        </div>

        {/* Firmas */}
        <div className="flex justify-between mt-16 print:mt-20">
          <div className="w-5/12 border-t border-gray-400 pt-2 text-center">
            <p className="font-medium">Firma del Cliente</p>
            <p className="text-sm mt-1">{cliente.nombre} {cliente.apellido}</p>
            <p className="text-sm">DNI: {cliente.dni}</p>
          </div>
          <div className="w-5/12 border-t border-gray-400 pt-2 text-center">
            <p className="font-medium">Por ProFinanzas</p>
            <p className="text-sm mt-1">Representante Autorizado</p>
          </div>
        </div>

        {/* Pie de página */}
        <div className="mt-16 text-center text-gray-500 text-xs print:mt-24">
          <p>Este documento es válido sin tachaduras ni enmendaduras.</p>
          <p>ProFinanzas © {new Date().getFullYear()} - Todos los derechos reservados.</p>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6 print:hidden">
        <h2 className="text-xl font-semibold text-gray-800">Contrato de Préstamo #{prestamo.id}</h2>
        <div className="flex space-x-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center"
          >
            <PrinterIcon className="h-4 w-4 mr-2" />
            Imprimir
          </button>
          {isGeneratingPdf ? (
            <button 
              className="px-4 py-2 bg-gray-400 text-white rounded-md flex items-center" 
              disabled
            >
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
              Generando...
            </button>
          ) : (
            <PDFDownloadLink 
              document={<ContratoPDF prestamo={prestamo} cliente={cliente} />} 
              fileName={`contrato_prestamo_${prestamo.id}.pdf`}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
              onClick={() => setIsGeneratingPdf(true)}
            >
              {({ loading }) => 
                loading ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                    Generando PDF...
                  </>
                ) : (
                  <>
                    <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                    Descargar PDF
                  </>
                )
              }
            </PDFDownloadLink>
          )}
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Volver
          </button>
        </div>
      </div>

      {/* Vista previa del contrato */}
      <ContratoPreview />
    </div>
  );
}