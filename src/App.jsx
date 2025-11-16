import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  signInWithCustomToken
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  onSnapshot,
  deleteDoc,
  getDocs,
  setDoc,
  writeBatch
} from 'firebase/firestore';
import { 
  Beer, Wine, Coffee, Droplets, Plus, Minus, ShoppingCart, List, 
  Search, LogOut, ExternalLink, UtensilsCrossed, Lock, 
  ArrowRight, Check, Truck, Banknote, 
  AlertTriangle, Loader2, Copy, Zap, X, Bell,
  Filter, RefreshCw, Trash2, ChefHat, Edit3, Clock, Receipt,
  Store, Shield, ShieldCheck, Database
} from 'lucide-react';

// --- 1. CONFIGURATION ---
// 🔴 PASTE YOUR KEYS HERE! 🔴
// REPLACE THIS LINE with the 'firebaseConfig' object from your screenshot
const firebaseConfig = {
  apiKey: "AIzaSyABu_1mIuwaMx__J2Tjhv_qkv412msIO1k",
  authDomain: "daawat-stock-system.firebaseapp.com",
  projectId: "daawat-stock-system",
  storageBucket: "daawat-stock-system.firebasestorage.app",
  messagingSenderId: "148538242580",
  appId: "1:148538242580:web:b5bdb750a3f2fcfc789901"
};
// 🔴 🔴 🔴 🔴 🔴 🔴 🔴 🔴 🔴

let app, auth, db;
let configError = null;

try {
    if (firebaseConfig && firebaseConfig.apiKey) {
        app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        auth = getAuth(app);
        db = getFirestore(app);
    } else {
        configError = "Firebase configuration is missing.";
    }
} catch (e) {
    console.error("Init Error:", e);
    configError = e.message;
}

const appId = 'daawat-live-master-final'; 

// --- THEME ---
const THEME = {
    bg: "bg-[#050B20]",
    surface: "bg-[#0B1229]",
    border: "border-[#D48C4F]/20",
    accent: "text-[#D48C4F]",
    accentBg: "bg-[#D48C4F]",
    goldGradient: "bg-gradient-to-r from-[#D48C4F] to-[#A6662E]",
    glass: "backdrop-blur-xl bg-[#050B20]/90",
};

const LOGO_URL = "logo.png"; 

const BRANCHES = [
  { id: 'eriksberg', name: 'Eriksberg', password: 'eriksberg1' },
  { id: 'masthugget', name: 'Masthugget', password: 'masthugget1' },
  { id: 'sisjon', name: 'Sisjön', password: 'sisjon1' }
];

const SUPPLIERS = ['Carlsberg', 'Menigo', 'Martin & Servera', 'Svensk Cater'];
const SUPPLIER_URLS = {
    'Carlsberg': 'https://se.carlsberg.com/produkter/',
    'Menigo': 'https://www.menigo.se/snabbor',
    'Svensk Cater': 'https://www.svenskcater.se/e-handel',
    'Martin & Servera': 'https://www.martinservera.se/',
    'Other': 'https://google.com'
};
const OWNER_CREDENTIALS = { id: 'owner', name: 'Owner HQ', password: 'admin123' };

// --- STANDARD MENU ---
const DEFAULT_MENU = [
    { id: 'mango', name: 'Mango Lassi', category: 'soft', threshold: 10, target: 30, price: 45, supplier: 'Svensk Cater' }, 
    { id: 'cobra66', name: 'Cobra Premium 66cl', category: 'alcohol', threshold: 12, target: 36, price: 75, supplier: 'Carlsberg' },
    { id: 'cobra33', name: 'Cobra Premium 33cl', category: 'alcohol', threshold: 24, target: 72, price: 45, supplier: 'Carlsberg' },
    { id: 'king66', name: 'Kingfisher 66cl', category: 'alcohol', threshold: 12, target: 48, price: 75, supplier: 'Carlsberg' },
    { id: 'king33', name: 'Kingfisher 33cl', category: 'alcohol', threshold: 24, target: 72, price: 45, supplier: 'Carlsberg' },
    { id: 'eriksberg', name: 'Eriksberg 50cl', category: 'alcohol', threshold: 24, target: 48, price: 65, supplier: 'Carlsberg' },
    { id: 'mariestads', name: 'Mariestads Export', category: 'alcohol', threshold: 24, target: 48, price: 65, supplier: 'Carlsberg' },
    { id: 'pepsi', name: 'Pepsi', category: 'soft', threshold: 24, target: 48, price: 35, supplier: 'Carlsberg' },
    { id: 'pepsimax', name: 'Pepsi Max', category: 'soft', threshold: 24, target: 48, price: 35, supplier: 'Carlsberg' },
    { id: 'zingo', name: 'Zingo', category: 'soft', threshold: 12, target: 24, price: 35, supplier: 'Carlsberg' },
    { id: '7up', name: '7up Zero', category: 'soft', threshold: 12, target: 24, price: 35, supplier: 'Carlsberg' },
    { id: 'hred', name: 'House Red (Daawat)', category: 'wine', threshold: 6, target: 12, price: 85, supplier: 'Menigo' },
    { id: 'hwhite', name: 'House White', category: 'wine', threshold: 6, target: 12, price: 85, supplier: 'Menigo' },
];

// --- 2. MAIN APP ---
export default function App() {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [modal, setModal] = useState(null);

  const addToast = (msg, type = 'success') => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, msg, type }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  const confirmAction = (title, msg, label, action) => {
      setModal({ title, msg, label, action: async () => { await action(); setModal(null); } });
  };

  useEffect(() => {
    if(configError || !auth) return;
    const initAuth = async () => {
        try {
            if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) await signInWithCustomToken(auth, __initial_auth_token);
            else await signInAnonymously(auth);
        } catch (e) { console.error(e); }
    };
    initAuth();
    onAuthStateChanged(auth, (u) => { if (u) setUser(u); });
    const saved = localStorage.getItem('daawat_session');
    if (saved) setSession(JSON.parse(saved));
  }, []);

  const handleLogin = (bid) => {
    const s = bid === 'owner' ? { role: 'owner', branchId: 'owner' } : { role: 'branch', branchId: bid };
    setSession(s);
    localStorage.setItem('daawat_session', JSON.stringify(s));
    addToast(`Welcome ${bid === 'owner' ? 'Owner' : bid}`, 'success');
  };

  const handleLogout = () => { setSession(null); localStorage.removeItem('daawat_session'); };

  if (configError) return <ErrorScreen msg={configError} />;
  if (!user) return <LoadingScreen />;
  
  return (
      <>
        <div className="fixed top-4 left-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
            {toasts.map(t => (
                <div key={t.id} className={`bg-[#0B1229] border border-[#D48C4F]/40 text-white px-4 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-5 backdrop-blur-md`}>
                    {t.type === 'success' ? <Check className="w-4 h-4 text-[#D48C4F]" /> : <AlertTriangle className="w-4 h-4 text-red-400" />}
                    <span className="text-sm font-medium">{t.msg}</span>
                </div>
            ))}
        </div>

        {modal && (
            <div className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-md flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
                <div className={`w-full max-w-sm rounded-3xl border ${THEME.border} ${THEME.surface} p-6 shadow-2xl animate-in slide-in-from-bottom-10`}>
                    <h3 className={`text-xl font-serif font-bold ${THEME.accent} mb-2`}>{modal.title}</h3>
                    <p className="text-slate-400 mb-6 text-sm">{modal.msg}</p>
                    <div className="flex gap-3">
                        <button onClick={() => setModal(null)} className="flex-1 py-3 rounded-full border border-slate-700 text-slate-400 font-bold hover:bg-slate-800 transition-colors">Cancel</button>
                        <button onClick={modal.action} className={`flex-1 py-3 rounded-full font-bold text-white shadow-lg ${THEME.goldGradient}`}>{modal.label}</button>
                    </div>
                </div>
            </div>
        )}

        {!session ? (
            <LoginScreen onLogin={handleLogin} />
        ) : session.role === 'owner' ? (
            <OwnerDashboard user={user} onLogout={handleLogout} toast={addToast} confirm={confirmAction} />
        ) : (
            <BranchDashboard user={user} branchId={session.branchId} onLogout={handleLogout} toast={addToast} confirm={confirmAction} />
        )}
      </>
  );
}

// --- 3. SCREENS ---

function LoginScreen({ onLogin }) {
    const [branch, setBranch] = useState(BRANCHES[0].id);
    const [pass, setPass] = useState('');
    const [error, setError] = useState('');

    const submit = (e) => {
        e.preventDefault();
        setError('');
        const target = branch === 'owner' ? OWNER_CREDENTIALS : BRANCHES.find(b => b.id === branch);
        if (target && pass === target.password) onLogin(branch);
        else setError('Invalid Password');
    };

    return (
        <div className={`min-h-screen ${THEME.bg} flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans`}>
            <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#D48C4F]/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
            
            <div className="w-full max-w-sm relative z-10">
                <div className="flex flex-col items-center mb-12">
                    <div className="w-32 h-32 relative mb-6">
                        <img src={LOGO_URL} onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} className="w-full h-full object-contain drop-shadow-2xl" alt="Daawat Logo" />
                        <div className="hidden w-full h-full rounded-full border-2 border-[#D48C4F] flex items-center justify-center bg-[#0B1229] shadow-lg shadow-[#D48C4F]/20"><ChefHat className="w-16 h-16 text-[#D48C4F]" /></div>
                    </div>
                    <h1 className={`text-5xl font-serif font-bold ${THEME.accent} tracking-wide drop-shadow-lg`}>दावत</h1>
                    <p className="text-slate-400 text-xs uppercase tracking-[0.4em] font-medium mt-2">Stock System</p>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-[#D48C4F] ml-2">Select Role</label>
                        <div className="grid grid-cols-3 gap-2">
                            {BRANCHES.map(b => (
                                <button type="button" key={b.id} onClick={() => setBranch(b.id)} className={`py-3 rounded-xl text-xs font-bold transition-all border ${branch === b.id ? 'bg-[#D48C4F] border-[#D48C4F] text-[#050B20]' : 'bg-transparent border-slate-700 text-slate-400'}`}>{b.name}</button>
                            ))}
                        </div>
                        <button type="button" onClick={() => setBranch('owner')} className={`w-full py-2 text-xs uppercase tracking-widest font-bold ${branch === 'owner' ? 'text-[#D48C4F]' : 'text-slate-600'}`}>Owner Access</button>
                    </div>

                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-[#D48C4F] transition-colors" />
                        <input type="password" value={pass} onChange={e => setPass(e.target.value)} className={`w-full pl-12 pr-4 py-4 ${THEME.surface} border ${THEME.border} rounded-full text-white focus:border-[#D48C4F] outline-none placeholder-slate-600`} placeholder="Enter Access PIN" />
                    </div>
                    {error && <div className="text-red-400 text-sm text-center font-bold py-2">{error}</div>}
                    <button type="submit" className="w-full py-4 rounded-full border border-[#D48C4F] text-[#D48C4F] font-bold hover:bg-[#D48C4F] hover:text-[#050B20] transition-all uppercase tracking-widest text-sm shadow-lg">Enter System</button>
                </form>
            </div>
        </div>
    );
}

function BranchDashboard({ user, branchId, onLogout, toast, confirm }) {
    const branch = BRANCHES.find(b => b.id === branchId);
    const [masterInv, setMasterInv] = useState([]);
    const [stockCounts, setStockCounts] = useState({});
    const [tab, setTab] = useState('inventory');

    // 1. Fetch Global Master List
    useEffect(() => {
        const unsub = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'master_inventory'), 
            (s) => setMasterInv(s.docs.map(d => ({ id: d.id, ...d.data() }))));
        return () => unsub();
    }, []);

    // 2. Fetch Local Stock Counts
    useEffect(() => {
        const unsub = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', `stock_${branchId}`), 
            (s) => {
                const counts = {};
                s.docs.forEach(d => counts[d.id] = d.data().qty);
                setStockCounts(counts);
            });
        return () => unsub();
    }, [branchId]);

    // 3. Merge
    const inv = useMemo(() => masterInv.map(i => ({ ...i, quantity: stockCounts[i.id] || 0 })), [masterInv, stockCounts]);
    const itemsToOrder = useMemo(() => inv.filter(i => i.quantity <= i.threshold), [inv]);
    
    // 4. Update Stock (Write to local Branch DB)
    const updateStock = async (id, curr, change) => {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', `stock_${branchId}`, id), { 
            qty: Math.max(0, curr + change), updatedAt: Date.now() 
        }, { merge: true });
    };

    const submitOrder = (items) => {
        const total = items.reduce((acc, i) => acc + (i.qty * (i.price || 0)), 0);
        confirm("Confirm Order?", `Requesting ${items.length} items. Value: ${total} kr`, "Send Request", async () => {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), {
                branchId: branch.id, branchName: branch.name, items, status: 'pending', createdAt: Date.now(), totalEstCost: total
            });
            toast(`Order sent!`); setTab('inventory');
        });
    };

    return (
        <div className={`min-h-screen ${THEME.bg} font-sans pb-32`}>
            <header className={`sticky top-0 z-30 ${THEME.glass} border-b ${THEME.border} pt-safe-top`}>
                <div className="px-5 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <img src={LOGO_URL} className="w-10 h-10 object-contain" onError={(e) => e.target.style.display='none'} />
                        <div>
                            <p className={`text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400 mb-0.5`}>{branch.name}</p>
                            <h1 className={`text-xl font-serif font-bold ${THEME.accent} leading-none`}>Daawat</h1>
                        </div>
                    </div>
                </div>
                <div className="px-4 pb-2">
                     <div className={`flex p-1 ${THEME.surface} rounded-full border ${THEME.border}`}>
                        <TabButton active={tab === 'inventory'} onClick={() => setTab('inventory')} label="Stock List" icon={List} />
                        <TabButton active={tab === 'order'} onClick={() => setTab('order')} label="Order" icon={Receipt} badge={itemsToOrder.length} />
                     </div>
                </div>
            </header>

            <main className="px-4 py-6">
                {tab === 'inventory' ? (
                    <>
                     {masterInv.length === 0 && (
                        <div className={`flex flex-col items-center justify-center py-16 text-center space-y-4 border border-dashed ${THEME.border} rounded-3xl bg-white/5 mb-4`}>
                            <ShieldCheck className="w-12 h-12 text-slate-500" />
                            <p className="text-slate-400 text-sm px-10">Inventory is empty. Contact Owner to Initialize.</p>
                        </div>
                     )}
                     <InventoryView inventory={inv} onUpdate={updateStock} isOwner={false} />
                    </>
                ) : (
                     <OrderView items={itemsToOrder} onSubmit={submitOrder} />
                )}
            </main>

            <div className="fixed bottom-6 left-0 right-0 flex justify-center z-0 pointer-events-none">
                <button onClick={onLogout} className={`pointer-events-auto flex items-center gap-2 px-6 py-2 rounded-full ${THEME.glass} border ${THEME.border} text-xs font-bold text-slate-500 hover:text-red-400 transition-colors shadow-2xl`}>
                    <LogOut className="w-3 h-3" /> Log Out
                </button>
            </div>
        </div>
    );
}

function OwnerDashboard({ user, onLogout, toast, confirm }) {
    const [orders, setOrders] = useState([]);
    const [view, setView] = useState('orders'); 
    const [masterInv, setMasterInv] = useState([]);
    const [editItem, setEditItem] = useState(null);
    const [showAdd, setShowAdd] = useState(false);
    const [loadingMenu, setLoadingMenu] = useState(false);

    // Auto-seeder
    useEffect(() => {
        if(!user) return;
        const checkAndSeed = async () => {
             const snapshot = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'master_inventory'));
             if (snapshot.empty) {
                 toast("Auto-initializing Standard Menu...", "success");
                 loadMenu(false); // Auto-load without confirm
             }
        };
        checkAndSeed();
    }, [user]);

    useEffect(() => {
        const unsub = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), 
            (s) => setOrders(s.docs.map(d => ({id:d.id, ...d.data()})).sort((a,b) => b.createdAt - a.createdAt)));
        return () => unsub();
    }, []);

    useEffect(() => {
        const unsub = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'master_inventory'), 
            (s) => setMasterInv(s.docs.map(d => ({ id: d.id, ...d.data() }))));
        return () => unsub();
    }, []);

    const handleSaveItem = async (item, id = null) => {
        if (id) {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'master_inventory', id), item);
            toast("Item updated"); setEditItem(null);
        } else {
            // Use ID from item if provided, otherwise generate
            const docId = item.id || addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'master_inventory')).id;
            await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'master_inventory', docId), { ...item, createdAt: Date.now() });
            toast("Item added"); setShowAdd(false);
        }
    };

    const deleteItem = (id) => {
        confirm("Delete Item?", "This removes it from ALL branches.", "Delete", async () => {
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'master_inventory', id));
            toast("Item deleted"); setEditItem(null);
        });
    }

    const approve = (oid) => {
        confirm("Archive Order?", "Mark as processed?", "Archive", async () => {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'orders', oid), { status: 'approved' });
            toast("Archived");
        });
    };

    const copyOrder = (items, name) => {
        const text = items.map(i => `${i.qty}x ${i.name}`).join('\n');
        const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select(); 
        try { document.execCommand('copy'); toast("Copied!", "success"); setTimeout(() => window.open(SUPPLIER_URLS[name] || SUPPLIER_URLS['Other'], '_blank'), 500); } 
        catch (e) { toast("Copy failed", "error"); }
        document.body.removeChild(ta);
    };

    const loadMenu = async (showConfirm = true) => {
        const action = async () => {
            setLoadingMenu(true);
            try {
                const batch = writeBatch(db);
                DEFAULT_MENU.forEach(item => {
                    const ref = doc(db, 'artifacts', appId, 'public', 'data', 'master_inventory', item.id);
                    batch.set(ref, { ...item, createdAt: Date.now() }, { merge: true });
                });
                await batch.commit();
                toast(`Master Menu Initialized`, "success");
            } catch (e) {
                toast("Error: " + e.message, "error");
            } finally {
                setLoadingMenu(false);
            }
        };

        if (showConfirm) {
            confirm(`Hard Reset Menu?`, "This will force-reload all standard items.", "Reset", action);
        } else {
            action();
        }
    };

    return (
        <div className={`min-h-screen ${THEME.bg} text-slate-200 pb-20 font-sans`}>
            <div className={`sticky top-0 z-30 ${THEME.glass} border-b ${THEME.border} p-4`}>
                <div className="flex justify-between items-center mb-4">
                    <div><h1 className={`font-serif text-xl font-bold ${THEME.accent}`}>Owner HQ</h1></div>
                    <button onClick={onLogout} className="bg-white/5 p-2 rounded-full hover:bg-white/10"><LogOut className="w-4 h-4 text-slate-500" /></button>
                </div>
                <div className={`flex p-1 ${THEME.surface} rounded-full border ${THEME.border}`}>
                    <TabButton active={view === 'orders'} onClick={() => setView('orders')} label="Incoming Orders" icon={Truck} badge={orders.filter(o => o.status === 'pending').length} />
                    <TabButton active={view === 'manage'} onClick={() => setView('manage')} label="Master Catalog" icon={Store} />
                </div>
            </div>

            <main className="p-4 space-y-6">
                {view === 'orders' ? (
                    <>
                         {orders.filter(o => o.status === 'pending').length === 0 && (
                             <div className="text-center py-10 text-slate-500">No pending orders.</div>
                         )}
                         {orders.map(order => (
                            <div key={order.id} className={`${THEME.surface} rounded-3xl overflow-hidden border transition-all ${order.status === 'pending' ? 'border-[#D48C4F]/50 shadow-lg' : 'border-slate-800 opacity-60 hidden'}`}>
                                {order.status === 'pending' && (
                                <>
                                <div className="p-5 bg-white/5 flex justify-between">
                                    <div>
                                        <h3 className="font-serif text-lg text-white">{order.branchName}</h3>
                                        <p className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <span className={`font-bold ${THEME.accent}`}>{order.totalEstCost?.toLocaleString()} kr</span>
                                </div>
                                <div className="p-4 space-y-3">
                                    {['Carlsberg', 'Menigo', 'Svensk Cater', 'Other'].map(sup => {
                                        const items = order.items.filter(i => sup==='Other' ? !['Carlsberg', 'Menigo', 'Svensk Cater'].includes(i.supplier) : i.supplier === sup);
                                        if(!items.length) return null;
                                        return (
                                            <div key={sup} className={`flex justify-between items-center p-3 bg-[#050B20] rounded-xl border ${THEME.border}`}>
                                                <div className="flex items-center gap-3">
                                                    <Truck className="w-4 h-4 text-slate-500" />
                                                    <div><p className="text-sm font-bold text-slate-300">{sup}</p><p className="text-xs text-slate-600">{items.length} items</p></div>
                                                </div>
                                                <button onClick={() => copyOrder(items, sup)} className={`px-3 py-1.5 ${THEME.surface} border border-slate-700 text-xs font-bold rounded-lg hover:${THEME.accent} hover:border-[#D48C4F]`}>Copy & Go</button>
                                            </div>
                                        )
                                    })}
                                </div>
                                <div className="p-4"><button onClick={() => approve(order.id)} className="w-full py-3 border border-green-900 text-green-500 rounded-full font-bold text-sm hover:bg-green-900/20">Mark Processed</button></div>
                                </>
                                )}
                            </div>
                        ))}
                    </>
                ) : (
                    <>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-sm font-serif text-white ml-2">Global Items ({masterInv.length})</h2>
                            <div className="flex gap-2">
                                <button onClick={() => loadMenu(true)} disabled={loadingMenu} className="px-4 py-2 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-[#D48C4F] gap-2 font-bold text-xs">
                                    {loadingMenu ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                                    Initialize Menu
                                </button>
                                <button onClick={() => setShowAdd(true)} className={`w-8 h-8 rounded-full bg-[#D48C4F] flex items-center justify-center text-[#050B20] hover:scale-105 transition-transform`}><Plus className="w-5 h-5" /></button>
                            </div>
                        </div>
                        <InventoryView 
                            inventory={masterInv.map(i => ({...i, quantity: '-'}))} 
                            onUpdate={() => {}} 
                            onEdit={setEditItem}
                            isOwner={true}
                        />
                    </>
                )}
            </main>

            {(showAdd || editItem) && (
                <ItemModal 
                    item={editItem} 
                    onClose={() => { setShowAdd(false); setEditItem(null); }} 
                    onSave={handleSaveItem} 
                    onDelete={deleteItem}
                />
            )}
        </div>
    );
}

// --- SUB-COMPONENTS ---

function InventoryView({ inventory, onUpdate, onEdit, isOwner }) {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const CATS = [{ id: 'all', label: 'All' }, { id: 'alcohol', label: 'Bar' }, { id: 'soft', label: 'Soft' }, { id: 'wine', label: 'Wine' }];
    const filtered = inventory
        .filter(i => filter === 'all' || i.category === filter)
        .filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
        .sort((a,b) => a.name.localeCompare(b.name));

    return (
        <div className="space-y-6">
            <div className={`sticky top-0 z-10 space-y-3 pb-2 ${THEME.bg}`}>
                 <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                    <input type="text" placeholder="Search stock..." className={`w-full pl-12 pr-4 py-3 ${THEME.surface} border ${THEME.border} rounded-full text-slate-200 focus:border-[#D48C4F] outline-none`} value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {CATS.map(c => (
                        <button key={c.id} onClick={() => setFilter(c.id)} className={`px-5 py-2 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${filter === c.id ? `bg-[#D48C4F] text-[#050B20] border-[#D48C4F]` : `bg-transparent border-slate-800 text-slate-500`}`}>{c.label}</button>
                    ))}
                </div>
            </div>
            <div className="grid gap-3">
                {filtered.map(item => (
                    <div key={item.id} className={`group relative flex items-center justify-between p-4 rounded-2xl ${THEME.surface} border ${item.quantity <= item.threshold && !isOwner ? 'border-red-900/50' : THEME.border}`}>
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div onClick={() => isOwner && onEdit(item)} className={`w-12 h-12 rounded-full border flex items-center justify-center ${item.quantity <= item.threshold && !isOwner ? 'border-red-500/30 text-red-500' : 'border-[#D48C4F]/30 text-[#D48C4F]'} bg-[#050B20] ${isOwner ? 'cursor-pointer' : ''}`}>
                                {item.category === 'wine' ? <Wine className="w-5 h-5" /> : item.category === 'alcohol' ? <Beer className="w-5 h-5" /> : <Droplets className="w-5 h-5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-slate-200 text-lg truncate pr-2">{item.name}</h4>
                                    {isOwner && <button onClick={() => onEdit(item)} className="text-slate-600 hover:text-[#D48C4F]"><Edit3 className="w-4 h-4" /></button>}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] text-slate-500 font-mono">{!isOwner ? `${item.quantity}/${item.target}` : `${item.price} kr`}</span>
                                </div>
                            </div>
                        </div>
                        {!isOwner && (
                            <div className={`flex items-center gap-2 bg-[#050B20] p-1 rounded-full border ${THEME.border} ml-2`}>
                                <button onClick={() => onUpdate(item.id, item.quantity, -1)} disabled={item.quantity<=0} className="w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:bg-white/10 active:scale-90 transition-transform"><Minus className="w-5 h-5" /></button>
                                <span className={`w-8 text-center font-bold text-lg ${item.quantity <= item.threshold ? 'text-red-500' : 'text-white'}`}>{item.quantity}</span>
                                <button onClick={() => onUpdate(item.id, item.quantity, 1)} className="w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:bg-white/10 active:scale-90 transition-transform"><Plus className="w-5 h-5" /></button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

function OrderView({ items, onSubmit }) {
    const [qty, setQty] = useState({});
    useEffect(() => { const init = {}; items.forEach(i => init[i.id] = Math.max(0, (i.target || i.threshold * 2) - i.quantity)); setQty(init); }, [items]);
    const handleSubmit = () => { const order = items.map(i => ({ ...i, qty: qty[i.id] })).filter(i => i.qty > 0); if(order.length) onSubmit(order); };
    const total = items.reduce((acc, i) => acc + ((qty[i.id] || 0) * (i.price || 0)), 0);
    if(items.length === 0) return <div className="flex flex-col items-center justify-center h-[50vh] text-slate-600 text-center"><Check className="w-16 h-16 mb-4 text-emerald-900" /><h3 className="text-xl font-serif text-slate-500">Stock is Perfect</h3></div>;
    return (
        <div className="space-y-4 pb-20">
            <div className={`p-5 rounded-2xl border border-[#D48C4F] flex justify-between items-center shadow-lg shadow-[#D48C4F]/10 bg-[#D48C4F]/10`}>
                <div><p className="text-[10px] font-black uppercase tracking-widest text-[#D48C4F]">Order Value</p><p className="text-3xl font-serif font-bold text-white">{total.toLocaleString()} kr</p></div>
                <button onClick={handleSubmit} className={`bg-[#D48C4F] text-[#050B20] px-6 py-3 rounded-full font-bold flex items-center gap-2 shadow-xl active:scale-95 transition-transform`}>Send <ArrowRight className="w-4 h-4" /></button>
            </div>
            <div className="space-y-2">
                {items.map(item => (
                    <div key={item.id} className={`${THEME.surface} p-4 rounded-2xl border ${THEME.border} flex items-center justify-between`}>
                        <div><p className="font-bold text-slate-200">{item.name}</p><p className="text-xs text-slate-500">{item.price} kr • Stock: <span className="text-red-500">{item.quantity}</span></p></div>
                        <div className="flex items-center gap-2">
                             <button onClick={() => setQty({...qty, [item.id]: Math.max(0, item.target - item.quantity)})} className="w-10 h-10 rounded-full border border-[#D48C4F]/30 flex items-center justify-center text-[#D48C4F] hover:bg-[#D48C4F] hover:text-[#050B20] transition-colors"><Zap className="w-5 h-5" /></button>
                             <input type="number" className={`w-16 py-2 bg-[#050B20] border ${THEME.border} rounded-xl text-center font-bold text-white outline-none focus:border-[#D48C4F]`} value={qty[item.id] || 0} onChange={e => setQty({...qty, [item.id]: parseInt(e.target.value)})} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ItemModal({ item, onClose, onSave, onDelete }) {
    const [form, setForm] = useState(item || { name: '', category: 'alcohol', threshold: 10, target: 24, price: 0, supplier: 'Carlsberg' });
    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-end sm:items-center justify-center z-[80] p-4 animate-in fade-in duration-200">
            <div className={`w-full max-w-md rounded-3xl border ${THEME.border} ${THEME.surface} p-6 shadow-2xl slide-in-from-bottom-10`}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-serif font-bold text-white">{item ? 'Edit Item' : 'Add Item'}</h3>
                    <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-slate-400"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-4">
                    <input placeholder="Item Name" className={`w-full p-4 bg-[#050B20] border ${THEME.border} rounded-2xl text-white outline-none focus:border-[#D48C4F]`} value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                    <div className="grid grid-cols-2 gap-4">
                        <select className={`p-4 bg-[#050B20] border ${THEME.border} rounded-2xl text-slate-300 outline-none`} value={form.category} onChange={e => setForm({...form, category: e.target.value})}><option value="alcohol">Alcohol</option><option value="wine">Wine</option><option value="soft">Soft Drink</option><option value="coffee">Coffee</option></select>
                        <select className={`p-4 bg-[#050B20] border ${THEME.border} rounded-2xl text-slate-300 outline-none`} value={form.supplier} onChange={e => setForm({...form, supplier: e.target.value})}>{SUPPLIERS.map(s=><option key={s} value={s}>{s}</option>)}</select>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div className={`bg-[#050B20] p-2 rounded-2xl border ${THEME.border} text-center`}><label className="text-[9px] uppercase text-slate-500 font-bold">Min</label><input className="w-full bg-transparent text-center text-white font-bold outline-none" value={form.threshold} onChange={e => setForm({...form, threshold: parseInt(e.target.value)})} /></div>
                        <div className={`bg-[#050B20] p-2 rounded-2xl border ${THEME.border} text-center`}><label className="text-[9px] uppercase text-slate-500 font-bold">Target</label><input className="w-full bg-transparent text-center text-white font-bold outline-none" value={form.target} onChange={e => setForm({...form, target: parseInt(e.target.value)})} /></div>
                        <div className={`bg-[#050B20] p-2 rounded-2xl border ${THEME.border} text-center`}><label className="text-[9px] uppercase text-slate-500 font-bold">Price</label><input className="w-full bg-transparent text-center text-white font-bold outline-none" value={form.price} onChange={e => setForm({...form, price: parseInt(e.target.value)})} /></div>
                    </div>
                    <div className="flex gap-3 mt-4">
                         {item && (
                            <button onClick={() => onDelete(item.id)} className="p-4 rounded-2xl border border-red-900/50 text-red-500 hover:bg-red-900/20"><Trash2 className="w-5 h-5" /></button>
                         )}
                         <button onClick={() => onSave(form, item?.id)} className={`flex-1 py-4 text-[#050B20] font-bold rounded-2xl shadow-lg bg-[#D48C4F]`}>{item ? 'Save Changes' : 'Add to Stock'}</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function TabButton({ active, onClick, label, icon: Icon, badge }) {
    return (
        <button onClick={onClick} className={`flex-1 py-3 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2 ${active ? 'bg-[#D48C4F] text-[#050B20] shadow-lg' : 'text-slate-500'}`}>
            <Icon className={`w-5 h-5 ${active ? 'text-[#050B20]' : ''}`} />
            {label}
            {badge > 0 && <span className="bg-red-500 text-white px-1.5 rounded-full text-[10px]">{badge}</span>}
        </button>
    );
}

function LoadingScreen() { return (<div className={`min-h-screen ${THEME.bg} flex items-center justify-center`}><Loader2 className={`w-12 h-12 ${THEME.accent} animate-spin`} /></div>); }