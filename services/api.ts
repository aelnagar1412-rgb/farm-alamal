
import { Animal, Sale, Expense, Vaccination, TreasuryEntry, Supplier, SupplierPayment, Customer, CustomerPayment, AnimalType } from '../types';

const getFromStorage = <T,>(key: string, defaultValue: T): T => {
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Error reading from localStorage key “${key}”:`, error);
        return defaultValue;
    }
};

const saveToStorage = <T,>(key: string, value: T) => {
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Error writing to localStorage key “${key}”:`, error);
    }
};

const initialAnimalTypes: AnimalType[] = [
    { id: 'TYPE-1', name: 'عجل هولشتاين', description: 'سلالة مشهورة بإنتاج الحليب العالي.' },
    { id: 'TYPE-2', name: 'عجل سيمنتال', description: 'سلالة ثنائية الغرض، جيدة للحليب واللحم.' },
    { id: 'TYPE-3', name: 'خروف صعيدي', description: 'سلالة محلية معروفة بقدرتها على التحمل.' },
    { id: 'TYPE-4', name: 'ماعز بور', description: 'سلالة معروفة بإنتاج اللحم.' },
];

const initialAnimals: Animal[] = [
    { id: 'A-001', age: 24, weight: 550, entryDate: '2023-01-15', cost: 15000, breedingCost: 2500, status: 'Available', typeId: 'TYPE-1' },
    { id: 'A-002', age: 30, weight: 620, entryDate: '2023-02-20', saleDate: '2024-05-10', cost: 17000, breedingCost: 3000, salePrice: 25000, profit: 5000, status: 'Sold', typeId: 'TYPE-2' },
    { id: 'A-003', age: 12, weight: 80, entryDate: '2023-03-10', cost: 3500, status: 'Available', typeId: 'TYPE-3' },
    { id: 'A-004', age: 28, weight: 590, entryDate: '2023-04-05', cost: 16000, breedingCost: 1800, status: 'Available', typeId: 'TYPE-1' },
];

const initialSales: Sale[] = [
    { id: 'S-001', date: '2024-05-10', animalId: 'A-002', customerId: 'CUST-001', price: 25000, paid: 20000, remaining: 5000 },
];

const initialExpenses: Expense[] = [
    { id: 'E-001', date: '2024-05-01', category: 'أعلاف', description: 'شراء طن علف', amount: 5000, supplierId: 'SUP-001' },
    { id: 'E-002', date: '2024-05-05', category: 'أدوية', description: 'فيتامينات ومضادات حيوية', amount: 1200, supplierId: 'SUP-002' },
    { id: 'E-003', date: '2024-05-15', category: 'عمالة', description: 'راتب عامل المزرعة', amount: 3000 },
    { id: 'E-004', date: '2024-05-20', category: 'كهرباء', description: 'فاتورة الكهرباء', amount: 800 },
];

const initialVaccinations: Vaccination[] = [
    { id: 'V-001', animalId: 'A-001', type: 'التحصين الثلاثي', date: '2024-03-01', dose: '5 مل', vet: 'د. علي حسن', nextDueDate: '2024-09-01' },
    { id: 'V-002', animalId: 'A-003', type: 'تحصين جدري الأغنام', date: '2024-04-15', dose: '2 مل', vet: 'د. علي حسن', nextDueDate: '2024-10-15' },
];

const initialTreasury: TreasuryEntry[] = [
    {id: 'T-001', date: '2024-05-01', description: 'مصروفات أعلاف', type: 'منصرف', amount: 5000 },
    {id: 'T-002', date: '2024-05-10', description: 'بيع الحيوان A-002', type: 'وارد', amount: 20000, sourceId: 'S-001'},
    {id: 'T-003', date: '2024-05-15', description: 'راتب عامل', type: 'منصرف', amount: 3000 },
];

const initialSuppliers: Supplier[] = [
    { id: 'SUP-001', name: 'شركة النور للأعلاف', phone: '01001234567', address: 'المنطقة الصناعية، القاهرة', category: 'أعلاف', totalPurchases: 75000, paid: 70000, remaining: 5000 },
    { id: 'SUP-002', name: 'المتحدة للأدوية البيطرية', phone: '01223456789', address: 'شارع الجمهورية، الإسكندرية', category: 'أدوية', totalPurchases: 22000, paid: 22000, remaining: 0 },
    { id: 'SUP-003', name: 'تجهيزات المزارع الحديثة', phone: '01156789012', address: 'طريق مصر-إسماعيلية', category: 'معدات', totalPurchases: 45000, paid: 40000, remaining: 5000 },
];

const initialSupplierPayments: SupplierPayment[] = [];

const initialCustomers: Customer[] = [
    { id: 'CUST-001', name: 'أحمد محمود', phone: '01234567890', address: 'القاهرة', totalSales: 25000, paid: 20000, remaining: 5000 },
    { id: 'CUST-002', name: 'محمد علي', phone: '01123456789', address: 'الجيزة', totalSales: 0, paid: 0, remaining: 0 },
];

const initialCustomerPayments: CustomerPayment[] = [];


const api = {
    getAnimals: async (): Promise<Animal[]> => Promise.resolve(getFromStorage('farm_animals', initialAnimals)),
    getSales: async (): Promise<Sale[]> => Promise.resolve(getFromStorage('farm_sales', initialSales)),
    getExpenses: async (): Promise<Expense[]> => Promise.resolve(getFromStorage('farm_expenses', initialExpenses)),
    getVaccinations: async (): Promise<Vaccination[]> => Promise.resolve(getFromStorage('farm_vaccinations', initialVaccinations)),
    getTreasuryEntries: async (): Promise<TreasuryEntry[]> => Promise.resolve(getFromStorage('farm_treasury', initialTreasury)),
    getSuppliers: async (): Promise<Supplier[]> => Promise.resolve(getFromStorage('farm_suppliers', initialSuppliers)),
    getSupplierPayments: async (): Promise<SupplierPayment[]> => Promise.resolve(getFromStorage('farm_supplier_payments', initialSupplierPayments)),
    getCustomers: async (): Promise<Customer[]> => Promise.resolve(getFromStorage('farm_customers', initialCustomers)),
    getCustomerPayments: async (): Promise<CustomerPayment[]> => Promise.resolve(getFromStorage('farm_customer_payments', initialCustomerPayments)),
    getAnimalTypes: async (): Promise<AnimalType[]> => Promise.resolve(getFromStorage('farm_animal_types', initialAnimalTypes)),
    getOpeningBalance: async (): Promise<number> => Promise.resolve(getFromStorage('farm_opening_balance', 50000)),


    saveAnimals: async (animals: Animal[]): Promise<void> => saveToStorage('farm_animals', animals),
    saveSales: async (sales: Sale[]): Promise<void> => saveToStorage('farm_sales', sales),
    saveExpenses: async (expenses: Expense[]): Promise<void> => saveToStorage('farm_expenses', expenses),
    saveVaccinations: async (vaccinations: Vaccination[]): Promise<void> => saveToStorage('farm_vaccinations', vaccinations),
    saveTreasury: async (entries: TreasuryEntry[]): Promise<void> => saveToStorage('farm_treasury', entries),
    saveSuppliers: async (suppliers: Supplier[]): Promise<void> => saveToStorage('farm_suppliers', suppliers),
    saveSupplierPayments: async (payments: SupplierPayment[]): Promise<void> => saveToStorage('farm_supplier_payments', payments),
    saveCustomers: async (customers: Customer[]): Promise<void> => saveToStorage('farm_customers', customers),
    saveCustomerPayments: async (payments: CustomerPayment[]): Promise<void> => saveToStorage('farm_customer_payments', payments),
    saveAnimalTypes: async (types: AnimalType[]): Promise<void> => saveToStorage('farm_animal_types', types),
    saveOpeningBalance: async (balance: number): Promise<void> => saveToStorage('farm_opening_balance', balance),
};

export default api;
