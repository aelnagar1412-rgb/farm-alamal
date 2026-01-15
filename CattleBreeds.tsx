
import React, { useEffect, useState } from 'react';
import { AnimalType } from '../types';
import api from '../services/api';
import Modal from '../components/Modal';
import { PlusIcon, TrashIcon, PencilIcon } from '../components/Icons';

const AnimalTypes: React.FC = () => {
    const [animalTypes, setAnimalTypes] = useState<AnimalType[]>([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    
    const [selectedAnimalType, setSelectedAnimalType] = useState<AnimalType | null>(null);
    const [editingAnimalTypeData, setEditingAnimalTypeData] = useState<Partial<AnimalType>>({});

    const [newAnimalType, setNewAnimalType] = useState({ name: '', description: '' });

    const fetchData = async () => {
        const typesData = await api.getAnimalTypes();
        setAnimalTypes(typesData);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setNewAnimalType(prev => ({ ...prev, [name]: value }));
    };

    const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditingAnimalTypeData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddAnimalType = async (e: React.FormEvent) => {
        e.preventDefault();
        const newRecord: AnimalType = {
            id: `TYPE-${Date.now()}`,
            name: newAnimalType.name,
            description: newAnimalType.description,
        };
        await api.saveAnimalTypes([...animalTypes, newRecord]);
        fetchData();
        setIsAddModalOpen(false);
        setNewAnimalType({ name: '', description: '' });
    };

    const handleUpdateAnimalType = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingAnimalTypeData || !editingAnimalTypeData.id) return;
        const updatedTypesList = animalTypes.map(b => 
            b.id === editingAnimalTypeData.id ? { ...b, ...editingAnimalTypeData } : b
        );
        await api.saveAnimalTypes(updatedTypesList as AnimalType[]);
        fetchData();
        setIsEditModalOpen(false);
        setEditingAnimalTypeData({});
    };

    const openDeleteModal = (type: AnimalType) => {
        setSelectedAnimalType(type);
        setIsDeleteModalOpen(true);
    };
    
    const handleDeleteConfirm = async () => {
        if (selectedAnimalType) {
            const animals = await api.getAnimals();
            if (animals.some(c => c.typeId === selectedAnimalType.id)) {
                alert('لا يمكن حذف هذا النوع لأنه مستخدم حالياً في سجلات المواشي.');
                setIsDeleteModalOpen(false);
                setSelectedAnimalType(null);
                return;
            }
            await api.saveAnimalTypes(animalTypes.filter(b => b.id !== selectedAnimalType.id));
            fetchData();
            setIsDeleteModalOpen(false);
            setSelectedAnimalType(null);
        }
    };
    
    const openEditModal = (type: AnimalType) => {
        setEditingAnimalTypeData({ ...type });
        setIsEditModalOpen(true);
    };

    return (
        <>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">إدارة أنواع الحيوانات</h2>
                    <button onClick={() => setIsAddModalOpen(true)} className="flex items-center bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                        <PlusIcon className="w-5 h-5 me-2" />
                        إضافة نوع جديد
                    </button>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                        <thead className="bg-gray-200">
                            <tr>
                                <th className="py-2 px-4 border-b">اسم النوع</th>
                                <th className="py-2 px-4 border-b">الوصف</th>
                                <th className="py-2 px-4 border-b">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {animalTypes.map((type) => (
                                <tr key={type.id} className="text-center hover:bg-gray-50">
                                    <td className="py-2 px-4 border-b">{type.name}</td>
                                    <td className="py-2 px-4 border-b text-right">{type.description || '-'}</td>
                                    <td className="py-2 px-4 border-b">
                                        <div className="flex justify-center items-center gap-3">
                                            <button onClick={() => openEditModal(type)} className="text-gray-500 hover:text-yellow-600" title="تعديل"><PencilIcon /></button>
                                            <button onClick={() => openDeleteModal(type)} className="text-gray-500 hover:text-red-600" title="حذف"><TrashIcon className="w-5 h-5" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="إضافة نوع جديد">
                <form onSubmit={handleAddAnimalType}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">اسم النوع (مثل: عجل هولشتاين)</label>
                            <input type="text" id="name" name="name" value={newAnimalType.name} onChange={handleInputChange} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md"/>
                        </div>
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">الوصف (اختياري)</label>
                            <textarea id="description" name="description" value={newAnimalType.description} onChange={handleInputChange} rows={3} className="mt-1 block w-full p-2 border border-gray-300 rounded-md"></textarea>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-2">
                        <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">إلغاء</button>
                        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">حفظ</button>
                    </div>
                </form>
            </Modal>
            
             <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`تعديل نوع: ${editingAnimalTypeData?.name}`}>
                <form onSubmit={handleUpdateAnimalType}>
                    <div className="space-y-4">
                         <div>
                            <label className="block text-sm font-medium text-gray-700">اسم النوع</label>
                            <input type="text" name="name" value={editingAnimalTypeData?.name || ''} onChange={handleEditInputChange} required className="mt-1 block w-full p-2 border rounded-md"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">الوصف (اختياري)</label>
                            <textarea name="description" value={editingAnimalTypeData?.description || ''} onChange={handleEditInputChange} rows={3} className="mt-1 block w-full p-2 border rounded-md"></textarea>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-2">
                        <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded-md">إلغاء</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">حفظ التعديلات</button>
                    </div>
                </form>
            </Modal>
            
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="تأكيد الحذف">
                <div>
                    <p>هل أنت متأكد من حذف نوع <span className='font-bold'>{selectedAnimalType?.name}</span>؟</p>
                    <p className="text-sm text-red-600 mt-2">ملاحظة: لا يمكن حذف النوع إذا كان مرتبطاً بأي من المواشي الحالية.</p>
                    <div className="mt-6 flex justify-end gap-2">
                        <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded-md">إلغاء</button>
                        <button onClick={handleDeleteConfirm} className="px-4 py-2 bg-red-600 text-white rounded-md">حذف</button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default AnimalTypes;
