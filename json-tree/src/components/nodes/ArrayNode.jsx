import React from 'react';

export default function ArrayNode({ data }) {
  const { label, path, highlight, childrenCount } = data;
  const bg = highlight ? '#0a8f08' : '#8fe3a1';
  return (
    <div className="custom-node array-node" title={path} onClick={() => { if (data.onClick) data.onClick(path); }}>
      <div className="node-label" style={{ background: bg }}>
        <strong>{label}</strong>
      </div>
      <div className="node-meta">[{childrenCount}]</div>
    </div>
  );
}
