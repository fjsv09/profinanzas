-- Tabla de usuarios (complemento a auth.users de Supabase)
CREATE TABLE usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    rol TEXT NOT NULL CHECK (rol IN ('admin_sistema', 'administrador', 'supervisor', 'asesor')),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de clientes
CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,
    dni TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    telefono TEXT NOT NULL,
    direccion TEXT NOT NULL,
    referencias TEXT,
    historial_pagos TEXT DEFAULT 'Nuevo' CHECK (historial_pagos IN ('Nuevo', 'Bueno', 'Regular', 'Malo')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES usuarios(id)
);

-- Tabla de préstamos
CREATE TABLE prestamos (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL REFERENCES clientes(id),
    monto DECIMAL(10, 2) NOT NULL,
    interes DECIMAL(5, 2) NOT NULL,
    monto_total DECIMAL(10, 2) NOT NULL,
    frecuencia_pago TEXT NOT NULL CHECK (frecuencia_pago IN ('diario', 'semanal', 'quincenal', 'mensual')),
    total_cuotas INTEGER NOT NULL,
    cuotas_pagadas INTEGER DEFAULT 0,
    estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'completado', 'atrasado')),
    fecha_inicio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES usuarios(id)
);

-- Tabla de pagos
CREATE TABLE pagos (
    id SERIAL PRIMARY KEY,
    prestamo_id INTEGER NOT NULL REFERENCES prestamos(id),
    monto DECIMAL(10, 2) NOT NULL,
    fecha_pago TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metodo_pago TEXT NOT NULL CHECK (metodo_pago IN ('efectivo', 'yape', 'transferencia', 'otro')),
    comentario TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES usuarios(id)
);

-- Tabla de transacciones financieras
CREATE TABLE transacciones (
    id SERIAL PRIMARY KEY,
    tipo TEXT NOT NULL CHECK (tipo IN ('ingreso', 'egreso')),
    monto DECIMAL(10, 2) NOT NULL,
    categoria TEXT NOT NULL,
    descripcion TEXT,
    cuenta TEXT NOT NULL CHECK (cuenta IN ('caja', 'banco', 'yape', 'otro')),
    fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES usuarios(id)
);

-- Tabla de metas
CREATE TABLE metas (
    id SERIAL PRIMARY KEY,
    asesor_id UUID NOT NULL REFERENCES usuarios(id),
    periodo TEXT NOT NULL, -- Formato YYYY-MM
    meta_clientes INTEGER NOT NULL DEFAULT 0,
    meta_cobranza DECIMAL(10, 2) NOT NULL DEFAULT 0,
    meta_morosidad DECIMAL(5, 2) NOT NULL DEFAULT 0, -- Porcentaje
    meta_cartera DECIMAL(10, 2) NOT NULL DEFAULT 0,
    clientes_captados INTEGER DEFAULT 0,
    cobranza_realizada DECIMAL(10, 2) DEFAULT 0,
    morosidad_actual DECIMAL(5, 2) DEFAULT 0,
    cartera_actual DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES usuarios(id),
    UNIQUE (asesor_id, periodo)
);

-- Tabla de gastos diarios de asesores
CREATE TABLE gastos_asesores (
    id SERIAL PRIMARY KEY,
    asesor_id UUID NOT NULL REFERENCES usuarios(id),
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    tipo TEXT NOT NULL CHECK (tipo IN ('transporte', 'papeleria', 'imprevisto', 'otro')),
    monto DECIMAL(10, 2) NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para cuadre de caja
CREATE TABLE cuadre_caja (
    id SERIAL PRIMARY KEY,
    asesor_id UUID NOT NULL REFERENCES usuarios(id),
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    monto_efectivo DECIMAL(10, 2) NOT NULL DEFAULT 0,
    monto_yape DECIMAL(10, 2) NOT NULL DEFAULT 0,
    monto_transferencia DECIMAL(10, 2) NOT NULL DEFAULT 0,
    monto_otro DECIMAL(10, 2) NOT NULL DEFAULT 0,
    monto_total DECIMAL(10, 2) NOT NULL DEFAULT 0,
    estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
    comentarios TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    aprobado_por UUID REFERENCES usuarios(id),
    UNIQUE (asesor_id, fecha)
);

-- Tabla para renovaciones de préstamos
CREATE TABLE renovaciones (
    id SERIAL PRIMARY KEY,
    prestamo_anterior_id INTEGER NOT NULL REFERENCES prestamos(id),
    prestamo_nuevo_id INTEGER NOT NULL REFERENCES prestamos(id),
    motivo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES usuarios(id)
);

-- Funciones y Triggers para actualización automática

-- Función para actualizar el campo updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at en usuarios
CREATE TRIGGER update_usuarios_modtime
BEFORE UPDATE ON usuarios
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Trigger para actualizar updated_at en clientes
CREATE TRIGGER update_clientes_modtime
BEFORE UPDATE ON clientes
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Trigger para actualizar updated_at en prestamos
CREATE TRIGGER update_prestamos_modtime
BEFORE UPDATE ON prestamos
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Trigger para actualizar updated_at en metas
CREATE TRIGGER update_metas_modtime
BEFORE UPDATE ON metas
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Trigger para actualizar updated_at en gastos_asesores
CREATE TRIGGER update_gastos_asesores_modtime
BEFORE UPDATE ON gastos_asesores
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Trigger para actualizar updated_at en cuadre_caja
CREATE TRIGGER update_cuadre_caja_modtime
BEFORE UPDATE ON cuadre_caja
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Función para actualizar cuotas_pagadas en préstamos cuando se registra un pago
CREATE OR REPLACE FUNCTION update_prestamo_after_pago()
RETURNS TRIGGER AS $$
DECLARE
    prestamo_record RECORD;
    cuota_valor DECIMAL;
BEGIN
    -- Obtener información del préstamo
    SELECT * INTO prestamo_record FROM prestamos WHERE id = NEW.prestamo_id;
    
    -- Calcula el valor de una cuota
    cuota_valor := prestamo_record.monto_total / prestamo_record.total_cuotas;
    
    -- Incrementar cuotas_pagadas basado en el monto del pago
    UPDATE prestamos
    SET 
        cuotas_pagadas = LEAST(total_cuotas, cuotas_pagadas + (NEW.monto / cuota_valor)),
        updated_at = NOW()
    WHERE id = NEW.prestamo_id;
    
    -- Si se completan todas las cuotas, actualizar estado a 'completado'
    UPDATE prestamos
    SET estado = 'completado'
    WHERE id = NEW.prestamo_id AND cuotas_pagadas >= total_cuotas;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar el préstamo cuando se registra un pago
CREATE TRIGGER update_prestamo_cuotas
AFTER INSERT ON pagos
FOR EACH ROW
EXECUTE FUNCTION update_prestamo_after_pago();


-- Añadir campos para el sistema de aprobación de préstamos
ALTER TABLE prestamos 
ADD COLUMN estado_aprobacion TEXT DEFAULT 'pendiente' CHECK (estado_aprobacion IN ('pendiente', 'aprobado', 'rechazado')),
ADD COLUMN aprobado_por UUID REFERENCES usuarios(id),
ADD COLUMN fecha_aprobacion TIMESTAMP WITH TIME ZONE,
ADD COLUMN comentarios_aprobacion TEXT,
ADD COLUMN fecha_solicitud TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN tipo TEXT DEFAULT 'nuevo' CHECK (tipo IN ('nuevo', 'renovacion')),
ADD COLUMN prestamo_anterior_id INTEGER REFERENCES prestamos(id);




-- Agregar campo supervisor_id a la tabla usuarios para la jerarquía de supervisión
ALTER TABLE usuarios 
ADD COLUMN supervisor_id UUID REFERENCES usuarios(id),
-- Agregar esta columna para almacenar información adicional sobre el supervisor
ADD COLUMN supervisor_desde TIMESTAMP WITH TIME ZONE;

-- Agregar campo asesor_id a la tabla clientes para la asignación de clientes a asesores
ALTER TABLE clientes 
ADD COLUMN asesor_id UUID NOT NULL REFERENCES usuarios(id),
-- Agregar un campo para almacenar cuándo fue asignado el cliente al asesor
ADD COLUMN asignado_desde TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Crear un índice para mejorar el rendimiento de las consultas por asesor_id en clientes
CREATE INDEX idx_clientes_asesor_id ON clientes(asesor_id);

-- Crear un índice para mejorar el rendimiento de las consultas por supervisor_id en usuarios
CREATE INDEX idx_usuarios_supervisor_id ON usuarios(supervisor_id);












-----------------------------------------------------------------------------------------------------------
-- Tabla de usuarios (complemento a auth.users de Supabase)
CREATE TABLE usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    rol TEXT NOT NULL CHECK (rol IN ('admin_sistema', 'administrador', 'supervisor', 'asesor')),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    supervisor_id UUID REFERENCES usuarios(id),
    supervisor_desde TIMESTAMP WITH TIME ZONE
);

-- Tabla de clientes
CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,
    dni TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    telefono TEXT NOT NULL,
    direccion TEXT NOT NULL,
    referencias TEXT,
    historial_pagos TEXT DEFAULT 'Nuevo' CHECK (historial_pagos IN ('Nuevo', 'Bueno', 'Regular', 'Malo')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES usuarios(id),
    asesor_id UUID NOT NULL REFERENCES usuarios(id),
    asignado_desde TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de préstamos
CREATE TABLE prestamos (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL REFERENCES clientes(id),
    monto DECIMAL(10, 2) NOT NULL,
    interes DECIMAL(5, 2) NOT NULL,
    monto_total DECIMAL(10, 2) NOT NULL,
    frecuencia_pago TEXT NOT NULL CHECK (frecuencia_pago IN ('diario', 'semanal', 'quincenal', 'mensual')),
    total_cuotas INTEGER NOT NULL,
    --cuotas_pagadas NUMERIC DEFAULT 0, -- Eliminado: Ahora se calcula a partir de detalles_pago
    estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'completado', 'atrasado')),
    fecha_inicio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES usuarios(id),
    estado_aprobacion TEXT DEFAULT 'pendiente_aprobacion' CHECK (estado_aprobacion IN ('pendiente_aprobacion', 'aprobado', 'rechazado')),
    aprobado_por UUID REFERENCES usuarios(id),
    fecha_aprobacion TIMESTAMP WITH TIME ZONE,
    comentarios_aprobacion TEXT,
    fecha_solicitud TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tipo TEXT DEFAULT 'nuevo' CHECK (tipo IN ('nuevo', 'renovacion')),
    prestamo_anterior_id INTEGER REFERENCES prestamos(id)
);

-- Tabla de pagos
CREATE TABLE pagos (
    id SERIAL PRIMARY KEY,
    prestamo_id INTEGER NOT NULL REFERENCES prestamos(id),
    monto DECIMAL(10, 2) NOT NULL,
    fecha_pago TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metodo_pago TEXT NOT NULL CHECK (metodo_pago IN ('efectivo', 'yape', 'transferencia', 'otro')),
    comentario TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES usuarios(id)
);

-- Tabla de detalles de pagos (NUEVA)
CREATE TABLE detalles_pago (
    id SERIAL PRIMARY KEY,
    pago_id INTEGER NOT NULL REFERENCES pagos(id) ON DELETE CASCADE, -- Cuando se elimina un pago, se eliminan sus detalles
    prestamo_id INTEGER NOT NULL REFERENCES prestamos(id),
    cuota_numero INTEGER NOT NULL, -- Número de la cuota a la que se aplica el pago (1, 2, 3...)
    monto_aplicado DECIMAL(10, 2) NOT NULL, -- Monto que se aplicó a esta cuota
    fecha_aplicado TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (pago_id, cuota_numero)
);

-- Tabla de transacciones financieras
CREATE TABLE transacciones (
    id SERIAL PRIMARY KEY,
    tipo TEXT NOT NULL CHECK (tipo IN ('ingreso', 'egreso')),
    monto DECIMAL(10, 2) NOT NULL,
    categoria TEXT NOT NULL,
    descripcion TEXT,
    cuenta TEXT NOT NULL CHECK (cuenta IN ('caja', 'banco', 'yape', 'otro')),
    fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES usuarios(id)
);

-- Tabla de metas
CREATE TABLE metas (
    id SERIAL PRIMARY KEY,
    asesor_id UUID NOT NULL REFERENCES usuarios(id),
    periodo TEXT NOT NULL, -- Formato YYYY-MM
    meta_clientes INTEGER NOT NULL DEFAULT 0,
    meta_cobranza DECIMAL(10, 2) NOT NULL DEFAULT 0,
    meta_morosidad DECIMAL(5, 2) NOT NULL DEFAULT 0, -- Porcentaje
    meta_cartera DECIMAL(10, 2) NOT NULL DEFAULT 0,
    clientes_captados INTEGER DEFAULT 0,
    cobranza_realizada DECIMAL(10, 2) DEFAULT 0,
    morosidad_actual DECIMAL(5, 2) DEFAULT 0,
    cartera_actual DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES usuarios(id),
    UNIQUE (asesor_id, periodo)
);

-- Tabla de gastos diarios de asesores
CREATE TABLE gastos_asesores (
    id SERIAL PRIMARY KEY,
    asesor_id UUID NOT NULL REFERENCES usuarios(id),
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    tipo TEXT NOT NULL CHECK (tipo IN ('transporte', 'papeleria', 'imprevisto', 'otro')),
    monto DECIMAL(10, 2) NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para cuadre de caja
CREATE TABLE cuadre_caja (
    id SERIAL PRIMARY KEY,
    asesor_id UUID NOT NULL REFERENCES usuarios(id),
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    monto_efectivo DECIMAL(10, 2) NOT NULL DEFAULT 0,
    monto_yape DECIMAL(10, 2) NOT NULL DEFAULT 0,
    monto_transferencia DECIMAL(10, 2) NOT NULL DEFAULT 0,
    monto_otro DECIMAL(10, 2) NOT NULL DEFAULT 0,
    monto_total DECIMAL(10, 2) NOT NULL DEFAULT 0,
    estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
    comentarios TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    aprobado_por UUID REFERENCES usuarios(id),
    UNIQUE (asesor_id, fecha)
);

-- Tabla para renovaciones de préstamos
CREATE TABLE renovaciones (
    id SERIAL PRIMARY KEY,
    prestamo_anterior_id INTEGER NOT NULL REFERENCES prestamos(id),
    prestamo_nuevo_id INTEGER NOT NULL REFERENCES prestamos(id),
    motivo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES usuarios(id)
);

-- Funciones y Triggers para actualización automática

-- Función para actualizar el campo updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at en usuarios
CREATE TRIGGER update_usuarios_modtime
BEFORE UPDATE ON usuarios
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Trigger para actualizar updated_at en clientes
CREATE TRIGGER update_clientes_modtime
BEFORE UPDATE ON clientes
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Trigger para actualizar updated_at en prestamos
CREATE TRIGGER update_prestamos_modtime
BEFORE UPDATE ON prestamos
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Trigger para actualizar updated_at en metas
CREATE TRIGGER update_metas_modtime
BEFORE UPDATE ON metas
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Trigger para actualizar updated_at en gastos_asesores
CREATE TRIGGER update_gastos_asesores_modtime
BEFORE UPDATE ON gastos_asesores
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Trigger para actualizar updated_at en cuadre_caja
CREATE TRIGGER update_cuadre_caja_modtime
BEFORE UPDATE ON cuadre_caja
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Función para insertar detalles de pago y actualizar el estado del préstamo
CREATE OR REPLACE FUNCTION insert_detalles_pago_and_update_prestamo()
RETURNS TRIGGER AS $$
DECLARE
    prestamo_record RECORD;
    cuota_valor DECIMAL;
    cuotas_completas INTEGER;
    saldo_pendiente DECIMAL;
    numero_cuota INTEGER;
    monto_asignado DECIMAL;
    monto_restante DECIMAL;
BEGIN
    -- Obtener información del préstamo
    SELECT * INTO prestamo_record FROM prestamos WHERE id = NEW.prestamo_id;

    -- Calcula el valor de una cuota
    cuota_valor := prestamo_record.monto_total / prestamo_record.total_cuotas;

    -- Inicializa el número de cuota y el monto restante
    numero_cuota := 1;
    monto_restante := NEW.monto;
    
    WHILE monto_restante > 0 AND numero_cuota <= prestamo_record.total_cuotas LOOP
      
      -- Buscar si hay un registro para este número de cuota
      SELECT monto_aplicado INTO monto_asignado FROM detalles_pago 
      WHERE prestamo_id = prestamo_record.id AND cuota_numero = numero_cuota;

      IF monto_asignado IS NULL THEN
        -- Si no hay registro asignar todo el monto
        monto_asignado := 0;
      END IF;

      IF monto_asignado + monto_restante >= cuota_valor THEN
        -- La suma del monto asignado más el monto restante es suficiente para pagar una cuota
        INSERT INTO detalles_pago (pago_id, prestamo_id, cuota_numero, monto_aplicado)
        VALUES (NEW.id, prestamo_record.id, numero_cuota, cuota_valor - monto_asignado);
        monto_restante := monto_restante - (cuota_valor - monto_asignado);
      ELSE
        -- No hay suficiente dinero para completar una cuota
        INSERT INTO detalles_pago (pago_id, prestamo_id, cuota_numero, monto_aplicado)
        VALUES (NEW.id, prestamo_record.id, numero_cuota, monto_restante);
        monto_restante := 0;
      END IF;
      numero_cuota := numero_cuota + 1;
    END LOOP;

    -- Calcula cuotas_completas
    SELECT COUNT(*) INTO cuotas_completas
    FROM detalles_pago
    WHERE prestamo_id = prestamo_record.id AND monto_aplicado >= cuota_valor;

    -- calcula el saldo pendiente
    SELECT SUM(monto_aplicado) INTO saldo_pendiente FROM detalles_pago WHERE prestamo_id = prestamo_record.id;

    -- Si se completan todas las cuotas, actualizar estado a 'completado'
    IF saldo_pendiente >= prestamo_record.monto_total THEN
        UPDATE prestamos
        SET estado = 'completado', updated_at = NOW()
        WHERE id = prestamo_record.id;
    END IF;
    

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para insertar los detalles de pago cuando se registra un nuevo pago
CREATE TRIGGER insert_detalles_pago
AFTER INSERT ON pagos
FOR EACH ROW
EXECUTE FUNCTION insert_detalles_pago_and_update_prestamo();

-- Crear un índice para mejorar el rendimiento de las consultas por asesor_id en clientes
CREATE INDEX idx_clientes_asesor_id ON clientes(asesor_id);

-- Crear un índice para mejorar el rendimiento de las consultas por supervisor_id en usuarios
CREATE INDEX idx_usuarios_supervisor_id ON usuarios(supervisor_id);

-- Crear un índice para mejorar el rendimiento de las consultas por pago_id en detalles_pago
CREATE INDEX idx_detalles_pago_pago_id ON detalles_pago(pago_id);

-- Crear un índice para mejorar el rendimiento de las consultas por prestamo_id en detalles_pago
CREATE INDEX idx_detalles_pago_prestamo_id ON detalles_pago(prestamo_id);


