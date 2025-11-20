import React, { useRef } from 'react';
import { BlockFormatDropdown } from './BlockFormatDropdown';
import { FontSizeDropdown } from './FontSizeDropdown';
import { FontFamilyDropdown } from './FontFamilyDropdown';
import { blockFormats } from '../const/constants';
import { DropdownArrowIcon } from '../icons/icons';

interface FontSizeControlsProps {
  disabled: boolean;
  showBlockFormatDropdown: boolean;
  showFontSizeDropdown: boolean;
  showFontFamilyDropdown: boolean;
  onToggleBlockFormat: () => void;
  onToggleFontSize: () => void;
  onToggleFontFamily: () => void;
  onBlockFormatSelect: (tag: string) => void;
  onFontSizeSelect: (size: number | null) => void;
  onFontFamilySelect: (family: string | null) => void;
  getCurrentBlockFormat: () => string;
  getCurrentFontSize: () => number | null;
  getCurrentFontFamily: () => string | null;
  fontSizeUpdateTrigger: number;
  blockFormatUpdateTrigger: number;
  fontFamilyUpdateTrigger: number;
}

export const FontSizeControls: React.FC<FontSizeControlsProps> = ({
  disabled,
  showBlockFormatDropdown,
  showFontSizeDropdown,
  showFontFamilyDropdown,
  onToggleBlockFormat,
  onToggleFontSize,
  onToggleFontFamily,
  onBlockFormatSelect,
  onFontSizeSelect,
  onFontFamilySelect,
  getCurrentBlockFormat,
  getCurrentFontSize,
  getCurrentFontFamily,
  fontSizeUpdateTrigger,
  blockFormatUpdateTrigger,
  fontFamilyUpdateTrigger
}) => {
  const blockFormatDropdownRef = useRef<HTMLDivElement>(null);
  const fontSizeDropdownRef = useRef<HTMLDivElement>(null);
  const fontFamilyDropdownRef = useRef<HTMLDivElement>(null);

  const getBlockFormatLabel = () => {
    const currentFormat = getCurrentBlockFormat();
    const formatObj = blockFormats.find(f => f.value === currentFormat);
    if (formatObj) {
      // Show "Normal (...)" when "Normal (DIV)" is selected
      if (formatObj.value === 'normal') {
        return 'Normal (...)';
      }
      return formatObj.label;
    }
    return 'Paragraph';
  };

  const getFontSizeLabel = () => {
    const currentSize = getCurrentFontSize();
    if (currentSize === null) {
      return '(Default)';
    }
    return `${currentSize}px`;
  };

  const getFontFamilyLabel = () => {
    const currentFamily = getCurrentFontFamily();
    if (currentFamily === null) {
      return '(Default)';
    }
    // Extract the first font name from the font-family value
    const firstFont = currentFamily.split(',')[0].trim();
    return firstFont;
  };

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
          title="Block format"
        >
          {getBlockFormatLabel()}
          <DropdownArrowIcon height={10} width={10} />
        </button>
        {showBlockFormatDropdown && (
          <BlockFormatDropdown
            key={blockFormatUpdateTrigger}
            currentFormat={getCurrentBlockFormat()}
            onSelect={onBlockFormatSelect}
          />
        )}
      </div>
      <div className="hh-toolbar-dropdown-wrapper" ref={fontSizeDropdownRef}>
        <button
          type="button"
          className={`hh-toolbar-button ${showFontSizeDropdown ? 'hh-active' : ''}`}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            getCurrentFontSize();
            onToggleFontSize();
          }}
          disabled={disabled}
          title="Font size"
        >
          {getFontSizeLabel()}
          <DropdownArrowIcon height={10} width={10} />
        </button>
        {showFontSizeDropdown && (
          <FontSizeDropdown
            key={fontSizeUpdateTrigger}
            currentSize={getCurrentFontSize()}
            onSelect={onFontSizeSelect}
          />
        )}
      </div>
      <div className="hh-toolbar-dropdown-wrapper" ref={fontFamilyDropdownRef}>
        <button
          type="button"
          className={`hh-toolbar-button ${showFontFamilyDropdown ? 'hh-active' : ''}`}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            getCurrentFontFamily();
            onToggleFontFamily();
          }}
          disabled={disabled}
          title="Font family"
        >
          <span style={{ fontFamily: getCurrentFontFamily() || 'inherit' }}>
            {getFontFamilyLabel()}
          </span>
          <DropdownArrowIcon height={10} width={10} />
        </button>
        {showFontFamilyDropdown && (
          <FontFamilyDropdown
            key={fontFamilyUpdateTrigger}
            currentFamily={getCurrentFontFamily()}
            onSelect={onFontFamilySelect}
          />
        )}
      </div>
    </div>
  );
};

