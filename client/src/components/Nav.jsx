import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Users, Home, BookOpen, Bell, Settings, LogOut, Heart, Menu, X, MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { api } from "../api";
import toast from "react-hot-toast";
import logo from "../backround/logo.png";

export default function Nav() {
  const { user, logout, token } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  
  // Fetch unread notification count
  useEffect(() => {
    if (token) {
      const fetchUnread = () => {
        api.get("/notifications")
          .then(res => {
            const unread = res.data.filter(n => !n.read).length;
            setUnreadCount(unread);
          })
          .catch(() => setUnreadCount(0));
        
        // Fetch unread messages count
        api.get("/messages/unread/count")
          .then(res => setUnreadMessages(res.data.count))
          .catch(() => setUnreadMessages(0));
      };
      fetchUnread();
      // Poll every 30 seconds for new notifications
      const interval = setInterval(fetchUnread, 30000);
      return () => clearInterval(interval);
    }
  }, [token, location.pathname]);
  
  // Don't show nav on login/register pages
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/circles', label: 'Circles', icon: Users },
    { path: '/journal', label: 'Journal', icon: BookOpen },
    { path: '/mood', label: 'Mood', icon: Heart },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden mr-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {sidebarOpen ? <X className="w-5 h-5 text-gray-600" /> : <Menu className="w-5 h-5 text-gray-600" />}
              </button>
              <Link to="/" className="flex items-center">
                <img src={logo} alt="MindBridge" className="w-9 h-9 rounded-lg mr-3 object-cover" />
                <span className="text-xl font-semibold text-gray-900">
                  MindBridge
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {token && navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.label}
                  {item.badge > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>

            <div className="flex items-center space-x-3">
              {token && (
                <Link to="/notifications" className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <Bell className="w-5 h-5 text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </Link>
              )}
              {user ? (
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.displayName} className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      user.displayName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <button 
                    onClick={() => { logout(); toast.success("Signed out successfully"); nav("/login"); }}
                    className="hidden sm:flex items-center px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors text-sm font-medium"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign out
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link 
                    to="/login" 
                    className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link 
                    to="/register" 
                    className="btn text-sm"
                  >
                    Get started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar */}
      {sidebarOpen && token && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="fixed inset-0 bg-black/20" onClick={() => setSidebarOpen(false)}></div>
          <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
            <nav className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.label}
                </Link>
              ))}
              <hr className="my-3 border-gray-200" />
              <button
                onClick={() => { logout(); toast.success("Signed out successfully"); nav("/login"); setSidebarOpen(false); }}
                className="w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Sign out
              </button>
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}