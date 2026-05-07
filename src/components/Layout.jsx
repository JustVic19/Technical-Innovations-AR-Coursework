import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import {
  LayoutDashboard, AlertTriangle, ScanLine, Wrench, MapPin,
  Shield, Users, LogOut, Menu, X, Activity, Radio
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROLE_LABELS, can } from '@/lib/permissions';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { to: '/', label: 'Operations', icon: LayoutDashboard, allow: () => true },
  { to: '/faults', label: 'Faults', icon: AlertTriangle, allow: () => true },
  { to: '/ar', label: 'AR Field View', icon: ScanLine, allow: () => true },
  { to: '/tools', label: 'Tools & Kits', icon: Wrench, allow: () => true },
  { to: '/sites', label: 'Sites', icon: MapPin, allow: () => true },
  { to: '/audit', label: 'Audit Log', icon: Shield, allow: can.viewAuditLog },
  { to: '/admin', label: 'Admin', icon: Users, allow: can.manageUsers },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => { setOpen(false); }, [location.pathname]);

  if (!user) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-mono">Loading</div>
        </div>
      </div>
    );
  }

  const visibleNav = navItems.filter(n => n.allow(user));

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-card/40 backdrop-blur-sm fixed h-full z-30">
        <SidebarContent user={user} visibleNav={visibleNav} onLogout={handleLogout} />
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-40 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <BrandMark />
            <span className="font-display font-bold tracking-wide">SentinelAR</span>
          </div>
          <button onClick={() => setOpen(!open)} className="p-2">
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="lg:hidden fixed top-14 left-0 bottom-0 w-72 bg-card border-r border-border z-40"
          >
            <SidebarContent user={user} visibleNav={visibleNav} onLogout={handleLogout} />
          </motion.aside>
        )}
      </AnimatePresence>

      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0 min-h-screen">
        <Outlet context={{ user }} />
      </main>
    </div>
  );
}

function BrandMark() {
  return (
    <div className="relative w-8 h-8 rounded-md bg-gradient-to-br from-primary to-amber-600 flex items-center justify-center shadow-lg shadow-primary/20">
      <Radio className="w-4 h-4 text-background" strokeWidth={2.5} />
      <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full pulse-ring" />
    </div>
  );
}

function SidebarContent({ user, visibleNav, onLogout }) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 border-b border-border hidden lg:flex items-center gap-3">
        <BrandMark />
        <div>
          <div className="font-display font-bold text-lg tracking-wide leading-none">SentinelAR</div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-mono mt-1">
            Maintenance OS
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <div className="px-2 mb-2 text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-mono">
          Console
        </div>
        {visibleNav.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all ${
                isActive
                  ? 'bg-primary/10 text-primary border-l-2 border-primary pl-[10px]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
              }`
            }
          >
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-border">
        <div className="px-2 py-2 mb-2">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-mono">Online</span>
          </div>
          <div className="text-sm font-medium truncate">{user.full_name}</div>
          <div className="text-xs text-muted-foreground truncate">{user.email}</div>
          <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
            <Shield className="w-3 h-3" />
            {ROLE_LABELS[user.role] || user.role}
          </div>
        </div>
        <Button
          variant="ghost" size="sm"
          className="w-full justify-start text-muted-foreground"
          onClick={onLogout}
        >
          <LogOut className="w-4 h-4 mr-2" /> Sign out
        </Button>
      </div>
    </div>
  );
}