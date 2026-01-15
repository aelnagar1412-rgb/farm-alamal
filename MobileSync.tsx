
import React, { useState } from 'react';

const STORAGE_KEYS = [
    'farm_cattle', 'farm_sales', 'farm_expenses', 'farm_vaccinations', 
    'farm_treasury', 'farm_suppliers', 'farm_supplier_payments', 'farm_customers', 
    'farm_customer_payments', 'farm_cattle_breeds', 'farm_opening_balance'
];

const Settings: React.FC = () => {
    const [appVersion] = useState('1.1.0');

    const handleBackup = () => {
        try {
            const backupData: { [key: string]: any } = {};
            STORAGE_KEYS.forEach(key => {
                const data = localStorage.getItem(key);
                if (data) {
                    // We parse and then stringify to ensure it's valid JSON, though not strictly necessary
                    backupData[key] = JSON.parse(data);
                }
            });

            const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
                JSON.stringify(backupData, null, 2)
            )}`;
            
            const link = document.createElement("a");
            link.href = jsonString;
            link.download = `farm-backup-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            alert('تم إنشاء النسخة الاحتياطية بنجاح!');
        } catch (error) {
            console.error("Failed to create backup:", error);
            alert('فشل إنشاء النسخة الاحتياطية.');
        }
    };

    const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!confirm('هل أنت متأكد من استعادة البيانات؟ سيتم الكتابة فوق جميع البيانات الحالية.')) {
            event.target.value = ''; // Reset file input
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("File content is not readable.");
                
                const data = JSON.parse(text);

                // Basic validation to see if it looks like a backup file
                const fileKeys = Object.keys(data);
                if (fileKeys.length === 0 || !STORAGE_KEYS.some(key => fileKeys.includes(key))) {
                    alert('ملف النسخة الاحتياطية غير صالح أو تالف.');
                    return;
                }

                // Clear existing data before restoring
                // You might want to be more selective, but for a full restore this is safest
                STORAGE_KEYS.forEach(key => localStorage.removeItem(key));

                // Restore new data
                fileKeys.forEach(key => {
                    if (STORAGE_KEYS.includes(key) && data[key]) {
                        localStorage.setItem(key, JSON.stringify(data[key]));
                    }
                });

                alert('تم استعادة البيانات بنجاح! سيتم إعادة تحميل التطبيق الآن.');
                window.location.reload();

            } catch (error) {
                console.error("Failed to restore backup:", error);
                alert('فشل في استعادة النسخة الاحتياطية. تأكد من أن الملف صحيح.');
            } finally {
                event.target.value = ''; // Reset file input
            }
        };
        reader.readAsText(file);
    };

    const handleCheckForUpdate = () => {
        alert(`أنت تستخدم أحدث إصدار: ${appVersion}`);
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-3">النسخ الاحتياطي والاستعادة</h2>
                <p className="text-gray-600 mb-6">
                    قم بحفظ نسخة من بياناتك بشكل آمن أو استعد بياناتك من نسخة محفوظة سابقاً.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <button onClick={handleBackup} className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 w-full sm:w-auto">
                        إنشاء نسخة احتياطية
                    </button>
                    <div>
                        <label htmlFor="restore" className="cursor-pointer bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 inline-block">
                            استعادة نسخة احتياطية
                        </label>
                        <input type="file" id="restore" accept=".json" onChange={handleRestore} className="hidden" />
                    </div>
                </div>
                 <p className="text-xs text-gray-500 mt-4">
                    * يتم حفظ ملف النسخ الاحتياطي في مجلد التنزيلات الخاص بك. احتفظ به في مكان آمن.
                </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold text-gray-800 mb-4">حول التطبيق</h2>
                <div className="space-y-3 text-gray-700">
                    <div className="flex items-center">
                        <p className="w-32 font-semibold">النسخة الحالية:</p>
                        <p>{appVersion}</p>
                    </div>
                    <div className="flex items-center">
                        <p className="w-32 font-semibold">المطور:</p>
                        <p>Ahmed Elnagar</p>
                    </div>
                     <div className="mt-4">
                        <button onClick={handleCheckForUpdate} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">
                            التحقق من وجود تحديثات
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
