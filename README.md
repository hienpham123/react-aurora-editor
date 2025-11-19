# Custom Rich Text Editor

Editor văn bản phong phú tùy chỉnh tương tự SunEditor, được xây dựng với React và TypeScript.

## Tính năng

- ✨ **Formatting cơ bản**: In đậm, in nghiêng, gạch chân, gạch ngang
- 🎨 **Màu sắc**: Màu chữ và màu nền
- 📏 **Căn chỉnh**: Căn trái, căn giữa, căn phải, căn đều
- 📝 **Danh sách**: Danh sách có đánh số và không đánh số
- 🔗 **Liên kết**: Chèn và chỉnh sửa liên kết
- 🖼️ **Hình ảnh**: Chèn hình ảnh từ URL
- 📊 **Bảng**: Tạo và chỉnh sửa bảng
- ↶ **Undo/Redo**: Hoàn tác và làm lại
- 👁️ **Code View**: Xem và chỉnh sửa mã HTML
- ⛶ **Fullscreen**: Chế độ toàn màn hình
- 📱 **Responsive**: Tương thích với mọi thiết bị

## Cài đặt

```bash
npm install
```

## Chạy Development Server

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Sử dụng

```tsx
import { RichTextEditor } from './RichTextEditor';

function MyComponent() {
  const [content, setContent] = useState('');

  return (
    <RichTextEditor
      value={content}
      onChange={setContent}
      placeholder="Nhập nội dung..."
      height="400px"
    />
  );
}
```

## Props

| Prop | Type | Default | Mô tả |
|------|------|---------|-------|
| `value` | `string` | `''` | Nội dung HTML của editor |
| `onChange` | `(html: string) => void` | - | Callback khi nội dung thay đổi |
| `placeholder` | `string` | `'Nhập nội dung...'` | Placeholder text |
| `height` | `string` | `'400px'` | Chiều cao của editor |
| `disabled` | `boolean` | `false` | Vô hiệu hóa editor |
| `toolbar` | `ToolbarButton[]` | - | Tùy chỉnh toolbar buttons |

## Toolbar Buttons

Các button có sẵn:
- `bold`, `italic`, `underline`, `strike`
- `fontSize`, `fontColor`, `backgroundColor`
- `alignLeft`, `alignCenter`, `alignRight`, `alignJustify`
- `unorderedList`, `orderedList`
- `link`, `image`, `table`
- `undo`, `redo`
- `codeView`, `fullscreen`

Sử dụng `'|'` để tạo separator trong toolbar.

## License

MIT

