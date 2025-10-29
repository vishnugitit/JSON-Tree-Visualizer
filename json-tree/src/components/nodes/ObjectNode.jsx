import React from 'react';

export default function ObjectNode({ data }) {
  const { label, path, highlight, childrenCount } = data;
  const bg = highlight ? '#6f42c1' : '#c7b7ff';
  return (
    <div className="custom-node object-node" title={path} onClick={() => {
      if (data.onClick) data.onClick(path);
    }}>
      <div className="node-label" style={{ background: bg }}>
        <strong>{label}</strong>
      </div>
      <div className="node-meta">{childrenCount} child{childrenCount !== 1 ? 'ren' : ''}</div>
    </div>
  );
}
