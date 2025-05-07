import React from 'react';
import ReactDOM from 'react-dom/client';
// If you have an App component, import it. Otherwise, create a placeholder below.
import App from './components/ERDEditor';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
