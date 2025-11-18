import React, { useRef, useEffect, useState, useCallback, useLayoutEffect } from 'react';
import './AuroraEditor.css';

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
  const [showFontSizeDropdown, setShowFontSizeDropdown] = useState(false);
  const [showBlockFormatDropdown, setShowBlockFormatDropdown] = useState(false);
  const [showFontColorDropdown, setShowFontColorDropdown] = useState(false);
  const fontSizeDropdownRef = useRef<HTMLDivElement>(null);
  const blockFormatDropdownRef = useRef<HTMLDivElement>(null);
  const fontColorDropdownRef = useRef<HTMLDivElement>(null);
  const [fontSizeUpdateTrigger, setFontSizeUpdateTrigger] = useState(0);
  const isApplyingFormatRef = useRef(false);
  const [hoveredColor, setHoveredColor] = useState<string | null>(null);
  const [hoveredColorPosition, setHoveredColorPosition] = useState<{ x: number; y: number } | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pickerColor, setPickerColor] = useState({ h: 240, s: 100, l: 50, r: 35, g: 52, b: 119, hex: '#233477' });
  const isSelectingColorRef = useRef(false);

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

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value;
      // Re-attach image resize handlers after content update (debounced)
      const timeoutId = setTimeout(() => {
        attachImageResizeHandlers();
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [value, attachImageResizeHandlers]);

  const handleContentChange = useCallback(() => {
    if (editorRef.current && onChange) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

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
      // Close block format dropdown if clicking outside
      if (blockFormatDropdownRef.current) {
        const isClickInside = blockFormatDropdownRef.current.contains(target);
        if (!isClickInside) {
          setShowBlockFormatDropdown(false);
        }
      }
      
      // Close font color dropdown if clicking outside (but not when selecting a color)
      if (fontColorDropdownRef.current && !isSelectingColorRef.current) {
        const isClickInside = fontColorDropdownRef.current.contains(target);
        if (!isClickInside) {
          setShowFontColorDropdown(false);
          setHoveredColor(null);
          setHoveredColorPosition(null);
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

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      observer.disconnect();
    };
  }, [selectedImage, attachImageResizeHandlers, cleanupHeadings]);

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleContentChange();
    if (command === 'fontSize') {
      setFontSizeUpdateTrigger(prev => prev + 1);
    }
  }, [handleContentChange]);

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
        execCommand('undo');
        break;
      case 'redo':
        execCommand('redo');
        break;
      case 'fontSize':
        setShowBlockFormatDropdown(!showBlockFormatDropdown);
        setShowFontSizeDropdown(false);
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

  const handleFontSizeSelect = (size: string) => {
    execCommand('fontSize', size);
    setShowFontSizeDropdown(false);
    setFontSizeUpdateTrigger(prev => prev + 1);
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
    
    // Get all block elements within the selection using a simpler approach
    const allBlocks: Element[] = [];
    
    // Find start block element
    let startNode = range.startContainer;
    if (startNode.nodeType === Node.TEXT_NODE) {
      startNode = startNode.parentElement as Node;
    }
    
    // Find end block element
    let endNode = range.endContainer;
    if (endNode.nodeType === Node.TEXT_NODE) {
      endNode = endNode.parentElement as Node;
    }
    
    // Find block element containing start
    let startBlock: Element | null = null;
    let current: Node | null = startNode;
    while (current && current !== editorRef.current) {
      const tagName = (current as Element).tagName?.toLowerCase();
      if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'div', 'blockquote', 'li'].includes(tagName || '')) {
        startBlock = current as Element;
        break;
      }
      current = current.parentNode;
    }
    
    // Find block element containing end
    let endBlock: Element | null = null;
    current = endNode;
    while (current && current !== editorRef.current) {
      const tagName = (current as Element).tagName?.toLowerCase();
      if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'div', 'blockquote', 'li'].includes(tagName || '')) {
        endBlock = current as Element;
        break;
      }
      current = current.parentNode;
    }
    
    if (startBlock && endBlock) {
      // Get all block elements between start and end (inclusive)
      const allBlockElements = editorRef.current.querySelectorAll('p, h1, h2, h3, h4, h5, h6, pre, div, blockquote, li');
      
      let foundStart = false;
      allBlockElements.forEach((el) => {
        if (el === startBlock) {
          foundStart = true;
        }
        if (foundStart) {
          allBlocks.push(el);
          if (el === endBlock) {
            return; // Stop after finding end block
          }
        }
      });
      
      // If we didn't find them in order, try reverse
      if (allBlocks.length === 0 || (allBlocks[0] !== startBlock && allBlocks[allBlocks.length - 1] !== endBlock)) {
        allBlocks.length = 0;
        let foundEnd = false;
        const reversedElements = Array.from(allBlockElements).reverse();
        reversedElements.forEach((el) => {
          if (el === endBlock) {
            foundEnd = true;
          }
          if (foundEnd) {
            allBlocks.unshift(el);
            if (el === startBlock) {
              return;
            }
          }
        });
      }
    }
    
    // If still no blocks found, use the block containing selection
    if (allBlocks.length === 0) {
      const blockElement = startBlock || endBlock;
      if (blockElement) {
        allBlocks.push(blockElement);
      }
    }
    
    // Apply format to all blocks
    if (allBlocks.length > 0) {
      // Store references before replacing
      const blocksToFormat = [...allBlocks];
      
      blocksToFormat.forEach((blockElement) => {
        if (blockElement && blockElement !== editorRef.current && blockElement.parentNode) {
          const newElement = document.createElement(newTag);
          
          // Copy all children
          while (blockElement.firstChild) {
            newElement.appendChild(blockElement.firstChild);
          }
          
          // Replace the old element
          blockElement.parentNode.replaceChild(newElement, blockElement);
        }
      });
      
      // Restore selection
      if (blocksToFormat.length > 0) {
        // Find the last formatted element
        const allNewBlocks = editorRef.current.querySelectorAll(newTag);
        if (allNewBlocks.length > 0) {
          const lastNewBlock = allNewBlocks[allNewBlocks.length - 1];
          const newRange = document.createRange();
          newRange.selectNodeContents(lastNewBlock);
          newRange.collapse(false);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      }
    } else {
      // Use execCommand as fallback
      document.execCommand('formatBlock', false, newTag);
    }
    
    setShowBlockFormatDropdown(false);
    handleContentChange();
    editorRef.current.focus();
    
    // Clear flag after a short delay to allow format to be applied
    setTimeout(() => {
      isApplyingFormatRef.current = false;
    }, 200);
  };

  const blockFormats = [
    { value: 'paragraph', label: 'Paragraph', tag: 'p' },
    { value: 'heading1', label: 'Heading 1', tag: 'h1' },
    { value: 'heading2', label: 'Heading 2', tag: 'h2' },
    { value: 'heading3', label: 'Heading 3', tag: 'h3' },
    { value: 'heading4', label: 'Heading 4', tag: 'h4' },
    { value: 'heading5', label: 'Heading 5', tag: 'h5' },
    { value: 'heading6', label: 'Heading 6', tag: 'h6' },
    { value: 'preformatted', label: 'Preformatted', tag: 'pre' }
  ];

  const handleFontColorSelect = (color: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Set flag to prevent click outside handler from interfering
    isSelectingColorRef.current = true;
    
    // Close dropdown immediately
    setShowFontColorDropdown(false);
    setHoveredColor(null);
    setHoveredColorPosition(null);
    
    if (!editorRef.current) {
      isSelectingColorRef.current = false;
      return;
    }

    // Use requestAnimationFrame to ensure DOM updates are complete
    requestAnimationFrame(() => {
      // Ensure editor has focus
      if (editorRef.current) {
        editorRef.current.focus();
      }
      
      // Small delay to ensure focus is set
      setTimeout(() => {
        const selection = window.getSelection();
        
        // If no selection or collapsed, use execCommand which will apply to future typing
        if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
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
            const range = selection.getRangeAt(0);
            if (!range.collapsed) {
              const span = document.createElement('span');
              span.style.color = color;
              try {
                range.surroundContents(span);
                handleContentChange();
              } catch (e) {
                const contents = range.extractContents();
                span.appendChild(contents);
                range.insertNode(span);
                handleContentChange();
              }
            }
          }
        }
        
        // Reset flag after a short delay
        setTimeout(() => {
          isSelectingColorRef.current = false;
        }, 100);
      }, 50);
    });
  };

  const handleAutomaticColor = () => {
    // Remove color - set to default/inherit
    if (!editorRef.current) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    span.style.color = 'inherit';
    
    try {
      range.surroundContents(span);
    } catch (e) {
      const contents = range.extractContents();
      span.appendChild(contents);
      range.insertNode(span);
    }
    
    handleContentChange();
    setShowFontColorDropdown(false);
  };

  const handleNoColor = () => {
    // Remove color styling
    if (!editorRef.current) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    let element = container.nodeType === Node.TEXT_NODE 
      ? container.parentElement 
      : container as Element;
    
    // Find element with color style
    while (element && element !== editorRef.current) {
      if ((element as HTMLElement).style.color) {
        (element as HTMLElement).style.color = '';
        break;
      }
      element = element.parentElement as Element;
    }
    
    handleContentChange();
    setShowFontColorDropdown(false);
  };

  // Color conversion functions
  const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const rgbToHsl = (r: number, g: number, b: number): { h: number; s: number; l: number } => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
  };

  const hslToRgb = (h: number, s: number, l: number): { r: number; g: number; b: number } => {
    h /= 360;
    s /= 100;
    l /= 100;
    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  };

  const rgbToHex = (r: number, g: number, b: number): string => {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  };

  const openColorPicker = (initialColor?: string) => {
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

  const updatePickerColor = (updates: Partial<typeof pickerColor>) => {
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
    handleFontColorSelect(pickerColor.hex);
    setShowColorPicker(false);
  };

  const handleColorPickerCancel = () => {
    setShowColorPicker(false);
  };

  const fontSizes = [
    { label: '8px', value: '1', displaySize: '8px' },
    { label: '10px', value: '2', displaySize: '10px' },
    { label: '12px', value: '3', displaySize: '12px' },
    { label: '14px', value: '4', displaySize: '14px' },
    { label: '16px', value: '5', displaySize: '16px' },
    { label: '18px', value: '6', displaySize: '18px' },
    { label: '24px', value: '7', displaySize: '24px' },
    { label: '32px', value: '8', displaySize: '32px' },
    { label: '48px', value: '9', displaySize: '48px' }
  ];

  const getCurrentFontSize = (): string | null => {
    if (!editorRef.current) return null;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const element = container.nodeType === Node.TEXT_NODE
      ? container.parentElement
      : container as Element;

    if (!element) return null;

    // Check for font tag with size attribute
    const fontTag = element.closest('font[size]');
    if (fontTag) {
      return fontTag.getAttribute('size');
    }

    // Check computed style
    const computedStyle = window.getComputedStyle(element);
    const fontSize = computedStyle.fontSize;

    // Map pixel sizes to font size values
    const pixelSize = parseFloat(fontSize);
    if (pixelSize <= 10) return '2';
    if (pixelSize <= 12) return '3';
    if (pixelSize <= 14) return '4';
    if (pixelSize <= 16) return '5';
    if (pixelSize <= 18) return '6';
    if (pixelSize <= 24) return '7';
    if (pixelSize <= 32) return '8';
    if (pixelSize <= 48) return '9';
    return '5'; // default
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

  const fontColors = [
    // Row 1: Greens
    { label: 'Green', value: '#00CC00' },
    { label: 'Light Green', value: '#90EE90' },
    { label: 'Lime', value: '#00FF00' },
    { label: 'Olive', value: '#808000' },
    { label: 'Dark Green', value: '#006400' },
    // Row 2: Yellows/Oranges
    { label: 'Yellow', value: '#FFFF00' },
    { label: 'Gold', value: '#FFD700' },
    { label: 'Orange', value: '#FF6600' },
    { label: 'Dark Orange', value: '#FF8C00' },
    { label: 'Coral', value: '#FF7F50' },
    // Row 3: Reds/Pinks
    { label: 'Red', value: '#FF0000' },
    { label: 'Crimson', value: '#DC143C' },
    { label: 'Pink', value: '#FF00CC' },
    { label: 'Hot Pink', value: '#FF69B4' },
    { label: 'Salmon', value: '#FA8072' },
    // Row 4: Purples/Blues
    { label: 'Purple', value: '#6600CC' },
    { label: 'Violet', value: '#8A2BE2' },
    { label: 'Blue', value: '#0066FF' },
    { label: 'Light Blue', value: '#87CEEB' },
    { label: 'Navy', value: '#000080' },
    // Row 5: Grayscale
    { label: 'White', value: '#FFFFFF' },
    { label: 'Light Gray', value: '#D3D3D3' },
    { label: 'Gray', value: '#808080' },
    { label: 'Dark Gray', value: '#333333' },
    { label: 'Black', value: '#000000' }
  ];

  const renderToolbar = () => {
    const buttons: React.ReactElement[] = [];

    toolbar.forEach((item, index) => {
      if (item === '|') {
        buttons.push(<div key={`separator-${index}`} className="hh-toolbar-separator" />);
        return;
      }

      const button = item as ToolbarButton;
      const buttonConfig = getButtonConfig(button);

      // Special handling for fontSize (block format) and fontColor dropdowns
      if (button === 'fontSize') {
        buttons.push(
          <div key={button} className="hh-fontsize-controls">
            <div className="hh-toolbar-dropdown-wrapper" ref={blockFormatDropdownRef}>
              <button
                type="button"
                className={`hh-toolbar-button ${showBlockFormatDropdown ? 'hh-active' : ''}`}
                onClick={() => handleToolbarClick(button)}
                disabled={disabled}
                title={buttonConfig.title}
              >
                {(() => {
                  const currentFormat = getCurrentBlockFormat();
                  const formatObj = blockFormats.find(f => f.value === currentFormat);
                  return formatObj ? formatObj.label : 'Paragraph';
                })()}
                <span className="hh-dropdown-arrow">▼</span>
              </button>
              {showBlockFormatDropdown && (() => {
                const currentFormat = getCurrentBlockFormat();
                return (
                  <div className="hh-toolbar-dropdown hh-blockformat-dropdown">
                    {blockFormats.map((format) => {
                      const isSelected = currentFormat === format.value;
                      return (
                        <div
                          key={format.value}
                          className={`hh-dropdown-item hh-blockformat-item ${isSelected ? 'hh-selected' : ''}`}
                          onClick={() => handleBlockFormatSelect(format.tag)}
                        >
                          <span
                            className="hh-blockformat-preview"
                            style={{
                              fontSize: format.value.startsWith('heading') 
                                ? format.value === 'heading1' ? '2em' 
                                : format.value === 'heading2' ? '1.5em'
                                : format.value === 'heading3' ? '1.17em'
                                : format.value === 'heading4' ? '1em'
                                : format.value === 'heading5' ? '0.83em'
                                : '0.67em'
                                : '1em',
                              fontWeight: format.value.startsWith('heading') ? 'bold' : 'normal',
                              fontFamily: format.value === 'preformatted' ? 'monospace' : 'inherit'
                            }}
                          >
                            {format.label}
                          </span>
                          {isSelected && (
                            <span className="hh-checkmark">✓</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
            <button
              type="button"
              className="hh-toolbar-button hh-fontsize-btn"
              onClick={handleDecreaseFontSize}
              disabled={disabled}
              title="Giảm kích thước font"
            >
              −
            </button>
            <div className="hh-fontsize-display" key={fontSizeUpdateTrigger}>
              {getCurrentFontSizeLabel()}
            </div>
            <button
              type="button"
              className="hh-toolbar-button hh-fontsize-btn"
              onClick={handleIncreaseFontSize}
              disabled={disabled}
              title="Tăng kích thước font"
            >
              +
            </button>
          </div>
        );
      } else if (button === 'fontColor') {
        buttons.push(
          <div key={button} className="hh-toolbar-dropdown-wrapper" ref={fontColorDropdownRef}>
            <button
              type="button"
              className={`hh-toolbar-button ${showFontColorDropdown ? 'hh-active' : ''}`}
              onClick={() => handleToolbarClick(button)}
              disabled={disabled}
              title={buttonConfig.title}
            >
              <span className="hh-color-icon" style={{ color: '#000000' }}>A</span>
              <span className="hh-dropdown-arrow">▼</span>
            </button>
            {showFontColorDropdown && (() => {
              const currentColor = getCurrentFontColor();
              return (
                <div 
                  className="hh-toolbar-dropdown hh-color-dropdown"
                  onMouseLeave={() => {
                    setHoveredColor(null);
                    setHoveredColorPosition(null);
                  }}
                >
                  <div className="hh-color-grid">
                    {fontColors.map((color) => {
                      const isSelected = currentColor?.toUpperCase() === color.value.toUpperCase();
                      return (
                        <div
                          key={color.value}
                          className={`hh-color-swatch ${isSelected ? 'hh-selected' : ''} ${hoveredColor === color.value ? 'hh-hovered' : ''}`}
                          style={{ backgroundColor: color.value }}
                          onClick={(e) => handleFontColorSelect(color.value, e)}
                          onMouseEnter={(e) => {
                            setHoveredColor(color.value);
                            const rect = e.currentTarget.getBoundingClientRect();
                            // Use viewport coordinates for fixed positioning
                            setHoveredColorPosition({
                              x: rect.left + rect.width / 2,
                              y: rect.top - 10
                            });
                          }}
                          onMouseLeave={() => {
                            setHoveredColor(null);
                            setHoveredColorPosition(null);
                          }}
                        />
                      );
                    })}
                  </div>
                  <div className="hh-color-controls">
                    <button
                      type="button"
                      className="hh-color-control-btn hh-automatic-btn"
                      onClick={handleAutomaticColor}
                      title="Automatic"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className="hh-icon-svg" style={{ width: '14px', height: '14px' }}>
                        <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" fill="white" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="hh-color-control-btn hh-no-color-btn"
                      onClick={handleNoColor}
                      title="No Color"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className="hh-icon-svg" style={{ width: '14px', height: '14px' }}>
                        <line x1="2" y1="2" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="hh-color-control-btn hh-palette-btn"
                      onClick={() => openColorPicker(currentColor || undefined)}
                      title="More Colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className="hh-icon-svg" style={{ width: '14px', height: '14px' }}>
                        <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zM2 8a6 6 0 0 1 6-6v12a6 6 0 0 1-6-6z" fill="currentColor" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        );
      } else {
        // Render icon - use SVG for undo/redo/align, text for others
        const renderIcon = () => {
          if (button === 'undo') {
            return (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048" className="hh-icon-svg">
                <path d="M1152 640q128 0 245 48t208 139q91 91 139 208t48 245q0 133-50 249t-137 204-203 137-250 50v-128q106 0 199-40t162-110 110-163 41-199q0-106-40-199t-110-162-163-110-199-41H475l402 403-90 90-557-557 557-557 90 90-402 403h677z" />
              </svg>
            );
          } else if (button === 'redo') {
            return (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048" className="hh-icon-svg" style={{ transform: 'scaleX(-1)' }}>
                <path d="M1152 640q128 0 245 48t208 139q91 91 139 208t48 245q0 133-50 249t-137 204-203 137-250 50v-128q106 0 199-40t162-110 110-163 41-199q0-106-40-199t-110-162-163-110-199-41H475l402 403-90 90-557-557 557-557 90 90-402 403h677z" />
              </svg>
            );
          } else if (button === 'alignLeft') {
            return (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className="hh-icon-svg">
                <path d="M2 3h12v1.5H2V3zm0 3h9v1.5H2V6zm0 3h12v1.5H2V9zm0 3h8v1.5H2V12z" />
              </svg>
            );
          } else if (button === 'alignCenter') {
            return (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className="hh-icon-svg">
                <path d="M2 3h12v1.5H2V3zm1.5 3h9v1.5h-9V6zm0 3h12v1.5h-12V9zm1.5 3h9v1.5h-9V12z" />
              </svg>
            );
          } else if (button === 'alignRight') {
            return (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className="hh-icon-svg">
                <path d="M2 3h12v1.5H2V3zm3 3h9v1.5H5V6zm0 3h12v1.5H5V9zm4 3h8v1.5H9V12z" />
              </svg>
            );
          } else if (button === 'alignJustify') {
            return (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className="hh-icon-svg">
                <path d="M2 3h12v1.5H2V3zm0 3h12v1.5H2V6zm0 3h12v1.5H2V9zm0 3h12v1.5H2V12z" />
              </svg>
            );
          } else if (button === 'link') {
            return (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048" className="hh-icon-svg">
                <path d="M1536 768v128q76 0 145 17t123 56 84 99 32 148q0 66-25 124t-69 101-102 69-124 26h-512q-66 0-124-25t-101-69-69-102-26-124q0-87 31-147t85-99 122-56 146-18V768h-64q-93 0-174 35t-142 96-96 142-36 175q0 93 35 174t96 142 142 96 175 36h512q93 0 174-35t142-96 96-142 36-175q0-93-35-174t-96-142-142-96-175-36h-64zm-640 512v-128q76 0 145-17t123-56 84-99 32-148q0-66-25-124t-69-101-102-69-124-26H448q-66 0-124 25t-101 69-69 102-26 124q0 87 31 147t85 99 122 56 146 18v128h-64q-93 0-174-35t-142-96-96-142T0 832q0-93 35-174t96-142 142-96 175-36h512q93 0 174 35t142 96 96 142 36 175q0 93-35 174t-96 142-142 96-175 36h-64z" />
              </svg>
            );
          } else if (button === 'image') {
            return (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048" className="hh-icon-svg">
                <path d="M1792 1536H256V384h1536v1152zM384 512v486l352-352 448 447 192-191 288 287V512H384zm0 896h933L736 827l-352 351v230zm1280 0v-37l-288-288-102 101 225 224h165zm-192-640q-26 0-45-19t-19-45q0-26 19-45t45-19q26 0 45 19t19 45q0 26-19 45t-45 19zM2048 0v2048H0V0h2048zm-128 128H128v1792h1792V128z" />
              </svg>
            );
          } else {
            return buttonConfig.icon;
          }
        };

        buttons.push(
          <button
            key={button}
            type="button"
            className="hh-toolbar-button"
            onClick={() => handleToolbarClick(button)}
            disabled={disabled}
            title={buttonConfig.title}
          >
            {renderIcon()}
          </button>
        );
      }
    });

    return buttons;
  };

  const getButtonConfig = (button: ToolbarButton) => {
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

  return (
    <>
      <div className={`hh-rich-text-editor ${isFullscreen ? 'hh-fullscreen' : ''} ${disabled ? 'hh-disabled' : ''}`}>
        <div className="hh-toolbar">
          {renderToolbar()}
        </div>

        <div style={{ position: 'relative' }}>
          {showCodeView ? (
            <textarea
              className="hh-code-view"
              value={codeContent}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCodeContent(e.target.value)}
              style={{ height, width: '100%', padding: '10px', fontFamily: 'monospace' }}
            />
          ) : (
            <div
              ref={editorRef}
              className="hh-editor-content"
              contentEditable={!disabled}
              onInput={() => {
                // Only cleanup headings if not applying format from dropdown
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
              style={{ height, minHeight: height }}
              data-placeholder={placeholder}
              suppressContentEditableWarning
            />
          )}
          {selectedImage && !showCodeView && (
            <div
              ref={resizeHandleRef}
              className="hh-image-resize-handle"
              onMouseDown={handleResizeMouseDown}
              style={{
                position: 'absolute',
                zIndex: 1000
              }}
            />
          )}
        </div>
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

      {/* Image Upload Modal */}
      {showImageModal && (
        <div className="hh-image-modal-overlay" onClick={() => !isUploading && setShowImageModal(false)}>
          <div className="hh-image-modal" onClick={(e) => e.stopPropagation()}>
            <div className="hh-image-modal-header">
              <h3>Chèn hình ảnh</h3>
              <button
                className="hh-image-modal-close"
                onClick={() => !isUploading && setShowImageModal(false)}
                disabled={isUploading}
              >
                ×
              </button>
            </div>

            <div className="hh-image-modal-body">
              <div className="hh-image-upload-options">
                <div className="hh-upload-option">
                  <button
                    className="hh-upload-button"
                    onClick={handleOpenFileDialog}
                    disabled={isUploading}
                  >
                    📁 Chọn file từ máy
                  </button>
                  <p className="hh-upload-hint">Chọn ảnh từ máy tính của bạn (JPG, PNG, GIF, max 10MB)</p>
                </div>

                <div className="hh-upload-divider">
                  <span>HOẶC</span>
                </div>

                <div className="hh-upload-option">
                  <input
                    type="text"
                    className="hh-image-url-input"
                    placeholder="Nhập URL hình ảnh (https://...)"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleInsertImageFromUrl()}
                    disabled={isUploading}
                  />
                  <button
                    className="hh-insert-url-button"
                    onClick={handleInsertImageFromUrl}
                    disabled={isUploading || !imageUrl.trim()}
                  >
                    Chèn từ URL
                  </button>
                </div>
              </div>

              {isUploading && (
                <div className="hh-upload-progress">
                  <div className="hh-upload-spinner"></div>
                  <p>Đang xử lý ảnh...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showColorPicker && (
        <div className="hh-color-picker-overlay" onClick={handleColorPickerCancel}>
          <div className="hh-color-picker-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="hh-color-picker-header">
              <h3>Color Picker</h3>
              <button
                className="hh-color-picker-close"
                onClick={handleColorPickerCancel}
                title="Close"
              >
                ×
              </button>
            </div>
            
            <div className="hh-color-picker-content">
              <div className="hh-color-picker-left">
                <div
                  className="hh-color-picker-gradient"
                  style={{
                    background: `linear-gradient(to bottom, transparent, black), linear-gradient(to right, white, hsl(${pickerColor.h}, 100%, 50%))`
                  }}
                  onMouseDown={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const handleMove = (moveEvent: MouseEvent) => {
                      const x = Math.max(0, Math.min(1, (moveEvent.clientX - rect.left) / rect.width));
                      const y = Math.max(0, Math.min(1, (moveEvent.clientY - rect.top) / rect.height));
                      updatePickerColor({ s: x * 100, l: (1 - y) * 100 });
                    };
                    const handleUp = () => {
                      document.removeEventListener('mousemove', handleMove);
                      document.removeEventListener('mouseup', handleUp);
                    };
                    handleMove(e.nativeEvent);
                    document.addEventListener('mousemove', handleMove);
                    document.addEventListener('mouseup', handleUp);
                  }}
                >
                  <div
                    className="hh-color-picker-indicator"
                    style={{
                      left: `${pickerColor.s}%`,
                      top: `${100 - pickerColor.l}%`
                    }}
                  />
                </div>
                
                <div
                  className="hh-color-picker-hue-slider"
                  onMouseDown={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const handleMove = (moveEvent: MouseEvent) => {
                      const y = Math.max(0, Math.min(1, (moveEvent.clientY - rect.top) / rect.height));
                      updatePickerColor({ h: (1 - y) * 360 });
                    };
                    const handleUp = () => {
                      document.removeEventListener('mousemove', handleMove);
                      document.removeEventListener('mouseup', handleUp);
                    };
                    handleMove(e.nativeEvent);
                    document.addEventListener('mousemove', handleMove);
                    document.addEventListener('mouseup', handleUp);
                  }}
                >
                  <div
                    className="hh-color-picker-hue-indicator"
                    style={{
                      top: `${100 - (pickerColor.h / 360) * 100}%`
                    }}
                  />
                </div>
              </div>
              
              <div className="hh-color-picker-right">
                <div className="hh-color-picker-inputs">
                  <div className="hh-color-picker-input-group">
                    <label>R</label>
                    <input
                      type="number"
                      min="0"
                      max="255"
                      value={pickerColor.r}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        updatePickerColor({ r: Math.max(0, Math.min(255, val)) });
                      }}
                    />
                  </div>
                  <div className="hh-color-picker-input-group">
                    <label>G</label>
                    <input
                      type="number"
                      min="0"
                      max="255"
                      value={pickerColor.g}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        updatePickerColor({ g: Math.max(0, Math.min(255, val)) });
                      }}
                    />
                  </div>
                  <div className="hh-color-picker-input-group">
                    <label>B</label>
                    <input
                      type="number"
                      min="0"
                      max="255"
                      value={pickerColor.b}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        updatePickerColor({ b: Math.max(0, Math.min(255, val)) });
                      }}
                    />
                  </div>
                </div>
                
                <div className="hh-color-picker-hex">
                  <label>#</label>
                  <input
                    type="text"
                    value={pickerColor.hex.substring(1).toUpperCase()}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9A-Fa-f]/g, '').substring(0, 6);
                      if (val.length === 6) {
                        updatePickerColor({ hex: '#' + val });
                      } else if (val.length > 0) {
                        setPickerColor(prev => ({ ...prev, hex: '#' + val }));
                      }
                    }}
                    onBlur={(e) => {
                      const val = e.target.value.replace(/[^0-9A-Fa-f]/g, '').substring(0, 6);
                      if (val.length === 6) {
                        updatePickerColor({ hex: '#' + val });
                      } else {
                        // Restore valid hex if invalid
                        const currentHex = pickerColor.hex.substring(1).toUpperCase();
                        e.target.value = currentHex;
                      }
                    }}
                  />
                </div>
                
                <div className="hh-color-picker-preview">
                  <div
                    className="hh-color-picker-preview-color"
                    style={{ backgroundColor: pickerColor.hex }}
                  />
                </div>
              </div>
            </div>
            
            <div className="hh-color-picker-footer">
              <button
                className="hh-color-picker-cancel"
                onClick={handleColorPickerCancel}
              >
                Cancel
              </button>
              <button
                className="hh-color-picker-save"
                onClick={handleColorPickerSave}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AuroraEditor;

