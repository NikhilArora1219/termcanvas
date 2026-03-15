/**
 * EntityLegend Component
 *
 * Shows color-coded node type legend overlaid on the canvas (bottom-right).
 * Toggleable — click to show/hide.
 */
import { useState } from 'react';
import './EntityLegend.css';

const NODE_TYPE_COLORS: Record<string, string> = {
  terminal: '#0ecf85',
  agent: '#4a9eff',
  browser: '#f5c348',
  conversation: '#9b59b6',
  'agent-chat': '#9b59b6',
  note: '#4a9eff',
  code: '#a78bfa',
  image: '#34d399',
  custom: '#666',
};

const NODE_TYPE_LABELS: Record<string, string> = {
  terminal: 'Terminal',
  agent: 'Agent',
  browser: 'Browser',
  conversation: 'Conversation',
  'agent-chat': 'Chat',
  note: 'Note',
  code: 'Code',
  image: 'Image',
  custom: 'Custom',
};

export function getNodeTypeColor(type: string): string {
  return NODE_TYPE_COLORS[type] || '#666';
}

export function getNodeTypeLabel(type: string): string {
  return NODE_TYPE_LABELS[type] || type;
}

interface EntityLegendProps {
  nodeTypes: string[];
}

export function EntityLegend({ nodeTypes }: EntityLegendProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (nodeTypes.length === 0) return null;

  return (
    <div className="entity-legend">
      <button
        className="entity-legend-toggle"
        onClick={() => setIsVisible(!isVisible)}
        title={isVisible ? 'Hide legend' : 'Show legend'}
      >
        {isVisible ? '▾' : '▸'} NODE TYPES
      </button>
      {isVisible && (
        <div className="entity-legend-items">
          {nodeTypes.map((type) => (
            <div key={type} className="entity-legend-item">
              <span className="entity-legend-dot" style={{ background: getNodeTypeColor(type) }} />
              <span className="entity-legend-label">{getNodeTypeLabel(type)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
