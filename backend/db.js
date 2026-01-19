const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'marketplace.db');

let db = null;

async function initDb() {
  const SQL = await initSqlJs();

  // Load existing database or create new one
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);

    // Check if we need to migrate the database
    await migrateDatabase();
  } else {
    db = new SQL.Database();

    // Create tables with new schema
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

    db.run(`INSERT INTO hotels (name, city, min_price, role, description, rating, image_url, amenities, address, phone)
            VALUES ('Grand Hotel', 'Paris', 100, 'hotel',
            'Un elegante hotel en el corazón de París con vistas a la Torre Eiffel. Habitaciones espaciosas y servicio de primera clase.',
            4.5, 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
            'WiFi gratis, Piscina, Gimnasio, Spa, Restaurante, Bar',
            '123 Rue de Rivoli, 75001 París, Francia',
            '+33 1 23 45 67 89')`);

    db.run(`INSERT INTO hotels (name, city, min_price, role, description, rating, image_url, amenities, address, phone)
            VALUES ('Luxury Inn', 'Paris', 150, 'hotel',
            'Hotel boutique de lujo cerca de los Campos Elíseos. Diseño moderno y atención personalizada.',
            4.8, 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800',
            'WiFi gratis, Spa, Conserjería 24h, Desayuno gourmet, Traslado aeropuerto',
            '45 Avenue des Champs-Élysées, 75008 París, Francia',
            '+33 1 98 76 54 32')`);

    db.run(`INSERT INTO hotels (name, city, min_price, role, description, rating, image_url, amenities, address, phone)
            VALUES ('Budget Stay', 'London', 80, 'hotel',
            'Hotel económico pero confortable en el centro de Londres. Perfecto para viajeros con presupuesto ajustado.',
            4.0, 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
            'WiFi gratis, Desayuno incluido, Recepción 24h',
            '78 Oxford Street, London W1D 1BS, UK',
            '+44 20 1234 5678')`);

    db.run(`INSERT INTO hotels (name, city, min_price, role, description, rating, image_url, amenities, address, phone)
            VALUES ('City Center Hotel', 'London', 120, 'hotel',
            'Hotel moderno ubicado en pleno centro financiero de Londres. Ideal para viajes de negocios y turismo.',
            4.3, 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
            'WiFi gratis, Gimnasio, Centro de negocios, Restaurante, Bar',
            '120 Baker Street, London NW1 5RT, UK',
            '+44 20 9876 5432')`);

    console.log('Database created with seed data');
    saveDb();
  }

  return db;
}

async function migrateDatabase() {
  try {
    // Check if guests column exists in intentions table
    const intentionsInfo = db.exec("PRAGMA table_info(intentions)");
    const hasGuests = intentionsInfo[0]?.values.some(col => col[1] === 'guests');

    if (!hasGuests) {
      console.log('Migrating database: adding guests column to intentions');
      db.run("ALTER TABLE intentions ADD COLUMN guests INTEGER DEFAULT 1");
      saveDb();
    }

    // Check if new hotel columns exist
    const hotelsInfo = db.exec("PRAGMA table_info(hotels)");
    const hasDescription = hotelsInfo[0]?.values.some(col => col[1] === 'description');

    if (!hasDescription) {
      console.log('Migrating database: adding new columns to hotels');
      db.run("ALTER TABLE hotels ADD COLUMN description TEXT");
      db.run("ALTER TABLE hotels ADD COLUMN rating REAL DEFAULT 4.0");
      db.run("ALTER TABLE hotels ADD COLUMN image_url TEXT");
      db.run("ALTER TABLE hotels ADD COLUMN amenities TEXT");
      db.run("ALTER TABLE hotels ADD COLUMN address TEXT");
      db.run("ALTER TABLE hotels ADD COLUMN phone TEXT");

      // Update existing hotels with default data
      db.run(`UPDATE hotels SET
        description = 'Hotel de calidad con excelentes servicios y ubicación privilegiada.',
        rating = 4.0,
        image_url = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
        amenities = 'WiFi gratis, Recepción 24h',
        address = city || ', ' || name,
        phone = '+00 000 000 0000'
      WHERE description IS NULL`);

      saveDb();
    }
  } catch (error) {
    console.error('Migration error:', error);
  }
}

function saveDb() {
  if (db) {
    const data = db.export();
    fs.writeFileSync(DB_PATH, data);
  }
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
