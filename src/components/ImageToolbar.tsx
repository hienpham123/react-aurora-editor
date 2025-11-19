import React from 'react';

interface ImageToolbarProps {
  selectedImage: HTMLImageElement;
  onZoomChange: (zoom: number) => void;
  onAlignmentChange: (alignment: string) => void;
  onDelete: () => void;
  currentZoom: number;
  currentAlignment: string;
}

export const ImageToolbar: React.FC<ImageToolbarProps> = ({
  selectedImage,
  onZoomChange,
  onAlignmentChange,
  onDelete,
  currentZoom,
  currentAlignment
}) => {
  return (
    <div 
      className="hh-image-toolbar" 
      onClick={(e) => {
        e.stopPropagation();
        console.log('Toolbar clicked');
      }} 
      onMouseDown={(e) => {
        e.stopPropagation();
        console.log('Toolbar mousedown');
      }}
      style={{ pointerEvents: 'auto' }}
    >
      <div className="hh-image-toolbar-left">
        {/* Zoom options */}
        <div className="hh-image-zoom-group">
          <button
            className={`hh-image-zoom-btn ${currentZoom === 100 ? 'hh-active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onZoomChange(100);
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            title="100%"
          >
            100%
          </button>
          <button
            className={`hh-image-zoom-btn ${currentZoom === 75 ? 'hh-active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onZoomChange(75);
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            title="75%"
          >
            75%
          </button>
          <button
            className={`hh-image-zoom-btn ${currentZoom === 50 ? 'hh-active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onZoomChange(50);
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            title="50%"
          >
            50%
          </button>
        </div>

        {/* Alignment options */}
        <div className="hh-image-alignment-group">
          <button
            className={`hh-image-alignment-btn ${currentAlignment === 'inline' ? 'hh-active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAlignmentChange('inline');
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            title="In line with text"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="2" width="12" height="12" stroke="currentColor" strokeWidth="1.5" fill="none" strokeDasharray="2 2"/>
            </svg>
          </button>
          <button
            className={`hh-image-alignment-btn ${currentAlignment === 'left' ? 'hh-active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAlignmentChange('left');
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            title="Align left"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 4h12M2 8h8M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <rect x="2" y="2" width="4" height="4" fill="currentColor" opacity="0.3"/>
            </svg>
          </button>
          <button
            className={`hh-image-alignment-btn ${currentAlignment === 'center' ? 'hh-active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAlignmentChange('center');
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            title="Align center"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 4h12M4 8h8M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <rect x="6" y="2" width="4" height="4" fill="currentColor" opacity="0.3"/>
            </svg>
          </button>
          <button
            className={`hh-image-alignment-btn ${currentAlignment === 'right' ? 'hh-active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAlignmentChange('right');
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            title="Align right"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 4h12M4 8h8M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <rect x="10" y="2" width="4" height="4" fill="currentColor" opacity="0.3"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="hh-image-toolbar-right">
        <button
          className="hh-image-toolbar-btn hh-image-delete-btn"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete();
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          title="Delete"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
};
