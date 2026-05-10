import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'sentinel.db');

const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create all tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT 'technician' CHECK(role IN ('admin','supervisor','technician')),
    employee_id TEXT DEFAULT '',
    clearance_level TEXT DEFAULT 'L1' CHECK(clearance_level IN ('L1','L2','L3','L4')),
    assigned_site_ids TEXT DEFAULT '[]',
    device_id TEXT DEFAULT '',
    active INTEGER DEFAULT 1,
    created_date TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sites (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('rail_station','metro_station','tram_depot','bus_depot','tunnel','service_corridor','plant_room')),
    zone TEXT DEFAULT 'restricted' CHECK(zone IN ('public','restricted','high_security')),
    location TEXT DEFAULT '',
    schematic_url TEXT DEFAULT '',
    active INTEGER DEFAULT 1,
    created_date TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS faults (
    id TEXT PRIMARY KEY,
    marker_id TEXT DEFAULT '',
    site_id TEXT DEFAULT '',
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT NOT NULL CHECK(category IN ('structural_wear','material_stress','electrical','signalling','equipment_degradation','other')),
    severity TEXT DEFAULT 'medium' CHECK(severity IN ('low','medium','high','critical')),
    status TEXT DEFAULT 'reported' CHECK(status IN ('reported','acknowledged','in_progress','resolved','rejected')),
    position TEXT DEFAULT '{}',
    ar_anchor TEXT DEFAULT '{}',
    image_url TEXT DEFAULT '',
    annotations TEXT DEFAULT '[]',
    assigned_to TEXT DEFAULT '',
    approved_by TEXT DEFAULT '',
    resolution_notes TEXT DEFAULT '',
    predicted_failure_days REAL DEFAULT NULL,
    created_date TEXT DEFAULT (datetime('now')),
    updated_date TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tools (
    id TEXT PRIMARY KEY,
    tool_id TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('wrench','spanner','hammer','screwdriver','pliers','multimeter','torch','drill','cutter','other')),
    serial_number TEXT DEFAULT '',
    status TEXT DEFAULT 'available' CHECK(status IN ('available','checked_out','in_use','missing','maintenance')),
    assigned_kit TEXT DEFAULT '',
    checked_out_by TEXT DEFAULT '',
    checked_out_at TEXT DEFAULT '',
    image_url TEXT DEFAULT '',
    created_date TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tool_checks (
    id TEXT PRIMARY KEY,
    kit_id TEXT NOT NULL,
    site_id TEXT DEFAULT '',
    check_type TEXT DEFAULT 'pre_job' CHECK(check_type IN ('pre_job','post_job')),
    expected_tools TEXT DEFAULT '[]',
    scanned_tools TEXT DEFAULT '[]',
    missing_tools TEXT DEFAULT '[]',
    extra_tools TEXT DEFAULT '[]',
    result TEXT DEFAULT 'pass' CHECK(result IN ('pass','fail','warning')),
    technician TEXT DEFAULT '',
    fault_id TEXT DEFAULT '',
    created_date TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    actor TEXT NOT NULL,
    actor_role TEXT DEFAULT '',
    action TEXT NOT NULL,
    target_type TEXT DEFAULT '',
    target_id TEXT DEFAULT '',
    details TEXT DEFAULT '',
    ip_address TEXT DEFAULT '',
    device_id TEXT DEFAULT '',
    severity TEXT DEFAULT 'info' CHECK(severity IN ('info','warning','critical')),
    created_date TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS devices (
    id TEXT PRIMARY KEY,
    device_id TEXT NOT NULL,
    label TEXT DEFAULT '',
    type TEXT NOT NULL CHECK(type IN ('mobile','tablet','headset','desktop')),
    owner TEXT DEFAULT '',
    status TEXT DEFAULT 'pending' CHECK(status IN ('trusted','pending','revoked')),
    last_seen TEXT DEFAULT '',
    fingerprint TEXT DEFAULT '',
    created_date TEXT DEFAULT (datetime('now'))
  );
`);

export default db;
