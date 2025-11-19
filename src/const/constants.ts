import { ToolbarButton } from '../AuroraEditor';

export interface ColorOption {
  label: string;
  value: string;
}

export interface BlockFormat {
  value: string;
  label: string;
  tag: string;
}

export const fontColors: ColorOption[] = [
  // Row 1: Light/Pastel colors (7 colors)
  { label: 'Light Green', value: '#90EE90' },
  { label: 'Light Yellow', value: '#FFFFE0' },
  { label: 'Light Pink', value: '#FFB6C1' },
  { label: 'Light Purple', value: '#DDA0DD' },
  { label: 'Light Blue', value: '#87CEEB' },
  { label: 'Light Cyan', value: '#E0FFFF' },
  { label: 'Light Salmon', value: '#FFA07A' },
  // Row 2: Vibrant colors (7 colors)
  { label: 'Green', value: '#00CC00' },
  { label: 'Yellow', value: '#FFFF00' },
  { label: 'Red', value: '#FF0000' },
  { label: 'Purple', value: '#6600CC' },
  { label: 'Blue', value: '#0066FF' },
  { label: 'Cyan', value: '#00FFFF' },
  { label: 'Orange', value: '#FF6600' },
  // Row 3: Darker/Muted colors (7 colors)
  { label: 'Dark Green', value: '#006400' },
  { label: 'Olive', value: '#808000' },
  { label: 'Crimson', value: '#DC143C' },
  { label: 'Violet', value: '#8A2BE2' },
  { label: 'Navy', value: '#000080' },
  { label: 'Teal', value: '#008080' },
  { label: 'Brown', value: '#A52A2A' },
  // Row 4: Grayscale/Special (5 colors - removed 2 to make room for buttons)
  { label: 'Black', value: '#000000' },
  { label: 'Dark Gray', value: '#333333' },
  { label: 'Gray', value: '#808080' },
  { label: 'Light Gray', value: '#D3D3D3' },
  { label: 'White', value: '#FFFFFF' }
];

export const blockFormats: BlockFormat[] = [
  { value: 'paragraph', label: 'Paragraph', tag: 'p' },
  { value: 'heading1', label: 'Heading 1', tag: 'h1' },
  { value: 'heading2', label: 'Heading 2', tag: 'h2' },
  { value: 'heading3', label: 'Heading 3', tag: 'h3' },
  { value: 'heading4', label: 'Heading 4', tag: 'h4' },
  { value: 'heading5', label: 'Heading 5', tag: 'h5' },
  { value: 'heading6', label: 'Heading 6', tag: 'h6' },
  { value: 'preformatted', label: 'Preformatted', tag: 'pre' }
];

export interface AlignmentOption {
  value: string;
  label: string;
  command: string;
}

export const alignments: AlignmentOption[] = [
  { value: 'left', label: 'Left', command: 'justifyLeft' },
  { value: 'center', label: 'Center', command: 'justifyCenter' },
  { value: 'right', label: 'Right', command: 'justifyRight' },
  { value: 'justify', label: 'Justify', command: 'justifyFull' }
];

export const getButtonConfig = (button: ToolbarButton) => {
  const configs: Record<ToolbarButton, { icon: string; title: string }> = {
    bold: { icon: 'B', title: 'In đậm (Ctrl+B)' },
    italic: { icon: 'I', title: 'In nghiêng (Ctrl+I)' },
    underline: { icon: 'U', title: 'Gạch chân (Ctrl+U)' },
    strike: { icon: 'S', title: 'Gạch ngang' },
    fontSize: { icon: 'Aa', title: 'Kích thước font' },
    fontColor: { icon: 'A', title: 'Màu chữ' },
    backgroundColor: { icon: '▦', title: 'Màu nền' },
    alignLeft: { icon: '⬅', title: 'Căn trái' },
    alignCenter: { icon: '⬌', title: 'Căn giữa' },
    alignRight: { icon: '➡', title: 'Căn phải' },
    alignJustify: { icon: '⬌', title: 'Căn đều' },
    unorderedList: { icon: '•', title: 'Danh sách không đánh số' },
    orderedList: { icon: '1.', title: 'Danh sách đánh số' },
    link: { icon: '🔗', title: 'Chèn liên kết' },
    image: { icon: '🖼', title: 'Chèn hình ảnh' },
    table: { icon: '⊞', title: 'Chèn bảng' },
    undo: { icon: 'undo', title: 'Hoàn tác (Ctrl+Z)' },
    redo: { icon: 'redo', title: 'Làm lại (Ctrl+Y)' },
    codeView: { icon: '</>', title: 'Xem mã nguồn' },
    fullscreen: { icon: '⛶', title: 'Toàn màn hình' }
  };
  return configs[button];
};

