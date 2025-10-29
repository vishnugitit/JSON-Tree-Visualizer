import React from 'react';

export default function PrimitiveNode({ data }) {
  const { label, value, path, highlight } = data;
  const bg = highlight ? '#ff8c00' : '#ffd07a';
  return (
    <div className="custom-node primitive-node" title={`${path}: ${value}`} onClick={() => { if (data.onClick) data.onClick(path); }}>
      <div className="node-label" style={{ background: bg }}>
        <strong>{label}</strong>
      </div>
      <div className="node-meta small">{String(value)}</div>
    </div>
  );
}
