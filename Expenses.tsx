
import React, { useEffect, useState } from 'react';
import { Expense, TreasuryEntry, Supplier, Animal } from '../types';
import api from '../services/api';
import Modal from '../components/Modal';
import { PlusIcon } from '../components/Icons';

const Expenses: React.FC = () => {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newExpense, setNewExpense] = useState<{
        date: string;
        category: Expense['category'];
        description: string;
        amount: string;
        supplierId: string;
        animalId: string;
        animalAge: string;
        animalWeight: string;
    }>({
        date: new Date().toISOString().split('T')[0], category: 'أعلاف', description: '',
        amount: '', supplierId: '', animalId: '', animalAge: '', animalWeight: ''
    });

    const fetchData = async () => {
        const [expensesData, suppliersData] = await Promise.all([
            api.getExpenses(),
            api.getSuppliers()
        ]);
        setExpenses(expensesData);
        setSuppliers(suppliersData);
    };

    useEffect(() => {
        fetchData();
    }, []);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewExpense(prev => ({ ...prev, [name]: value as any }));
    };

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = Number(newExpense.amount);
        let newRecord: Expense = {
            id: `E-${Date.now()}`, date: newExpense.date, category: newExpense.category,
            description: newExpense.description, amount: amount, supplierId: newExpense.supplierId || undefined,
        };

        if (newExpense.category === 'شراء مواشي') {
            if (!newExpense.supplierId || !newExpense.animalId || !newExpense.animalAge || !newExpense.animalWeight) {
                alert('عند شراء مواشي، يجب تحديد المورد وإدخال كل بيانات الحيوان.'); return;
            }
            // Add animal-specific data to expense record
            newRecord = { ...newRecord, animalId: newExpense.animalId, animalAge: Number(newExpense.animalAge), animalWeight: Number(newExpense.animalWeight) };

            const newAnimalRecord: Animal = {
                id: newExpense.animalId, age: Number(newExpense.animalAge), weight: Number(newExpense.animalWeight),
                entryDate: newExpense.date, cost: amount, status: 'Available',
            };
            const currentAnimals = await api.getAnimals();
            await api.saveAnimals([...currentAnimals, newAnimalRecord]);
        }
        
        if (newExpense.supplierId) {
            const updatedSuppliers = suppliers.map(s => s.id === newExpense.supplierId ? { ...s, totalPurchases: s.totalPurchases + amount, remaining: s.remaining + amount } : s);
            await api.saveSuppliers(updatedSuppliers);
        } else {
            const treasuryEntry: TreasuryEntry = {
                id: `T-${Date.now()}`, date: newRecord.date, description: `مصروفات ${newRecord.category}: ${newRecord.description}`,
                type: 'منصرف', amount: newRecord.amount
            };
            const currentTreasury = await api.getTreasuryEntries();
            await api.saveTreasury([...currentTreasury, treasuryEntry]);
        }

        await api.saveExpenses([...expenses, newRecord]);
        fetchData();
        setIsModalOpen(false);
        setNewExpense({ date: new Date().toISOString().split('T')[0], category: 'أعلاف', description: '', amount: '', supplierId: '', animalId: '', animalAge: '', animalWeight: '' });
    };

    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    return (
        <>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">المشتريات والمصروفات</h2>
                    <button onClick={() => setIsModalOpen(true)} className="flex items-center bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                        <PlusIcon className="w-5 h-5 me-2" />
                        إضافة مصروف جديد
                    </button>
                </div>
                <div className="overflow-x-auto hidden md:block">
                    <table className="min-w-full bg-white">
                        <thead className="bg-gray-200"><tr><th className="py-2 px-4 border-b">التاريخ</th><th className="py-2 px-4 border-b">الفئة</th><th className="py-2 px-4 border-b">البيان</th><th className="py-2 px-4 border-b">المورد</th><th className="py-2 px-4 border-b">المبلغ</th></tr></thead>
                        <tbody>{expenses.map((expense) => (<tr key={expense.id} className="text-center hover:bg-gray-50"><td className="py-2 px-4 border-b">{expense.date}</td><td className="py-2 px-4 border-b">{expense.category}</td><td className="py-2 px-4 border-b">{expense.description}</td><td className="py-2 px-4 border-b">{suppliers.find(s => s.id === expense.supplierId)?.name || '-'}</td><td className="py-2 px-4 border-b">{expense.amount.toLocaleString()} ج.م</td></tr>))}</tbody>
                        <tfoot className="bg-gray-100 font-bold"><tr><td colSpan={4} className="py-2 px-4 text-left">الإجمالي</td><td className="py-2 px-4 text-center">{totalExpenses.toLocaleString()} ج.م</td></tr></tfoot>
                    </table>
                </div>
                <div className="space-y-4 md:hidden">
                    {expenses.map((expense) => (<div key={expense.id} className="bg-white p-4 rounded-lg shadow border border-gray-200"><div className="flex justify-between items-start"><div><p className="font-bold text-gray-800">{expense.description}</p><p className="text-sm text-gray-500">{expense.category} - {expense.date}</p></div><span className="font-bold text-lg text-red-600">{expense.amount.toLocaleString()} ج.م</span></div>{expense.supplierId && (<p className="text-sm text-gray-600 mt-2"><strong>المورد:</strong> {suppliers.find(s => s.id === expense.supplierId)?.name || '-'}</p>)}</div>))}
                    <div className="bg-gray-100 font-bold p-4 rounded-lg flex justify-between items-center mt-4"><span>الإجمالي</span><span>{totalExpenses.toLocaleString()} ج.م</span></div>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="إضافة مصروف جديد">
                <form onSubmit={handleAddExpense}>
                    <div className="space-y-4">
                        <div><label className="block text-sm">التاريخ</label><input type="date" name="date" value={newExpense.date} onChange={handleInputChange} required className="mt-1 block w-full border rounded-md p-2"/></div>
                        <div><label className="block text-sm">الفئة</label><select name="category" value={newExpense.category} onChange={handleInputChange} required className="mt-1 block w-full border rounded-md p-2"><option>أعلاف</option><option>أدوية</option><option>عمالة</option><option>كهرباء</option><option>نقل</option><option>صيانة</option><option>شراء مواشي</option><option>متنوعة</option></select></div>
                        <div><label className="block text-sm">المورد (إلزامي عند شراء مواشي)</label><select name="supplierId" value={newExpense.supplierId} onChange={handleInputChange} className="mt-1 block w-full border rounded-md p-2"><option value="">مصروف نقدي مباشر</option>{suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                        {newExpense.category === 'شراء مواشي' && (
                            <div className="p-4 border border-green-200 bg-green-50 rounded-lg space-y-4">
                                <h4 className="font-bold text-green-800">بيانات الحيوان الجديد</h4>
                                <div><label className="block text-sm">رقم الحيوان (ID)</label><input type="text" name="animalId" value={newExpense.animalId} onChange={handleInputChange} required className="mt-1 block w-full border rounded-md p-2"/></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-sm">العمر (شهر)</label><input type="number" name="animalAge" value={newExpense.animalAge} onChange={handleInputChange} required className="mt-1 block w-full border rounded-md p-2"/></div>
                                    <div><label className="block text-sm">الوزن (كجم)</label><input type="number" name="animalWeight" value={newExpense.animalWeight} onChange={handleInputChange} required className="mt-1 block w-full border rounded-md p-2"/></div>
                                </div>
                            </div>
                        )}
                        <div><label className="block text-sm">البيان</label><input type="text" name="description" value={newExpense.description} onChange={handleInputChange} required className="mt-1 block w-full border rounded-md p-2"/></div>
                        <div><label className="block text-sm">المبلغ / تكلفة الشراء</label><input type="number" name="amount" value={newExpense.amount} onChange={handleInputChange} required className="mt-1 block w-full border rounded-md p-2"/></div>
                    </div>
                    <div className="mt-6 flex justify-end space-x-2 space-x-reverse"><button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded-md">إلغاء</button><button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md">حفظ</button></div>
                </form>
            </Modal>
        </>
    );
};

export default Expenses;
