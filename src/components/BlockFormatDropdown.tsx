import React from 'react';
import { blockFormats } from '../const/constants';

interface BlockFormatDropdownProps {
  currentFormat: string;
  onSelect: (tag: string) => void;
}

export const BlockFormatDropdown: React.FC<BlockFormatDropdownProps> = ({
  currentFormat,
  onSelect
}) => {
  return (
    <div className="hh-toolbar-dropdown hh-blockformat-dropdown">
      {blockFormats.map((format) => {
        const isSelected = currentFormat === format.value;
        return (
          <div
            key={format.value}
            className={`hh-dropdown-item hh-blockformat-item ${isSelected ? 'hh-selected' : ''}`}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelect(format.tag);
            }}
          >
            <span
              className="hh-blockformat-preview"
              style={{
                fontSize: format.value.startsWith('heading')
                  ? format.value === 'heading1' ? '2em'
                    : format.value === 'heading2' ? '1.5em'
                      : format.value === 'heading3' ? '1.17em'
                        : format.value === 'heading4' ? '1em'
                          : format.value === 'heading5' ? '0.83em'
                            : '0.67em'
                  : '1em',
                fontWeight: format.value.startsWith('heading') ? 'bold' : 'normal',
                fontFamily: (format.value === 'preformatted' || format.value === 'code') ? 'monospace' : 'inherit',
                fontStyle: format.value === 'quote' ? 'italic' : 'normal',
                borderLeft: format.value === 'quote' ? '3px solid #ccc' : 'none',
                paddingLeft: format.value === 'quote' ? '10px' : '0',
                backgroundColor: format.value === 'code' ? '#f5f5f5' : 'transparent',
                padding: format.value === 'code' ? '2px 4px' : '0',
                borderRadius: format.value === 'code' ? '3px' : '0'
              }}
            >
              {format.label}
            </span>
            {isSelected && (
              <span className="hh-checkmark">✓</span>
            )}
          </div>
        );
      })}
    </div>
  );
};

