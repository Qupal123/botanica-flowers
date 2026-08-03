import React, { useState, useEffect, useRef } from 'react';
import { Product, Category, Subcategory, Sort, User, Order, OrderStatus, ChatMessage } from '../types';
import { Plus, Trash2, FolderPlus, Tag, Upload, Image as ImageIcon, Settings, Package, ShoppingBag, Clock, CheckCircle, MessageSquare, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminDashboardProps {
  currentUser?: User;
  onUserUpdate?: (user: User) => void;
}

export function AdminDashboard({ currentUser, onUserUpdate }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'catalog' | 'settings' | 'orders' | 'chat'>('catalog');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedChatOrderId, setSelectedChatOrderId] = useState<string | null>(null);
  const [adminReply, setAdminReply] = useState('');
  
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [stock, setStock] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [sortId, setSortId] = useState('');

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [selectedCategoryForSub, setSelectedCategoryForSub] = useState('');

  const [newSortName, setNewSortName] = useState('');
  const [selectedCategoryForSort, setSelectedCategoryForSort] = useState('');
  const [selectedSubcategoryForSort, setSelectedSubcategoryForSort] = useState('');

  // Admin settings state
  const [adminUsername, setAdminUsername] = useState(currentUser?.username || '');
  const [adminPassword, setAdminPassword] = useState(currentUser?.passwordHash || '');
  const [settingsMessage, setSettingsMessage] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const storedProducts = JSON.parse(localStorage.getItem('botanica_products') || '[]').map((p: any) => ({
      ...p,
      mediaUrls: p.mediaUrls || (p.imageUrl ? [p.imageUrl] : [])
    }));
    setProducts(storedProducts);
    
    const storedCategoriesRaw = JSON.parse(localStorage.getItem('botanica_categories') || '[]');
    const migratedCategories: Category[] = storedCategoriesRaw.map((c: any) => ({
      ...c,
      sorts: c.sorts || [],
      subcategories: (c.subcategories || []).map((s: any) => ({
        ...s,
        sorts: s.sorts || []
      }))
    }));
    setCategories(migratedCategories);

    const storedOrders = JSON.parse(localStorage.getItem('botanica_orders') || '[]');
    setOrders(storedOrders);

    const storedMessages = JSON.parse(localStorage.getItem('botanica_chat') || '[]');
    setMessages(storedMessages);
  }, []);

  useEffect(() => {
    if (activeTab === 'chat' && selectedChatOrderId) {
      const storedMessages = JSON.parse(localStorage.getItem('botanica_chat') || '[]');
      let changed = false;
      const updatedMessages = storedMessages.map((m: ChatMessage) => {
        if (m.orderId === selectedChatOrderId && m.senderRole === 'user' && !m.read) {
          changed = true;
          return { ...m, read: true };
        }
        return m;
      });
      if (changed) {
        localStorage.setItem('botanica_chat', JSON.stringify(updatedMessages));
        setMessages(updatedMessages);
      }
    }
  }, [activeTab, selectedChatOrderId]);

  const saveCategories = (updated: Category[]) => {
    setCategories(updated);
    localStorage.setItem('botanica_categories', JSON.stringify(updated));
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    
    const newCategory: Category = {
      id: Date.now().toString(),
      name: newCategoryName,
      subcategories: [],
      sorts: []
    };
    saveCategories([...categories, newCategory]);
    setNewCategoryName('');
  };

  const handleAddSubcategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubcategoryName.trim() || !selectedCategoryForSub) return;
    
    const updated = categories.map(c => {
      if (c.id === selectedCategoryForSub) {
        return {
          ...c,
          subcategories: [...c.subcategories, { id: Date.now().toString(), name: newSubcategoryName, sorts: [] }]
        };
      }
      return c;
    });
    saveCategories(updated);
    setNewSubcategoryName('');
  };

  const handleAddSort = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSortName.trim() || !selectedCategoryForSort) return;

    const newSort: Sort = { id: Date.now().toString(), name: newSortName };

    const updated = categories.map(c => {
      if (c.id === selectedCategoryForSort) {
        if (selectedSubcategoryForSort) {
          return {
            ...c,
            subcategories: c.subcategories.map(s => s.id === selectedSubcategoryForSort ? { ...s, sorts: [...s.sorts, newSort] } : s)
          };
        } else {
          return {
            ...c,
            sorts: [...c.sorts, newSort]
          };
        }
      }
      return c;
    });

    saveCategories(updated);
    setNewSortName('');
  };

  const handleDeleteCategory = (id: string) => {
    saveCategories(categories.filter(c => c.id !== id));
  };

  const handleDeleteSubcategory = (catId: string, subId: string) => {
    saveCategories(categories.map(c => c.id === catId ? { ...c, subcategories: c.subcategories.filter(s => s.id !== subId) } : c));
  };

  const handleDeleteSort = (catId: string, subId: string | undefined, sortId: string) => {
    saveCategories(categories.map(c => {
      if (c.id === catId) {
        if (subId) {
          return {
            ...c,
            subcategories: c.subcategories.map(s => s.id === subId ? { ...s, sorts: s.sorts.filter(x => x.id !== sortId) } : s)
          };
        } else {
          return {
            ...c,
            sorts: c.sorts.filter(x => x.id !== sortId)
          };
        }
      }
      return c;
    }));
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (!files.length) return;

    files.forEach(file => {
      if (file.type.startsWith('video/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setMediaUrls(prev => [...prev, event.target?.result as string]);
        };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1200;
            const MAX_HEIGHT = 1200;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            setMediaUrls(prev => [...prev, dataUrl]);
          };
          img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeMedia = (index: number) => {
    setMediaUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) {
      alert("Выберите каталог");
      return;
    }

    const newProduct: Product = {
      id: Date.now().toString(),
      name,
      price: parseFloat(price),
      description,
      stock: stock ? parseInt(stock) : undefined,
      mediaUrls: mediaUrls.length > 0 ? mediaUrls : ['https://images.unsplash.com/photo-1563241598-6d27d7e79c4a?auto=format&fit=crop&q=80&w=800'],
      imageUrl: mediaUrls[0] || 'https://images.unsplash.com/photo-1563241598-6d27d7e79c4a?auto=format&fit=crop&q=80&w=800',
      categoryId,
      subcategoryId: subcategoryId || undefined,
      sortId: sortId || undefined
    };
    
    const updated = [...products, newProduct];
    setProducts(updated);
    localStorage.setItem('botanica_products', JSON.stringify(updated));
    
    setName('');
    setPrice('');
    setDescription('');
    setStock('');
    setMediaUrls([]);
    setSortId('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = (id: string) => {
    const updated = products.filter(p => p.id !== id);
    setProducts(updated);
    localStorage.setItem('botanica_products', JSON.stringify(updated));
  };

  const selectedCat = categories.find(c => c.id === categoryId);
  const subcategoriesForSelected = selectedCat ? selectedCat.subcategories : [];
  
  let availableSortsForProduct: Sort[] = [];
  if (selectedCat) {
    if (subcategoryId) {
      const sub = selectedCat.subcategories.find(s => s.id === subcategoryId);
      if (sub) availableSortsForProduct = sub.sorts;
    } else {
      availableSortsForProduct = selectedCat.sorts;
    }
  }

  const selectedCatForSort = categories.find(c => c.id === selectedCategoryForSort);

  const handleUpdateSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUsername.trim() || !adminPassword.trim()) {
      setSettingsMessage('Логин и пароль не могут быть пустыми');
      return;
    }
    
    if (currentUser && onUserUpdate) {
      const users: User[] = JSON.parse(localStorage.getItem('botanica_users') || '[]');
      const userIndex = users.findIndex(u => u.username === currentUser.username);
      
      const updatedUser = {
        ...currentUser,
        username: adminUsername.trim(),
        passwordHash: adminPassword.trim()
      };
      
      if (userIndex !== -1) {
        users[userIndex] = updatedUser;
        localStorage.setItem('botanica_users', JSON.stringify(users));
      }
      
      onUserUpdate(updatedUser);
      setSettingsMessage('Данные успешно обновлены');
      setTimeout(() => setSettingsMessage(''), 3000);
    }
  };

  const handleResetData = () => {
    localStorage.removeItem('botanica_products');
    localStorage.removeItem('botanica_categories');
    localStorage.removeItem('botanica_orders');
    localStorage.removeItem('botanica_chat');
    localStorage.removeItem('botanica_cart');
    
    setProducts([]);
    setCategories([]);
    setOrders([]);
    setMessages([]);
    
    setShowResetConfirm(false);
    setSettingsMessage('Все данные успешно сброшены!');
    setTimeout(() => setSettingsMessage(''), 3000);
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    const updated = orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
    setOrders(updated);
    localStorage.setItem('botanica_orders', JSON.stringify(updated));
  };

  const handleDeleteOrder = (orderId: string) => {
    const updated = orders.filter(o => o.id !== orderId);
    setOrders(updated);
    localStorage.setItem('botanica_orders', JSON.stringify(updated));
    setOrderToDelete(null);
  };

  const handleSendAdminReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminReply.trim() || !selectedChatOrderId) return;
    
    const order = orders.find(o => o.id === selectedChatOrderId);
    if (!order) return;

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      userId: order.userId,
      senderId: currentUser.username,
      senderName: currentUser.username,
      senderRole: 'admin',
      text: adminReply.trim(),
      timestamp: new Date().toISOString(),
      orderId: selectedChatOrderId
    };

    const storedMessages = JSON.parse(localStorage.getItem('botanica_chat') || '[]');
    const updated = [...storedMessages, newMsg];
    localStorage.setItem('botanica_chat', JSON.stringify(updated));
    setMessages(updated);
    setAdminReply('');
  };

  const inputClasses = "w-full px-4 py-2 bg-emerald-950/50 border border-emerald-800/50 text-white rounded-lg focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all placeholder:text-emerald-700/50";
  const selectClasses = "w-full px-4 py-2 bg-emerald-950/50 border border-emerald-800/50 text-white rounded-lg focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all [&>option]:bg-emerald-950 [&>option]:text-white";

  const unreadChatCount = messages.filter(m => m.senderRole === 'user' && !m.read).length;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 relative z-10"
    >
      <div className="flex items-center gap-4 border-b border-emerald-800/50 pb-2 overflow-x-auto custom-scrollbar whitespace-nowrap">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 font-medium transition-all ${activeTab === 'catalog' ? 'text-emerald-400 border-b-2 border-emerald-400 -mb-[9px] shadow-[0_2px_10px_rgba(16,185,129,0.2)]' : 'text-emerald-500/70 hover:text-emerald-300'}`}
        >
          <Package className="w-5 h-5" />
          Каталог
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 font-medium transition-all ${activeTab === 'orders' ? 'text-emerald-400 border-b-2 border-emerald-400 -mb-[9px] shadow-[0_2px_10px_rgba(16,185,129,0.2)]' : 'text-emerald-500/70 hover:text-emerald-300'}`}
        >
          <ShoppingBag className="w-5 h-5" />
          Заказы {orders.filter(o => o.status === 'new').length > 0 && <span className="bg-emerald-500 text-emerald-950 text-xs px-2 py-0.5 rounded-full">{orders.filter(o => o.status === 'new').length}</span>}
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 font-medium transition-all ${activeTab === 'settings' ? 'text-emerald-400 border-b-2 border-emerald-400 -mb-[9px] shadow-[0_2px_10px_rgba(16,185,129,0.2)]' : 'text-emerald-500/70 hover:text-emerald-300'}`}
        >
          <Settings className="w-5 h-5" />
          Настройки
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 font-medium transition-all ${activeTab === 'chat' ? 'text-emerald-400 border-b-2 border-emerald-400 -mb-[9px] shadow-[0_2px_10px_rgba(16,185,129,0.2)]' : 'text-emerald-500/70 hover:text-emerald-300'}`}
        >
          <MessageSquare className="w-5 h-5" />
          Связь с клиентами {unreadChatCount > 0 && <span className="bg-emerald-500 text-emerald-950 text-xs px-2 py-0.5 rounded-full">{unreadChatCount}</span>}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'settings' ? (
          <motion.div 
            key="settings"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-md bg-emerald-900/30 backdrop-blur-md p-8 rounded-3xl shadow-xl border border-emerald-500/20"
          >
            <h2 className="font-serif text-2xl text-emerald-50 mb-6 flex items-center gap-3">
              <div className="bg-emerald-500/20 p-2 rounded-xl border border-emerald-400/20">
                <Settings className="w-6 h-6 text-emerald-400" />
              </div>
              Настройки администратора
            </h2>
            <form onSubmit={handleUpdateSettings} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-emerald-200/70 mb-2">Новый логин</label>
                <input
                  type="text"
                  required
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  className={inputClasses}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-emerald-200/70 mb-2">Новый пароль</label>
                <input
                  type="text"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className={inputClasses}
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 px-4 mt-2 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-semibold rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]"
              >
                Сохранить изменения
              </button>
            </form>

            <div className="mt-8 pt-8 border-t border-emerald-800/50">
              <h3 className="font-serif text-xl text-red-400 mb-4 flex items-center gap-2">
                Опасная зона
              </h3>
              <p className="text-sm text-emerald-200/70 mb-4">
                Это действие навсегда удалит все товары, категории, заказы и истории чатов из базы данных магазина. Учетные записи пользователей будут сохранены.
              </p>
              {!showResetConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="w-full py-3 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold rounded-xl transition-all border border-red-500/30 hover:border-red-500/50 shadow-[0_0_20px_rgba(248,113,113,0.1)]"
                >
                  Очистить все данные магазина
                </button>
              ) : (
                <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/30">
                  <p className="text-red-400 font-medium mb-3 text-center">Вы уверены? Это действие необратимо.</p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowResetConfirm(false)}
                      className="flex-1 py-2 px-4 bg-emerald-900/50 hover:bg-emerald-800/50 text-emerald-100 font-semibold rounded-lg transition-all"
                    >
                      Отмена
                    </button>
                    <button
                      type="button"
                      onClick={handleResetData}
                      className="flex-1 py-2 px-4 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-all shadow-[0_0_15px_rgba(248,113,113,0.4)]"
                    >
                      Да, удалить все
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {settingsMessage && (
              <motion.p 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className={`text-sm mt-4 text-center font-medium ${settingsMessage.includes('успешно') ? 'text-emerald-400' : 'text-red-400'}`}
              >
                {settingsMessage}
              </motion.p>
            )}
          </motion.div>
        ) : activeTab === 'orders' ? (
          <motion.div 
            key="orders"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <h2 className="font-serif text-3xl text-emerald-50 mb-8 pb-4 border-b border-emerald-800/50">Заказы</h2>
            {orders.length === 0 ? (
              <div className="bg-emerald-900/20 backdrop-blur-sm p-12 rounded-3xl border border-emerald-800/30 text-center text-emerald-200/60 text-lg">
                Нет заказов.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {orders.map(order => (
                  <div key={order.id} className="bg-emerald-900/30 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-emerald-500/20 flex flex-col md:flex-row gap-6">
                    <div className="flex-grow space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-serif text-emerald-50">Заказ #{order.id.slice(-6)}</h3>
                          <p className="text-sm text-emerald-200/60">{new Date(order.createdAt).toLocaleString('ru-RU')}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button 
                            onClick={() => handleUpdateOrderStatus(order.id, 'new')}
                            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${order.status === 'new' ? 'bg-emerald-500 text-emerald-950 font-medium' : 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/50 hover:bg-emerald-900/50'}`}
                          >
                            Новый
                          </button>
                          <button 
                            onClick={() => handleUpdateOrderStatus(order.id, 'accepted')}
                            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${order.status === 'accepted' ? 'bg-blue-500 text-blue-950 font-medium' : 'bg-emerald-950/50 text-blue-400 border border-emerald-800/50 hover:bg-emerald-900/50'}`}
                          >
                            Ожидает оплаты
                          </button>
                          <button 
                            onClick={() => handleUpdateOrderStatus(order.id, 'in_progress')}
                            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${order.status === 'in_progress' ? 'bg-yellow-500 text-yellow-950 font-medium' : 'bg-emerald-950/50 text-yellow-500/70 border border-emerald-800/50 hover:bg-emerald-900/50'}`}
                          >
                            В работе (Оплачен)
                          </button>
                          <button 
                            onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${order.status === 'completed' ? 'bg-emerald-500 text-emerald-950 font-medium' : 'bg-emerald-950/50 text-emerald-400/70 border border-emerald-800/50 hover:bg-emerald-900/50'}`}
                          >
                            Завершен
                          </button>
                          {orderToDelete === order.id ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleDeleteOrder(order.id)}
                                className="px-3 py-1.5 rounded-lg text-sm transition-all bg-red-500 text-white font-medium hover:bg-red-600"
                              >
                                Точно удалить?
                              </button>
                              <button
                                onClick={() => setOrderToDelete(null)}
                                className="px-3 py-1.5 rounded-lg text-sm transition-all bg-emerald-900/50 text-emerald-100 font-medium hover:bg-emerald-800/50"
                              >
                                Отмена
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => setOrderToDelete(order.id)}
                              className={`px-3 py-1.5 rounded-lg text-sm transition-all hover:bg-red-500/20 text-emerald-500/50 hover:text-red-400 border border-transparent hover:border-red-500/30`}
                              title="Удалить заказ"
                            >
                              Удалить
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="bg-emerald-950/40 p-4 rounded-xl border border-emerald-800/50">
                        <h4 className="text-sm font-medium text-emerald-400 mb-2">Данные покупателя:</h4>
                        <p className="text-emerald-100">Имя: {order.customerName}</p>
                        <p className="text-emerald-100">Телефон: {order.customerPhone}</p>
                        <p className="text-emerald-100">Город: {order.cityType === 'omsk' ? 'Омск' : 'Другой город'}</p>
                        {order.cityType === 'other' && order.cdekAddress && <p className="text-emerald-100 mt-1 p-2 bg-emerald-900/40 rounded-lg text-sm border border-emerald-800/30">СДЭК: {order.cdekAddress}</p>}
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-emerald-400 mb-3">Состав заказа:</h4>
                        <div className="space-y-3">
                          {order.items.map((item, i) => (
                            <div key={i} className="flex gap-4 items-center bg-emerald-950/30 p-3 rounded-xl border border-emerald-800/30">
                              {item.product.imageUrl && (
                                <img src={item.product.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover" />
                              )}
                              <div className="flex-grow">
                                <p className="text-emerald-100 font-medium">{item.product.name}</p>
                                <p className="text-sm text-emerald-200/60">{item.quantity} шт. × {Number(item.product.price).toLocaleString('ru-RU')} ₽</p>
                              </div>
                              <p className="font-semibold text-emerald-400">{(item.quantity * Number(item.product.price)).toLocaleString('ru-RU')} ₽</p>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-emerald-800/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                          <button
                            onClick={() => { setSelectedChatOrderId(order.id); setActiveTab('chat'); }}
                            className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors text-sm font-medium bg-emerald-500/10 hover:bg-emerald-500/20 px-4 py-2 rounded-xl"
                          >
                            <MessageSquare className="w-4 h-4" />
                            Чат по заказу
                            {messages.some(m => m.orderId === order.id && m.senderRole === 'user' && !m.read) && (
                              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                            )}
                          </button>
                          <p className="text-lg text-emerald-200/70">Итого: <span className="text-2xl font-serif text-emerald-50 ml-2">{order.total.toLocaleString('ru-RU')} ₽</span></p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ) : activeTab === 'chat' ? (
          <motion.div 
            key="chat"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex flex-col md:flex-row gap-6 h-[70vh]"
          >
            <div className="w-full md:w-80 bg-emerald-900/30 backdrop-blur-md rounded-2xl shadow-xl border border-emerald-500/20 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-emerald-800/50 bg-emerald-950/50">
                <h3 className="font-serif text-xl text-emerald-50">Диалоги</h3>
              </div>
              <div className="flex-grow overflow-y-auto custom-scrollbar">
                {Array.from(new Set(messages.filter(m => m.orderId).map(m => m.orderId as string))).map((orderId) => {
                  const orderMessages = messages.filter(m => m.orderId === orderId);
                  const lastMessage = orderMessages[orderMessages.length - 1];
                  const customerName = orderMessages.find(m => m.senderRole === 'user')?.senderName || 'Клиент';
                  const hasUnread = orderMessages.some(m => m.senderRole === 'user' && !m.read);
                  
                  return (
                    <button
                      key={String(orderId)}
                      onClick={() => setSelectedChatOrderId(String(orderId))}
                      className={`w-full text-left p-4 border-b border-emerald-800/30 transition-all ${selectedChatOrderId === orderId ? 'bg-emerald-800/50' : 'hover:bg-emerald-900/50'}`}
                    >
                      <div className="flex justify-between items-baseline mb-1">
                        <span className={`font-medium ${hasUnread ? 'text-emerald-400' : 'text-emerald-100'}`}>
                          {customerName} (Заказ #{String(orderId).slice(-6)})
                          {hasUnread && <span className="ml-2 w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>}
                        </span>
                        <span className="text-xs text-emerald-500/70">{new Date(lastMessage.timestamp).toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      <p className={`text-sm truncate ${hasUnread ? 'text-emerald-200 font-medium' : 'text-emerald-200/60'}`}>{lastMessage.text}</p>
                    </button>
                  );
                })}
                {messages.length === 0 && (
                  <div className="p-8 text-center text-emerald-200/50 text-sm">
                    Нет активных диалогов
                  </div>
                )}
              </div>
            </div>

            <div className="flex-grow bg-emerald-900/30 backdrop-blur-md rounded-2xl shadow-xl border border-emerald-500/20 overflow-hidden flex flex-col">
              {selectedChatOrderId ? (
                <>
                  <div className="p-4 border-b border-emerald-800/50 bg-emerald-950/50">
                    <h3 className="font-serif text-xl text-emerald-50">
                      Чат по заказу #{selectedChatOrderId.slice(-6)}
                    </h3>
                  </div>
                  <div className="flex-grow p-4 overflow-y-auto space-y-4 custom-scrollbar">
                    {messages.filter(m => m.orderId === selectedChatOrderId).map(msg => (
                      <div key={msg.id} className={`flex flex-col ${msg.senderRole === 'admin' ? 'items-end' : 'items-start'}`}>
                        <span className="text-xs text-emerald-500/50 mb-1 px-1">
                          {msg.senderRole === 'admin' ? 'Вы (Админ)' : 'Клиент'} • {new Date(msg.timestamp).toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})}
                        </span>
                        <div className={`px-4 py-2 rounded-2xl max-w-[80%] ${
                          msg.senderRole === 'admin' 
                            ? 'bg-emerald-500 text-emerald-950 rounded-tr-sm' 
                            : 'bg-emerald-950/80 text-emerald-50 border border-emerald-800/50 rounded-tl-sm'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleSendAdminReply} className="p-4 bg-emerald-950/50 border-t border-emerald-800/50 flex gap-2">
                    <input
                      type="text"
                      value={adminReply}
                      onChange={e => setAdminReply(e.target.value)}
                      placeholder="Ответить клиенту..."
                      className="flex-grow px-4 py-2 bg-emerald-900/50 border border-emerald-800/50 text-white rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all placeholder:text-emerald-700/50"
                    />
                    <button
                      type="submit"
                      disabled={!adminReply.trim()}
                      className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Отправить
                    </button>
                  </form>
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-emerald-200/50 flex-col gap-4">
                  <MessageSquare className="w-16 h-16 opacity-20" />
                  <p>Выберите диалог для просмотра</p>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="catalog"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-1 space-y-6">
          
          {/* Category Management */}
          <div className="bg-emerald-900/30 backdrop-blur-md p-6 rounded-3xl shadow-xl border border-emerald-500/20">
            <h2 className="font-serif text-xl text-emerald-50 mb-5 flex items-center gap-3">
              <div className="bg-emerald-500/20 p-2 rounded-xl border border-emerald-400/20">
                <FolderPlus className="w-5 h-5 text-emerald-400" />
              </div>
              Управление каталогами
            </h2>
            
            <form onSubmit={handleAddCategory} className="mb-5 flex gap-3">
              <input
                type="text"
                required
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className={inputClasses}
                placeholder="Новый каталог (напр. Розы)"
              />
              <button type="submit" className="p-3 bg-emerald-500 text-emerald-950 rounded-xl hover:bg-emerald-400 transition-colors shadow-lg">
                <Plus className="w-5 h-5" />
              </button>
            </form>

            {categories.length > 0 && (
              <>
                <form onSubmit={handleAddSubcategory} className="mb-5 space-y-3 pt-5 border-t border-emerald-800/50">
                  <h3 className="text-sm font-medium text-emerald-400">Добавить подкатегорию</h3>
                  <select
                    required
                    value={selectedCategoryForSub}
                    onChange={(e) => setSelectedCategoryForSub(e.target.value)}
                    className={selectClasses}
                  >
                    <option value="">Выберите каталог...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      required
                      value={newSubcategoryName}
                      onChange={(e) => setNewSubcategoryName(e.target.value)}
                      className={inputClasses}
                      placeholder="Подкатегория (напр. Красные)"
                    />
                    <button type="submit" className="p-3 bg-emerald-500 text-emerald-950 rounded-xl hover:bg-emerald-400 transition-colors shadow-lg">
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </form>

                <form onSubmit={handleAddSort} className="mb-6 space-y-3 pt-5 border-t border-emerald-800/50">
                  <h3 className="text-sm font-medium text-emerald-400">Добавить сорт</h3>
                  <select
                    required
                    value={selectedCategoryForSort}
                    onChange={(e) => {
                      setSelectedCategoryForSort(e.target.value);
                      setSelectedSubcategoryForSort('');
                    }}
                    className={selectClasses}
                  >
                    <option value="">Выберите каталог...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  
                  {selectedCatForSort && selectedCatForSort.subcategories.length > 0 && (
                    <select
                      value={selectedSubcategoryForSort}
                      onChange={(e) => setSelectedSubcategoryForSort(e.target.value)}
                      className={selectClasses}
                    >
                      <option value="">Без подкатегории (добавить к каталогу)</option>
                      {selectedCatForSort.subcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  )}

                  <div className="flex gap-3">
                    <input
                      type="text"
                      required
                      value={newSortName}
                      onChange={(e) => setNewSortName(e.target.value)}
                      className={inputClasses}
                      placeholder="Название сорта"
                    />
                    <button type="submit" className="p-3 bg-emerald-500 text-emerald-950 rounded-xl hover:bg-emerald-400 transition-colors shadow-lg">
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </form>
              </>
            )}

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 mt-4 custom-scrollbar">
              {categories.map(cat => (
                <div key={cat.id} className="border border-emerald-800/50 rounded-xl p-4 bg-emerald-950/40">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium text-emerald-50">{cat.name}</span>
                    <button onClick={() => handleDeleteCategory(cat.id)} className="text-emerald-500/50 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {cat.sorts.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {cat.sorts.map(sort => (
                        <span key={sort.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-900/50 border border-emerald-700/50 text-emerald-200 text-xs rounded-full">
                          Сорт: {sort.name}
                          <button onClick={() => handleDeleteSort(cat.id, undefined, sort.id)} className="hover:text-red-400 ml-1 transition-colors">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {cat.subcategories.length > 0 && (
                    <div className="space-y-3 mt-4">
                      {cat.subcategories.map(sub => (
                        <div key={sub.id} className="pl-4 border-l-2 border-emerald-800/50">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-emerald-100">{sub.name}</span>
                            <button onClick={() => handleDeleteSubcategory(cat.id, sub.id)} className="text-emerald-500/50 hover:text-red-400 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {sub.sorts.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {sub.sorts.map(sort => (
                                <span key={sort.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-900/30 border border-emerald-800/50 text-emerald-300 text-xs rounded-full">
                                  {sort.name}
                                  <button onClick={() => handleDeleteSort(cat.id, sub.id, sort.id)} className="hover:text-red-400 ml-1 transition-colors">
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Product Addition */}
          <div className="bg-emerald-900/30 backdrop-blur-md p-6 rounded-3xl shadow-xl border border-emerald-500/20">
            <h2 className="font-serif text-xl text-emerald-50 mb-5 flex items-center gap-3">
              <div className="bg-emerald-500/20 p-2 rounded-xl border border-emerald-400/20">
                <Tag className="w-5 h-5 text-emerald-400" />
              </div>
              Добавить товар
            </h2>
            <form onSubmit={handleAddProduct} className="space-y-5">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-emerald-200/70 mb-2">Каталог</label>
                  <select
                    required
                    value={categoryId}
                    onChange={(e) => {
                      setCategoryId(e.target.value);
                      setSubcategoryId('');
                      setSortId('');
                    }}
                    className={selectClasses}
                  >
                    <option value="">Выберите каталог...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                
                {subcategoriesForSelected.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-emerald-200/70 mb-2">Подкатегория</label>
                    <select
                      value={subcategoryId}
                      onChange={(e) => {
                        setSubcategoryId(e.target.value);
                        setSortId('');
                      }}
                      className={selectClasses}
                    >
                      <option value="">Без подкатегории</option>
                      {subcategoriesForSelected.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                )}

                {availableSortsForProduct.length > 0 && (
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-emerald-200/70 mb-2">Сорт</label>
                    <select
                      value={sortId}
                      onChange={(e) => setSortId(e.target.value)}
                      className={selectClasses}
                    >
                      <option value="">Без сорта</option>
                      {availableSortsForProduct.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-emerald-200/70 mb-2">Название</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClasses}
                  placeholder="Букет роз"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-emerald-200/70 mb-2">Цена (₽)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className={inputClasses}
                    placeholder="1500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-emerald-200/70 mb-2">В наличии (шт)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className={inputClasses}
                    placeholder="Неограниченно"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-emerald-200/70 mb-2">Описание</label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className={inputClasses}
                  placeholder="Красивый букет..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-emerald-200/70 mb-2">Медиа (фото и видео)</label>
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  ref={fileInputRef}
                  onChange={handleMediaChange}
                  className="hidden"
                  id="media-upload"
                />
                
                {mediaUrls.length > 0 && (
                  <div className="flex flex-wrap gap-3 mb-4">
                    {mediaUrls.map((url, i) => (
                      <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden bg-emerald-950 border border-emerald-800/50">
                        {url.startsWith('data:video/') ? (
                          <video src={url} className="w-full h-full object-cover" />
                        ) : (
                          <img src={url} alt="Preview" className="w-full h-full object-cover" />
                        )}
                        <button 
                          type="button" 
                          onClick={() => removeMedia(i)}
                          className="absolute top-1.5 right-1.5 bg-emerald-950/80 backdrop-blur-sm rounded-full p-1.5 text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <label 
                  htmlFor="media-upload" 
                  className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-emerald-800/50 rounded-xl cursor-pointer hover:bg-emerald-900/30 hover:border-emerald-500/50 transition-colors"
                >
                  <div className="text-center">
                    <Upload className="mx-auto h-8 w-8 text-emerald-500/50 mb-3" />
                    <span className="text-sm text-emerald-200/60">Нажмите, чтобы загрузить фото или видео</span>
                  </div>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]"
              >
                <Plus className="w-5 h-5" />
                Добавить товар
              </button>
            </form>
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <h2 className="font-serif text-3xl text-emerald-50 mb-8 pb-4 border-b border-emerald-800/50">Список товаров</h2>
          {products.length === 0 ? (
            <div className="bg-emerald-900/20 backdrop-blur-sm p-12 rounded-3xl border border-emerald-800/30 text-center text-emerald-200/60 text-lg">
              Товары пока не добавлены.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {products.map(product => {
                const cat = categories.find(c => c.id === product.categoryId);
                const subcat = cat?.subcategories.find(s => s.id === product.subcategoryId);
                
                let sort;
                if (cat && product.sortId) {
                  if (subcat) {
                    sort = subcat.sorts.find(s => s.id === product.sortId);
                  } else {
                    sort = cat.sorts.find(s => s.id === product.sortId);
                  }
                }
                
                return (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key={product.id} 
                    className="bg-emerald-900/30 backdrop-blur-md p-5 rounded-2xl shadow-xl border border-emerald-500/20 flex flex-col gap-4 group hover:border-emerald-400/40 transition-all"
                  >
                    {product.mediaUrls && product.mediaUrls[0] && product.mediaUrls[0].startsWith('data:video/') ? (
                      <video src={product.mediaUrls[0]} className="w-full h-48 object-cover rounded-xl flex-shrink-0" />
                    ) : (
                      <img src={product.imageUrl || ''} alt={product.name} className="w-full h-48 object-cover rounded-xl flex-shrink-0" />
                    )}
                    <div className="flex-grow flex flex-col justify-between">
                      <div>
                        <h3 className="font-serif text-xl text-emerald-50 leading-tight mb-3">{product.name}</h3>
                        <div className="flex flex-wrap gap-2 text-xs text-emerald-400/80 mb-3">
                          {cat && <span className="bg-emerald-950/50 border border-emerald-800/50 px-2.5 py-1 rounded-full">{cat.name}</span>}
                          {subcat && <span className="bg-emerald-950/50 border border-emerald-800/50 px-2.5 py-1 rounded-full">{subcat.name}</span>}
                          {sort && <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full">Сорт: {sort.name}</span>}
                        </div>
                        <p className="text-emerald-100/60 text-sm line-clamp-2">{product.description}</p>
                      </div>
                      <div className="flex justify-between items-center mt-4 pt-4 border-t border-emerald-800/50">
                        <span className="text-emerald-400 font-semibold text-lg">{Number(product.price || 0).toLocaleString('ru-RU')} ₽</span>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 text-emerald-500/50 hover:text-red-400 transition-colors bg-emerald-950/50 hover:bg-emerald-900 rounded-xl outline-none"
                          title="Удалить"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
