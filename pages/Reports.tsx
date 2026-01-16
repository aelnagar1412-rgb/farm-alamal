
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

const monthlyProfitData = [
    { name: 'يناير', profit: 4000 },
    { name: 'فبراير', profit: 3000 },
    { name: 'مارس', profit: 5000 },
    { name: 'أبريل', profit: 4500 },
    { name: 'مايو', profit: 6000 },
    { name: 'يونيو', profit: 5500 },
];

const expenseCategoryData = [
    { name: 'أعلاف', value: 45 },
    { name: 'أدوية', value: 15 },
    { name: 'عمالة', value: 25 },
    { name: 'أخرى', value: 15 },
];


const Reports: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center no-print">
                 <h2 className="text-2xl font-bold text-gray-800">التقارير</h2>
                 <div className="space-x-2 space-x-reverse">
                    <button onClick={() => window.print()} className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700">
                        طباعة التقرير
                    </button>
                    <button onClick={() => alert('ميزة تصدير Excel قيد التطوير!')} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                        تصدير Excel
                    </button>
                     <button onClick={() => alert('ميزة تصدير PDF قيد التطوير!')} className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">
                        تصدير PDF
                    </button>
                 </div>
            </div>
           
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">الأرباح الشهرية</h3>
                     <div style={{direction: 'ltr'}} className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={monthlyProfitData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip formatter={(value: number) => `${value.toLocaleString()} ج.م`} />
                                <Legend />
                                <Line type="monotone" dataKey="profit" name="الأرباح" stroke="#16a34a" strokeWidth={2} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                 <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">تصنيف المصروفات (%)</h3>
                     <div style={{direction: 'ltr'}} className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={expenseCategoryData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis type="category" dataKey="name" width={80} />
                                <Tooltip formatter={(value: number) => `${value}%`} />
                                <Legend />
                                <Bar dataKey="value" name="النسبة المئوية" fill="#3b82f6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
