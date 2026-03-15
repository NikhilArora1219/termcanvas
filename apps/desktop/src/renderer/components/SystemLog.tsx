/**
 * SystemLog Component
 *
 * Terminal-style log panel at the bottom showing system events.
 * Collapsible, auto-scrolling, monospace font.
 */
import { useEffect, useRef, useState } from 'react';
import { useViewModeStore } from '../stores/ViewModeStore';
import './SystemLog.css';

export function formatLogTimestamp(ts: number): string {
  const d = new Date(ts);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  const ms = String(d.getMilliseconds()).padStart(3, '0');
  return `${h}:${m}:${s}.${ms}`;
}

export function SystemLog() {
  const logs = useViewModeStore((s) => s.systemLogs);
  const [collapsed, setCollapsed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs.length]);

  return (
    <div className={`system-log ${collapsed ? 'collapsed' : ''}`}>
      <div className="system-log-header" onClick={() => setCollapsed(!collapsed)}>
        <span className="system-log-title">SYSTEM DASHBOARD</span>
        <span className="system-log-count">{logs.length} events</span>
        <span className="system-log-toggle">{collapsed ? '+' : '-'}</span>
      </div>
      {!collapsed && (
        <div className="system-log-content" ref={scrollRef}>
          {logs.length === 0 && <div className="system-log-empty">No events yet</div>}
          {logs.map((entry, i) => (
            <div
              key={`${entry.timestamp}-${i}`}
              className={`system-log-entry level-${entry.level}`}
            >
              <span className="system-log-ts">{formatLogTimestamp(entry.timestamp)}</span>
              <span className="system-log-msg">{entry.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
