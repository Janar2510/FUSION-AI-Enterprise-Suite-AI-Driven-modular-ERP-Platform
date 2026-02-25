import React, { useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbHeaderProps {
    customLabels?: Record<string, string>;
}

export function BreadcrumbHeader({ customLabels = {} }: BreadcrumbHeaderProps) {
    const location = useLocation();

    const items = useMemo(() => {
        const paths = location.pathname.split('/').filter(p => p);
        if (paths.length === 0) return [];

        let pathAccumulator = '';
        const generatedItems: { label: string; path: string; isActive: boolean }[] = [];

        paths.forEach((p, index) => {
            pathAccumulator += `/${p}`;
            const isLast = index === paths.length - 1;

            if (p === 'module') {
                return; // Skip the base 'module' prefix from visual breadcrumbs
            }

            // Format label (capitalize and replace dashes)
            let label = p.charAt(0).toUpperCase() + p.slice(1).replace('-', ' ');

            // Override with custom labels if provided (useful for IDs to Names)
            if (customLabels[pathAccumulator]) {
                label = customLabels[pathAccumulator];
            } else if (!isNaN(Number(p))) {
                // If it's a number and no custom label, fallback
                label = customLabels[p] || `#${p}`;
            }

            // Special case for crm
            if (p.toLowerCase() === 'crm') label = 'CRM';

            generatedItems.push({
                label,
                path: pathAccumulator,
                isActive: isLast
            });
        });

        // Ensure the last item is marked active even if we skipped 'module'
        if (generatedItems.length > 0) {
            generatedItems[generatedItems.length - 1].isActive = true;
        }

        return generatedItems;
    }, [location.pathname, customLabels]);

    if (!items || items.length === 0) return null;

    return (
        <nav aria-label="Breadcrumb" className="flex items-center space-x-2">
            {items.map((item, index) => {
                const isLast = index === items.length - 1;

                return (
                    <div key={item.path} className="flex items-center">
                        <NavLink
                            to={item.path}
                            className={`text-2xl font-bold transition-colors ${isLast
                                ? 'text-white'
                                : 'text-white/40 hover:text-white/80'
                                }`}
                            aria-current={item.isActive ? 'page' : undefined}
                        >
                            {item.label}
                        </NavLink>

                        {!isLast && (
                            <ChevronRight className="w-5 h-5 text-white/20 mx-2 flex-shrink-0" />
                        )}
                    </div>
                );
            })}
        </nav>
    );
}
