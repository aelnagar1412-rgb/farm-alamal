
import React, { useEffect, useState, useMemo } from 'react';
import { Customer, CustomerPayment, TreasuryEntry, Sale } from '../types';
import api from '../services/api';
import Modal from '../components/Modal';
import { PlusIcon, CreditCardIcon, TrashIcon, PencilIcon, EyeIcon } from '../components/Icons';

const Customers: React.FC = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);
    const [payments, setPayments] = useState<CustomerPayment[]>([]);
    
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [editingCustomerData, setEditingCustomerData] = useState<Customer | null>(null);
    const [filterQuery, setFilterQuery] = useState('');
    
    const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', address: '' });
    const [paymentData, setPaymentData] = useState({ amount: '', date: new Date().toISOString().split('T')[0], notes: '' });

    const fetchData = async () => {
        const [customersData, salesData, paymentsData] = await Promise.all([
            api.getCustomers(),
            api.getSales(),
            api.getCustomerPayments()
        ]);
        setCustomers(customersData);
        setSales(salesData);
        setPayments(paymentsData);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewCustomer(prev => ({ ...prev, [name]: value }));
    };

    const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if(editingCustomerData) setEditingCustomerData({ ...editingCustomerData, [name]: value });
    };
    
    const handlePaymentInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPaymentData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddCustomer = async (e: React.FormEvent) => {
        e.preventDefault();
        const newRecord: Customer = { id: `CUST-${Date.now()}`, ...newCustomer, totalSales: 0, paid: 0, remaining: 0 };
        await api.saveCustomers([...customers, newRecord]);
        fetchData();
        setIsAddModalOpen(false);
        setNewCustomer({ name: '', phone: '', address: '' });
    };

    const handleUpdateCustomer = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!editingCustomerData) return;
        const updatedCustomers = customers.map(c => c.id === editingCustomerData.id ? editingCustomerData : c);
        await api.saveCustomers(updatedCustomers);
        fetchData();
        setIsEditModalOpen(false);
        setEditingCustomerData(null);
    };
    
    const handleDeleteConfirm = async () => {
        if (selectedCustomer) {
            await api.saveCustomers(customers.filter(c => c.id !== selectedCustomer.id));
            fetchData();
            setIsDeleteModalOpen(false);
            setSelectedCustomer(null);
        }
    };
    
    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCustomer || !paymentData.amount) return;
        const amount = Number(paymentData.amount);
        if (amount <= 0 || amount > selectedCustomer.remaining) { alert('المبلغ المدفوع غير صحيح.'); return; }
        
        const newPayment: CustomerPayment = { id: `CPAY-${Date.now()}`, customerId: selectedCustomer.id, amount, date: paymentData.date, notes: paymentData.notes };
        await api.saveCustomerPayments([...payments, newPayment]);
        
        const updatedCustomers = customers.map(c => c.id === selectedCustomer.id ? { ...c, paid: c.paid + amount, remaining: c.remaining - amount } : c);
        await api.saveCustomers(updatedCustomers);
        
        const treasuryEntry: TreasuryEntry = { id: `T-${Date.now()}`, date: paymentData.date, description: `تحصيل دفعة من العميل: ${selectedCustomer.name}`, type: 'وارد', amount, sourceId: newPayment.id };
        const currentTreasury = await api.getTreasuryEntries();
        await api.saveTreasury([...currentTreasury, treasuryEntry]);
        
        fetchData();
        setIsPaymentModalOpen(false);
        setSelectedCustomer(null);
        setPaymentData({ amount: '', date: new Date().toISOString().split('T')[0], notes: '' });
    };

    const openDeleteModal = (customer: Customer) => { setSelectedCustomer(customer); setIsDeleteModalOpen(true); };
    const openPaymentModal = (customer: Customer) => { setSelectedCustomer(customer); setIsPaymentModalOpen(true); };
    const openEditModal = (customer: Customer) => { setEditingCustomerData({ ...customer }); setIsEditModalOpen(true); };
    const openDetailsModal = (customer: Customer) => { setSelectedCustomer(customer); setIsDetailsModalOpen(true); };
    
    const filteredCustomers = useMemo(() => {
        if (!filterQuery) {
            return customers;
        }
        return customers.filter(customer =>
            customer.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
            customer.phone.includes(filterQuery)
        );
    }, [customers, filterQuery]);

    return (
        <>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                    <h2 className="text-xl font-bold text-gray-800">إدارة العملاء</h2>
                    <div className="flex items-center gap-4">
                        <input 
                            type="text" 
                            placeholder="ابحث بالاسم أو الهاتف..." 
                            value={filterQuery}
                            onChange={(e) => setFilterQuery(e.target.value)}
                            className="bg-white border border-gray-300 rounded-md px-3 py-2"
                        />
                        <button onClick={() => setIsAddModalOpen(true)} className="flex items-center bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                            <PlusIcon className="w-5 h-5 me-2" />
                            إضافة عميل جديد
                        </button>
                    </div>
                </div>

                {/* Desktop Table */}
                <div className="overflow-x-auto hidden md:block">
                    <table className="min-w-full bg-white">
                        <thead className="bg-gray-200">
                            <tr>
                                <th className="py-2 px-4 border-b">اسم العميل</th>
                                <th className="py-2 px-4 border-b">الهاتف</th>
                                <th className="py-2 px-4 border-b">إجمالي المبيعات</th>
                                <th className="py-2 px-4 border-b">المدفوع</th>
                                <th className="py-2 px-4 border-b">المتبقي</th>
                                <th className="py-2 px-4 border-b">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.map((c) => (
                                <tr key={c.id} className="text-center hover:bg-gray-50">
                                    <td className="py-2 px-4 border-b">{c.name}</td>
                                    <td className="py-2 px-4 border-b">{c.phone}</td>
                                    <td className="py-2 px-4 border-b">{c.totalSales.toLocaleString()} ج.م</td>
                                    <td className="py-2 px-4 border-b text-green-600">{c.paid.toLocaleString()} ج.م</td>
                                    <td className="py-2 px-4 border-b text-red-600 font-bold">{c.remaining.toLocaleString()} ج.م</td>
                                    <td className="py-2 px-4 border-b">
                                        <div className="flex justify-center items-center gap-2">
                                            <button onClick={() => openDetailsModal(c)} className="text-gray-500 hover:text-blue-600" title="تفاصيل"><EyeIcon /></button>
                                            <button onClick={() => openEditModal(c)} className="text-gray-500 hover:text-yellow-600" title="تعديل"><PencilIcon /></button>
                                            <button disabled={c.remaining <= 0} onClick={() => openPaymentModal(c)} className="text-gray-500 hover:text-green-600 disabled:text-gray-300 disabled:cursor-not-allowed" title="تحصيل دفعة"><CreditCardIcon className="w-5 h-5" /></button>
                                            <button onClick={() => openDeleteModal(c)} className="text-gray-500 hover:text-red-600" title="حذف"><TrashIcon className="w-5 h-5" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
                    {filteredCustomers.map((c) => (
                        <div key={c.id} className="bg-white p-4 rounded-lg shadow border border-gray-200 space-y-3">
                            <div>
                                <h3 className="font-bold text-lg text-gray-800">{c.name}</h3>
                                <p className="text-sm text-gray-500">{c.phone}</p>
                            </div>
                            <div className="text-sm space-y-1">
                                <p><strong>إجمالي المبيعات:</strong> {c.totalSales.toLocaleString()} ج.م</p>
                                <p><strong>المدفوع:</strong> <span className="text-green-600">{c.paid.toLocaleString()} ج.م</span></p>
                                <p><strong>المتبقي:</strong> <span className="text-red-600 font-bold">{c.remaining.toLocaleString()} ج.م</span></p>
                            </div>
                            <div className="flex justify-end items-center gap-2 border-t pt-3 mt-3">
                                <button onClick={() => openDetailsModal(c)} className="text-gray-500 hover:text-blue-600 p-1" title="تفاصيل"><EyeIcon /></button>
                                <button onClick={() => openEditModal(c)} className="text-gray-500 hover:text-yellow-600 p-1" title="تعديل"><PencilIcon /></button>
                                <button disabled={c.remaining <= 0} onClick={() => openPaymentModal(c)} className="text-gray-500 hover:text-green-600 disabled:text-gray-300 disabled:cursor-not-allowed p-1" title="تحصيل دفعة"><CreditCardIcon className="w-5 h-5" /></button>
                                <button onClick={() => openDeleteModal(c)} className="text-gray-500 hover:text-red-600 p-1" title="حذف"><TrashIcon className="w-5 h-5" /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="إضافة عميل جديد">
                <form onSubmit={handleAddCustomer}><div className="space-y-4">
                    <div><label className="block text-sm">اسم العميل</label><input type="text" name="name" value={newCustomer.name} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 border rounded-md"/></div>
                    <div><label className="block text-sm">رقم الهاتف</label><input type="tel" name="phone" value={newCustomer.phone} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 border rounded-md"/></div>
                    <div><label className="block text-sm">العنوان</label><input type="text" name="address" value={newCustomer.address} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border rounded-md"/></div>
                </div><div className="mt-6 flex justify-end space-x-2 space-x-reverse"><button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded-md">إلغاء</button><button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md">حفظ</button></div></form>
            </Modal>
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`تعديل بيانات: ${editingCustomerData?.name}`}>
                <form onSubmit={handleUpdateCustomer}><div className="space-y-4">
                    <div><label className="block text-sm">اسم العميل</label><input type="text" name="name" value={editingCustomerData?.name} onChange={handleEditInputChange} required className="mt-1 block w-full px-3 py-2 border rounded-md"/></div>
                    <div><label className="block text-sm">رقم الهاتف</label><input type="tel" name="phone" value={editingCustomerData?.phone} onChange={handleEditInputChange} required className="mt-1 block w-full px-3 py-2 border rounded-md"/></div>
                    <div><label className="block text-sm">العنوان</label><input type="text" name="address" value={editingCustomerData?.address} onChange={handleEditInputChange} className="mt-1 block w-full px-3 py-2 border rounded-md"/></div>
                </div><div className="mt-6 flex justify-end space-x-2 space-x-reverse"><button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded-md">إلغاء</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">حفظ التعديلات</button></div></form>
            </Modal>
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="تأكيد الحذف">
                <div><p>هل أنت متأكد من حذف العميل: <span className="font-bold">{selectedCustomer?.name}</span>؟</p><div className="mt-6 flex justify-end space-x-2 space-x-reverse"><button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded-md">إلغاء</button><button onClick={handleDeleteConfirm} className="px-4 py-2 bg-red-600 text-white rounded-md">تأكيد الحذف</button></div></div>
            </Modal>
            <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title={`تحصيل دفعة من: ${selectedCustomer?.name}`}>
                <form onSubmit={handlePaymentSubmit}><div className="mb-4"><span className="text-sm text-gray-500">المبلغ المتبقي:</span><span className="font-bold text-red-600 text-lg ms-2">{selectedCustomer?.remaining.toLocaleString()} ج.م</span></div><div className="space-y-4">
                    <div><label className="block text-sm">مبلغ الدفعة</label><input type="number" name="amount" value={paymentData.amount} onChange={handlePaymentInputChange} required max={selectedCustomer?.remaining} min="1" className="mt-1 block w-full px-3 py-2 border rounded-md"/></div>
                    <div><label className="block text-sm">تاريخ التحصيل</label><input type="date" name="date" value={paymentData.date} onChange={handlePaymentInputChange} required className="mt-1 block w-full px-3 py-2 border rounded-md"/></div>
                    <div><label className="block text-sm">ملاحظات</label><input type="text" name="notes" value={paymentData.notes} onChange={handlePaymentInputChange} className="mt-1 block w-full px-3 py-2 border rounded-md"/></div>
                </div><div className="mt-6 flex justify-end space-x-2 space-x-reverse"><button type="button" onClick={() => setIsPaymentModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded-md">إلغاء</button><button type="submit" className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md"><CreditCardIcon className="w-5 h-5 me-2"/>تأكيد التحصيل</button></div></form>
            </Modal>
            <Modal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} title={`تفاصيل العميل: ${selectedCustomer?.name}`} size="4xl">
                {selectedCustomer && (<div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg"><div><h4 className="font-bold">معلومات الاتصال</h4><p><strong>الهاتف:</strong> {selectedCustomer.phone}</p><p><strong>العنوان:</strong> {selectedCustomer.address}</p></div><div className="bg-gray-50 p-4 rounded-lg"><h4 className="font-bold">ملخص مالي</h4><p><strong>إجمالي المبيعات:</strong> {selectedCustomer.totalSales.toLocaleString()} ج.م</p><p><strong>إجمالي المدفوعات:</strong> {selectedCustomer.paid.toLocaleString()} ج.م</p><p className="font-bold"><strong>الرصيد المتبقي:</strong> <span className="text-red-600">{selectedCustomer.remaining.toLocaleString()} ج.م</span></p></div></div>
                    <div><h4 className="text-lg font-bold mb-2">سجل المبيعات</h4><div className="overflow-x-auto border rounded-lg"><table className="min-w-full bg-white text-sm"><thead className="bg-gray-100"><tr><th className="p-2 border-b">التاريخ</th><th className="p-2 border-b">رقم الحيوان</th><th className="p-2 border-b">المبلغ</th><th className="p-2 border-b">المدفوع</th><th className="p-2 border-b">المتبقي</th></tr></thead><tbody>{sales.filter(s => s.customerId === selectedCustomer.id).map(s => (<tr key={s.id} className="text-center"><td className="p-2 border-b">{s.date}</td><td className="p-2 border-b">{s.animalId}</td><td className="p-2 border-b">{s.price.toLocaleString()} ج.م</td><td className="p-2 border-b text-green-600">{s.paid.toLocaleString()} ج.م</td><td className="p-2 border-b text-red-600">{s.remaining.toLocaleString()} ج.م</td></tr>))}</tbody></table></div></div>
                    <div><h4 className="text-lg font-bold mb-2">سجل الدفعات</h4><div className="overflow-x-auto border rounded-lg"><table className="min-w-full bg-white text-sm"><thead className="bg-gray-100"><tr><th className="p-2 border-b">التاريخ</th><th className="p-2 border-b">المبلغ المحصّل</th><th className="p-2 border-b">ملاحظات</th></tr></thead><tbody>{payments.filter(p => p.customerId === selectedCustomer.id).map(p => (<tr key={p.id} className="text-center"><td className="p-2 border-b">{p.date}</td><td className="p-2 border-b text-green-600">{p.amount.toLocaleString()} ج.م</td><td className="p-2 border-b">{p.notes || '-'}</td></tr>))}</tbody></table></div></div>
                </div>)}
            </Modal>
        </>
    );
};

export default Customers;
