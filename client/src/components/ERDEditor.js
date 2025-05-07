import React, { useState } from 'react';
import styles from './ERDEditor.module.css';
import drawerStyles from './Drawer.module.css';


//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
const ERDEditor = () => {
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

  // Schema file upload
  const [schemaFile, setSchemaFile] = useState(null);

  // Handle schema file upload
  const handleSchemaFileUpload = async (file) => {
    const text = await file.text();
    setSchemaInput(text);
  };

  return (
    <>
      <nav className={styles.navbar}>
        AI Synthetic Data Generator
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
                {schemaInput && (
                  <div style={{margin:'10px 0 0 0', width:'100%'}}>
                    <div style={{fontWeight:500, color:'#5b5b9a', marginBottom:4, fontSize:14}}>Schema Preview:</div>
                    <pre style={{background:'#f6f6fa', color:'#232526', fontSize:13, padding:10, borderRadius:6, maxHeight:180, overflowY:'auto', border:'1px solid #d6d6ee', whiteSpace:'pre-wrap'}}>{schemaInput}</pre>
                  </div>
                )}
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
                      method: 'POST',
                      headers: { 'Content-Type': 'text/plain' },
                      body: text,
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
          </div>
        </aside>
        {/* Main Content */}
        <main className={styles.mainContentWithNav} style={{marginLeft: 290, flex: 1, padding: '36px 5vw 36px 5vw', background: '#f8f9fa', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start'}}>
          <div style={{width: '100%', marginTop: 30}}>
            {/* Loader: Show while uploading or processing */}
            {(uploading || mockLoading) && (
              <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'60vh',width:'100%'}}>
                <div className={styles.circleLoader} />
              </div>
            )}
            {/* Output: Schema from Image */}
            {!uploading && !mockLoading && imageSchema && (
              <div className={styles.resultBox} style={{background: '#fff', border: '1.5px solid #b2b2ff', boxShadow: '0 2px 16px #e2e6f7', borderRadius: 10, marginBottom: 36}}>
                <h3 style={{marginTop:0, color:'#5b5b9a', fontWeight:700}}>Schema from Image</h3>
                <pre style={{fontSize: 15, color:'#232526', background:'#f4f6fb', padding:18, borderRadius:8, overflowX:'auto'}}>{imageSchema}</pre>
              </div>
            )}
            {/* Output: Mock Data */}
            {!uploading && !mockLoading && mockError && (
              <div style={{background:'#fff0f0', color:'#a33', border:'1.5px solid #fbb', borderRadius:8, padding:18, marginBottom:24, fontWeight:500}}>
                {mockError}
              </div>
            )}
            {!uploading && !mockLoading && mockData && (
              <div className={styles.resultBox} style={{background: '#fff', border: '1.5px solid #6ee7b7', boxShadow: '0 2px 16px #e2f7e6', borderRadius: 10}}>
                <h3 style={{marginTop:0, color:'#227a5e', fontWeight:700}}>Synthetic Mock Data</h3>
                {/* Render as tables if possible, else fallback to JSON */}
                {Object.keys(mockData).map(table => (
                  <div key={table} style={{marginBottom:32}}>
                    <div style={{fontWeight:600, fontSize:18, color:'#227a5e', marginBottom:6}}>{table}</div>
                    <div className={styles.tableScrollContainer}>
                      <table style={{borderCollapse:'collapse', width:'100%', minWidth:'900px', background:'#f7fafc', fontSize:15}}>
                        <thead>
                          <tr>
                            {Object.keys(mockData[table][0] || {}).map(col => (
                              <th key={col} style={{border:'1px solid #b7e4c7', background:'#d1fae5', padding:'6px 12px', fontWeight:600}}>{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {mockData[table].map((row, idx) => (
                            <tr key={idx}>
                              {Object.values(row).map((val, i) => (
                                <td key={i} style={{border:'1px solid #e2e8f0', padding:'6px 12px', color:'#374151'}}>{val}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* If nothing to show */}
            {!uploading && !mockLoading && !imageSchema && !mockData && !mockError && (
              <div style={{color:'#aaa', fontSize:18, marginTop:60, textAlign:'center'}}>Output will appear here after you upload and process your ERD or schema.</div>
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default ERDEditor;
