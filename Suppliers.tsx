
import React, { useEffect, useState, useMemo } from 'react';
import { Supplier, SupplierPayment, TreasuryEntry, Expense } from '../types';
import api from '../services/api';
import Modal from '../components/Modal';
import { PlusIcon, CreditCardIcon, TrashIcon, PencilIcon, EyeIcon } from '../components/Icons';

type SupplierCategory = 'أعلاف' | 'أدوية' | 'معدات' | 'متنوع';

const Suppliers: React.FC = () => {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [payments, setPayments] = useState<SupplierPayment[]>([]);
    
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isEditPaymentModalOpen, setIsEditPaymentModalOpen] = useState(false);

    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [editingSupplierData, setEditingSupplierData] = useState<Supplier | null>(null);
    const [editingPayment, setEditingPayment] = useState<SupplierPayment | null>(null);
    const [filterCategory, setFilterCategory] = useState<string>('الكل');
    const [purchaseDateFilter, setPurchaseDateFilter] = useState({ start: '', end: '' });
    
    const [newSupplier, setNewSupplier] = useState({
        name: '', phone: '', address: '', category: 'أعلاف' as SupplierCategory,
    });
    const [paymentData, setPaymentData] = useState({ amount: '', date: new Date().toISOString().split('T')[0], notes: '' });

    const fetchData = async () => {
        const [suppliersData, expensesData, paymentsData] = await Promise.all([
            api.getSuppliers(),
            api.getExpenses(),
            api.getSupplierPayments()
        ]);
        setSuppliers(suppliersData);
        setExpenses(expensesData);
        setPayments(paymentsData);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewSupplier(prev => ({ ...prev, [name]: value as any }));
    };

    const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if(editingSupplierData) setEditingSupplierData({ ...editingSupplierData, [name]: value as any });
    };
    
    const handlePaymentInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPaymentData(prev => ({ ...prev, [name]: value }));
    };

    const handleEditPaymentInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if(editingPayment) setEditingPayment({ ...editingPayment, [name]: value });
    };

    const handleAddSupplier = async (e: React.FormEvent) => {
        e.preventDefault();
        const newRecord: Supplier = { id: `SUP-${Date.now()}`, ...newSupplier, totalPurchases: 0, paid: 0, remaining: 0 };
        await api.saveSuppliers([...suppliers, newRecord]);
        fetchData();
        setIsAddModalOpen(false);
        setNewSupplier({ name: '', phone: '', address: '', category: 'أعلاف' });
    };

    const handleUpdateSupplier = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!editingSupplierData) return;
        const updatedSuppliers = suppliers.map(s => s.id === editingSupplierData.id ? editingSupplierData : s);
        await api.saveSuppliers(updatedSuppliers);
        fetchData();
        setIsEditModalOpen(false);
        setEditingSupplierData(null);
    };
    
    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSupplier || !paymentData.amount) return;
        const amount = Number(paymentData.amount);
        if (amount <= 0 || amount > selectedSupplier.remaining) { alert('المبلغ المدفوع غير صحيح.'); return; }
        
        const newPayment: SupplierPayment = { id: `PAY-${Date.now()}`, supplierId: selectedSupplier.id, amount, date: paymentData.date, notes: paymentData.notes };
        await api.saveSupplierPayments([...payments, newPayment]);
        
        const updatedSuppliers = suppliers.map(s => s.id === selectedSupplier.id ? { ...s, paid: s.paid + amount, remaining: s.remaining - amount } : s);
        await api.saveSuppliers(updatedSuppliers);
        
        const treasuryEntry: TreasuryEntry = { id: `T-${Date.now()}`, date: paymentData.date, description: `سداد دفعة للمورد: ${selectedSupplier.name}`, type: 'منصرف', amount, sourceId: newPayment.id };
        const currentTreasury = await api.getTreasuryEntries();
        await api.saveTreasury([...currentTreasury, treasuryEntry]);
        
        fetchData();
        setIsPaymentModalOpen(false);
        setSelectedSupplier(null);
        setPaymentData({ amount: '', date: new Date().toISOString().split('T')[0], notes: '' });
    };

    const handleUpdatePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPayment) return;
        
        const originalPayment = payments.find(p => p.id === editingPayment.id);
        if (!originalPayment) return;

        const newAmount = Number(editingPayment.amount);
        const oldAmount = originalPayment.amount;
        const amountDifference = newAmount - oldAmount;

        // 1. Update Payment record
        const updatedPayments = payments.map(p => p.id === editingPayment.id ? { ...editingPayment, amount: newAmount } : p);
        
        // 2. Update Supplier balance
        const updatedSuppliers = suppliers.map(s => {
            if (s.id === editingPayment.supplierId) {
                return { ...s, paid: s.paid + amountDifference, remaining: s.remaining - amountDifference };
            }
            return s;
        });
        
        // 3. Update Treasury entry
        const treasury = await api.getTreasuryEntries();
        const updatedTreasury = treasury.map(t => {
            if (t.sourceId === editingPayment.id) {
                return { ...t, amount: newAmount, date: editingPayment.date };
            }
            return t;
        });

        await Promise.all([
            api.saveSupplierPayments(updatedPayments as SupplierPayment[]),
            api.saveSuppliers(updatedSuppliers),
            api.saveTreasury(updatedTreasury)
        ]);

        fetchData();
        setIsEditPaymentModalOpen(false);
        setEditingPayment(null);
    };

    const openDeleteModal = (supplier: Supplier) => { setSelectedSupplier(supplier); setIsDeleteModalOpen(true); };
    const handleDeleteConfirm = async () => { if (selectedSupplier) { await api.saveSuppliers(suppliers.filter(s => s.id !== selectedSupplier.id)); fetchData(); setIsDeleteModalOpen(false); setSelectedSupplier(null); } };
    const openPaymentModal = (supplier: Supplier) => { setSelectedSupplier(supplier); setIsPaymentModalOpen(true); };
    const openEditModal = (supplier: Supplier) => { setEditingSupplierData({ ...supplier }); setIsEditModalOpen(true); };
    const openDetailsModal = (supplier: Supplier) => { setSelectedSupplier(supplier); setIsDetailsModalOpen(true); };
    const openEditPaymentModal = (payment: SupplierPayment) => { setEditingPayment({...payment, amount: Number(payment.amount)}); setIsEditPaymentModalOpen(true); };
    
    const filteredSuppliers = useMemo(() => suppliers.filter(s => filterCategory === 'الكل' || s.category === filterCategory), [suppliers, filterCategory]);

    const handleExport = () => {
        const headers = ["ID", "Name", "Phone", "Category", "Total Purchases", "Paid", "Remaining"];
        const rows = filteredSuppliers.map(s => [s.id, s.name, s.phone, s.category, s.totalPurchases, s.paid, s.remaining].join(','));
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "suppliers.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredExpenses = useMemo(() => {
        if (!selectedSupplier) return [];
        return expenses.filter(e => {
            if (e.supplierId !== selectedSupplier.id) return false;
            const expenseDate = new Date(e.date);
            const start = purchaseDateFilter.start ? new Date(purchaseDateFilter.start) : null;
            const end = purchaseDateFilter.end ? new Date(purchaseDateFilter.end) : null;
            if (start && expenseDate < start) return false;
            if (end && expenseDate > end) return false;
            return true;
        });
    }, [expenses, selectedSupplier, purchaseDateFilter]);

    return (
        <>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                    <h2 className="text-xl font-bold text-gray-800">إدارة الموردين</h2>
                    <div className="flex items-center gap-4">
                        <select onChange={(e) => setFilterCategory(e.target.value)} value={filterCategory} className="bg-white border border-gray-300 rounded-md px-3 py-2"><option value="الكل">كل الفئات</option><option value="أعلاف">أعلاف</option><option value="أدوية">أدوية</option><option value="معدات">معدات</option><option value="متنوع">متنوع</option></select>
                        <button onClick={handleExport} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">تصدير CSV</button>
                        <button onClick={() => setIsAddModalOpen(true)} className="flex items-center bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"><PlusIcon className="w-5 h-5 me-2" />إضافة مورد جديد</button>
                    </div>
                </div>
                
                {/* Desktop Table */}
                <div className="overflow-x-auto hidden md:block">
                    <table className="min-w-full bg-white"><thead className="bg-gray-200"><tr><th className="py-2 px-4 border-b">اسم المورد</th><th className="py-2 px-4 border-b">الهاتف</th><th className="py-2 px-4 border-b">الفئة</th><th className="py-2 px-4 border-b">إجمالي المشتريات</th><th className="py-2 px-4 border-b">المدفوع</th><th className="py-2 px-4 border-b">المتبقي</th><th className="py-2 px-4 border-b">إجراءات</th></tr></thead>
                        <tbody>
                            {filteredSuppliers.map((s) => (<tr key={s.id} className="text-center hover:bg-gray-50"><td className="py-2 px-4 border-b">{s.name}</td><td className="py-2 px-4 border-b">{s.phone}</td><td className="py-2 px-4 border-b">{s.category}</td><td className="py-2 px-4 border-b">{s.totalPurchases.toLocaleString()} ج.م</td><td className="py-2 px-4 border-b text-green-600">{s.paid.toLocaleString()} ج.م</td><td className="py-2 px-4 border-b text-red-600 font-bold">{s.remaining.toLocaleString()} ج.م</td><td className="py-2 px-4 border-b"><div className="flex justify-center items-center gap-2"><button onClick={() => openDetailsModal(s)} className="text-gray-500 hover:text-blue-600" title="تفاصيل"><EyeIcon /></button><button onClick={() => openEditModal(s)} className="text-gray-500 hover:text-yellow-600" title="تعديل"><PencilIcon /></button><button disabled={s.remaining <= 0} onClick={() => openPaymentModal(s)} className="text-gray-500 hover:text-green-600 disabled:text-gray-300 disabled:cursor-not-allowed" title="سداد دفعة"><CreditCardIcon className="w-5 h-5" /></button><button onClick={() => openDeleteModal(s)} className="text-gray-500 hover:text-red-600" title="حذف"><TrashIcon className="w-5 h-5" /></button></div></td></tr>))}
                        </tbody>
                    </table>
                </div>

                 {/* Mobile Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
                    {filteredSuppliers.map((s) => (
                        <div key={s.id} className="bg-white p-4 rounded-lg shadow border border-gray-200 space-y-3">
                            <div>
                                <h3 className="font-bold text-lg text-gray-800">{s.name}</h3>
                                <p className="text-sm text-gray-500">{s.category} - {s.phone}</p>
                            </div>
                            <div className="text-sm space-y-1">
                                <p><strong>إجمالي المشتريات:</strong> {s.totalPurchases.toLocaleString()} ج.م</p>
                                <p><strong>المدفوع:</strong> <span className="text-green-600">{s.paid.toLocaleString()} ج.م</span></p>
                                <p><strong>المتبقي:</strong> <span className="text-red-600 font-bold">{s.remaining.toLocaleString()} ج.م</span></p>
                            </div>
                            <div className="flex justify-end items-center gap-2 border-t pt-3 mt-3">
                                <button onClick={() => openDetailsModal(s)} className="text-gray-500 hover:text-blue-600 p-1" title="تفاصيل"><EyeIcon /></button>
                                <button onClick={() => openEditModal(s)} className="text-gray-500 hover:text-yellow-600 p-1" title="تعديل"><PencilIcon /></button>
                                <button disabled={s.remaining <= 0} onClick={() => openPaymentModal(s)} className="text-gray-500 hover:text-green-600 disabled:text-gray-300 disabled:cursor-not-allowed p-1" title="سداد دفعة"><CreditCardIcon className="w-5 h-5" /></button>
                                <button onClick={() => openDeleteModal(s)} className="text-gray-500 hover:text-red-600 p-1" title="حذف"><TrashIcon className="w-5 h-5" /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            <Modal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} title={`تفاصيل المورد: ${selectedSupplier?.name}`} size="4xl">
                {selectedSupplier && (<div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg"><div><h4 className="font-bold text-gray-800">معلومات الاتصال</h4><p><strong>الهاتف:</strong> {selectedSupplier.phone}</p><p><strong>العنوان:</strong> {selectedSupplier.address}</p></div><div className="bg-gray-50 p-4 rounded-lg"><h4 className="font-bold text-gray-800">ملخص مالي</h4><p><strong>إجمالي المشتريات:</strong> {selectedSupplier.totalPurchases.toLocaleString()} ج.م</p><p><strong>إجمالي المدفوعات:</strong> {selectedSupplier.paid.toLocaleString()} ج.م</p><p className="font-bold"><strong>الرصيد المتبقي:</strong> <span className="text-red-600">{selectedSupplier.remaining.toLocaleString()} ج.م</span></p></div></div>
                    <div><h4 className="text-lg font-bold text-gray-800 mb-2">سجل المشتريات (الفواتير)</h4>
                        <div className="flex gap-4 mb-2 p-2 bg-gray-50 rounded-md"><label>من تاريخ: <input type="date" className="border rounded px-2 py-1" value={purchaseDateFilter.start} onChange={e => setPurchaseDateFilter(p => ({...p, start: e.target.value}))} /></label><label>إلى تاريخ: <input type="date" className="border rounded px-2 py-1" value={purchaseDateFilter.end} onChange={e => setPurchaseDateFilter(p => ({...p, end: e.target.value}))} /></label><button onClick={() => setPurchaseDateFilter({start: '', end: ''})} className='text-sm text-blue-600'>إعادة تعيين</button></div>
                        <div className="overflow-x-auto border rounded-lg"><table className="min-w-full bg-white text-sm"><thead className="bg-gray-100"><tr><th className="p-2 border-b">التاريخ</th><th className="p-2 border-b">البيان</th><th className="p-2 border-b">المبلغ</th></tr></thead><tbody>{filteredExpenses.map(e => (<tr key={e.id} className="text-center"><td className="p-2 border-b">{e.date}</td><td className="p-2 border-b">{e.description}</td><td className="p-2 border-b">{e.amount.toLocaleString()} ج.م</td></tr>))}</tbody></table></div>
                    </div>
                    <div><h4 className="text-lg font-bold text-gray-800 mb-2">سجل الدفعات</h4><div className="overflow-x-auto border rounded-lg"><table className="min-w-full bg-white text-sm"><thead className="bg-gray-100"><tr><th className="p-2 border-b">التاريخ</th><th className="p-2 border-b">المبلغ المدفوع</th><th className="p-2 border-b">ملاحظات</th><th className="p-2 border-b">تعديل</th></tr></thead><tbody>{payments.filter(p => p.supplierId === selectedSupplier.id).map(p => (<tr key={p.id} className="text-center"><td className="p-2 border-b">{p.date}</td><td className="p-2 border-b text-green-600">{p.amount.toLocaleString()} ج.م</td><td className="p-2 border-b">{p.notes || '-'}</td><td className="p-2 border-b"><button onClick={() => openEditPaymentModal(p)} className="text-gray-500 hover:text-yellow-600"><PencilIcon/></button></td></tr>))}</tbody></table></div></div>
                </div>)}
            </Modal>
            
            <Modal isOpen={isEditPaymentModalOpen} onClose={() => setIsEditPaymentModalOpen(false)} title="تعديل دفعة">
                <form onSubmit={handleUpdatePayment}>
                    <div className="space-y-4">
                        <div><label className="block text-sm font-medium text-gray-700">مبلغ الدفعة</label><input type="number" name="amount" value={editingPayment?.amount || ''} onChange={handleEditPaymentInputChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md"/></div>
                        <div><label className="block text-sm font-medium text-gray-700">تاريخ السداد</label><input type="date" name="date" value={editingPayment?.date || ''} onChange={handleEditPaymentInputChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md"/></div>
                        <div><label className="block text-sm font-medium text-gray-700">ملاحظات</label><input type="text" name="notes" value={editingPayment?.notes || ''} onChange={handleEditPaymentInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md"/></div>
                    </div>
                    <div className="mt-6 flex justify-end space-x-2 space-x-reverse"><button type="button" onClick={() => setIsEditPaymentModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded-md">إلغاء</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">حفظ التعديلات</button></div>
                </form>
            </Modal>
            
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="إضافة مورد جديد">
                <form onSubmit={handleAddSupplier}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">اسم المورد</label>
                            <input type="text" id="name" name="name" value={newSupplier.name} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"/>
                        </div>
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">رقم الهاتف</label>
                            <input type="tel" id="phone" name="phone" value={newSupplier.phone} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"/>
                        </div>
                        <div>
                            <label htmlFor="address" className="block text-sm font-medium text-gray-700">العنوان</label>
                            <input type="text" id="address" name="address" value={newSupplier.address} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"/>
                        </div>
                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-700">الفئة</label>
                            <select id="category" name="category" value={newSupplier.category} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500">
                                <option value="أعلاف">أعلاف</option>
                                <option value="أدوية">أدوية</option>
                                <option value="معدات">معدات</option>
                                <option value="متنوع">متنوع</option>
                            </select>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end space-x-2 space-x-reverse">
                        <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">إلغاء</button>
                        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">حفظ</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`تعديل بيانات المورد: ${editingSupplierData?.name}`}>
                <form onSubmit={handleUpdateSupplier}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">اسم المورد</label>
                            <input type="text" id="name" name="name" value={editingSupplierData?.name || ''} onChange={handleEditInputChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm"/>
                        </div>
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">رقم الهاتف</label>
                            <input type="tel" id="phone" name="phone" value={editingSupplierData?.phone || ''} onChange={handleEditInputChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm"/>
                        </div>
                        <div>
                            <label htmlFor="address" className="block text-sm font-medium text-gray-700">العنوان</label>
                            <input type="text" id="address" name="address" value={editingSupplierData?.address || ''} onChange={handleEditInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm"/>
                        </div>
                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-700">الفئة</label>
                            <select id="category" name="category" value={editingSupplierData?.category || 'أعلاف'} onChange={handleEditInputChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm">
                                <option value="أعلاف">أعلاف</option>
                                <option value="أدوية">أدوية</option>
                                <option value="معدات">معدات</option>
                                <option value="متنوع">متنوع</option>
                            </select>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end space-x-2 space-x-reverse">
                        <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">إلغاء</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">حفظ التعديلات</button>
                    </div>
                </form>
            </Modal>
            
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="تأكيد الحذف">
                <div>
                    <p className="text-gray-700">هل أنت متأكد من أنك تريد حذف المورد: <span className="font-bold">{selectedSupplier?.name}</span>؟</p>
                    <div className="mt-6 flex justify-end space-x-2 space-x-reverse">
                        <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">إلغاء</button>
                        <button onClick={handleDeleteConfirm} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">تأكيد الحذف</button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title={`سداد دفعة للمورد: ${selectedSupplier?.name}`}>
                <form onSubmit={handlePaymentSubmit}>
                    <div className="mb-4">
                        <span className="text-sm text-gray-500">المبلغ المتبقي:</span>
                        <span className="font-bold text-red-600 text-lg ms-2">{selectedSupplier?.remaining.toLocaleString()} ج.م</span>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">مبلغ الدفعة</label>
                            <input type="number" id="amount" name="amount" value={paymentData.amount} onChange={handlePaymentInputChange} required max={selectedSupplier?.remaining} min="1" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm"/>
                        </div>
                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-gray-700">تاريخ السداد</label>
                            <input type="date" id="date" name="date" value={paymentData.date} onChange={handlePaymentInputChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm"/>
                        </div>
                        <div>
                            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">ملاحظات (اختياري)</label>
                            <input type="text" id="notes" name="notes" value={paymentData.notes} onChange={handlePaymentInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm"/>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end space-x-2 space-x-reverse">
                        <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">إلغاء</button>
                        <button type="submit" className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                            <CreditCardIcon className="w-5 h-5 me-2" />
                            تأكيد الدفع
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
};

export default Suppliers;