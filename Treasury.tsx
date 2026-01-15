
import React, { useEffect, useState } from 'react';
import { TreasuryEntry } from '../types';
import api from '../services/api';
import { PencilIcon } from '../components/Icons';

const Treasury: React.FC = () => {
    const [entries, setEntries] = useState<TreasuryEntry[]>([]);
    const [openingBalance, setOpeningBalance] = useState<number>(0);
    const [currentBalance, setCurrentBalance] = useState<number>(0);
    const [isEditingBalance, setIsEditingBalance] = useState(false);
    const [tempBalance, setTempBalance] = useState<string>('0');

    const fetchData = async () => {
        const [data, initialBalance] = await Promise.all([
            api.getTreasuryEntries(),
            api.getOpeningBalance()
        ]);

        const sortedData = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setEntries(sortedData);
        setOpeningBalance(initialBalance);
        setTempBalance(String(initialBalance));

        const calculatedBalance = data.reduce((acc, entry) => {
            return entry.type === 'وارد' ? acc + entry.amount : acc - entry.amount;
        }, initialBalance);
        setCurrentBalance(calculatedBalance);
    };
    
    useEffect(() => {
        fetchData();
    }, []);

    const handleSaveOpeningBalance = async () => {
        const newBalance = Number(tempBalance);
        if (!isNaN(newBalance)) {
            await api.saveOpeningBalance(newBalance);
            // After saving, re-fetch data to ensure consistency and recalculate balance
            fetchData();
            setIsEditingBalance(false);
        } else {
            alert('يرجى إدخال مبلغ صحيح.');
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4 border-b pb-4 flex-wrap gap-4">
                <h2 className="text-xl font-bold text-gray-800">حركة الخزنة</h2>
                <div className="flex items-center gap-4">
                    <div className="text-left">
                        <p className="text-sm text-gray-500">رصيد أول المدة</p>
                        {isEditingBalance ? (
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number"
                                    value={tempBalance}
                                    onChange={(e) => setTempBalance(e.target.value)}
                                    className="p-1 border rounded-md w-32 text-lg font-bold"
                                />
                                <button onClick={handleSaveOpeningBalance} className="px-3 py-1 bg-green-600 text-white rounded-md text-sm">حفظ</button>
                                <button onClick={() => { setIsEditingBalance(false); setTempBalance(String(openingBalance)); }} className="px-3 py-1 bg-gray-200 rounded-md text-sm">إلغاء</button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <p className="text-lg font-bold text-gray-800">{openingBalance.toLocaleString()} ج.م</p>
                                <button onClick={() => setIsEditingBalance(true)} className="text-gray-500 hover:text-blue-600"><PencilIcon /></button>
                            </div>
                        )}
                    </div>
                    <div className="text-left p-4 rounded-lg bg-green-50 border border-green-200">
                        <p className="text-sm text-green-700">الرصيد الحالي</p>
                        <p className="text-2xl font-bold text-green-800">{currentBalance.toLocaleString()} ج.م</p>
                    </div>
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                    <thead className="bg-gray-200">
                        <tr>
                            <th className="py-2 px-4 border-b">التاريخ</th>
                            <th className="py-2 px-4 border-b">البيان</th>
                            <th className="py-2 px-4 border-b">وارد</th>
                            <th className="py-2 px-4 border-b">منصرف</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entries.map((entry) => (
                            <tr key={entry.id} className="text-center hover:bg-gray-50">
                                <td className="py-2 px-4 border-b">{entry.date}</td>
                                <td className="py-2 px-4 border-b text-right">{entry.description}</td>
                                <td className="py-2 px-4 border-b text-green-600">{entry.type === 'وارد' ? `${entry.amount.toLocaleString()} ج.م` : '-'}</td>
                                <td className="py-2 px-4 border-b text-red-600">{entry.type === 'منصرف' ? `${entry.amount.toLocaleString()} ج.م` : '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Treasury;
