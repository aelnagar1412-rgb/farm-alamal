
import React, { useEffect, useState } from 'react';
import { Vaccination, Animal } from '../types';
import api from '../services/api';
import Modal from '../components/Modal';
import { PlusIcon } from '../components/Icons';

const Vaccinations: React.FC = () => {
    const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [allAnimals, setAllAnimals] = useState<Animal[]>([]);
    const [newVaccination, setNewVaccination] = useState({
        animalId: '',
        type: '',
        date: new Date().toISOString().split('T')[0],
        dose: '',
        vet: '',
        nextDueDate: ''
    });

    const fetchVaccinations = async () => {
        const data = await api.getVaccinations();
        setVaccinations(data);
    };

    useEffect(() => {
        fetchVaccinations();
    }, []);

    useEffect(() => {
        if (isModalOpen) {
            const fetchAllAnimals = async () => {
                const animalData = await api.getAnimals();
                setAllAnimals(animalData);
            };
            fetchAllAnimals();
        }
    }, [isModalOpen]);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewVaccination(prev => ({ ...prev, [name]: value }));
    };

    const handleAddVaccination = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newVaccination.animalId) {
            alert("يرجى اختيار حيوان.");
            return;
        }
        const newRecord: Vaccination = {
            ...newVaccination,
            id: `V-${Date.now()}`
        };
        await api.saveVaccinations([...vaccinations, newRecord]);
        fetchVaccinations();
        setIsModalOpen(false);
        setNewVaccination({ animalId: '', type: '', date: new Date().toISOString().split('T')[0], dose: '', vet: '', nextDueDate: '' });
    };

    return (
        <>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">التحصينات والعلاج</h2>
                    <button onClick={() => setIsModalOpen(true)} className="flex items-center bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                         <PlusIcon className="w-5 h-5 me-2" />
                        إضافة تحصين جديد
                    </button>
                </div>
                
                {/* Desktop Table */}
                <div className="overflow-x-auto hidden md:block">
                    <table className="min-w-full bg-white">
                        <thead className="bg-gray-200">
                            <tr>
                                <th className="py-2 px-4 border-b">رقم الحيوان</th>
                                <th className="py-2 px-4 border-b">نوع التحصين</th>
                                <th className="py-2 px-4 border-b">التاريخ</th>
                                <th className="py-2 px-4 border-b">الجرعة</th>
                                <th className="py-2 px-4 border-b">الطبيب</th>
                                <th className="py-2 px-4 border-b">موعد الجرعة القادمة</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vaccinations.map((vac) => (
                                <tr key={vac.id} className="text-center hover:bg-gray-50">
                                    <td className="py-2 px-4 border-b">{vac.animalId}</td>
                                    <td className="py-2 px-4 border-b">{vac.type}</td>
                                    <td className="py-2 px-4 border-b">{vac.date}</td>
                                    <td className="py-2 px-4 border-b">{vac.dose}</td>
                                    <td className="py-2 px-4 border-b">{vac.vet}</td>
                                    <td className="py-2 px-4 border-b font-semibold text-red-600">{vac.nextDueDate}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className="space-y-4 md:hidden">
                    {vaccinations.map((vac) => (
                        <div key={vac.id} className="bg-white p-4 rounded-lg shadow border border-gray-200">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-bold text-gray-800">{vac.type}</h3>
                                    <p className="text-sm text-gray-600">للحيوان: <span className="font-semibold">{vac.animalId}</span></p>
                                </div>
                                <span className="text-sm text-gray-500">{vac.date}</span>
                            </div>
                            <div className="text-sm space-y-1 border-t pt-2 mt-2">
                                <p><strong>الجرعة:</strong> {vac.dose}</p>
                                <p><strong>الطبيب:</strong> {vac.vet}</p>
                                <p><strong>الجرعة القادمة:</strong> <span className="font-semibold text-red-600">{vac.nextDueDate || '-'}</span></p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="إضافة تحصين جديد">
                <form onSubmit={handleAddVaccination}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="animalId" className="block text-sm font-medium text-gray-700">اختر الحيوان</label>
                            <select id="animalId" name="animalId" value={newVaccination.animalId} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500">
                                <option value="" disabled>-- اختر رقم الحيوان --</option>
                                {allAnimals.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="type" className="block text-sm font-medium text-gray-700">نوع التحصين/العلاج</label>
                            <input type="text" id="type" name="type" value={newVaccination.type} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"/>
                        </div>
                         <div>
                            <label htmlFor="dose" className="block text-sm font-medium text-gray-700">الجرعة</label>
                            <input type="text" id="dose" name="dose" value={newVaccination.dose} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"/>
                        </div>
                        <div>
                            <label htmlFor="vet" className="block text-sm font-medium text-gray-700">الطبيب المسؤول</label>
                            <input type="text" id="vet" name="vet" value={newVaccination.vet} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"/>
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="date" className="block text-sm font-medium text-gray-700">تاريخ الجرعة الحالية</label>
                                <input type="date" id="date" name="date" value={newVaccination.date} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"/>
                            </div>
                             <div>
                                <label htmlFor="nextDueDate" className="block text-sm font-medium text-gray-700">تاريخ الجرعة القادمة</label>
                                <input type="date" id="nextDueDate" name="nextDueDate" value={newVaccination.nextDueDate} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"/>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end space-x-2 space-x-reverse">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">إلغاء</button>
                        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">حفظ</button>
                    </div>
                </form>
            </Modal>
        </>
    );
};

export default Vaccinations;
