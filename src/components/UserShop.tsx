import React, { useState, useEffect } from 'react';
import { Product, Category, CartItem, User, Order, OrderStatus, ChatMessage } from '../types';
import { ChevronRight, ShoppingCart, Plus, Minus, X, CheckCircle, ShoppingBag, Package, MessageSquare, Star, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

export function UserShop({ currentUser }: { currentUser: User }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);
  const [selectedSortId, setSelectedSortId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'catalog' | 'orders' | 'chat'>(() => {
    return (sessionStorage.getItem('botanica_userTab') as 'catalog' | 'orders' | 'chat') || 'catalog';
  });
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [lastOrderTotal, setLastOrderTotal] = useState(0);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(() => {
    return sessionStorage.getItem('botanica_userSelectedOrder') || null;
  });

  useEffect(() => {
    sessionStorage.setItem('botanica_userTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (selectedOrderId) {
      sessionStorage.setItem('botanica_userSelectedOrder', selectedOrderId);
    } else {
      sessionStorage.removeItem('botanica_userSelectedOrder');
    }
  }, [selectedOrderId]);

  const [cityType, setCityType] = useState<'omsk' | 'other'>('omsk');
  const [cdekAddress, setCdekAddress] = useState('');

  useEffect(() => {
    if (activeTab === 'chat' && selectedOrderId) {
      const storedMessages = JSON.parse(localStorage.getItem('botanica_chat') || '[]');
      let changed = false;
      const updatedMessages = storedMessages.map((m: ChatMessage) => {
        if (m.userId === currentUser.username && m.senderRole === 'admin' && !m.read && m.orderId === selectedOrderId) {
          changed = true;
          return { ...m, read: true };
        }
        return m;
      });
      if (changed) {
        localStorage.setItem('botanica_chat', JSON.stringify(updatedMessages));
        setMessages(updatedMessages.filter((m: ChatMessage) => m.userId === currentUser.username));
      }
    }
  }, [activeTab, currentUser.username, selectedOrderId]);

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

    const storedCart = JSON.parse(localStorage.getItem('botanica_cart') || '[]');
    setCart(storedCart);
    
    const storedOrders = JSON.parse(localStorage.getItem('botanica_orders') || '[]');
    setMyOrders(storedOrders.filter((o: Order) => o.userId === currentUser.username));

    const storedMessages = JSON.parse(localStorage.getItem('botanica_chat') || '[]');
    setMessages(storedMessages.filter((m: ChatMessage) => m.userId === currentUser.username));
  }, [currentUser.username]);

  useEffect(() => {
    localStorage.setItem('botanica_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (product.stock !== undefined && existing.quantity >= product.stock) {
          alert('Недостаточно товара в наличии');
          return prev;
        }
        return prev.map(item => 
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      if (product.stock !== undefined && product.stock <= 0) {
        alert('Товара нет в наличии');
        return prev;
      }
      return [...prev, { product, quantity: 1 }];
    });
    setOrderSuccess(false);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          let newQ = item.quantity + delta;
          if (delta > 0 && item.product.stock !== undefined && newQ > item.product.stock) {
            newQ = item.product.stock;
          }
          newQ = Math.max(0, newQ);
          return { ...item, quantity: newQ };
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newOrder: Order = {
      id: Date.now().toString(),
      items: [...cart],
      total: cartTotal,
      customerName,
      customerPhone,
      cityType,
      cdekAddress: cityType === 'other' ? cdekAddress : undefined,
      status: 'new',
      createdAt: new Date().toISOString(),
      userId: currentUser.username
    };
    
    const storedOrders = JSON.parse(localStorage.getItem('botanica_orders') || '[]');
    const updatedOrders = [newOrder, ...storedOrders];
    localStorage.setItem('botanica_orders', JSON.stringify(updatedOrders));
    setMyOrders(updatedOrders.filter((o: Order) => o.userId === currentUser.username));

    const storedProducts = JSON.parse(localStorage.getItem('botanica_products') || '[]');
    const updatedProducts = storedProducts.map((p: Product) => {
      const cartItem = cart.find(item => item.product.id === p.id);
      if (cartItem && p.stock !== undefined) {
        return { ...p, stock: Math.max(0, p.stock - cartItem.quantity) };
      }
      return p;
    });
    localStorage.setItem('botanica_products', JSON.stringify(updatedProducts));
    setProducts(updatedProducts);

    setLastOrderTotal(cartTotal);
    setSelectedOrderId(newOrder.id);
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setCdekAddress('');
    setCityType('omsk');
    setOrderSuccess(true);

    // Fire confetti
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#34d399', '#fcd34d', '#ffffff']
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + (Number(item.product.price) || 0) * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const unreadChatCount = messages.filter(m => m.senderRole === 'admin' && !m.read).length;

  const filteredProducts = products.filter(p => {
    if (selectedSubcategoryId && p.subcategoryId !== selectedSubcategoryId) return false;
    if (selectedSortId && p.sortId !== selectedSortId) return false;
    return true;
  });

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  const getPageTitle = () => {
    if (!selectedCategory) return 'Все товары';
    let title = selectedCategory.name;
    
    let currentSub;
    if (selectedSubcategoryId) {
       currentSub = selectedCategory.subcategories.find(s => s.id === selectedSubcategoryId);
       if (currentSub) title += ` — ${currentSub.name}`;
    }

    if (selectedSortId) {
       let sort = selectedCategory.sorts.find(s => s.id === selectedSortId);
       if (!sort && currentSub) {
          sort = currentSub.sorts.find(s => s.id === selectedSortId);
       }
       if (sort) title += ` (Сорт: ${sort.name})`;
    }
    return title;
  };

  const handleSelectCategory = (catId: string | null) => {
    setSelectedCategoryId(catId);
    setSelectedSubcategoryId(null);
    setSelectedSortId(null);
  };

  const handleSelectSubcategory = (subId: string | null) => {
    setSelectedSubcategoryId(subId);
    setSelectedSortId(null);
  };

  const handleSelectSort = (sortId: string) => {
    setSelectedSortId(sortId);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedOrderId) return;

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      userId: currentUser.username,
      senderId: currentUser.username,
      senderName: currentUser.username,
      senderRole: 'user',
      text: newMessage.trim(),
      timestamp: new Date().toISOString(),
      orderId: selectedOrderId
    };

    const storedMessages = JSON.parse(localStorage.getItem('botanica_chat') || '[]');
    const updated = [...storedMessages, newMsg];
    localStorage.setItem('botanica_chat', JSON.stringify(updated));
    setMessages(updated.filter((m: ChatMessage) => m.userId === currentUser.username));
    setNewMessage('');
  };

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case 'new': return 'В обработке';
      case 'accepted': return 'Ожидает оплаты / Выполнение';
      case 'in_progress': return 'Выполняется (Оплачен)';
      case 'completed': return 'Выполнен';
      default: return status;
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 relative z-10">
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
          Мои заказы
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 font-medium transition-all ${activeTab === 'chat' ? 'text-emerald-400 border-b-2 border-emerald-400 -mb-[9px] shadow-[0_2px_10px_rgba(16,185,129,0.2)]' : 'text-emerald-500/70 hover:text-emerald-300'}`}
        >
          <MessageSquare className="w-5 h-5" />
          Связь с магазином {unreadChatCount > 0 && <span className="bg-emerald-500 text-emerald-950 text-xs px-2 py-0.5 rounded-full">{unreadChatCount}</span>}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'catalog' ? (
          <motion.div
            key="catalog"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col md:flex-row gap-8"
          >
            {/* Sidebar for Hierarchy */}
            <div className="w-full md:w-72 flex-shrink-0">
              <div className="flex items-center justify-between md:hidden mb-4">
                <h2 className="font-serif text-2xl text-emerald-100">Каталоги</h2>
                <button
                  onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
                  className="px-3 py-1.5 bg-emerald-900/50 text-emerald-100 text-sm font-medium rounded-xl border border-emerald-500/30 flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  {isMobileFiltersOpen ? 'Скрыть' : 'Фильтры'}
                </button>
              </div>

              <h2 className="font-serif text-2xl text-emerald-100 mb-6 hidden md:block">Каталоги</h2>
              
              <div className={`space-y-1 bg-emerald-900/30 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-emerald-500/20 ${isMobileFiltersOpen ? 'block' : 'hidden md:block'}`}>
          <button
            onClick={() => handleSelectCategory(null)}
            className={`w-full text-left px-3 py-2.5 rounded-xl transition-all font-medium ${!selectedCategoryId ? 'bg-emerald-500 text-emerald-950 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'hover:bg-emerald-800/40 text-emerald-100'}`}
          >
            Все товары
          </button>
          
          {categories.map(cat => (
            <div key={cat.id} className="pt-2">
              <button
                onClick={() => handleSelectCategory(cat.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all font-medium ${selectedCategoryId === cat.id ? 'bg-emerald-800/60 text-emerald-50 border border-emerald-500/30 shadow-inner' : 'hover:bg-emerald-800/40 text-emerald-100/80'}`}
              >
                {cat.name}
                <ChevronRight className={`w-4 h-4 transition-transform ${selectedCategoryId === cat.id ? 'text-emerald-400 rotate-90' : 'text-emerald-500/50'}`} />
              </button>
              
              <AnimatePresence>
                {selectedCategoryId === cat.id && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden ml-3 mt-1 space-y-1 border-l-2 border-emerald-800/50 pl-3 py-1"
                  >
                     {/* Sorts under Category */}
                     {cat.sorts.map(sort => (
                       <button
                         key={sort.id}
                         onClick={() => handleSelectSort(sort.id)}
                         className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${selectedSortId === sort.id && !selectedSubcategoryId ? 'bg-emerald-500 text-emerald-950 font-medium' : 'hover:bg-emerald-800/40 text-emerald-200/70'}`}
                       >
                         <span className={`w-1.5 h-1.5 rounded-full ${selectedSortId === sort.id && !selectedSubcategoryId ? 'bg-emerald-950' : 'bg-emerald-500'}`}></span>
                         Сорт: {sort.name}
                       </button>
                     ))}
  
                     {/* Subcategories */}
                     {cat.subcategories.map(sub => (
                       <div key={sub.id} className="mt-2">
                         <button
                           onClick={() => handleSelectSubcategory(sub.id)}
                           className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all font-medium ${selectedSubcategoryId === sub.id ? 'bg-emerald-800/60 text-emerald-100 border border-emerald-500/20' : 'hover:bg-emerald-800/40 text-emerald-200/80'}`}
                         >
                           {sub.name}
                         </button>
  
                         {/* Sorts under Subcategory */}
                         <AnimatePresence>
                           {selectedSubcategoryId === sub.id && sub.sorts.length > 0 && (
                             <motion.div 
                               initial={{ opacity: 0, height: 0 }}
                               animate={{ opacity: 1, height: 'auto' }}
                               exit={{ opacity: 0, height: 0 }}
                               className="overflow-hidden ml-2 mt-1 space-y-1 border-l-2 border-emerald-800/50 pl-2"
                             >
                               {sub.sorts.map(sort => (
                                 <button
                                   key={sort.id}
                                   onClick={() => handleSelectSort(sort.id)}
                                   className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-2 ${selectedSortId === sort.id ? 'bg-emerald-500 text-emerald-950 font-medium' : 'hover:bg-emerald-800/40 text-emerald-300/70'}`}
                                 >
                                   <span className={`w-1.5 h-1.5 rounded-full ${selectedSortId === sort.id ? 'bg-emerald-950' : 'bg-emerald-500'}`}></span>
                                   {sort.name}
                                 </button>
                               ))}
                             </motion.div>
                           )}
                         </AnimatePresence>
                       </div>
                     ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
      
      {/* Products Grid */}
      <div className="flex-grow">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 mb-8 pb-4 border-b border-emerald-800/50"
        >
          <h1 className="font-serif text-3xl text-emerald-50 flex items-baseline gap-3">
            {getPageTitle()}
            <span className="text-lg text-emerald-500/70 font-sans">({filteredProducts.length})</span>
          </h1>
          <button 
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 rounded-xl transition-all shadow-lg font-medium self-start sm:self-auto"
          >
            <ShoppingBag className="w-5 h-5" />
            <span>Корзина {cartCount > 0 && `(${cartCount})`}</span>
          </button>
        </motion.div>
        
        {filteredProducts.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-emerald-900/20 backdrop-blur-sm p-12 rounded-3xl border border-emerald-800/30 text-center"
          >
            <p className="text-emerald-200/60 text-lg">В данной категории товаров пока нет.</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {filteredProducts.map((product, index) => {
                const cat = categories.find(c => c.id === product.categoryId);
                const subcat = cat?.subcategories.find(s => s.id === product.subcategoryId);
                let sort;
                if (cat && product.sortId) {
                  if (subcat) sort = subcat.sorts.find(s => s.id === product.sortId);
                  else sort = cat.sorts.find(s => s.id === product.sortId);
                }

                return (
                  <motion.div 
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="bg-emerald-900/30 backdrop-blur-md rounded-2xl shadow-xl border border-emerald-500/20 flex flex-col overflow-hidden hover:border-emerald-400/40 hover:shadow-[0_8px_30px_rgba(16,185,129,0.15)] transition-all group"
                  >
                  <div className="relative aspect-square overflow-hidden bg-emerald-950 group">
                    <div 
                      className="flex w-full h-full overflow-x-auto snap-x snap-mandatory" 
                      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                      {(product.mediaUrls?.length ? product.mediaUrls : (product.imageUrl ? [product.imageUrl] : [])).map((url, idx) => (
                        <div key={idx} className="w-full h-full flex-shrink-0 snap-start relative">
                          {url?.startsWith('data:video/') ? (
                            <video src={url} controls className="w-full h-full object-cover" />
                          ) : (
                            <img 
                              src={url} 
                              alt={`${product.name} - ${idx + 1}`}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                        </div>
                      ))}
                    </div>
                    
                    {sort && (
                      <div className="absolute top-3 left-3 pointer-events-none z-10">
                        <span className="bg-emerald-950/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium text-emerald-200 border border-emerald-500/30 shadow-lg">
                          {sort.name}
                        </span>
                      </div>
                    )}
                    
                    {(product.mediaUrls?.length || 1) > 1 && (
                      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 pointer-events-none z-10">
                        {(product.mediaUrls || []).map((_, i) => (
                          <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/80 shadow-sm" />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="p-5 flex flex-col flex-grow relative">
                    <div className="flex flex-wrap gap-1.5 text-xs text-emerald-400/80 mb-3">
                      {cat && <span>{cat.name}</span>}
                      {subcat && <span>• {subcat.name}</span>}
                    </div>
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <h3 className="font-serif text-xl text-emerald-50 leading-tight group-hover:text-emerald-300 transition-colors">{product.name}</h3>
                    </div>
                    <p className="text-emerald-100/60 text-sm leading-relaxed mb-6 flex-grow line-clamp-2">
                      {product.description}
                    </p>
                    <div className="mt-auto pt-4 border-t border-emerald-800/50 flex flex-col gap-2">
                      {product.stock !== undefined && (
                        <p className="text-xs text-emerald-300/70">В наличии: {product.stock} шт.</p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-emerald-400 text-xl">{Number(product.price || 0).toLocaleString('ru-RU')} ₽</span>
                        <button 
                          onClick={() => addToCart(product)}
                          disabled={product.stock !== undefined && product.stock <= 0}
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-md ${product.stock !== undefined && product.stock <= 0 ? 'bg-emerald-900 text-emerald-500/50 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-400 text-emerald-950 hover:scale-110 active:scale-95 shadow-emerald-500/20'}`}
                          title={product.stock !== undefined && product.stock <= 0 ? "Нет в наличии" : "Добавить в корзину"}
                        >
                           <ShoppingCart className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            </AnimatePresence>
          </div>
        )}
      </div>
      </motion.div>
        ) : activeTab === 'orders' ? (
          <motion.div
            key="orders"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-grow space-y-6"
          >
            <h2 className="font-serif text-3xl text-emerald-50 mb-8 pb-4 border-b border-emerald-800/50">Мои заказы</h2>
            {myOrders.length === 0 ? (
              <div className="bg-emerald-900/20 backdrop-blur-sm p-12 rounded-3xl border border-emerald-800/30 text-center text-emerald-200/60 text-lg">
                У вас пока нет заказов.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {myOrders.map(order => (
                  <div key={order.id} className="bg-emerald-900/30 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-emerald-500/20 flex flex-col md:flex-row gap-6">
                    <div className="flex-grow space-y-4">
                      <div className="flex justify-between items-start border-b border-emerald-800/50 pb-4">
                        <div>
                          <h3 className="text-xl font-serif text-emerald-50">Заказ #{order.id.slice(-6)}</h3>
                          <p className="text-sm text-emerald-200/60">{new Date(order.createdAt).toLocaleString('ru-RU')}</p>
                        </div>
                        <div className={`px-4 py-2 rounded-xl text-sm font-medium border ${
                          order.status === 'new' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                          order.status === 'accepted' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                          order.status === 'in_progress' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' :
                          'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                        }`}>
                          {getStatusText(order.status)}
                        </div>
                      </div>
                      
                      {order.status === 'accepted' && (
                        <div className="bg-emerald-950/40 p-4 rounded-xl border border-blue-500/30 text-emerald-100/90 text-sm space-y-2 relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/50"></div>
                          <p className="font-medium text-emerald-50 text-base mb-1">
                            {order.cityType === 'omsk' ? 'Оплата и доставка по Омску' : 'Оплата и доставка в другой город'}
                          </p>
                          <p>Заказ принят! Администратор договорился с вами в чате.</p>
                          <p>
                            Пожалуйста, переведите <strong>{order.total.toLocaleString('ru-RU')} ₽</strong> по следующим реквизитам:
                            <br/>
                            <span className="inline-block mt-2 font-mono text-emerald-300 bg-emerald-950 px-3 py-1.5 rounded-lg border border-emerald-800/50">
                              Сбербанк / Т-Банк: +7 (900) 123-45-67
                            </span>
                          </p>
                          <p className="text-emerald-300/70 text-xs mt-2">После оплаты напишите об этом в чат, и администратор переведет заказ в работу.</p>
                        </div>
                      )}

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
                        <div className="mt-4 pt-4 border-t border-emerald-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <button
                            onClick={() => { setSelectedOrderId(order.id); setActiveTab('chat'); }}
                            className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors text-sm font-medium"
                          >
                            <MessageSquare className="w-4 h-4" />
                            Написать администратору
                            {messages.some(m => m.orderId === order.id && m.senderRole === 'admin' && !m.read) && (
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
        ) : (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col h-[60vh] bg-emerald-900/30 backdrop-blur-md rounded-2xl shadow-xl border border-emerald-500/20 overflow-hidden"
          >
            <div className="p-4 border-b border-emerald-800/50 bg-emerald-950/50">
              <h2 className="font-serif text-xl text-emerald-50">
                {selectedOrderId ? `Чат по заказу #${selectedOrderId.slice(-6)}` : 'Связь с магазином'}
              </h2>
              <p className="text-sm text-emerald-200/60">
                {selectedOrderId ? 'Договор о встрече/доставке и оплате' : 'Выберите заказ в разделе "Мои заказы" для связи с администратором'}
              </p>
            </div>
            
            <div className="flex-grow p-4 overflow-y-auto space-y-4 custom-scrollbar">
              {!selectedOrderId ? (
                <div className="h-full flex items-center justify-center text-emerald-200/60">
                  Выберите заказ в разделе "Мои заказы", чтобы начать чат.
                </div>
              ) : messages.filter(m => m.orderId === selectedOrderId).length === 0 ? (
                <div className="h-full flex items-center justify-center text-emerald-200/60">
                  Напишите ваше первое сообщение...
                </div>
              ) : (
                messages.filter(m => m.orderId === selectedOrderId).map(msg => (
                  <div key={msg.id} className={`flex flex-col ${msg.senderRole === 'user' ? 'items-end' : 'items-start'}`}>
                    <span className="text-xs text-emerald-500/50 mb-1 px-1">
                      {msg.senderRole === 'admin' ? 'Администратор' : 'Вы'} • {new Date(msg.timestamp).toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})}
                    </span>
                    <div className={`px-4 py-2 rounded-2xl max-w-[80%] ${
                      msg.senderRole === 'user' 
                        ? 'bg-emerald-500 text-emerald-950 rounded-tr-sm' 
                        : 'bg-emerald-950/80 text-emerald-50 border border-emerald-800/50 rounded-tl-sm'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <form onSubmit={handleSendMessage} className="p-4 bg-emerald-950/50 border-t border-emerald-800/50 flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                disabled={!selectedOrderId || myOrders.find(o => o.id === selectedOrderId)?.status === 'completed'}
                placeholder={myOrders.find(o => o.id === selectedOrderId)?.status === 'completed' ? "Чат закрыт (заказ выполнен)" : "Введите сообщение..."}
                className="flex-grow px-4 py-2 bg-emerald-900/50 border border-emerald-800/50 text-white rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all placeholder:text-emerald-700/50 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || !selectedOrderId || myOrders.find(o => o.id === selectedOrderId)?.status === 'completed'}
                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Отправить
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Modal */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-emerald-950/80 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full sm:w-96 bg-emerald-900 border-l border-emerald-500/20 z-50 flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-emerald-800/50 flex items-center justify-between bg-emerald-950/50">
                <h2 className="font-serif text-2xl text-emerald-50 flex items-center gap-2">
                  <ShoppingBag className="w-6 h-6 text-emerald-400" />
                  Корзина
                </h2>
                <button onClick={() => setIsCartOpen(false)} className="text-emerald-500/50 hover:text-emerald-200 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex-grow overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {orderSuccess ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", damping: 15 }}
                    className="flex flex-col items-center justify-center h-full text-center space-y-6"
                  >
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1, rotate: 360 }}
                      transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.1 }}
                      className="w-24 h-24 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.5)]"
                    >
                      <CheckCircle className="w-12 h-12 text-emerald-950" />
                    </motion.div>
                    
                    <div>
                      <motion.h3 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-3xl font-serif text-emerald-50 mb-2"
                      >
                        Заказ принят!
                      </motion.h3>
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-emerald-200/80 mb-2"
                      >
                        Ваш заказ передан администратору на подтверждение.
                      </motion.p>
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.45 }}
                        className="text-sm text-emerald-300/70"
                      >
                        Мы свяжемся с вами в чате для уточнения деталей оплаты и доставки.
                      </motion.p>
                    </div>

                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 }}
                      className="w-full bg-emerald-950/60 p-5 rounded-2xl border border-emerald-500/30 shadow-lg"
                    >
                      <p className="text-sm text-emerald-400 mb-1">Итого к оплате:</p>
                      <p className="text-3xl font-serif text-emerald-50 mb-4">{lastOrderTotal.toLocaleString('ru-RU')} ₽</p>
                      <div className="bg-emerald-900/50 p-3 rounded-xl border border-emerald-800/50">
                        <p className="text-xs text-emerald-300 uppercase tracking-wider mb-1 font-semibold">Реквизиты для оплаты</p>
                        <p className="text-emerald-100 text-sm">(Реквизиты будут предоставлены администратором)</p>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.7 }}
                      className="flex flex-col items-center gap-3 w-full"
                    >
                      <p className="text-emerald-300/70 text-sm flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        Пожалуйста, оставьте отзыв
                        <Star className="w-4 h-4 text-yellow-500" />
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
                        <button 
                          onClick={() => { setIsCartOpen(false); setOrderSuccess(false); setActiveTab('orders'); }}
                          className="flex-1 px-4 py-3 bg-emerald-900/50 hover:bg-emerald-800/50 text-emerald-100 font-medium rounded-xl transition-all border border-emerald-700/50"
                        >
                          К заказам
                        </button>
                        <button 
                          onClick={() => { setIsCartOpen(false); setOrderSuccess(false); setActiveTab('chat'); }}
                          className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-emerald-950 font-bold rounded-xl transition-all shadow-lg hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] flex justify-center items-center gap-2"
                        >
                          <MessageSquare className="w-5 h-5" />
                          Чат с админом
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                ) : cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-emerald-500/50 space-y-4">
                    <ShoppingBag className="w-16 h-16 opacity-50" />
                    <p className="text-lg">Ваша корзина пуста</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {cart.map((item) => (
                      <motion.div 
                        key={item.product.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex gap-4 p-4 bg-emerald-950/40 rounded-2xl border border-emerald-800/30"
                      >
                        <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-emerald-900/50">
                          {item.product.mediaUrls && item.product.mediaUrls[0]?.startsWith('data:video/') ? (
                             <video src={item.product.mediaUrls[0]} className="w-full h-full object-cover" />
                          ) : (
                             <img src={item.product.imageUrl || (item.product.mediaUrls?.[0])} alt={item.product.name} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="flex flex-col flex-grow">
                          <h4 className="text-emerald-100 font-medium leading-tight mb-1">{item.product.name}</h4>
                          <span className="text-emerald-400 font-semibold mb-3">{Number(item.product.price || 0).toLocaleString('ru-RU')} ₽</span>
                          <div className="flex items-center gap-3 mt-auto">
                            <button 
                              onClick={() => updateQuantity(item.product.id, -1)}
                              className="w-8 h-8 rounded-lg bg-emerald-900 flex items-center justify-center text-emerald-400 hover:bg-emerald-800 transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="text-emerald-50 w-4 text-center font-medium">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.product.id, 1)}
                              className="w-8 h-8 rounded-lg bg-emerald-900 flex items-center justify-center text-emerald-400 hover:bg-emerald-800 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
              
              {!orderSuccess && cart.length > 0 && (
                <div className="p-6 bg-emerald-950/80 border-t border-emerald-800/50 backdrop-blur-md">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-emerald-200/70 text-lg">Итого:</span>
                    <span className="text-2xl font-serif text-emerald-50">{cartTotal.toLocaleString('ru-RU')} ₽</span>
                  </div>
                  <form onSubmit={handleCheckout} className="space-y-4">
                    <input 
                      type="text" 
                      required
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      placeholder="Имя получателя" 
                      className="w-full px-4 py-3 bg-emerald-900/50 border border-emerald-800/50 text-white rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all placeholder:text-emerald-700/50"
                    />
                    <input 
                      type="tel" 
                      required
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      placeholder="Номер телефона" 
                      className="w-full px-4 py-3 bg-emerald-900/50 border border-emerald-800/50 text-white rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all placeholder:text-emerald-700/50"
                    />
                    <select
                      value={cityType}
                      onChange={(e) => setCityType(e.target.value as 'omsk' | 'other')}
                      className="w-full px-4 py-3 bg-emerald-900/50 border border-emerald-800/50 text-white rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all [&>option]:bg-emerald-950 [&>option]:text-white"
                    >
                      <option value="omsk">Город Омск</option>
                      <option value="other">Другой город (СДЭК)</option>
                    </select>
                    {cityType === 'other' && (
                      <input 
                        type="text" 
                        required
                        value={cdekAddress}
                        onChange={e => setCdekAddress(e.target.value)}
                        placeholder="Ваш город и адрес ближайшего СДЭК" 
                        className="w-full px-4 py-3 bg-emerald-900/50 border border-emerald-800/50 text-white rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all placeholder:text-emerald-700/50"
                      />
                    )}
                    <button 
                      type="submit"
                      className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 rounded-xl font-bold text-lg transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] mt-2"
                    >
                      Оформить заказ
                    </button>
                  </form>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
