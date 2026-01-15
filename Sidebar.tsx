
import React from 'react';
import { NavLink } from 'react-router-dom';
import { HomeIcon, CubeIcon, ShoppingCartIcon, CurrencyDollarIcon, DocumentReportIcon, BeakerIcon, LibraryIcon, UserGroupIcon, TruckIcon, UsersIcon, CogIcon, XIcon } from './Icons';

const navigationLinks = [
  { to: '/', text: 'الرئيسية', icon: <HomeIcon /> },
  { to: '/livestock', text: 'إدارة المواشي', icon: <UserGroupIcon /> },
  { to: '/cattle-breeds', text: 'أنواع الحيوانات', icon: <CubeIcon /> },
  { to: '/sales', text: 'المبيعات', icon: <ShoppingCartIcon /> },
  { to: '/expenses', text: 'المصروفات', icon: <CurrencyDollarIcon /> },
  { to: '/suppliers', text: 'الموردين', icon: <TruckIcon /> },
  { to: '/customers', text: 'العملاء', icon: <UsersIcon /> },
  { to: '/vaccinations', text: 'التحصينات', icon: <BeakerIcon /> },
  { to: '/treasury', text: 'الخزنة', icon: <LibraryIcon /> },
  { to: '/reports', text: 'التقارير', icon: <DocumentReportIcon /> },
  { to: '/mobile-sync', text: 'الإعدادات والدعم', icon: <CogIcon /> },
];

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const sidebarClasses = `fixed md:relative inset-y-0 right-0 z-40 w-64 bg-gray-800 text-white flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} md:translate-x-0`;

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden" onClick={() => setIsOpen(false)}></div>}
      <div className={sidebarClasses}>
        <div className="flex items-center justify-between h-20 border-b border-gray-700 px-4">
          <div className="flex items-center">
             <CubeIcon className="w-8 h-8 text-green-400"/>
             <span className="ms-3 text-2xl font-bold">مزرعة الأمل</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="md:hidden text-gray-400 hover:text-white">
              <XIcon />
          </button>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-2">
          {navigationLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `flex items-center px-4 py-2.5 text-sm font-medium rounded-md transition-colors duration-200 ${
                  isActive
                    ? 'bg-green-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`
              }
            >
              {link.icon}
              <span className="ms-3">{link.text}</span>
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-gray-700">
            <p className="text-xs text-gray-400 text-center">© 2026 مزرعة الأمل. تطوير: Ahmed Elnagar</p>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
