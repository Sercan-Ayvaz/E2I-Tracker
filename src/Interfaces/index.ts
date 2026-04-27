// Interfaces/index.ts - Veri tiplerinin tanımları

export type UserRole = 'Founder' | 'Master' | 'Member';

export type TransactionCategory = 'Income' | 'Expense' | 'Investment';

export interface IUser {
  id: string;
  displayName: string;
  role: UserRole;
  familyId: string;
  firstName?: string;
  lastName?: string;
  age?: number;
  gender?: string;
  email?: string;
  username: string;
  passwordHash: string;
  privateInvestments?: boolean; // Yeni gizlilik ayarı
}

export interface IFamily {
  id: string;
  name: string;
  masterId: string;
  founderId: string; // Aile kurucusu
  members: string[]; // user ids
  pendingMembers: string[]; // onay bekleyen user ids
  createdAt?: string;
}

export interface IRecurringTransaction {
  id: string;
  userId: string;
  familyId: string;
  title: string;
  amount: number;
  category: TransactionCategory;
  dayOfMonth: number; // 1-31
  lastProcessedMonth: string; // "YYYY-MM" formatında (çift kaydı önlemek için)
  investmentType?: string;
  price?: number;
}

export interface ITransactionHistory {
  updatedAt: string;
  updatedBy: string; // User Display Name
  changes: string; // Örn: "Tutar 100 -> 200"
}

export interface ITransaction {
  id: string;
  userId: string;
  familyId: string;
  title: string;
  amount: number;
  category: TransactionCategory;
  date: string; // ISO string
  isPrivate: boolean;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  investmentType?: string; // For Investment category: 'fon', 'hisse', 'altın', 'kripto', etc.
  price?: number; // For Investment: purchase price per unit
  quantity?: number; // Miktar/Adet
  history?: ITransactionHistory[];
}

export interface IStorageShapeV1 {
  schemaVersion: 'v1';
  families: Record<string, IFamily>;
  users: Record<string, IUser>;
  transactions: Record<string, ITransaction>;
  recurringTransactions: Record<string, IRecurringTransaction>;
  currentUser: IUser | null;
}