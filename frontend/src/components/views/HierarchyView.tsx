import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, User, Mail, Briefcase, MapPin } from 'lucide-react';
import { GlassCard } from '../shared/GlassCard';

export interface HierarchyNode {
    id: string | number;
    name: string;
    subtitle?: string;
    image?: string;
    details?: {
        icon: React.ReactNode;
        text: string;
    }[];
    children?: HierarchyNode[];
    color?: string;
}

interface HierarchyViewProps {
    data: HierarchyNode[];
    onNodeClick?: (id: string | number) => void;
}

const Node: React.FC<{
    node: HierarchyNode;
    depth: number;
    onNodeClick?: (id: string | number) => void
}> = ({ node, depth, onNodeClick }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const hasChildren = node.children && node.children.length > 0;

    return (
        <div className="flex flex-col items-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -4 }}
                className="relative z-10"
            >
                <GlassCard
                    className={`min-w-[280px] p-4 border-l-4 cursor-pointer hover:border-r-4 transition-all bg-black/40 backdrop-blur-2xl`}
                    style={{ borderLeftColor: node.color || '#a855f7' } as React.CSSProperties}
                    onClick={() => onNodeClick?.(node.id)}
                >
                    <div className="flex items-start gap-4">
                        {node.image ? (
                            <img src={node.image} alt={node.name} className="w-12 h-12 rounded-full object-cover border-2 border-white/10 shadow-lg" />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border-2 border-white/10 shadow-lg">
                                <User className="w-6 h-6 text-white/40" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-black text-white truncate uppercase tracking-wider">{node.name}</h3>
                            <p className="text-[10px] font-bold text-white/30 truncate uppercase tracking-widest mt-0.5">{node.subtitle}</p>

                            <div className="mt-3 space-y-1.5 border-t border-white/5 pt-3">
                                {node.details?.map((detail, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-[9px] font-black text-white/20 uppercase tracking-widest">
                                        {detail.icon}
                                        <span className="truncate">{detail.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {hasChildren && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsExpanded(!isExpanded);
                                }}
                                className="p-1 hover:bg-white/10 rounded-full transition-colors self-start"
                            >
                                {isExpanded ? <ChevronDown className="w-4 h-4 text-white/40" /> : <ChevronRight className="w-4 h-4 text-white/40" />}
                            </button>
                        )}
                    </div>
                </GlassCard>

                {hasChildren && isExpanded && (
                    <div className="absolute left-1/2 -bottom-6 w-0.5 h-6 bg-white/10 -translate-x-1/2" />
                )}
            </motion.div>

            <AnimatePresence>
                {hasChildren && isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-col items-center mt-6 overflow-hidden"
                    >
                        <div className="relative flex gap-8">
                            {/* Horizontal connection line */}
                            {node.children!.length > 1 && (
                                <div className="absolute top-0 left-[calc(140px)] right-[calc(140px)] h-0.5 bg-white/10" />
                            )}

                            {node.children!.map((child, idx) => (
                                <div key={child.id} className="relative flex flex-col items-center">
                                    {/* Vertical entry line */}
                                    <div className="w-0.5 h-6 bg-white/10" />
                                    <Node node={child} depth={depth + 1} onNodeClick={onNodeClick} />
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export const HierarchyView: React.FC<HierarchyViewProps> = ({ data, onNodeClick }) => {
    return (
        <div className="w-full h-full overflow-auto flex justify-center p-12 bg-black/40 backdrop-blur-3xl rounded-3xl border border-white/10 scrollbar-hide">
            <div className="inline-flex flex-col items-center min-w-full">
                {data.map(rootNode => (
                    <Node key={rootNode.id} node={rootNode} depth={0} onNodeClick={onNodeClick} />
                ))}
            </div>
        </div>
    );
};

export default HierarchyView;
