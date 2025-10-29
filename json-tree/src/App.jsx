import React, { useState, useCallback, useRef } from 'react';
import JsonInput from './components/JsonInput';
import FlowView from './components/FlowView';
import sampleJson from './sample.json';

function App() {
  const [jsonText, setJsonText] = useState(JSON.stringify(sampleJson, null, 2));
  const [treeData, setTreeData] = useState({ nodes: [], edges: [] });
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [message, setMessage] = useState(null);

  const flowRef = useRef();

  const handleGenerate = (parsed) => {
    // parsed is JS object
    setMessage(null);
    // FlowView will map to nodes/edges inside component,
    // but we can pass parsed down
    setTreeData({ nodes: [], edges: [], parsed });
  };

  const handleClear = () => {
    setJsonText('');
    setTreeData({ nodes: [], edges: [] });
    setMessage(null);
  };

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('theme', next);
  };

  return (
    <div className={`app-container ${theme}`}>
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="mb-0">JSON Tree Visualizer</h2>
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              id="themeToggle"
              checked={theme === 'dark'}
              onChange={toggleTheme}
            />
            <label className="form-check-label" htmlFor="themeToggle">
              Dark / Light
            </label>
          </div>
        </div>

        <div className="card p-3">
          <div className="row g-3">
            <div className="col-lg-5">
              <JsonInput
                jsonText={jsonText}
                setJsonText={setJsonText}
                onGenerate={handleGenerate}
                onClear={handleClear}
                setMessage={setMessage}
                sampleJson={sampleJson}
              />
            </div>

            <div className="col-lg-7">
              <FlowView
                parsedJson={treeData.parsed}
                message={message}
                setMessage={setMessage}
                ref={flowRef}
              />
            </div>
          </div>
        </div>

        <div className="mt-3 small text-muted">
          UI is responsive. Use the search box in the visualization to search by JSON path
          (e.g. <code>$.user.address.city</code>).
        </div>
      </div>
    </div>
  );
}

export default App;
