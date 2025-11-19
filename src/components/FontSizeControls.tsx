import React, { useRef } from 'react';
import { BlockFormatDropdown } from './BlockFormatDropdown';
import { blockFormats } from '../const/constants';
import { DropdownArrowIcon } from '../icons/icons';

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
  blockFormatUpdateTrigger: number;
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
  fontSizeUpdateTrigger,
  blockFormatUpdateTrigger
}) => {
  const blockFormatDropdownRef = useRef<HTMLDivElement>(null);

  return (
    <div className="hh-fontsize-controls">
      <div className="hh-toolbar-dropdown-wrapper" ref={blockFormatDropdownRef}>
        <button
          type="button"
          className={`hh-toolbar-button ${showBlockFormatDropdown ? 'hh-active' : ''}`}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // Get current format before toggling to ensure dropdown shows correct selection
            // Use onMouseDown to preserve selection
            getCurrentBlockFormat();
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
          <DropdownArrowIcon height={10} width={10}/>
        </button>
        {showBlockFormatDropdown && (
          <BlockFormatDropdown
            key={blockFormatUpdateTrigger}
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

