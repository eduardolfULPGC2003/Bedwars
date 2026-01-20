const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

/**
 * IMPORTANT:
 * - Do NOT write outside __dirname in Render
 * - Ensure binary-safe writes
 */

const DB_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DB_DIR, 'marketplace.db');

let db = null;

async function initDb() {
  const SQL = await initSqlJs();

  // Ensure DB directory exists
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR);
  }

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
    console.log('SQLite DB loaded from file');

    await migrateDatabase();
  } else {
    db = new SQL.Database();

    // Create tables
    db.run(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        role TEXT NOT NULL
      )
    `);

    db.run(`
      CREATE TABLE hotels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        city TEXT NOT NULL,
        min_price INTEGER NOT NULL,
        role TEXT NOT NULL,
        description TEXT,
        rating REAL DEFAULT 4.0,
        image_url TEXT,
        amenities TEXT,
        address TEXT,
        phone TEXT
      )
    `);

    db.run(`
      CREATE TABLE intentions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        city TEXT NOT NULL,
        check_in TEXT NOT NULL,
        check_out TEXT NOT NULL,
        max_price INTEGER NOT NULL,
        guests INTEGER DEFAULT 1,
        status TEXT NOT NULL DEFAULT 'active',
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    db.run(`
      CREATE TABLE offers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        intention_id INTEGER NOT NULL,
        hotel_id INTEGER NOT NULL,
        price INTEGER NOT NULL,
        extras TEXT,
        updates_count INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (intention_id) REFERENCES intentions(id),
        FOREIGN KEY (hotel_id) REFERENCES hotels(id),
        UNIQUE(intention_id, hotel_id)
      )
    `);

    // Seed data
    db.run("INSERT INTO users (name, role) VALUES ('John Doe', 'user')");
    db.run("INSERT INTO users (name, role) VALUES ('Jane Smith', 'user')");

    db.run(`
      INSERT INTO hotels (name, city, min_price, role, description, rating, image_url, amenities, address, phone)
      VALUES (
        'Grand Hotel',
        'Paris',
        100,
        'hotel',
        'Un elegante hotel en el corazón de París con vistas a la Torre Eiffel.',
        4.5,
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
        'WiFi gratis, Piscina, Gimnasio, Spa, Restaurante, Bar',
        '123 Rue de Rivoli, 75001 París, Francia',
        '+33 1 23 45 67 89'
      )
    `);

    db.run(`
      INSERT INTO hotels (name, city, min_price, role, description, rating, image_url, amenities, address, phone)
      VALUES (
        'Luxury Inn',
        'Paris',
        150,
        'hotel',
        'Hotel boutique de lujo cerca de los Campos Elíseos.',
        4.8,
        'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800',
        'WiFi gratis, Spa, Conserjería 24h',
        '45 Avenue des Champs-Élysées, 75008 París, Francia',
        '+33 1 98 76 54 32'
      )
    `);

    db.run(`
      INSERT INTO hotels (name, city, min_price, role, description, rating, image_url, amenities, address, phone)
      VALUES (
        'Budget Stay',
        'London',
        80,
        'hotel',
        'Hotel económico pero confortable en el centro de Londres.',
        4.0,
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
        'WiFi gratis, Desayuno incluido, Recepción 24h',
        '78 Oxford Street, London W1D 1BS, UK',
        '+44 20 1234 5678'
      )
    `);

    db.run(`
      INSERT INTO hotels (name, city, min_price, role, description, rating, image_url, amenities, address, phone)
      VALUES (
        'City Center Hotel',
        'London',
        120,
        'hotel',
        'Hotel moderno ubicado en pleno centro financiero de Londres.',
        4.3,
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
        'WiFi gratis, Gimnasio, Centro de negocios, Restaurante, Bar',
        '120 Baker Street, London NW1 5RT, UK',
        '+44 20 9876 5432'
      )
    `);

    console.log('SQLite DB created with seed data');
    saveDb();
  }

  return db;
}

async function migrateDatabase() {
  try {
    const intentionsInfo = db.exec("PRAGMA table_info(intentions)");
    const hasGuests = intentionsInfo[0]?.values.some(col => col[1] === 'guests');

    if (!hasGuests) {
      console.log('Migrating: adding guests column');
      db.run("ALTER TABLE intentions ADD COLUMN guests INTEGER DEFAULT 1");
      saveDb();
    }
  } catch (error) {
    console.error('Migration error:', error);
  }
}

function saveDb() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function query(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const result = [];
  while (stmt.step()) {
    result.push(stmt.getAsObject());
  }
  stmt.free();
  return result;
}

function run(sql, params = []) {
  db.run(sql, params);
  saveDb();
}

function get(sql, params = []) {
  const results = query(sql, params);
  return results.length > 0 ? results[0] : null;
}

function all(sql, params = []) {
  return query(sql, params);
}

module.exports = {
  initDb,
  run,
  get,
  all,
  saveDb
};

