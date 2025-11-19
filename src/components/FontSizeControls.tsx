import React, { useRef } from 'react';
import { BlockFormatDropdown } from './BlockFormatDropdown';
import { blockFormats } from '../const/constants';

interface FontSizeControlsProps {
  disabled: boolean;
  showBlockFormatDropdown: boolean;
  onToggleBlockFormat: () => void;
  onBlockFormatSelect: (tag: string) => void;
  onDecreaseFontSize: (e: React.MouseEvent) => void;
  onIncreaseFontSize: (e: React.MouseEvent) => void;
  getCurrentBlockFormat: () => string;
  getCurrentFontSizeLabel: () => string;
  fontSizeUpdateTrigger: number;
}

export const FontSizeControls: React.FC<FontSizeControlsProps> = ({
  disabled,
  showBlockFormatDropdown,
  onToggleBlockFormat,
  onBlockFormatSelect,
  onDecreaseFontSize,
  onIncreaseFontSize,
  getCurrentBlockFormat,
  getCurrentFontSizeLabel,
  fontSizeUpdateTrigger
}) => {
  const blockFormatDropdownRef = useRef<HTMLDivElement>(null);

  return (
    <div className="hh-fontsize-controls">
      <div className="hh-toolbar-dropdown-wrapper" ref={blockFormatDropdownRef}>
        <button
          type="button"
          className={`hh-toolbar-button ${showBlockFormatDropdown ? 'hh-active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleBlockFormat();
          }}
          disabled={disabled}
          title="Kích thước font"
        >
          {(() => {
            const currentFormat = getCurrentBlockFormat();
            const formatObj = blockFormats.find(f => f.value === currentFormat);
            return formatObj ? formatObj.label : 'Paragraph';
          })()}
          <span className="hh-dropdown-arrow">▼</span>
        </button>
        {showBlockFormatDropdown && (
          <BlockFormatDropdown
            currentFormat={getCurrentBlockFormat()}
            onSelect={onBlockFormatSelect}
          />
        )}
      </div>
      <button
        type="button"
        className="hh-toolbar-button hh-fontsize-btn"
        onClick={onDecreaseFontSize}
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
        onClick={onIncreaseFontSize}
        disabled={disabled}
        title="Tăng kích thước font"
      >
        +
      </button>
    </div>
  );
};

