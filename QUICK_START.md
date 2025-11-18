# Hướng dẫn nhanh

## Cài đặt và chạy

```bash
# Cài đặt dependencies
npm install

# Chạy development server
npm run dev
```

Trình duyệt sẽ tự động mở tại `http://localhost:3000`

## Sử dụng trong project của bạn

```tsx
import { RichTextEditor } from './RichTextEditor';

function MyComponent() {
  const [content, setContent] = useState('');

  return (
    <RichTextEditor
      value={content}
      onChange={setContent}
      placeholder="Nhập nội dung..."
      height="500px"
    />
  );
}
```

## Tùy chỉnh Toolbar

```tsx
<RichTextEditor
  toolbar={[
    'bold', 'italic', 'underline',
    '|',  // Separator
    'alignLeft', 'alignCenter', 'alignRight',
    '|',
    'link', 'image'
  ]}
/>
```

## Tính năng

- ✅ Formatting cơ bản (Bold, Italic, Underline, Strike)
- ✅ Màu sắc (Font color, Background color)
- ✅ Căn chỉnh văn bản
- ✅ Danh sách (Ordered, Unordered)
- ✅ Chèn liên kết và hình ảnh
- ✅ Tạo bảng
- ✅ Undo/Redo
- ✅ Code view (Xem/chỉnh sửa HTML)
- ✅ Fullscreen mode
- ✅ Responsive design

