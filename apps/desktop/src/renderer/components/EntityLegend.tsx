/**
 * EntityLegend Component
 *
 * Shows color-coded node type legend overlaid on the canvas (bottom-left).
 */
import './EntityLegend.css';

const NODE_TYPE_COLORS: Record<string, string> = {
  terminal: '#0ecf85',
  agent: '#4a9eff',
  browser: '#f5c348',
  conversation: '#9b59b6',
  'agent-chat': '#9b59b6',
  custom: '#666',
};

const NODE_TYPE_LABELS: Record<string, string> = {
  terminal: 'Terminal',
  agent: 'Agent',
  browser: 'Browser',
  conversation: 'Conversation',
  'agent-chat': 'Chat',
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
  if (nodeTypes.length === 0) return null;

  return (
    <div className="entity-legend">
      <div className="entity-legend-title">NODE TYPES</div>
      <div className="entity-legend-items">
        {nodeTypes.map((type) => (
          <div key={type} className="entity-legend-item">
            <span className="entity-legend-dot" style={{ background: getNodeTypeColor(type) }} />
            <span className="entity-legend-label">{getNodeTypeLabel(type)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
