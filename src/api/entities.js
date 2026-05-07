import { createEntity } from './client';

export const Fault = createEntity('faults');
export const Site = createEntity('sites');
export const Tool = createEntity('tools');
export const ToolCheck = createEntity('tool-checks');
export const AuditLog = createEntity('audit-logs');
export const User = {
  ...createEntity('users'),
  // Override create to use the /invite endpoint for user creation
  create: (data) => {
    return fetch('/api/users/invite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('sentinel_token')
          ? { Authorization: `Bearer ${localStorage.getItem('sentinel_token')}` }
          : {}),
      },
      body: JSON.stringify(data),
    }).then(r => {
      if (!r.ok) return r.json().then(d => { throw d; });
      return r.json();
    });
  },
};
