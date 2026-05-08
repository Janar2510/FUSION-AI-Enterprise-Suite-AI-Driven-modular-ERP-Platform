import React from 'react'

export interface ActivityEvent {
  id: string | number
  message: React.ReactNode
  time: string
  highlight?: boolean
}

interface ActivityFeedProps {
  events: ActivityEvent[]
  className?: string
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ events, className = '' }) => (
  <div className={`flex flex-col gap-0 ${className}`}>
    {events.map(event => (
      <div key={event.id} className="flex gap-2.5 items-start mb-2.5">
        <span
          className="w-[7px] h-[7px] rounded-full mt-1 flex-shrink-0"
          style={{
            background: event.highlight ? '#f59e0b' : 'rgba(255,255,255,0.15)',
            boxShadow: event.highlight ? '0 0 5px rgba(245,158,11,0.6)' : undefined,
          }}
        />
        <div>
          <div className="text-[10px] text-[rgba(255,255,255,0.5)] leading-snug" style={{ fontFamily: 'var(--font-body)' }}>
            {event.message}
          </div>
          <div className="text-[9px] text-[rgba(255,255,255,0.2)] mt-0.5" style={{ fontFamily: 'var(--font-body)' }}>
            {event.time}
          </div>
        </div>
      </div>
    ))}
  </div>
)
