
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { BellIcon, MenuIcon, XIcon } from './Icons';
import api from '../services/api';
import { Customer, Supplier } from '../types';

interface LayoutProps {
  children: React.ReactNode;
}

interface Notification {
    id: string;
    message: string;
    link: string;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const CUSTOMER_BALANCE_THRESHOLD = 10000;
  const SUPPLIER_BALANCE_THRESHOLD = 5000;

  useEffect(() => {
    const checkBalances = async () => {
        const [customers, suppliers] = await Promise.all([api.getCustomers(), api.getSuppliers()]);
        
        const customerNotifications = customers
            .filter(c => c.remaining > CUSTOMER_BALANCE_THRESHOLD)
            .map(c => ({
                id: `cust-alert-${c.id}`,
                message: `العميل ${c.name} لديه رصيد متبقٍ كبير: ${c.remaining.toLocaleString()} ج.م`,
                link: '/customers'
            }));
            
        const supplierNotifications = suppliers
            .filter(s => s.remaining > SUPPLIER_BALANCE_THRESHOLD)
            .map(s => ({
                id: `supp-alert-${s.id}`,
                message: `المورد ${s.name} لديه رصيد مستحق: ${s.remaining.toLocaleString()} ج.م`,
                link: '/suppliers'
            }));

        setNotifications([...customerNotifications, ...supplierNotifications]);
    };

    checkBalances();
  }, []);
  
  // Close mobile sidebar on route change
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
            setIsNotificationsOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex justify-between items-center p-4 bg-white border-b">
          <div className="flex items-center">
             <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600 md:hidden me-4">
                 <MenuIcon />
             </button>
             <h1 className="text-lg md:text-xl font-bold text-gray-800">نظام إدارة مزرعة الأمل</h1>
          </div>
         
          <div className="flex items-center gap-4 md:gap-6">
            <div className="relative" ref={notificationRef}>
                 <button
                    onClick={() => setIsNotificationsOpen(prev => !prev)}
                    className="text-gray-600 hover:text-gray-800 relative"
                    aria-label="الإشعارات"
                >
                    <BellIcon className="w-6 h-6" />
                    {notifications.length > 0 && (
                        <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                            {notifications.length}
                        </span>
                    )}
                </button>
                 {isNotificationsOpen && (
                    <div className="absolute left-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-20">
                        <div className="p-3 border-b font-bold text-gray-700">الإشعارات</div>
                        <ul className="py-2 max-h-80 overflow-y-auto">
                            {notifications.length > 0 ? (
                                notifications.map(notif => (
                                    <li key={notif.id}>
                                        <Link 
                                            to={notif.link}
                                            className="block px-4 py-3 text-sm text-gray-600 hover:bg-gray-100"
                                            onClick={() => setIsNotificationsOpen(false)}
                                        >
                                           <span className="font-bold text-red-600">تنبيه:</span> {notif.message}
                                        </Link>
                                    </li>
                                ))
                            ) : (
                                <li className="px-4 py-3 text-sm text-gray-500">لا توجد إشعارات جديدة.</li>
                            )}
                        </ul>
                    </div>
                 )}
            </div>
            <span className="hidden sm:block text-gray-600">أهلاً، مدير المزرعة</span>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
