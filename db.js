// db.js - Conexión y operaciones con PostgreSQL
const { Pool } = require('pg');
require('dotenv').config();

// Crear pool de conexiones
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Función para ejecutar consultas
async function query(text, params = []) {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log(`✅ Consulta ejecutada: ${duration}ms`);
        return res;
    } catch (error) {
        console.error('❌ Error en consulta:', error);
        throw error;
    }
}

// Función para obtener un solo registro
async function getOne(text, params = []) {
    const res = await query(text, params);
    return res.rows[0] || null;
}

// Función para obtener todos los registros
async function getAll(text, params = []) {
    const res = await query(text, params);
    return res.rows;
}

// Inicializar tablas
async function initTables() {
    const createTables = `
        -- Tabla de usuarios
        CREATE TABLE IF NOT EXISTS usuarios (
            id SERIAL PRIMARY KEY,
            username VARCHAR(100) UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name VARCHAR(200) NOT NULL,
            email VARCHAR(200),
            role VARCHAR(20) DEFAULT 'user',
            refresh_token TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Tabla de productos
        CREATE TABLE IF NOT EXISTS productos (
            id SERIAL PRIMARY KEY,
            name VARCHAR(200) NOT NULL,
            category VARCHAR(50) NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            description TEXT,
            stock INTEGER DEFAULT 0,
            image TEXT,
            feat INTEGER DEFAULT 0,
            available INTEGER DEFAULT 1,
            created_by VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Tabla de pedidos
        CREATE TABLE IF NOT EXISTS pedidos (
            id VARCHAR(50) PRIMARY KEY,
            usuario VARCHAR(100) NOT NULL,
            email VARCHAR(200),
            items JSONB,
            total DECIMAL(10,2) NOT NULL,
            estado VARCHAR(20) DEFAULT 'pendiente',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Tabla de tokens invalidados
        CREATE TABLE IF NOT EXISTS tokens_invalidados (
            id SERIAL PRIMARY KEY,
            token TEXT NOT NULL,
            usuario VARCHAR(100) NOT NULL,
            invalidated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- 🔥 TABLA DE CONFIGURACIÓN (para tokens y otras configuraciones)
        CREATE TABLE IF NOT EXISTS config (
            key TEXT PRIMARY KEY,
            value TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Índices para mejorar rendimiento
        CREATE INDEX IF NOT EXISTS idx_usuarios_username ON usuarios(username);
        CREATE INDEX IF NOT EXISTS idx_productos_category ON productos(category);
        CREATE INDEX IF NOT EXISTS idx_pedidos_usuario ON pedidos(usuario);
    `;

    try {
        await pool.query(createTables);
        console.log('✅ Tablas creadas/verificadas en PostgreSQL');
        
        // Crear usuario admin por defecto si no existe
        const adminExists = await getOne('SELECT * FROM usuarios WHERE username = $1', ['root']);
        if (!adminExists) {
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('Root*4815162342+-', 10);
            await query(
                `INSERT INTO usuarios (username, password_hash, name, email, role) 
                 VALUES ($1, $2, $3, $4, $5)`,
                ['root', hashedPassword, 'Administrador', 'admin@meditech.com', 'admin']
            );
            console.log('✅ Usuario admin creado');
        }

        // 🔥 Insertar token de GitHub por defecto si no existe (opcional)
        const tokenExists = await getOne('SELECT key FROM config WHERE key = $1', ['github_token']);
        if (!tokenExists) {
            // No insertamos token por defecto, el admin lo configurará desde el panel
            console.log('ℹ️ Token de GitHub no configurado. Configúralo desde el Panel Admin → Configuración.');
        }
    } catch (error) {
        console.error('❌ Error al crear tablas:', error);
        throw error;
    }
}

module.exports = { query, getOne, getAll, initTables, pool };