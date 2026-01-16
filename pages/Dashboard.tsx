
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import DashboardCard from '../components/DashboardCard';
import { CurrencyDollarIcon, UserGroupIcon, ShoppingCartIcon, BeakerIcon, CubeIcon } from '../components/Icons';
import api from '../services/api';
import { Animal, Expense, Sale } from '../types';

const Dashboard: React.FC = () => {
    const [animalCount, setAnimalCount] = useState(0);
    const [totalSales, setTotalSales] = useState(0);
    const [totalExpenses, setTotalExpenses] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            const animalData = await api.getAnimals();
            const salesData = await api.getSales();
            const expensesData = await api.getExpenses();

            setAnimalCount(animalData.filter(c => c.status === 'Available').length);
            setTotalSales(salesData.reduce((sum, sale) => sum + sale.price, 0));
            setTotalExpenses(expensesData.reduce((sum, expense) => sum + expense.amount, 0));
        };
        fetchData();
    }, []);
    
    const netProfit = totalSales - totalExpenses;

    const chartData = [
        { name: 'إحصائيات', المبيعات: totalSales, المصروفات: totalExpenses, "صافي الربح": netProfit },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <DashboardCard title="عدد المواشي الحالية" value={animalCount.toString()} icon={<UserGroupIcon className="w-8 h-8 text-blue-500" />} color="bg-blue-100" />
                <DashboardCard title="إجمالي المبيعات" value={`${totalSales.toLocaleString()} ج.م`} icon={<ShoppingCartIcon className="w-8 h-8 text-green-500" />} color="bg-green-100" />
                <DashboardCard title="إجمالي المصروفات" value={`${totalExpenses.toLocaleString()} ج.م`} icon={<CurrencyDollarIcon className="w-8 h-8 text-red-500" />} color="bg-red-100" />
                <DashboardCard title="صافي الربح" value={`${netProfit.toLocaleString()} ج.م`} icon={<CurrencyDollarIcon className="w-8 h-8 text-yellow-500" />} color="bg-yellow-100" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">ملخص مالي</h3>
                    <div style={{direction: 'ltr'}} className="h-80">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip formatter={(value: number) => `${value.toLocaleString()} ج.م`} />
                                <Legend />
                                <Bar dataKey="المبيعات" fill="#4ade80" />
                                <Bar dataKey="المصروفات" fill="#f87171" />
                                <Bar dataKey="صافي الربح" fill="#facc15" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                 <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">تنبيهات هامة</h3>
                    <ul className="space-y-4">
                        <li className="flex items-start">
                            <div className="bg-red-100 p-2 rounded-full me-3 mt-1">
                                <BeakerIcon className="w-5 h-5 text-red-500" />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-700">تحصين قادم</p>
                                <p className="text-sm text-gray-500">
                                    موعد تحصين جدري الأغنام للحيوان <span className="font-bold">A-003</span> بعد 15 يوم.
                                </p>
                            </div>
                        </li>
                         <li className="flex items-start">
                             <div className="bg-yellow-100 p-2 rounded-full me-3 mt-1">
                                 <CubeIcon className="w-5 h-5 text-yellow-500" />
                             </div>
                             <div>
                                <p className="font-semibold text-gray-700">نفاد المخزون</p>
                                <p className="text-sm text-gray-500">
                                    مخزون الأعلاف على وشك النفاد. الكمية المتبقية تكفي لـ 5 أيام فقط.
                                </p>
                             </div>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
