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
        role TEXT NOT NULL
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

    db.run("INSERT INTO hotels (name, city, min_price, role) VALUES ('Grand Hotel', 'Paris', 100, 'hotel')");
    db.run("INSERT INTO hotels (name, city, min_price, role) VALUES ('Luxury Inn', 'Paris', 150, 'hotel')");
    db.run("INSERT INTO hotels (name, city, min_price, role) VALUES ('Budget Stay', 'London', 80, 'hotel')");
    db.run("INSERT INTO hotels (name, city, min_price, role) VALUES ('City Center Hotel', 'London', 120, 'hotel')");

    console.log('Database created with seed data');
    saveDb();
  }

  return db;
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
