import React, { useRef, useEffect, useState, useCallback, useLayoutEffect } from 'react';
import './AuroraEditor.css';
import { Toolbar } from './components/Toolbar';
import { EditorContent } from './components/EditorContent';
import { ColorPicker, PickerColor } from './components/ColorPicker';
import { ImageModal } from './components/ImageModal';
import { ImageToolbar } from './components/ImageToolbar';
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
  const imageToolbarRef = useRef<HTMLDivElement>(null);
  const imageBoundingBoxRef = useRef<HTMLDivElement>(null);
  const [imageZoom, setImageZoom] = useState(100);
  const [imageAlignment, setImageAlignment] = useState('inline');
  const [showBlockFormatDropdown, setShowBlockFormatDropdown] = useState(false);
  const [showFontColorDropdown, setShowFontColorDropdown] = useState(false);
  const [showAlignmentDropdown, setShowAlignmentDropdown] = useState(false);
  const [showListStyleDropdown, setShowListStyleDropdown] = useState(false);
  const [showBulletStyleDropdown, setShowBulletStyleDropdown] = useState(false);
  const [fontSizeUpdateTrigger, setFontSizeUpdateTrigger] = useState(0);
  const [buttonStateUpdateTrigger, setButtonStateUpdateTrigger] = useState(0);
  const [blockFormatUpdateTrigger, setBlockFormatUpdateTrigger] = useState(0);
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
  const buttonStateUpdateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onChangeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastContentRef = useRef<string>('');
  // Event delegation for image clicks - optimized like modern editors (TinyMCE, CKEditor approach)
  const handleImageClick = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    // Check if clicked element is an image or inside an image
    const img = target.tagName === 'IMG' ? target as HTMLImageElement : target.closest('img') as HTMLImageElement;

    if (img && editorRef.current) {
        e.stopPropagation();

      // Optimized: Only update if image changed (avoid unnecessary DOM operations)
      if (selectedImage !== img) {
        // Only remove class from previously selected image (if any)
        if (selectedImage) {
          selectedImage.classList.remove('hh-selected');
        }
        // Add selected class to clicked image
        img.classList.add('hh-selected');
        setSelectedImage(img);

        // Reset zoom and alignment when selecting a new image
        // Check if image has explicit width/height to determine zoom
        const computedStyle = window.getComputedStyle(img);
        const hasExplicitSize = img.style.width || img.style.height ||
          (computedStyle.width !== 'auto' && computedStyle.width !== '100%' && !computedStyle.width.includes('%'));
        if (!hasExplicitSize) {
          // Default to 100% if no explicit size
          setImageZoom(100);
        } else {
          // Calculate current zoom based on natural size
          const naturalWidth = img.naturalWidth || img.width;
          const currentWidth = parseFloat(computedStyle.width) || img.offsetWidth;
          if (naturalWidth > 0 && currentWidth > 0) {
            const zoom = Math.round((currentWidth / naturalWidth) * 100);
            setImageZoom(zoom);
          } else {
            setImageZoom(100);
          }
        }

        // Check alignment
        const float = computedStyle.float;
        const display = computedStyle.display;
        const marginLeft = computedStyle.marginLeft;
        const marginRight = computedStyle.marginRight;
        if (float === 'left') {
          setImageAlignment('left');
        } else if (float === 'right') {
          setImageAlignment('right');
        } else if (display === 'block' && (marginLeft === 'auto' || marginRight === 'auto' || (marginLeft === marginRight && marginLeft !== '0px'))) {
          setImageAlignment('center');
        } else {
          setImageAlignment('inline');
        }
      }
    }
  }, [selectedImage]);


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
      // Don't update if editor is focused and user is typing
      // This prevents cursor from jumping to the beginning when onChange updates the value prop
      if (document.activeElement === editorRef.current) {
        // Editor is focused, check if content is similar (user might be typing)
        const currentContent = editorRef.current.innerHTML;
        // Only update if content is significantly different (not just from typing)
        // This allows external updates but prevents cursor jump during typing
        if (Math.abs(currentContent.length - value.length) > 10 || 
            !currentContent.includes(value.substring(0, Math.min(50, value.length))) &&
            !value.includes(currentContent.substring(0, Math.min(50, currentContent.length)))) {
          // Content is significantly different, likely external update
          isUndoRedoRef.current = true;
          // Save selection before updating
          const selection = window.getSelection();
          let savedRange: Range | null = null;
          if (selection && selection.rangeCount > 0) {
            savedRange = selection.getRangeAt(0).cloneRange();
          }
          
      editorRef.current.innerHTML = value;
          
          // Restore selection if possible
          if (savedRange && selection) {
            try {
              selection.removeAllRanges();
              selection.addRange(savedRange);
            } catch (e) {
              // Selection might be invalid, ignore
            }
          }
          
      const timeoutId = setTimeout(() => {
            isUndoRedoRef.current = false;
      }, 100);
      return () => clearTimeout(timeoutId);
    }
        // Content is similar, likely from typing, don't update to avoid cursor jump
        return;
      }
      
      // Editor is not focused, safe to update
      isUndoRedoRef.current = true;
      editorRef.current.innerHTML = value;

      // Initialize history with current value if empty
      if (historyRef.current.length === 0) {
        historyRef.current = [value];
        historyIndexRef.current = 0;
      }

      // Event delegation handles image clicks automatically, no need to re-attach
      const timeoutId = setTimeout(() => {
        isUndoRedoRef.current = false;
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [value]);

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
    if (!editorRef.current) return;

    // Debounce onChange to avoid calling it on every keystroke (especially with many images)
    // This is critical for performance when there are many images
    if (onChangeTimeoutRef.current) {
      clearTimeout(onChangeTimeoutRef.current);
    }

    onChangeTimeoutRef.current = setTimeout(() => {
    if (editorRef.current && onChange) {
        const content = editorRef.current.innerHTML;
        // Only call onChange if content actually changed
        if (content !== lastContentRef.current) {
          lastContentRef.current = content;
          onChange(content);
        }
      }
    }, 100); // Debounce onChange by 100ms

    // Save history with debounce for typing
    if (saveHistoryTimeoutRef.current) {
      clearTimeout(saveHistoryTimeoutRef.current);
    }

    saveHistoryTimeoutRef.current = setTimeout(() => {
      saveToHistory();
    }, 500); // Increased debounce time for history to reduce lag
  }, [onChange]);

  // Memoized input handler - optimized to minimize operations during typing
  const handleInput = useCallback(() => {
    // Only trigger content change (debounced internally)
    handleContentChange();

    // Debounce button state updates more aggressively to avoid blocking typing
    if (buttonStateUpdateTimeoutRef.current) {
      clearTimeout(buttonStateUpdateTimeoutRef.current);
    }
    buttonStateUpdateTimeoutRef.current = setTimeout(() => {
      setButtonStateUpdateTrigger(prev => prev + 1);
      setBlockFormatUpdateTrigger(prev => prev + 1);
    }, 300); // Increased from 150ms to 300ms to reduce lag
  }, [handleContentChange]);

  // Memoized paste handler
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
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
      // Plain text paste
      const lines = plainData.split(/\r?\n/).filter(line => line.trim() || line === '');

      if (lines.length === 0) {
        handleContentChange();
        return;
      }

      const fragment = document.createDocumentFragment();
      lines.forEach((line) => {
        const p = document.createElement('p');
        p.textContent = line;
        fragment.appendChild(p);
      });

      range.deleteContents();
      range.insertNode(fragment);

      // Move cursor to end of pasted content
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    handleContentChange();
    // Event delegation handles image clicks automatically
  }, [handleContentChange]);

  // Setup event delegation for image clicks (much more efficient)
  useEffect(() => {
    if (!editorRef.current) return;

    // Use event delegation - single handler on editor container instead of one per image
    const handleEditorClick = (e: MouseEvent) => {
      handleImageClick(e);
    };

    editorRef.current.addEventListener('click', handleEditorClick, true); // Use capture phase
    
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
      // Don't deselect if clicking on bounding box or its handles
      if (imageBoundingBoxRef.current && imageBoundingBoxRef.current.contains(target)) {
        return;
      }
      // Don't deselect if clicking on image toolbar
      if (imageToolbarRef.current && imageToolbarRef.current.contains(target)) {
        return;
      }
      // Check if click is inside toolbar
      const toolbar = document.querySelector('.hh-toolbar');
      const isClickInToolbar = toolbar ? toolbar.contains(target) : false;
      
      // Check if click is inside editor content (but not toolbar)
      const isClickInEditor = editorRef.current && editorRef.current.contains(target) && !isClickInToolbar;

      // Close block format dropdown if clicking outside
      if (showBlockFormatDropdown) {
        if (!isClickInToolbar && !isClickInEditor) {
          // Click outside toolbar and editor, definitely close
          setShowBlockFormatDropdown(false);
        } else if (isClickInEditor) {
          // Click in editor content, close dropdown
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

      // Close alignment dropdown if clicking outside
      if (showAlignmentDropdown) {
        if (!isClickInToolbar && !isClickInEditor) {
          // Click outside toolbar and editor, definitely close
          setShowAlignmentDropdown(false);
        } else if (isClickInEditor) {
          // Click in editor content, close dropdown
          setShowAlignmentDropdown(false);
        } else {
          // Click in toolbar, check if it's on the alignment dropdown or its button
          const alignmentDropdown = document.querySelector('.hh-alignment-dropdown');
          const isClickInAlignmentDropdown = alignmentDropdown ? alignmentDropdown.contains(target) : false;

          if (!isClickInAlignmentDropdown) {
            // Check if click is on the button by traversing up
            let isClickOnButton = false;
            if (target instanceof Element) {
              let current: Element | null = target;
              while (current && current !== toolbar) {
                if (current.classList && current.classList.contains('hh-toolbar-dropdown-wrapper')) {
                  if (current.querySelector('.hh-alignment-dropdown')) {
                    isClickOnButton = true;
                    break;
                  }
                }
                current = current.parentElement;
              }
            }

            if (!isClickOnButton) {
              setShowAlignmentDropdown(false);
            }
          }
        }
      }

      // Close list style dropdown if clicking outside
      if (showListStyleDropdown) {
        if (!isClickInToolbar && !isClickInEditor) {
          // Click outside toolbar and editor, definitely close
          setShowListStyleDropdown(false);
        } else if (isClickInEditor) {
          // Click in editor content, close dropdown
          setShowListStyleDropdown(false);
        } else {
          // Click in toolbar, check if it's on the list style dropdown or its button
          const listStyleDropdown = document.querySelector('.hh-list-style-dropdown');
          const isClickInListStyleDropdown = listStyleDropdown ? listStyleDropdown.contains(target) : false;

          if (!isClickInListStyleDropdown) {
            // Check if click is on the button by traversing up
            let isClickOnButton = false;
            if (target instanceof Element) {
              let current: Element | null = target;
              while (current && current !== toolbar) {
                if (current.classList && current.classList.contains('hh-toolbar-dropdown-wrapper')) {
                  if (current.querySelector('.hh-list-style-dropdown')) {
                    isClickOnButton = true;
                    break;
                  }
                }
                current = current.parentElement;
              }
            }

            if (!isClickOnButton) {
              setShowListStyleDropdown(false);
            }
          }
        }
      }

      // Close bullet style dropdown if clicking outside
      if (showBulletStyleDropdown) {
        if (!isClickInToolbar && !isClickInEditor) {
          // Click outside toolbar and editor, definitely close
          setShowBulletStyleDropdown(false);
        } else if (isClickInEditor) {
          // Click in editor content, close dropdown
          setShowBulletStyleDropdown(false);
        } else {
          // Click in toolbar, check if it's on the bullet style dropdown or its button
          const bulletStyleDropdown = document.querySelector('.hh-bullet-style-dropdown');
          const isClickInBulletStyleDropdown = bulletStyleDropdown ? bulletStyleDropdown.contains(target) : false;

          if (!isClickInBulletStyleDropdown) {
            // Check if click is on the button by traversing up
            let isClickOnButton = false;
            if (target instanceof Element) {
              let current: Element | null = target;
              while (current && current !== toolbar) {
                if (current.classList && current.classList.contains('hh-toolbar-dropdown-wrapper')) {
                  if (current.querySelector('.hh-bullet-style-dropdown')) {
                    isClickOnButton = true;
                    break;
                  }
                }
                current = current.parentElement;
              }
            }

            if (!isClickOnButton) {
              setShowBulletStyleDropdown(false);
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
      
      // Deselect image if clicking outside editor, image, bounding box, and toolbar
      if (editorRef.current && !editorRef.current.contains(target)) {
        setSelectedImage(null);
      } else if (selectedImage && editorRef.current && editorRef.current.contains(target)) {
        // Click inside editor but not on image, bounding box, or toolbar - deselect
        if (selectedImage !== target && !selectedImage.contains(target)) {
          // Check if click is on a resize handle
          const isResizeHandle = (target as Element)?.closest('.hh-resize-handle');
          if (!isResizeHandle) {
        setSelectedImage(null);
          }
        }
      }
    };

    // Use mousedown instead of click to catch events before stopPropagation
    document.addEventListener('mousedown', handleClickOutside);

    // Update button states and block format when selection changes (debounced)
    // Use longer debounce and check if editor is focused to avoid interfering with typing
    const handleSelectionChange = () => {
      // Don't update if editor is not focused (user might be typing)
      if (!editorRef.current || document.activeElement !== editorRef.current) {
        return;
      }
      
      if (buttonStateUpdateTimeoutRef.current) {
        clearTimeout(buttonStateUpdateTimeoutRef.current);
      }
      buttonStateUpdateTimeoutRef.current = setTimeout(() => {
        // Double check editor is still focused before updating
        if (editorRef.current && document.activeElement === editorRef.current) {
          setButtonStateUpdateTrigger(prev => prev + 1);
          setBlockFormatUpdateTrigger(prev => prev + 1);
        }
      }, 200); // Increased debounce to avoid interfering with typing
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    if (editorRef.current) {
      editorRef.current.addEventListener('keyup', handleSelectionChange);
      editorRef.current.addEventListener('mouseup', handleSelectionChange);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('selectionchange', handleSelectionChange);
      if (editorRef.current) {
        editorRef.current.removeEventListener('keyup', handleSelectionChange);
        editorRef.current.removeEventListener('mouseup', handleSelectionChange);
        editorRef.current.removeEventListener('click', handleEditorClick, true);
      }
      if (buttonStateUpdateTimeoutRef.current) {
        clearTimeout(buttonStateUpdateTimeoutRef.current);
      }
    };
  }, [selectedImage, handleImageClick, showFontColorDropdown, showBlockFormatDropdown, showAlignmentDropdown, showListStyleDropdown, showBulletStyleDropdown, isSelectingColorRef]);

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
    // Update button states after command execution
    setButtonStateUpdateTrigger(prev => prev + 1);
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
      // Event delegation handles image clicks automatically

      setTimeout(() => {
        isUndoRedoRef.current = false;
      }, 100);
    }
  }, [handleContentChange]);

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
      // Event delegation handles image clicks automatically

      setTimeout(() => {
        isUndoRedoRef.current = false;
      }, 100);
    }
  }, [handleContentChange]);

  const handleToolbarClick = (button: ToolbarButton) => {
    if (disabled) return;

    switch (button) {
      case 'bold':
        {
          if (!editorRef.current) break;
          const bookmark = saveSelection(editorRef.current);
          execCommand('bold');
          if (bookmark) {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                restoreSelection(editorRef.current!, bookmark);
                editorRef.current?.focus();
              });
            });
          }
        }
        break;
      case 'italic':
        {
          if (!editorRef.current) break;
          const bookmark = saveSelection(editorRef.current);
          execCommand('italic');
          if (bookmark) {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                restoreSelection(editorRef.current!, bookmark);
                editorRef.current?.focus();
              });
            });
          }
        }
        break;
      case 'underline':
        {
          if (!editorRef.current) break;
          const bookmark = saveSelection(editorRef.current);
          execCommand('underline');
          if (bookmark) {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                restoreSelection(editorRef.current!, bookmark);
                editorRef.current?.focus();
              });
            });
          }
        }
        break;
      case 'strike':
        {
          if (!editorRef.current) break;
          const bookmark = saveSelection(editorRef.current);
          execCommand('strikeThrough');
          if (bookmark) {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                restoreSelection(editorRef.current!, bookmark);
                editorRef.current?.focus();
              });
            });
          }
        }
        break;
      case 'alignLeft':
      case 'alignCenter':
      case 'alignRight':
      case 'alignJustify':
        // These are now handled by alignment dropdown
        setShowAlignmentDropdown(!showAlignmentDropdown);
        setShowBlockFormatDropdown(false);
        setShowFontColorDropdown(false);
        break;
      case 'unorderedList':
        {
          if (!editorRef.current) break;
          const bulletBookmark = saveSelection(editorRef.current);
          
          // Toggle bullet list (insert/remove unordered list)
          if (document.queryCommandState('insertUnorderedList')) {
            // Already in unordered list, remove it
            execCommand('insertUnorderedList');
          } else {
            // Not in unordered list, insert it with default style
            execCommand('insertUnorderedList');
            // Apply default disc style
            setTimeout(() => {
              const selection = window.getSelection();
              if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                let ulElement: HTMLElement | null = null;
                let node: Node | null = range.commonAncestorContainer;
                
                while (node && node !== editorRef.current) {
                  if (node.nodeType === Node.ELEMENT_NODE) {
                    const element = node as HTMLElement;
                    if (element.tagName === 'UL') {
                      ulElement = element;
                      break;
                    }
                  }
                  node = node.parentNode;
                }
                
                if (ulElement) {
                  ulElement.style.listStyleType = 'disc';
                }
              }
            }, 0);
          }
          
          // Restore selection after toggle
          if (bulletBookmark) {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                restoreSelection(editorRef.current!, bulletBookmark);
                editorRef.current?.focus();
              });
            });
          }
          
          // Close other dropdowns
          setShowBulletStyleDropdown(false);
          setShowBlockFormatDropdown(false);
          setShowFontColorDropdown(false);
          setShowAlignmentDropdown(false);
          setShowListStyleDropdown(false);
        }
        break;
      case 'orderedList':
        {
          if (!editorRef.current) break;
          const bookmark = saveSelection(editorRef.current);
          
          // Toggle numbered list (insert/remove ordered list)
          if (document.queryCommandState('insertOrderedList')) {
            // Already in ordered list, remove it
            execCommand('insertOrderedList');
          } else {
            // Not in ordered list, insert it with default style
            execCommand('insertOrderedList');
            // Apply default decimal style
            setTimeout(() => {
              const selection = window.getSelection();
              if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                let olElement: HTMLElement | null = null;
                let node: Node | null = range.commonAncestorContainer;
                
                while (node && node !== editorRef.current) {
                  if (node.nodeType === Node.ELEMENT_NODE) {
                    const element = node as HTMLElement;
                    if (element.tagName === 'OL') {
                      olElement = element;
                      break;
                    }
                  }
                  node = node.parentNode;
                }
                
                if (olElement) {
                  olElement.style.listStyleType = 'decimal';
                  olElement.setAttribute('type', '1');
                }
              }
            }, 0);
          }
          
          // Restore selection after toggle
          if (bookmark) {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                restoreSelection(editorRef.current!, bookmark);
                editorRef.current?.focus();
              });
            });
          }
          
          // Close other dropdowns
          setShowListStyleDropdown(false);
          setShowBlockFormatDropdown(false);
          setShowFontColorDropdown(false);
          setShowAlignmentDropdown(false);
          setShowBulletStyleDropdown(false);
        }
        break;
      case 'undo':
        handleUndo();
        break;
      case 'redo':
        handleRedo();
        break;
      case 'fontSize':
        const willShow = !showBlockFormatDropdown;
        setShowBlockFormatDropdown(willShow);
        setShowFontColorDropdown(false);
        // Update block format when opening dropdown
        if (willShow) {
          setBlockFormatUpdateTrigger(prev => prev + 1);
        }
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
    // Use loading="lazy" for better performance (like modern editors)
    img.loading = 'lazy';
    img.src = imageSrc;

    // Set initial styles - default: 100% zoom and center alignment
    img.style.borderRadius = '4px';
    img.style.margin = '8px auto';
    img.style.position = 'relative';
    img.style.display = 'block';
    img.style.verticalAlign = 'middle';
    // Center alignment
    img.style.float = 'none';
    img.style.marginLeft = 'auto';
    img.style.marginRight = 'auto';
    // Set max-width initially but it will be removed when resizing
    img.style.maxWidth = '100%';
    img.style.height = 'auto';

    // No onclick handler needed - event delegation handles it
    // This is the approach used by TinyMCE, CKEditor, etc.

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
    // No need to attach handlers - event delegation handles it automatically
  };

  // Update bounding box and toolbar position
  useLayoutEffect(() => {
    if (!selectedImage || !editorRef.current) {
      // Hide bounding box and toolbar when no image selected
      if (imageBoundingBoxRef.current) {
        imageBoundingBoxRef.current.style.display = 'none';
      }
      if (imageToolbarRef.current) {
        imageToolbarRef.current.style.display = 'none';
      }
      if (resizeHandleRef.current) {
        resizeHandleRef.current.style.display = 'none';
      }
      return;
    }

    let rafId: number | null = null;
    let lastUpdateTime = 0;
    const UPDATE_THROTTLE = 16; // ~60fps

    const updateImageControlsPosition = () => {
      if (!selectedImage || !editorRef.current) return;

      const now = performance.now();
      if (now - lastUpdateTime < UPDATE_THROTTLE) {
        return;
      }
      lastUpdateTime = now;

      const rect = selectedImage.getBoundingClientRect();
      const editorRect = editorRef.current.getBoundingClientRect();

      // Update bounding box position
      if (imageBoundingBoxRef.current) {
        imageBoundingBoxRef.current.style.left = `${rect.left - editorRect.left}px`;
        imageBoundingBoxRef.current.style.top = `${rect.top - editorRect.top}px`;
        imageBoundingBoxRef.current.style.width = `${rect.width}px`;
        imageBoundingBoxRef.current.style.height = `${rect.height}px`;
        imageBoundingBoxRef.current.style.display = 'block';
      }

      // Update toolbar position (below image)
      if (imageToolbarRef.current) {
        imageToolbarRef.current.style.left = `${rect.left - editorRect.left}px`;
        imageToolbarRef.current.style.top = `${rect.bottom - editorRect.top + 4}px`;
        imageToolbarRef.current.style.display = 'flex';
        // Ensure pointer events are enabled for the toolbar
        const toolbar = imageToolbarRef.current.querySelector('.hh-image-toolbar');
        if (toolbar) {
          (toolbar as HTMLElement).style.pointerEvents = 'auto';
        }
      }
    };

    // Initial update
    updateImageControlsPosition();
    const timeoutId = setTimeout(updateImageControlsPosition, 0);

    // Throttled update on scroll/resize
    const updatePosition = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        updateImageControlsPosition();
        rafId = null;
      });
    };

    // Use MutationObserver to watch for image size/position changes
    // Only observe image attributes, not parent changes to avoid interfering with typing
    const observer = new MutationObserver(() => {
      updateImageControlsPosition();
    });

    // Only observe the image itself for style/class changes
    // Don't observe parent to avoid triggering during typing
    observer.observe(selectedImage, {
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    // Use passive listeners for better performance
    const scrollOptions = { passive: true, capture: true } as AddEventListenerOptions;
    window.addEventListener('scroll', updatePosition, scrollOptions);
    window.addEventListener('resize', updatePosition, { passive: true });

    // Also listen to editor scroll
    if (editorRef.current) {
      editorRef.current.addEventListener('scroll', updatePosition, { passive: true });
    }

    return () => {
      clearTimeout(timeoutId);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      window.removeEventListener('scroll', updatePosition, scrollOptions);
      window.removeEventListener('resize', updatePosition);
      if (editorRef.current) {
        editorRef.current.removeEventListener('scroll', updatePosition);
      }
      observer.disconnect();
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

  // Handle bounding box resize (from corner/midpoint handles)
  const handleBoundingBoxResize = useCallback((e: React.MouseEvent<HTMLDivElement>, handle: string) => {
    if (!selectedImage) return;

    e.preventDefault();
    e.stopPropagation();

    const img = selectedImage;
    const computedStyle = window.getComputedStyle(img);
    let startWidth = parseFloat(computedStyle.width) || img.offsetWidth || img.naturalWidth || 300;
    let startHeight = parseFloat(computedStyle.height) || img.offsetHeight || img.naturalHeight || 200;
    const aspectRatio = startWidth / startHeight;

    // Get natural dimensions if available
    if (img.naturalWidth && img.naturalWidth > 0 && computedStyle.maxWidth === '100%') {
      const containerWidth = img.parentElement?.offsetWidth || editorRef.current?.offsetWidth || window.innerWidth;
      const maxDisplayWidth = containerWidth - 32;
      if (startWidth >= maxDisplayWidth * 0.95) {
        startWidth = img.naturalWidth;
        startHeight = img.naturalHeight;
      }
    }

    const startX = e.clientX;
    const startY = e.clientY;
    let isResizingActive = true;

    // Remove constraints
    img.style.maxWidth = 'none';
    img.style.maxHeight = 'none';
    img.style.minWidth = 'none';
    img.style.minHeight = 'none';
    img.style.width = `${startWidth}px`;
    img.style.height = `${startHeight}px`;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingActive || !selectedImage) return;

      const diffX = e.clientX - startX;
      const diffY = e.clientY - startY;
      let newWidth = startWidth;
      let newHeight = startHeight;

      // Calculate new dimensions based on handle position
      switch (handle) {
        case 'se':
          newWidth = Math.max(50, startWidth + diffX);
          newHeight = newWidth / aspectRatio;
          break;
        case 'sw':
          newWidth = Math.max(50, startWidth - diffX);
          newHeight = newWidth / aspectRatio;
          break;
        case 'ne':
          newWidth = Math.max(50, startWidth + diffX);
          newHeight = newWidth / aspectRatio;
          break;
        case 'nw':
          newWidth = Math.max(50, startWidth - diffX);
          newHeight = newWidth / aspectRatio;
          break;
        case 'e':
          newWidth = Math.max(50, startWidth + diffX);
          newHeight = newWidth / aspectRatio;
          break;
        case 'w':
          newWidth = Math.max(50, startWidth - diffX);
          newHeight = newWidth / aspectRatio;
          break;
        case 's':
          newHeight = Math.max(50, startHeight + diffY);
          newWidth = newHeight * aspectRatio;
          break;
        case 'n':
          newHeight = Math.max(50, startHeight - diffY);
          newWidth = newHeight * aspectRatio;
          break;
      }

      img.style.width = `${newWidth}px`;
      img.style.height = `${newHeight}px`;
    };

    const handleMouseUp = () => {
      isResizingActive = false;
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

  // Handle image zoom change
  const handleImageZoomChange = useCallback((zoom: number) => {
    if (!selectedImage) {
      console.warn('No image selected for zoom');
      return;
    }

    console.log('Zoom change:', zoom);
    saveToHistory();

    // Wait for image to load if naturalWidth is 0
    if (selectedImage.naturalWidth === 0 && selectedImage.complete === false) {
      selectedImage.onload = () => {
        const naturalWidth = selectedImage.naturalWidth || selectedImage.width;
        const naturalHeight = selectedImage.naturalHeight || selectedImage.height;
        if (naturalWidth > 0 && naturalHeight > 0) {
          const newWidth = (naturalWidth * zoom) / 100;
          const newHeight = (naturalHeight * zoom) / 100;
          selectedImage.style.width = `${newWidth}px`;
          selectedImage.style.height = `${newHeight}px`;
          selectedImage.style.maxWidth = 'none';
          selectedImage.style.maxHeight = 'none';
          setImageZoom(zoom);
          handleContentChange();
        }
      };
      return;
    }

    // Get natural dimensions - use a fallback if naturalWidth is 0
    let naturalWidth = selectedImage.naturalWidth;
    let naturalHeight = selectedImage.naturalHeight;

    if (naturalWidth === 0 || naturalHeight === 0) {
      // Try to get from current dimensions or use fallback
      const currentWidth = parseFloat(window.getComputedStyle(selectedImage).width) || selectedImage.offsetWidth;
      const currentHeight = parseFloat(window.getComputedStyle(selectedImage).height) || selectedImage.offsetHeight;

      // If we have current zoom, calculate natural size
      if (imageZoom > 0 && imageZoom !== 100) {
        naturalWidth = (currentWidth * 100) / imageZoom;
        naturalHeight = (currentHeight * 100) / imageZoom;
      } else {
        naturalWidth = currentWidth || 300;
        naturalHeight = currentHeight || 200;
      }
    }

    const newWidth = (naturalWidth * zoom) / 100;
    const newHeight = (naturalHeight * zoom) / 100;
    selectedImage.style.width = `${newWidth}px`;
    selectedImage.style.height = `${newHeight}px`;
    selectedImage.style.maxWidth = 'none';
    selectedImage.style.maxHeight = 'none';
    setImageZoom(zoom);
    handleContentChange();
  }, [selectedImage, saveToHistory, handleContentChange, imageZoom]);

  // Handle image alignment change
  const handleImageAlignmentChange = useCallback((alignment: string) => {
    if (!selectedImage) {
      console.warn('No image selected for alignment');
      return;
    }

    console.log('Alignment change:', alignment);
    saveToHistory();

    // Clear existing alignment styles
    selectedImage.style.float = '';
    selectedImage.style.display = '';
    selectedImage.style.marginLeft = '';
    selectedImage.style.marginRight = '';
    selectedImage.style.textAlign = '';

    // Apply new alignment
    if (alignment === 'inline') {
      selectedImage.style.float = 'none';
      selectedImage.style.display = 'inline-block';
      selectedImage.style.marginLeft = '';
      selectedImage.style.marginRight = '';
    } else if (alignment === 'left') {
      selectedImage.style.float = 'left';
      selectedImage.style.display = 'block';
      selectedImage.style.marginLeft = '0';
      selectedImage.style.marginRight = 'auto';
    } else if (alignment === 'right') {
      selectedImage.style.float = 'right';
      selectedImage.style.display = 'block';
      selectedImage.style.marginLeft = 'auto';
      selectedImage.style.marginRight = '0';
    } else if (alignment === 'center') {
      selectedImage.style.float = 'none';
      selectedImage.style.display = 'block';
      selectedImage.style.marginLeft = 'auto';
      selectedImage.style.marginRight = 'auto';
    }

    setImageAlignment(alignment);
    handleContentChange();
  }, [selectedImage, saveToHistory, handleContentChange]);

  // Handle image delete
  const handleImageDelete = useCallback(() => {
    if (!selectedImage || !editorRef.current) {
      console.warn('No image selected for delete');
      return;
    }
    console.log('Delete image');
    saveToHistory();
    selectedImage.remove();
    setSelectedImage(null);
    handleContentChange();
  }, [selectedImage, saveToHistory, handleContentChange]);

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

  const getCurrentAlignment = (): string => {
    if (!editorRef.current) return 'left';

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return 'left';

    try {
      if (document.queryCommandState('justifyLeft')) return 'left';
      if (document.queryCommandState('justifyCenter')) return 'center';
      if (document.queryCommandState('justifyRight')) return 'right';
      if (document.queryCommandState('justifyFull')) return 'justify';
    } catch (e) {
      // Fallback
    }

    return 'left';
  };

  const getCurrentListStyle = (): string => {
    if (!editorRef.current) return 'decimal';

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return 'decimal';

    try {
      const range = selection.getRangeAt(0);
      let node: Node | null = range.commonAncestorContainer;

      // Find the <ol> element
      while (node && node !== editorRef.current) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          if (element.tagName === 'OL') {
            // Check type attribute first
            const type = element.getAttribute('type');
            if (type) {
              // Map HTML type values to CSS list-style-type
              const typeMap: Record<string, string> = {
                '1': 'decimal',
                'a': 'lower-alpha',
                'A': 'upper-alpha',
                'i': 'lower-roman',
                'I': 'upper-roman'
              };
              return typeMap[type] || 'decimal';
            }
            // Check style attribute
            const style = element.style.listStyleType;
            if (style) {
              return style;
            }
            // Check computed style
            const computedStyle = window.getComputedStyle(element);
            const listStyleType = computedStyle.listStyleType;
            if (listStyleType && listStyleType !== 'none') {
              return listStyleType;
            }
            return 'decimal'; // Default
          }
        }
        node = node.parentNode;
      }
    } catch (e) {
      // Fallback
    }

    return 'decimal';
  };

  const getCurrentBulletStyle = (): string => {
    if (!editorRef.current) return 'disc';

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return 'disc';

    try {
      const range = selection.getRangeAt(0);
      let node: Node | null = range.commonAncestorContainer;

      // Find the <ul> element
      while (node && node !== editorRef.current) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          if (element.tagName === 'UL') {
            // Check style attribute
            const style = element.style.listStyleType;
            if (style) {
              return style;
            }
            // Check computed style
            const computedStyle = window.getComputedStyle(element);
            const listStyleType = computedStyle.listStyleType;
            if (listStyleType && listStyleType !== 'none') {
              return listStyleType;
            }
            return 'disc'; // Default
          }
        }
        node = node.parentNode;
      }
    } catch (e) {
      // Fallback
    }

    return 'disc';
  };

  const applyListStyle = useCallback((style: string) => {
    if (!editorRef.current || disabled) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    try {
      // Save selection before any changes
      const bookmark = saveSelection(editorRef.current);
      
      // Save selection
      const range = selection.getRangeAt(0);
      const startContainer = range.startContainer;
      const startOffset = range.startOffset;
      const endContainer = range.endContainer;
      const endOffset = range.endOffset;

      // Check if we're in an ordered list
      let olElement: HTMLElement | null = null;
      let node: Node | null = range.commonAncestorContainer;

      while (node && node !== editorRef.current) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          if (element.tagName === 'OL') {
            olElement = element;
            break;
          }
        }
        node = node.parentNode;
      }

      if (olElement) {
        // We're in an ordered list, change its style
        olElement.style.listStyleType = style;
        // Also set type attribute for better compatibility
        const typeMap: Record<string, string> = {
          'decimal': '1',
          'lower-alpha': 'a',
          'upper-alpha': 'A',
          'lower-roman': 'i',
          'upper-roman': 'I'
        };
        if (typeMap[style]) {
          olElement.setAttribute('type', typeMap[style]);
        } else {
          olElement.removeAttribute('type');
        }
      } else {
        // Not in an ordered list, create one with the selected style
        // First, try to insert ordered list
        document.execCommand('insertOrderedList', false);
        
        // Use setTimeout to ensure DOM is updated before finding the <ol>
        setTimeout(() => {
          const currentSelection = window.getSelection();
          if (!currentSelection || currentSelection.rangeCount === 0) return;
          
          const currentRange = currentSelection.getRangeAt(0);
          let newOl: HTMLElement | null = null;
          let currentNode: Node | null = currentRange.commonAncestorContainer;
          
          // Find the newly created <ol> from current selection
          while (currentNode && currentNode !== editorRef.current) {
            if (currentNode.nodeType === Node.ELEMENT_NODE) {
              const element = currentNode as HTMLElement;
              if (element.tagName === 'OL') {
                newOl = element;
                break;
              }
            }
            currentNode = currentNode.parentNode;
          }

          // If not found from selection, search all OLs in editor
          if (!newOl && editorRef.current) {
            const allOls = editorRef.current.querySelectorAll('ol');
            // Find the OL that contains the current selection
            for (const ol of allOls) {
              if (ol.contains(currentRange.commonAncestorContainer)) {
                newOl = ol as HTMLElement;
                break;
              }
            }
          }

          if (newOl) {
            newOl.style.listStyleType = style;
            const typeMap: Record<string, string> = {
              'decimal': '1',
              'lower-alpha': 'a',
              'upper-alpha': 'A',
              'lower-roman': 'i',
              'upper-roman': 'I'
            };
            if (typeMap[style]) {
              newOl.setAttribute('type', typeMap[style]);
            } else {
              newOl.removeAttribute('type');
            }
            handleContentChange();
            saveToHistory();
            setShowListStyleDropdown(false);
            
            // Restore selection after DOM updates
            if (bookmark) {
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  restoreSelection(editorRef.current!, bookmark);
                  editorRef.current?.focus();
                });
              });
              
              setTimeout(() => {
                restoreSelection(editorRef.current!, bookmark);
                editorRef.current?.focus();
              }, 10);
              
              setTimeout(() => {
                restoreSelection(editorRef.current!, bookmark);
                editorRef.current?.focus();
              }, 50);
            }
          }
        }, 0);
        
        // Restore selection immediately
        const newRange = document.createRange();
        newRange.setStart(startContainer, startOffset);
        newRange.setEnd(endContainer, endOffset);
        selection.removeAllRanges();
        selection.addRange(newRange);
        return; // Exit early, handleContentChange and saveToHistory will be called in setTimeout
      }

      // Restore selection
      const newRange = document.createRange();
      newRange.setStart(startContainer, startOffset);
      newRange.setEnd(endContainer, endOffset);
      selection.removeAllRanges();
      selection.addRange(newRange);

      handleContentChange();
      saveToHistory();
      setShowListStyleDropdown(false);
      
      // Restore selection after DOM updates
      if (bookmark) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            restoreSelection(editorRef.current!, bookmark);
            editorRef.current?.focus();
          });
        });
        
        setTimeout(() => {
          restoreSelection(editorRef.current!, bookmark);
          editorRef.current?.focus();
        }, 10);
        
        setTimeout(() => {
          restoreSelection(editorRef.current!, bookmark);
          editorRef.current?.focus();
        }, 50);
      }
    } catch (e) {
      console.error('Error applying list style:', e);
      // Ensure focus is maintained even on error
      if (editorRef.current) {
        editorRef.current.focus();
      }
    }
  }, [disabled, handleContentChange, saveToHistory]);

  const applyBulletStyle = useCallback((style: string) => {
    if (!editorRef.current || disabled) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    try {
      // Save selection before any changes
      const bookmark = saveSelection(editorRef.current);
      
      // Save selection
      const range = selection.getRangeAt(0);
      const startContainer = range.startContainer;
      const startOffset = range.startOffset;
      const endContainer = range.endContainer;
      const endOffset = range.endOffset;

      // Check if we're in an unordered list
      let ulElement: HTMLElement | null = null;
      let node: Node | null = range.commonAncestorContainer;

      while (node && node !== editorRef.current) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          if (element.tagName === 'UL') {
            ulElement = element;
            break;
          }
        }
        node = node.parentNode;
      }

      if (ulElement) {
        // We're in an unordered list, change its style
        ulElement.style.listStyleType = style;
      } else {
        // Not in an unordered list, create one with the selected style
        // First, try to insert unordered list
        document.execCommand('insertUnorderedList', false);
        
        // Use setTimeout to ensure DOM is updated before finding the <ul>
        setTimeout(() => {
          const currentSelection = window.getSelection();
          if (!currentSelection || currentSelection.rangeCount === 0) return;
          
          const currentRange = currentSelection.getRangeAt(0);
          let newUl: HTMLElement | null = null;
          let currentNode: Node | null = currentRange.commonAncestorContainer;
          
          // Find the newly created <ul> from current selection
          while (currentNode && currentNode !== editorRef.current) {
            if (currentNode.nodeType === Node.ELEMENT_NODE) {
              const element = currentNode as HTMLElement;
              if (element.tagName === 'UL') {
                newUl = element;
                break;
              }
            }
            currentNode = currentNode.parentNode;
          }

          // If not found from selection, search all ULs in editor
          if (!newUl && editorRef.current) {
            const allUls = editorRef.current.querySelectorAll('ul');
            // Find the UL that contains the current selection
            for (const ul of allUls) {
              if (ul.contains(currentRange.commonAncestorContainer)) {
                newUl = ul as HTMLElement;
                break;
              }
            }
          }

          if (newUl) {
            newUl.style.listStyleType = style;
            handleContentChange();
            saveToHistory();
            setShowBulletStyleDropdown(false);
            
            // Restore selection after DOM updates
            if (bookmark) {
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  restoreSelection(editorRef.current!, bookmark);
                  editorRef.current?.focus();
                });
              });
              
              setTimeout(() => {
                restoreSelection(editorRef.current!, bookmark);
                editorRef.current?.focus();
              }, 10);
              
              setTimeout(() => {
                restoreSelection(editorRef.current!, bookmark);
                editorRef.current?.focus();
              }, 50);
            }
          }
        }, 0);
        
        // Restore selection immediately
        const newRange = document.createRange();
        newRange.setStart(startContainer, startOffset);
        newRange.setEnd(endContainer, endOffset);
        selection.removeAllRanges();
        selection.addRange(newRange);
        return; // Exit early, handleContentChange and saveToHistory will be called in setTimeout
      }

      // Restore selection
      const newRange = document.createRange();
      newRange.setStart(startContainer, startOffset);
      newRange.setEnd(endContainer, endOffset);
      selection.removeAllRanges();
      selection.addRange(newRange);

      handleContentChange();
      saveToHistory();
      setShowBulletStyleDropdown(false);
      
      // Restore selection after DOM updates
      if (bookmark) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            restoreSelection(editorRef.current!, bookmark);
            editorRef.current?.focus();
          });
        });
        
        setTimeout(() => {
          restoreSelection(editorRef.current!, bookmark);
          editorRef.current?.focus();
        }, 10);
        
        setTimeout(() => {
          restoreSelection(editorRef.current!, bookmark);
          editorRef.current?.focus();
        }, 50);
      }
    } catch (e) {
      console.error('Error applying bullet style:', e);
      // Ensure focus is maintained even on error
      if (editorRef.current) {
        editorRef.current.focus();
      }
    }
  }, [disabled, handleContentChange, saveToHistory]);

  const getButtonActiveState = (button: ToolbarButton): boolean => {
    if (!editorRef.current) return false;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return false;

    try {
      switch (button) {
        case 'bold':
          return document.queryCommandState('bold');
        case 'italic':
          return document.queryCommandState('italic');
        case 'underline':
          return document.queryCommandState('underline');
        case 'strike':
          return document.queryCommandState('strikeThrough');
        case 'alignLeft':
          return document.queryCommandState('justifyLeft');
        case 'alignCenter':
          return document.queryCommandState('justifyCenter');
        case 'alignRight':
          return document.queryCommandState('justifyRight');
        case 'alignJustify':
          return document.queryCommandState('justifyFull');
        case 'unorderedList':
          return document.queryCommandState('insertUnorderedList');
        case 'orderedList':
          return document.queryCommandState('insertOrderedList');
        default:
          return false;
      }
    } catch (err) {
      return false;
    }
  };

  const getCurrentBlockFormat = (): string => {
    if (!editorRef.current) return 'paragraph';
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return 'paragraph';
    
    const range = selection.getRangeAt(0);

    // Try to get block format from the start of selection first
    let startNode: Node = range.startContainer;
    if (startNode.nodeType === Node.TEXT_NODE) {
      startNode = startNode.parentElement || startNode;
    }

    // Traverse up to find block element
    let element: Element | null = startNode as Element;
    while (element && element !== editorRef.current) {
      if (element.nodeType === Node.ELEMENT_NODE) {
        const tagName = element.tagName?.toLowerCase();

        // Check for block format tags
    if (tagName === 'h1') return 'heading1';
    if (tagName === 'h2') return 'heading2';
    if (tagName === 'h3') return 'heading3';
    if (tagName === 'h4') return 'heading4';
    if (tagName === 'h5') return 'heading5';
    if (tagName === 'h6') return 'heading6';
    if (tagName === 'pre' || tagName === 'code') return 'preformatted';
        if (tagName === 'p') return 'paragraph';

        // Check if it's a block-level element (div, blockquote, li, etc.)
        if (['div', 'blockquote', 'li'].includes(tagName || '')) {
          // For div, check if it has any block formatting
          // If not, treat as paragraph
          return 'paragraph';
        }
      }

      element = element.parentElement;
    }

    // Fallback: return paragraph
    return 'paragraph';
  };

  // Bookmark System - Simple and clean implementation
  const saveSelection = (rootEl: HTMLElement) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    
    const range = selection.getRangeAt(0);
    
    // Get path from root to node
    function getNodePath(node: Node) {
      const path: number[] = [];
      let currentNode: Node | null = node;
      
      while (currentNode && currentNode !== rootEl) {
        const parent: Node | null = currentNode.parentNode;
        if (!parent) break;
        
        const index = Array.prototype.indexOf.call(parent.childNodes, currentNode);
        path.unshift(index);
        currentNode = parent;
      }
      
      return path;
    }
    
    return {
      startPath: getNodePath(range.startContainer),
      startOffset: range.startOffset,
      endPath: getNodePath(range.endContainer),
      endOffset: range.endOffset,
    };
  };
  
  const restoreSelection = (rootEl: HTMLElement, bookmark: any) => {
    const selection = window.getSelection();
    if (!selection || !bookmark) return;
    
    function getNodeFromPath(path: number[]) {
      let node: Node | null = rootEl;
      
      for (const index of path) {
        if (!node || index >= node.childNodes.length) {
          return null;
        }
        node = node.childNodes[index];
      }
      
      return node;
    }
    
    const startNode = getNodeFromPath(bookmark.startPath);
    const endNode = getNodeFromPath(bookmark.endPath);
    
    if (!startNode || !endNode) return;
    
    const range = document.createRange();
    range.setStart(startNode, bookmark.startOffset);
    range.setEnd(endNode, bookmark.endOffset);
    
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const handleBlockFormatSelect = (format: string) => {
    if (!editorRef.current) return;
    
    // Save selection before any changes
    const bookmark = saveSelection(editorRef.current);
    
    saveToHistory();
    isApplyingFormatRef.current = true;
    editorRef.current.focus();

    const selection = window.getSelection();
    const newTag = format === 'paragraph' ? 'p' : format;
    
    if (!selection || selection.rangeCount === 0) {
      // No selection - use execCommand
      document.execCommand('formatBlock', false, newTag);
      setShowBlockFormatDropdown(false);
      handleContentChange();
      setTimeout(() => { isApplyingFormatRef.current = false; }, 100);
      return;
    }

    const range = selection.getRangeAt(0);

    // Helper to find block element
    const findBlockElement = (node: Node): Element | null => {
      let current: Node | null = node;
      if (current.nodeType === Node.TEXT_NODE) {
        current = current.parentElement || current;
      }
    while (current && current !== editorRef.current) {
        if (current.nodeType === Node.ELEMENT_NODE) {
          const tag = (current as Element).tagName?.toLowerCase();
          if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'div', 'blockquote', 'li'].includes(tag || '')) {
            return current as Element;
          }
      }
      current = current.parentNode;
    }
      return null;
    };

    // Find all blocks in selection
    const startBlock = findBlockElement(range.startContainer);

    // Helper to collect all block elements in a range (including list items)
    const collectBlocksInRange = (range: Range): Element[] => {
      const blocks: Element[] = [];
      const startContainer = range.startContainer;
      const endContainer = range.endContainer;
      
      // Helper to check if a node is within the range
      const isNodeInRange = (node: Node): boolean => {
        if (node.nodeType !== Node.ELEMENT_NODE) return false;
        
        try {
          const element = node as Element;
          
          // Check if range intersects the node
          if (range.intersectsNode(node)) {
            return true;
          }
          
          // Check if node contains range boundaries
          if (element.contains(startContainer) || element.contains(endContainer)) {
            return true;
          }
          
          // Check if the node is completely within the range
          const nodeRange = document.createRange();
          nodeRange.selectNodeContents(node);
          
          try {
            const startComparison = range.compareBoundaryPoints(Range.START_TO_START, nodeRange);
            const endComparison = range.compareBoundaryPoints(Range.END_TO_END, nodeRange);
            // If range starts before or at node start, and ends after or at node end
            if (startComparison <= 0 && endComparison >= 0) {
              return true;
            }
          } catch (e) {
            // If comparison fails, use position comparison
            const nodeStart = nodeRange.startContainer;
            const nodeEnd = nodeRange.endContainer;
            const startPos = startContainer.compareDocumentPosition(nodeStart);
            const endPos = endContainer.compareDocumentPosition(nodeEnd);
            
            // If node start is after range start and node end is before range end
            if ((startPos & Node.DOCUMENT_POSITION_FOLLOWING) === 0 &&
                (endPos & Node.DOCUMENT_POSITION_PRECEDING) === 0) {
              return true;
            }
          }
        } catch (e) {
          // Final fallback: check if node contains start or end
          const element = node as Element;
          return element.contains(startContainer) || element.contains(endContainer);
        }
        return false;
      };

      // Collect all blocks by traversing from start to end
      // First, get all potential block elements
      const allBlocks: Element[] = [];
      
      if (editorRef.current) {
        // Get all list items
        const allListItems = editorRef.current.querySelectorAll('li');
        allListItems.forEach((li) => {
          allBlocks.push(li);
        });
        
        // Get all other block elements
        const allOtherBlocks = editorRef.current.querySelectorAll('p, h1, h2, h3, h4, h5, h6, pre, div, blockquote');
        allOtherBlocks.forEach((block) => {
          allBlocks.push(block);
        });
      }
      
      // Filter blocks that are in the range
      allBlocks.forEach((block) => {
        if (isNodeInRange(block) && !blocks.includes(block)) {
          blocks.push(block);
        }
      });
      
      // Also use TreeWalker as fallback to catch any missed blocks
      const walker = document.createTreeWalker(
        range.commonAncestorContainer,
        NodeFilter.SHOW_ELEMENT,
        {
          acceptNode: (node: Node) => {
            if (node.nodeType !== Node.ELEMENT_NODE) return NodeFilter.FILTER_REJECT;
            const tag = (node as Element).tagName?.toLowerCase();
            if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'div', 'blockquote', 'li'].includes(tag || '')) {
              if (isNodeInRange(node)) {
                return NodeFilter.FILTER_ACCEPT;
              }
            }
            return NodeFilter.FILTER_SKIP;
          }
        }
      );

      let node;
      while (node = walker.nextNode()) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const tag = (node as Element).tagName?.toLowerCase();
          if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'div', 'blockquote', 'li'].includes(tag || '')) {
            // Avoid duplicates
            if (!blocks.includes(node as Element)) {
              blocks.push(node as Element);
            }
          }
        }
      }

      // If no blocks found, try direct approach
      if (blocks.length === 0 && startBlock) {
        blocks.push(startBlock);
      }

      return blocks;
    };

    const blocksToProcess = collectBlocksInRange(range);
    
    // Store processed elements for selection restoration
    const processedElements: Element[] = [];

    if (blocksToProcess.length > 0) {
      // Process all blocks in selection
      // Process list items first, then other blocks
      const listItems: Element[] = [];
      const otherBlocks: Element[] = [];
      
      blocksToProcess.forEach((block) => {
        if (block.tagName?.toLowerCase() === 'li') {
          listItems.push(block);
        } else {
          otherBlocks.push(block);
        }
      });
      
      // Process list items - wrap content in heading but keep list structure
      listItems.forEach((block) => {
        if (block !== editorRef.current && block.parentNode) {
          // Instead of extracting from list, wrap the content in the new tag
          // but keep it inside the list item
          const newElement = document.createElement(newTag);
          
          // Move all children to the new heading element
          const children = Array.from(block.childNodes);
          children.forEach((child) => {
            newElement.appendChild(child);
          });
          
          // Preserve inline styles from list item
          if (block instanceof HTMLElement) {
            const oldStyles = block.style;
            for (let j = 0; j < oldStyles.length; j++) {
              const prop = oldStyles[j];
              newElement.style.setProperty(prop, oldStyles.getPropertyValue(prop), oldStyles.getPropertyPriority(prop));
            }
          }
          
          // Clear the list item and add the new heading element
          block.innerHTML = '';
          block.appendChild(newElement);
          
          // Store the new heading element for selection restoration
          processedElements.push(newElement);
        }
      })
      
      // Process other blocks (non-list items)
      otherBlocks.forEach((block) => {
        if (block !== editorRef.current && block.parentNode) {
          const newElement = document.createElement(newTag);
          // Clone all children to preserve formatting (including font size styles on block)
          Array.from(block.childNodes).forEach((child) => {
            newElement.appendChild(child.cloneNode(true));
          });
          // Preserve inline styles from block element (like fontSize)
          if (block instanceof HTMLElement) {
            const oldStyles = block.style;
            for (let j = 0; j < oldStyles.length; j++) {
              const prop = oldStyles[j];
              newElement.style.setProperty(prop, oldStyles.getPropertyValue(prop), oldStyles.getPropertyPriority(prop));
            }
          }
          block.parentNode.replaceChild(newElement, block);
          
          // Store the new element for selection restoration
          processedElements.push(newElement);
        }
      });
    } else if (startBlock) {
      // Single block fallback
      if (startBlock !== editorRef.current && startBlock.parentNode) {
        const newElement = document.createElement(newTag);
        Array.from(startBlock.childNodes).forEach((child) => {
          newElement.appendChild(child.cloneNode(true));
        });
        // Preserve inline styles
        if (startBlock instanceof HTMLElement) {
          const oldStyles = startBlock.style;
          for (let i = 0; i < oldStyles.length; i++) {
            const prop = oldStyles[i];
            newElement.style.setProperty(prop, oldStyles.getPropertyValue(prop), oldStyles.getPropertyPriority(prop));
          }
        }
        startBlock.parentNode.replaceChild(newElement, startBlock);
    } else {
        document.execCommand('formatBlock', false, newTag);
      }
    } else {
      // Fallback: use execCommand
      document.execCommand('formatBlock', false, newTag);
    }
    
    setShowBlockFormatDropdown(false);
    
    // Update triggers first
    setButtonStateUpdateTrigger(prev => prev + 1);
    setBlockFormatUpdateTrigger(prev => prev + 1);
    setFontSizeUpdateTrigger(prev => prev + 1);
    
    // Handle content change
    handleContentChange();
    
    // Restore selection after DOM updates
    if (bookmark) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          restoreSelection(editorRef.current!, bookmark);
          editorRef.current?.focus();
        });
      });
      
      setTimeout(() => {
        restoreSelection(editorRef.current!, bookmark);
        editorRef.current?.focus();
      }, 50);
      
      setTimeout(() => {
        restoreSelection(editorRef.current!, bookmark);
        editorRef.current?.focus();
      }, 150);
    }

    setTimeout(() => { isApplyingFormatRef.current = false; }, 200);
  };


  const handleFontColorSelect = (color: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!editorRef.current) return;

    // Save selection before any changes
    const bookmark = saveSelection(editorRef.current);

    // Save state before applying color
    saveToHistory();
    
    // Set flag to prevent click outside handler from interfering
    isSelectingColorRef.current = true;

    // Close dropdown
    setShowFontColorDropdown(false);
    setHoveredColor(null);
    setHoveredColorPosition(null);

    // Ensure editor has focus
    editorRef.current.focus();

    // Apply color immediately
    requestAnimationFrame(() => {
      const currentSelection = window.getSelection();
      let rangeToUse: Range | null = null;

      // Try to restore selection from bookmark first
      if (bookmark) {
        restoreSelection(editorRef.current!, bookmark);
        if (currentSelection && currentSelection.rangeCount > 0) {
          rangeToUse = currentSelection.getRangeAt(0);
        }
      }
      
      // Fallback to current selection
      if (!rangeToUse && currentSelection && currentSelection.rangeCount > 0) {
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
        
      // Restore selection after applying color
      if (bookmark) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            restoreSelection(editorRef.current!, bookmark);
            editorRef.current?.focus();
          });
        });
        
        setTimeout(() => {
          restoreSelection(editorRef.current!, bookmark);
          editorRef.current?.focus();
        }, 10);
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

    // Try to get font size from the start of selection first
    let startNode: Node = range.startContainer;
    if (startNode.nodeType === Node.TEXT_NODE) {
      startNode = startNode.parentElement || startNode;
    }

    // Traverse up to find element with font size style
    let element: Element | null = startNode as Element;
    while (element && element !== editorRef.current) {
      if (element.nodeType === Node.ELEMENT_NODE) {
    // Check inline style first
        if (element instanceof HTMLElement && element.style.fontSize) {
          const inlineStyle = element.style.fontSize;
      const pixelSize = parseFloat(inlineStyle);
          if (!isNaN(pixelSize) && pixelSize > 0) {
            return Math.round(pixelSize);
          }
    }

    // Check computed style
    const computedStyle = window.getComputedStyle(element);
    const fontSize = computedStyle.fontSize;
    const pixelSize = parseFloat(fontSize);

        if (!isNaN(pixelSize) && pixelSize > 0) {
          return Math.round(pixelSize);
        }
      }

      element = element.parentElement;
    }

    // Fallback: return default
    return 16;
  };

  const applyFontSize = (sizeInPx: number) => {
    if (!editorRef.current) return;
    
    // Save selection before any changes
    const bookmark = saveSelection(editorRef.current);
    
    saveToHistory();
    editorRef.current.focus();
    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0) {
      // No selection - apply to next typed text
      document.execCommand('fontSize', false, '7');
      setTimeout(() => {
        if (editorRef.current) {
          const fontElements = editorRef.current.querySelectorAll('font[size="7"]');
          fontElements.forEach((el) => {
            (el as HTMLElement).style.fontSize = `${sizeInPx}px`;
          });
          setFontSizeUpdateTrigger(prev => prev + 1);
          setTimeout(() => saveToHistory(), 10);
          handleContentChange();
        }
      }, 0);
      return;
    }

    const range = selection.getRangeAt(0);

    // Helper to find block element
    const findBlockElement = (node: Node): Element | null => {
      let current: Node | null = node;
      if (current.nodeType === Node.TEXT_NODE) {
        current = current.parentElement || current;
      }
      while (current && current !== editorRef.current) {
        if (current.nodeType === Node.ELEMENT_NODE) {
          const tag = (current as Element).tagName?.toLowerCase();
          if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'div', 'blockquote', 'li'].includes(tag || '')) {
            return current as Element;
          }
        }
        current = current.parentNode;
      }
      return null;
    };

    // Find all blocks in selection (similar to handleBlockFormatSelect)
    const startBlock = findBlockElement(range.startContainer);
    
    // Helper to collect all block elements in a range (including list items and headings inside list items)
    const collectBlocksInRange = (range: Range): Element[] => {
      const blocks: Element[] = [];
      const startContainer = range.startContainer;
      const endContainer = range.endContainer;
      
      // Helper to check if a node is within the range
      const isNodeInRange = (node: Node): boolean => {
        if (node.nodeType !== Node.ELEMENT_NODE) return false;
        
        try {
          const element = node as Element;
          
          // Check if range intersects the node
          if (range.intersectsNode(node)) {
            return true;
          }
          
          // Check if node contains range boundaries
          if (element.contains(startContainer) || element.contains(endContainer)) {
            return true;
          }
          
          // Check if the node is completely within the range
          const nodeRange = document.createRange();
          nodeRange.selectNodeContents(node);
          
          try {
            const startComparison = range.compareBoundaryPoints(Range.START_TO_START, nodeRange);
            const endComparison = range.compareBoundaryPoints(Range.END_TO_END, nodeRange);
            if (startComparison <= 0 && endComparison >= 0) {
              return true;
            }
          } catch (e) {
            // If comparison fails, use position comparison
            const nodeStart = nodeRange.startContainer;
            const nodeEnd = nodeRange.endContainer;
            const startPos = startContainer.compareDocumentPosition(nodeStart);
            const endPos = endContainer.compareDocumentPosition(nodeEnd);
            
            if ((startPos & Node.DOCUMENT_POSITION_FOLLOWING) === 0 &&
                (endPos & Node.DOCUMENT_POSITION_PRECEDING) === 0) {
              return true;
            }
          }
        } catch (e) {
          const element = node as Element;
          return element.contains(startContainer) || element.contains(endContainer);
        }
        return false;
      };

      // Collect all blocks by traversing from start to end
      const allBlocks: Element[] = [];
      
      if (editorRef.current) {
        // Get all list items
        const allListItems = editorRef.current.querySelectorAll('li');
        allListItems.forEach((li) => {
          allBlocks.push(li);
        });
        
        // Get all other block elements
        const allOtherBlocks = editorRef.current.querySelectorAll('p, h1, h2, h3, h4, h5, h6, pre, div, blockquote');
        allOtherBlocks.forEach((block) => {
          allBlocks.push(block);
        });
      }
      
      // Filter blocks that are in the range
      allBlocks.forEach((block) => {
        if (isNodeInRange(block) && !blocks.includes(block)) {
          blocks.push(block);
        }
      });
      
      // Also use TreeWalker as fallback
      const walker = document.createTreeWalker(
        range.commonAncestorContainer,
        NodeFilter.SHOW_ELEMENT,
        {
          acceptNode: (node: Node) => {
            if (node.nodeType !== Node.ELEMENT_NODE) return NodeFilter.FILTER_REJECT;
            const tag = (node as Element).tagName?.toLowerCase();
            if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'div', 'blockquote', 'li'].includes(tag || '')) {
              if (isNodeInRange(node)) {
                return NodeFilter.FILTER_ACCEPT;
              }
            }
            return NodeFilter.FILTER_SKIP;
          }
        }
      );

      let node;
      while (node = walker.nextNode()) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const tag = (node as Element).tagName?.toLowerCase();
          if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'div', 'blockquote', 'li'].includes(tag || '')) {
            if (!blocks.includes(node as Element)) {
              blocks.push(node as Element);
            }
          }
        }
      }

      // If no blocks found, try direct approach
      if (blocks.length === 0 && startBlock) {
        blocks.push(startBlock);
      }

      return blocks;
    };

    const blocksToProcess = collectBlocksInRange(range);

    if (blocksToProcess.length > 0) {
      // Apply font size to all blocks in selection
      blocksToProcess.forEach((block) => {
        if (block instanceof HTMLElement) {
          // For list items, apply to the heading element inside if it exists
          if (block.tagName?.toLowerCase() === 'li') {
            const headingElement = block.firstElementChild as HTMLElement;
            if (headingElement && ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(headingElement.tagName?.toLowerCase() || '')) {
              headingElement.style.fontSize = `${sizeInPx}px`;
            } else {
              // If no heading, apply to list item itself
              block.style.fontSize = `${sizeInPx}px`;
            }
          } else {
            // For other blocks, apply directly
            block.style.fontSize = `${sizeInPx}px`;
          }
        }
      });
    } else if (startBlock) {
      // Single block fallback
      if (startBlock instanceof HTMLElement) {
        if (startBlock.tagName?.toLowerCase() === 'li') {
          const headingElement = startBlock.firstElementChild as HTMLElement;
          if (headingElement && ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(headingElement.tagName?.toLowerCase() || '')) {
            headingElement.style.fontSize = `${sizeInPx}px`;
          } else {
            startBlock.style.fontSize = `${sizeInPx}px`;
          }
        } else {
          startBlock.style.fontSize = `${sizeInPx}px`;
        }
      }
      } else {
      // No block found, wrap in span
        const span = document.createElement('span');
        span.style.fontSize = `${sizeInPx}px`;
        try {
          range.surroundContents(span);
          const newRange = document.createRange();
          newRange.selectNodeContents(span);
          selection.removeAllRanges();
          selection.addRange(newRange);
        } catch (e) {
        try {
          const contents = range.extractContents();
          span.appendChild(contents);
          range.insertNode(span);
          const newRange = document.createRange();
          newRange.selectNodeContents(span);
          selection.removeAllRanges();
          selection.addRange(newRange);
        } catch (extractError) {
      editorRef.current.focus();
        }
      }
          }
          
          setFontSizeUpdateTrigger(prev => prev + 1);
    setTimeout(() => saveToHistory(), 10);
          handleContentChange();
          
          // Restore selection after font size change
          if (bookmark) {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                restoreSelection(editorRef.current!, bookmark);
                editorRef.current?.focus();
              });
            });
            
            setTimeout(() => {
              restoreSelection(editorRef.current!, bookmark);
              editorRef.current?.focus();
            }, 10);
          }
  };

  const getCurrentFontColor = (): string | null => {
    if (!editorRef.current) return null;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;

    const range = selection.getRangeAt(0);

    // Try to get color from the start of selection first
    let startNode: Node = range.startContainer;
    if (startNode.nodeType === Node.TEXT_NODE) {
      startNode = startNode.parentElement || startNode;
    }

    // Traverse up to find element with color style
    let element: Element | null = startNode as Element;
    while (element && element !== editorRef.current) {
      if (element.nodeType === Node.ELEMENT_NODE) {
    const computedStyle = window.getComputedStyle(element);
    const color = computedStyle.color;

        // Skip if color is transparent or default (might be inherited)
        if (color && color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') {
    // Convert rgb/rgba to hex if needed
    if (color.startsWith('rgb')) {
      const rgb = color.match(/\d+/g);
      if (rgb && rgb.length >= 3) {
        const r = parseInt(rgb[0]).toString(16).padStart(2, '0');
        const g = parseInt(rgb[1]).toString(16).padStart(2, '0');
        const b = parseInt(rgb[2]).toString(16).padStart(2, '0');
              const hex = `#${r}${g}${b}`.toUpperCase();
              // Only return if not black (default), or if explicitly set
              if (hex !== '#000000' || (element instanceof HTMLElement && element.style.color)) {
                return hex;
              }
      }
    }

    // If already hex, return as is
    if (color.startsWith('#')) {
      return color;
          }
        }

        // Check inline style
        if (element instanceof HTMLElement) {
          const inlineColor = (element as HTMLElement).style.color;
          if (!inlineColor) {
            element = element.parentElement;
            continue;
          }
          if (inlineColor.startsWith('rgb')) {
            const rgb = inlineColor.match(/\d+/g);
            if (rgb && rgb.length >= 3) {
              const r = parseInt(rgb[0]).toString(16).padStart(2, '0');
              const g = parseInt(rgb[1]).toString(16).padStart(2, '0');
              const b = parseInt(rgb[2]).toString(16).padStart(2, '0');
              return `#${r}${g}${b}`.toUpperCase();
            }
          }
          if (inlineColor.startsWith('#')) {
            return inlineColor;
          }
        }
      }

      element = element.parentElement;
    }

    // Fallback: return default black
    return '#000000';
  };

                return (
    <>
      <div className={`hh-rich-text-editor ${isFullscreen ? 'hh-fullscreen' : ''} ${disabled ? 'hh-disabled' : ''}`}>
        <Toolbar
          toolbar={toolbar}
              disabled={disabled}
          showBlockFormatDropdown={showBlockFormatDropdown}
          fontSizeUpdateTrigger={fontSizeUpdateTrigger}
          onToggleBlockFormat={() => {
            const willShow = !showBlockFormatDropdown;
            setShowBlockFormatDropdown(willShow);
            // Update block format when opening dropdown to show current selection
            if (willShow) {
              // Force update to get latest block format after dropdown opens
              setTimeout(() => {
                setBlockFormatUpdateTrigger(prev => prev + 1);
              }, 0);
            }
          }}
          onBlockFormatSelect={handleBlockFormatSelect}
          onDecreaseFontSize={handleDecreaseFontSize}
          onIncreaseFontSize={handleIncreaseFontSize}
          getCurrentBlockFormat={getCurrentBlockFormat}
          getCurrentFontSizeLabel={getCurrentFontSizeLabel}
          blockFormatUpdateTrigger={blockFormatUpdateTrigger}
          showAlignmentDropdown={showAlignmentDropdown}
          onToggleAlignment={() => {
            const willShow = !showAlignmentDropdown;
            setShowAlignmentDropdown(willShow);
            setShowBlockFormatDropdown(false);
            setShowFontColorDropdown(false);
            if (willShow) {
              // Force update to show current alignment
              setButtonStateUpdateTrigger(prev => prev + 1);
            }
          }}
          onAlignmentSelect={(alignment: string) => {
            if (!editorRef.current) return;
            
            // Save selection before any changes
            const bookmark = saveSelection(editorRef.current);
            
            const commandMap: Record<string, string> = {
              'left': 'justifyLeft',
              'center': 'justifyCenter',
              'right': 'justifyRight',
              'justify': 'justifyFull'
            };
            const command = commandMap[alignment];
            if (command) {
              execCommand(command);
            }
            setShowAlignmentDropdown(false);
            
            // Restore selection after alignment change
            if (bookmark) {
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  restoreSelection(editorRef.current!, bookmark);
                  editorRef.current?.focus();
                });
              });
              
              setTimeout(() => {
                restoreSelection(editorRef.current!, bookmark);
                editorRef.current?.focus();
              }, 10);
            }
          }}
          getCurrentAlignment={getCurrentAlignment}
          showListStyleDropdown={showListStyleDropdown}
          onToggleListStyle={() => {
            const willShow = !showListStyleDropdown;
            setShowListStyleDropdown(willShow);
            setShowBlockFormatDropdown(false);
            setShowFontColorDropdown(false);
            setShowAlignmentDropdown(false);
          }}
          onListStyleSelect={applyListStyle}
          getCurrentListStyle={getCurrentListStyle}
          showBulletStyleDropdown={showBulletStyleDropdown}
          onToggleBulletStyle={() => {
            const willShow = !showBulletStyleDropdown;
            setShowBulletStyleDropdown(willShow);
            setShowBlockFormatDropdown(false);
            setShowFontColorDropdown(false);
            setShowAlignmentDropdown(false);
            setShowListStyleDropdown(false);
          }}
          onBulletStyleSelect={applyBulletStyle}
          getCurrentBulletStyle={getCurrentBulletStyle}
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
          getButtonActiveState={getButtonActiveState}
          buttonStateUpdateTrigger={buttonStateUpdateTrigger}
        />

        <div style={{ position: 'relative' }}>
          <EditorContent
            editorRef={editorRef}
            showCodeView={showCodeView}
            codeContent={codeContent}
            onCodeContentChange={setCodeContent}
            disabled={disabled}
            height={height}
            placeholder={placeholder}
            onInput={handleInput}
            onPaste={handlePaste}
            selectedImage={selectedImage}
            resizeHandleRef={resizeHandleRef}
            onResizeMouseDown={handleResizeMouseDown}
            isApplyingFormat={isApplyingFormatRef}
          />

          {/* Image Bounding Box */}
          {selectedImage && !showCodeView && (
            <>
              <div
                ref={imageBoundingBoxRef}
                className="hh-image-bounding-box"
                style={{ display: 'none' }}
              >
                {/* Resize handles at corners and midpoints */}
                <div
                  className="hh-resize-handle hh-resize-handle-nw"
                  data-handle="nw"
                  onMouseDown={(e) => handleBoundingBoxResize(e, 'nw')}
                ></div>
                <div
                  className="hh-resize-handle hh-resize-handle-n"
                  data-handle="n"
                  onMouseDown={(e) => handleBoundingBoxResize(e, 'n')}
                ></div>
                <div
                  className="hh-resize-handle hh-resize-handle-ne"
                  data-handle="ne"
                  onMouseDown={(e) => handleBoundingBoxResize(e, 'ne')}
                ></div>
                <div
                  className="hh-resize-handle hh-resize-handle-e"
                  data-handle="e"
                  onMouseDown={(e) => handleBoundingBoxResize(e, 'e')}
                ></div>
                <div
                  className="hh-resize-handle hh-resize-handle-se"
                  data-handle="se"
                  onMouseDown={(e) => handleBoundingBoxResize(e, 'se')}
                ></div>
                <div
                  className="hh-resize-handle hh-resize-handle-s"
                  data-handle="s"
                  onMouseDown={(e) => handleBoundingBoxResize(e, 's')}
                ></div>
                <div
                  className="hh-resize-handle hh-resize-handle-sw"
                  data-handle="sw"
                  onMouseDown={(e) => handleBoundingBoxResize(e, 'sw')}
                ></div>
                <div
                  className="hh-resize-handle hh-resize-handle-w"
                  data-handle="w"
                  onMouseDown={(e) => handleBoundingBoxResize(e, 'w')}
                ></div>
                {/* Position indicator */}
                <div className="hh-image-position-indicator">
                  {imageAlignment === 'right' ? 'Right' : imageAlignment === 'left' ? 'Left' : imageAlignment === 'center' ? 'Center' : 'Inline'} (auto, auto)
                </div>
        </div>

              {/* Image Toolbar */}
              <div
                ref={imageToolbarRef}
                className="hh-image-toolbar-wrapper"
                style={{ display: 'none' }}
              >
                <ImageToolbar
                  selectedImage={selectedImage}
                  onZoomChange={handleImageZoomChange}
                  onAlignmentChange={handleImageAlignmentChange}
                  onDelete={handleImageDelete}
                  currentZoom={imageZoom}
                  currentAlignment={imageAlignment}
                />
              </div>
            </>
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


