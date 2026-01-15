
export interface Animal {
  id: string;
  age: number;
  weight: number;
  entryDate: string;
  saleDate?: string;
  cost: number;
  breedingCost?: number;
  salePrice?: number;
  profit?: number;
  status: 'Available' | 'Sold';
  typeId?: string;
}

export interface AnimalType {
  id: string;
  name: string;
  description?: string;
}

export interface Sale {
  id: string;
  date: string;
  animalId: string;
  customerId: string;
  price: number;
  paid: number;
  remaining: number;
}

export interface Expense {
  id: string;
  date: string;
  category: 'أعلاف' | 'أدوية' | 'عمالة' | 'كهرباء' | 'نقل' | 'صيانة' | 'متنوعة' | 'شراء مواشي';
  description: string;
  amount: number;
  supplierId?: string;
  // Optional fields for when category is 'شراء مواشي'
  animalId?: string;
  animalAge?: number;
  animalWeight?: number;
}

export interface Vaccination {
  id: string;
  animalId: string;
  type: string;
  date: string;
  dose: string;
  vet: string;
  nextDueDate: string;
}

export interface TreasuryEntry {
    id: string;
    date: string;
    description: string;
    type: 'وارد' | 'منصرف';
    amount: number;
    sourceId?: string; // Link to payment ID etc.
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address: string;
  category: 'أعلاف' | 'أدوية' | 'معدات' | 'متنوع';
  totalPurchases: number;
  paid: number;
  remaining: number;
}

export interface SupplierPayment {
  id: string;
  supplierId: string;
  date: string;
  amount: number;
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  totalSales: number;
  paid: number;
  remaining: number;
}

export interface CustomerPayment {
  id: string;
  customerId: string;
  date: string;
  amount: number;
  notes?: string;
}
