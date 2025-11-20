import React, { useState } from 'react';
import AuroraEditor from './AuroraEditor';
import './App.css';

const _content = `<h1>Tiêu đề chính - Heading 1</h1>

<p>Đây là đoạn văn đầu tiên với <strong>text in đậm</strong> và <em>text in nghiêng</em> và <u>text gạch chân</u>. Đoạn văn này có nhiều nội dung để test các tính năng của editor.</p>

<h2>Tiêu đề phụ - Heading 2</h2>

<p style="font-size: 16px;">Đoạn văn này có font size 16px. Nội dung dài để test việc thay đổi format block và font size. <span style="color: #ff0000;">Text màu đỏ</span> và <span style="color: #0066ff;">text màu xanh</span>.</p>

<h3>Tiêu đề nhỏ hơn - Heading 3</h3>

<div style="font-size: 14px;">Đây là một div với font size 14px. Div này có thể chứa nhiều nội dung và các element con.</div>

<blockquote style="border-left: 3px solid #ccc; padding-left: 10px; font-style: italic;">
  Đây là một blockquote. Nội dung trong blockquote thường được hiển thị với style đặc biệt để làm nổi bật.
</blockquote>

<ul>
  <li><p>List item 1 với paragraph bên trong</p></li>
  <li><h4>List item 2 với heading 4</h4></li>
  <li><div style="font-size: 12px;">List item 3 với div có font size 12px</div></li>
  <li>List item 4 chỉ có text thuần</li>
  <li><p style="color: #00cc00;">List item 5 với paragraph màu xanh lá</p></li>
</ul>

<ol>
  <li><p>Ordered list item 1</p></li>
  <li><h5>Ordered list item 2 với heading 5</h5></li>
  <li><div>Ordered list item 3 với div</div></li>
  <li>Ordered list item 4 text thuần</li>
</ol>

<h4>Heading 4 - Test Format Block</h4>

<p>Đoạn văn này để test việc thay đổi format block. Bạn có thể chọn đoạn này và thay đổi thành heading, div, blockquote, code, v.v.</p>

<pre style="background-color: #f5f5f5; padding: 10px; border-radius: 4px; font-family: monospace;">
// Đây là code block
function testFunction() {
  console.log("Hello World");
  return true;
}
</pre>

<p style="font-size: 18px; color: #6600cc;">Đoạn văn với font size 18px và màu tím. Nội dung dài để test selection và format change.</p>

<div style="font-size: 20px;">
  <p>Div chứa paragraph với font size 20px. Đây là test case phức tạp hơn.</p>
  <p>Paragraph thứ hai trong cùng một div.</p>
</div>

<h5>Heading 5 - Test Selection</h5>

<p>Đoạn văn này để test selection across multiple blocks. Bạn có thể select từ đây đến các đoạn sau để test việc thay đổi format cho nhiều blocks cùng lúc.</p>

<p style="font-size: 14px;">Đoạn văn thứ hai trong selection test.</p>

<p style="font-size: 16px; color: #ff6600;">Đoạn văn thứ ba với màu cam.</p>

<h6>Heading 6 - Smallest Heading</h6>

<ul>
  <li><p style="font-size: 13px;">List item với paragraph font size 13px</p></li>
  <li><h6>List item với heading 6</h6></li>
  <li><blockquote>List item với blockquote bên trong</blockquote></li>
  <li><div style="font-size: 15px; color: #333;">List item với div có style</div></li>
</ul>

<p>Đoạn văn cuối cùng để test. Nội dung này có <strong>bold text</strong>, <em>italic text</em>, <u>underlined text</u>, và <span style="text-decoration: line-through;">strikethrough text</span>.</p>

<div style="font-size: 24px; color: #0066ff;">
  <h2>Heading 2 trong div lớn</h2>
  <p>Paragraph trong div lớn với font size 24px</p>
  <ul>
    <li><p>Nested list item 1</p></li>
    <li><h3>Nested list item 2 với heading 3</h3></li>
  </ul>
</div>

<blockquote>
  <p>Blockquote chứa paragraph. Nội dung này để test format block trong blockquote.</p>
  <p>Paragraph thứ hai trong blockquote.</p>
</blockquote>

<p style="font-size: 11px;">Đoạn văn với font size nhỏ 11px để test font size dropdown.</p>

<p style="font-size: 28px;">Đoạn văn với font size lớn 28px.</p>

<div>
  <h1>Heading 1 trong div</h1>
  <h2>Heading 2 trong div</h2>
  <h3>Heading 3 trong div</h3>
  <p>Paragraph trong div</p>
  <blockquote>Blockquote trong div</blockquote>
</div>

<p>Đoạn văn cuối cùng với nhiều <strong>formatting</strong> <em>khác nhau</em> để <u>test</u> tất cả các tính năng của editor. Bạn có thể select bất kỳ phần nào và thay đổi format block hoặc font size.</p>`;
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

