import fs from 'fs';
import path from 'path';

const csvPath = path.resolve('data-pipeline/maintenance_dataset.csv');
const outPath = path.resolve('src/data/analytics.json');

const csvData = fs.readFileSync(csvPath, 'utf8');
const lines = csvData.trim().split('\n');
const headers = lines[0].split(',');

const data = lines.slice(1).map(line => {
  const values = line.split(',');
  const obj = {};
  headers.forEach((h, i) => {
    obj[h] = values[i];
  });
  return obj;
});

// Analytics Logic
let total_risk = 0;
let open_faults = 0;
let closed_faults = 0;
const fault_types = {};
let total_resolution_days = 0;
let resolved_count = 0;
const risk_by_area = {};
let most_likely_severity = 'Medium';
const severity_counts = {};
const high_risk_faults = [];
const faults_by_weather = {};
const faults_by_status = {};
const faults_by_area = {};
const engineer_workload = {};
const resolution_by_engineer = {};
let resolved_within_target = 0;
let overdue_high_risk_count = 0;

data.forEach(row => {
  const risk = parseFloat(row.risk_score) || 0;
  total_risk += risk;
  
  if (row.status === 'Open' || row.status === 'In Progress') {
    open_faults++;
    if (risk >= 80) overdue_high_risk_count++;
  } else if (row.status === 'Closed') {
    closed_faults++;
    const days = parseFloat(row.days_to_resolve) || 0;
    total_resolution_days += days;
    resolved_count++;
    if (days <= 5) resolved_within_target++;
  }

  fault_types[row.fault_type] = (fault_types[row.fault_type] || 0) + 1;
  severity_counts[row.severity] = (severity_counts[row.severity] || 0) + 1;
  faults_by_weather[row.weather_condition] = (faults_by_weather[row.weather_condition] || 0) + 1;
  faults_by_status[row.status] = (faults_by_status[row.status] || 0) + 1;
  faults_by_area[row.asset_area] = (faults_by_area[row.asset_area] || 0) + 1;
  engineer_workload[row.assigned_engineer] = (engineer_workload[row.assigned_engineer] || 0) + 1;

  if (!risk_by_area[row.asset_area]) risk_by_area[row.asset_area] = { sum: 0, count: 0 };
  risk_by_area[row.asset_area].sum += risk;
  risk_by_area[row.asset_area].count++;

  if (row.status === 'Closed') {
    if (!resolution_by_engineer[row.assigned_engineer]) resolution_by_engineer[row.assigned_engineer] = { sum: 0, count: 0 };
    resolution_by_engineer[row.assigned_engineer].sum += parseFloat(row.days_to_resolve) || 0;
    resolution_by_engineer[row.assigned_engineer].count++;
  }

  if (risk >= 80) {
    high_risk_faults.push({
      fault_id: row.fault_id,
      fault_type: row.fault_type,
      location: row.location,
      asset_area: row.asset_area,
      risk_score: risk,
      status: row.status
    });
  }
});

high_risk_faults.sort((a, b) => b.risk_score - a.risk_score);

const most_common_fault = Object.keys(fault_types).reduce((a, b) => fault_types[a] > fault_types[b] ? a : b);
most_likely_severity = Object.keys(severity_counts).reduce((a, b) => severity_counts[a] > severity_counts[b] ? a : b);

const average_risk_by_area = {};
let highest_risk_area = '';
let highest_risk_val = 0;
for (const [area, stats] of Object.entries(risk_by_area)) {
  const avg = stats.sum / stats.count;
  average_risk_by_area[area] = Math.round(avg * 100) / 100;
  if (avg > highest_risk_val) {
    highest_risk_val = avg;
    highest_risk_area = area;
  }
}

const average_resolution_by_engineer = {};
for (const [eng, stats] of Object.entries(resolution_by_engineer)) {
  average_resolution_by_engineer[eng] = Math.round((stats.sum / stats.count) * 100) / 100;
}

const dashboard_data = {
  total_faults: data.length,
  average_risk_score: Math.round((total_risk / data.length) * 100) / 100,
  open_faults,
  closed_faults,
  open_fault_percentage: Math.round((open_faults / data.length) * 100),
  most_common_fault,
  average_resolution_days: resolved_count ? Math.round((total_resolution_days / resolved_count) * 100) / 100 : 0,
  highest_risk_area,
  most_likely_severity,
  high_risk_count: high_risk_faults.length,
  overdue_high_risk_count,
  resolved_within_target_percentage: resolved_count ? Math.round((resolved_within_target / resolved_count) * 100) : 0,
  severity_distribution: severity_counts,
  faults_by_weather,
  faults_by_status,
  faults_by_area,
  average_risk_by_area,
  engineer_workload,
  average_resolution_by_engineer,
  recent_high_risk_faults: high_risk_faults.slice(0, 5)
};

fs.writeFileSync(outPath, JSON.stringify(dashboard_data, null, 2));
console.log('✅ Generated analytics.json');
