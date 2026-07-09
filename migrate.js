// migrate.js - Migrar datos desde JSON a PostgreSQL
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { query, getOne, initTables } = require('./db');
require('dotenv').config();

async function migrate() {
    console.log('🚀 Iniciando migración de datos a PostgreSQL...');

    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL no está configurada en .env');
        console.log('   Asegúrate de tener: DATABASE_URL=postgresql://...');
        process.exit(1);
    }

    await initTables();

    const DATA_DIR = path.join(__dirname, 'data');

    // 1. Migrar usuarios
    try {
        const usuariosPath = path.join(DATA_DIR, 'usuarios.json');
        if (fs.existsSync(usuariosPath)) {
            const usuarios = JSON.parse(fs.readFileSync(usuariosPath, 'utf8'));
            console.log(`📥 Insertando ${usuarios.length} usuarios...`);
            let count = 0;
            for (const u of usuarios) {
                const exists = await getOne('SELECT id FROM usuarios WHERE username = $1', [u.username]);
                if (!exists) {
                    let passwordHash = u.password;
                    if (!passwordHash.startsWith('$2a$') && !passwordHash.startsWith('$2b$')) {
                        passwordHash = await bcrypt.hash(passwordHash, 10);
                    }
                    await query(
                        `INSERT INTO usuarios (username, password_hash, name, email, role, created_at)
                         VALUES ($1, $2, $3, $4, $5, $6)`,
                        [u.username, passwordHash, u.name, u.email || '', u.role || 'user', u.fecha || new Date()]
                    );
                    count++;
                }
            }
            console.log(`✅ ${count} usuarios migrados.`);
        }
    } catch (error) {
        console.error('❌ Error migrando usuarios:', error);
    }

    // 2. Migrar productos
    try {
        const productosPath = path.join(DATA_DIR, 'productos.json');
        if (fs.existsSync(productosPath)) {
            const productos = JSON.parse(fs.readFileSync(productosPath, 'utf8'));
            console.log(`📥 Insertando ${productos.length} productos...`);
            let count = 0;
            for (const p of productos) {
                const exists = await getOne('SELECT id FROM productos WHERE name = $1', [p.name]);
                if (!exists) {
                    await query(
                        `INSERT INTO productos (name, category, price, description, stock, image, feat, available, created_at)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                        [
                            p.name,
                            p.category || 'medicamento',
                            p.price,
                            p.desc || '',
                            p.stock || 0,
                            p.image || 'https://via.placeholder.com/300x200',
                            p.feat ? 1 : 0,
                            p.available !== undefined ? (p.available ? 1 : 0) : 1,
                            p.fechaCreacion || new Date()
                        ]
                    );
                    count++;
                }
            }
            console.log(`✅ ${count} productos migrados.`);
        }
    } catch (error) {
        console.error('❌ Error migrando productos:', error);
    }

    // 3. Migrar pedidos
    try {
        const pedidosPath = path.join(DATA_DIR, 'pedidos.json');
        if (fs.existsSync(pedidosPath)) {
            const pedidos = JSON.parse(fs.readFileSync(pedidosPath, 'utf8'));
            console.log(`📥 Insertando ${pedidos.length} pedidos...`);
            let count = 0;
            for (const p of pedidos) {
                const exists = await getOne('SELECT id FROM pedidos WHERE id = $1', [p.id]);
                if (!exists) {
                    await query(
                        `INSERT INTO pedidos (id, usuario, email, items, total, estado, created_at)
                         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                        [
                            p.id,
                            p.usuario || 'anonimo',
                            p.email || 'no-email',
                            JSON.stringify(p.items || []),
                            p.total || 0,
                            p.estado || 'pendiente',
                            p.fecha || new Date()
                        ]
                    );
                    count++;
                }
            }
            console.log(`✅ ${count} pedidos migrados.`);
        }
    } catch (error) {
        console.error('❌ Error migrando pedidos:', error);
    }

    console.log('🎉 Migración completada.');
    process.exit(0);
}

migrate();