import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CryptoJS from 'crypto-js';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
  Wallet, TrendingUp, TrendingDown, Plus, Minus, X,
  PieChart as PieChartIcon, Home, List, BarChart3,
  Trash2, Edit3, Check, Sparkles, Target, ChevronLeft, ChevronRight,
  Coffee, Car, Zap, ShoppingBag, Heart, Music, Building, MoreHorizontal,
  Briefcase, Laptop, LineChart, Key, Gift, DollarSign, Filter, Calendar,
  Crown, Lock, Download, Bell, Star, CheckCircle2,
  XCircle, Smartphone, Info, Clock, AlertTriangle, CircleCheck, CircleDashed,
  ArrowDownCircle, BellRing, BellOff, Megaphone, CheckCheck,
  AlertCircle, TrendingUp as TrendingUpIcon, CalendarClock,
  Plane, Bus, Train, Bike, Fuel, Utensils, Pizza, Apple,
  Shirt, Scissors, Palette, Gamepad2, Tv, BookOpen, GraduationCap,
  Baby, Dog, Cat, Flower2, Trees, Umbrella, Shield, Stethoscope,
  Pill, Dumbbell, Trophy, Ticket, Camera, Headphones, Monitor,
  Wrench, Hammer, Home as HomeIcon, Store, CreditCard, Banknote,
  PiggyBank, HandCoins, Receipt, Phone, Wifi, Droplets, Flame,
  Snowflake, Sun, Moon, CloudRain, Gem, Tag, Archive,
  FolderOpen, Settings, Globe, Users, UserPlus, MapPin, Rocket,
  type LucideIcon
} from 'lucide-react';
// QRCodeSVG kaldırıldı
import {
  PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis,
  Tooltip, BarChart, Bar
} from 'recharts';

// Types
type ExpenseStatus = 'pending' | 'paid' | 'overdue';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  status?: ExpenseStatus;
  dueDate?: string;
}

interface CategoryData {
  id: string;
  name: string;
  iconName: string;
  color: string;
  gradient: string;
}

interface Budget {
  category: string;
  limit: number;
  month: string;
}

interface UserPlan {
  type: 'free' | 'premium' | 'pro';
  expiresAt?: string;
}

// Notification Types
type NotificationType = 'warning' | 'danger' | 'success' | 'info';

interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  date: string;
  read: boolean;
  category?: string;
  transactionId?: string;
  actionType?: 'due_soon' | 'overdue' | 'budget_warning' | 'budget_exceeded' | 'payment_success' | 'tip';
}

interface NotificationSettings {
  dueSoonDays: number;
  enableDueSoon: boolean;
  enableOverdue: boolean;
  enableBudgetWarning: boolean;
  enableBudgetExceeded: boolean;
  enablePaymentSuccess: boolean;
  enableTips: boolean;
}

// Icon Registry
const ICON_MAP: Record<string, LucideIcon> = {
  Briefcase, Laptop, LineChart, Key, Gift, DollarSign,
  Coffee, Car, Zap, ShoppingBag, Heart, Music, Building, MoreHorizontal,
  Plane, Bus, Train, Bike, Fuel, Utensils, Pizza, Apple,
  Shirt, Scissors, Palette, Gamepad2, Tv, BookOpen, GraduationCap,
  Baby, Dog, Cat, Flower2, Trees, Umbrella, Shield, Stethoscope,
  Pill, Dumbbell, Trophy, Ticket, Camera, Headphones, Monitor,
  Wrench, Hammer, HomeIcon, Store, CreditCard, Banknote,
  PiggyBank, HandCoins, Receipt, Phone, Wifi, Droplets, Flame,
  Snowflake, Sun, Moon, CloudRain, Gem, Tag, Archive,
  FolderOpen, Settings, Users, UserPlus, Globe, MapPin,
  Wallet, Star, Crown, Rocket, Target,
};

const ICON_NAMES = Object.keys(ICON_MAP);

const getIcon = (iconName: string): LucideIcon => {
  return ICON_MAP[iconName] || MoreHorizontal;
};

// Color Options
const COLOR_OPTIONS = [
  { color: '#10B981', gradient: 'from-emerald-400 to-emerald-600', name: 'Yeşil' },
  { color: '#3B82F6', gradient: 'from-blue-400 to-blue-600', name: 'Mavi' },
  { color: '#8B5CF6', gradient: 'from-violet-400 to-violet-600', name: 'Mor' },
  { color: '#F59E0B', gradient: 'from-amber-400 to-amber-600', name: 'Amber' },
  { color: '#EC4899', gradient: 'from-pink-400 to-pink-600', name: 'Pembe' },
  { color: '#EF4444', gradient: 'from-red-400 to-red-600', name: 'Kırmızı' },
  { color: '#F97316', gradient: 'from-orange-400 to-orange-600', name: 'Turuncu' },
  { color: '#6366F1', gradient: 'from-indigo-400 to-indigo-600', name: 'İndigo' },
  { color: '#14B8A6', gradient: 'from-teal-400 to-teal-600', name: 'Teal' },
  { color: '#06B6D4', gradient: 'from-cyan-400 to-cyan-600', name: 'Cyan' },
  { color: '#84CC16', gradient: 'from-lime-400 to-lime-600', name: 'Lime' },
  { color: '#6B7280', gradient: 'from-gray-400 to-gray-600', name: 'Gri' },
];

// Default Categories
const DEFAULT_INCOME_CATEGORIES: CategoryData[] = [
  { id: 'salary', name: 'Maaş', iconName: 'Briefcase', color: '#10B981', gradient: 'from-emerald-400 to-emerald-600' },
  { id: 'freelance', name: 'Freelance', iconName: 'Laptop', color: '#3B82F6', gradient: 'from-blue-400 to-blue-600' },
  { id: 'investment', name: 'Yatırım', iconName: 'LineChart', color: '#8B5CF6', gradient: 'from-violet-400 to-violet-600' },
  { id: 'rental', name: 'Kira Geliri', iconName: 'Key', color: '#F59E0B', gradient: 'from-amber-400 to-amber-600' },
  { id: 'gift', name: 'Hediye', iconName: 'Gift', color: '#EC4899', gradient: 'from-pink-400 to-pink-600' },
  { id: 'other_income', name: 'Diğer', iconName: 'DollarSign', color: '#6B7280', gradient: 'from-gray-400 to-gray-600' },
];

const DEFAULT_EXPENSE_CATEGORIES: CategoryData[] = [
  { id: 'food', name: 'Yiyecek', iconName: 'Coffee', color: '#F97316', gradient: 'from-orange-400 to-orange-600' },
  { id: 'transport', name: 'Ulaşım', iconName: 'Car', color: '#3B82F6', gradient: 'from-blue-400 to-blue-600' },
  { id: 'bills', name: 'Faturalar', iconName: 'Zap', color: '#EAB308', gradient: 'from-yellow-400 to-yellow-600' },
  { id: 'shopping', name: 'Alışveriş', iconName: 'ShoppingBag', color: '#EC4899', gradient: 'from-pink-400 to-pink-600' },
  { id: 'health', name: 'Sağlık', iconName: 'Heart', color: '#EF4444', gradient: 'from-red-400 to-red-600' },
  { id: 'entertainment', name: 'Eğlence', iconName: 'Music', color: '#8B5CF6', gradient: 'from-violet-400 to-violet-600' },
  { id: 'rent', name: 'Kira', iconName: 'Building', color: '#6366F1', gradient: 'from-indigo-400 to-indigo-600' },
  { id: 'other', name: 'Diğer', iconName: 'MoreHorizontal', color: '#6B7280', gradient: 'from-gray-400 to-gray-600' },
];

const COLORS = ['#F97316', '#3B82F6', '#EAB308', '#EC4899', '#EF4444', '#8B5CF6', '#6366F1', '#10B981', '#14B8A6', '#06B6D4'];

const MONTH_NAMES = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

// Status Config
const STATUS_CONFIG = {
  pending: {
    label: 'Bekliyor',
    icon: Clock,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500/30',
    gradient: 'from-amber-500 to-orange-500',
  },
  paid: {
    label: 'Ödendi',
    icon: CircleCheck,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500/30',
    gradient: 'from-emerald-500 to-green-500',
  },
  overdue: {
    label: 'Gecikmiş',
    icon: AlertTriangle,
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/20',
    borderColor: 'border-rose-500/30',
    gradient: 'from-rose-500 to-red-500',
  },
};

// Demo Data Generator
const generateDemoData = (): { transactions: Transaction[]; budgets: Budget[] } => {
  const transactions: Transaction[] = [];
  const budgets: Budget[] = [];
  const now = new Date();
  
  for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
    const date = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    
    transactions.push({
      id: `salary-${monthKey}`,
      type: 'income',
      amount: 25000 + Math.random() * 5000,
      category: 'salary',
      description: 'Aylık Maaş',
      date: `${monthKey}-01`,
    });
    
    if (Math.random() > 0.3) {
      transactions.push({
        id: `freelance-${monthKey}`,
        type: 'income',
        amount: 3000 + Math.random() * 7000,
        category: 'freelance',
        description: 'Proje Ödemesi',
        date: `${monthKey}-${String(Math.floor(Math.random() * daysInMonth) + 1).padStart(2, '0')}`,
      });
    }
    
    const expenseTypes = [
      { category: 'rent', amount: 7500, description: 'Ev Kirası', day: 5, recurring: true },
      { category: 'bills', amount: 800 + Math.random() * 400, description: 'Elektrik Faturası', day: 10, recurring: true },
      { category: 'bills', amount: 200 + Math.random() * 100, description: 'İnternet Faturası', day: 12, recurring: true },
      { category: 'food', amount: 1500 + Math.random() * 1000, description: 'Market Alışverişi', day: 8 },
      { category: 'food', amount: 800 + Math.random() * 500, description: 'Restoran', day: 15 },
      { category: 'transport', amount: 500 + Math.random() * 300, description: 'Akaryakıt', day: 7 },
      { category: 'shopping', amount: 1000 + Math.random() * 2000, description: 'Online Alışveriş', day: 18 },
      { category: 'entertainment', amount: 400 + Math.random() * 600, description: 'Netflix & Spotify', day: 3, recurring: true },
      { category: 'health', amount: 200 + Math.random() * 300, description: 'Eczane', day: 22 },
    ];
    
    expenseTypes.forEach((exp, idx) => {
      if (Math.random() > 0.2 || exp.category === 'rent') {
        const expenseDate = `${monthKey}-${String(Math.min(exp.day, daysInMonth)).padStart(2, '0')}`;
        const dueDateDay = exp.recurring ? exp.day + 5 : exp.day;
        const dueDate = `${monthKey}-${String(Math.min(dueDateDay, daysInMonth)).padStart(2, '0')}`;
        
        let status: ExpenseStatus = 'paid';
        if (monthOffset === 0) {
          const today = new Date();
          const due = new Date(dueDate);
          if (Math.random() > 0.7) {
            status = 'pending';
            if (due < today) status = 'overdue';
          }
        }
        
        transactions.push({
          id: `exp-${monthKey}-${idx}`,
          type: 'expense',
          amount: exp.amount,
          category: exp.category,
          description: exp.description,
          date: expenseDate,
          status,
          dueDate: exp.recurring ? dueDate : undefined,
        });
      }
    });
    
    if (monthOffset < 2) {
      budgets.push(
        { category: 'food', limit: 4000, month: monthKey },
        { category: 'transport', limit: 1500, month: monthKey },
        { category: 'shopping', limit: 2000, month: monthKey },
        { category: 'entertainment', limit: 1000, month: monthKey },
        { category: 'bills', limit: 2000, month: monthKey },
      );
    }
  }
  
  return { transactions, budgets };
};

// Plan Limits
const PLAN_LIMITS = {
  free: { maxTransactions: 20, maxMonthsHistory: 1, statsLocked: true, budgetLocked: true, maxCategories: 5, maxBudgetCategories: 3, maxNotifications: 5, canExportCsv: false, canExportExcel: false, canExportPdf: false },
  premium: { maxTransactions: 200, maxMonthsHistory: 6, statsLocked: false, budgetLocked: false, maxCategories: 10, maxBudgetCategories: 6, maxNotifications: 20, canExportCsv: true, canExportExcel: false, canExportPdf: false },
  pro: { maxTransactions: 999999, maxMonthsHistory: 999999, statsLocked: false, budgetLocked: false, maxCategories: 999999, maxBudgetCategories: 999999, maxNotifications: 999999, canExportCsv: true, canExportExcel: true, canExportPdf: true },
};

// Helper functions
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' }).format(date);
};

const getCategoryInfo = (categoryId: string, type: 'income' | 'expense', incCats: CategoryData[], expCats: CategoryData[]): CategoryData => {
  const categories = type === 'income' ? incCats : expCats;
  return categories.find(c => c.id === categoryId) || categories[categories.length - 1] || {
    id: 'unknown', name: 'Bilinmeyen', iconName: 'MoreHorizontal', color: '#6B7280', gradient: 'from-gray-400 to-gray-600'
  };
};

const getMonthKey = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const getMonthLabel = (monthKey: string): string => {
  const [year, month] = monthKey.split('-').map(Number);
  return `${MONTH_NAMES[month - 1]} ${year}`;
};

const checkOverdue = (transaction: Transaction): ExpenseStatus => {
  if (transaction.type !== 'expense' || !transaction.status || transaction.status === 'paid') {
    return transaction.status || 'paid';
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = transaction.dueDate ? new Date(transaction.dueDate) : new Date(transaction.date);
  dueDate.setHours(0, 0, 0, 0);
  if (transaction.status === 'pending' && dueDate < today) return 'overdue';
  return transaction.status;
};

// ==================== COMPONENTS ====================

// Icon Picker Modal
const IconPickerModal = ({
  isOpen,
  onClose,
  onSelect,
  selectedIcon,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (iconName: string) => void;
  selectedIcon: string;
}) => {
  const [search, setSearch] = useState('');
  const filteredIcons = ICON_NAMES.filter(name => 
    name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl p-5 max-h-[80vh] flex flex-col"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">İkon Seç</h3>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl">
                <X className="w-5 h-5 text-white/70" />
              </button>
            </div>
            
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="İkon ara..."
              className="w-full bg-white/10 border border-white/20 rounded-xl py-2.5 px-4 text-white placeholder-white/40 focus:outline-none focus:border-white/40 mb-4"
            />

            <div className="flex-1 overflow-y-auto grid grid-cols-6 gap-2">
              {filteredIcons.map((iconName) => {
                const Icon = ICON_MAP[iconName];
                const isSelected = selectedIcon === iconName;
                return (
                  <motion.button
                    key={iconName}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => { onSelect(iconName); onClose(); }}
                    className={`aspect-square flex items-center justify-center rounded-xl transition-all ${
                      isSelected
                        ? 'bg-blue-500 border-2 border-blue-400'
                        : 'bg-white/5 border border-white/10 hover:bg-white/15'
                    }`}
                    title={iconName}
                  >
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-white/70'}`} />
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Add/Edit Category Modal
const CategoryModal = ({
  isOpen,
  onClose,
  onSave,
  type,
  editCategory,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: CategoryData) => void;
  type: 'income' | 'expense';
  editCategory?: CategoryData | null;
}) => {
  const [name, setName] = useState('');
  const [iconName, setIconName] = useState('Coffee');
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);
  const [showIconPicker, setShowIconPicker] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editCategory) {
        setName(editCategory.name);
        setIconName(editCategory.iconName);
        const found = COLOR_OPTIONS.find(c => c.color === editCategory.color);
        setSelectedColor(found || COLOR_OPTIONS[0]);
      } else {
        setName('');
        setIconName('Coffee');
        setSelectedColor(COLOR_OPTIONS[0]);
      }
    }
  }, [isOpen, editCategory]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      id: editCategory?.id || `cat_${Date.now()}`,
      name: name.trim(),
      iconName,
      color: selectedColor.color,
      gradient: selectedColor.gradient,
    });
    onClose();
  };

  const SelectedIcon = getIcon(iconName);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl p-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {editCategory ? '✏️ Kategori Düzenle' : type === 'income' ? '💰 Gelir Kategorisi Ekle' : '💸 Gider Kategorisi Ekle'}
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl">
                <X className="w-6 h-6 text-white/70" />
              </button>
            </div>

            {/* Preview */}
            <div className="flex items-center justify-center mb-6">
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${selectedColor.gradient} flex items-center justify-center shadow-lg`}>
                <SelectedIcon className="w-10 h-10 text-white" />
              </div>
            </div>

            {/* Name */}
            <div className="mb-5">
              <label className="block text-white/70 text-sm mb-2">Kategori Adı</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn: Market, Akaryakıt..."
                className="w-full bg-white/10 border border-white/20 rounded-2xl py-3 px-4 text-white placeholder-white/30 focus:outline-none focus:border-white/40"
                autoFocus
              />
            </div>

            {/* Icon Selector */}
            <div className="mb-5">
              <label className="block text-white/70 text-sm mb-2">İkon</label>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowIconPicker(true)}
                className="w-full flex items-center gap-3 bg-white/10 border border-white/20 rounded-2xl py-3 px-4 hover:bg-white/15 transition-all"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${selectedColor.gradient} flex items-center justify-center`}>
                  <SelectedIcon className="w-5 h-5 text-white" />
                </div>
                <span className="text-white flex-1 text-left">{iconName}</span>
                <ChevronRight className="w-5 h-5 text-white/50" />
              </motion.button>
            </div>

            {/* Color Selector */}
            <div className="mb-6">
              <label className="block text-white/70 text-sm mb-3">Renk</label>
              <div className="grid grid-cols-6 gap-2">
                {COLOR_OPTIONS.map((option) => (
                  <motion.button
                    key={option.color}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSelectedColor(option)}
                    className={`aspect-square rounded-xl flex items-center justify-center transition-all ${
                      selectedColor.color === option.color
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110'
                        : ''
                    }`}
                    style={{ backgroundColor: option.color }}
                  >
                    {selectedColor.color === option.color && (
                      <Check className="w-4 h-4 text-white" />
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={!name.trim()}
              className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all bg-gradient-to-r ${
                type === 'income' 
                  ? 'from-emerald-500 to-emerald-600 shadow-emerald-500/30' 
                  : 'from-blue-500 to-blue-600 shadow-blue-500/30'
              } disabled:opacity-50`}
            >
              <span className="flex items-center justify-center gap-2">
                <Check className="w-5 h-5" />
                {editCategory ? 'Güncelle' : 'Ekle'}
              </span>
            </motion.button>
          </motion.div>
        </motion.div>
      )}
      <IconPickerModal
        isOpen={showIconPicker}
        onClose={() => setShowIconPicker(false)}
        onSelect={setIconName}
        selectedIcon={iconName}
      />
    </AnimatePresence>
  );
};

// Manage Categories Modal
const ManageCategoriesModal = ({
  isOpen,
  onClose,
  incomeCategories,
  expenseCategories,
  onUpdateIncomeCategories,
  onUpdateExpenseCategories,
}: {
  isOpen: boolean;
  onClose: () => void;
  incomeCategories: CategoryData[];
  expenseCategories: CategoryData[];
  onUpdateIncomeCategories: (cats: CategoryData[]) => void;
  onUpdateExpenseCategories: (cats: CategoryData[]) => void;
}) => {
  const [tab, setTab] = useState<'income' | 'expense'>('expense');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editCat, setEditCat] = useState<CategoryData | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const categories = tab === 'income' ? incomeCategories : expenseCategories;

  const handleSaveCategory = (category: CategoryData) => {
    if (tab === 'income') {
      const existing = incomeCategories.findIndex(c => c.id === category.id);
      if (existing >= 0) {
        const updated = [...incomeCategories];
        updated[existing] = category;
        onUpdateIncomeCategories(updated);
      } else {
        onUpdateIncomeCategories([...incomeCategories, category]);
      }
    } else {
      const existing = expenseCategories.findIndex(c => c.id === category.id);
      if (existing >= 0) {
        const updated = [...expenseCategories];
        updated[existing] = category;
        onUpdateExpenseCategories(updated);
      } else {
        onUpdateExpenseCategories([...expenseCategories, category]);
      }
    }
    setEditCat(null);
  };

  const handleDeleteCategory = (catId: string) => {
    if (tab === 'income') {
      onUpdateIncomeCategories(incomeCategories.filter(c => c.id !== catId));
    } else {
      onUpdateExpenseCategories(expenseCategories.filter(c => c.id !== catId));
    }
    setDeleteConfirm(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl p-6 max-h-[85vh] flex flex-col"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">📂 Kategorileri Yönet</h2>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl">
                <X className="w-6 h-6 text-white/70" />
              </button>
            </div>

            {/* Tab Switch */}
            <div className="flex gap-2 p-1 bg-white/10 rounded-2xl mb-4">
              <button
                onClick={() => setTab('income')}
                className={`flex-1 py-2.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                  tab === 'income' ? 'bg-emerald-500 text-white' : 'text-white/50'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                Gelir ({incomeCategories.length})
              </button>
              <button
                onClick={() => setTab('expense')}
                className={`flex-1 py-2.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                  tab === 'expense' ? 'bg-rose-500 text-white' : 'text-white/50'
                }`}
              >
                <TrendingDown className="w-4 h-4" />
                Gider ({expenseCategories.length})
              </button>
            </div>

            {/* Category List */}
            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
              <AnimatePresence>
                {categories.map((cat) => {
                  const Icon = getIcon(cat.iconName);
                  return (
                    <motion.div
                      key={cat.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-2xl group"
                    >
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-white font-medium flex-1">{cat.name}</span>
                      
                      {deleteConfirm === cat.id ? (
                        <div className="flex items-center gap-1">
                          <span className="text-rose-400 text-xs mr-1">Sil?</span>
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="p-1.5 bg-rose-500 rounded-lg"
                          >
                            <Check className="w-3.5 h-3.5 text-white" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="p-1.5 bg-white/10 rounded-lg"
                          >
                            <X className="w-3.5 h-3.5 text-white" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => { setEditCat(cat); setShowAddModal(true); }}
                            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4 text-white/50 hover:text-blue-400" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(cat.id)}
                            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-white/50 hover:text-rose-400" />
                          </button>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              
              {categories.length === 0 && (
                <div className="text-center py-8">
                  <FolderOpen className="w-12 h-12 text-white/20 mx-auto mb-3" />
                  <p className="text-white/50">Henüz kategori yok</p>
                </div>
              )}
            </div>

            {/* Add Button */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => { setEditCat(null); setShowAddModal(true); }}
              className={`w-full py-3.5 rounded-2xl font-semibold text-white flex items-center justify-center gap-2 ${
                tab === 'income' 
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' 
                  : 'bg-gradient-to-r from-rose-500 to-rose-600'
              }`}
            >
              <Plus className="w-5 h-5" />
              Yeni {tab === 'income' ? 'Gelir' : 'Gider'} Kategorisi Ekle
            </motion.button>
          </motion.div>
        </motion.div>
      )}

      <CategoryModal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setEditCat(null); }}
        onSave={handleSaveCategory}
        type={tab}
        editCategory={editCat}
      />
    </AnimatePresence>
  );
};

// Platform Detection
const detectPlatform = (): 'ios' | 'android' | 'web' => {
  const userAgent = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(userAgent)) return 'ios';
  if (/android/.test(userAgent)) return 'android';
  return 'web';
};

// Store URLs - Uygulamanızı yayınladığınızda güncelleyin
const STORE_URLS = {
  ios: 'https://apps.apple.com/app/id/YOUR_APP_ID', // App Store linkiniz
  android: 'https://play.google.com/store/apps/details?id=com.yourcompany.gelir_gider', // Play Store linkiniz
};

// Premium Modal
const PremiumModal = ({
  isOpen, onClose, onSelectPlan, currentPlan, onDowngrade,
}: {
  isOpen: boolean; onClose: () => void; onSelectPlan: (plan: 'premium' | 'pro') => void;
  currentPlan: UserPlan; onDowngrade: () => void;
}) => {
  const plans = [
    {
      id: 'premium' as const, name: 'Premium', price: '₺149.99', period: ' (Tek Seferlik)',
      icon: Star, color: 'from-amber-500 to-orange-600',
      features: [
        { text: 'Ömür boyu erişim', included: true },
        { text: '6 aylık geçmiş', included: true },
        { text: '200 işlem limiti', included: true },
        { text: '10 kategori limiti', included: true },
        { text: '6 bütçe kategorisi', included: true },
        { text: 'Temel istatistikler (Pasta + Çubuk grafik)', included: true },
        { text: 'Bütçe hedefleri', included: true },
        { text: 'Veri dışa aktarma (Sadece CSV)', included: true },
        { text: '20 bildirim limiti', included: true },
        { text: 'Trend analizi', included: false },
        { text: 'Gelir kategori analizi', included: false },
        { text: 'Excel ve PDF rapor', included: false },
        { text: 'Öncelikli destek', included: false },
      ],
    },
    {
      id: 'pro' as const, name: 'Pro', price: '₺249.99', period: ' (Tek Seferlik)',
      icon: Crown, color: 'from-violet-500 to-purple-600', popular: true,
      features: [
        { text: 'Ömür boyu erişim', included: true },
        { text: 'Sınırsız geçmiş', included: true },
        { text: 'Sınırsız işlem', included: true },
        { text: 'Sınırsız kategori', included: true },
        { text: 'Sınırsız bütçe kategorisi', included: true },
        { text: 'Tüm istatistikler + gelişmiş grafikler', included: true },
        { text: 'Trend analizi + gelir analizi', included: true },
        { text: 'Bütçe hedefleri (sınırsız)', included: true },
        { text: 'Veri dışa aktarma (Excel + PDF)', included: true },
        { text: 'Sınırsız bildirim', included: true },
        { text: 'Öncelikli destek', included: true },
      ],
    },
  ];
  


  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {currentPlan.type === 'free' ? "Premium'a Geç" : 'Plan Yönetimi'}
              </h2>
            </div>
            <div className="space-y-4 mb-6">
              {plans.map((plan) => {
                const Icon = plan.icon;
                const isCurrent = currentPlan.type === plan.id;
                return (
                  <motion.div key={plan.id} whileHover={{ scale: 1.02 }}
                    className={`relative bg-white/5 border-2 rounded-2xl p-5 cursor-pointer transition-all ${
                      isCurrent ? 'border-emerald-500 bg-emerald-500/10' : plan.popular ? 'border-violet-500' : 'border-white/10 hover:border-white/30'
                    }`}
                    onClick={() => !isCurrent && onSelectPlan(plan.id)}>
                    {plan.popular && !isCurrent && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-500 text-white text-xs font-bold px-3 py-1 rounded-full">EN POPÜLER</div>
                    )}
                    {isCurrent && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full">MEVCUT PLAN</div>
                    )}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-white font-bold text-lg">{plan.name}</h3>
                          <p className="text-white/50 text-sm"><span className="text-white font-bold text-xl">{plan.price}</span>{plan.period}</p>
                        </div>
                      </div>
                      {isCurrent ? <CheckCircle2 className="w-6 h-6 text-emerald-400" /> : <ChevronRight className="w-5 h-5 text-white/50" />}
                    </div>
                    <div className="space-y-2">
                      {plan.features.map((f, i) => (
                        <div key={i} className="flex items-center gap-2">
                          {f.included ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-white/30" />}
                          <span className={f.included ? 'text-white/80' : 'text-white/30'}>{f.text}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
            {currentPlan.type !== 'free' && (
              <motion.button whileTap={{ scale: 0.95 }} onClick={onDowngrade}
                className="w-full py-3 mb-4 bg-white/5 border border-white/20 rounded-2xl text-white/70 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                <ArrowDownCircle className="w-5 h-5" /> Ücretsiz Plana Geç
              </motion.button>
            )}
            <button onClick={onClose} className="w-full py-3 text-white/50 hover:text-white transition-colors">
              {currentPlan.type === 'free' ? 'Şimdilik Değil' : 'Kapat'}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Upgrade Success Modal
const UpgradeSuccessModal = ({ isOpen, onClose, plan }: { isOpen: boolean; onClose: () => void; plan: 'premium' | 'pro' | 'free' }) => {
  const isDowngrade = plan === 'free';
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}
            className="w-full max-w-sm bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl p-8 text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}
              className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${isDowngrade ? 'bg-gradient-to-br from-gray-500 to-gray-600' : 'bg-gradient-to-br from-emerald-500 to-emerald-600'}`}>
              <CheckCircle2 className="w-10 h-10 text-white" />
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {isDowngrade ? '✓ Ücretsiz Plana Geçildi' : plan === 'pro' ? '🎉 Pro Üye Oldunuz!' : '⭐ Premium Üye Oldunuz!'}
            </h2>
            <p className="text-white/60 mb-6">
              {isDowngrade ? 'Ücretsiz plan aktif.' : `Tüm ${plan === 'pro' ? 'Pro' : 'Premium'} özellikleri aktif.`}
            </p>
            <motion.button whileTap={{ scale: 0.95 }} onClick={onClose}
              className={`w-full py-4 rounded-2xl font-bold text-white ${isDowngrade ? 'bg-gradient-to-r from-gray-500 to-gray-600' : 'bg-gradient-to-r from-emerald-500 to-emerald-600'}`}>
              Tamam
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Notification Center Modal
const NotificationCenterModal = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onClearAll,
  onOpenSettings,
  onNavigateToTransaction,
}: {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: string) => void;
  onClearAll: () => void;
  onOpenSettings: () => void;
  onNavigateToTransaction?: (transactionId: string) => void;
}) => {
  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: NotificationType, actionType?: string) => {
    if (actionType === 'due_soon') return CalendarClock;
    if (actionType === 'overdue') return AlertTriangle;
    if (actionType === 'budget_warning') return TrendingUpIcon;
    if (actionType === 'budget_exceeded') return AlertCircle;
    if (actionType === 'payment_success') return CheckCheck;
    if (actionType === 'tip') return Megaphone;
    
    switch (type) {
      case 'warning': return AlertTriangle;
      case 'danger': return AlertCircle;
      case 'success': return CheckCircle2;
      case 'info': return Info;
      default: return Bell;
    }
  };

  const getNotificationColors = (type: NotificationType) => {
    switch (type) {
      case 'warning': return { bg: 'bg-amber-500/20', border: 'border-amber-500/30', icon: 'text-amber-400', gradient: 'from-amber-500 to-orange-500' };
      case 'danger': return { bg: 'bg-rose-500/20', border: 'border-rose-500/30', icon: 'text-rose-400', gradient: 'from-rose-500 to-red-500' };
      case 'success': return { bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', icon: 'text-emerald-400', gradient: 'from-emerald-500 to-green-500' };
      case 'info': return { bg: 'bg-blue-500/20', border: 'border-blue-500/30', icon: 'text-blue-400', gradient: 'from-blue-500 to-indigo-500' };
      default: return { bg: 'bg-white/10', border: 'border-white/20', icon: 'text-white/70', gradient: 'from-gray-500 to-gray-600' };
    }
  };

  const formatNotificationDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Şimdi';
    if (diffMins < 60) return `${diffMins} dk önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    if (diffDays < 7) return `${diffDays} gün önce`;
    return formatDate(dateStr);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl max-h-[85vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-5 border-b border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Bildirimler</h2>
                    {unreadCount > 0 && (
                      <p className="text-white/50 text-sm">{unreadCount} okunmamış</p>
                    )}
                  </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl">
                  <X className="w-6 h-6 text-white/70" />
                </button>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={onMarkAllAsRead}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-500/20 border border-blue-500/30 rounded-xl text-blue-400 text-sm font-medium"
                  >
                    <CheckCheck className="w-4 h-4" />
                    Tümünü Okundu İşaretle
                  </motion.button>
                )}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={onOpenSettings}
                  className="p-2.5 bg-white/10 border border-white/20 rounded-xl hover:bg-white/15"
                >
                  <Settings className="w-5 h-5 text-white/70" />
                </motion.button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <AnimatePresence>
                {notifications.length > 0 ? (
                  notifications.map((notification, index) => {
                    const colors = getNotificationColors(notification.type);
                    const Icon = getNotificationIcon(notification.type, notification.actionType);
                    
                    return (
                      <motion.div
                        key={notification.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => {
                          if (!notification.read) onMarkAsRead(notification.id);
                          if (notification.transactionId && onNavigateToTransaction) {
                            onNavigateToTransaction(notification.transactionId);
                            onClose();
                          }
                        }}
                        className={`relative p-4 rounded-2xl border cursor-pointer transition-all hover:bg-white/5 ${colors.bg} ${colors.border} ${
                          !notification.read ? 'ring-2 ring-white/20' : ''
                        }`}
                      >
                        {/* Unread indicator */}
                        {!notification.read && (
                          <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" />
                        )}
                        
                        <div className="flex gap-3">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center flex-shrink-0`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-white font-semibold text-sm mb-0.5">{notification.title}</h4>
                            <p className="text-white/60 text-sm leading-relaxed">{notification.message}</p>
                            <p className="text-white/40 text-xs mt-2">{formatNotificationDate(notification.date)}</p>
                          </div>
                        </div>
                        
                        {/* Delete button */}
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => { e.stopPropagation(); onDeleteNotification(notification.id); }}
                          className="absolute bottom-3 right-3 p-1.5 hover:bg-white/10 rounded-lg opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-white/40 hover:text-rose-400" />
                        </motion.button>
                      </motion.div>
                    );
                  })
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                  >
                    <BellOff className="w-16 h-16 text-white/20 mx-auto mb-4" />
                    <p className="text-white/50 text-lg mb-2">Bildirim Yok</p>
                    <p className="text-white/30 text-sm">Tüm bildirimleriniz burada görünecek</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-4 border-t border-white/10">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={onClearAll}
                  className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all text-sm"
                >
                  Tüm Bildirimleri Temizle
                </motion.button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Notification Settings Modal
const NotificationSettingsModal = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onEnablePush,
  pushPermission,
}: {
  isOpen: boolean;
  onClose: () => void;
  settings: NotificationSettings;
  onUpdateSettings: (settings: NotificationSettings) => void;
  onEnablePush?: () => void;
  pushPermission?: NotificationPermission | null;
}) => {
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    if (isOpen) setLocalSettings(settings);
  }, [isOpen, settings]);

  const handleSave = () => {
    onUpdateSettings(localSettings);
    onClose();
  };

  const toggleSetting = (key: keyof NotificationSettings) => {
    if (typeof localSettings[key] === 'boolean') {
      setLocalSettings({ ...localSettings, [key]: !localSettings[key] });
    }
  };

  const settingsOptions = [
    { key: 'enableDueSoon' as const, label: 'Vadesi Yaklaşan Ödemeler', icon: CalendarClock, description: 'Vade tarihi yaklaşan ödemeler için hatırlatma', color: 'text-amber-400' },
    { key: 'enableOverdue' as const, label: 'Gecikmiş Ödemeler', icon: AlertTriangle, description: 'Vadesi geçmiş ödemeler için uyarı', color: 'text-rose-400' },
    { key: 'enableBudgetWarning' as const, label: 'Bütçe Uyarısı (%80)', icon: TrendingUpIcon, description: 'Bütçe %80\'e ulaştığında uyarı', color: 'text-orange-400' },
    { key: 'enableBudgetExceeded' as const, label: 'Bütçe Aşımı', icon: AlertCircle, description: 'Bütçe aşıldığında bildirim', color: 'text-red-400' },
    { key: 'enablePaymentSuccess' as const, label: 'Ödeme Başarılı', icon: CheckCircle2, description: 'Ödeme tamamlandığında bildirim', color: 'text-emerald-400' },
    { key: 'enableTips' as const, label: 'İpuçları', icon: Megaphone, description: 'Tasarruf ipuçları ve öneriler', color: 'text-blue-400' },
  ];

  const isPushAvailable = isPushSupported();
  const isPushGranted = pushPermission === 'granted';
  const isPushDenied = pushPermission === 'denied';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl p-6 max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <BellRing className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">Bildirim Ayarları</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl">
                <X className="w-6 h-6 text-white/70" />
              </button>
            </div>

            {/* Push Notification Status */}
            {isPushAvailable && (
              <div className={`mb-6 p-4 rounded-2xl border ${isPushGranted ? 'bg-emerald-500/10 border-emerald-500/30' : isPushDenied ? 'bg-rose-500/10 border-rose-500/30' : 'bg-violet-500/10 border-violet-500/30'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPushGranted ? 'bg-emerald-500/20' : isPushDenied ? 'bg-rose-500/20' : 'bg-violet-500/20'}`}>
                      {isPushGranted ? (
                        <BellRing className="w-5 h-5 text-emerald-400" />
                      ) : isPushDenied ? (
                        <BellOff className="w-5 h-5 text-rose-400" />
                      ) : (
                        <Bell className="w-5 h-5 text-violet-400" />
                      )}
                    </div>
                    <div>
                      <p className={`font-medium ${isPushGranted ? 'text-emerald-300' : isPushDenied ? 'text-rose-300' : 'text-violet-300'}`}>
                        {isPushGranted ? 'Kilit Ekranı Bildirimleri Açık' : isPushDenied ? 'Bildirimler Engellendi' : 'Kilit Ekranı Bildirimleri'}
                      </p>
                      <p className="text-white/50 text-xs">
                        {isPushGranted ? 'Telefon kilitliyken bile bildirim alırsınız' : isPushDenied ? 'Tarayıcı ayarlarından izin verin' : 'Telefon kilitliyken bildirim alın'}
                      </p>
                    </div>
                  </div>
                  {!isPushGranted && !isPushDenied && onEnablePush && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onEnablePush()}
                      className="px-4 py-2 bg-violet-500 rounded-xl text-white text-sm font-medium"
                    >
                      Aç
                    </motion.button>
                  )}
                  {isPushGranted && (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  )}
                </div>
              </div>
            )}

            {/* Due Soon Days Setting */}
            <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-2xl">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-white font-medium">Hatırlatma Süresi</p>
                  <p className="text-white/50 text-sm">Kaç gün önce hatırlat?</p>
                </div>
                <div className="flex items-center gap-2 bg-white/10 rounded-xl p-1">
                  <button
                    onClick={() => setLocalSettings({ ...localSettings, dueSoonDays: Math.max(1, localSettings.dueSoonDays - 1) })}
                    className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20"
                  >
                    <Minus className="w-4 h-4 text-white" />
                  </button>
                  <span className="text-white font-bold w-8 text-center">{localSettings.dueSoonDays}</span>
                  <button
                    onClick={() => setLocalSettings({ ...localSettings, dueSoonDays: Math.min(14, localSettings.dueSoonDays + 1) })}
                    className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20"
                  >
                    <Plus className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
              <p className="text-white/40 text-xs">Vadeden {localSettings.dueSoonDays} gün önce hatırlatma alacaksınız</p>
            </div>

            {/* Toggle Settings */}
            <div className="space-y-3 mb-6">
              {settingsOptions.map((option) => {
                const Icon = option.icon;
                const isEnabled = localSettings[option.key];
                
                return (
                  <motion.button
                    key={option.key}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleSetting(option.key)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                      isEnabled
                        ? 'bg-white/10 border-white/20'
                        : 'bg-white/5 border-white/10 opacity-60'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isEnabled ? 'bg-white/20' : 'bg-white/5'
                    }`}>
                      <Icon className={`w-5 h-5 ${isEnabled ? option.color : 'text-white/40'}`} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className={`font-medium ${isEnabled ? 'text-white' : 'text-white/50'}`}>{option.label}</p>
                      <p className="text-white/40 text-xs">{option.description}</p>
                    </div>
                    <div className={`w-12 h-7 rounded-full p-1 transition-all ${
                      isEnabled ? 'bg-emerald-500' : 'bg-white/20'
                    }`}>
                      <motion.div
                        layout
                        className="w-5 h-5 rounded-full bg-white shadow-md"
                        animate={{ x: isEnabled ? 20 : 0 }}
                      />
                    </div>
                  </motion.button>
                );
              })}
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl font-bold text-white shadow-lg shadow-blue-500/30"
            >
              <span className="flex items-center justify-center gap-2">
                <Check className="w-5 h-5" />
                Kaydet
              </span>
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Install App Modal - Kaldırıldı

// Feature Lock
const FeatureLock = ({ onUnlock, feature }: { onUnlock: () => void; feature: string }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
    className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center z-10">
    <div className="w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
      <Lock className="w-8 h-8 text-white" />
    </div>
    <h3 className="text-white font-bold text-lg mb-1">Premium Özellik</h3>
    <p className="text-white/60 text-sm mb-4 text-center px-4">{feature}</p>
    <motion.button whileTap={{ scale: 0.95 }} onClick={onUnlock}
      className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl font-semibold text-white text-sm flex items-center gap-2">
      <Crown className="w-4 h-4" />Kilidi Aç
    </motion.button>
  </motion.div>
);

// Month Selector
const MonthSelector = ({ selectedMonth, onMonthChange, userPlan, onUpgrade }: {
  selectedMonth: string; onMonthChange: (m: string) => void; userPlan: UserPlan; onUpgrade: () => void;
}) => {
  const currentMonth = getMonthKey(new Date());
  const canAccessMonth = (monthKey: string): boolean => {
    if (userPlan.type === 'pro') return true;
    const [cy, cm] = currentMonth.split('-').map(Number);
    const [ty, tm] = monthKey.split('-').map(Number);
    const diff = (cy - ty) * 12 + (cm - tm);
    const limit = userPlan.type === 'free' ? PLAN_LIMITS.free.maxMonthsHistory : PLAN_LIMITS.premium.maxMonthsHistory;
    return diff < limit;
  };
  const goToPrev = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const newKey = getMonthKey(new Date(y, m - 2, 1));
    if (!canAccessMonth(newKey)) { onUpgrade(); return; }
    onMonthChange(newKey);
  };
  const goToNext = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    onMonthChange(getMonthKey(new Date(y, m, 1)));
  };

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between bg-white/10 backdrop-blur-lg rounded-2xl p-3 mb-4 border border-white/20">
      <motion.button whileTap={{ scale: 0.9 }} onClick={goToPrev}
        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20">
        <ChevronLeft className="w-5 h-5 text-white" />
      </motion.button>
      <div className="flex items-center gap-2">
        <Calendar className="w-5 h-5 text-blue-400" />
        <span className="text-white font-semibold text-lg">{getMonthLabel(selectedMonth)}</span>
        {selectedMonth === currentMonth && (
          <span className="text-xs bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded-full">Bu Ay</span>
        )}
      </div>
      <motion.button whileTap={{ scale: 0.9 }} onClick={goToNext}
        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20">
        <ChevronRight className="w-5 h-5 text-white" />
      </motion.button>
    </motion.div>
  );
};

// Plan Badge
const PlanBadge = ({ plan, onClick }: { plan: UserPlan; onClick: () => void }) => {
  const config = {
    free: { label: 'Ücretsiz', icon: Sparkles, gradient: 'from-gray-500 to-gray-600' },
    premium: { label: 'Premium', icon: Star, gradient: 'from-amber-500 to-orange-600' },
    pro: { label: 'Pro', icon: Crown, gradient: 'from-violet-500 to-purple-600' },
  };
  const { label, icon: Icon, gradient } = config[plan.type];
  return (
    <motion.button whileTap={{ scale: 0.95 }} onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${gradient} text-white text-sm font-medium`}>
      <Icon className="w-4 h-4" />{label}
    </motion.button>
  );
};

// Status Badge
const StatusBadge = ({ status, onStatusChange, size = 'normal' }: {
  status: ExpenseStatus; onStatusChange?: (s: ExpenseStatus) => void; size?: 'small' | 'normal';
}) => {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  const next: Record<ExpenseStatus, ExpenseStatus> = { pending: 'paid', paid: 'pending', overdue: 'paid' };
  const handleClick = (e: React.MouseEvent) => { e.stopPropagation(); onStatusChange?.(next[status]); };

  if (size === 'small') {
    return (
      <motion.button whileTap={{ scale: 0.9 }} onClick={handleClick}
        className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${config.bgColor} border ${config.borderColor}`}>
        <Icon className={`w-3 h-3 ${config.color}`} />
        <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
      </motion.button>
    );
  }
  return (
    <motion.button whileTap={{ scale: 0.9 }} onClick={handleClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${config.bgColor} border ${config.borderColor}`}>
      <Icon className={`w-4 h-4 ${config.color}`} />
      <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
    </motion.button>
  );
};

// Tab Bar
const TabBar = ({ activeTab, setActiveTab, userPlan, onUpgrade, unreadNotifications, securityEnabled }: {
  activeTab: string; setActiveTab: (t: string) => void; userPlan: UserPlan; onUpgrade: () => void;
  unreadNotifications: number; securityEnabled: boolean;
}) => {
  const tabs = [
    { id: 'home', icon: Home, label: 'Ana Sayfa', locked: false },
    { id: 'transactions', icon: List, label: 'İşlemler', locked: false },
    { id: 'stats', icon: BarChart3, label: 'İstatistik', locked: userPlan.type === 'free' },
    { id: 'budget', icon: Target, label: 'Bütçe', locked: userPlan.type === 'free' },
    { id: 'settings', icon: Settings, label: 'Ayarlar', locked: false, badge: unreadNotifications > 0 || !securityEnabled },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="max-w-md mx-auto bg-slate-900/95 backdrop-blur-xl border-t border-white/10">
        <div className="flex justify-around items-center py-2 px-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const showBadge = tab.id === 'settings' && tab.badge;
            return (
              <motion.button key={tab.id} whileTap={{ scale: 0.95 }}
                onClick={() => tab.locked ? onUpgrade() : setActiveTab(tab.id)}
                className={`relative flex flex-col items-center py-2 px-3 rounded-xl transition-all ${isActive ? 'bg-white/10' : ''}`}>
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-white/50'}`} />
                  {tab.locked && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full flex items-center justify-center">
                      <Lock className="w-2 h-2 text-white" />
                    </div>
                  )}
                  {showBadge && !tab.locked && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full flex items-center justify-center">
                      <span className="w-1.5 h-1.5 bg-white rounded-full" />
                    </div>
                  )}
                </div>
                <span className={`text-xs mt-1 ${isActive ? 'text-white' : 'text-white/50'}`}>{tab.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Balance Card
const BalanceCard = ({ totalIncome, totalExpense, monthLabel, pendingExpenses, overdueExpenses }: {
  totalIncome: number; totalExpense: number; monthLabel: string; pendingExpenses: number; overdueExpenses: number;
}) => {
  const balance = totalIncome - totalExpense;
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 shadow-2xl">
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-1">
          <Wallet className="w-5 h-5 text-white/70" />
          <span className="text-white/70 text-sm">{monthLabel} Bakiyesi</span>
        </div>
        <h1 className={`text-4xl font-bold mb-4 ${balance >= 0 ? 'text-white' : 'text-rose-300'}`}>{formatCurrency(balance)}</h1>
        {(pendingExpenses > 0 || overdueExpenses > 0) && (
          <div className="flex gap-2 mb-4 flex-wrap">
            {pendingExpenses > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 rounded-full border border-amber-500/30">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-300 text-xs font-medium">{formatCurrency(pendingExpenses)} bekliyor</span>
              </div>
            )}
            {overdueExpenses > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/20 rounded-full border border-rose-500/30">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-rose-300 text-xs font-medium">{formatCurrency(overdueExpenses)} gecikmiş</span>
              </div>
            )}
          </div>
        )}
        <div className="flex gap-4">
          <div className="flex-1 bg-white/10 backdrop-blur rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center"><TrendingUp className="w-4 h-4 text-emerald-400" /></div>
              <span className="text-white/60 text-xs">Gelir</span>
            </div>
            <p className="text-xl font-bold text-emerald-400">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="flex-1 bg-white/10 backdrop-blur rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center"><TrendingDown className="w-4 h-4 text-rose-400" /></div>
              <span className="text-white/60 text-xs">Gider</span>
            </div>
            <p className="text-xl font-bold text-rose-400">{formatCurrency(totalExpense)}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Quick Actions
const QuickActions = ({ onAdd, userPlan, transactionCount, onUpgrade, onManageCategories }: {
  onAdd: (t: 'income' | 'expense') => void; userPlan: UserPlan; transactionCount: number; onUpgrade: () => void;
  onManageCategories: () => void;
}) => {
  const limit = PLAN_LIMITS[userPlan.type].maxTransactions;
  const isLimited = transactionCount >= limit;
  const displayLimit = limit > 9999 ? '∞' : limit;
  const handleClick = (type: 'income' | 'expense') => { isLimited ? onUpgrade() : onAdd(type); };

  return (
    <div className="space-y-3 mt-6">
      {userPlan.type === 'free' && (
        <div className="bg-amber-500/20 border border-amber-500/30 rounded-2xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            <span className="text-amber-300 text-sm">{transactionCount}/{displayLimit} işlem</span>
          </div>
          {isLimited && (
            <button onClick={onUpgrade} className="text-amber-400 text-sm font-semibold flex items-center gap-1">
              <Crown className="w-4 h-4" />Yükselt
            </button>
          )}
        </div>
      )}
      <div className="flex gap-3">
        <motion.button whileTap={{ scale: 0.98 }} onClick={() => handleClick('income')}
          className={`flex-1 flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl shadow-lg shadow-emerald-500/30 ${isLimited ? 'opacity-50' : ''}`}>
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center"><Plus className="w-5 h-5 text-white" /></div>
          <span className="text-white font-semibold">Gelir Ekle</span>
        </motion.button>
        <motion.button whileTap={{ scale: 0.98 }} onClick={() => handleClick('expense')}
          className={`flex-1 flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-rose-500 to-rose-600 rounded-2xl shadow-lg shadow-rose-500/30 ${isLimited ? 'opacity-50' : ''}`}>
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center"><Minus className="w-5 h-5 text-white" /></div>
          <span className="text-white font-semibold">Gider Ekle</span>
        </motion.button>
      </div>
      <motion.button whileTap={{ scale: 0.98 }} onClick={onManageCategories}
        className="w-full flex items-center justify-center gap-2 py-3 bg-white/10 border border-white/20 rounded-2xl hover:bg-white/15 transition-all">
        <Settings className="w-4 h-4 text-white/70" />
        <span className="text-white/70 font-medium text-sm">Kategorileri Yönet</span>
      </motion.button>
    </div>
  );
};

// Transaction Item
const TransactionItem = ({ transaction, onDelete, onStatusChange, incCats, expCats }: {
  transaction: Transaction; onDelete: (id: string) => void;
  onStatusChange?: (id: string, s: ExpenseStatus) => void;
  incCats: CategoryData[]; expCats: CategoryData[];
}) => {
  const category = getCategoryInfo(transaction.category, transaction.type, incCats, expCats);
  const Icon = getIcon(category.iconName);
  const actualStatus = transaction.type === 'expense' ? checkOverdue(transaction) : undefined;

  return (
    <motion.div layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
      className={`flex items-center gap-4 p-4 bg-white/5 backdrop-blur rounded-2xl border group hover:bg-white/10 transition-all ${
        actualStatus === 'overdue' ? 'border-rose-500/30' : actualStatus === 'pending' ? 'border-amber-500/30' : 'border-white/10'
      }`}>
      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${category.gradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium truncate">{transaction.description || category.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-white/50 text-sm">{category.name} • {formatDate(transaction.date)}</p>
          {transaction.dueDate && transaction.type === 'expense' && actualStatus !== 'paid' && (
            <span className="text-white/40 text-xs">Vade: {formatDate(transaction.dueDate)}</span>
          )}
        </div>
      </div>
      <div className="text-right flex flex-col items-end gap-2">
        <p className={`font-bold ${transaction.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
        </p>
        <div className="flex items-center gap-2">
          {transaction.type === 'expense' && actualStatus && (
            <StatusBadge status={actualStatus} size="small" onStatusChange={(s) => onStatusChange?.(transaction.id, s)} />
          )}
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => onDelete(transaction.id)}
            className="p-2 hover:bg-rose-500/20 rounded-xl transition-all">
            <Trash2 className="w-4 h-4 text-white/40 hover:text-rose-400" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

// Add Transaction Modal
const AddTransactionModal = ({ isOpen, onClose, type, onAdd, selectedMonth, categories }: {
  isOpen: boolean; onClose: () => void; type: 'income' | 'expense';
  onAdd: (t: Omit<Transaction, 'id'>) => void; selectedMonth: string; categories: CategoryData[];
}) => {
  const [year, month] = selectedMonth.split('-').map(Number);
  const defaultDate = new Date(year, month - 1, Math.min(new Date().getDate(), 28));
  const dateStr = defaultDate.toISOString().split('T')[0];

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(dateStr);
  const [status, setStatus] = useState<ExpenseStatus>('pending');
  const [dueDate, setDueDate] = useState('');
  const [hasDueDate, setHasDueDate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const [y, m] = selectedMonth.split('-').map(Number);
      const d = new Date(y, m - 1, Math.min(new Date().getDate(), 28));
      setDate(d.toISOString().split('T')[0]);
      const due = new Date(d); due.setDate(due.getDate() + 7);
      setDueDate(due.toISOString().split('T')[0]);
      setAmount(''); setCategory(''); setDescription('');
      setStatus('pending'); setHasDueDate(false);
    }
  }, [isOpen, selectedMonth]);

  const handleSubmit = () => {
    if (!amount || !category) return;
    onAdd({
      type, amount: parseFloat(amount), category, description, date,
      status: type === 'expense' ? status : undefined,
      dueDate: type === 'expense' && hasDueDate ? dueDate : undefined,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-gradient-to-b from-slate-800 to-slate-900 rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {type === 'income' ? '💰 Gelir Ekle' : '💸 Gider Ekle'}
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl"><X className="w-6 h-6 text-white/70" /></button>
            </div>

            <div className="mb-4 p-3 bg-blue-500/20 rounded-xl border border-blue-500/30">
              <p className="text-blue-300 text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4" />{getMonthLabel(selectedMonth)} için işlem ekleniyor
              </p>
            </div>

            <div className="mb-5">
              <label className="block text-white/70 text-sm mb-2">Tutar</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 text-xl">₺</span>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00"
                  className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-10 pr-4 text-2xl font-bold text-white placeholder-white/30 focus:outline-none focus:border-white/40" />
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-white/70 text-sm mb-3">Kategori</label>
              <div className="grid grid-cols-4 gap-2">
                {categories.map((cat) => {
                  const CatIcon = getIcon(cat.iconName);
                  const isSelected = category === cat.id;
                  return (
                    <motion.button key={cat.id} whileTap={{ scale: 0.95 }} onClick={() => setCategory(cat.id)}
                      className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border transition-all ${
                        isSelected ? `bg-gradient-to-br ${cat.gradient} border-transparent shadow-lg` : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}>
                      <CatIcon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-white/70'}`} />
                      <span className={`text-xs text-center leading-tight ${isSelected ? 'text-white' : 'text-white/70'}`}>{cat.name}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-white/70 text-sm mb-2">Açıklama (Opsiyonel)</label>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Not ekle..."
                className="w-full bg-white/10 border border-white/20 rounded-2xl py-3 px-4 text-white placeholder-white/30 focus:outline-none focus:border-white/40" />
            </div>

            <div className="mb-5">
              <label className="block text-white/70 text-sm mb-2">Tarih</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-2xl py-3 px-4 text-white focus:outline-none focus:border-white/40" />
            </div>

            {type === 'expense' && (
              <>
                <div className="mb-5">
                  <label className="block text-white/70 text-sm mb-3">Ödeme Durumu</label>
                  <div className="flex gap-2">
                    {(['pending', 'paid', 'overdue'] as ExpenseStatus[]).map((s) => {
                      const config = STATUS_CONFIG[s];
                      const SIcon = config.icon;
                      const isSelected = status === s;
                      return (
                        <motion.button key={s} whileTap={{ scale: 0.95 }} onClick={() => setStatus(s)}
                          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${
                            isSelected ? `bg-gradient-to-r ${config.gradient} border-transparent` : `${config.bgColor} ${config.borderColor}`
                          }`}>
                          <SIcon className={`w-4 h-4 ${isSelected ? 'text-white' : config.color}`} />
                          <span className={`text-sm font-medium ${isSelected ? 'text-white' : config.color}`}>{config.label}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-white/70 text-sm">Vade Tarihi</label>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => setHasDueDate(!hasDueDate)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${hasDueDate ? 'bg-blue-500/30 text-blue-300' : 'bg-white/10 text-white/50'}`}>
                      {hasDueDate ? <CircleCheck className="w-4 h-4" /> : <CircleDashed className="w-4 h-4" />}
                      <span className="text-sm">{hasDueDate ? 'Aktif' : 'Ekle'}</span>
                    </motion.button>
                  </div>
                  {hasDueDate && (
                    <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-2xl py-3 px-4 text-white focus:outline-none focus:border-white/40" />
                  )}
                </div>
              </>
            )}

            <motion.button whileTap={{ scale: 0.98 }} onClick={handleSubmit} disabled={!amount || !category}
              className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all ${
                type === 'income' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-emerald-500/30' : 'bg-gradient-to-r from-rose-500 to-rose-600 shadow-rose-500/30'
              } disabled:opacity-50`}>
              <span className="flex items-center justify-center gap-2"><Check className="w-5 h-5" />Kaydet</span>
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ==================== PAGES ====================

// Home Page
const HomePage = ({ transactions, onAdd, onDelete, onStatusChange, selectedMonth, onMonthChange, userPlan, onUpgrade, incCats, expCats, onManageCategories, unreadNotifications, onOpenNotifications }: {
  transactions: Transaction[]; onAdd: (t: 'income' | 'expense') => void; onDelete: (id: string) => void;
  onStatusChange: (id: string, s: ExpenseStatus) => void; selectedMonth: string; onMonthChange: (m: string) => void;
  userPlan: UserPlan; onUpgrade: () => void; incCats: CategoryData[]; expCats: CategoryData[];
  onManageCategories: () => void; unreadNotifications: number; onOpenNotifications: () => void;
}) => {
  const filtered = useMemo(() => transactions.filter(t => getMonthKey(new Date(t.date)) === selectedMonth), [transactions, selectedMonth]);
  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const pendingExp = filtered.filter(t => t.type === 'expense' && checkOverdue(t) === 'pending').reduce((s, t) => s + t.amount, 0);
  const overdueExp = filtered.filter(t => t.type === 'expense' && checkOverdue(t) === 'overdue').reduce((s, t) => s + t.amount, 0);
  const recent = [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/60 text-sm">Hoş Geldiniz 👋</p>
          <h1 className="text-2xl font-bold text-white">Gelir - Gider Yönetimi</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Plan Badge önce */}
          <PlanBadge plan={userPlan} onClick={onUpgrade} />
          {/* Bildirim İkonu sağda */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onOpenNotifications}
            className="relative w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center"
          >
            <Bell className="w-5 h-5 text-violet-400" />
            {unreadNotifications > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center shadow-lg"
              >
                <span className="text-white text-xs font-bold">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              </motion.div>
            )}
          </motion.button>
        </div>
      </div>
      <MonthSelector selectedMonth={selectedMonth} onMonthChange={onMonthChange} userPlan={userPlan} onUpgrade={onUpgrade} />
      <BalanceCard totalIncome={totalIncome} totalExpense={totalExpense} monthLabel={getMonthLabel(selectedMonth)}
        pendingExpenses={pendingExp} overdueExpenses={overdueExp} />
      <QuickActions onAdd={onAdd} userPlan={userPlan} transactionCount={transactions.length} onUpgrade={onUpgrade}
        onManageCategories={onManageCategories} />

      {filtered.filter(t => t.type === 'expense').length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {(['paid', 'pending', 'overdue'] as ExpenseStatus[]).map((s) => {
            const config = STATUS_CONFIG[s];
            const SIcon = config.icon;
            const count = filtered.filter(t => t.type === 'expense' && checkOverdue(t) === s).length;
            const amount = filtered.filter(t => t.type === 'expense' && checkOverdue(t) === s).reduce((sum, t) => sum + t.amount, 0);
            return (
              <div key={s} className={`${config.bgColor} border ${config.borderColor} rounded-2xl p-3`}>
                <div className="flex items-center gap-2 mb-1">
                  <SIcon className={`w-4 h-4 ${config.color}`} />
                  <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
                </div>
                <p className="text-white font-bold">{count}</p>
                <p className="text-white/50 text-xs">{formatCurrency(amount)}</p>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Son İşlemler</h2>
          <span className="text-white/50 text-sm">{filtered.length} işlem</span>
        </div>
        <div className="space-y-3">
          <AnimatePresence>
            {recent.length > 0 ? recent.map((t) => (
              <TransactionItem key={t.id} transaction={t} onDelete={onDelete} onStatusChange={onStatusChange}
                incCats={incCats} expCats={expCats} />
            )) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                <Wallet className="w-20 h-20 mx-auto mb-4 text-white/20" />
                <p className="text-white/50">Bu ayda işlem yok</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {userPlan.type === 'free' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-600/20 to-orange-600/20 border border-amber-500/30 rounded-2xl p-4 mt-6">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">Ücretsiz Plan</h3>
              <p className="text-white/60 text-sm mb-2">Şu anki kısıtlamalarınız:</p>
              <ul className="text-white/50 text-xs space-y-1 mb-3">
                <li>• Son 1 aylık geçmiş</li>
                <li>• Maksimum 20 işlem</li>
                <li>• Maksimum 5 kategori</li>
                <li>• Maksimum 3 bütçe kategorisi</li>
                <li>• Maksimum 5 bildirim</li>
                <li>• İstatistik ve Bütçe sayfaları kilitli</li>
                <li>• Veri dışa aktarma (CSV, Excel, PDF) kilitli</li>
              </ul>
              <button onClick={onUpgrade} className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold text-sm px-4 py-2 rounded-xl">
                <Crown className="w-4 h-4" />Premium'a Yükselt
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Transactions Page
const TransactionsPage = ({ transactions, onDelete, onStatusChange, selectedMonth, onMonthChange, userPlan, onUpgrade, incCats, expCats }: {
  transactions: Transaction[]; onDelete: (id: string) => void; onStatusChange: (id: string, s: ExpenseStatus) => void;
  selectedMonth: string; onMonthChange: (m: string) => void; userPlan: UserPlan; onUpgrade: () => void;
  incCats: CategoryData[]; expCats: CategoryData[];
}) => {
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ExpenseStatus>('all');

  const filtered = useMemo(() => {
    return transactions
      .filter(t => getMonthKey(new Date(t.date)) === selectedMonth)
      .filter(t => filter === 'all' || t.type === filter)
      .filter(t => { if (statusFilter === 'all') return true; if (t.type === 'income') return true; return checkOverdue(t) === statusFilter; })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedMonth, filter, statusFilter]);

  const monthIncome = transactions.filter(t => getMonthKey(new Date(t.date)) === selectedMonth && t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const monthExpense = transactions.filter(t => getMonthKey(new Date(t.date)) === selectedMonth && t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">İşlemler</h1><p className="text-white/60 text-sm">Aylık gelir ve giderleriniz</p></div>
        <PlanBadge plan={userPlan} onClick={onUpgrade} />
      </div>
      <MonthSelector selectedMonth={selectedMonth} onMonthChange={onMonthChange} userPlan={userPlan} onUpgrade={onUpgrade} />
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-2xl p-4">
          <p className="text-emerald-400 text-xs mb-1">Toplam Gelir</p>
          <p className="text-white font-bold text-lg">{formatCurrency(monthIncome)}</p>
        </div>
        <div className="bg-rose-500/20 border border-rose-500/30 rounded-2xl p-4">
          <p className="text-rose-400 text-xs mb-1">Toplam Gider</p>
          <p className="text-white font-bold text-lg">{formatCurrency(monthExpense)}</p>
        </div>
      </div>
      <div className="flex gap-2 p-1 bg-white/10 rounded-2xl">
        {[{ id: 'all', label: 'Tümü' }, { id: 'income', label: 'Gelir' }, { id: 'expense', label: 'Gider' }].map((tab) => (
          <button key={tab.id} onClick={() => setFilter(tab.id as any)}
            className={`flex-1 py-3 rounded-xl font-medium transition-all ${filter === tab.id ? 'bg-white/20 text-white' : 'text-white/50'}`}>
            {tab.label}
          </button>
        ))}
      </div>
      {filter !== 'income' && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button onClick={() => setStatusFilter('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap ${statusFilter === 'all' ? 'bg-white/20 text-white' : 'bg-white/5 text-white/50'}`}>
            <Filter className="w-3.5 h-3.5" /><span className="text-sm">Tüm Durumlar</span>
          </button>
          {(['pending', 'paid', 'overdue'] as ExpenseStatus[]).map((s) => {
            const config = STATUS_CONFIG[s]; const SIcon = config.icon;
            return (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap ${statusFilter === s ? `${config.bgColor} ${config.color}` : 'bg-white/5 text-white/50'}`}>
                <SIcon className="w-3.5 h-3.5" /><span className="text-sm">{config.label}</span>
              </button>
            );
          })}
        </div>
      )}
      <div className="space-y-3">
        <AnimatePresence>
          {filtered.map((t) => (
            <TransactionItem key={t.id} transaction={t} onDelete={onDelete} onStatusChange={onStatusChange}
              incCats={incCats} expCats={expCats} />
          ))}
        </AnimatePresence>
        {filtered.length === 0 && (
          <div className="text-center py-12"><Filter className="w-12 h-12 text-white/20 mx-auto mb-3" /><p className="text-white/50">İşlem bulunamadı</p></div>
        )}
      </div>
    </div>
  );
};

// Stats Page
const StatsPage = ({ transactions, selectedMonth, onMonthChange, userPlan, onUpgrade, incCats, expCats }: {
  transactions: Transaction[]; selectedMonth: string; onMonthChange: (m: string) => void;
  userPlan: UserPlan; onUpgrade: () => void; incCats: CategoryData[]; expCats: CategoryData[];
}) => {
  const monthly = useMemo(() => transactions.filter(t => getMonthKey(new Date(t.date)) === selectedMonth), [transactions, selectedMonth]);
  const expenseByCategory = useMemo(() => {
    const grouped: Record<string, number> = {};
    monthly.filter(t => t.type === 'expense').forEach(t => { grouped[t.category] = (grouped[t.category] || 0) + t.amount; });
    return Object.entries(grouped).map(([cat, amount], i) => {
      const c = getCategoryInfo(cat, 'expense', incCats, expCats);
      return { name: c.name, value: amount, color: COLORS[i % COLORS.length] };
    });
  }, [monthly, incCats, expCats]);

  const trend = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const months: { name: string; income: number; expense: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, month - 1 - i, 1);
      const key = getMonthKey(d);
      const label = MONTH_NAMES[d.getMonth()].substring(0, 3);
      const mt = transactions.filter(t => getMonthKey(new Date(t.date)) === key);
      months.push({
        name: label,
        income: mt.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        expense: mt.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      });
    }
    return months;
  }, [transactions, selectedMonth]);

  const totalIncome = monthly.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = monthly.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">İstatistikler</h1><p className="text-white/60 text-sm">Finansal analizleriniz</p></div>
        <PlanBadge plan={userPlan} onClick={onUpgrade} />
      </div>
      <MonthSelector selectedMonth={selectedMonth} onMonthChange={onMonthChange} userPlan={userPlan} onUpgrade={onUpgrade} />
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30 rounded-2xl p-4">
          <p className="text-emerald-400 text-sm mb-1">Aylık Gelir</p>
          <p className="text-white text-xl font-bold">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="bg-gradient-to-br from-rose-500/20 to-rose-600/20 border border-rose-500/30 rounded-2xl p-4">
          <p className="text-rose-400 text-sm mb-1">Aylık Gider</p>
          <p className="text-white text-xl font-bold">{formatCurrency(totalExpense)}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500/20 to-indigo-600/20 border border-blue-500/30 rounded-2xl p-4">
          <p className="text-blue-400 text-sm mb-1">Tasarruf Oranı</p>
          <p className="text-white text-xl font-bold">%{savingsRate}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 rounded-2xl p-4">
          <p className="text-amber-400 text-sm mb-1">Net Bakiye</p>
          <p className="text-white text-xl font-bold">{formatCurrency(totalIncome - totalExpense)}</p>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5" />Son 6 Ay Trendi</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trend}>
              <XAxis dataKey="name" stroke="#ffffff50" fontSize={12} />
              <YAxis stroke="#ffffff50" fontSize={10} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))}
                contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px' }} labelStyle={{ color: '#fff' }} />
              <Bar dataKey="income" fill="#10B981" radius={[4, 4, 0, 0]} name="Gelir" />
              <Bar dataKey="expense" fill="#F43F5E" radius={[4, 4, 0, 0]} name="Gider" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /><span className="text-white/70 text-sm">Gelir</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-500" /><span className="text-white/70 text-sm">Gider</span></div>
        </div>
      </div>

      {expenseByCategory.length > 0 && (() => {
        const totalExp = expenseByCategory.reduce((s, c) => s + c.value, 0);
        return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><PieChartIcon className="w-5 h-5" />Kategoriye Göre Giderler</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }: any) => `${name || ''} %${((percent || 0) * 100).toFixed(0)}`}
                  labelLine={{ stroke: '#ffffff60', strokeWidth: 1 }}
                >
                  {expenseByCategory.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [formatCurrency(Number(value || 0)), 'Tutar']}
                  contentStyle={{
                    background: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '16px',
                    padding: '12px 16px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  }}
                  labelStyle={{ color: '#ffffff', fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}
                  itemStyle={{ color: '#94a3b8', fontSize: '13px' }}
                  cursor={{ fill: 'rgba(255,255,255,0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Category Detail Cards */}
          <div className="space-y-2 mt-4">
            {expenseByCategory
              .sort((a, b) => b.value - a.value)
              .map((cat, i) => {
                const percent = totalExp > 0 ? ((cat.value / totalExp) * 100).toFixed(1) : '0';
                const catData = expCats.find(c => c.name === cat.name);
                const CatIcon = catData ? getIcon(catData.iconName) : MoreHorizontal;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: cat.color + '30' }}
                    >
                      <CatIcon className="w-5 h-5" style={{ color: cat.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white font-medium text-sm truncate">{cat.name}</span>
                        <span className="text-white font-bold text-sm">{formatCurrency(cat.value)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            transition={{ duration: 0.6, delay: i * 0.1 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                        </div>
                        <span className="text-white/50 text-xs font-medium w-12 text-right">%{percent}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
          </div>
        </div>
        );
      })()}

      {/* Trend Analizi - Pro Only */}
      {userPlan.type === 'premium' && (
        <div className="relative bg-white/5 border border-white/10 rounded-2xl p-6 overflow-hidden">
          <FeatureLock onUnlock={onUpgrade} feature="Trend analizi ve gelir kategori analizi için Pro'ya yükseltin" />
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5" />Trend Analizi</h3>
          <p className="text-white/50">Son 6 aylık gelir/gider trendlerinizi analiz edin.</p>
        </div>
      )}

      {/* Rapor İndir */}
      {userPlan.type !== 'pro' && (
        <div className="relative bg-white/5 border border-white/10 rounded-2xl p-6 overflow-hidden">
          <FeatureLock onUnlock={onUpgrade} feature={userPlan.type === 'free' ? "İstatistiklere erişim için Premium'a yükseltin" : "PDF rapor indirme için Pro'ya yükseltin"} />
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Download className="w-5 h-5" />Rapor İndir</h3>
          <p className="text-white/50">Aylık raporlarınızı PDF olarak indirin.</p>
        </div>
      )}
    </div>
  );
};

// Budget Page
const BudgetPage = ({ transactions, budgets, setBudgets, selectedMonth, onMonthChange, userPlan, onUpgrade, expCats, onManageCategories }: {
  transactions: Transaction[]; budgets: Budget[]; setBudgets: (b: Budget[]) => void;
  selectedMonth: string; onMonthChange: (m: string) => void; userPlan: UserPlan; onUpgrade: () => void;
  expCats: CategoryData[]; onManageCategories: () => void;
}) => {
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [budgetValue, setBudgetValue] = useState('');

  const monthlyExpenses = useMemo(() => {
    const expenses: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense' && getMonthKey(new Date(t.date)) === selectedMonth)
      .forEach(t => { expenses[t.category] = (expenses[t.category] || 0) + t.amount; });
    return expenses;
  }, [transactions, selectedMonth]);

  const totalBudget = budgets.filter(b => b.month === selectedMonth).reduce((s, b) => s + b.limit, 0);
  const totalSpent = Object.values(monthlyExpenses).reduce((s, v) => s + v, 0);

  const handleSetBudget = (category: string) => {
    if (!budgetValue) return;
    const newBudgets = budgets.filter(b => !(b.category === category && b.month === selectedMonth));
    newBudgets.push({ category, limit: parseFloat(budgetValue), month: selectedMonth });
    setBudgets(newBudgets);
    setEditingCategory(null); setBudgetValue('');
  };

  const handleDeleteBudget = (category: string) => {
    setBudgets(budgets.filter(b => !(b.category === category && b.month === selectedMonth)));
  };

  const getBudget = (catId: string) => budgets.find(b => b.category === catId && b.month === selectedMonth);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Bütçe Hedefleri</h1><p className="text-white/60 text-sm">Harcama limitleriniz</p></div>
        <PlanBadge plan={userPlan} onClick={onUpgrade} />
      </div>
      <MonthSelector selectedMonth={selectedMonth} onMonthChange={onMonthChange} userPlan={userPlan} onUpgrade={onUpgrade} />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-600/30 to-indigo-700/30 border border-blue-500/30 rounded-2xl p-5">
        <div className="flex justify-between items-center mb-3">
          <span className="text-white/70">Toplam Bütçe Kullanımı</span>
          <span className="text-white font-bold">{formatCurrency(totalSpent)} / {formatCurrency(totalBudget || 0)}</span>
        </div>
        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }}
            animate={{ width: totalBudget > 0 ? `${Math.min((totalSpent / totalBudget) * 100, 100)}%` : '0%' }}
            className={`h-full rounded-full ${totalBudget > 0 && totalSpent > totalBudget ? 'bg-rose-500' : totalBudget > 0 && totalSpent > totalBudget * 0.8 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
        </div>
        {totalBudget > 0 && <p className="text-white/50 text-sm mt-2">Kalan: {formatCurrency(Math.max(totalBudget - totalSpent, 0))}</p>}
      </motion.div>

      <motion.button whileTap={{ scale: 0.98 }} onClick={onManageCategories}
        className="w-full flex items-center justify-center gap-2 py-3 bg-white/10 border border-white/20 rounded-2xl hover:bg-white/15 transition-all">
        <Settings className="w-4 h-4 text-white/70" />
        <span className="text-white/70 font-medium text-sm">Gider Kategorilerini Yönet</span>
      </motion.button>

      <div className="space-y-4">
        {expCats.map((category) => {
          const Icon = getIcon(category.iconName);
          const budget = getBudget(category.id);
          const spent = monthlyExpenses[category.id] || 0;
          const percentage = budget ? Math.min((spent / budget.limit) * 100, 100) : 0;
          const isOverBudget = budget && spent > budget.limit;

          return (
            <motion.div key={category.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`bg-white/5 border rounded-2xl p-4 ${isOverBudget ? 'border-rose-500/50' : 'border-white/10'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${category.gradient} flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{category.name}</p>
                    <p className="text-white/50 text-sm">
                      {formatCurrency(spent)} {budget ? `/ ${formatCurrency(budget.limit)}` : '(limit yok)'}
                    </p>
                  </div>
                </div>
                {editingCategory === category.id ? (
                  <div className="flex items-center gap-2">
                    <input type="number" value={budgetValue} onChange={(e) => setBudgetValue(e.target.value)} placeholder="Limit"
                      className="w-24 bg-white/10 border border-white/20 rounded-xl py-2 px-3 text-white text-sm focus:outline-none" autoFocus />
                    <button onClick={() => handleSetBudget(category.id)} className="p-2 bg-emerald-500 rounded-xl">
                      <Check className="w-4 h-4 text-white" />
                    </button>
                    <button onClick={() => { setEditingCategory(null); setBudgetValue(''); }} className="p-2 bg-white/10 rounded-xl">
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditingCategory(category.id); setBudgetValue(budget?.limit.toString() || ''); }}
                      className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                      <Edit3 className="w-4 h-4 text-white/50" />
                    </button>
                    {budget && (
                      <button onClick={() => handleDeleteBudget(category.id)}
                        className="p-2 hover:bg-rose-500/20 rounded-xl transition-colors">
                        <Trash2 className="w-4 h-4 text-white/40 hover:text-rose-400" />
                      </button>
                    )}
                  </div>
                )}
              </div>
              {budget && (
                <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className={`absolute left-0 top-0 h-full rounded-full ${isOverBudget ? 'bg-rose-500' : percentage > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                </div>
              )}
              {isOverBudget && <p className="text-rose-400 text-xs mt-2">⚠️ Bütçe aşıldı: {formatCurrency(spent - budget.limit)} fazla</p>}
              {budget && !isOverBudget && percentage > 80 && <p className="text-amber-400 text-xs mt-2">⚡ %{percentage.toFixed(0)} kullanıldı</p>}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

// Export Data Function
const exportData = async (format: 'csv' | 'pdf', transactions: Transaction[], incCats: CategoryData[], expCats: CategoryData[]): Promise<void> => {
  const data = transactions.map(t => {
    const category = getCategoryInfo(t.category, t.type, incCats, expCats);
    return {
      Tarih: t.date,
      Tür: t.type === 'income' ? 'Gelir' : 'Gider',
      Kategori: category.name,
      Açıklama: t.description || '-',
      Tutar: t.amount,
      Durum: t.type === 'expense' ? (STATUS_CONFIG[t.status || 'paid'].label) : '-',
      VadeTarihi: t.dueDate || '-',
    };
  });

  const fileName = `gelir-gider-${new Date().toISOString().split('T')[0]}`;

  if (format === 'pdf') {
    // Create PDF using jsPDF
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.setTextColor(59, 130, 246); // Blue color
    doc.text('Gelir - Gider Raporu', 14, 22);
    
    // Add date
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Oluşturulma Tarihi: ${new Date().toLocaleDateString('tr-TR')}`, 14, 32);
    
    // Calculate totals
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const balance = totalIncome - totalExpense;
    
    // Add summary
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Toplam Gelir: ${formatCurrency(totalIncome)}`, 14, 45);
    doc.setTextColor(220, 38, 38);
    doc.text(`Toplam Gider: ${formatCurrency(totalExpense)}`, 14, 53);
    doc.setTextColor(balance >= 0 ? 16 : 220, balance >= 0 ? 185 : 38, balance >= 0 ? 129 : 38);
    doc.text(`Net Bakiye: ${formatCurrency(balance)}`, 14, 61);
    
    // Add table
    const tableData = data.map(row => [
      row.Tarih,
      row.Tür,
      row.Kategori,
      row.Açıklama,
      formatCurrency(row.Tutar),
      row.Durum,
    ]);
    
    (doc as any).autoTable({
      startY: 70,
      head: [['Tarih', 'Tür', 'Kategori', 'Açıklama', 'Tutar', 'Durum']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 18 },
        2: { cellWidth: 30 },
        3: { cellWidth: 45 },
        4: { cellWidth: 28, halign: 'right' },
        5: { cellWidth: 22 },
      },
    });
    
    // Add footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Sayfa ${i} / ${pageCount} - Gelir Gider Yönetimi Uygulaması`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }
    
    // Save PDF
    doc.save(`${fileName}.pdf`);
  } else {
    // CSV format with BOM for Excel Turkish character support
    const BOM = '\uFEFF';
    const headers = ['Tarih', 'Tür', 'Kategori', 'Açıklama', 'Tutar', 'Durum', 'Vade Tarihi'].join(';');
    const rows = data.map(row => [
      row.Tarih,
      row.Tür,
      row.Kategori,
      row.Açıklama,
      row.Tutar.toString().replace('.', ','), // Turkish decimal format
      row.Durum,
      row.VadeTarihi,
    ].join(';'));
    
    const content = BOM + [headers, ...rows].join('\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};

// Export Data Modal
const ExportDataModal = ({
  isOpen,
  onClose,
  transactions,
  incCats,
  expCats,
  userPlan,
  onUpgrade,
}: {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  incCats: CategoryData[];
  expCats: CategoryData[];
  userPlan: UserPlan;
  onUpgrade: () => void;
}) => {
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const planLimits = PLAN_LIMITS[userPlan.type];
  const canExportCsv = planLimits.canExportCsv;
  const canExportExcel = planLimits.canExportExcel;
  const canExportPdf = planLimits.canExportPdf;
  const isPremium = userPlan.type === 'premium';
  const isPro = userPlan.type === 'pro';
  const isFree = userPlan.type === 'free';

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    if (format === 'csv' && !canExportCsv) { onUpgrade(); return; }
    if (format === 'excel' && !canExportExcel) { onUpgrade(); return; }
    if (format === 'pdf' && !canExportPdf) { onUpgrade(); return; }
    setExporting(true);
    try {
      if (format === 'excel') {
        await exportData('csv', transactions, incCats, expCats); // CSV for Excel compatibility
        setExportSuccess('Excel');
      } else {
        await exportData(format, transactions, incCats, expCats);
        setExportSuccess(format === 'csv' ? 'CSV' : 'PDF');
      }
      setTimeout(() => setExportSuccess(null), 3000);
    } catch (error) {
      console.error('Export error:', error);
    }
    setExporting(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl p-6 max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                  <Download className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Veri Dışa Aktar</h2>
                  <p className="text-white/50 text-sm">Verilerinizi indirin</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl">
                <X className="w-6 h-6 text-white/70" />
              </button>
            </div>

            {isFree && (
              <div className="bg-amber-500/20 border border-amber-500/30 rounded-2xl p-4 mb-6">
                <div className="flex items-center gap-3">
                  <Crown className="w-6 h-6 text-amber-400" />
                  <div>
                    <p className="text-amber-300 font-medium">Premium Özellik</p>
                    <p className="text-amber-200/60 text-sm">Veri dışa aktarma için Premium veya Pro üyelik gerekli</p>
                  </div>
                </div>
              </div>
            )}

            {exportSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-500/20 border border-emerald-500/30 rounded-2xl p-4 mb-6"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  <div>
                    <p className="text-emerald-300 font-medium">{exportSuccess} dosyası indirildi!</p>
                    <p className="text-emerald-200/60 text-xs">İndirilenler klasörünü kontrol edin</p>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="space-y-3">
              <p className="text-white/70 text-sm mb-3">Format seçin:</p>
              
              {/* CSV Button - Premium */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => handleExport('csv')}
                disabled={exporting}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                  canExportCsv ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white/5 border-white/10 opacity-60'
                } ${exporting ? 'opacity-50' : ''}`}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center">
                  <Receipt className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white font-medium">CSV</p>
                  <p className="text-white/50 text-sm">Basit metin formatı</p>
                  {isPremium && <p className="text-emerald-400 text-xs mt-0.5">✓ Premium'da dahil</p>}
                  {isPro && <p className="text-emerald-400 text-xs mt-0.5">✓ Pro'da dahil</p>}
                </div>
                {exporting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : !canExportCsv ? (
                  <Lock className="w-5 h-5 text-amber-400" />
                ) : (
                  <Download className="w-5 h-5 text-white/50" />
                )}
              </motion.button>

              {/* Excel Button - Pro Only */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => handleExport('excel')}
                disabled={exporting}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                  canExportExcel ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white/5 border-white/10 opacity-60'
                } ${exporting ? 'opacity-50' : ''}`}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <Receipt className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white font-medium">Excel</p>
                  <p className="text-white/50 text-sm">Renkli, formatlı tablo</p>
                  {!isPro && <p className="text-violet-400 text-xs mt-0.5">🔒 Pro'ya özel</p>}
                  {isPro && <p className="text-emerald-400 text-xs mt-0.5">✓ Pro'da dahil</p>}
                </div>
                {exporting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : !canExportExcel ? (
                  <Lock className="w-5 h-5 text-violet-400" />
                ) : (
                  <Download className="w-5 h-5 text-white/50" />
                )}
              </motion.button>

              {/* PDF Button - Pro Only */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => handleExport('pdf')}
                disabled={exporting}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                  canExportPdf ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white/5 border-white/10 opacity-60'
                } ${exporting ? 'opacity-50' : ''}`}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center">
                  <Archive className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white font-medium">PDF Rapor</p>
                  <p className="text-white/50 text-sm">Yazdırılabilir profesyonel rapor</p>
                  {!isPro && <p className="text-violet-400 text-xs mt-0.5">🔒 Pro'ya özel</p>}
                  {isPro && <p className="text-emerald-400 text-xs mt-0.5">✓ Pro'da dahil</p>}
                </div>
                {exporting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : !canExportPdf ? (
                  <Lock className="w-5 h-5 text-violet-400" />
                ) : (
                  <Download className="w-5 h-5 text-white/50" />
                )}
              </motion.button>
            </div>

            {isFree && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onUpgrade}
                className="w-full mt-6 py-4 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl font-bold text-white shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2"
              >
                <Star className="w-5 h-5" />
                Premium'a Yükselt (CSV)
              </motion.button>
            )}
            {isPremium && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onUpgrade}
                className="w-full mt-6 py-4 bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl font-bold text-white shadow-lg shadow-violet-500/30 flex items-center justify-center gap-2"
              >
                <Crown className="w-5 h-5" />
                Pro'ya Yükselt (Excel + PDF)
              </motion.button>
            )}

            <p className="text-white/40 text-xs text-center mt-4">
              {transactions.length} işlem dışa aktarılacak
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Support Modal
const SupportModal = ({
  isOpen,
  onClose,
  userPlan,
  onUpgrade,
}: {
  isOpen: boolean;
  onClose: () => void;
  userPlan: UserPlan;
  onUpgrade: () => void;
}) => {
  const isPro = userPlan.type === 'pro';
  const [messageSent, setMessageSent] = useState(false);
  const [message, setMessage] = useState('');
  const [showRatingSection, setShowRatingSection] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const platform = detectPlatform();

  const handleRateApp = () => {
    if (platform === 'ios') {
      window.open(STORE_URLS.ios, '_blank');
    } else if (platform === 'android') {
      window.open(STORE_URLS.android, '_blank');
    } else {
      // Web'de puanlama göster
      setShowRatingSection(true);
    }
  };

  const handleSubmitRating = () => {
    // Store'a yönlendir
    if (selectedRating > 0) {
      setRatingSubmitted(true);
      setTimeout(() => {
        if (platform === 'ios') {
          window.open(STORE_URLS.ios, '_blank');
        } else if (platform === 'android') {
          window.open(STORE_URLS.android, '_blank');
        }
        setRatingSubmitted(false);
        setShowRatingSection(false);
        setSelectedRating(0);
      }, 2000);
    }
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;
    // In a real app, this would send the message to a support system
    setMessageSent(true);
    setMessage('');
    setTimeout(() => setMessageSent(false), 3000);
  };

  const handleEmailSupport = () => {
    const subject = encodeURIComponent('Gelir-Gider Yönetimi Destek Talebi');
    const body = encodeURIComponent(`Merhaba,\n\nPlan: ${userPlan.type === 'pro' ? 'Pro' : userPlan.type === 'premium' ? 'Premium' : 'Ücretsiz'}\n\nMesajınız:\n`);
    window.open(`mailto:destek@butcetakip.com?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl p-6 max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  isPro ? 'bg-gradient-to-br from-violet-500 to-purple-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                }`}>
                  <Headphones className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Destek</h2>
                  <p className="text-white/50 text-sm">Yardım ve iletişim</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl">
                <X className="w-6 h-6 text-white/70" />
              </button>
            </div>

            {/* Pro Priority Support Badge */}
            {isPro && (
              <div className="bg-violet-500/20 border border-violet-500/30 rounded-2xl p-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/30 flex items-center justify-center">
                    <Crown className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-violet-300 font-medium">Öncelikli Destek</p>
                    <p className="text-violet-200/60 text-sm">Pro üye olarak öncelikli yanıt alırsınız</p>
                  </div>
                </div>
              </div>
            )}

            {messageSent && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-500/20 border border-emerald-500/30 rounded-2xl p-4 mb-6"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  <p className="text-emerald-300 font-medium">Mesajınız gönderildi!</p>
                </div>
              </motion.div>
            )}

            {/* Rating Section */}
            {!showRatingSection ? (
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleRateApp}
                className="w-full flex items-center gap-4 p-4 mb-6 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl hover:from-amber-500/30 hover:to-orange-500/30 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-amber-300 font-medium">Uygulamayı Puanla ⭐</p>
                  <p className="text-amber-200/60 text-sm">
                    {platform === 'ios' ? 'App Store\'da' : platform === 'android' ? 'Play Store\'da' : 'Bize'} değerlendirin
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-amber-400/50" />
              </motion.button>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl"
              >
                {ratingSubmitted ? (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center py-4"
                  >
                    <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
                    <p className="text-emerald-300 font-medium">Teşekkürler! ❤️</p>
                    <p className="text-white/50 text-sm">Değerlendirmeniz için yönlendiriliyorsunuz...</p>
                  </motion.div>
                ) : (
                  <>
                    <p className="text-amber-300 font-medium text-center mb-4">Uygulamayı nasıl buldunuz?</p>
                    <div className="flex justify-center gap-2 mb-4">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <motion.button
                          key={rating}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setSelectedRating(rating)}
                          className="p-2"
                        >
                          <Star
                            className={`w-8 h-8 transition-all ${
                              rating <= selectedRating
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-white/30'
                            }`}
                          />
                        </motion.button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { setShowRatingSection(false); setSelectedRating(0); }}
                        className="flex-1 py-2 bg-white/10 rounded-xl text-white/70 text-sm"
                      >
                        İptal
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSubmitRating}
                        disabled={selectedRating === 0}
                        className="flex-1 py-2 bg-amber-500 rounded-xl text-white font-medium text-sm disabled:opacity-50"
                      >
                        Gönder
                      </motion.button>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* Support Options */}
            <div className="space-y-3 mb-6">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleEmailSupport}
                className="w-full flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white font-medium">E-posta ile İletişim</p>
                  <p className="text-white/50 text-sm">destek@butcetakip.com</p>
                </div>
                <ChevronRight className="w-5 h-5 text-white/30" />
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => window.open('https://twitter.com/butcetakip', '_blank')}
                className="w-full flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white font-medium">Sosyal Medya</p>
                  <p className="text-white/50 text-sm">Bizi takip edin</p>
                </div>
                <ChevronRight className="w-5 h-5 text-white/30" />
              </motion.button>
            </div>

            {/* Quick Message */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-white font-medium mb-3">Hızlı Mesaj Gönder</p>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Sorunuzu veya önerinizi yazın..."
                className="w-full bg-white/10 border border-white/20 rounded-xl py-3 px-4 text-white placeholder-white/30 focus:outline-none focus:border-white/40 min-h-[100px] resize-none mb-3"
              />
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleSendMessage}
                disabled={!message.trim()}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl font-medium text-white disabled:opacity-50"
              >
                Gönder
              </motion.button>
            </div>

            {/* Upgrade for Priority Support */}
            {!isPro && (
              <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                <div className="flex items-start gap-3">
                  <Crown className="w-5 h-5 text-amber-400 mt-0.5" />
                  <div>
                    <p className="text-amber-300 font-medium text-sm mb-1">Öncelikli Destek</p>
                    <p className="text-amber-200/60 text-xs mb-3">Pro üyeler öncelikli yanıt alır ve özel destek hattına erişir.</p>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={onUpgrade}
                      className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl text-white text-sm font-medium"
                    >
                      Pro'ya Yükselt
                    </motion.button>
                  </div>
                </div>
              </div>
            )}

            {/* FAQ */}
            <div className="mt-6">
              <p className="text-white/70 text-sm mb-3">Sık Sorulan Sorular</p>
              <div className="space-y-2">
                {[
                  { q: 'Verilerim nerede saklanıyor?', a: 'Verileriniz cihazınızda güvenli şekilde saklanır.' },
                  { q: 'Premium nasıl iptal edilir?', a: 'Ayarlar > Plan Yönetimi > Ücretsiz Plana Geç' },
                  { q: 'Verilerimi nasıl yedeklerim?', a: 'Pro üyeler Veri Dışa Aktar özelliğini kullanabilir.' },
                ].map((faq, i) => (
                  <div key={i} className="p-3 bg-white/5 rounded-xl">
                    <p className="text-white/80 text-sm font-medium">{faq.q}</p>
                    <p className="text-white/50 text-xs mt-1">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Settings Page
const SettingsPage = ({
  userPlan,
  onUpgrade,
  securitySettings,
  notifications,
  incomeCategories,
  expenseCategories,
  pushPermission,
  onOpenSecuritySettings,
  onOpenNotifications,
  onOpenNotificationSettings,
  onOpenPushPermission,
  onOpenManageCategories,
  onOpenExportData,
  onOpenSupport,
}: {
  userPlan: UserPlan;
  onUpgrade: () => void;
  securitySettings: SecuritySettings;
  notifications: AppNotification[];
  incomeCategories: CategoryData[];
  expenseCategories: CategoryData[];
  pushPermission: NotificationPermission | null;
  onOpenSecuritySettings: () => void;
  onOpenNotifications: () => void;
  onOpenNotificationSettings: () => void;
  onOpenPushPermission: () => void;
  onOpenManageCategories: () => void;
  onOpenExportData: () => void;
  onOpenSupport: () => void;
}) => {
  const unreadCount = notifications.filter((n: AppNotification) => !n.read).length;
  const isSecurityEnabled = securitySettings.lockType !== 'none';
  const isPushEnabled = pushPermission === 'granted';

  const settingsSections = [
    {
      title: 'Güvenlik',
      items: [
        {
          id: 'security',
          icon: Shield,
          label: 'Güvenlik Ayarları',
          description: isSecurityEnabled 
            ? `${securitySettings.lockType === 'pin' ? 'PIN' : 'Desen'} kilidi aktif`
            : 'PIN veya desen kilidi ekleyin',
          color: isSecurityEnabled ? 'from-emerald-500 to-green-600' : 'from-amber-500 to-orange-600',
          badge: !isSecurityEnabled ? '!' : null,
          badgeColor: 'bg-amber-500',
          onClick: onOpenSecuritySettings,
        },
      ],
    },
    {
      title: 'Bildirimler',
      items: [
        {
          id: 'notifications',
          icon: Bell,
          label: 'Bildirim Merkezi',
          description: unreadCount > 0 ? `${unreadCount} okunmamış bildirim` : 'Tüm bildirimler okundu',
          color: 'from-violet-500 to-purple-600',
          badge: unreadCount > 0 ? unreadCount : null,
          badgeColor: 'bg-rose-500',
          onClick: onOpenNotifications,
        },
        {
          id: 'notificationSettings',
          icon: BellRing,
          label: 'Bildirim Ayarları',
          description: 'Hangi bildirimleri alacağınızı seçin',
          color: 'from-blue-500 to-indigo-600',
          onClick: onOpenNotificationSettings,
        },
        {
          id: 'pushNotifications',
          icon: Smartphone,
          label: 'Kilit Ekranı Bildirimleri',
          description: isPushEnabled ? 'Aktif - Telefon kilitliyken bildirim alırsınız' : 'Kapalı - Açmak için dokunun',
          color: isPushEnabled ? 'from-emerald-500 to-green-600' : 'from-gray-500 to-gray-600',
          badge: isPushEnabled ? '✓' : null,
          badgeColor: 'bg-emerald-500',
          onClick: onOpenPushPermission,
        },
      ],
    },
    {
      title: 'Kategoriler',
      items: [
        {
          id: 'categories',
          icon: FolderOpen,
          label: 'Kategorileri Yönet',
          description: `${incomeCategories.length} gelir, ${expenseCategories.length} gider kategorisi`,
          color: 'from-pink-500 to-rose-600',
          onClick: onOpenManageCategories,
        },
      ],
    },
    {
      title: 'Veri Yönetimi',
      items: [
        {
          id: 'export',
          icon: Download,
          label: 'Veri Dışa Aktar',
          description: userPlan.type === 'pro' ? 'CSV, Excel ve PDF formatında indir' : userPlan.type === 'premium' ? 'CSV formatında indir (Excel ve PDF için Pro gerekli)' : 'Premium veya Pro üyelere özel',
          color: userPlan.type !== 'free' ? 'from-emerald-500 to-green-600' : 'from-gray-500 to-gray-600',
          badge: userPlan.type === 'free' ? '👑' : userPlan.type === 'premium' ? 'CSV' : userPlan.type === 'pro' ? 'Tümü' : null,
          badgeColor: userPlan.type === 'free' ? 'bg-amber-500' : 'bg-emerald-500',
          onClick: onOpenExportData,
        },
      ],
    },
    {
      title: 'Destek',
      items: [
        {
          id: 'support',
          icon: Headphones,
          label: userPlan.type === 'pro' ? 'Öncelikli Destek' : 'Destek',
          description: userPlan.type === 'pro' ? 'Pro üyelere özel hızlı yanıt' : 'Yardım ve iletişim',
          color: userPlan.type === 'pro' ? 'from-violet-500 to-purple-600' : 'from-blue-500 to-indigo-600',
          badge: userPlan.type === 'pro' ? '⭐' : null,
          badgeColor: 'bg-violet-500',
          onClick: onOpenSupport,
        },
      ],
    },
    {
      title: 'Uygulama',
      items: [
        {
          id: 'plan',
          icon: Crown,
          label: 'Plan Yönetimi',
          description: userPlan.type === 'free' ? 'Ücretsiz plan' : userPlan.type === 'premium' ? 'Premium üyelik' : 'Pro üyelik',
          color: userPlan.type === 'free' ? 'from-gray-500 to-gray-600' : userPlan.type === 'premium' ? 'from-amber-500 to-orange-600' : 'from-violet-500 to-purple-600',
          onClick: onUpgrade,
        },
      ],
    },
    
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Ayarlar</h1>
          <p className="text-white/60 text-sm">Uygulama ayarlarınız</p>
        </div>
        <PlanBadge plan={userPlan} onClick={onUpgrade} />
      </div>

      {/* Quick Status Cards */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          whileTap={{ scale: 0.98 }}
          onClick={onOpenSecuritySettings}
          className={`p-4 rounded-2xl border cursor-pointer ${
            isSecurityEnabled 
              ? 'bg-emerald-500/20 border-emerald-500/30' 
              : 'bg-amber-500/20 border-amber-500/30'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Shield className={`w-5 h-5 ${isSecurityEnabled ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span className={`text-sm font-medium ${isSecurityEnabled ? 'text-emerald-300' : 'text-amber-300'}`}>
              Güvenlik
            </span>
          </div>
          <p className={`text-lg font-bold ${isSecurityEnabled ? 'text-emerald-400' : 'text-amber-400'}`}>
            {isSecurityEnabled ? 'Aktif' : 'Kapalı'}
          </p>
        </motion.div>

        <motion.div
          whileTap={{ scale: 0.98 }}
          onClick={onOpenNotifications}
          className={`p-4 rounded-2xl border cursor-pointer ${
            unreadCount > 0 
              ? 'bg-violet-500/20 border-violet-500/30' 
              : 'bg-white/5 border-white/10'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'text-violet-400' : 'text-white/50'}`} />
            <span className={`text-sm font-medium ${unreadCount > 0 ? 'text-violet-300' : 'text-white/50'}`}>
              Bildirimler
            </span>
          </div>
          <p className={`text-lg font-bold ${unreadCount > 0 ? 'text-violet-400' : 'text-white/50'}`}>
            {unreadCount > 0 ? `${unreadCount} yeni` : 'Yok'}
          </p>
        </motion.div>
      </div>

      {/* Settings Sections */}
      {settingsSections.map((section, sectionIndex) => (
        <motion.div
          key={section.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: sectionIndex * 0.1 }}
        >
          <h2 className="text-white/70 text-sm font-medium mb-3 px-1">{section.title}</h2>
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            {section.items.map((item, itemIndex) => {
              const Icon = item.icon;
              const isLast = itemIndex === section.items.length - 1;
              return (
                <motion.button
                  key={item.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={item.onClick}
                  disabled={Boolean((item as any).disabled)}
                  className={`w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-all text-left ${
                    !isLast ? 'border-b border-white/5' : ''
                  } ${(item as any).disabled ? 'opacity-50' : ''}`}
                >
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium">{item.label}</p>
                    <p className="text-white/50 text-sm truncate">{item.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.badge && (
                      <div className={`px-2 py-1 rounded-full ${item.badgeColor} text-white text-xs font-bold`}>
                        {item.badge}
                      </div>
                    )}
                    <ChevronRight className="w-5 h-5 text-white/30" />
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      ))}

      {/* App Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center pt-6 pb-4"
      >
        <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
          <Wallet className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-white font-semibold">Gelir - Gider Yönetimi</h3>
        <p className="text-white/40 text-sm">Sürüm 1.0.0</p>
      </motion.div>
    </div>
  );
};

// ==================== SECURITY SYSTEM ====================

// Hash PIN/Pattern for secure storage
const hashPin = (pin: string): string => {
  return CryptoJS.SHA256(pin).toString();
};

// Security Settings Interface
interface SecuritySettings {
  pinEnabled: boolean;
  pinHash: string | null;
  patternEnabled: boolean;
  patternHash: string | null;
  lockType: 'pin' | 'pattern' | 'none';
  autoLockMinutes: number;
  encryptionEnabled: boolean;
  lastActivity: number;
  failedAttempts: number;
  lockoutUntil: number | null;
}

const DEFAULT_SECURITY_SETTINGS: SecuritySettings = {
  pinEnabled: false,
  pinHash: null,
  patternEnabled: false,
  patternHash: null,
  lockType: 'none',
  autoLockMinutes: 5,
  encryptionEnabled: false,
  lastActivity: Date.now(),
  failedAttempts: 0,
  lockoutUntil: null,
};

// Pattern Lock Component
const PatternLockScreen = ({
  onUnlock,
  onSetupPattern,
  isSetup,
  securitySettings,
  onUpdateSettings,
  onSwitchToPin,
}: {
  onUnlock: () => void;
  onSetupPattern: (pattern: string) => void;
  isSetup: boolean;
  securitySettings: SecuritySettings;
  onUpdateSettings: (settings: SecuritySettings) => void;
  onSwitchToPin?: () => void;
}) => {
  const [pattern, setPattern] = useState<number[]>([]);
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [error, setError] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimeRemaining, setLockTimeRemaining] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [firstPattern, setFirstPattern] = useState<number[]>([]);

  useEffect(() => {
    if (securitySettings.lockoutUntil && securitySettings.lockoutUntil > Date.now()) {
      setIsLocked(true);
      const interval = setInterval(() => {
        const remaining = Math.ceil((securitySettings.lockoutUntil! - Date.now()) / 1000);
        if (remaining <= 0) {
          setIsLocked(false);
          onUpdateSettings({ ...securitySettings, lockoutUntil: null, failedAttempts: 0 });
          clearInterval(interval);
        } else {
          setLockTimeRemaining(remaining);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [securitySettings.lockoutUntil]);

  const handleDotPress = (index: number) => {
    if (isLocked || pattern.includes(index)) return;
    setPattern([...pattern, index]);
  };

  const handleDotEnter = (index: number) => {
    if (!isDragging || isLocked || pattern.includes(index)) return;
    setPattern([...pattern, index]);
  };

  const handlePatternEnd = () => {
    setIsDragging(false);
    
    if (pattern.length < 4) {
      setError('En az 4 nokta seçin!');
      setPattern([]);
      setTimeout(() => setError(''), 2000);
      return;
    }

    const patternStr = pattern.join('-');

    if (isSetup) {
      if (step === 'enter') {
        setFirstPattern(pattern);
        setStep('confirm');
        setPattern([]);
      } else {
        if (patternStr === firstPattern.join('-')) {
          onSetupPattern(patternStr);
        } else {
          setError('Desenler eşleşmiyor!');
          setPattern([]);
          setFirstPattern([]);
          setStep('enter');
          setTimeout(() => setError(''), 2000);
        }
      }
    } else {
      const hashedInput = hashPin(patternStr);
      if (hashedInput === securitySettings.patternHash) {
        onUpdateSettings({ ...securitySettings, failedAttempts: 0, lastActivity: Date.now() });
        onUnlock();
      } else {
        const newAttempts = securitySettings.failedAttempts + 1;
        if (newAttempts >= 5) {
          const lockoutTime = Date.now() + 5 * 60 * 1000;
          onUpdateSettings({ ...securitySettings, failedAttempts: newAttempts, lockoutUntil: lockoutTime });
          setIsLocked(true);
        } else {
          onUpdateSettings({ ...securitySettings, failedAttempts: newAttempts });
        }
        setError(`Yanlış desen! ${5 - newAttempts} deneme kaldı.`);
        setPattern([]);
        setTimeout(() => setError(''), 2000);
      }
    }
  };

  const dots = [0, 1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[200] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-6"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mb-8"
      >
        <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-violet-500/30">
          <Lock className="w-10 h-10 text-white" />
        </div>
      </motion.div>

      <h1 className="text-2xl font-bold text-white mb-2">
        {isSetup ? (step === 'enter' ? 'Desen Oluştur' : 'Deseni Onayla') : 'Desen Çizin'}
      </h1>
      <p className="text-white/60 text-sm mb-8">
        {isSetup
          ? step === 'enter'
            ? 'En az 4 noktayı birleştirin'
            : 'Deseni tekrar çizin'
          : 'Uygulamaya erişmek için deseninizi çizin'}
      </p>

      {isLocked && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-rose-500/20 border border-rose-500/30 rounded-2xl p-4 mb-6 text-center"
        >
          <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
          <p className="text-rose-300 font-medium">Çok fazla hatalı deneme!</p>
          <p className="text-rose-200/70 text-sm">
            {Math.floor(lockTimeRemaining / 60)}:{String(lockTimeRemaining % 60).padStart(2, '0')} bekleyin
          </p>
        </motion.div>
      )}

      {error && !isLocked && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-rose-400 text-sm mb-4"
        >
          {error}
        </motion.p>
      )}

      {/* Pattern Grid */}
      <div 
        className="grid grid-cols-3 gap-8 p-8 touch-none"
        onMouseUp={handlePatternEnd}
        onTouchEnd={handlePatternEnd}
        onMouseLeave={() => isDragging && handlePatternEnd()}
      >
        {dots.map((dot) => {
          const isSelected = pattern.includes(dot);
          const selectionIndex = pattern.indexOf(dot);
          
          return (
            <motion.div
              key={dot}
              onMouseDown={() => { setIsDragging(true); handleDotPress(dot); }}
              onMouseEnter={() => handleDotEnter(dot)}
              onTouchStart={() => { setIsDragging(true); handleDotPress(dot); }}
              onTouchMove={(e) => {
                const touch = e.touches[0];
                const element = document.elementFromPoint(touch.clientX, touch.clientY);
                const dotIndex = element?.getAttribute('data-dot');
                if (dotIndex !== null && dotIndex !== undefined) {
                  handleDotEnter(parseInt(dotIndex));
                }
              }}
              data-dot={dot}
              animate={{
                scale: isSelected ? 1.3 : 1,
                backgroundColor: isSelected ? '#8B5CF6' : 'rgba(255,255,255,0.15)',
              }}
              className={`w-16 h-16 rounded-full flex items-center justify-center cursor-pointer transition-all ${
                isLocked ? 'opacity-30' : ''
              }`}
            >
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-violet-600 text-xs font-bold"
                >
                  {selectionIndex + 1}
                </motion.div>
              )}
              {!isSelected && (
                <div className="w-4 h-4 rounded-full bg-white/50" />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Clear Button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setPattern([])}
        disabled={isLocked || pattern.length === 0}
        className="mt-6 px-6 py-3 bg-white/10 rounded-2xl text-white/70 hover:text-white disabled:opacity-30"
      >
        Temizle
      </motion.button>

      {/* Switch to PIN */}
      {onSwitchToPin && !isSetup && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onSwitchToPin}
          className="mt-4 text-blue-400 text-sm"
        >
          PIN ile giriş yap
        </motion.button>
      )}
    </motion.div>
  );
};

// PIN Lock Screen Component
const PinLockScreen = ({
  onUnlock,
  onSetupPin,
  isSetup,
  securitySettings,
  onUpdateSettings,
  onSwitchToPattern,
}: {
  onUnlock: () => void;
  onSetupPin: (pin: string) => void;
  isSetup: boolean;
  securitySettings: SecuritySettings;
  onUpdateSettings: (settings: SecuritySettings) => void;
  onSwitchToPattern?: () => void;
}) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [error, setError] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimeRemaining, setLockTimeRemaining] = useState(0);
  const [firstPin, setFirstPin] = useState('');

  useEffect(() => {
    if (securitySettings.lockoutUntil && securitySettings.lockoutUntil > Date.now()) {
      setIsLocked(true);
      const interval = setInterval(() => {
        const remaining = Math.ceil((securitySettings.lockoutUntil! - Date.now()) / 1000);
        if (remaining <= 0) {
          setIsLocked(false);
          onUpdateSettings({ ...securitySettings, lockoutUntil: null, failedAttempts: 0 });
          clearInterval(interval);
        } else {
          setLockTimeRemaining(remaining);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [securitySettings.lockoutUntil]);

  const handlePinInput = (digit: string) => {
    if (isLocked) return;
    
    if (isSetup) {
      if (step === 'enter') {
        if (pin.length < 4) {
          const newPin = pin + digit;
          setPin(newPin);
          if (newPin.length === 4) {
            setFirstPin(newPin);
            setTimeout(() => {
              setStep('confirm');
              setPin('');
            }, 200);
          }
        }
      } else {
        if (confirmPin.length < 4) {
          const newConfirm = confirmPin + digit;
          setConfirmPin(newConfirm);
          if (newConfirm.length === 4) {
            if (firstPin === newConfirm) {
              onSetupPin(newConfirm);
            } else {
              setError('PIN\'ler eşleşmiyor!');
              setConfirmPin('');
              setStep('enter');
              setPin('');
              setFirstPin('');
              setTimeout(() => setError(''), 2000);
            }
          }
        }
      }
    } else {
      if (pin.length < 4) {
        const newPin = pin + digit;
        setPin(newPin);
        if (newPin.length === 4) {
          setTimeout(() => {
            const hashedInput = hashPin(newPin);
            if (hashedInput === securitySettings.pinHash) {
              onUpdateSettings({ ...securitySettings, failedAttempts: 0, lastActivity: Date.now() });
              onUnlock();
            } else {
              const newAttempts = securitySettings.failedAttempts + 1;
              if (newAttempts >= 5) {
                const lockoutTime = Date.now() + 5 * 60 * 1000;
                onUpdateSettings({ ...securitySettings, failedAttempts: newAttempts, lockoutUntil: lockoutTime });
                setIsLocked(true);
              } else {
                onUpdateSettings({ ...securitySettings, failedAttempts: newAttempts });
              }
              setError(`Yanlış PIN! ${5 - newAttempts} deneme kaldı.`);
              setPin('');
              setTimeout(() => setError(''), 2000);
            }
          }, 100);
        }
      }
    }
  };

  const handleDelete = () => {
    if (isSetup && step === 'confirm') {
      setConfirmPin(confirmPin.slice(0, -1));
    } else {
      setPin(pin.slice(0, -1));
    }
  };

  const currentPin = isSetup && step === 'confirm' ? confirmPin : pin;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[200] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-6"
    >
      {/* Logo */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mb-8"
      >
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/30">
          <Lock className="w-10 h-10 text-white" />
        </div>
      </motion.div>

      <h1 className="text-2xl font-bold text-white mb-2">
        {isSetup ? (step === 'enter' ? 'PIN Oluştur' : 'PIN\'i Onayla') : 'PIN Girin'}
      </h1>
      <p className="text-white/60 text-sm mb-8">
        {isSetup
          ? step === 'enter'
            ? '4 haneli PIN oluşturun'
            : 'PIN\'i tekrar girin'
          : 'Uygulamaya erişmek için PIN girin'}
      </p>

      {isLocked && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-rose-500/20 border border-rose-500/30 rounded-2xl p-4 mb-6 text-center"
        >
          <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
          <p className="text-rose-300 font-medium">Çok fazla hatalı deneme!</p>
          <p className="text-rose-200/70 text-sm">
            {Math.floor(lockTimeRemaining / 60)}:{String(lockTimeRemaining % 60).padStart(2, '0')} bekleyin
          </p>
        </motion.div>
      )}

      {error && !isLocked && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-rose-400 text-sm mb-4"
        >
          {error}
        </motion.p>
      )}

      {/* PIN Dots */}
      <div className="flex gap-4 mb-10">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            animate={{
              scale: currentPin.length > i ? 1.2 : 1,
              backgroundColor: currentPin.length > i ? '#3B82F6' : 'rgba(255,255,255,0.2)',
            }}
            className="w-4 h-4 rounded-full"
          />
        ))}
      </div>

      {/* Number Pad */}
      <div className="grid grid-cols-3 gap-4 w-full max-w-xs">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'del'].map((item, i) => {
          if (item === '') return <div key={i} />;
          if (item === 'del') {
            return (
              <motion.button
                key={i}
                whileTap={{ scale: 0.9 }}
                onClick={handleDelete}
                disabled={isLocked}
                className="w-20 h-20 rounded-full flex items-center justify-center text-white/70 hover:bg-white/10 transition-colors disabled:opacity-30"
              >
                <X className="w-6 h-6" />
              </motion.button>
            );
          }
          return (
            <motion.button
              key={i}
              whileTap={{ scale: 0.9 }}
              onClick={() => handlePinInput(String(item))}
              disabled={isLocked}
              className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-white text-2xl font-semibold hover:bg-white/20 transition-colors disabled:opacity-30"
            >
              {item}
            </motion.button>
          );
        })}
      </div>

      {/* Switch to Pattern */}
      {onSwitchToPattern && !isSetup && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onSwitchToPattern}
          className="mt-8 text-violet-400 text-sm"
        >
          Desen ile giriş yap
        </motion.button>
      )}
    </motion.div>
  );
};

// Security Settings Modal
const SecuritySettingsModal = ({
  isOpen,
  onClose,
  securitySettings,
  onUpdateSettings,
  onSetupPin,
  onSetupPattern,
  onDisableSecurity,
}: {
  isOpen: boolean;
  onClose: () => void;
  securitySettings: SecuritySettings;
  onUpdateSettings: (settings: SecuritySettings) => void;
  onSetupPin: () => void;
  onSetupPattern: () => void;
  onDisableSecurity: () => void;
}) => {
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);

  const autoLockOptions = [
    { value: 1, label: '1 dakika' },
    { value: 5, label: '5 dakika' },
    { value: 15, label: '15 dakika' },
    { value: 30, label: '30 dakika' },
    { value: 60, label: '1 saat' },
    { value: 0, label: 'Kapalı' },
  ];

  const isSecurityEnabled = securitySettings.lockType !== 'none';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl p-6 max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Güvenlik</h2>
                  <p className="text-white/50 text-sm">Uygulama güvenlik ayarları</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl">
                <X className="w-6 h-6 text-white/70" />
              </button>
            </div>

            {/* Security Status */}
            <div className={`p-4 rounded-2xl mb-6 ${isSecurityEnabled ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-amber-500/20 border border-amber-500/30'}`}>
              <div className="flex items-center gap-3">
                {isSecurityEnabled ? (
                  <>
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    <div>
                      <p className="text-emerald-300 font-medium">Güvenlik Aktif</p>
                      <p className="text-emerald-200/60 text-sm">
                        {securitySettings.lockType === 'pin' ? 'PIN kilidi açık' : 'Desen kilidi açık'}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-6 h-6 text-amber-400" />
                    <div>
                      <p className="text-amber-300 font-medium">Güvenlik Kapalı</p>
                      <p className="text-amber-200/60 text-sm">PIN veya desen kilidi önerilir</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {/* Lock Type Selection */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <p className="text-white font-medium mb-3">Kilit Türü Seçin</p>
                <div className="grid grid-cols-2 gap-3">
                  {/* PIN Option */}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={onSetupPin}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                      securitySettings.lockType === 'pin'
                        ? 'bg-blue-500/20 border-blue-500'
                        : 'bg-white/5 border-white/10 hover:border-white/30'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      securitySettings.lockType === 'pin' ? 'bg-blue-500' : 'bg-white/10'
                    }`}>
                      <Lock className={`w-6 h-6 ${securitySettings.lockType === 'pin' ? 'text-white' : 'text-white/70'}`} />
                    </div>
                    <span className={`font-medium ${securitySettings.lockType === 'pin' ? 'text-blue-300' : 'text-white/70'}`}>
                      PIN Kilidi
                    </span>
                    <span className="text-white/40 text-xs">4 haneli şifre</span>
                    {securitySettings.lockType === 'pin' && (
                      <CheckCircle2 className="w-5 h-5 text-blue-400 mt-1" />
                    )}
                  </motion.button>

                  {/* Pattern Option */}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={onSetupPattern}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                      securitySettings.lockType === 'pattern'
                        ? 'bg-violet-500/20 border-violet-500'
                        : 'bg-white/5 border-white/10 hover:border-white/30'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      securitySettings.lockType === 'pattern' ? 'bg-violet-500' : 'bg-white/10'
                    }`}>
                      <div className="grid grid-cols-3 gap-0.5">
                        {[0,1,2,3,4,5,6,7,8].map(i => (
                          <div key={i} className={`w-1.5 h-1.5 rounded-full ${
                            securitySettings.lockType === 'pattern' ? 'bg-white' : 'bg-white/70'
                          }`} />
                        ))}
                      </div>
                    </div>
                    <span className={`font-medium ${securitySettings.lockType === 'pattern' ? 'text-violet-300' : 'text-white/70'}`}>
                      Desen Kilidi
                    </span>
                    <span className="text-white/40 text-xs">9 noktalı desen</span>
                    {securitySettings.lockType === 'pattern' && (
                      <CheckCircle2 className="w-5 h-5 text-violet-400 mt-1" />
                    )}
                  </motion.button>
                </div>
              </div>

              {/* Auto Lock */}
              {isSecurityEnabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-4"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Otomatik Kilitle</p>
                      <p className="text-white/50 text-xs">Belirli süre sonra kilitle</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {autoLockOptions.map((option) => (
                      <motion.button
                        key={option.value}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onUpdateSettings({ ...securitySettings, autoLockMinutes: option.value })}
                        className={`py-2 px-3 rounded-xl text-sm font-medium transition-all ${
                          securitySettings.autoLockMinutes === option.value
                            ? 'bg-violet-500 text-white'
                            : 'bg-white/10 text-white/60 hover:bg-white/15'
                        }`}
                      >
                        {option.label}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Encryption */}
              {isSecurityEnabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                        <Key className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Veri Şifreleme</p>
                        <p className="text-white/50 text-xs">AES-256 ile şifrele</p>
                      </div>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onUpdateSettings({ ...securitySettings, encryptionEnabled: !securitySettings.encryptionEnabled })}
                      className={`w-14 h-8 rounded-full p-1 transition-all ${
                        securitySettings.encryptionEnabled ? 'bg-emerald-500' : 'bg-white/20'
                      }`}
                    >
                      <motion.div
                        layout
                        className="w-6 h-6 rounded-full bg-white shadow-md"
                        animate={{ x: securitySettings.encryptionEnabled ? 24 : 0 }}
                      />
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Change Lock */}
              {isSecurityEnabled && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => securitySettings.lockType === 'pin' ? onSetupPin() : onSetupPattern()}
                  className="w-full py-3 bg-white/5 border border-white/10 rounded-2xl text-white/70 hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  {securitySettings.lockType === 'pin' ? 'PIN Değiştir' : 'Deseni Değiştir'}
                </motion.button>
              )}

              {/* Disable Security */}
              {isSecurityEnabled && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDisableConfirm(true)}
                  className="w-full py-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 hover:bg-rose-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Kilidi Kaldır
                </motion.button>
              )}
            </div>

            {/* Security Tips */}
            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-400 mt-0.5" />
                <div>
                  <p className="text-blue-300 font-medium text-sm mb-1">Güvenlik İpuçları</p>
                  <ul className="text-blue-200/60 text-xs space-y-1">
                    <li>• Kolay tahmin edilebilir PIN'ler kullanmayın (1234, 0000)</li>
                    <li>• Basit desenlerden kaçının (düz çizgi, L şekli)</li>
                    <li>• PIN veya deseninizi kimseyle paylaşmayın</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Disable Confirmation */}
            <AnimatePresence>
              {showDisableConfirm && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="mt-4 p-4 bg-rose-500/20 border border-rose-500/30 rounded-2xl"
                >
                  <p className="text-rose-300 font-medium mb-3">Güvenlik kilidini kaldırmak istediğinize emin misiniz?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { onDisableSecurity(); setShowDisableConfirm(false); }}
                      className="flex-1 py-2 bg-rose-500 rounded-xl text-white font-medium"
                    >
                      Evet, Kaldır
                    </button>
                    <button
                      onClick={() => setShowDisableConfirm(false)}
                      className="flex-1 py-2 bg-white/10 rounded-xl text-white/70"
                    >
                      İptal
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Default Notification Settings
const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  dueSoonDays: 3,
  enableDueSoon: true,
  enableOverdue: true,
  enableBudgetWarning: true,
  enableBudgetExceeded: true,
  enablePaymentSuccess: true,
  enableTips: true,
};

// Push Notification Helper Functions
const isPushSupported = (): boolean => {
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
};

const getNotificationPermission = (): NotificationPermission | null => {
  if (!('Notification' in window)) return null;
  return Notification.permission;
};

const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isPushSupported()) return false;
  
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Notification permission error:', error);
    return false;
  }
};

const sendPushNotification = async (title: string, body: string, options?: {
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
}): Promise<boolean> => {
  if (!isPushSupported() || Notification.permission !== 'granted') return false;
  
  try {
    // Try using Service Worker first (better for PWA)
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        body,
        icon: options?.icon || '/icon-192.png',
        badge: options?.badge || '/icon-192.png',
        tag: options?.tag,
        data: options?.data,
      } as NotificationOptions);
      return true;
    }
    
    // Fallback to regular Notification API
    new Notification(title, {
      body,
      icon: options?.icon || '/icon-192.png',
      tag: options?.tag,
      data: options?.data,
    });
    return true;
  } catch (error) {
    console.error('Send notification error:', error);
    return false;
  }
};

// Push Notification Permission Modal
const PushNotificationModal = ({
  isOpen,
  onClose,
  onEnable,
}: {
  isOpen: boolean;
  onClose: () => void;
  onEnable: () => void;
}) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const permission = getNotificationPermission();

  const handleEnable = async () => {
    setIsRequesting(true);
    const granted = await requestNotificationPermission();
    setIsRequesting(false);
    
    if (granted) {
      onEnable();
      // Send a test notification
      await sendPushNotification(
        '🎉 Bildirimler Aktif!',
        'Artık ödeme hatırlatmaları alacaksınız.',
        { tag: 'welcome' }
      );
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl p-6 text-center"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <BellRing className="w-10 h-10 text-white" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-3">
              {permission === 'denied' ? '🔕 Bildirimler Engelli' : '🔔 Bildirimleri Aç'}
            </h2>

            {permission === 'denied' ? (
              <>
                <p className="text-white/60 mb-6">
                  Bildirimler tarayıcı ayarlarından engellenmiş. Lütfen tarayıcı ayarlarından bildirimlere izin verin.
                </p>
                <div className="bg-amber-500/20 border border-amber-500/30 rounded-2xl p-4 mb-6 text-left">
                  <p className="text-amber-300 text-sm font-medium mb-2">📱 Nasıl Açılır:</p>
                  <ol className="text-amber-200/80 text-sm space-y-1">
                    <li>1. Tarayıcı adres çubuğundaki 🔒 simgesine tıklayın</li>
                    <li>2. "Site Ayarları" veya "İzinler" seçin</li>
                    <li>3. Bildirimler'i "İzin Ver" yapın</li>
                    <li>4. Sayfayı yenileyin</li>
                  </ol>
                </div>
              </>
            ) : (
              <>
                <p className="text-white/60 mb-6">
                  Ödeme hatırlatmaları, bütçe uyarıları ve daha fazlası için bildirimleri açın.
                  <br /><br />
                  <span className="text-emerald-400 font-medium">✓ Kilit ekranında görünür</span><br />
                  <span className="text-emerald-400 font-medium">✓ Uygulama kapalıyken bile çalışır</span>
                </p>

                <div className="space-y-3 mb-6 text-left">
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                      <CalendarClock className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">Ödeme Hatırlatmaları</p>
                      <p className="text-white/50 text-xs">Vadesi yaklaşan ödemeler için uyarı</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-rose-500/20 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-rose-400" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">Bütçe Uyarıları</p>
                      <p className="text-white/50 text-xs">Bütçe aşımlarında anında bilgi</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-white/10 border border-white/20 rounded-2xl text-white/70 hover:text-white transition-colors"
              >
                {permission === 'denied' ? 'Tamam' : 'Daha Sonra'}
              </button>
              {permission !== 'denied' && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleEnable}
                  disabled={isRequesting}
                  className="flex-1 py-3 bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl font-bold text-white shadow-lg shadow-violet-500/30 flex items-center justify-center gap-2"
                >
                  {isRequesting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Bell className="w-5 h-5" />
                      Aç
                    </>
                  )}
                </motion.button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ==================== MAIN APP ====================
export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedMonth, setSelectedMonth] = useState(() => getMonthKey(new Date()));
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  // showInstallModal kaldırıldı
  const [showManageCategories, setShowManageCategories] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showPushPermissionModal, setShowPushPermissionModal] = useState(false);
  const [showSecuritySettings, setShowSecuritySettings] = useState(false);
  const [showExportData, setShowExportData] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isSettingUpPin, setIsSettingUpPin] = useState(false);
  const lastActivityRef = useRef(Date.now());
  const [pushEnabled, setPushEnabled] = useState(() => {
    return getNotificationPermission() === 'granted';
  });
  const [upgradedPlan, setUpgradedPlan] = useState<'premium' | 'pro' | 'free'>('premium');
  // deferredPrompt kaldırıldı
  // isAppInstalled kaldırıldı
  
  // Security Settings State
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>(() => {
    const saved = localStorage.getItem('securitySettings');
    return saved ? JSON.parse(saved) : DEFAULT_SECURITY_SETTINGS;
  });

  // Save security settings
  useEffect(() => {
    localStorage.setItem('securitySettings', JSON.stringify(securitySettings));
  }, [securitySettings]);

  // Check if app should be locked on mount
  useEffect(() => {
    if (securitySettings.lockType !== 'none') {
      const timeSinceActivity = Date.now() - securitySettings.lastActivity;
      const lockTime = securitySettings.autoLockMinutes * 60 * 1000;
      if (lockTime > 0 && timeSinceActivity > lockTime) {
        setIsLocked(true);
      } else {
        setIsLocked(true); // Always lock on app start if security enabled
      }
    }
  }, []);

  // Auto-lock timer
  useEffect(() => {
    if (securitySettings.lockType === 'none' || securitySettings.autoLockMinutes === 0) return;

    const checkActivity = () => {
      const timeSinceActivity = Date.now() - lastActivityRef.current;
      const lockTime = securitySettings.autoLockMinutes * 60 * 1000;
      if (timeSinceActivity > lockTime) {
        setIsLocked(true);
      }
    };

    const interval = setInterval(checkActivity, 10000); // Check every 10 seconds

    // Update activity on user interaction
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
      setSecuritySettings(prev => ({ ...prev, lastActivity: Date.now() }));
    };

    window.addEventListener('click', updateActivity);
    window.addEventListener('touchstart', updateActivity);
    window.addEventListener('keydown', updateActivity);

    return () => {
      clearInterval(interval);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
      window.removeEventListener('keydown', updateActivity);
    };
  }, [securitySettings.lockType, securitySettings.autoLockMinutes]);

  // State for setting up pattern
  const [isSettingUpPattern, setIsSettingUpPattern] = useState(false);

  // Handle PIN setup
  const handleSetupPin = (pin: string) => {
    const hashedPin = hashPin(pin);
    setSecuritySettings({
      ...securitySettings,
      pinEnabled: true,
      pinHash: hashedPin,
      patternEnabled: false,
      patternHash: null,
      lockType: 'pin',
      lastActivity: Date.now(),
      failedAttempts: 0,
      lockoutUntil: null,
    });
    setIsSettingUpPin(false);
    setIsLocked(false);
  };

  // Handle Pattern setup
  const handleSetupPattern = (pattern: string) => {
    const hashedPattern = hashPin(pattern);
    setSecuritySettings({
      ...securitySettings,
      pinEnabled: false,
      pinHash: null,
      patternEnabled: true,
      patternHash: hashedPattern,
      lockType: 'pattern',
      lastActivity: Date.now(),
      failedAttempts: 0,
      lockoutUntil: null,
    });
    setIsSettingUpPattern(false);
    setIsLocked(false);
  };

  // Handle unlock
  const handleUnlock = () => {
    lastActivityRef.current = Date.now();
    setSecuritySettings(prev => ({ ...prev, lastActivity: Date.now() }));
    setIsLocked(false);
  };

  // Handle disable security
  const handleDisableSecurity = () => {
    setSecuritySettings({
      ...DEFAULT_SECURITY_SETTINGS,
      lastActivity: Date.now(),
    });
    setIsLocked(false);
  };

  // Start PIN setup
  const startPinSetup = () => {
    setShowSecuritySettings(false);
    setIsSettingUpPin(true);
  };

  // Start Pattern setup
  const startPatternSetup = () => {
    setShowSecuritySettings(false);
    setIsSettingUpPattern(true);
  };

  const [userPlan, setUserPlan] = useState<UserPlan>(() => {
    const saved = localStorage.getItem('userPlan');
    return saved ? JSON.parse(saved) : { type: 'free' };
  });

  // Dynamic Categories
  const [incomeCategories, setIncomeCategories] = useState<CategoryData[]>(() => {
    const saved = localStorage.getItem('incomeCategories');
    return saved ? JSON.parse(saved) : DEFAULT_INCOME_CATEGORIES;
  });

  const [expenseCategories, setExpenseCategories] = useState<CategoryData[]>(() => {
    const saved = localStorage.getItem('expenseCategories');
    return saved ? JSON.parse(saved) : DEFAULT_EXPENSE_CATEGORIES;
  });

  // App install event listener kaldırıldı

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('transactions');
    if (saved) { const parsed = JSON.parse(saved); if (parsed.length > 0) return parsed; }
    return generateDemoData().transactions;
  });

  const [budgets, setBudgets] = useState<Budget[]>(() => {
    const saved = localStorage.getItem('budgets');
    if (saved) { const parsed = JSON.parse(saved); if (parsed.length > 0) return parsed; }
    return generateDemoData().budgets;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('notifications');
    return saved ? JSON.parse(saved) : [];
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => {
    const saved = localStorage.getItem('notificationSettings');
    return saved ? JSON.parse(saved) : DEFAULT_NOTIFICATION_SETTINGS;
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'income' | 'expense'>('income');

  useEffect(() => { localStorage.setItem('transactions', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('budgets', JSON.stringify(budgets)); }, [budgets]);
  useEffect(() => { localStorage.setItem('userPlan', JSON.stringify(userPlan)); }, [userPlan]);
  useEffect(() => { localStorage.setItem('incomeCategories', JSON.stringify(incomeCategories)); }, [incomeCategories]);
  useEffect(() => { localStorage.setItem('expenseCategories', JSON.stringify(expenseCategories)); }, [expenseCategories]);
  useEffect(() => { localStorage.setItem('notifications', JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings)); }, [notificationSettings]);

  // Generate notifications based on transactions and budgets
  const generateNotifications = useCallback(() => {
    const newNotifications: AppNotification[] = [];
    const now = new Date();
    const currentMonthKey = getMonthKey(now);
    
    // Check for due soon and overdue payments
    transactions.forEach(t => {
      if (t.type !== 'expense' || t.status === 'paid') return;
      
      const status = checkOverdue(t);
      const dueDate = t.dueDate ? new Date(t.dueDate) : null;
      
      if (status === 'overdue' && notificationSettings.enableOverdue) {
        const exists = notifications.find(n => n.transactionId === t.id && n.actionType === 'overdue');
        if (!exists) {
          const category = getCategoryInfo(t.category, 'expense', incomeCategories, expenseCategories);
          newNotifications.push({
            id: `overdue-${t.id}`,
            type: 'danger',
            title: '⚠️ Gecikmiş Ödeme!',
            message: `${category.name} - ${formatCurrency(t.amount)} vadesi geçti!`,
            date: new Date().toISOString(),
            read: false,
            transactionId: t.id,
            actionType: 'overdue',
          });
        }
      }
      
      if (dueDate && status === 'pending' && notificationSettings.enableDueSoon) {
        const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / 86400000);
        if (daysUntilDue > 0 && daysUntilDue <= notificationSettings.dueSoonDays) {
          const exists = notifications.find(n => n.transactionId === t.id && n.actionType === 'due_soon');
          if (!exists) {
            const category = getCategoryInfo(t.category, 'expense', incomeCategories, expenseCategories);
            newNotifications.push({
              id: `due-soon-${t.id}`,
              type: 'warning',
              title: '📅 Yaklaşan Ödeme',
              message: `${category.name} - ${formatCurrency(t.amount)} için ${daysUntilDue} gün kaldı.`,
              date: new Date().toISOString(),
              read: false,
              transactionId: t.id,
              actionType: 'due_soon',
            });
          }
        }
      }
    });
    
    // Check budget warnings
    const monthlyExpenses: Record<string, number> = {};
    transactions
      .filter(t => t.type === 'expense' && getMonthKey(new Date(t.date)) === currentMonthKey)
      .forEach(t => { monthlyExpenses[t.category] = (monthlyExpenses[t.category] || 0) + t.amount; });
    
    budgets.filter(b => b.month === currentMonthKey).forEach(budget => {
      const spent = monthlyExpenses[budget.category] || 0;
      const percentage = (spent / budget.limit) * 100;
      const category = getCategoryInfo(budget.category, 'expense', incomeCategories, expenseCategories);
      
      if (percentage >= 100 && notificationSettings.enableBudgetExceeded) {
        const exists = notifications.find(n => n.category === budget.category && n.actionType === 'budget_exceeded' && n.date.startsWith(currentMonthKey));
        if (!exists) {
          newNotifications.push({
            id: `budget-exceeded-${budget.category}-${currentMonthKey}`,
            type: 'danger',
            title: '🚨 Bütçe Aşıldı!',
            message: `${category.name} bütçesi aşıldı! ${formatCurrency(spent)} / ${formatCurrency(budget.limit)}`,
            date: new Date().toISOString(),
            read: false,
            category: budget.category,
            actionType: 'budget_exceeded',
          });
        }
      } else if (percentage >= 80 && percentage < 100 && notificationSettings.enableBudgetWarning) {
        const exists = notifications.find(n => n.category === budget.category && n.actionType === 'budget_warning' && n.date.startsWith(currentMonthKey));
        if (!exists) {
          newNotifications.push({
            id: `budget-warning-${budget.category}-${currentMonthKey}`,
            type: 'warning',
            title: '⚡ Bütçe Uyarısı',
            message: `${category.name} bütçesinin %${percentage.toFixed(0)}'ını harcadınız.`,
            date: new Date().toISOString(),
            read: false,
            category: budget.category,
            actionType: 'budget_warning',
          });
        }
      }
    });
    
    if (newNotifications.length > 0) {
      setNotifications(prev => [...newNotifications, ...prev].slice(0, 50));
      
      // Send push notifications for new notifications
      if (pushEnabled && isPushSupported() && Notification.permission === 'granted') {
        newNotifications.forEach(notification => {
          sendPushNotification(notification.title, notification.message, {
            tag: notification.id,
            data: { transactionId: notification.transactionId, category: notification.category },
          });
        });
      }
    }
  }, [transactions, budgets, notifications, notificationSettings, incomeCategories, expenseCategories]);

  // Run notification check on mount and when data changes
  useEffect(() => {
    generateNotifications();
  }, [transactions, budgets]);

  // Notification handlers
  const handleMarkAsRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  const unreadNotificationCount = notifications.filter(n => !n.read).length;

  const handleAddTransaction = (transaction: Omit<Transaction, 'id'>) => {
    setTransactions([{ ...transaction, id: Date.now().toString() }, ...transactions]);
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  const handleStatusChange = (id: string, newStatus: ExpenseStatus) => {
    setTransactions(transactions.map(t => t.id === id ? { ...t, status: newStatus } : t));
  };

  const openModal = (type: 'income' | 'expense') => { setModalType(type); setModalOpen(true); };

  const handleUpgrade = (plan: 'premium' | 'pro') => {
    setUserPlan({ type: plan }); setUpgradedPlan(plan);
    setShowPremiumModal(false); setShowSuccessModal(true);
  };

  const handleDowngrade = () => {
    setUserPlan({ type: 'free' }); setUpgradedPlan('free');
    setShowPremiumModal(false); setShowSuccessModal(true);
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      <div className="h-full max-w-md mx-auto flex flex-col">
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-20">
          <AnimatePresence mode="wait">
            {activeTab === 'home' && (
              <motion.div key="home" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <HomePage transactions={transactions} onAdd={openModal} onDelete={handleDeleteTransaction}
                  onStatusChange={handleStatusChange} selectedMonth={selectedMonth} onMonthChange={setSelectedMonth}
                  userPlan={userPlan} onUpgrade={() => setShowPremiumModal(true)}
                  incCats={incomeCategories} expCats={expenseCategories}
                  onManageCategories={() => setShowManageCategories(true)}
                  unreadNotifications={unreadNotificationCount}
                  onOpenNotifications={() => setShowNotifications(true)} />
              </motion.div>
            )}
            {activeTab === 'transactions' && (
              <motion.div key="transactions" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <TransactionsPage transactions={transactions} onDelete={handleDeleteTransaction}
                  onStatusChange={handleStatusChange} selectedMonth={selectedMonth} onMonthChange={setSelectedMonth}
                  userPlan={userPlan} onUpgrade={() => setShowPremiumModal(true)}
                  incCats={incomeCategories} expCats={expenseCategories} />
              </motion.div>
            )}
            {activeTab === 'stats' && (
              <motion.div key="stats" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <StatsPage transactions={transactions} selectedMonth={selectedMonth} onMonthChange={setSelectedMonth}
                  userPlan={userPlan} onUpgrade={() => setShowPremiumModal(true)}
                  incCats={incomeCategories} expCats={expenseCategories} />
              </motion.div>
            )}
            {activeTab === 'budget' && (
              <motion.div key="budget" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <BudgetPage transactions={transactions} budgets={budgets} setBudgets={setBudgets}
                  selectedMonth={selectedMonth} onMonthChange={setSelectedMonth}
                  userPlan={userPlan} onUpgrade={() => setShowPremiumModal(true)}
                  expCats={expenseCategories} onManageCategories={() => setShowManageCategories(true)} />
              </motion.div>
            )}
            {activeTab === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <SettingsPage 
                  userPlan={userPlan}
                  onUpgrade={() => setShowPremiumModal(true)}
                  securitySettings={securitySettings}
                  notifications={notifications}
                  incomeCategories={incomeCategories}
                  expenseCategories={expenseCategories}
                  pushPermission={getNotificationPermission()}
                  onOpenSecuritySettings={() => setShowSecuritySettings(true)}
                  onOpenNotifications={() => setShowNotifications(true)}
                  onOpenNotificationSettings={() => setShowNotificationSettings(true)}
                  onOpenPushPermission={() => setShowPushPermissionModal(true)}
                  onOpenManageCategories={() => setShowManageCategories(true)}
                  onOpenExportData={() => setShowExportData(true)}
                  onOpenSupport={() => setShowSupport(true)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <TabBar activeTab={activeTab} setActiveTab={setActiveTab} userPlan={userPlan} onUpgrade={() => setShowPremiumModal(true)} 
        unreadNotifications={unreadNotificationCount} securityEnabled={securitySettings.lockType !== 'none'} />

      <AddTransactionModal isOpen={modalOpen} onClose={() => setModalOpen(false)} type={modalType}
        onAdd={handleAddTransaction} selectedMonth={selectedMonth}
        categories={modalType === 'income' ? incomeCategories : expenseCategories} />

      <ManageCategoriesModal isOpen={showManageCategories} onClose={() => setShowManageCategories(false)}
        incomeCategories={incomeCategories} expenseCategories={expenseCategories}
        onUpdateIncomeCategories={setIncomeCategories} onUpdateExpenseCategories={setExpenseCategories} />

      <PremiumModal isOpen={showPremiumModal} onClose={() => setShowPremiumModal(false)}
        onSelectPlan={handleUpgrade} currentPlan={userPlan} onDowngrade={handleDowngrade} />

      <UpgradeSuccessModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} plan={upgradedPlan} />

      {/* InstallAppModal kaldırıldı */}

      <NotificationCenterModal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
        onDeleteNotification={handleDeleteNotification}
        onClearAll={handleClearAllNotifications}
        onOpenSettings={() => { setShowNotifications(false); setShowNotificationSettings(true); }}
        onNavigateToTransaction={() => {
          setActiveTab('transactions');
        }}
      />

      <NotificationSettingsModal
        isOpen={showNotificationSettings}
        onClose={() => setShowNotificationSettings(false)}
        settings={notificationSettings}
        onUpdateSettings={setNotificationSettings}
        onEnablePush={() => { setShowNotificationSettings(false); setShowPushPermissionModal(true); }}
        pushPermission={getNotificationPermission()}
      />

      <PushNotificationModal
        isOpen={showPushPermissionModal}
        onClose={() => setShowPushPermissionModal(false)}
        onEnable={() => setPushEnabled(true)}
      />

      <SecuritySettingsModal
        isOpen={showSecuritySettings}
        onClose={() => setShowSecuritySettings(false)}
        securitySettings={securitySettings}
        onUpdateSettings={setSecuritySettings}
        onSetupPin={startPinSetup}
        onSetupPattern={startPatternSetup}
        onDisableSecurity={handleDisableSecurity}
      />

      <ExportDataModal
        isOpen={showExportData}
        onClose={() => setShowExportData(false)}
        transactions={transactions}
        incCats={incomeCategories}
        expCats={expenseCategories}
        userPlan={userPlan}
        onUpgrade={() => { setShowExportData(false); setShowPremiumModal(true); }}
      />

      <SupportModal
        isOpen={showSupport}
        onClose={() => setShowSupport(false)}
        userPlan={userPlan}
        onUpgrade={() => { setShowSupport(false); setShowPremiumModal(true); }}
      />

      {/* PIN Lock Screen */}
      {(isLocked && securitySettings.lockType === 'pin') && (
        <PinLockScreen
          onUnlock={handleUnlock}
          onSetupPin={handleSetupPin}
          isSetup={false}
          securitySettings={securitySettings}
          onUpdateSettings={setSecuritySettings}
          onSwitchToPattern={securitySettings.patternEnabled ? () => {} : undefined}
        />
      )}

      {/* Pattern Lock Screen */}
      {(isLocked && securitySettings.lockType === 'pattern') && (
        <PatternLockScreen
          onUnlock={handleUnlock}
          onSetupPattern={handleSetupPattern}
          isSetup={false}
          securitySettings={securitySettings}
          onUpdateSettings={setSecuritySettings}
          onSwitchToPin={securitySettings.pinEnabled ? () => {} : undefined}
        />
      )}

      {/* PIN Setup Screen */}
      {isSettingUpPin && (
        <PinLockScreen
          onUnlock={() => setIsSettingUpPin(false)}
          onSetupPin={handleSetupPin}
          isSetup={true}
          securitySettings={securitySettings}
          onUpdateSettings={setSecuritySettings}
        />
      )}

      {/* Pattern Setup Screen */}
      {isSettingUpPattern && (
        <PatternLockScreen
          onUnlock={() => setIsSettingUpPattern(false)}
          onSetupPattern={handleSetupPattern}
          isSetup={true}
          securitySettings={securitySettings}
          onUpdateSettings={setSecuritySettings}
        />
      )}

    </div>
  );
}
