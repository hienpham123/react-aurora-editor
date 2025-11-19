import React from 'react';
import { CheckmarkIcon, RemoveColorIcon, ColorPickerIcon } from '../icons/icons';

export interface ColorOption {
  label: string;
  value: string;
}

interface ColorDropdownProps {
  currentColor: string | null;
  fontColors: ColorOption[];
  hoveredColor: string | null;
  onColorSelect: (color: string, e: React.MouseEvent) => void;
  onRemoveColor: (e: React.MouseEvent) => void;
  onOpenColorPicker: () => void;
  onMouseEnter: (color: string, e: React.MouseEvent) => void;
  onMouseLeave: () => void;
}

export const ColorDropdown: React.FC<ColorDropdownProps> = ({
  currentColor,
  fontColors,
  hoveredColor,
  onColorSelect,
  onRemoveColor,
  onOpenColorPicker,
  onMouseEnter,
  onMouseLeave
}) => {
  return (
    <div
      className="hh-toolbar-dropdown hh-color-dropdown"
      onMouseLeave={onMouseLeave}
    >
      <div className="hh-color-grid">
        {/* Color Swatches */}
        {fontColors.map((color) => {
          const isSelected = currentColor?.toUpperCase() === color.value.toUpperCase();
          return (
            <div
              key={color.value}
              className={`hh-color-swatch ${isSelected ? 'hh-selected' : ''} ${hoveredColor === color.value ? 'hh-hovered' : ''}`}
              style={{ backgroundColor: color.value }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onColorSelect(color.value, e);
              }}
              onMouseEnter={(e) => onMouseEnter(color.value, e)}
              onMouseLeave={onMouseLeave}
            >
              {isSelected && <CheckmarkIcon />}
            </div>
          );
        })}
        {/* Remove Color Button - Bottom Right */}
        <button
          type="button"
          className="hh-color-swatch hh-no-color-swatch"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemoveColor(e);
          }}
          title="Remove Color"
        >
          <RemoveColorIcon width={16} height={16} />
        </button>
        {/* Color Picker Button - Bottom Right */}
        <button
          type="button"
          className="hh-color-swatch hh-palette-swatch"
          onClick={onOpenColorPicker}
          title="More Colors"
        >
          <ColorPickerIcon width={16} height={16} />
        </button>
      </div>
    </div>
  );
};

