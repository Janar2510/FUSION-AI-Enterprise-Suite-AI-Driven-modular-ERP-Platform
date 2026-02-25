import React, { useEffect, useState } from 'react';
import { ShoppingCart, Star, Search, CreditCard, Sparkles, X, ChevronRight, Filter } from 'lucide-react';
import { useEcommerceStore } from '../stores/ecommerceStore';
import { GlassCard } from '@/components/shared/GlassCard';
import { motion, AnimatePresence } from 'framer-motion';

export const StorefrontModule: React.FC = () => {
    const {
        products, cart, sessionId, aiRecommendations,
        initSession, fetchProducts, fetchCart, addToCart, checkout, getRecommendations
    } = useEcommerceStore();

    const [isCartOpen, setIsCartOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [checkoutForm, setCheckoutForm] = useState({ name: '', email: '' });
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [orderComplete, setOrderComplete] = useState<any>(null);

    useEffect(() => {
        initSession();
    }, []);

    useEffect(() => {
        if (sessionId) {
            fetchProducts();
            fetchCart();
            getRecommendations();
        }
    }, [sessionId]);

    const handleAddToCart = async (productId: number) => {
        await addToCart(productId, 1);
        setIsCartOpen(true);
        getRecommendations(productId);
    };

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const result = await checkout(checkoutForm.email, checkoutForm.name);
            setOrderComplete(result);
            setIsCheckingOut(false);
            setIsCartOpen(false);
        } catch (error) {
            console.error(error);
        }
    };

    const cartCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

    const renderHeader = () => (
        <div className="flex flex-col gap-6 mb-8 mt-2">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-bold text-white tracking-tight">
                        Fusion <span className="text-primary-400">Store</span>
                    </h1>
                    <p className="text-white/50 text-sm mt-1">Premium Omnichannel Marketplace</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-primary-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search catalog..."
                            className="bg-white/5 border border-white/10 rounded-none py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-primary-400/50 w-72 transition-all text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setIsCartOpen(true)}
                        className="relative p-2.5 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                    >
                        <ShoppingCart className="w-5 h-5 text-white/80" />
                        {cartCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-[10px] font-bold rounded-none w-4 h-4 flex items-center justify-center">
                                {cartCount}
                            </span>
                        )}
                    </button>
                    <button className="p-2.5 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                        <Filter className="w-5 h-5 text-white/80" />
                    </button>
                </div>
            </div>
            <div className="h-px bg-gradient-to-r from-white/10 to-transparent w-full" />
        </div>
    );

    const renderProducts = () => {
        const filtered = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

        return (
            <div className="p-8 pb-12 max-w-7xl mx-auto w-full">
                {renderHeader()}

                {/* AI Recommendations */}
                {aiRecommendations?.length > 0 && !searchTerm && (
                    <div className="mb-14">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-sm font-bold text-white/40 uppercase tracking-[0.2em] flex items-center gap-3">
                                <Sparkles className="w-4 h-4 text-yellow-500/80" />
                                Personalized Curator
                            </h2>
                            <div className="flex gap-1">
                                <span className="h-1 w-8 bg-primary-500" />
                                <span className="h-1 w-2 bg-white/10" />
                                <span className="h-1 w-2 bg-white/10" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {aiRecommendations.map((rec, i) => (
                                <GlassCard
                                    key={i}
                                    className="rounded-none border-primary-500/20 group overflow-hidden"
                                    hover={true}
                                >
                                    <div className="relative p-6">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="relative z-10">
                                                <h3 className="text-lg font-bold text-white group-hover:text-primary-400 transition-colors">{rec.name || "Product Name"}</h3>
                                                <p className="text-xs text-white/40 mt-1 uppercase tracking-widest">{rec.category || 'Special'}</p>
                                            </div>
                                            <div className="text-xl font-bold text-white">${rec.price?.toFixed(2) || "99.00"}</div>
                                        </div>
                                        <div className="mb-6 h-32 bg-white/5 flex items-center justify-center relative overflow-hidden">
                                            <Star className="w-12 h-12 text-white/5 group-hover:scale-150 transition-transform duration-700" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-primary-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <button
                                            onClick={() => handleAddToCart(rec.product_id || 1)}
                                            className="w-full bg-white text-black hover:bg-primary-500 hover:text-white py-3 rounded-none transition-all text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                                        >
                                            Add to Cart <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </GlassCard>
                            ))}
                        </div>
                    </div>
                )}

                {/* Main Catalog */}
                <div className="flex items-center gap-4 mb-8">
                    <h2 className="text-sm font-bold text-white/40 uppercase tracking-[0.2em]">Product Catalog</h2>
                    <div className="flex-1 h-px bg-white/5" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
                    {filtered.map(product => (
                        <div key={product.id} className="group cursor-pointer">
                            <div className="relative aspect-square bg-white/5 border border-white/5 overflow-hidden flex items-center justify-center group-hover:border-primary-500/30 transition-all duration-300">
                                <Star className="w-10 h-10 text-white/10 group-hover:scale-110 transition-transform duration-500" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center translate-y-4 group-hover:translate-y-0 duration-300">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleAddToCart(product.id); }}
                                        className="bg-white text-black px-6 py-2.5 font-bold text-xs uppercase tracking-widest hover:bg-primary-500 hover:text-white transition-colors"
                                    >
                                        Add to Cart
                                    </button>
                                </div>
                            </div>
                            <div className="mt-4 flex justify-between items-start">
                                <div>
                                    <div className="text-[10px] font-bold text-primary-400 uppercase tracking-widest mb-1">
                                        {product.category || 'General'}
                                    </div>
                                    <h3 className="text-sm font-semibold text-white/90 group-hover:text-white transition-colors">{product.name}</h3>
                                    <div className="text-[11px] text-white/30 mt-0.5">{product.sku}</div>
                                </div>
                                <div className="text-sm font-bold text-white">${product.price?.toFixed(2) || "49.00"}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderCartDrawer = () => (
        <AnimatePresence>
            {isCartOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60]"
                        onClick={() => setIsCartOpen(false)}
                    />
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-y-0 right-0 w-full max-w-md bg-[#0a0a0f] border-l border-white/10 z-[70] flex flex-col"
                    >
                        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/2">
                            <h2 className="text-xl font-bold text-white uppercase tracking-tighter flex items-center gap-3">
                                <ShoppingCart className="w-5 h-5 text-primary-400" />
                                Inventory
                            </h2>
                            <button onClick={() => setIsCartOpen(false)} className="p-2 border border-white/10 text-white/50 hover:text-white hover:border-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-8">
                            {!cart?.items?.length ? (
                                <div className="text-center py-20">
                                    <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-white/10" />
                                    <p className="text-white/30 font-medium text-sm">Your inventory is empty.</p>
                                </div>
                            ) : isCheckingOut ? (
                                <div className="space-y-6">
                                    <h3 className="text-lg font-bold text-white">Consignment Details</h3>
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Legal Name</label>
                                            <input
                                                required
                                                type="text"
                                                className="w-full bg-white/5 border border-white/10 rounded-none px-4 py-3 text-white focus:outline-none focus:border-primary-400 text-sm transition-all"
                                                value={checkoutForm.name}
                                                onChange={e => setCheckoutForm({ ...checkoutForm, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">System Email</label>
                                            <input
                                                required
                                                type="email"
                                                className="w-full bg-white/5 border border-white/10 rounded-none px-4 py-3 text-white focus:outline-none focus:border-primary-400 text-sm transition-all"
                                                value={checkoutForm.email}
                                                onChange={e => setCheckoutForm({ ...checkoutForm, email: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <GlassCard className="rounded-none bg-white/2 border-white/5 p-5 mt-6">
                                        <h3 className="text-xs font-bold text-white/70 mb-3 flex items-center gap-2 uppercase tracking-widest">
                                            <CreditCard className="w-3 h-3" />
                                            Gatway Secure
                                        </h3>
                                        <p className="text-[11px] text-white/30 leading-relaxed italic">
                                            Simulation active. Transaction logic will be processed against the master ledger without real settlement.
                                        </p>
                                    </GlassCard>
                                </div>
                            ) : (
                                cart.items.map(item => (
                                    <div key={item.id} className="flex gap-5 group">
                                        <div className="w-20 h-20 bg-white/5 border border-white/5 flex items-center justify-center shrink-0 group-hover:border-primary-500/20 transition-colors">
                                            <Star className="w-8 h-8 text-white/5" />
                                        </div>
                                        <div className="flex-1 flex flex-col justify-center min-w-0">
                                            <h4 className="text-white font-bold text-sm truncate uppercase tracking-tight">{item.product_name}</h4>
                                            <div className="flex items-center justify-between mt-2">
                                                <div className="flex items-center border border-white/10 bg-black/40">
                                                    <span className="px-3 py-1 text-[11px] text-white/50 border-r border-white/10">QTY</span>
                                                    <span className="px-3 py-1 text-[11px] text-white font-bold">{item.quantity}</span>
                                                </div>
                                                <div className="font-bold text-white text-sm">
                                                    ${item.line_total?.toFixed(2)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {(cart?.items?.length || 0) > 0 && (
                            <div className="p-8 border-t border-white/10 bg-black/40 backdrop-blur-xl">
                                <div className="space-y-3 mb-8">
                                    <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-white/40">
                                        <span>Subtotal</span>
                                        <span className="text-white/80">${cart?.subtotal?.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-white/40">
                                        <span>System Tax</span>
                                        <span className="text-white/80">${cart?.tax_amount?.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-xl font-black text-white pt-4 border-t border-white/5 uppercase tracking-tighter">
                                        <span>Total Amount</span>
                                        <span className="text-primary-400">${cart?.total_amount?.toFixed(2)}</span>
                                    </div>
                                </div>

                                {!isCheckingOut ? (
                                    <button
                                        onClick={() => setIsCheckingOut(true)}
                                        className="w-full bg-white text-black hover:bg-primary-500 hover:text-white font-black py-5 rounded-none transition-all uppercase tracking-[0.2em] text-xs"
                                    >
                                        Initiate Settlement
                                    </button>
                                ) : (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setIsCheckingOut(false)}
                                            className="px-6 bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors uppercase text-[10px] font-bold"
                                        >
                                            Back
                                        </button>
                                        <button
                                            onClick={handleCheckout}
                                            className="flex-1 bg-green-500 hover:bg-green-600 text-white font-black py-5 rounded-none transition-all uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-2"
                                        >
                                            Finalize Contract
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );

    return (
        <div className="h-full bg-[#0a0a0f] overflow-y-auto relative font-sans selection:bg-primary-500 selection:text-white">
            {renderProducts()}
            {renderCartDrawer()}

            {/* Order Complete Modal */}
            <AnimatePresence>
                {orderComplete && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-2xl">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#0a0a0f] border border-white/10 p-12 max-w-lg w-full text-center relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 via-secondary-500 to-primary-500 animate-gradient-x" />

                            <div className="w-24 h-24 bg-primary-500/20 border border-primary-500/30 flex items-center justify-center mx-auto mb-8 animate-pulse-slow">
                                <Sparkles className="w-12 h-12 text-primary-400" />
                            </div>

                            <h2 className="text-4xl font-black text-white mb-2 uppercase tracking-tight">Access Granted</h2>
                            <p className="text-white/40 mb-8 font-mono text-sm tracking-widest uppercase">Transaction ID: {orderComplete.order_number}</p>

                            <div className="bg-white/2 border border-white/5 p-6 mb-10 text-left">
                                <p className="text-sm text-white/60 leading-relaxed font-light italic">
                                    "Consignment has been authorized. The digital ledger has been synchronized and your items are now being provisioned in the global ERP cluster."
                                </p>
                            </div>

                            <button
                                onClick={() => setOrderComplete(null)}
                                className="w-full bg-white text-black hover:bg-primary-500 hover:text-white font-bold py-4 rounded-none transition-all uppercase tracking-widest text-xs"
                            >
                                Re-enter Store
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

