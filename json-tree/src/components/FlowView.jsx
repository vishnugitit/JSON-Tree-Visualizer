// src/components/FlowView.jsx
import React, {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import ReactFlow, {
  Background,
  Controls,
  MarkerType,
  useNodesState,
  useEdgesState,
  Panel,
} from "reactflow";
import { mapJsonToFlow } from "../utils/mapper"; // your mapper
import ObjectNode from "./nodes/ObjectNode";
import ArrayNode from "./nodes/ArrayNode";
import PrimitiveNode from "./nodes/PrimitiveNode";
import { toPng } from "html-to-image";
import ThemeToggle from "../ThemeToggle";
import "reactflow/dist/style.css";
import "../styles.css";

const nodeTypes = {
  objectNode: ObjectNode,
  arrayNode: ArrayNode,
  primitiveNode: PrimitiveNode,
};

// simple auto-layout: group by depth and space nodes horizontally
function autoLayout(nodes) {
  // if nodes already have positions, return as-is
  const needPos = nodes.some((n) => !n.position || Number.isNaN(n.position.x));
  if (!needPos) return nodes;

  // attempt to infer depth from data.path (count dots/brackets), fallback to index
  const grouped = {};
  nodes.forEach((n, idx) => {
    const path = n.data?.path || "";
    // compute depth: number of dots + bracket levels
    const depth = Math.max(
      0,
      (path.match(/\./g)?.length || 0) + (path.match(/\[/g)?.length || 0)
    );
    grouped[depth] = grouped[depth] || [];
    grouped[depth].push({ n, idx });
  });

  const positioned = [];
  const levelGapX = 220;
  const itemGapY = 80;

  Object.keys(grouped)
    .sort((a, b) => a - b)
    .forEach((depthKey) => {
      const list = grouped[depthKey];
      list.forEach((item, i) => {
        const x = depthKey * levelGapX + 50;
        const y = i * itemGapY + 50;
        positioned.push({
          ...item.n,
          position: { x, y },
        });
      });
    });

  // if some nodes weren't grouped (no path), place them after
  if (positioned.length < nodes.length) {
    nodes.forEach((n) => {
      if (!positioned.find((p) => p.id === n.id)) {
        positioned.push({
          ...n,
          position: { x: 0, y: positioned.length * itemGapY + 50 },
        });
      }
    });
  }

  return positioned;
}

const FlowView = forwardRef(({ parsedJson, message, setMessage }, ref) => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [rfInstance, setRfInstance] = useState(null);

  useImperativeHandle(
    ref,
    () => ({
      fitView: () => {
        if (rfInstance?.fitView) rfInstance.fitView({ padding: 0.2 });
      },
    }),
    [rfInstance]
  );

  // build nodes & edges, with logging + auto-layout if positions missing
  useEffect(() => {
    console.log("FlowView: parsedJson", parsedJson);

    if (!parsedJson) {
      setNodes([]);
      setEdges([]);
      setMessage(null);
      return;
    }

    let mapped;
    try {
      mapped = mapJsonToFlow(parsedJson);
    } catch (e) {
      console.error("mapJsonToFlow ERROR", e);
      setMessage({ text: "Mapper failed — check console", type: "error" });
      return;
    }

    const mappedNodes = Array.isArray(mapped?.nodes) ? mapped.nodes : [];
    const mappedEdges = Array.isArray(mapped?.edges) ? mapped.edges : [];

    console.log("FlowView: mappedNodes", mappedNodes);
    console.log("FlowView: mappedEdges", mappedEdges);

    if (mappedNodes.length === 0) {
      setMessage({ text: "No nodes produced by mapper", type: "warn" });
      setNodes([]);
      setEdges([]);
      return;
    }

    // ensure unique ids and fallback labels
    const sanitizedNodes = mappedNodes.map((n, i) => ({
      id: String(n.id ?? `n-${i}`),
      position: n.position || null, // might be null -> auto layout later
      type: n.type || n.data?.type || "primitiveNode",
      data: {
        label: n.data?.label ?? n.data?.path ?? `node-${i}`,
        path: n.data?.path ?? "",
        value: n.data?.value,
        highlight: false,
        // optionally pass copy handler name; wiring happens in node component
        ...n.data,
      },
    }));

    // auto-layout if needed
    const nodesWithPos = autoLayout(sanitizedNodes);

    // sanitize edges: ensure sources/targets exist
    const nodeIds = new Set(nodesWithPos.map((n) => n.id));
    const sanitizedEdges = mappedEdges
      .map((e, i) => ({
        id: String(e.id ?? `e-${i}`),
        source: String(e.source),
        target: String(e.target),
        markerEnd: e.markerEnd ?? { type: MarkerType.ArrowClosed },
        ...e,
      }))
      .filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));

    setNodes(nodesWithPos);
    setEdges(sanitizedEdges);

    // fit view a bit later
    setTimeout(() => {
      try {
        rfInstance?.fitView({ padding: 0.2 });
      } catch (err) {
        /*ignore*/
      }
    }, 150);
  }, [parsedJson, rfInstance, setNodes, setEdges, setMessage]);

  // onInit handler
  const onInit = (instance) => {
    setRfInstance(instance);
  };

  // search same as before
  const searchRef = useRef();
  const handleSearch = () => {
    const q = (searchRef.current?.value || "").trim();
    if (!q) {
      setMessage(null);
      setNodes((nds) =>
        nds.map((n) => ({ ...n, data: { ...n.data, highlight: false } }))
      );
      return;
    }
    let normalized = q;
    if (!normalized.startsWith("$")) {
      if (normalized.startsWith(".")) normalized = "$" + normalized;
      else normalized = "$." + normalized;
    } else if (
      normalized.startsWith("$.") === false &&
      normalized.startsWith("$") === true
    ) {
      normalized = "$." + normalized.slice(1);
    }

    const matches = nodes.filter((n) => n.data?.path === normalized);
    if (matches.length === 0) {
      setMessage({ text: "No match found", type: "warn" });
      setNodes((nds) =>
        nds.map((n) => ({ ...n, data: { ...n.data, highlight: false } }))
      );
      return;
    }
    setMessage({ text: `Match found — ${matches.length}`, type: "success" });
    const matchedIds = new Set(matches.map((m) => m.id));
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: { ...n.data, highlight: matchedIds.has(n.id) },
      }))
    );

    const first = matches[0];
    try {
      if (rfInstance?.setCenter)
        rfInstance.setCenter(first.position.x, first.position.y, {
          zoom: rfInstance.getZoom ? rfInstance.getZoom() : 1.2,
        });
    } catch (e) {
      try {
        rfInstance?.fitView({ padding: 0.2 });
      } catch {}
    }
  };

  const handleExport = async () => {
    if (!reactFlowWrapper.current) {
      setMessage({ text: "Nothing to export", type: "warn" });
      return;
    }
    try {
      const dataUrl = await toPng(reactFlowWrapper.current, {
        cacheBust: true,
        backgroundColor: null,
      });
      const link = document.createElement("a");
      link.download = "json-tree.png";
      link.href = dataUrl;
      link.click();
    } catch (e) {
      setMessage({ text: "Export failed", type: "error" });
    }
  };

  return (
    <div className="flow-card card h-100 p-3">
      <div className="d-flex gap-2 align-items-center mb-2">
        <div className="input-group">
          <input
            type="text"
            ref={searchRef}
            className="form-control"
            placeholder="$.user.address.city"
          />
          <button className="btn btn-primary" onClick={handleSearch}>
            Search
          </button>
        </div>

        <div className="ms-auto d-flex gap-2">
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => rfInstance?.zoomIn?.()}
          >
            Zoom In
          </button>
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => rfInstance?.zoomOut?.()}
          >
            Zoom Out
          </button>
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => rfInstance?.fitView?.({ padding: 0.2 })}
          >
            Fit View
          </button>
          <button
            className="btn btn-outline-success btn-sm"
            onClick={handleExport}
          >
            Download PNG
          </button>
        </div>
      </div>

      <div
        ref={reactFlowWrapper}
        className="reactflow-wrapper"
        style={{ height: 520 }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          panOnDrag
          nodesDraggable
          onInit={onInit}
        >
          <Background gap={16} color="#ddd" />
          <Controls />
          <Panel position="top-right">
            {message && (
              <div className={`small p-2 rounded message ${message.type}`}>
                {message.text}
              </div>
            )}
          </Panel>

          <Panel position="top-right">
            <div className="d-flex align-items-center gap-2">
              <ThemeToggle />
              {message && (
                <div className={`small p-2 rounded message ${message.type}`}>
                  {message.text}
                </div>
              )}
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
});

export default FlowView;
