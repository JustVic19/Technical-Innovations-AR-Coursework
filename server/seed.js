import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from './db.js';

console.log('🌱 Seeding SentinelAR database...\n');

// Clear existing data
db.exec(`
  DELETE FROM audit_logs;
  DELETE FROM tool_checks;
  DELETE FROM tools;
  DELETE FROM faults;
  DELETE FROM sites;
  DELETE FROM devices;
  DELETE FROM users;
`);

// ── Users ──────────────────────────────────────────────────
const users = [
  {
    id: uuidv4(),
    email: 'admin@sentinel.local',
    password_hash: bcrypt.hashSync('admin123', 10),
    full_name: 'Alex Morgan',
    role: 'admin',
    employee_id: 'EMP-001',
    clearance_level: 'L4',
  },
  {
    id: uuidv4(),
    email: 'supervisor@sentinel.local',
    password_hash: bcrypt.hashSync('super123', 10),
    full_name: 'Jamie Chen',
    role: 'supervisor',
    employee_id: 'EMP-002',
    clearance_level: 'L3',
  },
  {
    id: uuidv4(),
    email: 'tech@sentinel.local',
    password_hash: bcrypt.hashSync('tech123', 10),
    full_name: 'Sam Rivera',
    role: 'technician',
    employee_id: 'EMP-003',
    clearance_level: 'L2',
  },
];

const insertUser = db.prepare(`
  INSERT INTO users (id, email, password_hash, full_name, role, employee_id, clearance_level, created_date)
  VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
`);

for (const u of users) {
  insertUser.run(u.id, u.email, u.password_hash, u.full_name, u.role, u.employee_id, u.clearance_level);
}
console.log(`  ✓ ${users.length} users created`);

// ── Sites ──────────────────────────────────────────────────
const sites = [
  { id: uuidv4(), name: 'Kings Cross Station', code: 'KX-01', type: 'rail_station', zone: 'public', location: 'London' },
  { id: uuidv4(), name: 'Victoria Line Tunnel B', code: 'VL-TB', type: 'tunnel', zone: 'high_security', location: 'London' },
  { id: uuidv4(), name: 'Paddington Metro Hub', code: 'PM-01', type: 'metro_station', zone: 'restricted', location: 'London' },
  { id: uuidv4(), name: 'Waterloo Plant Room', code: 'WL-PR', type: 'plant_room', zone: 'restricted', location: 'London' },
  { id: uuidv4(), name: 'Clapham Tram Depot', code: 'CT-01', type: 'tram_depot', zone: 'restricted', location: 'London' },
];

const insertSite = db.prepare(`
  INSERT INTO sites (id, name, code, type, zone, location, created_date)
  VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
`);

for (const s of sites) {
  insertSite.run(s.id, s.name, s.code, s.type, s.zone, s.location);
}
console.log(`  ✓ ${sites.length} sites created`);

// ── Faults ─────────────────────────────────────────────────
const faults = [
  { title: 'Cracked platform edge tile', description: 'Visible crack spanning 1.2m along platform 3 edge. Potential trip hazard.', category: 'structural_wear', severity: 'high', status: 'reported', site_id: sites[0].id },
  { title: 'Flickering signal lamp S-47', description: 'Intermittent flickering on signal lamp S-47 near junction point.', category: 'signalling', severity: 'critical', status: 'acknowledged', site_id: sites[0].id },
  { title: 'Ventilation fan bearing noise', description: 'Abnormal grinding noise from ventilation unit VF-03 in tunnel section B.', category: 'equipment_degradation', severity: 'medium', status: 'in_progress', site_id: sites[1].id, assigned_to: 'tech@sentinel.local' },
  { title: 'Water ingress at joint 14', description: 'Minor water seepage observed at expansion joint 14. Monitoring required.', category: 'structural_wear', severity: 'low', status: 'reported', site_id: sites[1].id },
  { title: 'Escalator handrail tension', description: 'Handrail running slower than steps on escalator E2. Adjustment needed.', category: 'equipment_degradation', severity: 'medium', status: 'resolved', site_id: sites[2].id, assigned_to: 'tech@sentinel.local', approved_by: 'supervisor@sentinel.local', resolution_notes: 'Tension spring replaced and recalibrated.' },
  { title: 'Exposed cable conduit', description: 'Cable conduit cover missing in service corridor C. Electrical hazard.', category: 'electrical', severity: 'high', status: 'in_progress', site_id: sites[3].id, assigned_to: 'tech@sentinel.local' },
  { title: 'Rail stress fracture detected', description: 'Ultrasonic scan identified micro-fracture in rail section R-22.', category: 'material_stress', severity: 'critical', status: 'reported', site_id: sites[1].id, predicted_failure_days: 14 },
  { title: 'Emergency lighting fault', description: 'Battery backup unit BU-07 failed self-test. Emergency lights non-functional in zone 3.', category: 'electrical', severity: 'high', status: 'acknowledged', site_id: sites[4].id },
];

const insertFault = db.prepare(`
  INSERT INTO faults (id, title, description, category, severity, status, site_id, assigned_to, approved_by, resolution_notes, predicted_failure_days, created_date, updated_date)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?), datetime('now'))
`);

faults.forEach((f, i) => {
  insertFault.run(
    uuidv4(), f.title, f.description, f.category, f.severity, f.status,
    f.site_id, f.assigned_to || '', f.approved_by || '', f.resolution_notes || '',
    f.predicted_failure_days || null,
    // Stagger creation times so charts have variation
    `-${(faults.length - i) * 2} hours`
  );
});
console.log(`  ✓ ${faults.length} faults created`);

// ── Tools ──────────────────────────────────────────────────
const tools = [
  { tool_id: 'TL-001', name: 'Torque Wrench 1/2"', category: 'wrench', serial_number: 'TWR-2024-001', status: 'available', assigned_kit: 'KIT-A' },
  { tool_id: 'TL-002', name: 'Digital Multimeter', category: 'multimeter', serial_number: 'DMM-2024-005', status: 'in_use', assigned_kit: 'KIT-A', checked_out_by: 'tech@sentinel.local' },
  { tool_id: 'TL-003', name: 'LED Inspection Torch', category: 'torch', serial_number: 'TRC-2024-012', status: 'available', assigned_kit: 'KIT-B' },
  { tool_id: 'TL-004', name: 'Cable Cutter 500V', category: 'cutter', serial_number: 'CCT-2024-003', status: 'missing', assigned_kit: 'KIT-A' },
  { tool_id: 'TL-005', name: 'Impact Driver', category: 'drill', serial_number: 'IDR-2024-008', status: 'maintenance', assigned_kit: 'KIT-C' },
];

const insertTool = db.prepare(`
  INSERT INTO tools (id, tool_id, name, category, serial_number, status, assigned_kit, checked_out_by, created_date)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
`);

for (const t of tools) {
  insertTool.run(uuidv4(), t.tool_id, t.name, t.category, t.serial_number, t.status, t.assigned_kit, t.checked_out_by || '');
}
console.log(`  ✓ ${tools.length} tools created`);

// ── Tool Checks ────────────────────────────────────────────
const toolChecks = [
  { kit_id: 'KIT-A', site_id: sites[0].id, check_type: 'pre_job', expected_tools: ['TL-001','TL-002','TL-004'], scanned_tools: ['TL-001','TL-002'], missing_tools: ['TL-004'], result: 'fail', technician: 'tech@sentinel.local' },
  { kit_id: 'KIT-B', site_id: sites[2].id, check_type: 'post_job', expected_tools: ['TL-003'], scanned_tools: ['TL-003'], missing_tools: [], result: 'pass', technician: 'tech@sentinel.local' },
];

const insertCheck = db.prepare(`
  INSERT INTO tool_checks (id, kit_id, site_id, check_type, expected_tools, scanned_tools, missing_tools, extra_tools, result, technician, created_date)
  VALUES (?, ?, ?, ?, ?, ?, ?, '[]', ?, ?, datetime('now'))
`);

for (const c of toolChecks) {
  insertCheck.run(uuidv4(), c.kit_id, c.site_id, c.check_type,
    JSON.stringify(c.expected_tools), JSON.stringify(c.scanned_tools),
    JSON.stringify(c.missing_tools), c.result, c.technician);
}
console.log(`  ✓ ${toolChecks.length} tool checks created`);

// ── Audit Logs ─────────────────────────────────────────────
const logs = [
  { actor: 'admin@sentinel.local', actor_role: 'admin', action: 'login', details: 'Admin login from web client', severity: 'info' },
  { actor: 'tech@sentinel.local', actor_role: 'technician', action: 'fault_created', target_type: 'Fault', details: 'Created: Cracked platform edge tile', severity: 'info' },
  { actor: 'supervisor@sentinel.local', actor_role: 'supervisor', action: 'fault_updated', target_type: 'Fault', details: 'Acknowledged signal lamp fault', severity: 'info' },
  { actor: 'tech@sentinel.local', actor_role: 'technician', action: 'tool_check_run', target_type: 'ToolCheck', details: 'KIT-A pre-job check — FAIL (TL-004 missing)', severity: 'warning' },
  { actor: 'system', actor_role: 'system', action: 'anomaly_detected', target_type: 'Fault', details: 'ML model predicts rail fracture R-22 within 14 days', severity: 'critical' },
];

const insertLog = db.prepare(`
  INSERT INTO audit_logs (id, actor, actor_role, action, target_type, target_id, details, severity, created_date)
  VALUES (?, ?, ?, ?, ?, '', ?, ?, datetime('now', ?))
`);

logs.forEach((l, i) => {
  insertLog.run(uuidv4(), l.actor, l.actor_role, l.action, l.target_type || '', l.details, l.severity, `-${(logs.length - i) * 30} minutes`);
});
console.log(`  ✓ ${logs.length} audit log entries created`);

console.log('\n✅ Database seeded successfully!');
console.log('\n  Default login credentials:');
console.log('  ──────────────────────────');
console.log('  Admin:      admin@sentinel.local / admin123');
console.log('  Supervisor: supervisor@sentinel.local / super123');
console.log('  Technician: tech@sentinel.local / tech123\n');
