import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, DollarSign, Settings, Wallet, Box, Search, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

const adminNavigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Inventory', href: '/admin/inventory', icon: Package },
  { name: 'Production', href: '/admin/production', icon: Box },
  { name: 'Salaries', href: '/admin/salaries', icon: Wallet },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

const employeeNavigation = [
  { name: 'Dashboard', href: '/employee/dashboard', icon: LayoutDashboard },
  { name: 'Production', href: '/employee/production', icon: Box },
  { name: 'Salary', href: '/employee/salary', icon: DollarSign }
];

interface SidebarProps {
  userType: 'admin' | 'employee';
}

const Sidebar = ({ userType }: SidebarProps) => {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  const navigation = userType === 'admin' ? adminNavigation : employeeNavigation;

  // Filter navigation items based on search query
  const filteredNavigation = navigation.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogout = () => {
    const logoutEvent = new CustomEvent('logout');
    window.dispatchEvent(logoutEvent);
  };

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-64 border-r border-border/30 bg-background/80 backdrop-blur-sm flex flex-col h-full"
    >
      {/* Logo Section */}
      <div className="p-6 pb-4">
        <div className="flex items-center space-x-3">
          <motion.div
            className="h-12 w-12 rounded-xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 ring-2 ring-primary/20"
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <img
              src="/android-chrome-192x192.png"
              alt="Tess Foods Logo"
              className="h-10 w-10 object-cover" />
          </motion.div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Tess Foods
            </h1>
            <p className="text-xs text-muted-foreground capitalize">
              {userType} Portal
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 pb-4">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            type="search"
            placeholder="Search menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg bg-background pl-9 h-10 border-border/50 focus:border-primary/50 transition-colors" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {filteredNavigation.length > 0 ? (
            filteredNavigation.map((item, index) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;

              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ delay: index * 0.03 }}
                  className="relative"
                  layout
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNavItem"
                      className="absolute left-0 top-0 h-full w-1 bg-primary rounded-r-md"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }} />
                  )}
                  <Link
                    to={item.href}
                    className={cn(
                      'flex items-center px-4 py-3 text-sm font-medium rounded-lg mx-2 transition-all duration-200 group',
                      isActive
                        ? 'bg-primary/10 text-foreground font-semibold shadow-sm'
                        : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground hover:shadow-sm'
                    )}
                  >
                    <Icon className={cn(
                      "h-5 w-5 mr-3 transition-all duration-200",
                      isActive
                        ? 'text-primary scale-110'
                        : 'text-muted-foreground group-hover:scale-105'
                    )} />
                    <span>{item.name}</span>
                    {isActive && (
                      <motion.div
                        className="ml-auto h-2 w-2 rounded-full bg-primary"
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 2, repeat: Infinity }} />
                    )}
                  </Link>
                </motion.div>
              );
            })
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8 px-4"
            >
              <p className="text-sm text-muted-foreground">No results found</p>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <div className="p-4 border-t border-border/30 space-y-2">


        <motion.button
          onClick={handleLogout}
          className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-muted-foreground rounded-lg hover:bg-destructive/10 hover:text-destructive transition-all duration-200 group"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span>Log out</span>
          <LogOut className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
        </motion.button>
      </div>
    </motion.div>
  );
};

export default Sidebar;