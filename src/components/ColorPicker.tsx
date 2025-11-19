import React from 'react';
import { hexToRgb, rgbToHsl, hslToRgb, rgbToHex } from '../utils/utils';

export interface PickerColor {
  h: number;
  s: number;
  l: number;
  r: number;
  g: number;
  b: number;
  hex: string;
}

interface ColorPickerProps {
  pickerColor: PickerColor;
  onUpdateColor: (updates: Partial<PickerColor>) => void;
  onSave: () => void;
  onCancel: () => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  pickerColor,
  onUpdateColor,
  onSave,
  onCancel
}) => {
  const updatePickerColor = (updates: Partial<PickerColor>) => {
    const updated = { ...pickerColor, ...updates };

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

    onUpdateColor(updated);
  };

  return (
    <div className="hh-color-picker-overlay" onClick={onCancel}>
      <div className="hh-color-picker-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="hh-color-picker-header">
          <h3>Color Picker</h3>
          <button
            className="hh-color-picker-close"
            onClick={onCancel}
            title="Close"
          >
            ×
          </button>
        </div>

        <div className="hh-color-picker-content">
          <div className="hh-color-picker-left">
            <div
              className="hh-color-picker-gradient"
              style={{
                background: `linear-gradient(to bottom, transparent, black), linear-gradient(to right, white, hsl(${pickerColor.h}, 100%, 50%))`
              }}
              onMouseDown={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const handleMove = (moveEvent: MouseEvent) => {
                  const x = Math.max(0, Math.min(1, (moveEvent.clientX - rect.left) / rect.width));
                  const y = Math.max(0, Math.min(1, (moveEvent.clientY - rect.top) / rect.height));
                  updatePickerColor({ s: x * 100, l: (1 - y) * 100 });
                };
                const handleUp = () => {
                  document.removeEventListener('mousemove', handleMove);
                  document.removeEventListener('mouseup', handleUp);
                };
                handleMove(e.nativeEvent);
                document.addEventListener('mousemove', handleMove);
                document.addEventListener('mouseup', handleUp);
              }}
            >
              <div
                className="hh-color-picker-indicator"
                style={{
                  left: `${pickerColor.s}%`,
                  top: `${100 - pickerColor.l}%`
                }}
              />
            </div>

            <div
              className="hh-color-picker-hue-slider"
              onMouseDown={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const handleMove = (moveEvent: MouseEvent) => {
                  const y = Math.max(0, Math.min(1, (moveEvent.clientY - rect.top) / rect.height));
                  updatePickerColor({ h: (1 - y) * 360 });
                };
                const handleUp = () => {
                  document.removeEventListener('mousemove', handleMove);
                  document.removeEventListener('mouseup', handleUp);
                };
                handleMove(e.nativeEvent);
                document.addEventListener('mousemove', handleMove);
                document.addEventListener('mouseup', handleUp);
              }}
            >
              <div
                className="hh-color-picker-hue-indicator"
                style={{
                  top: `${100 - (pickerColor.h / 360) * 100}%`
                }}
              />
            </div>
          </div>

          <div className="hh-color-picker-right">
            <div className="hh-color-picker-inputs">
              <div className="hh-color-picker-input-group">
                <label>R</label>
                <input
                  type="number"
                  min="0"
                  max="255"
                  value={pickerColor.r}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    updatePickerColor({ r: Math.max(0, Math.min(255, val)) });
                  }}
                />
              </div>
              <div className="hh-color-picker-input-group">
                <label>G</label>
                <input
                  type="number"
                  min="0"
                  max="255"
                  value={pickerColor.g}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    updatePickerColor({ g: Math.max(0, Math.min(255, val)) });
                  }}
                />
              </div>
              <div className="hh-color-picker-input-group">
                <label>B</label>
                <input
                  type="number"
                  min="0"
                  max="255"
                  value={pickerColor.b}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    updatePickerColor({ b: Math.max(0, Math.min(255, val)) });
                  }}
                />
              </div>
            </div>

            <div className="hh-color-picker-hex">
              <label>#</label>
              <input
                type="text"
                value={pickerColor.hex.substring(1).toUpperCase()}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9A-Fa-f]/g, '').substring(0, 6);
                  if (val.length === 6) {
                    updatePickerColor({ hex: '#' + val });
                  } else if (val.length > 0) {
                    updatePickerColor({ hex: '#' + val });
                  }
                }}
                onBlur={(e) => {
                  const val = e.target.value.replace(/[^0-9A-Fa-f]/g, '').substring(0, 6);
                  if (val.length === 6) {
                    updatePickerColor({ hex: '#' + val });
                  } else {
                    // Restore valid hex if invalid
                    const currentHex = pickerColor.hex.substring(1).toUpperCase();
                    e.target.value = currentHex;
                  }
                }}
              />
            </div>

            <div className="hh-color-picker-preview">
              <div
                className="hh-color-picker-preview-color"
                style={{ backgroundColor: pickerColor.hex }}
              />
            </div>
          </div>
        </div>

        <div className="hh-color-picker-footer">
          <button
            className="hh-color-picker-cancel"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="hh-color-picker-save"
            onClick={onSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

