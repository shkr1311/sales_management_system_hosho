import { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { cn, getInitials } from '@/lib/utils';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

import {
  LayoutDashboard, Users, UserPlus, Target, Calendar, GitBranch,
  TrendingUp, Map, BadgePercent, BarChart3, User, FileText,
  Megaphone, UserCheck, PieChart, FileEdit, Package, RefreshCw,
  MessageSquare, Lightbulb, BookOpen, LineChart, ChevronLeft,
  ChevronRight, LogOut, Bell, Search, Menu,
  Building2, ClipboardList, ShieldCheck, Star
} from 'lucide-react';

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  roles?: string[];
}

interface NavGroup {
  title: string;
  items: NavItem[];
  roles?: string[];
}

const navigation: NavGroup[] = [
  {
    title: '',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    ],
  },
  {
    title: 'Sales',
    items: [
      { label: 'Customers', icon: Building2, path: '/customers' },
      { label: 'Contacts', icon: Users, path: '/contacts' },
      { label: 'Leads', icon: UserPlus, path: '/leads' },
      { label: 'Opportunities', icon: Target, path: '/opportunities' },
      { label: 'Activities', icon: Calendar, path: '/activities' },
      { label: 'Pipeline', icon: GitBranch, path: '/pipeline' },
      { label: 'Targets', icon: TrendingUp, path: '/targets', roles: ['SALES_REP', 'SALES_MANAGER', 'EXECUTIVE'] },
    ],
  },
  {
    title: 'Management',
    roles: ['SALES_MANAGER', 'EXECUTIVE'],
    items: [
      { label: 'Team Performance', icon: Users, path: '/team-performance', roles: ['SALES_MANAGER', 'EXECUTIVE'] },
      { label: 'Territories', icon: Map, path: '/territories', roles: ['SALES_MANAGER', 'EXECUTIVE'] },
      { label: 'Discount Requests', icon: BadgePercent, path: '/discount-requests', roles: ['SALES_REP', 'SALES_MANAGER'] },
      { label: 'Forecast', icon: BarChart3, path: '/forecast', roles: ['SALES_MANAGER', 'EXECUTIVE'] },
    ],
  },
  {
    title: 'Accounts',
    roles: ['ACCOUNT_MANAGER', 'SALES_MANAGER', 'EXECUTIVE'],
    items: [
      { label: 'Customer 360', icon: User, path: '/customer-360', roles: ['ACCOUNT_MANAGER', 'SALES_MANAGER', 'EXECUTIVE'] },
      { label: 'Account Plans', icon: ClipboardList, path: '/account-plans', roles: ['ACCOUNT_MANAGER'] },
      { label: 'Satisfaction', icon: Star, path: '/satisfaction', roles: ['ACCOUNT_MANAGER'] },
      { label: 'Renewals', icon: RefreshCw, path: '/renewals', roles: ['ACCOUNT_MANAGER'] },
    ],
  },
  {
    title: 'Marketing',
    roles: ['MARKETING', 'SALES_MANAGER', 'EXECUTIVE'],
    items: [
      { label: 'Campaigns', icon: Megaphone, path: '/campaigns', roles: ['MARKETING', 'EXECUTIVE'] },
      { label: 'Qualified Leads', icon: UserCheck, path: '/qualified-leads', roles: ['MARKETING', 'SALES_MANAGER'] },
      { label: 'Customer Segments', icon: PieChart, path: '/segments', roles: ['MARKETING'] },
      { label: 'Content', icon: FileEdit, path: '/content', roles: ['MARKETING'] },
    ],
  },
  {
    title: 'Product',
    roles: ['PRODUCT_MANAGER', 'SALES_MANAGER', 'EXECUTIVE'],
    items: [
      { label: 'Products', icon: Package, path: '/products', roles: ['PRODUCT_MANAGER', 'SALES_REP', 'SALES_MANAGER'] },
      { label: 'Updates', icon: RefreshCw, path: '/product-updates', roles: ['PRODUCT_MANAGER'] },
      { label: 'Feedback', icon: MessageSquare, path: '/feedback', roles: ['PRODUCT_MANAGER', 'SALES_REP'] },
      { label: 'Feature Requests', icon: Lightbulb, path: '/feature-requests', roles: ['PRODUCT_MANAGER'] },
      { label: 'Documentation', icon: BookOpen, path: '/documentation', roles: ['PRODUCT_MANAGER'] },
    ],
  },
  {
    title: 'Executive',
    roles: ['EXECUTIVE', 'SALES_MANAGER'],
    items: [
      { label: 'Executive Analytics', icon: LineChart, path: '/executive', roles: ['EXECUTIVE', 'SALES_MANAGER'] },
    ],
  },
];

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isVisible = (roles?: string[]) => {
    if (!roles || roles.length === 0) return true;
    return hasRole(...roles);
  };

  const handleNavClick = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-gray-200 transition-all duration-300',
          collapsed ? 'w-16' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className={cn(
          'flex items-center h-16 px-4 border-b border-gray-200',
          collapsed ? 'justify-center' : 'gap-3'
        )}>
          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-bold">S</span>
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-sm font-semibold text-gray-900 truncate">Sales Management</h1>
              <p className="text-xs text-gray-500 truncate">Enterprise CRM</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {navigation.map((group, gi) => {
            if (!isVisible(group.roles)) return null;
            const visibleItems = group.items.filter((item) => isVisible(item.roles));
            if (visibleItems.length === 0) return null;

            return (
              <div key={gi} className="mb-3">
                {group.title && !collapsed && (
                  <p className="px-3 mb-1 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {group.title}
                  </p>
                )}
                {visibleItems.map((item) => {
                  const isActive = location.pathname === item.path || 
                    (item.path !== '/' && location.pathname.startsWith(item.path));
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNavClick(item.path)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5',
                        isActive
                          ? 'bg-slate-800 text-white'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                        collapsed && 'justify-center px-2'
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="hidden lg:flex items-center justify-center py-3 border-t border-gray-200">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg text-gray-400 hover:bg-gray-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 w-64">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent text-sm text-gray-600 placeholder-gray-400 outline-none w-full"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="h-6 w-px bg-gray-200"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                <span className="text-white text-xs font-medium">
                  {getInitials(user?.full_name)}
                </span>
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                <p className="text-xs text-gray-500">{user?.role?.name?.replace('_', ' ')}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
