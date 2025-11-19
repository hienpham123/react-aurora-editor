import React, { useRef } from 'react';
import { ToolbarButton as ToolbarButtonType } from '../AuroraEditor';
import { FontSizeControls } from './FontSizeControls';
import { ColorDropdown } from './ColorDropdown';
import { ToolbarButton } from './ToolbarButton';
import { fontColors } from '../const/constants';

interface ToolbarProps {
  toolbar: (ToolbarButtonType | '|')[];
  disabled: boolean;
  // FontSize controls
  showBlockFormatDropdown: boolean;
  fontSizeUpdateTrigger: number;
  onToggleBlockFormat: () => void;
  onBlockFormatSelect: (tag: string) => void;
  onDecreaseFontSize: (e: React.MouseEvent) => void;
  onIncreaseFontSize: (e: React.MouseEvent) => void;
  getCurrentBlockFormat: () => string;
  getCurrentFontSizeLabel: () => string;
  // FontColor controls
  showFontColorDropdown: boolean;
  currentColor: string | null;
  hoveredColor: string | null;
  onToggleFontColor: () => void;
  onColorSelect: (color: string, e: React.MouseEvent) => void;
  onRemoveColor: (e: React.MouseEvent) => void;
  onOpenColorPicker: () => void;
  onColorMouseEnter: (color: string, e: React.MouseEvent) => void;
  onColorMouseLeave: () => void;
  getCurrentFontColor: () => string | null;
  // Toolbar button click
  onToolbarClick: (button: ToolbarButtonType) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  toolbar,
  disabled,
  showBlockFormatDropdown,
  fontSizeUpdateTrigger,
  onToggleBlockFormat,
  onBlockFormatSelect,
  onDecreaseFontSize,
  onIncreaseFontSize,
  getCurrentBlockFormat,
  getCurrentFontSizeLabel,
  showFontColorDropdown,
  currentColor,
  hoveredColor,
  onToggleFontColor,
  onColorSelect,
  onRemoveColor,
  onOpenColorPicker,
  onColorMouseEnter,
  onColorMouseLeave,
  getCurrentFontColor,
  onToolbarClick
}) => {
  const fontColorDropdownRef = useRef<HTMLDivElement>(null);

  const buttons: React.ReactElement[] = [];

  toolbar.forEach((item, index) => {
    if (item === '|') {
      buttons.push(<div key={`separator-${index}`} className="hh-toolbar-separator" />);
      return;
    }

    const button = item as ToolbarButtonType;

    if (button === 'fontSize') {
      buttons.push(
        <FontSizeControls
          key={button}
          disabled={disabled}
          showBlockFormatDropdown={showBlockFormatDropdown}
          onToggleBlockFormat={onToggleBlockFormat}
          onBlockFormatSelect={onBlockFormatSelect}
          onDecreaseFontSize={onDecreaseFontSize}
          onIncreaseFontSize={onIncreaseFontSize}
          getCurrentBlockFormat={getCurrentBlockFormat}
          getCurrentFontSizeLabel={getCurrentFontSizeLabel}
          fontSizeUpdateTrigger={fontSizeUpdateTrigger}
        />
      );
    } else if (button === 'fontColor') {
      buttons.push(
        <div key={button} className="hh-toolbar-dropdown-wrapper" ref={fontColorDropdownRef}>
          <button
            type="button"
            className={`hh-toolbar-button ${showFontColorDropdown ? 'hh-active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFontColor();
            }}
            disabled={disabled}
            title="Màu chữ"
          >
            <div className="hh-color-button-content">
              <span className="hh-color-icon" style={{ color: '#000000' }}>A</span>
              <span
                className="hh-color-indicator"
                style={{
                  backgroundColor: currentColor || '#000000',
                  borderColor: currentColor || '#000000'
                }}
              />
            </div>
            <span className="hh-dropdown-arrow">▼</span>
          </button>
          {showFontColorDropdown && (
            <ColorDropdown
              currentColor={currentColor}
              fontColors={fontColors}
              hoveredColor={hoveredColor}
              onColorSelect={onColorSelect}
              onRemoveColor={onRemoveColor}
              onOpenColorPicker={onOpenColorPicker}
              onMouseEnter={onColorMouseEnter}
              onMouseLeave={onColorMouseLeave}
            />
          )}
        </div>
      );
    } else {
      buttons.push(
        <ToolbarButton
          key={button}
          button={button}
          disabled={disabled}
          onClick={() => onToolbarClick(button)}
        />
      );
    }
  });

  return <div className="hh-toolbar">{buttons}</div>;
};

