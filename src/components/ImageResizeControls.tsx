import React, { RefObject } from 'react';

interface ImageResizeControlsProps {
  selectedImage: HTMLImageElement;
  editorRef: RefObject<HTMLDivElement>;
  onResizeMouseDown: (e: React.MouseEvent, direction: string) => void;
  position: { x: number; y: number; width: number; height: number } | null;
}

export const ImageResizeControls: React.FC<ImageResizeControlsProps> = ({
  selectedImage,
  editorRef,
  onResizeMouseDown,
  position
}) => {
  if (!position || !selectedImage) return null;

  const handlePositions = [
    { name: 'nw', x: 0, y: 0, cursor: 'nwse-resize' },
    { name: 'n', x: 50, y: 0, cursor: 'ns-resize' },
    { name: 'ne', x: 100, y: 0, cursor: 'nesw-resize' },
    { name: 'e', x: 100, y: 50, cursor: 'ew-resize' },
    { name: 'se', x: 100, y: 100, cursor: 'nwse-resize' },
    { name: 's', x: 50, y: 100, cursor: 'ns-resize' },
    { name: 'sw', x: 0, y: 100, cursor: 'nesw-resize' },
    { name: 'w', x: 0, y: 50, cursor: 'ew-resize' }
  ];

  return (
    <div
      className="hh-image-bounding-box"
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${position.width}px`,
        height: `${position.height}px`,
        pointerEvents: 'none',
        zIndex: 1000
      }}
    >
      {/* Bounding box border */}
      <div className="hh-image-bounding-box-border" />
      
      {/* Resize handles */}
      {handlePositions.map((handle) => (
        <div
          key={handle.name}
          className="hh-image-resize-handle"
          style={{
            position: 'absolute',
            left: `${handle.x}%`,
            top: `${handle.y}%`,
            transform: 'translate(-50%, -50%)',
            cursor: handle.cursor,
            pointerEvents: 'auto'
          }}
          onMouseDown={(e) => onResizeMouseDown(e, handle.name)}
        />
      ))}
    </div>
  );
};

