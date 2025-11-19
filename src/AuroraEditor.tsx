import React, { useRef, useEffect, useState, useCallback, useLayoutEffect } from 'react';
import './AuroraEditor.css';
import { Toolbar } from './components/Toolbar';
import { EditorContent } from './components/EditorContent';
import { ColorPicker, PickerColor } from './components/ColorPicker';
import { ImageModal } from './components/ImageModal';
import { fontColors } from './const/constants';
import { hexToRgb, rgbToHsl, hslToRgb, rgbToHex } from './utils/utils';

export interface AuroraEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  height?: string;
  disabled?: boolean;
  toolbar?: (ToolbarButton | '|')[];
}

export type ToolbarButton =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strike'
  | 'fontSize'
  | 'fontColor'
  | 'backgroundColor'
  | 'alignLeft'
  | 'alignCenter'
  | 'alignRight'
  | 'alignJustify'
  | 'unorderedList'
  | 'orderedList'
  | 'link'
  | 'image'
  | 'table'
  | 'undo'
  | 'redo'
  | 'codeView'
  | 'fullscreen';

const AuroraEditor: React.FC<AuroraEditorProps> = ({
  value = '',
  onChange,
  placeholder = 'Nhập nội dung...',
  height = '400px',
  disabled = false,
  toolbar = ([
    'undo', 'redo',
    '|',
    'bold', 'italic', 'underline', 'strike',
    '|',
    'fontSize', 'fontColor', 'backgroundColor',
    '|',
    'alignLeft', 'alignCenter', 'alignRight', 'alignJustify',
    '|',
    'unorderedList', 'orderedList',
    '|',
    'link', 'image', 'table',
    '|',
    'codeView', 'fullscreen'
  ] as (ToolbarButton | '|')[])
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCodeView, setShowCodeView] = useState(false);
  const [codeContent, setCodeContent] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const [showBlockFormatDropdown, setShowBlockFormatDropdown] = useState(false);
  const [showFontColorDropdown, setShowFontColorDropdown] = useState(false);
  const [fontSizeUpdateTrigger, setFontSizeUpdateTrigger] = useState(0);
  const isApplyingFormatRef = useRef(false);
  const [hoveredColor, setHoveredColor] = useState<string | null>(null);
  const [hoveredColorPosition, setHoveredColorPosition] = useState<{ x: number; y: number } | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pickerColor, setPickerColor] = useState({ h: 240, s: 100, l: 50, r: 35, g: 52, b: 119, hex: '#233477' });
  const isSelectingColorRef = useRef(false);
  const savedColorPickerSelectionRef = useRef<Range | null>(null);

  // Undo/Redo history
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const maxHistorySize = 50;
  const isUndoRedoRef = useRef(false);
  const saveHistoryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const attachImageResizeHandlers = useCallback(() => {
    if (!editorRef.current) return;

    const images = editorRef.current.querySelectorAll('img');
    images.forEach((img) => {
      // Only update if not already set up
      if (img.style.cursor === 'pointer' && img.onclick) return;

      img.style.cursor = 'pointer';
      img.classList.remove('hh-selected');
      img.onclick = (e) => {
        e.stopPropagation();
        // Remove selected class from all images
        images.forEach(i => i.classList.remove('hh-selected'));
        // Add selected class to clicked image
        img.classList.add('hh-selected');
        setSelectedImage(img as HTMLImageElement);
      };
    });
  }, []);

  // Initialize history when component mounts
  useEffect(() => {
    if (editorRef.current && historyRef.current.length === 0) {
      const initialContent = editorRef.current.innerHTML || value || '';
      historyRef.current = [initialContent];
      historyIndexRef.current = 0;
    }
  }, []); // Only run once on mount

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      isUndoRedoRef.current = true;
      editorRef.current.innerHTML = value;

      // Initialize history with current value if empty
      if (historyRef.current.length === 0) {
        historyRef.current = [value];
        historyIndexRef.current = 0;
      }

      // Re-attach image resize handlers after content update (debounced)
      const timeoutId = setTimeout(() => {
        attachImageResizeHandlers();
        isUndoRedoRef.current = false;
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [value, attachImageResizeHandlers]);

  // Save current state to history
  const saveToHistory = useCallback(() => {
    if (!editorRef.current || isUndoRedoRef.current) return;

    const currentContent = editorRef.current.innerHTML;
    const history = historyRef.current;
    const currentIndex = historyIndexRef.current;

    // Initialize history if empty
    if (history.length === 0) {
      history.push(currentContent);
      historyIndexRef.current = 0;
      return;
    }

    // Don't save if content hasn't changed
    if (currentIndex >= 0 && currentIndex < history.length && history[currentIndex] === currentContent) {
      return;
    }

    // Remove any future history if we're not at the end
    if (currentIndex >= 0 && currentIndex < history.length - 1) {
      history.splice(currentIndex + 1);
    }

    // Add new state
    history.push(currentContent);

    // Limit history size
    if (history.length > maxHistorySize) {
      history.shift();
      // Don't change index if we removed from beginning
    } else {
      historyIndexRef.current = history.length - 1;
    }
  }, []);

  const handleContentChange = useCallback(() => {
    if (editorRef.current && onChange) {
      onChange(editorRef.current.innerHTML);
    }

    // Save history with debounce for typing, but immediate for programmatic changes
    // The debounce helps avoid saving on every keystroke
    if (saveHistoryTimeoutRef.current) {
      clearTimeout(saveHistoryTimeoutRef.current);
    }

    saveHistoryTimeoutRef.current = setTimeout(() => {
      saveToHistory();
    }, 300);
  }, [onChange, saveToHistory]);

  // Cleanup headings function (only when not applying format from dropdown)
  const cleanupHeadings = useCallback(() => {
    if (!editorRef.current || isApplyingFormatRef.current) return;
    
    const headings = editorRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6');
    if (headings.length > 0) {
      headings.forEach((heading) => {
        const p = document.createElement('p');
        while (heading.firstChild) {
          p.appendChild(heading.firstChild);
        }
        heading.parentNode?.replaceChild(p, heading);
      });
      handleContentChange();
    }
  }, [handleContentChange]);

  // Setup image resize handlers and cleanup observer
  useEffect(() => {
    attachImageResizeHandlers();
    
    // MutationObserver to watch for heading creation
    const observer = new MutationObserver((mutations) => {
      let shouldCleanup = false;
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            const tagName = element.tagName?.toLowerCase();
            if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName || '')) {
              shouldCleanup = true;
            }
            // Also check children
            const headings = element.querySelectorAll?.('h1, h2, h3, h4, h5, h6');
            if (headings && headings.length > 0) {
              shouldCleanup = true;
            }
          }
        });
      });
      
      if (shouldCleanup) {
        // Use setTimeout to avoid infinite loop
        setTimeout(() => {
          cleanupHeadings();
        }, 0);
      }
    });

    if (editorRef.current) {
      observer.observe(editorRef.current, {
        childList: true,
        subtree: true
      });
    }
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      // Don't deselect if clicking on resize handle
      if (resizeHandleRef.current && resizeHandleRef.current.contains(target)) {
        return;
      }
      // Don't deselect if clicking on the selected image
      if (selectedImage && (selectedImage === target || selectedImage.contains(target))) {
        return;
      }
      // Check if click is inside toolbar
      const toolbar = document.querySelector('.hh-toolbar');
      const isClickInToolbar = toolbar ? toolbar.contains(target) : false;

      // Close block format dropdown if clicking outside
      if (showBlockFormatDropdown) {
        if (!isClickInToolbar) {
          // Click outside toolbar, definitely close
          setShowBlockFormatDropdown(false);
        } else {
          // Click in toolbar, check if it's on the block format dropdown or its button
          const blockFormatDropdown = document.querySelector('.hh-blockformat-dropdown');
          const isClickInBlockFormat = blockFormatDropdown ? blockFormatDropdown.contains(target) : false;

          if (!isClickInBlockFormat) {
            // Check if click is on the button by traversing up
            let isClickOnButton = false;
            if (target instanceof Element) {
              let current: Element | null = target;
              while (current && current !== toolbar) {
                if (current.classList && current.classList.contains('hh-toolbar-dropdown-wrapper')) {
                  if (current.querySelector('.hh-blockformat-dropdown')) {
                    isClickOnButton = true;
                    break;
                  }
                }
                current = current.parentElement;
              }
            }

            if (!isClickOnButton) {
              setShowBlockFormatDropdown(false);
            }
          }
        }
      }
      
      // Close font color dropdown if clicking outside (but not when selecting a color)
      if (!isSelectingColorRef.current && showFontColorDropdown) {
        if (!isClickInToolbar) {
          // Click outside toolbar, definitely close
          setShowFontColorDropdown(false);
          setHoveredColor(null);
          setHoveredColorPosition(null);
        } else {
          // Click in toolbar, check if it's on the color dropdown or its button
          const colorDropdown = document.querySelector('.hh-color-dropdown');
          const isClickInColorDropdown = colorDropdown ? colorDropdown.contains(target) : false;

          if (!isClickInColorDropdown) {
            // Check if click is on the button by traversing up
            let isClickOnButton = false;
            if (target instanceof Element) {
              let current: Element | null = target;
              while (current && current !== toolbar) {
                if (current.classList && current.classList.contains('hh-toolbar-dropdown-wrapper')) {
                  if (current.querySelector('.hh-color-dropdown')) {
                    isClickOnButton = true;
                    break;
                  }
                }
                current = current.parentElement;
              }
            }

            if (!isClickOnButton) {
              setShowFontColorDropdown(false);
              setHoveredColor(null);
              setHoveredColorPosition(null);
            }
          }
        }
      }
      
      // Don't close if clicking inside color picker modal
      const colorPickerDialog = document.querySelector('.hh-color-picker-dialog');
      if (colorPickerDialog && colorPickerDialog.contains(target)) {
        return;
      }
      
      if (editorRef.current && !editorRef.current.contains(target)) {
        setSelectedImage(null);
      }
    };

    // Use mousedown instead of click to catch events before stopPropagation
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      observer.disconnect();
    };
  }, [selectedImage, attachImageResizeHandlers, cleanupHeadings, showFontColorDropdown, showBlockFormatDropdown, isSelectingColorRef]);

  const execCommand = useCallback((command: string, value?: string) => {
    // Save state before executing command (except for undo/redo which are handled separately)
    if (command !== 'undo' && command !== 'redo' && editorRef.current) {
      saveToHistory();
    }
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleContentChange();
    if (command === 'fontSize') {
      setFontSizeUpdateTrigger(prev => prev + 1);
    }
  }, [handleContentChange, saveToHistory]);

  const handleUndo = useCallback(() => {
    if (!editorRef.current) return;

    const history = historyRef.current;
    let currentIndex = historyIndexRef.current;

    // Initialize history if empty
    if (history.length === 0) {
      const currentContent = editorRef.current.innerHTML;
      history.push(currentContent);
      historyIndexRef.current = 0;
      return;
    }

    // Can't undo if we're at the beginning
    if (currentIndex <= 0) {
      // If we're at index 0 but content has changed, save current state first
      const currentContent = editorRef.current.innerHTML;
      if (history[0] !== currentContent) {
        history.unshift(currentContent);
        historyIndexRef.current = 1;
        currentIndex = 1;
      } else {
        return; // Already at the beginning with same content
      }
    }

    // Save current state before undoing (if it's different from what's in history)
    if (currentIndex >= 0 && currentIndex < history.length) {
      const currentContent = editorRef.current.innerHTML;
      if (history[currentIndex] !== currentContent) {
        // Current content is different, save it first
        if (currentIndex === history.length - 1) {
          history.push(currentContent);
          historyIndexRef.current = history.length - 1;
          currentIndex = history.length - 1;
        } else {
          // We're in the middle, replace current position
          history[currentIndex] = currentContent;
        }
      }
    }

    // Move to previous state
    const newIndex = currentIndex - 1;
    if (newIndex < 0 || newIndex >= history.length) return;
    
    const previousContent = history[newIndex];

    if (previousContent !== undefined) {
      isUndoRedoRef.current = true;

      // Save selection
      const selection = window.getSelection();
      let savedRange: Range | null = null;
      if (selection && selection.rangeCount > 0) {
        savedRange = selection.getRangeAt(0).cloneRange();
      }

      // Restore content
      editorRef.current.innerHTML = previousContent;
      historyIndexRef.current = newIndex;

      // Restore selection if possible
      if (savedRange && selection) {
        try {
          // Try to restore selection
          const newRange = document.createRange();
          const walker = document.createTreeWalker(
            editorRef.current,
            NodeFilter.SHOW_TEXT,
            null
          );

          let node: Node | null = null;
          let offset = 0;
          let found = false;

          // Try to find a similar position
          if (savedRange.startContainer.nodeType === Node.TEXT_NODE) {
            const textContent = savedRange.startContainer.textContent || '';
            const startOffset = savedRange.startOffset;

            // Find text node with similar content
            while ((node = walker.nextNode())) {
              if (node.textContent === textContent) {
                offset = Math.min(startOffset, node.textContent.length);
                found = true;
                break;
              }
            }
          }

          if (found && node) {
            newRange.setStart(node, offset);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
          } else {
            // Fallback: place cursor at end
            const range = document.createRange();
            range.selectNodeContents(editorRef.current);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
          }
        } catch (err) {
          // If restoration fails, just place cursor at end
          const range = document.createRange();
          range.selectNodeContents(editorRef.current);
          range.collapse(false);
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      }

      editorRef.current.focus();
      handleContentChange();

      // Reattach image handlers
      attachImageResizeHandlers();

      setTimeout(() => {
        isUndoRedoRef.current = false;
      }, 100);
    }
  }, [handleContentChange, attachImageResizeHandlers]);

  const handleRedo = useCallback(() => {
    if (!editorRef.current) return;

    const history = historyRef.current;
    let currentIndex = historyIndexRef.current;

    // Initialize history if empty
    if (history.length === 0) {
      const currentContent = editorRef.current.innerHTML;
      history.push(currentContent);
      historyIndexRef.current = 0;
      return;
    }

    // Can't redo if we're at the end
    if (currentIndex >= history.length - 1) return;

    // Save current state before redoing (if it's different from what's in history)
    if (currentIndex >= 0 && currentIndex < history.length) {
      const currentContent = editorRef.current.innerHTML;
      if (history[currentIndex] !== currentContent) {
        // Current content is different, update it in history
        history[currentIndex] = currentContent;
      }
    }

    // Move to next state
    const newIndex = currentIndex + 1;
    if (newIndex >= history.length) return;
    
    const nextContent = history[newIndex];

    if (nextContent !== undefined) {
      isUndoRedoRef.current = true;

      // Save selection
      const selection = window.getSelection();
      let savedRange: Range | null = null;
      if (selection && selection.rangeCount > 0) {
        savedRange = selection.getRangeAt(0).cloneRange();
      }

      // Restore content
      editorRef.current.innerHTML = nextContent;
      historyIndexRef.current = newIndex;

      // Restore selection if possible
      if (savedRange && selection) {
        try {
          // Try to restore selection
          const newRange = document.createRange();
          const walker = document.createTreeWalker(
            editorRef.current,
            NodeFilter.SHOW_TEXT,
            null
          );

          let node: Node | null = null;
          let offset = 0;
          let found = false;

          // Try to find a similar position
          if (savedRange.startContainer.nodeType === Node.TEXT_NODE) {
            const textContent = savedRange.startContainer.textContent || '';
            const startOffset = savedRange.startOffset;

            // Find text node with similar content
            while ((node = walker.nextNode())) {
              if (node.textContent === textContent) {
                offset = Math.min(startOffset, node.textContent.length);
                found = true;
                break;
              }
            }
          }

          if (found && node) {
            newRange.setStart(node, offset);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
          } else {
            // Fallback: place cursor at end
            const range = document.createRange();
            range.selectNodeContents(editorRef.current);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
          }
        } catch (err) {
          // If restoration fails, just place cursor at end
          const range = document.createRange();
          range.selectNodeContents(editorRef.current);
          range.collapse(false);
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      }

      editorRef.current.focus();
      handleContentChange();

      // Reattach image handlers
      attachImageResizeHandlers();

      setTimeout(() => {
        isUndoRedoRef.current = false;
      }, 100);
    }
  }, [handleContentChange, attachImageResizeHandlers]);

  const handleToolbarClick = (button: ToolbarButton) => {
    if (disabled) return;

    switch (button) {
      case 'bold':
        execCommand('bold');
        break;
      case 'italic':
        execCommand('italic');
        break;
      case 'underline':
        execCommand('underline');
        break;
      case 'strike':
        execCommand('strikeThrough');
        break;
      case 'alignLeft':
        execCommand('justifyLeft');
        break;
      case 'alignCenter':
        execCommand('justifyCenter');
        break;
      case 'alignRight':
        execCommand('justifyRight');
        break;
      case 'alignJustify':
        execCommand('justifyFull');
        break;
      case 'unorderedList':
        execCommand('insertUnorderedList');
        break;
      case 'orderedList':
        execCommand('insertOrderedList');
        break;
      case 'undo':
        handleUndo();
        break;
      case 'redo':
        handleRedo();
        break;
      case 'fontSize':
        setShowBlockFormatDropdown(!showBlockFormatDropdown);
        setShowFontColorDropdown(false);
        break;
      case 'fontColor':
        setShowFontColorDropdown(!showFontColorDropdown);
        setShowBlockFormatDropdown(false);
        break;
      case 'backgroundColor':
        const bgColor = prompt('Nhập mã màu nền (ví dụ: #FFFF00):', '#FFFFFF');
        if (bgColor) {
          execCommand('backColor', bgColor);
        }
        break;
      case 'link':
        const url = prompt('Nhập URL:', 'https://');
        if (url) {
          execCommand('createLink', url);
        }
        break;
      case 'image':
        setShowImageModal(true);
        setImageUrl('');
        break;
      case 'table':
        const rows = prompt('Số hàng:', '3');
        const cols = prompt('Số cột:', '3');
        if (rows && cols) {
          insertTable(parseInt(rows), parseInt(cols));
        }
        break;
      case 'codeView':
        toggleCodeView();
        break;
      case 'fullscreen':
        toggleFullscreen();
        break;
    }
  };

  const insertTable = (rows: number, cols: number) => {
    // Save state before inserting table
    if (editorRef.current) {
      saveToHistory();
    }
    
    const table = document.createElement('table');
    table.style.borderCollapse = 'collapse';
    table.style.width = '100%';
    table.style.margin = '16px 0';

    for (let i = 0; i < rows; i++) {
      const tr = document.createElement('tr');
      for (let j = 0; j < cols; j++) {
        const td = document.createElement('td');
        td.style.border = '1px solid #ddd';
        td.style.padding = '8px';
        td.innerHTML = '&nbsp;';
        tr.appendChild(td);
      }
      table.appendChild(tr);
    }

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(table);
      range.setStartAfter(table);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      if (editorRef.current) {
        editorRef.current.appendChild(table);
      }
    }

    editorRef.current?.focus();
    handleContentChange();
  };

  const toggleCodeView = () => {
    if (!showCodeView) {
      setCodeContent(editorRef.current?.innerHTML || '');
      setShowCodeView(true);
    } else {
      if (editorRef.current) {
        editorRef.current.innerHTML = codeContent;
        handleContentChange();
      }
      setShowCodeView(false);
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      editorRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Kiểm tra loại file
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file hình ảnh!');
      return;
    }

    // Kiểm tra kích thước file (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Kích thước file không được vượt quá 10MB!');
      return;
    }

    setIsUploading(true);

    try {
      // Convert file sang base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = e.target?.result as string;
        if (base64String) {
          insertImageToEditor(base64String);
          setShowImageModal(false);
          setImageUrl('');
          setIsUploading(false);
        }
      };
      reader.onerror = () => {
        alert('Lỗi khi đọc file!');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      alert('Lỗi khi upload ảnh!');
      setIsUploading(false);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const insertImageToEditor = (imageSrc: string) => {
    // Save state before inserting image
    if (editorRef.current) {
      saveToHistory();
    }
    const img = document.createElement('img');
    img.src = imageSrc;
    // Set initial styles but allow resizing later
    img.style.borderRadius = '4px';
    img.style.margin = '8px 0';
    img.style.cursor = 'pointer';
    img.style.position = 'relative';
    img.style.display = 'inline-block';
    img.style.verticalAlign = 'middle';
    // Set max-width initially but it will be removed when resizing
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    img.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      // Remove selected class from all images
      if (editorRef.current) {
        const allImages = editorRef.current.querySelectorAll('img');
        allImages.forEach(i => i.classList.remove('hh-selected'));
      }
      img.classList.add('hh-selected');
      setSelectedImage(img);
    };

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(img);
      range.setStartAfter(img);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      if (editorRef.current) {
        editorRef.current.appendChild(img);
      }
    }

    editorRef.current?.focus();
    handleContentChange();
  };

  // Update resize handle position
  useLayoutEffect(() => {
    if (!selectedImage) {
      // Hide handle when no image selected
      if (resizeHandleRef.current) {
        resizeHandleRef.current.style.display = 'none';
      }
      return;
    }

    let rafId: number | null = null;
    let lastUpdateTime = 0;
    const UPDATE_THROTTLE = 16; // ~60fps

    const updateResizeHandlePosition = () => {
      if (!resizeHandleRef.current || !selectedImage || !editorRef.current) return;

      const now = performance.now();
      if (now - lastUpdateTime < UPDATE_THROTTLE) {
        return;
      }
      lastUpdateTime = now;

      const rect = selectedImage.getBoundingClientRect();
      const editorRect = editorRef.current.getBoundingClientRect();

      resizeHandleRef.current.style.left = `${rect.right - editorRect.left - 10}px`;
      resizeHandleRef.current.style.top = `${rect.bottom - editorRect.top - 10}px`;
      resizeHandleRef.current.style.display = 'block';
    };

    // Initial update
    const timeoutId = setTimeout(updateResizeHandlePosition, 0);

    // Throttled update on scroll/resize - only update when actually scrolling
    const updatePosition = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        updateResizeHandlePosition();
        rafId = null;
      });
    };

    // Use passive listeners for better performance
    const scrollOptions = { passive: true, capture: true } as AddEventListenerOptions;
    window.addEventListener('scroll', updatePosition, scrollOptions);
    window.addEventListener('resize', updatePosition, { passive: true });

    return () => {
      clearTimeout(timeoutId);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      window.removeEventListener('scroll', updatePosition, scrollOptions);
      window.removeEventListener('resize', updatePosition);
    };
  }, [selectedImage]);

  // Handle resize mouse events
  const handleResizeMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedImage) return;

    e.preventDefault();
    e.stopPropagation();

    const img = selectedImage;

    // Get current dimensions - use computed style to get actual rendered size
    const computedStyle = window.getComputedStyle(img);
    let startWidth = parseFloat(computedStyle.width) || img.offsetWidth || img.naturalWidth || 300;
    let startHeight = parseFloat(computedStyle.height) || img.offsetHeight || img.naturalHeight || 200;

    // If image has max-width: 100%, we need to get the actual natural width
    if (computedStyle.maxWidth === '100%' || computedStyle.maxWidth === 'none') {
      // Try to get natural dimensions
      if (img.naturalWidth && img.naturalWidth > 0) {
        const containerWidth = img.parentElement?.offsetWidth || editorRef.current?.offsetWidth || window.innerWidth;
        const maxDisplayWidth = containerWidth - 32; // account for padding

        // If current width seems constrained, use natural width as base
        if (startWidth >= maxDisplayWidth * 0.95) {
          startWidth = img.naturalWidth;
          startHeight = img.naturalHeight;
        }
      }
    }

    let startX = e.clientX;
    let isResizingActive = true;

    // Remove all constraints immediately when starting resize
    img.style.maxWidth = 'none';
    img.style.maxHeight = 'none';
    img.style.minWidth = 'none';
    img.style.minHeight = 'none';
    img.style.width = `${startWidth}px`;
    img.style.height = `${startHeight}px`;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingActive || !selectedImage) return;

      const diffX = e.clientX - startX;
      const aspectRatio = startWidth / startHeight;

      // Calculate new width - allow resizing both smaller and larger
      // No maximum limit, only minimum of 50px
      const calculatedWidth = startWidth + diffX;
      const newWidth = Math.max(50, calculatedWidth);
      const newHeight = newWidth / aspectRatio;

      // Apply new dimensions
      img.style.width = `${newWidth}px`;
      img.style.height = `${newHeight}px`;

      // Update handle position
      if (resizeHandleRef.current && editorRef.current) {
        const rect = img.getBoundingClientRect();
        const editorRect = editorRef.current.getBoundingClientRect();
        resizeHandleRef.current.style.left = `${rect.right - editorRect.left - 10}px`;
        resizeHandleRef.current.style.top = `${rect.bottom - editorRect.top - 10}px`;
      }
    };

    const handleMouseUp = () => {
      isResizingActive = false;
      // Ensure constraints are still removed after resize
      if (selectedImage) {
        selectedImage.style.maxWidth = 'none';
        selectedImage.style.maxHeight = 'none';
      }
      handleContentChange();
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [selectedImage, handleContentChange]);

  const handleInsertImageFromUrl = () => {
    if (imageUrl.trim()) {
      insertImageToEditor(imageUrl.trim());
      setShowImageModal(false);
      setImageUrl('');
    } else {
      alert('Vui lòng nhập URL hình ảnh!');
    }
  };

  const handleOpenFileDialog = () => {
    fileInputRef.current?.click();
  };


  const handleDecreaseFontSize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const currentPx = getCurrentFontSizeInPixels();
    const newSize = Math.max(8, currentPx - 1); // Minimum 8px
    applyFontSize(newSize);
  };

  const handleIncreaseFontSize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const currentPx = getCurrentFontSizeInPixels();
    const newSize = currentPx + 1; // No maximum limit
    applyFontSize(newSize);
  };

  const getCurrentFontSizeLabel = (): string => {
    const currentPx = getCurrentFontSizeInPixels();
    return `${currentPx}px`;
  };

  const getCurrentBlockFormat = (): string => {
    if (!editorRef.current) return 'paragraph';
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return 'paragraph';
    
    const range = selection.getRangeAt(0);
    let element = range.commonAncestorContainer;
    
    if (element.nodeType === Node.TEXT_NODE) {
      element = element.parentElement as Element;
    } else {
      element = element as Element;
    }
    
    if (!element) return 'paragraph';
    
    // Check for heading tags
    const tagName = (element as Element).tagName?.toLowerCase();
    if (tagName === 'h1') return 'heading1';
    if (tagName === 'h2') return 'heading2';
    if (tagName === 'h3') return 'heading3';
    if (tagName === 'h4') return 'heading4';
    if (tagName === 'h5') return 'heading5';
    if (tagName === 'h6') return 'heading6';
    if (tagName === 'pre' || tagName === 'code') return 'preformatted';
    
    return 'paragraph';
  };

  const handleBlockFormatSelect = (format: string) => {
    if (!editorRef.current) return;

    // Save state before applying format
    saveToHistory();
    
    // Set flag to prevent cleanup during format application
    isApplyingFormatRef.current = true;
    
    editorRef.current.focus();
    const selection = window.getSelection();
    
    if (!selection || selection.rangeCount === 0) {
      // If no selection, apply to current block
      document.execCommand('formatBlock', false, format === 'paragraph' ? 'p' : format);
      setShowBlockFormatDropdown(false);
      handleContentChange();
      // Clear flag after a short delay
      setTimeout(() => {
        isApplyingFormatRef.current = false;
      }, 100);
      return;
    }

    const range = selection.getRangeAt(0);
    const newTag = format === 'paragraph' ? 'p' : format;
    
    // Helper function to find the block element containing a node
    const findBlockElement = (node: Node): Element | null => {
      let currentNode: Node | null = node;
      if (currentNode.nodeType === Node.TEXT_NODE) {
        currentNode = currentNode.parentElement || currentNode;
      }

      while (currentNode && currentNode !== editorRef.current) {
        if (currentNode.nodeType === Node.ELEMENT_NODE) {
          const tagName = (currentNode as Element).tagName?.toLowerCase();
      if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'div', 'blockquote', 'li'].includes(tagName || '')) {
            return currentNode as Element;
          }
        }
        currentNode = currentNode.parentNode;
      }
      return null;
    };

    const isCollapsed = range.collapsed;

    if (isCollapsed) {
      // Case 1: Collapsed selection (cursor only) - format only the block containing cursor
      const blockElement = findBlockElement(range.startContainer);

      if (blockElement && blockElement !== editorRef.current && blockElement.parentNode) {
        const newElement = document.createElement(newTag);
        const children = Array.from(blockElement.childNodes);
        children.forEach((child) => {
          newElement.appendChild(child.cloneNode(true));
        });

        blockElement.parentNode.replaceChild(newElement, blockElement);

        // Restore cursor position
        try {
          const newRange = document.createRange();
          newRange.setStart(newElement, 0);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
        } catch (err) {
          const newRange = document.createRange();
          newRange.setStart(newElement, 0);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      } else {
        document.execCommand('formatBlock', false, newTag);
      }
    } else {
      // Case 2: Non-collapsed selection - check if it spans multiple blocks
      const startBlock = findBlockElement(range.startContainer);
      const endBlock = findBlockElement(range.endContainer);

      if (startBlock && endBlock && startBlock === endBlock) {
        // Case 2a: Selection is within a single block - format only that block
        if (startBlock !== editorRef.current && startBlock.parentNode) {
          const newElement = document.createElement(newTag);
          const children = Array.from(startBlock.childNodes);
          children.forEach((child) => {
            newElement.appendChild(child.cloneNode(true));
          });

          startBlock.parentNode.replaceChild(newElement, startBlock);

          // Restore selection
          try {
            const newRange = document.createRange();
            newRange.setStart(newElement, 0);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
          } catch (err) {
            const newRange = document.createRange();
            newRange.setStart(newElement, 0);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
          }
        } else {
          document.execCommand('formatBlock', false, newTag);
        }
      } else if (startBlock && endBlock && startBlock !== endBlock) {
        // Case 2b: Selection spans multiple blocks - format ALL blocks in the selection
        // Get all direct children of editor that are block elements
        const allBlocks: Element[] = [];
        if (editorRef.current) {
          const children = Array.from(editorRef.current.children);
          children.forEach((child) => {
            const tagName = child.tagName?.toLowerCase();
            if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'div', 'blockquote', 'li'].includes(tagName || '')) {
              allBlocks.push(child);
            }
          });
        }

        // Find which blocks are within the selection range
        const blocksToFormat: Element[] = [];
        allBlocks.forEach((block) => {
          // Check if block intersects with the range
          const blockRange = document.createRange();
          try {
            blockRange.selectNodeContents(block);
            // Check if range intersects with block
            if (range.intersectsNode(block) ||
              (range.startContainer === block || range.endContainer === block) ||
              (block.contains(range.startContainer) && block.contains(range.endContainer)) ||
              (range.startContainer.nodeType === Node.TEXT_NODE &&
                block.contains(range.startContainer.parentElement) &&
                block.contains(range.endContainer.nodeType === Node.TEXT_NODE ? range.endContainer.parentElement : range.endContainer))) {
              blocksToFormat.push(block);
            }
          } catch (err) {
            // If we can't create range, check if block is between start and end
            const startPos = Array.from(editorRef.current?.children || []).indexOf(startBlock);
            const endPos = Array.from(editorRef.current?.children || []).indexOf(endBlock);
            const blockPos = Array.from(editorRef.current?.children || []).indexOf(block);
            if (startPos !== -1 && endPos !== -1 && blockPos !== -1) {
              if (blockPos >= startPos && blockPos <= endPos) {
                blocksToFormat.push(block);
              }
            }
          }
        });

        // If we couldn't find blocks by intersection, use a simpler approach:
        // Find blocks between startBlock and endBlock
        if (blocksToFormat.length === 0 && startBlock && endBlock) {
          const startIndex = allBlocks.indexOf(startBlock);
          const endIndex = allBlocks.indexOf(endBlock);
          if (startIndex !== -1 && endIndex !== -1) {
            const startIdx = Math.min(startIndex, endIndex);
            const endIdx = Math.max(startIndex, endIndex);
            for (let i = startIdx; i <= endIdx; i++) {
              blocksToFormat.push(allBlocks[i]);
            }
          }
        }

        // Format all blocks found
      blocksToFormat.forEach((blockElement) => {
          if (blockElement !== editorRef.current && blockElement.parentNode) {
          const newElement = document.createElement(newTag);
            const children = Array.from(blockElement.childNodes);
            children.forEach((child) => {
              newElement.appendChild(child.cloneNode(true));
            });
          blockElement.parentNode.replaceChild(newElement, blockElement);
        }
      });
      
        // Restore selection to start of first block
      if (blocksToFormat.length > 0) {
          try {
            const firstBlock = blocksToFormat[0];
          const newRange = document.createRange();
            newRange.setStart(firstBlock, 0);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
          } catch (err) {
            // Fallback
            const newRange = document.createRange();
            newRange.setStart(blocksToFormat[0], 0);
            newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      }
    } else {
        // Fallback: use execCommand
      document.execCommand('formatBlock', false, newTag);
      }
    }
    
    setShowBlockFormatDropdown(false);
    handleContentChange();
    editorRef.current.focus();
    
    // Clear flag after a short delay to allow format to be applied
    setTimeout(() => {
      isApplyingFormatRef.current = false;
    }, 200);
  };


  const handleFontColorSelect = (color: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Save state before applying color
    if (editorRef.current) {
      saveToHistory();
    }
    
    // Set flag to prevent click outside handler from interfering
    isSelectingColorRef.current = true;
    
    if (!editorRef.current) {
      isSelectingColorRef.current = false;
    setShowFontColorDropdown(false);
    setHoveredColor(null);
    setHoveredColorPosition(null);
      return;
    }

    // Save selection BEFORE closing dropdown
    const selection = window.getSelection();
    let savedRange: Range | null = null;

    if (selection && selection.rangeCount > 0) {
      savedRange = selection.getRangeAt(0).cloneRange();
    }

    // Close dropdown
    setShowFontColorDropdown(false);
    setHoveredColor(null);
    setHoveredColorPosition(null);

      // Ensure editor has focus
        editorRef.current.focus();

    // Restore selection if we saved it
    if (savedRange && selection) {
      try {
        selection.removeAllRanges();
        selection.addRange(savedRange);
      } catch (err) {
        // Selection might be invalid, continue anyway
      }
    }

    // Apply color immediately
    requestAnimationFrame(() => {
      const currentSelection = window.getSelection();

      // If we have a saved range, use it; otherwise use current selection
      let rangeToUse: Range | null = null;

      if (savedRange) {
        try {
          if (currentSelection) {
            currentSelection.removeAllRanges();
            currentSelection.addRange(savedRange);
          }
          rangeToUse = savedRange;
        } catch (err) {
          // Fallback to current selection
          if (currentSelection && currentSelection.rangeCount > 0) {
            rangeToUse = currentSelection.getRangeAt(0);
          }
        }
      } else if (currentSelection && currentSelection.rangeCount > 0) {
        rangeToUse = currentSelection.getRangeAt(0);
      }
        
        // If no selection or collapsed, use execCommand which will apply to future typing
      if (!rangeToUse || rangeToUse.collapsed) {
          try {
            // execCommand will apply color to future typed text
            document.execCommand('foreColor', false, color);
            handleContentChange();
          } catch (err) {
            console.error('Error applying color:', err);
          }
        } else {
          // Use execCommand to apply color to selection
          try {
            document.execCommand('foreColor', false, color);
            handleContentChange();
          } catch (err) {
            console.error('Error applying color:', err);
            // Fallback: wrap selection in span with color
          try {
              const span = document.createElement('span');
              span.style.color = color;
              try {
              rangeToUse.surroundContents(span);
                handleContentChange();
              } catch (e) {
              const contents = rangeToUse.extractContents();
                span.appendChild(contents);
              rangeToUse.insertNode(span);
                handleContentChange();
              }
          } catch (fallbackErr) {
            console.error('Fallback color application failed:', fallbackErr);
            }
          }
        }
        
        // Reset flag after a short delay
        setTimeout(() => {
          isSelectingColorRef.current = false;
        }, 100);
    });
  };


  const handleRemoveColor = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Save state before removing color
    if (editorRef.current) {
      saveToHistory();
    }

    // Set flag to prevent click outside handler from interfering
    isSelectingColorRef.current = true;

    if (!editorRef.current) {
      isSelectingColorRef.current = false;
    setShowFontColorDropdown(false);
      return;
    }

    // Save selection BEFORE closing dropdown
    const selection = window.getSelection();
    let savedRange: Range | null = null;

    if (selection && selection.rangeCount > 0) {
      try {
        savedRange = selection.getRangeAt(0).cloneRange();
      } catch (err) {
        // If cloning fails, try to get selection from editor
        if (editorRef.current.contains(selection.anchorNode)) {
          savedRange = selection.getRangeAt(0).cloneRange();
        }
      }
    }

    // Close dropdown
    setShowFontColorDropdown(false);
    setHoveredColor(null);
    setHoveredColorPosition(null);

    // Ensure editor has focus
    editorRef.current.focus();

    // Set color to default (#000000)
    requestAnimationFrame(() => {
      const currentSelection = window.getSelection();

      // Restore selection if we saved it
      if (savedRange) {
        try {
          if (currentSelection) {
            currentSelection.removeAllRanges();
            currentSelection.addRange(savedRange);
          }
        } catch (err) {
          // Selection might be invalid, try to get current selection
          if (currentSelection && currentSelection.rangeCount > 0) {
            savedRange = currentSelection.getRangeAt(0).cloneRange();
          }
        }
      } else if (currentSelection && currentSelection.rangeCount > 0) {
        savedRange = currentSelection.getRangeAt(0).cloneRange();
      }

      // Apply default color (#000000)
      try {
        if (savedRange && currentSelection) {
          currentSelection.removeAllRanges();
          currentSelection.addRange(savedRange);
        }
        document.execCommand('foreColor', false, '#000000');
        handleContentChange();
      } catch (err) {
        console.error('Error setting default color:', err);
      }

      // Reset flag after a short delay
      setTimeout(() => {
        isSelectingColorRef.current = false;
      }, 100);
    });
  };


  const openColorPicker = (initialColor?: string) => {
    // Save selection before opening color picker
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      savedColorPickerSelectionRef.current = selection.getRangeAt(0).cloneRange();
    } else {
      savedColorPickerSelectionRef.current = null;
    }

    let color = initialColor;
    if (!color) {
      const currentColor = getCurrentFontColor();
      color = currentColor || '#000000';
    }
    // Ensure color is in hex format
    if (!color.startsWith('#')) {
      color = '#' + color;
    }
    const rgb = hexToRgb(color);
    if (rgb) {
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      setPickerColor({
        h: hsl.h,
        s: hsl.s,
        l: hsl.l,
        r: rgb.r,
        g: rgb.g,
        b: rgb.b,
        hex: color
      });
    } else {
      // Fallback to black if color parsing fails
      setPickerColor({
        h: 0,
        s: 0,
        l: 0,
        r: 0,
        g: 0,
        b: 0,
        hex: '#000000'
      });
    }
    setShowColorPicker(true);
    setShowFontColorDropdown(false);
  };

  const updatePickerColor = (updates: Partial<PickerColor>) => {
    setPickerColor(prev => {
      const updated = { ...prev, ...updates };
      
      // If HSL changed, update RGB and Hex
      if (updates.h !== undefined || updates.s !== undefined || updates.l !== undefined) {
        const rgb = hslToRgb(updated.h, updated.s, updated.l);
        updated.r = rgb.r;
        updated.g = rgb.g;
        updated.b = rgb.b;
        updated.hex = rgbToHex(rgb.r, rgb.g, rgb.b);
      }
      // If RGB changed, update HSL and Hex
      else if (updates.r !== undefined || updates.g !== undefined || updates.b !== undefined) {
        const hsl = rgbToHsl(updated.r, updated.g, updated.b);
        updated.h = hsl.h;
        updated.s = hsl.s;
        updated.l = hsl.l;
        updated.hex = rgbToHex(updated.r, updated.g, updated.b);
      }
      // If Hex changed, update RGB and HSL
      else if (updates.hex !== undefined) {
        const rgb = hexToRgb(updates.hex);
        if (rgb) {
          updated.r = rgb.r;
          updated.g = rgb.g;
          updated.b = rgb.b;
          const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
          updated.h = hsl.h;
          updated.s = hsl.s;
          updated.l = hsl.l;
        }
      }
      
      return updated;
    });
  };

  const handleColorPickerSave = () => {
    if (!editorRef.current) {
    setShowColorPicker(false);
      return;
    }

    // Save state before applying color
    saveToHistory();

    // Set flag to prevent click outside handler from interfering
    isSelectingColorRef.current = true;

    // Close color picker
    setShowColorPicker(false);

    // Ensure editor has focus
    editorRef.current.focus();

    // Restore selection if we saved it
    const selection = window.getSelection();
    if (savedColorPickerSelectionRef.current && selection) {
      try {
        selection.removeAllRanges();
        selection.addRange(savedColorPickerSelectionRef.current);
      } catch (err) {
        // Selection might be invalid, continue anyway
      }
    }

    // Apply color immediately
    requestAnimationFrame(() => {
      const currentSelection = window.getSelection();

      // If we have a saved range, use it; otherwise use current selection
      let rangeToUse: Range | null = null;

      if (savedColorPickerSelectionRef.current) {
        try {
          if (currentSelection) {
            currentSelection.removeAllRanges();
            currentSelection.addRange(savedColorPickerSelectionRef.current);
          }
          rangeToUse = savedColorPickerSelectionRef.current;
        } catch (err) {
          // Fallback to current selection
          if (currentSelection && currentSelection.rangeCount > 0) {
            rangeToUse = currentSelection.getRangeAt(0);
          }
        }
      } else if (currentSelection && currentSelection.rangeCount > 0) {
        rangeToUse = currentSelection.getRangeAt(0);
      }

      // If no selection or collapsed, use execCommand which will apply to future typing
      if (!rangeToUse || rangeToUse.collapsed) {
        try {
          // execCommand will apply color to future typed text
          document.execCommand('foreColor', false, pickerColor.hex);
          handleContentChange();
        } catch (err) {
          console.error('Error applying color:', err);
        }
      } else {
        // Use execCommand to apply color to selection
        try {
          document.execCommand('foreColor', false, pickerColor.hex);
          handleContentChange();
        } catch (err) {
          console.error('Error applying color:', err);
          // Fallback: wrap selection in span with color
          try {
            const span = document.createElement('span');
            span.style.color = pickerColor.hex;
            try {
              rangeToUse.surroundContents(span);
              handleContentChange();
            } catch (e) {
              const contents = rangeToUse.extractContents();
              span.appendChild(contents);
              rangeToUse.insertNode(span);
              handleContentChange();
            }
          } catch (fallbackErr) {
            console.error('Fallback color application failed:', fallbackErr);
          }
        }
      }

      // Clear saved selection
      savedColorPickerSelectionRef.current = null;

      // Reset flag after a short delay
      setTimeout(() => {
        isSelectingColorRef.current = false;
      }, 100);
    });
  };

  const handleColorPickerCancel = () => {
    // Clear saved selection when canceling
    savedColorPickerSelectionRef.current = null;
    setShowColorPicker(false);
  };


  const getCurrentFontSizeInPixels = (): number => {
    if (!editorRef.current) return 16;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return 16;

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const element = container.nodeType === Node.TEXT_NODE
      ? container.parentElement
      : container as Element;

    if (!element) return 16;

    // Check inline style first
    const inlineStyle = (element as HTMLElement).style.fontSize;
    if (inlineStyle) {
      const pixelSize = parseFloat(inlineStyle);
      if (!isNaN(pixelSize)) return Math.round(pixelSize);
    }

    // Check computed style
    const computedStyle = window.getComputedStyle(element);
    const fontSize = computedStyle.fontSize;
    const pixelSize = parseFloat(fontSize);

    return isNaN(pixelSize) ? 16 : Math.round(pixelSize);
  };

  const applyFontSize = (sizeInPx: number) => {
    if (!editorRef.current) return;

    // Clear any pending history saves from handleContentChange to avoid conflicts
    if (saveHistoryTimeoutRef.current) {
      clearTimeout(saveHistoryTimeoutRef.current);
      saveHistoryTimeoutRef.current = null;
    }

    // Save state before applying font size (immediately, no debounce)
    saveToHistory();

    // Ensure editor has focus first
    editorRef.current.focus();
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      // If no selection, apply to default for next typed text
      document.execCommand('fontSize', false, '7');
      setTimeout(() => {
        if (editorRef.current) {
          const fontElements = editorRef.current.querySelectorAll('font[size="7"]');
          fontElements.forEach((el) => {
            (el as HTMLElement).style.fontSize = `${sizeInPx}px`;
          });
          setFontSizeUpdateTrigger(prev => prev + 1);
          
          // Save history immediately after font size change (no debounce)
          // This ensures each font size change is saved separately for proper undo/redo
          setTimeout(() => {
            saveToHistory();
          }, 10);
          
          handleContentChange();
          editorRef.current?.focus();
        }
      }, 0);
      return;
    }

    const range = selection.getRangeAt(0);
    const isCollapsed = range.collapsed;
    
    // Save selection info before modifying DOM
    const startContainer = range.startContainer;
    const startOffset = range.startOffset;
    const endContainer = range.endContainer;
    const endOffset = range.endOffset;
    
    // Use execCommand with styleWithCSS for better compatibility
    try {
      // Enable styleWithCSS to use inline styles instead of font tags
      document.execCommand('styleWithCSS', false, 'true');
      
      if (isCollapsed) {
        // For collapsed selection, create a zero-width span for next character
        const span = document.createElement('span');
        span.style.fontSize = `${sizeInPx}px`;
        span.innerHTML = '\u200B'; // Zero-width space
        
        range.insertNode(span);
        
        // Move cursor after the span
        range.setStartAfter(span);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        // For text selection, wrap in span
        const span = document.createElement('span');
        span.style.fontSize = `${sizeInPx}px`;
        
        try {
          // Try to surround contents with span
          range.surroundContents(span);
          
          // Select the new span
          const newRange = document.createRange();
          newRange.selectNodeContents(span);
          selection.removeAllRanges();
          selection.addRange(newRange);
        } catch (e) {
          // If surroundContents fails (e.g., selection crosses boundaries), extract and wrap
          const contents = range.extractContents();
          span.appendChild(contents);
          range.insertNode(span);
          
          // Select the new span
          const newRange = document.createRange();
          newRange.selectNodeContents(span);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      }
      
      // Restore styleWithCSS to default
      document.execCommand('styleWithCSS', false, 'false');
      
      setFontSizeUpdateTrigger(prev => prev + 1);
      
      // Save history immediately after font size change (no debounce)
      // This ensures each font size change is saved separately for proper undo/redo
      setTimeout(() => {
        saveToHistory();
      }, 10);
      
      handleContentChange();

      // Ensure focus is maintained
      editorRef.current.focus();
    } catch (e) {
      // Fallback: use execCommand with font tag
      document.execCommand('fontSize', false, '7');
      setTimeout(() => {
        if (editorRef.current) {
          const fontElements = editorRef.current.querySelectorAll('font[size="7"]');
          fontElements.forEach((el) => {
            (el as HTMLElement).style.fontSize = `${sizeInPx}px`;
          });
          
          // Save history immediately after font size change (no debounce)
          // This ensures each font size change is saved separately for proper undo/redo
          setTimeout(() => {
            saveToHistory();
          }, 10);
          
          // Try to restore selection
          try {
            const newRange = document.createRange();
            if (!isCollapsed && startContainer && endContainer) {
              // Try to restore original selection
              newRange.setStart(startContainer, startOffset);
              newRange.setEnd(endContainer, endOffset);
            } else {
              newRange.setStart(startContainer, startOffset);
              newRange.collapse(true);
            }
            selection.removeAllRanges();
            selection.addRange(newRange);
          } catch (err) {
            // If restoration fails, just focus at end
            editorRef.current.focus();
          }
          
          setFontSizeUpdateTrigger(prev => prev + 1);
          handleContentChange();
          editorRef.current.focus();
        }
      }, 0);
    }
  };

  const getCurrentFontColor = (): string | null => {
    if (!editorRef.current) return null;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const element = container.nodeType === Node.TEXT_NODE
      ? container.parentElement
      : container as Element;

    if (!element) return null;

    const computedStyle = window.getComputedStyle(element);
    const color = computedStyle.color;

    // Convert rgb/rgba to hex if needed
    if (color.startsWith('rgb')) {
      const rgb = color.match(/\d+/g);
      if (rgb && rgb.length >= 3) {
        const r = parseInt(rgb[0]).toString(16).padStart(2, '0');
        const g = parseInt(rgb[1]).toString(16).padStart(2, '0');
        const b = parseInt(rgb[2]).toString(16).padStart(2, '0');
        return `#${r}${g}${b}`.toUpperCase();
      }
    }

    // If already hex, return as is
    if (color.startsWith('#')) {
      return color;
    }

    // If invalid format, return null
    return null;
  };

                return (
    <>
      <div className={`hh-rich-text-editor ${isFullscreen ? 'hh-fullscreen' : ''} ${disabled ? 'hh-disabled' : ''}`}>
        <Toolbar
          toolbar={toolbar}
              disabled={disabled}
          showBlockFormatDropdown={showBlockFormatDropdown}
          fontSizeUpdateTrigger={fontSizeUpdateTrigger}
          onToggleBlockFormat={() => setShowBlockFormatDropdown(!showBlockFormatDropdown)}
          onBlockFormatSelect={handleBlockFormatSelect}
          onDecreaseFontSize={handleDecreaseFontSize}
          onIncreaseFontSize={handleIncreaseFontSize}
          getCurrentBlockFormat={getCurrentBlockFormat}
          getCurrentFontSizeLabel={getCurrentFontSizeLabel}
          showFontColorDropdown={showFontColorDropdown}
          currentColor={getCurrentFontColor()}
          hoveredColor={hoveredColor}
          onToggleFontColor={() => setShowFontColorDropdown(!showFontColorDropdown)}
          onColorSelect={handleFontColorSelect}
          onRemoveColor={handleRemoveColor}
          onOpenColorPicker={() => openColorPicker(getCurrentFontColor() || undefined)}
          onColorMouseEnter={(color, e) => {
            setHoveredColor(color);
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoveredColorPosition({
                              x: rect.left + rect.width / 2,
                              y: rect.top - 10
                            });
                          }}
          onColorMouseLeave={() => {
                            setHoveredColor(null);
                            setHoveredColorPosition(null);
                          }}
          getCurrentFontColor={getCurrentFontColor}
          onToolbarClick={handleToolbarClick}
        />

        <EditorContent
          editorRef={editorRef}
          showCodeView={showCodeView}
          codeContent={codeContent}
          onCodeContentChange={setCodeContent}
            disabled={disabled}
          height={height}
          placeholder={placeholder}
              onInput={() => {
                if (!isApplyingFormatRef.current) {
                  cleanupHeadings();
                }
                handleContentChange();
              }}
              onPaste={(e: React.ClipboardEvent) => {
                e.preventDefault();
                
                const selection = window.getSelection();
                if (!selection || selection.rangeCount === 0) {
                  handleContentChange();
                  return;
                }

                const range = selection.getRangeAt(0);
                const clipboardData = e.clipboardData || (window as any).clipboardData;
                const htmlData = clipboardData.getData('text/html');
                const plainData = clipboardData.getData('text/plain');

                if (htmlData) {
                  // Create a temporary div to parse HTML
                  const tempDiv = document.createElement('div');
                  tempDiv.innerHTML = htmlData;

                  // Convert all heading tags to paragraphs
                  const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
                  headings.forEach((heading) => {
                    const p = document.createElement('p');
                    // Preserve all child nodes
                    while (heading.firstChild) {
                      p.appendChild(heading.firstChild);
                    }
                    heading.parentNode?.replaceChild(p, heading);
                  });

                  // Also convert any divs that might be block-level to paragraphs
                  const divs = tempDiv.querySelectorAll('div');
                  divs.forEach((div) => {
                    // Only convert if it's a block-level div (not inline)
                    const p = document.createElement('p');
                    while (div.firstChild) {
                      p.appendChild(div.firstChild);
                    }
                    div.parentNode?.replaceChild(p, div);
                  });

                  // Process all child nodes and ensure they are paragraphs
                  const fragment = document.createDocumentFragment();
                  const childNodes = Array.from(tempDiv.childNodes);
                  
                  childNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                      const element = node as Element;
                      const tagName = element.tagName.toLowerCase();
                      
                      // If it's already a paragraph, use it
                      if (tagName === 'p') {
                        fragment.appendChild(node.cloneNode(true));
                      } 
                      // If it's a heading or other block element, convert to paragraph
                      else if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'blockquote'].includes(tagName)) {
                        const p = document.createElement('p');
                        while (element.firstChild) {
                          p.appendChild(element.firstChild.cloneNode(true));
                        }
                        fragment.appendChild(p);
                      }
                      // For other elements, wrap in paragraph
                      else {
                        const p = document.createElement('p');
                        p.appendChild(node.cloneNode(true));
                        fragment.appendChild(p);
                      }
                    } else if (node.nodeType === Node.TEXT_NODE) {
                      // Text nodes should be wrapped in paragraph
                      const text = node.textContent?.trim();
                      if (text) {
                        const p = document.createElement('p');
                        p.textContent = text;
                        fragment.appendChild(p);
                      }
                    } else {
                      fragment.appendChild(node.cloneNode(true));
                    }
                  });

                  range.deleteContents();
                  range.insertNode(fragment);
                  
                  // Move cursor to end of pasted content
                  range.collapse(false);
                  selection.removeAllRanges();
                  selection.addRange(range);
                } else if (plainData) {
                  // If plain text, split by lines and create paragraphs
                  const lines = plainData.split(/\r?\n/).filter(line => line.trim() || line === '');
                  
                  if (lines.length === 0) {
                    handleContentChange();
                    return;
                  }

                  lines.forEach((line, index) => {
                    const p = document.createElement('p');
                    p.textContent = line;
                    
                    if (index === 0) {
                      range.deleteContents();
                      range.insertNode(p);
                    } else {
                      // Insert after previous element
                      const newRange = document.createRange();
                      newRange.setStartAfter(range.endContainer);
                      newRange.collapse(true);
                      newRange.insertNode(p);
                      range.setStartAfter(p);
                    }
                  });

                  // Move cursor to end
                  range.collapse(false);
                  selection.removeAllRanges();
                  selection.addRange(range);
                }

                handleContentChange();
                
                // Cleanup: After paste, ensure no headings remain
                setTimeout(() => {
                  if (editorRef.current) {
                    const headings = editorRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6');
                    headings.forEach((heading) => {
                      const p = document.createElement('p');
                      while (heading.firstChild) {
                        p.appendChild(heading.firstChild);
                      }
                      heading.parentNode?.replaceChild(p, heading);
                    });
                    handleContentChange();
                  }
                  attachImageResizeHandlers();
                }, 100);
              }}
          selectedImage={selectedImage}
          resizeHandleRef={resizeHandleRef}
          onResizeMouseDown={handleResizeMouseDown}
          isApplyingFormat={isApplyingFormatRef}
          onAttachImageResizeHandlers={attachImageResizeHandlers}
        />
      </div>

      {/* Color tooltip - rendered outside dropdown to prevent layout shift */}
      {hoveredColor && hoveredColorPosition && showFontColorDropdown && (
        <div 
          className="hh-color-tooltip"
          style={{
            left: `${hoveredColorPosition.x}px`,
            top: `${hoveredColorPosition.y}px`
          }}
        >
          {fontColors.find(c => c.value === hoveredColor)?.label || hoveredColor}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      <ImageModal
        show={showImageModal}
        imageUrl={imageUrl}
        isUploading={isUploading}
        onClose={() => setShowImageModal(false)}
        onImageUrlChange={setImageUrl}
        onOpenFileDialog={handleOpenFileDialog}
        onInsertFromUrl={handleInsertImageFromUrl}
      />

      {showColorPicker && (
        <ColorPicker
          pickerColor={pickerColor}
          onUpdateColor={updatePickerColor}
          onSave={handleColorPickerSave}
          onCancel={handleColorPickerCancel}
        />
      )}
    </>
  );
};

export default AuroraEditor;


