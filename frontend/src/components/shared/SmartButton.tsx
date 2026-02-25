import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface SmartButtonProps {
    icon: LucideIcon;
    label: string;
    value?: string | number;
    onClick?: () => void;
    isActive?: boolean;
    variant?: 'primary' | 'secondary' | 'success' | 'danger';
}

export function SmartButton({ icon: Icon, label, value, onClick, isActive, variant = 'primary' }: SmartButtonProps) {
    const variantStyles = {
        primary: {
            active: 'bg-primary-purple/20 border-primary-purple text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]',
            inactive: 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20 hover:text-white hover:shadow-lg',
            iconActive: 'bg-primary-purple/30 text-primary-purple-light',
            iconInactive: 'bg-white/10 text-white/50 group-hover:bg-white/20 group-hover:text-white',
            labelActive: 'text-primary-purple-light/80',
            labelInactive: 'text-white/40 group-hover:text-white/60',
        },
        secondary: {
            active: 'bg-glass-bg border-glass-border text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]',
            inactive: 'bg-white/5 border-white/10 text-white/70 hover:bg-glass-hover hover:border-glass-active hover:text-white',
            iconActive: 'bg-white/20 text-white',
            iconInactive: 'bg-white/10 text-white/50 group-hover:bg-white/20 group-hover:text-white',
            labelActive: 'text-white/80',
            labelInactive: 'text-white/40 group-hover:text-white/60',
        },
        success: {
            active: 'bg-green-500/20 border-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.3)]',
            inactive: 'bg-white/5 border-white/10 text-white/70 hover:bg-green-500/10 hover:border-green-500/50 hover:text-white',
            iconActive: 'bg-green-500/30 text-green-400',
            iconInactive: 'bg-white/10 text-white/50 group-hover:bg-green-500/20 group-hover:text-green-400',
            labelActive: 'text-green-400/80',
            labelInactive: 'text-white/40 group-hover:text-green-400/60',
        },
        danger: {
            active: 'bg-red-500/20 border-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]',
            inactive: 'bg-white/5 border-white/10 text-white/70 hover:bg-red-500/10 hover:border-red-500/50 hover:text-white',
            iconActive: 'bg-red-500/30 text-red-400',
            iconInactive: 'bg-white/10 text-white/50 group-hover:bg-red-500/20 group-hover:text-red-400',
            labelActive: 'text-red-400/80',
            labelInactive: 'text-white/40 group-hover:text-red-400/60',
        }
    };

    const currentStyle = variantStyles[variant];

    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`
                group flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 
                w-full sm:w-auto min-w-[140px]
                ${isActive ? currentStyle.active : currentStyle.inactive}
            `}
        >
            <div className={`p-2 rounded-lg transition-colors ${isActive ? currentStyle.iconActive : currentStyle.iconInactive}`}>
                <Icon className="w-5 h-5" />
            </div>

            <div className="flex flex-col items-start leading-tight">
                <span className={`text-xs font-semibold uppercase tracking-wider transition-colors ${isActive ? currentStyle.labelActive : currentStyle.labelInactive}`}>
                    {label}
                </span>

                {value !== undefined && (
                    <span className={`text-lg font-bold font-mono transition-colors ${isActive ? 'text-white' : 'text-white/90 group-hover:text-white'}`}>
                        {value}
                    </span>
                )}
            </div>
        </motion.button>
    );
}
