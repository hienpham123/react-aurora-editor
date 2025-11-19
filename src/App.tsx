import React, { useState } from 'react';
import AuroraEditor from './AuroraEditor';
import './App.css';

const _content = `
  <p>Chào mừng đến với Aurora Editor!</p>
  <p>Hãy thử các tính năng formatting trong toolbar.</p>
  <ul>
    <li>Item 1</li>
    <li>Item 2</li>
    <li>Item 3</li>
  </ul>
  <br />
    <p>Chào mừng đến với Aurora Editor!</p>
  <p>Hãy thử các tính năng formatting trong toolbar.</p>
  <ul>
    <li>Item 1</li>
    <li>Item 2</li>
    <li>Item 3</li>
  </ul>
  <br />
    <p>Chào mừng đến với Aurora Editor!</p>
  <p>Hãy thử các tính năng formatting trong toolbar.</p>
  <ul>
    <li>Item 1</li>
    <li>Item 2</li>
    <li>Item 3</li>
  </ul>
`;
function App() {
  const [content, setContent] = useState<string>(_content);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Aurora Editor</h1>
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

