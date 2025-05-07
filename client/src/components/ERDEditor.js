import React, { useState } from 'react';
import styles from './ERDEditor.module.css';
import drawerStyles from './Drawer.module.css';

//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
const ERDEditor = () => {
  // Pagination state per table
  const [tablePage, setTablePage] = useState({});
  // Dropdown state for selected table
  const [selectedTable, setSelectedTable] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imageSchema, setImageSchema] = useState('');
  const [uploading, setUploading] = useState(false);

  // Mode: 'erd' or 'schema'
  const [mode, setMode] = useState('erd');

  // For schema input and mock data
  const [schemaInput, setSchemaInput] = useState('');
  const [mockData, setMockData] = useState(null);
  const [mockLoading, setMockLoading] = useState(false);
  const [mockError, setMockError] = useState('');
  // Number of records (default 10)
  const [numRecords, setNumRecords] = useState(10);

  // Schema file upload
  const [schemaFile, setSchemaFile] = useState(null);

  // Download current table as JSON
  const handleDownloadJson = () => {
    if (!table || !rows.length) return;
    const dataStr = JSON.stringify(rows, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${table}_mock_data.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download current table as SQL insert statements
  const handleDownloadSql = () => {
    if (!table || !rows.length) return;
    const columns = Object.keys(rows[0]);
    const insertStatements = rows.map(row => {
      const values = columns.map(col => {
        const val = row[col];
        if (typeof val === 'string') return `"${val.replace(/"/g, '""')}`;
        if (val === null || val === undefined) return 'NULL';
        return val;
      });
      return `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')});`;
    });
    const blob = new Blob([insertStatements.join('\n')], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${table}_mock_data.sql`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle schema file upload
  const handleSchemaFileUpload = async (file) => {
    const text = await file.text();
    setSchemaInput(text);
  };

  // Table and pagination logic
  const table = selectedTable || (mockData && Object.keys(mockData)[0]);
  const rows = table && mockData ? mockData[table] : [];
  const rowsPerPage = 20;
  const currentPage = table && tablePage[table] ? tablePage[table] : 1;
  const totalPages = rows.length > 0 ? Math.ceil(rows.length / rowsPerPage) : 1;
  const pagedRows = rows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <>
      <nav className={styles.navbar}>
        <span style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14}}>
          <svg height="32" width="32" viewBox="0 0 32 32" fill="#fff" style={{marginRight: 6}} xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="16" fill="#388e3c"/>
            <text x="16" y="22" textAnchor="middle" fontSize="16" fill="#fff" fontFamily="Roboto, sans-serif">SD</text>
          </svg>
          <span>AI Synthetic Data Generator</span>
        </span>
      </nav>
      <div style={{display: 'flex', minHeight: '100vh'}}>
        {/* Left Drawer */}
        <aside className={drawerStyles.drawer}>
          <div className={drawerStyles.drawerTitle}>Upload</div>
          <div className={drawerStyles.drawerSection}>
            <div className={drawerStyles.drawerLabel}>Select input type</div>
            <select
              className={drawerStyles.drawerInput}
              style={{marginBottom: 18, fontWeight: 500}}
              value={mode}
              onChange={e => {
                setMode(e.target.value);
                setImageFile(null);
                setSchemaFile(null);
                setSchemaInput('');
              }}
            >
              <option value="erd">ER Diagram (JPEG/PNG)</option>
              <option value="schema">Schema Definition File (.sql/.txt)</option>
            </select>
            {mode === 'erd' && (
              <>
                <input
                  className={drawerStyles.drawerInput}
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={e => setImageFile(e.target.files[0])}
                  style={{marginBottom: 10}}
                />
              </>
            )}
            {mode === 'schema' && (
              <>
                <input
                  className={drawerStyles.drawerInput}
                  type="file"
                  accept=".sql,.txt"
                  onChange={e => {
                    const file = e.target.files[0];
                    setSchemaFile(file);
                    if (file) handleSchemaFileUpload(file);
                  }}
                  style={{marginBottom: 10}}
                />
              </>
            )}
            <button
              className={drawerStyles.drawerBtn}
              onClick={async () => {
                if (mode === 'erd') {
                  if (!imageFile) return;
                  setUploading(true);
                  setImageSchema('');
                  setMockData(null);
                  setMockError('');
                  const formData = new FormData();
                  formData.append('diagram', imageFile);
                  try {
                    const response = await fetch('http://localhost:3001/api/convert-erd-image', {
                      method: 'POST',
                      body: formData,
                    });
                    const data = await response.json();
                    setImageSchema(data.schema);
                  } catch (err) {
                    setImageSchema('Error uploading image or receiving schema.');
                  } finally {
                    setUploading(false);
                  }
                } else if (mode === 'schema') {
                  if (!schemaFile) return;
                  setMockError('');
                  setMockData(null);
                  setMockLoading(true);
                  setImageSchema('');
                  try {
                    const text = await schemaFile.text();
                    setSchemaInput(text); // keep textarea in sync
                    const res = await fetch('http://localhost:3001/api/generate-mock-data', {
                      headers: { 'Content-Type': 'application/json' },
                      method: 'POST',
                      body: JSON.stringify({ schema: text, rows: numRecords })
                    });
                    const data = await res.json();
                    if (data.mockData) setMockData(data.mockData);
                    else setMockError(data.error || 'Unknown error.');
                  } catch (e) {
                    setMockError('Failed to generate mock data.');
                  } finally {
                    setMockLoading(false);
                  }
                }
              }}
              disabled={
                (mode === 'erd' && (!imageFile || uploading)) ||
                (mode === 'schema' && (!schemaFile || mockLoading))
              }
            >
              {mode === 'erd' ? (uploading ? 'Uploading...' : 'Submit ERD Image') : (mockLoading ? 'Processing...' : 'Submit Schema File')}
            </button>
            {mode === 'schema' && schemaInput && (
              <div style={{margin:'10px 0 0 0', width:'100%'}}>
                <div style={{fontWeight:500, color:'#fff', marginBottom:4, fontSize:14, fontFamily:'Roboto, sans-serif'}}>Schema Preview:</div>
                <pre style={{background:'#f6f6fa', color:'#232526', fontSize:13, padding:10, borderRadius:6, maxHeight:450, overflowY:'auto', border:'1px solid #d6d6ee', whiteSpace:'pre-wrap'}}>{schemaInput}</pre>
              </div>
            )}
          </div>
        </aside>
        {/* Main Content */}
        <main className={styles.mainContentWithNav} style={{marginLeft: 260, flex: 1, padding: '36px 5vw 36px 5vw', background: '#f8f9fa', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start'}}>
          <div style={{width: '100%', marginTop: 30}}>
            {/* Number of records input (only for schema mode) */}
            {/* {mode === 'schema' && (
              <div style={{display:'flex', alignItems:'center', marginBottom:18, justifyContent:'flex-end'}}>
                <label style={{fontWeight:500, marginRight:8}}>Number of records:</label>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={numRecords}
                  onChange={e => setNumRecords(Math.max(1, Math.min(1000, Number(e.target.value) || 1)))}
                  style={{width:70, padding:'6px 10px', border:'1px solid #b7e4c7', borderRadius:4, fontWeight:500, marginRight:10}}
                />
                <button
                  style={{padding:'6px 14px', border:'none', background:'#e0e7ff', color:'#3730a3', borderRadius:5, fontWeight:500, cursor:'pointer'}}
                  disabled={mockLoading || !schemaInput}
                  onClick={async () => {
                    if (!schemaInput) return;
                    setMockError('');
                    setMockData(null);
                    setMockLoading(true);
                    try {
                      const res = await fetch('http://localhost:3001/api/generate-mock-data', {
                        headers: { 'Content-Type': 'application/json' },
                        method: 'POST',
                        body: JSON.stringify({ schema: schemaInput, rows: numRecords })
                      });
                      const data = await res.json();
                      if (data.mockData) setMockData(data.mockData);
                      else setMockError(data.error || 'Unknown error.');
                    } catch (e) {
                      setMockError('Failed to generate mock data.');
                    } finally {
                      setMockLoading(false);
                    }
                  }}
                >Regenerate</button>
              </div>
            )} */}
            {/* Loader: Show while uploading or processing */}
            {(uploading || mockLoading) && (
              <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'60vh',width:'100%'}}>
                <div className={styles.circleLoader} />
              </div>
            )}
            {/* Output: Schema from Image */}
            {!uploading && !mockLoading && imageSchema && (
              <div className={styles.resultBox} style={{background: '#fff', border: '1.5px solid #b2b2ff', borderRadius: 10, marginBottom: 36}}>
                <h3 style={{marginTop:0, color:'#5b5b9a', fontWeight:700}}>Schema from Image</h3>
                <pre style={{fontSize: 15, color:'#232526', background:'#f4f6fb', padding:18, borderRadius:8, }}>{imageSchema}</pre>
              </div>
            )}
            {/* Output: Mock Data */}
            {!uploading && !mockLoading && mockError && (
              <div style={{background:'#fff0f0', color:'#a33', border:'1.5px solid #fbb', borderRadius:8, padding:18, marginBottom:24, fontWeight:500}}>
                {mockError}
              </div>
            )}
            {!uploading && !mockLoading && mockData && (
  <div className={styles.resultBox} style={{background: '#fff',  borderRight: 'none', borderRadius: 10}}>
    {/* Table selection if multiple tables */}
    {Object.keys(mockData).length > 1 && (
      <div style={{marginBottom: 18}}>
        <label style={{fontWeight: 500, marginRight: 10}}>Select Table:</label>
        <select
          value={selectedTable || Object.keys(mockData)[0]}
          onChange={e => {
            setSelectedTable(e.target.value);
            setTablePage(p => ({ ...p, [e.target.value]: 1 }));
          }}
          style={{padding: '6px 12px', borderRadius: 4, border: '1px solid #b7e4c7', fontWeight: 500}}
        >
          {Object.keys(mockData).map(table => (
            <option key={table} value={table}>{table}</option>
          ))}
        </select>
      </div>
    )}
    {/* Show table for selectedTable, or only table if one */}
    {table && rows.length > 0 && (
      <div style={{marginBottom:32}}>
        <div style={{display:'flex', alignItems:'center', marginBottom:10}}>
          <div style={{fontWeight:600, fontSize:18, color:'#227a5e', marginRight:16}}>{table}</div>
          <button className={styles.blueBtn} onClick={handleDownloadJson}>Download JSON</button>
          <button className={styles.blueBtn} onClick={handleDownloadSql}>Download SQL</button>
        </div>
        <div className={styles.tableScrollContainer}>
          <table style={{borderCollapse:'collapse', width:'100%', minWidth:'900px', background:'#f7fafc', fontSize:15}}>
            <thead>
              <tr>
                {Object.keys(rows[0] || {}).map(col => (
                  <th key={col} style={{border:'1px solid #b7e4c7', background:'#d1fae5', padding:'6px 12px', fontWeight:600}}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedRows.map((row, idx) => (
                <tr key={idx}>
                  {Object.values(row).map((val, i) => (
                    <td key={i} style={{border:'1px solid #e2e8f0', padding:'6px 12px', color:'#374151'}}>{val}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{display:'flex', justifyContent:'center', alignItems:'center', marginTop:18}}>
            <button onClick={() => setTablePage(p => ({ ...p, [table]: Math.max(1, (p[table]||1)-1) }))} disabled={currentPage===1} style={{marginRight:10, padding:'6px 14px', border:'none', background:'#e0e7ff', color:'#3730a3', borderRadius:5, fontWeight:500, cursor: currentPage===1 ? 'not-allowed' : 'pointer'}}>Prev</button>
            <span style={{fontWeight:500, fontSize:15, margin:'0 8px'}}>Page {currentPage} of {totalPages}</span>
            <button onClick={() => setTablePage(p => ({ ...p, [table]: Math.min(totalPages, (p[table]||1)+1) }))} disabled={currentPage===totalPages} style={{marginLeft:10, padding:'6px 14px', border:'none', background:'#e0e7ff', color:'#3730a3', borderRadius:5, fontWeight:500, cursor: currentPage===totalPages ? 'not-allowed' : 'pointer'}}>Next</button>
          </div>
        )}
      </div>
    )}
  </div>
)}
            </div> 
        </main>
        </div> 
        </>
      );
    }

export default ERDEditor;