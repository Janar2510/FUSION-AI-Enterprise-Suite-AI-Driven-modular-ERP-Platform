import React from 'react';
import { GlassCard } from '@/components/shared/GlassCard';

interface OdooFormBaseProps {
    statusRibbon?: React.ReactNode;
    headerContent?: React.ReactNode;
    leftPanels?: React.ReactNode;
    rightPanels?: React.ReactNode;
    chatter?: React.ReactNode;
    smartButtons?: React.ReactNode;
}

export function OdooFormBase({
    statusRibbon,
    headerContent,
    leftPanels,
    rightPanels,
    chatter,
    smartButtons
}: OdooFormBaseProps) {
    return (
        <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-20 relative">
            <GlassCard className="overflow-hidden relative">
                {/* Form Ribbon overlay (e.g. Won, Lost, Archived) */}
                {/* Status Ribbon (Standard Odoo top right status bar) */}
                {statusRibbon && (
                    <div className="bg-white/5 border-b border-white/10 px-6 pt-4 pb-0 flex justify-end">
                        {statusRibbon}
                    </div>
                )}

                {/* Main Header (Title, Key Badges) */}
                {(headerContent || smartButtons) && (
                    <div className="px-6 border-b border-white/10 pb-6 pt-6 flex justify-between items-start gap-4">
                        <div className="flex-1">
                            {headerContent}
                        </div>
                        {smartButtons && (
                            <div className="flex flex-wrap gap-2 justify-end pt-2">
                                {smartButtons}
                            </div>
                        )}
                    </div>
                )}

                {/* Form Body Split */}
                <div className="flex flex-wrap md:flex-nowrap p-6 gap-8">
                    <div className="flex-1 space-y-6">
                        {leftPanels}
                    </div>
                    {rightPanels && (
                        <div className="w-full md:w-1/3 min-w-[300px] space-y-6 border-l border-white/10 pl-8">
                            {rightPanels}
                        </div>
                    )}
                </div>
            </GlassCard>

            {/* Chatter (Log note, Send message, Activities) - A staple of Odoo */}
            {chatter && (
                <div className="mt-4">
                    {chatter}
                </div>
            )}
        </div>
    );
}
