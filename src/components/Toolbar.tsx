import React, { useRef } from 'react';
import { ToolbarButton as ToolbarButtonType } from '../AuroraEditor';
import { FontSizeControls } from './FontSizeControls';
import { ColorDropdown } from './ColorDropdown';
import { AlignmentDropdown } from './AlignmentDropdown';
import { ListStyleDropdown } from './ListStyleDropdown';
import { BulletStyleDropdown } from './BulletStyleDropdown';
import { ToolbarButton } from './ToolbarButton';
import { fontColors } from '../const/constants';
import { AlignLeftIcon, AlignCenterIcon, AlignRightIcon, AlignJustifyIcon, BulletListIcon, NumberedListIcon, DropdownArrowIcon } from '../icons/icons';

interface ToolbarProps {
  toolbar: (ToolbarButtonType | '|')[];
  disabled: boolean;
  // FontSize controls
  showBlockFormatDropdown: boolean;
  fontSizeUpdateTrigger: number;
  blockFormatUpdateTrigger: number;
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
  // Alignment controls
  showAlignmentDropdown: boolean;
  onToggleAlignment: () => void;
  onAlignmentSelect: (alignment: string) => void;
  getCurrentAlignment: () => string;
  // List style controls
  showListStyleDropdown: boolean;
  onToggleListStyle: () => void;
  onListStyleSelect: (style: string) => void;
  getCurrentListStyle: () => string;
  // Bullet style controls
  showBulletStyleDropdown: boolean;
  onToggleBulletStyle: () => void;
  onBulletStyleSelect: (style: string) => void;
  getCurrentBulletStyle: () => string;
  // Toolbar button click
  onToolbarClick: (button: ToolbarButtonType) => void;
  getButtonActiveState: (button: ToolbarButtonType) => boolean;
  buttonStateUpdateTrigger: number;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  toolbar,
  disabled,
  showBlockFormatDropdown,
  fontSizeUpdateTrigger,
  blockFormatUpdateTrigger,
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
  showAlignmentDropdown,
  onToggleAlignment,
  onAlignmentSelect,
  getCurrentAlignment,
  showListStyleDropdown,
  onToggleListStyle,
  onListStyleSelect,
  getCurrentListStyle,
  showBulletStyleDropdown,
  onToggleBulletStyle,
  onBulletStyleSelect,
  getCurrentBulletStyle,
  onToolbarClick,
  getButtonActiveState,
  buttonStateUpdateTrigger
}) => {
  const fontColorDropdownRef = useRef<HTMLDivElement>(null);
  const alignmentDropdownRef = useRef<HTMLDivElement>(null);
  const listStyleDropdownRef = useRef<HTMLDivElement>(null);
  const bulletStyleDropdownRef = useRef<HTMLDivElement>(null);

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
          blockFormatUpdateTrigger={blockFormatUpdateTrigger}
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
            <DropdownArrowIcon width={10} height={10} />
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
    } else if (button === 'alignLeft' || button === 'alignCenter' || button === 'alignRight' || button === 'alignJustify') {
      // Group alignment buttons into a single dropdown
      // Only render once for the first alignment button
      if (button === 'alignLeft') {
        const currentAlignment = getCurrentAlignment();
        const isAnyAlignmentActive = getButtonActiveState('alignLeft') || getButtonActiveState('alignCenter') || getButtonActiveState('alignRight') || getButtonActiveState('alignJustify');
        
        // Get icon based on current alignment
        const getAlignmentIcon = () => {
          switch (currentAlignment) {
            case 'center':
              return <AlignCenterIcon />;
            case 'right':
              return <AlignRightIcon />;
            case 'justify':
              return <AlignJustifyIcon />;
            default:
              return <AlignLeftIcon />;
          }
        };
        
        buttons.push(
          <div key="alignment" className="hh-toolbar-dropdown-wrapper" ref={alignmentDropdownRef}>
            <button
              type="button"
              className={`hh-toolbar-button ${showAlignmentDropdown ? 'hh-active' : ''} ${isAnyAlignmentActive ? 'hh-active' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleAlignment();
              }}
              disabled={disabled}
              title="Text alignment"
            >
              {getAlignmentIcon()}
              <DropdownArrowIcon width={10} height={10} />
            </button>
            {showAlignmentDropdown && (
              <AlignmentDropdown
                currentAlignment={currentAlignment}
                onSelect={onAlignmentSelect}
              />
            )}
          </div>
        );
      }
      // Skip other alignment buttons as they're now in the dropdown
    } else if (button === 'unorderedList') {
      // Render unordered list with separate button and arrow
      const currentBulletStyle = getCurrentBulletStyle();
      const isUnorderedListActive = getButtonActiveState('unorderedList');
      
      buttons.push(
        <div key="unorderedList" className="hh-toolbar-dropdown-wrapper" ref={bulletStyleDropdownRef} style={{ display: 'flex', alignItems: 'center' }}>
          <button
            type="button"
            className={`hh-toolbar-button ${isUnorderedListActive ? 'hh-active' : ''}`}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToolbarClick('unorderedList');
            }}
            disabled={disabled}
            title="Bullet list"
            style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRight: 'none' }}
          >
            <BulletListIcon />
          </button>
          <button
            type="button"
            className={`hh-toolbar-button ${showBulletStyleDropdown ? 'hh-active' : ''}`}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleBulletStyle();
            }}
            disabled={disabled}
            title="Bullet style options"
            style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0, padding: '4px 6px', minWidth: 'auto' }}
          >
            <DropdownArrowIcon width={10} height={10} />
          </button>
          {showBulletStyleDropdown && (
            <BulletStyleDropdown
              currentStyle={currentBulletStyle}
              onSelect={onBulletStyleSelect}
            />
          )}
        </div>
      );
    } else if (button === 'orderedList') {
      // Render ordered list with separate button and arrow
      const currentListStyle = getCurrentListStyle();
      const isOrderedListActive = getButtonActiveState('orderedList');
      
      buttons.push(
        <div key="orderedList" className="hh-toolbar-dropdown-wrapper" ref={listStyleDropdownRef} style={{ display: 'flex', alignItems: 'center' }}>
          <button
            type="button"
            className={`hh-toolbar-button ${isOrderedListActive ? 'hh-active' : ''}`}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToolbarClick('orderedList');
            }}
            disabled={disabled}
            title="Numbered list"
            style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRight: 'none' }}
          >
            <NumberedListIcon />
          </button>
          <button
            type="button"
            className={`hh-toolbar-button ${showListStyleDropdown ? 'hh-active' : ''}`}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleListStyle();
            }}
            disabled={disabled}
            title="List style options"
            style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0, padding: '4px 6px', minWidth: 'auto' }}
          >
            <DropdownArrowIcon width={10} height={10} />
          </button>
          {showListStyleDropdown && (
            <ListStyleDropdown
              currentStyle={currentListStyle}
              onSelect={onListStyleSelect}
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
          isActive={getButtonActiveState(button)}
          onClick={() => onToolbarClick(button)}
        />
      );
    }
  });

  return <div className="hh-toolbar">{buttons}</div>;
};

