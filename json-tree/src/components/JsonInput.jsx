import React, { useState } from 'react';

export default function JsonInput({ jsonText, setJsonText, onGenerate, onClear, setMessage, sampleJson }) {
  const [error, setError] = useState(null);

  const handleGenerate = () => {
    setError(null);
    setMessage(null);
    if (!jsonText || jsonText.trim() === '') {
      setError('JSON input is empty.');
      return;
    }
    try {
      const parsed = JSON.parse(jsonText);
      onGenerate(parsed);
    } catch (e) {
      setError(`Invalid JSON: ${e.message}`);
    }
  };

  const loadSample = () => {
    const s = JSON.stringify(sampleJson, null, 2);
    setJsonText(s);
    setError(null);
  };

  return (
    <div>
      <label className="form-label">Paste or type JSON data</label>
      <textarea
        className="form-control monospace"
        rows={18}
        value={jsonText}
        onChange={(e) => setJsonText(e.target.value)}
        placeholder='{"user": {"id": 1, "name": "John"}}'
      />

      <div className="d-flex gap-2 mt-2">
        <button className="btn btn-primary" onClick={handleGenerate}>Generate Tree</button>
        <button className="btn btn-outline-secondary" onClick={loadSample}>Load Sample</button>
        <button className="btn btn-outline-danger" onClick={() => { onClear(); setError(null); }}>Clear</button>
      </div>

      {error && <div className="mt-2 text-danger">{error}</div>}
    </div>
  );
}
