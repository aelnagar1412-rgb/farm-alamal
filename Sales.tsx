
import React, { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Sale, Animal, TreasuryEntry, Customer } from '../types';
import api from '../services/api';
import Modal from '../components/Modal';
import { PlusIcon, PencilIcon } from '../components/Icons';

// Helper function to fetch a font and return its Base64 representation
const getFontAsBase64 = (url: string): Promise<string> => {
    return new Promise(async (resolve, reject) => {
        try {
            const cachedFont = sessionStorage.getItem('amiriFontBase64');
            if (cachedFont) {
                resolve(cachedFont);
                return;
            }

            const response = await fetch(url);
            if (!response.ok) {
                 throw new Error(`Failed to fetch font: ${response.statusText}`);
            }
            const blob = await response.blob();
            
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64data = (reader.result as string).split(',')[1];
                sessionStorage.setItem('amiriFontBase64', base64data); // Cache the font
                resolve(base64data);
            };
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(blob);

        } catch (error) {
            reject(error);
        }
    });
};


const Sales: React.FC = () => {
    const [sales, setSales] = useState<Sale[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [animals, setAnimals] = useState<Animal[]>([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingSale, setEditingSale] = useState<Sale | null>(null);
    const [isPrinting, setIsPrinting] = useState(false);
    const [newSale, setNewSale] = useState({
        date: new Date().toISOString().split('T')[0],
        animalId: '',
        customerId: '',
        price: '',
        paid: '',
    });

    const fetchData = async () => {
        const [salesData, customersData, animalsData] = await Promise.all([
            api.getSales(),
            api.getCustomers(),
            api.getAnimals(),
        ]);
        setSales(salesData);
        setCustomers(customersData);
        setAnimals(animalsData);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const availableAnimals = animals.filter(c => c.status === 'Available');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (editingSale) {
            setEditingSale({ ...editingSale, [name]: value });
        } else {
            setNewSale(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleAddSale = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSale.animalId || !newSale.customerId) {
            alert("يرجى اختيار حيوان وعميل لإتمام عملية البيع.");
            return;
        }

        const price = Number(newSale.price);
        const paid = Number(newSale.paid);
        
        const newRecord: Sale = {
            id: `S-${Date.now()}`,
            date: newSale.date,
            animalId: newSale.animalId,
            customerId: newSale.customerId,
            price: price,
            paid: paid,
            remaining: price - paid,
        };
        
        const allAnimals = await api.getAnimals();
        const updatedAnimals = allAnimals.map((c): Animal => {
            if (c.id === newSale.animalId) {
                const totalCost = c.cost + (c.breedingCost || 0);
                const profit = newRecord.price - totalCost;
                return { ...c, status: 'Sold', saleDate: newRecord.date, salePrice: newRecord.price, profit: profit };
            }
            return c;
        });
        
        const allCustomers = await api.getCustomers();
        const updatedCustomers = allCustomers.map(cust => {
            if (cust.id === newSale.customerId) {
                return { ...cust, totalSales: cust.totalSales + price, paid: cust.paid + paid, remaining: cust.remaining + (price - paid) };
            }
            return cust;
        });
        
        const treasuryEntry: TreasuryEntry = {
            id: `T-${Date.now()}`, date: newRecord.date, description: `إيراد بيع الحيوان ${newRecord.animalId}`,
            type: 'وارد', amount: newRecord.paid, sourceId: newRecord.id,
        };
        const currentTreasury = await api.getTreasuryEntries();
        
        await Promise.all([
            api.saveSales([...sales, newRecord]),
            api.saveAnimals(updatedAnimals),
            api.saveCustomers(updatedCustomers),
            api.saveTreasury([...currentTreasury, treasuryEntry])
        ]);
        
        fetchData();
        setIsAddModalOpen(false);
        setNewSale({ date: new Date().toISOString().split('T')[0], animalId: '', customerId: '', price: '', paid: '' });
    };

    const openEditModal = (sale: Sale) => {
        setEditingSale({
            ...sale,
            price: Number(sale.price),
            paid: Number(sale.paid)
        });
        setIsEditModalOpen(true);
    };

    const handleUpdateSale = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSale) return;

        const originalSale = sales.find(s => s.id === editingSale.id);
        if (!originalSale) return;

        const newPrice = Number(editingSale.price);
        const newPaid = Number(editingSale.paid);
        const priceDiff = newPrice - originalSale.price;
        const paidDiff = newPaid - originalSale.paid;

        const updatedSaleRecord: Sale = { ...editingSale, price: newPrice, paid: newPaid, remaining: newPrice - newPaid };

        const [allCustomers, allAnimals, allTreasury] = await Promise.all([api.getCustomers(), api.getAnimals(), api.getTreasuryEntries()]);
        
        const updatedCustomers = allCustomers.map(c => c.id === originalSale.customerId ? { ...c, totalSales: c.totalSales + priceDiff, paid: c.paid + paidDiff, remaining: (c.totalSales + priceDiff) - (c.paid + paidDiff) } : c);
        
        const updatedAnimals = allAnimals.map(c => {
            if (c.id === originalSale.animalId) {
                const totalCost = c.cost + (c.breedingCost || 0);
                const newProfit = newPrice - totalCost;
                return { ...c, salePrice: newPrice, profit: newProfit };
            }
            return c;
        });

        const updatedTreasury = allTreasury.map(t => t.sourceId === originalSale.id ? { ...t, amount: newPaid, date: updatedSaleRecord.date } : t);
        const updatedSales = sales.map(s => s.id === originalSale.id ? updatedSaleRecord : s);

        await Promise.all([
            api.saveSales(updatedSales),
            api.saveCustomers(updatedCustomers),
            api.saveAnimals(updatedAnimals),
            api.saveTreasury(updatedTreasury)
        ]);
        
        fetchData();
        setIsEditModalOpen(false);
        setEditingSale(null);
    };
    
    const getCustomerName = (customerId: string) => customers.find(c => c.id === customerId)?.name || 'غير معروف';

    const handlePrintInvoice = async (sale: Sale) => {
        if (isPrinting) return;
        setIsPrinting(true);

        const customer = customers.find(c => c.id === sale.customerId);
        const soldAnimal = animals.find(c => c.id === sale.animalId);

        const doc = new jsPDF();

        try {
             // A reliable CDN link for the Amiri font TTF file.
            const fontUrl = 'https://alefalefalef.github.io/Amiri-font/Amiri-Regular.ttf';
            const amiriFontBase64 = await getFontAsBase64(fontUrl);
            
            doc.addFileToVFS("Amiri-Regular.ttf", amiriFontBase64);
            doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
            doc.setFont("Amiri");
        } catch (error) {
            console.error("Font loading failed:", error);
            alert("فشل تحميل الخط العربي للطباعة. قد تظهر الفاتورة بشكل غير صحيح.");
            doc.setFont("Helvetica"); // Fallback font
        }


        const pageWidth = doc.internal.pageSize.getWidth();
        const rightAlign = (text: string) => {
            const textWidth = doc.getTextWidth(text);
            return pageWidth - textWidth - 15;
        };
        
        doc.setFontSize(22);
        doc.text("فاتورة بيع", rightAlign("فاتورة بيع"), 20);
        
        doc.setFontSize(12);
        doc.text("مزرعة الأمل للمواشي", rightAlign("مزرعة الأمل للمواشي"), 30);
        doc.text("هاتف: 01234567890", rightAlign("هاتف: 01234567890"), 36);

        doc.setLineWidth(0.5);
        doc.line(15, 45, pageWidth - 15, 45);

        doc.setFontSize(12);
        doc.text(`رقم الفاتورة: ${sale.id}`, rightAlign(`رقم الفاتورة: ${sale.id}`), 55);
        doc.text(`التاريخ: ${sale.date}`, rightAlign(`التاريخ: ${sale.date}`), 61);

        doc.text("بيانات العميل:", rightAlign("بيانات العميل:"), 71);
        doc.text(`الاسم: ${customer?.name || 'غير متوفر'}`, rightAlign(`الاسم: ${customer?.name || 'غير متوفر'}`), 77);
        doc.text(`الهاتف: ${customer?.phone || 'غير متوفر'}`, rightAlign(`الهاتف: ${customer?.phone || 'غير متوفر'}`), 83);
        doc.text(`العنوان: ${customer?.address || 'غير متوفر'}`, rightAlign(`العنوان: ${customer?.address || 'غير متوفر'}`), 89);
        
        autoTable(doc, {
            startY: 100,
            head: [['الإجمالي', 'السعر', 'الكمية', 'البيان']],
            body: [
                [
                    `${sale.price.toLocaleString()} ج.م`,
                    `${sale.price.toLocaleString()} ج.م`,
                    '1',
                    `حيوان رقم ${sale.animalId} - وزن ${soldAnimal?.weight || ''} كجم`
                ]
            ],
            theme: 'grid',
            headStyles: {
                font: 'Amiri',
                halign: 'center',
                fillColor: [41, 128, 185],
                textColor: 255
            },
            bodyStyles: {
                font: 'Amiri',
                halign: 'center',
            },
            didDrawPage: (data) => {
                data.table.columns.forEach(column => {
                    if (column.dataKey === 'البيان') {
                        column.width = 80;
                    }
                });
            },
        });
        
        const finalY = (doc as any).lastAutoTable.finalY;
        doc.setFontSize(12);
        
        const summaryX = 15;
        const summaryY = finalY + 15;
        doc.text(`المبلغ الإجمالي: ${sale.price.toLocaleString()} ج.م`, summaryX, summaryY);
        doc.text(`المبلغ المدفوع: ${sale.paid.toLocaleString()} ج.م`, summaryX, summaryY + 7);
        doc.setFontSize(14);
        doc.setFont('Amiri', 'bold');
        doc.text(`المبلغ المتبقي: ${sale.remaining.toLocaleString()} ج.م`, summaryX, summaryY + 14);
        
        doc.save(`Invoice-${sale.id}.pdf`);
        setIsPrinting(false);
    };

    return (
        <>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">فواتير المبيعات</h2>
                    <button onClick={() => setIsAddModalOpen(true)} className="flex items-center bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                        <PlusIcon className="w-5 h-5 me-2" />
                        إنشاء فاتورة بيع
                    </button>
                </div>
                
                <div className="overflow-x-auto hidden md:block">
                    <table className="min-w-full bg-white">
                        <thead className="bg-gray-200">
                            <tr>
                                <th className="py-2 px-4 border-b">رقم الفاتورة</th><th className="py-2 px-4 border-b">التاريخ</th><th className="py-2 px-4 border-b">رقم الحيوان</th><th className="py-2 px-4 border-b">العميل</th><th className="py-2 px-4 border-b">السعر</th><th className="py-2 px-4 border-b">المدفوع</th><th className="py-2 px-4 border-b">المتبقي</th><th className="py-2 px-4 border-b">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sales.map((sale) => (
                                <tr key={sale.id} className="text-center hover:bg-gray-50">
                                    <td className="py-2 px-4 border-b">{sale.id}</td><td className="py-2 px-4 border-b">{sale.date}</td><td className="py-2 px-4 border-b">{sale.animalId}</td><td className="py-2 px-4 border-b">{getCustomerName(sale.customerId)}</td><td className="py-2 px-4 border-b">{sale.price.toLocaleString()} ج.м</td><td className="py-2 px-4 border-b text-green-600">{sale.paid.toLocaleString()} ج.м</td><td className="py-2 px-4 border-b text-red-600">{sale.remaining.toLocaleString()} ج.м</td>
                                    <td className="py-2 px-4 border-b">
                                        <div className="flex justify-center items-center gap-3">
                                            <button onClick={() => openEditModal(sale)} className="text-gray-500 hover:text-yellow-600" title="تعديل"><PencilIcon /></button>
                                            <button onClick={() => handlePrintInvoice(sale)} disabled={isPrinting} className="text-blue-600 hover:underline disabled:text-gray-400 disabled:cursor-wait">
                                                {isPrinting ? 'جاري الطباعة...' : 'طباعة PDF'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="space-y-4 md:hidden">
                    {sales.map((sale) => (
                        <div key={sale.id} className="bg-white p-4 rounded-lg shadow border border-gray-200">
                            <div className="flex justify-between items-start mb-2">
                                <div><h3 className="font-bold text-gray-800">{sale.id}</h3><p className="text-sm text-gray-500">{sale.date}</p></div>
                                <span className="font-bold text-lg text-gray-800">{sale.price.toLocaleString()} ج.м</span>
                            </div>
                            <div className="text-sm space-y-1 border-t pt-2 mt-2">
                                <p><strong>الحيوان:</strong> {sale.animalId}</p><p><strong>العميل:</strong> {getCustomerName(sale.customerId)}</p><p><strong>المدفوع:</strong> <span className="text-green-600">{sale.paid.toLocaleString()} ج.м</span></p><p><strong>المتبقي:</strong> <span className="text-red-600 font-bold">{sale.remaining.toLocaleString()} ج.м</span></p>
                            </div>
                            <div className="flex justify-end items-center gap-3 mt-2">
                                <button onClick={() => openEditModal(sale)} className="text-gray-500 hover:text-yellow-600 p-1" title="تعديل"><PencilIcon /></button>
                                <button onClick={() => handlePrintInvoice(sale)} disabled={isPrinting} className="text-blue-600 hover:underline text-sm disabled:text-gray-400 disabled:cursor-wait">
                                    {isPrinting ? 'جاري...' : 'طباعة PDF'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="إنشاء فاتورة بيع جديدة">
                <form onSubmit={handleAddSale}>
                     <div className="space-y-4">
                        <div><label className="block text-sm">اختر الحيوان</label><select name="animalId" value={newSale.animalId} onChange={handleInputChange} required className="mt-1 block w-full border rounded-md p-2"><option value="" disabled>-- اختر رقم الحيوان --</option>{availableAnimals.map(c => <option key={c.id} value={c.id}>{c.id} - الوزن: {c.weight} كجم</option>)}</select></div>
                        <div><label className="block text-sm">اختر العميل</label><select name="customerId" value={newSale.customerId} onChange={handleInputChange} required className="mt-1 block w-full border rounded-md p-2"><option value="" disabled>-- اختر العميل --</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                        <div><label className="block text-sm">تاريخ البيع</label><input type="date" name="date" value={newSale.date} onChange={handleInputChange} required className="mt-1 block w-full border rounded-md p-2"/></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-sm">مبلغ البيع</label><input type="number" name="price" value={newSale.price} onChange={handleInputChange} required className="mt-1 block w-full border rounded-md p-2"/></div>
                            <div><label className="block text-sm">المبلغ المدفوع</label><input type="number" name="paid" value={newSale.paid} onChange={handleInputChange} required className="mt-1 block w-full border rounded-md p-2"/></div>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded-md">إلغاء</button><button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md">حفظ</button></div>
                </form>
            </Modal>
            
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`تعديل فاتورة ${editingSale?.id}`}>
                <form onSubmit={handleUpdateSale}>
                    <div className="space-y-4">
                         <div><label className="block text-sm">الحيوان</label><input type="text" value={editingSale?.animalId} disabled className="mt-1 block w-full border rounded-md p-2 bg-gray-100"/></div>
                         <div><label className="block text-sm">العميل</label><input type="text" value={getCustomerName(editingSale?.customerId || '')} disabled className="mt-1 block w-full border rounded-md p-2 bg-gray-100"/></div>
                         <div><label className="block text-sm">تاريخ البيع</label><input type="date" name="date" value={editingSale?.date} onChange={handleInputChange} required className="mt-1 block w-full border rounded-md p-2"/></div>
                         <div className="grid grid-cols-2 gap-4">
                             <div><label className="block text-sm">مبلغ البيع</label><input type="number" name="price" value={editingSale?.price} onChange={handleInputChange} required className="mt-1 block w-full border rounded-md p-2"/></div>
                             <div><label className="block text-sm">المبلغ المدفوع</label><input type="number" name="paid" value={editingSale?.paid} onChange={handleInputChange} required className="mt-1 block w-full border rounded-md p-2"/></div>
                         </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded-md">إلغاء</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">حفظ التعديلات</button></div>
                </form>
            </Modal>
        </>
    );
};

export default Sales;
