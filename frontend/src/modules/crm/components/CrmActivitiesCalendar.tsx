import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarGrid } from '@/modules/calendar/components/CalendarGrid';
import type { CalendarEvent } from '@/modules/calendar/stores/calendarStore';
import { crmApi } from '@/lib/api';
import { useCRMStore } from '../stores/crmStore';

type CrmCalendarActivity = {
    id: number;
    type: string;
    summary: string;
    body: string | null;
    dueAt: string | null;
    leadId: number;
    lead: { id: number; name: string };
};

function activityToEvent(a: CrmCalendarActivity): CalendarEvent {
    const startDate = new Date(a.dueAt!);
    const stopDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    return {
        id: a.id,
        name: `${a.type} — ${a.summary} · ${a.lead.name}`,
        start: startDate.toISOString(),
        stop: stopDate.toISOString(),
        allday: false,
        location: null,
        description: a.body,
        rrule: null,
    };
}

export const CrmActivitiesCalendar: React.FC = () => {
    const navigate = useNavigate();
    const crmScopeUserId = useCRMStore((s) => s.crmScopeUserId);
    const [activities, setActivities] = useState<CrmCalendarActivity[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadRange = useCallback(async (from: Date, to: Date) => {
        setLoading(true);
        setError(null);
        try {
            const res = await crmApi.activitiesCalendar({
                from: from.toISOString(),
                to: to.toISOString(),
                ...(crmScopeUserId ? { user_id: crmScopeUserId } : {}),
            });
            setActivities(res.data as CrmCalendarActivity[]);
        } catch (e: unknown) {
            const msg =
                e && typeof e === 'object' && 'message' in e
                    ? String((e as { message: string }).message)
                    : 'Failed to load activities';
            setError(msg);
            setActivities([]);
        } finally {
            setLoading(false);
        }
    }, [crmScopeUserId]);

    const onVisibleRangeChange = useCallback(
        (range: { from: Date; to: Date }) => {
            void loadRange(range.from, range.to);
        },
        [loadRange]
    );

    const events = useMemo(() => activities.map(activityToEvent), [activities]);

    const leadByActivityId = useMemo(() => {
        const m = new Map<number, number>();
        for (const a of activities) m.set(a.id, a.lead.id);
        return m;
    }, [activities]);

    return (
        <div className="flex flex-col gap-2 h-full min-h-[480px]">
            {error && <p className="text-sm text-red-400/90 px-1">{error}</p>}
            <div className="flex items-center justify-between text-xs px-1" style={{ color: 'var(--text-tertiary)' }}>
                <span>Open activities with a due date — same lead scope as the pipeline.</span>
                {loading && <span style={{ color: 'var(--text-secondary)' }}>Updating…</span>}
            </div>
            <div className="flex-1 min-h-0">
                <CalendarGrid
                    events={events}
                    onVisibleRangeChange={onVisibleRangeChange}
                    onEventClick={(ev) => {
                        const leadId = leadByActivityId.get(ev.id);
                        if (leadId !== undefined) navigate(`/module/crm/leads/${leadId}`);
                    }}
                />
            </div>
        </div>
    );
};
