import React, { RefObject } from 'react';

interface EditorContentProps {
  editorRef: RefObject<HTMLDivElement>;
  showCodeView: boolean;
  codeContent: string;
  onCodeContentChange: (content: string) => void;
  disabled: boolean;
  height: string;
  placeholder: string;
  onInput: () => void;
  onPaste: (e: React.ClipboardEvent) => void;
  selectedImage: HTMLImageElement | null;
  resizeHandleRef: RefObject<HTMLDivElement>;
  onResizeMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  isApplyingFormat: RefObject<boolean>;
}

export const EditorContent: React.FC<EditorContentProps> = ({
  editorRef,
  showCodeView,
  codeContent,
  onCodeContentChange,
  disabled,
  height,
  placeholder,
  onInput,
  onPaste,
  selectedImage,
  resizeHandleRef,
  onResizeMouseDown
}) => {
  return (
    <div style={{ position: 'relative' }}>
      {showCodeView ? (
        <textarea
          className="hh-code-view"
          value={codeContent}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onCodeContentChange(e.target.value)}
          style={{ height, width: '100%', padding: '10px', fontFamily: 'monospace' }}
        />
      ) : (
        <div
          ref={editorRef}
          className="hh-editor-content"
          contentEditable={!disabled}
          onInput={onInput}
          onPaste={onPaste}
          style={{ height, minHeight: height }}
          data-placeholder={placeholder}
          suppressContentEditableWarning
        />
      )}
      {selectedImage && !showCodeView && (
        <div
          ref={resizeHandleRef}
          className="hh-image-resize-handle"
          onMouseDown={onResizeMouseDown}
          style={{
            position: 'absolute',
            zIndex: 1000
          }}
        />
      )}
    </div>
  );
};

