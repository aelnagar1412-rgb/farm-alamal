
import React, { useEffect, useState } from 'react';
import { Animal, Vaccination, AnimalType } from '../types';
import api from '../services/api';
import Modal from '../components/Modal';
import { PlusIcon, TrashIcon, PencilIcon, EyeIcon, SparklesIcon } from '../components/Icons';

const Animals: React.FC = () => {
    const [animals, setAnimals] = useState<Animal[]>([]);
    const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
    const [animalTypes, setAnimalTypes] = useState<AnimalType[]>([]);
    
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    
    const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
    const [editingAnimalData, setEditingAnimalData] = useState<Partial<Animal> | null>(null);

    const [newAnimal, setNewAnimal] = useState({
        id: '',
        age: '',
        weight: '',
        entryDate: new Date().toISOString().split('T')[0],
        cost: '',
        breedingCost: '',
        typeId: '',
    });

    const fetchData = async () => {
        const [animalsData, vaccinationsData, typesData] = await Promise.all([
            api.getAnimals(),
            api.getVaccinations(),
            api.getAnimalTypes()
        ]);
        setAnimals(animalsData);
        setVaccinations(vaccinationsData);
        setAnimalTypes(typesData);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewAnimal(prev => ({ ...prev, [name]: value }));
    };

    const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (editingAnimalData) {
            setEditingAnimalData({ ...editingAnimalData, [name]: value });
        }
    };

    const generateAnimalId = () => {
        const newId = `A-${String(Date.now()).slice(-5)}`;
        setNewAnimal(prev => ({ ...prev, id: newId }));
    };

    const handleAddAnimal = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedId = newAnimal.id.trim();
        if (!trimmedId) {
            alert('يرجى إدخال رقم الحيوان أو إنشائه تلقائياً.');
            return;
        }
        if (animals.some(c => c.id === trimmedId)) {
            alert('رقم الحيوان هذا موجود بالفعل. يرجى استخدام رقم آخر.');
            return;
        }
        const newRecord: Animal = {
            id: trimmedId,
            age: Number(newAnimal.age),
            weight: Number(newAnimal.weight),
            entryDate: newAnimal.entryDate,
            cost: Number(newAnimal.cost),
            breedingCost: Number(newAnimal.breedingCost) || 0,
            status: 'Available',
            typeId: newAnimal.typeId,
        };
        await api.saveAnimals([...animals, newRecord]);
        fetchData();
        setIsAddModalOpen(false);
        setNewAnimal({ id: '', age: '', weight: '', entryDate: new Date().toISOString().split('T')[0], cost: '', breedingCost: '', typeId: '' });
    };

     const handleUpdateAnimal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingAnimalData) return;
        const updatedAnimalList = animals.map(c => 
            c.id === editingAnimalData.id ? { ...c, ...editingAnimalData } : c
        );
        await api.saveAnimals(updatedAnimalList as Animal[]);
        fetchData();
        setIsEditModalOpen(false);
        setEditingAnimalData(null);
    };

    const openDeleteModal = (animalToDelete: Animal) => {
        setSelectedAnimal(animalToDelete);
        setIsDeleteModalOpen(true);
    };
    
    const handleDeleteConfirm = async () => {
        if (selectedAnimal) {
            await api.saveAnimals(animals.filter(c => c.id !== selectedAnimal.id));
            fetchData();
            setIsDeleteModalOpen(false);
            setSelectedAnimal(null);
        }
    };
    
    const openEditModal = (animalToEdit: Animal) => {
        setEditingAnimalData({ ...animalToEdit });
        setIsEditModalOpen(true);
    };

    const openDetailsModal = (animalDetails: Animal) => {
        setSelectedAnimal(animalDetails);
        setIsDetailsModalOpen(true);
    };
    
    const getTypeName = (typeId?: string) => animalTypes.find(b => b.id === typeId)?.name || 'غير محدد';


    return (
        <>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">إدارة المواشي</h2>
                    <button onClick={() => setIsAddModalOpen(true)} className="flex items-center bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                        <PlusIcon className="w-5 h-5 me-2" />
                        إضافة حيوان جديد
                    </button>
                </div>
                
                <div className="overflow-x-auto hidden md:block">
                    <table className="min-w-full bg-white">
                        <thead className="bg-gray-200">
                            <tr>
                                <th className="py-2 px-4 border-b">رقم الحيوان</th>
                                <th className="py-2 px-4 border-b">النوع/السلالة</th>
                                <th className="py-2 px-4 border-b">العمر (شهر)</th>
                                <th className="py-2 px-4 border-b">الوزن (كجم)</th>
                                <th className="py-2 px-4 border-b">تاريخ الدخول</th>
                                <th className="py-2 px-4 border-b">تكلفة الشراء</th>
                                <th className="py-2 px-4 border-b">الحالة</th>
                                <th className="py-2 px-4 border-b">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {animals.map((c) => (
                                <tr key={c.id} className="text-center hover:bg-gray-50">
                                    <td className="py-2 px-4 border-b">{c.id}</td>
                                    <td className="py-2 px-4 border-b">{getTypeName(c.typeId)}</td>
                                    <td className="py-2 px-4 border-b">{c.age}</td>
                                    <td className="py-2 px-4 border-b">{c.weight}</td>
                                    <td className="py-2 px-4 border-b">{c.entryDate}</td>
                                    <td className="py-2 px-4 border-b">{c.cost.toLocaleString()} ج.م</td>
                                    <td className="py-2 px-4 border-b">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${c.status === 'Available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {c.status === 'Available' ? 'متاح' : 'مباع'}
                                        </span>
                                    </td>
                                    <td className="py-2 px-4 border-b">
                                        <div className="flex justify-center items-center gap-3">
                                            <button onClick={() => openDetailsModal(c)} className="text-gray-500 hover:text-blue-600" title="تفاصيل"><EyeIcon /></button>
                                            <button onClick={() => openEditModal(c)} className="text-gray-500 hover:text-yellow-600" title="تعديل"><PencilIcon /></button>
                                            <button onClick={() => openDeleteModal(c)} className="text-gray-500 hover:text-red-600" title="حذف"><TrashIcon className="w-5 h-5" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
                    {animals.map((c) => (
                        <div key={c.id} className="bg-white p-4 rounded-lg shadow border border-gray-200">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold text-lg text-gray-800">{c.id} <span className="text-sm font-normal text-gray-500">({getTypeName(c.typeId)})</span></h3>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${c.status === 'Available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {c.status === 'Available' ? 'متاح' : 'مباع'}
                                </span>
                            </div>
                            <div className="text-sm space-y-1 text-gray-600">
                                <p><strong>العمر:</strong> {c.age} شهر</p><p><strong>الوزن:</strong> {c.weight} كجم</p><p><strong>التكلفة:</strong> {c.cost.toLocaleString()} ج.م</p><p><strong>تاريخ الدخول:</strong> {c.entryDate}</p>
                            </div>
                            <div className="flex justify-end items-center gap-2 border-t pt-3 mt-3">
                                <button onClick={() => openDetailsModal(c)} className="text-gray-500 hover:text-blue-600 p-1" title="تفاصيل"><EyeIcon /></button>
                                <button onClick={() => openEditModal(c)} className="text-gray-500 hover:text-yellow-600 p-1" title="تعديل"><PencilIcon /></button>
                                <button onClick={() => openDeleteModal(c)} className="text-gray-500 hover:text-red-600 p-1" title="حذف"><TrashIcon className="w-5 h-5" /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="إضافة حيوان جديد">
                <form onSubmit={handleAddAnimal}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="id" className="block text-sm font-medium text-gray-700">رقم الحيوان</label>
                            <div className="mt-1 flex rounded-md shadow-sm">
                                <input type="text" id="id" name="id" value={newAnimal.id} onChange={handleInputChange} required className="flex-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-s-md" placeholder="مثال: A-1234" />
                                <button type="button" onClick={generateAnimalId} className="inline-flex items-center px-3 rounded-e-md border border-s-0 border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-100" title="إنشاء رقم تلقائي"><SparklesIcon className="h-5 w-5" /></button>
                            </div>
                        </div>
                        <div><label htmlFor="typeId" className="block text-sm font-medium text-gray-700">النوع/السلالة</label><select id="typeId" name="typeId" value={newAnimal.typeId} onChange={handleInputChange} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md"><option value="" disabled>-- اختر النوع --</option>{animalTypes.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label htmlFor="age" className="block text-sm font-medium text-gray-700">العمر (بالأشهر)</label><input type="number" id="age" name="age" value={newAnimal.age} onChange={handleInputChange} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md"/></div>
                            <div><label htmlFor="weight" className="block text-sm font-medium text-gray-700">الوزن (كجم)</label><input type="number" id="weight" name="weight" value={newAnimal.weight} onChange={handleInputChange} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md"/></div>
                        </div>
                        <div><label htmlFor="entryDate" className="block text-sm font-medium text-gray-700">تاريخ الدخول</label><input type="date" id="entryDate" name="entryDate" value={newAnimal.entryDate} onChange={handleInputChange} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md"/></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label htmlFor="cost" className="block text-sm font-medium text-gray-700">تكلفة الشراء</label><input type="number" id="cost" name="cost" value={newAnimal.cost} onChange={handleInputChange} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md"/></div>
                            <div><label htmlFor="breedingCost" className="block text-sm font-medium text-gray-700">تكلفة التربية</label><input type="number" id="breedingCost" name="breedingCost" value={newAnimal.breedingCost} onChange={handleInputChange} placeholder="علف, أدوية, ..." className="mt-1 block w-full p-2 border border-gray-300 rounded-md"/></div>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">إلغاء</button><button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">حفظ</button></div>
                </form>
            </Modal>
            
             <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`تعديل بيانات الحيوان: ${editingAnimalData?.id}`}>
                <form onSubmit={handleUpdateAnimal}>
                    <div className="space-y-4">
                        <div><label className="block text-sm font-medium text-gray-700">النوع/السلالة</label><select name="typeId" value={editingAnimalData?.typeId} onChange={handleEditInputChange} required className="mt-1 block w-full p-2 border rounded-md"><option value="" disabled>-- اختر النوع --</option>{animalTypes.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
                        <div><label className="block text-sm font-medium text-gray-700">العمر (بالأشهر)</label><input type="number" name="age" value={editingAnimalData?.age} onChange={handleEditInputChange} required className="mt-1 block w-full p-2 border rounded-md"/></div>
                        <div><label className="block text-sm font-medium text-gray-700">الوزن (كجم)</label><input type="number" name="weight" value={editingAnimalData?.weight} onChange={handleEditInputChange} required className="mt-1 block w-full p-2 border rounded-md"/></div>
                        <div><label className="block text-sm font-medium text-gray-700">تاريخ الدخول</label><input type="date" name="entryDate" value={editingAnimalData?.entryDate} onChange={handleEditInputChange} required className="mt-1 block w-full p-2 border rounded-md"/></div>
                        <div><label className="block text-sm font-medium text-gray-700">تكلفة الشراء</label><input type="number" name="cost" value={editingAnimalData?.cost} onChange={handleEditInputChange} required className="mt-1 block w-full p-2 border rounded-md"/></div>
                        <div><label className="block text-sm font-medium text-gray-700">تكلفة التربية</label><input type="number" name="breedingCost" value={editingAnimalData?.breedingCost || ''} onChange={handleEditInputChange} className="mt-1 block w-full p-2 border rounded-md"/></div>
                    </div>
                    <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded-md">إلغاء</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">حفظ</button></div>
                </form>
            </Modal>
            
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="تأكيد الحذف">
                <div>
                    <p>هل أنت متأكد من حذف الحيوان <span className='font-bold'>{selectedAnimal?.id}</span>؟</p>
                    <div className="mt-6 flex justify-end gap-2"><button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded-md">إلغاء</button><button onClick={handleDeleteConfirm} className="px-4 py-2 bg-red-600 text-white rounded-md">حذف</button></div>
                </div>
            </Modal>

            <Modal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} title={`تفاصيل الحيوان: ${selectedAnimal?.id}`} size="4xl">
                {selectedAnimal && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg">
                             <div>
                                <h4 className="font-bold text-gray-800 mb-2">المعلومات الأساسية</h4>
                                <p><strong>الرقم:</strong> {selectedAnimal.id}</p>
                                <p><strong>النوع/السلالة:</strong> {getTypeName(selectedAnimal.typeId)}</p>
                                <p><strong>العمر الحالي:</strong> {selectedAnimal.age} شهر</p>
                                <p><strong>الوزن الحالي:</strong> {selectedAnimal.weight} كجم</p><p><strong>تاريخ الدخول:</strong> {selectedAnimal.entryDate}</p>
                                <p><strong>الحالة:</strong><span className={`ms-2 px-2 py-1 text-xs font-semibold rounded-full ${selectedAnimal.status === 'Available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{selectedAnimal.status === 'Available' ? 'متاح' : 'مباع'}</span></p>
                             </div>
                             <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-bold text-gray-800 mb-2">تحليل التكلفة والأرباح</h4>
                                <p><strong>تكلفة الشراء:</strong> {selectedAnimal.cost.toLocaleString()} ج.م</p>
                                <p><strong>تكاليف التربية:</strong> {(selectedAnimal.breedingCost || 0).toLocaleString()} ج.م</p>
                                <hr className="my-2"/>
                                <p className="font-bold"><strong>إجمالي التكلفة:</strong> {(selectedAnimal.cost + (selectedAnimal.breedingCost || 0)).toLocaleString()} ج.م</p>
                                {selectedAnimal.status === 'Sold' && (
                                    <div className="mt-2 pt-2 border-t">
                                        <p><strong>تاريخ البيع:</strong> {selectedAnimal.saleDate}</p>
                                        <p><strong>سعر البيع:</strong> {selectedAnimal.salePrice?.toLocaleString()} ج.م</p>
                                        <p className="font-bold mt-1"><strong>صافي الربح:</strong> <span className="text-green-600 text-lg">{((selectedAnimal.salePrice || 0) - (selectedAnimal.cost + (selectedAnimal.breedingCost || 0))).toLocaleString()} ج.م</span></p>
                                    </div>
                                )}
                             </div>
                        </div>

                        <div>
                            <h4 className="text-lg font-bold text-gray-800 mb-2">سجل التحصينات</h4>
                            <div className="overflow-x-auto border rounded-lg">
                                <table className="min-w-full bg-white text-sm"><thead className="bg-gray-100"><tr><th className="p-2 border-b">النوع</th><th className="p-2 border-b">التاريخ</th><th className="p-2 border-b">الجرعة</th><th className="p-2 border-b">الطبيب</th><th className="p-2 border-b">الجرعة القادمة</th></tr></thead>
                                    <tbody>
                                        {vaccinations.filter(v => v.animalId === selectedAnimal.id).length > 0 ? (
                                            vaccinations.filter(v => v.animalId === selectedAnimal.id).map(v => (
                                                <tr key={v.id} className="text-center"><td className="p-2 border-b">{v.type}</td><td className="p-2 border-b">{v.date}</td><td className="p-2 border-b">{v.dose}</td><td className="p-2 border-b">{v.vet}</td><td className="p-2 border-b">{v.nextDueDate || '-'}</td></tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan={5} className="text-center p-4 text-gray-500">لا يوجد سجلات تحصين.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
};

export default Animals;
