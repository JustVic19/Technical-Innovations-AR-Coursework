import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

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

// Auto-seed default users and mock data if database is completely empty
try {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const faultCount = db.prepare('SELECT COUNT(*) as count FROM faults').get().count;
  
  if (userCount === 0 || faultCount === 0) {
    console.log('🌱 Empty database detected! Inserting default data...');
    
    if (userCount === 0) {
      const insertUser = db.prepare(`
        INSERT INTO users (id, email, password_hash, full_name, role, employee_id, clearance_level, created_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `);
      
      insertUser.run(uuidv4(), 'admin@sentinel.local', bcrypt.hashSync('admin123', 10), 'Alex Morgan', 'admin', 'EMP-001', 'L4');
      insertUser.run(uuidv4(), 'supervisor@sentinel.local', bcrypt.hashSync('super123', 10), 'Jamie Chen', 'supervisor', 'EMP-002', 'L3');
      insertUser.run(uuidv4(), 'tech@sentinel.local', bcrypt.hashSync('tech123', 10), 'Sam Rivera', 'technician', 'EMP-003', 'L2');
    }

    if (faultCount === 0) {
      // Seed Sites
    const sites = [
      { id: uuidv4(), name: 'Kings Cross Station', code: 'KX-01', type: 'rail_station', zone: 'public', location: 'London' },
      { id: uuidv4(), name: 'Victoria Line Tunnel B', code: 'VL-TB', type: 'tunnel', zone: 'high_security', location: 'London' },
      { id: uuidv4(), name: 'Paddington Metro Hub', code: 'PM-01', type: 'metro_station', zone: 'restricted', location: 'London' },
    ];
    const insertSite = db.prepare(`INSERT INTO sites (id, name, code, type, zone, location, created_date) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`);
    sites.forEach(s => insertSite.run(s.id, s.name, s.code, s.type, s.zone, s.location));

    // Seed Faults
    const faults = [
      { title: 'Cracked platform edge tile', description: 'Visible crack spanning 1.2m along platform 3 edge.', category: 'structural_wear', severity: 'high', status: 'reported', site_id: sites[0].id },
      { title: 'Flickering signal lamp S-47', description: 'Intermittent flickering on signal lamp S-47 near junction point.', category: 'signalling', severity: 'critical', status: 'acknowledged', site_id: sites[0].id },
      { title: 'Ventilation fan bearing noise', description: 'Abnormal grinding noise from ventilation unit VF-03.', category: 'equipment_degradation', severity: 'medium', status: 'in_progress', site_id: sites[1].id, assigned_to: 'tech@sentinel.local' },
      { title: 'Rail stress fracture detected', description: 'Ultrasonic scan identified micro-fracture in rail section R-22.', category: 'material_stress', severity: 'critical', status: 'reported', site_id: sites[1].id, predicted_failure_days: 14 },
    ];
    const insertFault = db.prepare(`INSERT INTO faults (id, title, description, category, severity, status, site_id, assigned_to, approved_by, resolution_notes, predicted_failure_days, created_date, updated_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?), datetime('now'))`);
    faults.forEach((f, i) => insertFault.run(uuidv4(), f.title, f.description, f.category, f.severity, f.status, f.site_id, f.assigned_to || '', f.approved_by || '', f.resolution_notes || '', f.predicted_failure_days || null, `-${(faults.length - i) * 2} hours`));

    // Seed Tools
    const tools = [
      { tool_id: 'TL-001', name: 'Torque Wrench 1/2"', category: 'wrench', serial_number: 'TWR-2024-001', status: 'available', assigned_kit: 'KIT-A' },
      { tool_id: 'TL-002', name: 'Digital Multimeter', category: 'multimeter', serial_number: 'DMM-2024-005', status: 'in_use', assigned_kit: 'KIT-A', checked_out_by: 'tech@sentinel.local' },
      { tool_id: 'TL-004', name: 'Cable Cutter 500V', category: 'cutter', serial_number: 'CCT-2024-003', status: 'missing', assigned_kit: 'KIT-A' },
    ];
    const insertTool = db.prepare(`INSERT INTO tools (id, tool_id, name, category, serial_number, status, assigned_kit, checked_out_by, created_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`);
    tools.forEach(t => insertTool.run(uuidv4(), t.tool_id, t.name, t.category, t.serial_number, t.status, t.assigned_kit, t.checked_out_by || ''));
    }

    console.log('✅ Default data successfully inserted!');
  }
} catch (error) {
  console.error('Error auto-seeding data:', error);
}

export default db;
