import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Home, Users, ShieldCheck, Wrench, Megaphone, CheckSquare, 
  Calendar, CreditCard, ShoppingBag, ShieldAlert, MessageSquare, 
  HelpCircle, Car, Folder, Info
} from 'lucide-react';

const Sidebar = () => {
  const { user } = useAuth();
  const roles = user?.roles?.map(r => r.name) || [];

  const getLinks = () => {
    const links = [];

    // Standard Dashboard Link
    links.push({ to: '/dashboard', label: 'Dashboard', icon: <Home size={18} /> });

    // Guard Portal Links
    if (roles.includes('SECURITY_GUARD')) {
      links.push({ to: '/guard', label: 'Gate Security', icon: <ShieldCheck size={18} /> });
    }

    // Resident and Family Member Links
    if (roles.includes('RESIDENT') || roles.includes('FAMILY_MEMBER')) {
      links.push({ to: '/visitors', label: 'Visitor Invites', icon: <ShieldCheck size={18} /> });
      links.push({ to: '/maintenance', label: 'Helpdesk Tickets', icon: <Wrench size={18} /> });
      links.push({ to: '/interactions', label: 'Interactions', icon: <Megaphone size={18} /> });
      links.push({ to: '/payments', label: 'Payments & Bills', icon: <CreditCard size={18} /> });
      links.push({ to: '/local-services', label: 'Local Services', icon: <Users size={18} /> });
      links.push({ to: '/marketplace', label: 'Marketplace', icon: <ShoppingBag size={18} /> });
      links.push({ to: '/parking', label: 'Vehicles & Slots', icon: <Car size={18} /> });
      links.push({ to: '/directory', label: 'Community Directory', icon: <Users size={18} /> });
      links.push({ to: '/chat', label: 'Messages Chat', icon: <MessageSquare size={18} /> });
    }

    // Service Provider Links
    if (roles.includes('SERVICE_PROVIDER')) {
      links.push({ to: '/provider-portal', label: 'Provider Portal', icon: <Wrench size={18} /> });
    }

    // Admin Links
    if (roles.includes('ASSOCIATION_ADMIN') || roles.includes('PLATFORM_ADMIN')) {
      links.push({ to: '/admin', label: 'Admin Center', icon: <ShieldAlert size={18} /> });
    }

    // Common Links
    links.push({ to: '/support', label: 'Help & Support', icon: <HelpCircle size={18} /> });

    return links;
  };

  const links = getLinks();

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-[calc(100vh-73px)] sticky top-[73px]">
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => 
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                isActive 
                  ? 'bg-green-50 text-green-700' 
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`
            }
          >
            {link.icon}
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-55 text-center text-xs text-gray-400 font-medium">
        ApartmentHub v1.0
      </div>
    </aside>
  );
};

export default Sidebar;
