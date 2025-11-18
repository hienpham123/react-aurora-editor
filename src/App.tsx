import React, { useState } from 'react';
import AuroraEditor from './AuroraEditor';
import './App.css';

function App() {
  const [content, setContent] = useState('<p>Chào mừng đến với Aurora Editor!</p><p>Hãy thử các tính năng formatting trong toolbar.</p>');

  return (
    <div className="app">
      <header className="app-header">
        <h1>Aurora Editor</h1>
        <p>Editor tùy chỉnh tương tự SunEditor</p>
      </header>
      
      <main className="app-main">
        <div className="editor-container">
          <AuroraEditor
            value={content}
            onChange={setContent}
            placeholder="Nhập nội dung của bạn ở đây..."
            height="500px"
          />
        </div>
        
        <div className="preview-section">
          <h2>Preview HTML:</h2>
          <pre className="html-preview">{content}</pre>
        </div>
      </main>
    </div>
  );
}

export default App;

