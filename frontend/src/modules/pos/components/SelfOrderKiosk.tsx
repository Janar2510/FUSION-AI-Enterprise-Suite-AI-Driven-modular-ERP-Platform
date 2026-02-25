import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ArrowLeft, Star, CreditCard, User, Sparkles } from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { useEcommerceStore } from '../../ecommerce/stores/ecommerceStore';
import { usePosStore } from '../stores/posStore';

interface KioskProps {
    onExit: () => void;
    terminalName: string;
}

export const SelfOrderKiosk: React.FC<KioskProps> = ({ onExit, terminalName }) => {
    const { products, fetchProducts, addToCart, cart, checkout, fetchCart, initSession } = useEcommerceStore();
    const { currentLoyaltyCard, fetchLoyaltyCard } = usePosStore();

    const [view, setView] = useState<'welcome' | 'menu' | 'cart' | 'checkout' | 'success'>('welcome');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [loyaltyId, setLoyaltyId] = useState('');

    useEffect(() => {
        initSession();
        fetchProducts();
        fetchCart();
    }, []);

    const categories = ['All', ...Array.from(new Set(products.map(p => p.category || 'General')))];
    const filteredProducts = selectedCategory === 'All'
        ? products
        : products.filter(p => p.category === selectedCategory);

    const handleAddToCart = (productId: number) => {
        addToCart(productId, 1);
    };

    const handleCheckout = async () => {
        await checkout('kiosk@internal.ai', 'Kiosk Guest');
        setView('success');
    };

    const cartTotal = cart?.total_amount || 0;
    const cartCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

    const renderWelcome = () => (
        <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-[#05050a] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-900/10 via-transparent to-secondary-900/10" />
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10"
            >
                <div className="w-32 h-32 bg-white/5 border border-white/10 rounded-none flex items-center justify-center mx-auto mb-10 group">
                    <Sparkles className="w-16 h-16 text-primary-400 group-hover:scale-110 transition-transform" />
                </div>
                <h1 className="text-7xl font-black text-white mb-4 tracking-tighter uppercase italic">
                    Fusion <span className="text-primary-500">GO</span>
                </h1>
                <p className="text-xl text-white/40 mb-12 font-mono tracking-widest uppercase">Self-Service Terminal: {terminalName}</p>
                <button
                    onClick={() => setView('menu')}
                    className="bg-white text-black text-2xl font-black px-16 py-8 rounded-none hover:bg-primary-500 hover:text-white transition-all uppercase tracking-[0.2em] animate-pulse-slow"
                >
                    Tap to Start
                </button>
            </motion.div>
        </div>
    );

    const renderMenu = () => (
        <div className="h-full flex flex-col bg-[#05050a]">
            {/* Header */}
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/2">
                <div className="flex items-center gap-6">
                    <button onClick={onExit} className="p-4 border border-white/10 text-white/40 hover:text-white transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">Kiosk Terminal</h2>
                        <div className="flex items-center gap-2 text-[10px] text-primary-400 font-bold tracking-[0.2em] uppercase">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            Live Synchronization Active
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <div className="text-[10px] text-white/30 uppercase font-black mb-1">Running Balance</div>
                        <div className="text-3xl font-black text-white font-mono">${cartTotal.toFixed(2)}</div>
                    </div>
                    <button
                        onClick={() => setView('cart')}
                        className="relative p-6 bg-primary-500 text-white hover:bg-primary-600 transition-all border border-primary-400/20"
                    >
                        <ShoppingBag className="w-8 h-8" />
                        {cartCount > 0 && (
                            <span className="absolute top-2 right-2 bg-white text-black text-xs font-black min-w-[24px] h-6 px-1 flex items-center justify-center">
                                {cartCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Categories */}
                <div className="w-48 border-r border-white/5 bg-black/40 overflow-y-auto p-4 space-y-4">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`w-full py-6 px-4 text-left text-xs font-black uppercase tracking-widest transition-all border ${selectedCategory === cat
                                ? 'bg-white text-black border-white'
                                : 'text-white/40 border-white/5 hover:border-white/20'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Products Grid */}
                <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.map(product => (
                        <GlassCard
                            key={product.id}
                            className="rounded-none border-white/5 bg-white/2 hover:border-primary-500/30 transition-all flex flex-col p-6"
                            onClick={() => handleAddToCart(product.id)}
                            hover={true}
                        >
                            <div className="flex-1 flex flex-col">
                                <div className="text-[10px] font-bold text-primary-400 uppercase tracking-widest mb-2">{product.category}</div>
                                <h3 className="text-lg font-black text-white mb-2 leading-tight uppercase">{product.name}</h3>
                                <div className="mt-auto flex justify-between items-end">
                                    <div className="text-2xl font-black text-white font-mono">${product.price?.toFixed(2)}</div>
                                    <div className="p-3 bg-white/5 border border-white/10">
                                        <PlusIcon className="w-5 h-5 text-white" />
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            </div>

            {/* Loyalty Bar */}
            <div className="p-6 bg-white/2 border-t border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-4 flex-1 max-w-md">
                    <User className="w-6 h-6 text-white/30" />
                    <input
                        type="text"
                        placeholder="Scan Loyalty Card or Member ID..."
                        className="bg-transparent border-b border-white/10 py-2 w-full text-white focus:outline-none focus:border-primary-500 transition-all text-sm font-mono"
                        value={loyaltyId}
                        onChange={e => setLoyaltyId(e.target.value)}
                    />
                    <button
                        onClick={() => fetchLoyaltyCard(parseInt(loyaltyId))}
                        className="p-2 bg-white/5 border border-white/10 text-white/50 hover:text-white"
                    >
                        Apply
                    </button>
                </div>
                {currentLoyaltyCard && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-primary-400 font-black text-sm uppercase flex items-center gap-3"
                    >
                        <Sparkles className="w-5 h-5" />
                        {currentLoyaltyCard.points} Points Available
                    </motion.div>
                )}
            </div>
        </div>
    );

    const renderCart = () => (
        <div className="h-full flex flex-col bg-[#05050a] p-12">
            <div className="flex justify-between items-center mb-12">
                <button onClick={() => setView('menu')} className="flex items-center gap-4 text-white/40 hover:text-white font-black uppercase tracking-widest">
                    <ArrowLeft className="w-8 h-8" />
                    Review Assignment
                </button>
                <div className="text-5xl font-black text-white italic tracking-tighter uppercase underline decoration-primary-500 underline-offset-8">
                    My Inventory
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pr-6">
                {cart?.items?.map(item => (
                    <div key={item.id} className="p-8 bg-white/2 border border-white/5 flex justify-between items-center">
                        <div className="flex gap-8 items-center">
                            <div className="w-20 h-20 bg-white/5 border border-white/10 flex items-center justify-center">
                                <Star className="w-10 h-10 text-white/10" />
                            </div>
                            <div>
                                <h4 className="text-2xl font-black text-white uppercase tracking-tighter">{item.product_name}</h4>
                                <p className="text-white/30 uppercase font-mono text-sm">Unit Cost: ${item.unit_price?.toFixed(2)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-12 text-right">
                            <div className="flex items-center border border-white/10 bg-black/40">
                                <span className="px-6 py-3 text-sm text-white/30 border-r border-white/10 font-black">X</span>
                                <span className="px-6 py-3 text-2xl text-white font-black font-mono">{item.quantity}</span>
                            </div>
                            <div className="text-3xl font-black text-white font-mono">${item.line_total?.toFixed(2)}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="pt-12 border-t border-white/10 mt-12 grid grid-cols-2 gap-12">
                <div className="space-y-4">
                    <div className="flex justify-between text-xl font-black text-white/40 uppercase tracking-widest">
                        <span>Terminal Subtotal</span>
                        <span className="text-white">${cart?.subtotal?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-black text-white/40 uppercase tracking-widest">
                        <span>Provisioning Tax</span>
                        <span className="text-white">${cart?.tax_amount?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-5xl font-black text-white pt-6 border-t border-white/5 uppercase tracking-tighter">
                        <span>Grand Total</span>
                        <span className="text-primary-500 font-mono">${cart?.total_amount?.toFixed(2)}</span>
                    </div>
                </div>
                <div className="flex flex-col gap-4">
                    <button
                        onClick={() => setView('checkout')}
                        className="flex-1 bg-white text-black hover:bg-primary-500 hover:text-white font-black text-3xl py-10 transition-all uppercase tracking-[0.2em] shadow-[0_20px_40px_rgba(255,255,255,0.05)]"
                    >
                        Checkout
                    </button>
                    <button
                        onClick={() => setView('menu')}
                        className="bg-white/5 text-white/40 hover:text-white py-6 border border-white/10 font-black uppercase tracking-widest transition-all"
                    >
                        Add more items
                    </button>
                </div>
            </div>
        </div>
    );

    const renderCheckout = () => (
        <div className="h-full flex flex-col items-center justify-center p-12 bg-[#05050a]">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-xl w-full text-center"
            >
                <div className="w-32 h-32 bg-primary-500/20 border border-primary-500/30 flex items-center justify-center mx-auto mb-10 animate-pulse">
                    <CreditCard className="w-16 h-16 text-primary-400" />
                </div>
                <h2 className="text-5xl font-black text-white mb-6 uppercase tracking-tight italic">Initiate Settlement</h2>
                <p className="text-xl text-white/40 mb-12 uppercase tracking-widest font-mono">Total amount due: ${cartTotal.toFixed(2)}</p>

                <div className="grid grid-cols-1 gap-6 mb-12">
                    <GlassCard
                        className="p-10 border-white/10 hover:border-primary-500 transition-all group"
                        onClick={handleCheckout}
                    >
                        <div className="flex flex-col items-center">
                            <CreditCard className="w-12 h-12 text-white/30 group-hover:text-primary-400 mb-4 transition-colors" />
                            <div className="text-2xl font-black text-white uppercase tracking-widest">Digital Terminal</div>
                            <p className="text-sm text-white/30 mt-2">Tap phone or insert card into the external reader</p>
                        </div>
                    </GlassCard>
                </div>

                <button onClick={() => setView('cart')} className="text-white/30 hover:text-white uppercase font-black tracking-widest underline underline-offset-4">
                    Back to Assignment
                </button>
            </motion.div>
        </div>
    );

    const renderSuccess = () => (
        <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-[#05050a]">
            <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-40 h-40 bg-green-500/20 border border-green-500/30 flex items-center justify-center mb-10"
            >
                <Sparkles className="w-20 h-20 text-green-400" />
            </motion.div>
            <h2 className="text-7xl font-black text-white mb-6 tracking-tighter uppercase italic">Success</h2>
            <div className="text-2xl font-mono text-white/40 mb-12 tracking-widest uppercase">Assignment Provisioned</div>

            <div className="bg-white/2 border border-white/5 p-8 max-w-lg mb-12">
                <p className="text-white/60 italic leading-relaxed">
                    "Sync complete. Your digital entitlement has been updated in the master ledger. Collect your physical tokens at the pickup terminal."
                </p>
            </div>

            <button
                onClick={() => {
                    setView('welcome');
                    initSession(); // Reset for next customer
                }}
                className="bg-white text-black text-2xl font-black px-16 py-8 rounded-none hover:bg-primary-500 hover:text-white transition-all uppercase tracking-widest"
            >
                Finish Session
            </button>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100] bg-black selection:bg-primary-500 selection:text-white font-sans cursor-none hide-scrollbar">
            <AnimatePresence mode="wait">
                <motion.div
                    key={view}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="h-full"
                >
                    {view === 'welcome' && renderWelcome()}
                    {view === 'menu' && renderMenu()}
                    {view === 'cart' && renderCart()}
                    {view === 'checkout' && renderCheckout()}
                    {view === 'success' && renderSuccess()}
                </motion.div>
            </AnimatePresence>

            {/* Custom Cursor for Kiosk feeling */}
            <div className="pointer-events-none fixed top-0 left-0 w-8 h-8 rounded-full border border-white/20 z-[110] transition-transform duration-75 mix-blend-difference" id="kiosk-cursor" />
            <script dangerouslySetInnerHTML={{
                __html: `
                document.addEventListener('mousemove', (e) => {
                    const cursor = document.getElementById('kiosk-cursor');
                    if (cursor) {
                        cursor.style.transform = 'translate(' + (e.clientX - 16) + 'px, ' + (e.clientY - 16) + 'px)';
                    }
                });
            `}} />
        </div>
    );
};

const PlusIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
    </svg>
);
