import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import axios from 'axios';
import { clsx } from 'clsx';

interface OrderpointModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => Promise<void>;
    initialData?: any;
}

export const OrderpointModal: React.FC<OrderpointModalProps> = ({
    isOpen,
    onClose,
    onSave,
    initialData
}) => {
    const [formData, setFormData] = useState<any>({
        name: '',
        productId: '',
        locationId: '',
        warehouseId: 1, // Default warehouse
        productMinQty: 0,
        productMaxQty: 0,
        active: true
    });

    const [products, setProducts] = useState<any[]>([]);
    const [locations, setLocations] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchOptions();
            if (initialData) {
                setFormData(initialData);
            } else {
                setFormData({
                    name: '',
                    productId: '',
                    locationId: '',
                    warehouseId: 1,
                    productMinQty: 0,
                    productMaxQty: 0,
                    active: true
                });
            }
        }
    }, [isOpen, initialData]);

    const fetchOptions = async () => {
        try {
            const [pRes, lRes] = await Promise.all([
                axios.get('/api/inventory/products'),
                axios.get('/api/inventory/locations')
            ]);
            setProducts(pRes.data.data || pRes.data);
            setLocations(lRes.data.data || lRes.data);
        } catch (error) {
            console.error('Fetch Options Error:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error('Save Orderpoint Error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-[#1a1c23] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
                <div className="flex justify-between items-center p-6 border-b border-white/10">
                    <h2 className="text-xl font-bold text-white">
                        {initialData ? 'Edit Reordering Rule' : 'New Reordering Rule'}
                    </h2>
                    <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white/60">Rule Name</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. OP/0001"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-purple/50 transition-all font-sans"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-white/60">Product</label>
                            <select
                                required
                                className="w-full bg-[#2a2d37] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-purple/50 transition-all font-sans"
                                value={formData.productId}
                                onChange={(e) => setFormData({ ...formData, productId: parseInt(e.target.value) })}
                            >
                                <option value="" disabled>Select Product</option>
                                {products.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-white/60">Location</label>
                            <select
                                required
                                className="w-full bg-[#2a2d37] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-purple/50 transition-all font-sans"
                                value={formData.locationId}
                                onChange={(e) => setFormData({ ...formData, locationId: parseInt(e.target.value) })}
                            >
                                <option value="" disabled>Select Location</option>
                                {locations.map((l) => (
                                    <option key={l.id} value={l.id}>{l.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-white/60">Minimum Quantity</label>
                            <input
                                type="number"
                                required
                                min="0"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-purple/50 transition-all font-sans"
                                value={formData.productMinQty}
                                onChange={(e) => setFormData({ ...formData, productMinQty: parseFloat(e.target.value) })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-white/60">Maximum Quantity</label>
                            <input
                                type="number"
                                required
                                min="0"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-purple/50 transition-all font-sans"
                                value={formData.productMaxQty}
                                onChange={(e) => setFormData({ ...formData, productMaxQty: parseFloat(e.target.value) })}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <input
                            type="checkbox"
                            id="active"
                            className="w-5 h-5 rounded border-white/10 bg-white/5 text-primary-purple focus:ring-primary-purple"
                            checked={formData.active}
                            onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                        />
                        <label htmlFor="active" className="text-sm font-medium text-white">Active Rule</label>
                    </div>

                    <div className="flex gap-3 pt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-bold hover:bg-white/10 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-purple to-indigo-600 text-white rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary-purple/20 disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save Rule'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
