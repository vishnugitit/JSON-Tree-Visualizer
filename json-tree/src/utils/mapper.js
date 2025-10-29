// src/utils/mapper.js
import { MarkerType } from 'reactflow';

/**
 * mapJsonToFlow(parsedJson)
 * Converts a JS object/array into React Flow nodes & edges.
 *
 * Returns: { nodes: Array, edges: Array }
 *
 * Node shape:
 *  {
 *    id: string,
 *    type: 'objectNode' | 'arrayNode' | 'primitiveNode',
 *    position?: { x:number, y:number } // optional - FlowView will auto-layout when missing
 *    data: { label: string, path: string, value?: any, ... }
 *  }
 *
 * Edge shape:
 *  {
 *    id: string,
 *    source: string,
 *    target: string,
 *    markerEnd: { type: MarkerType.ArrowClosed }
 *  }
 */

let idCounter = 0;
const nextId = (prefix = 'n') => `${prefix}-${++idCounter}`;

// sanitize path to form a safe id fragment
const idFromPath = (path) => {
  if (!path) return nextId('n');
  return path.replace(/[^a-zA-Z0-9\-_]/g, '_');
};

// determine node type
const nodeTypeFor = (value) => {
  if (value === null) return 'primitiveNode';
  if (Array.isArray(value)) return 'arrayNode';
  if (typeof value === 'object') return 'objectNode';
  return 'primitiveNode';
};

export function mapJsonToFlow(parsedJson) {
  idCounter = 0; // reset for deterministic ids within a single run

  const nodes = [];
  const edges = [];

  // recursive walker
  const walk = (value, path = '$', parentId = null, keyLabel = null) => {
    const type = nodeTypeFor(value);
    const safeId = idFromPath(path);
    const nodeId = `${safeId}-${nextId('id')}`;

    // label: for objects/arrays show key or type; for primitive show key: value
    let label;
    if (type === 'objectNode') {
      label = keyLabel ?? (path === '$' ? 'root (object)' : `object`);
    } else if (type === 'arrayNode') {
      label = keyLabel ?? 'array';
    } else {
      // primitive
      const displayVal = (typeof value === 'string') ? `"${value}"` : String(value);
      label = (keyLabel != null) ? `${keyLabel}: ${displayVal}` : `${displayVal}`;
    }

    // push node (no position here; FlowView will auto-layout if needed)
    nodes.push({
      id: nodeId,
      type,
      // position intentionally omitted to allow FlowView's autoLayout fallback
      data: {
        label,
        path,
        value,
        // highlight flag default false (FlowView toggles it)
        highlight: false
      }
    });

    // create edge from parent -> this node
    if (parentId) {
      edges.push({
        id: `e-${parentId}-${nodeId}`,
        source: parentId,
        target: nodeId,
        markerEnd: { type: MarkerType.ArrowClosed }
      });
    }

    // if object or array, iterate children
    if (type === 'objectNode') {
      // iterate own enumerable properties
      Object.keys(value).forEach((k) => {
        const childPath = path === '$' ? `$.${k}` : `${path}.${k}`;
        walk(value[k], childPath, nodeId, k);
      });
    } else if (type === 'arrayNode') {
      value.forEach((item, idx) => {
        // arrays: path like $.items[0]
        const childPath = `${path}[${idx}]`;
        walk(item, childPath, nodeId, `[${idx}]`);
      });
    }

    return nodeId;
  };

  try {
    // start from root
    walk(parsedJson, '$', null, null);
  } catch (err) {
    // if anything unexpected happens, rethrow with context
    throw new Error(`mapJsonToFlow ERROR: ${err?.message || err}`);
  }

  return { nodes, edges };
}
