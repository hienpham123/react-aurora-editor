import React from 'react';
import { fontFamilies } from '../const/constants';

interface FontFamilyDropdownProps {
  currentFamily: string | null;
  onSelect: (family: string | null) => void;
}

export const FontFamilyDropdown: React.FC<FontFamilyDropdownProps> = ({
  currentFamily,
  onSelect
}) => {
  return (
    <div className="hh-toolbar-dropdown hh-fontfamily-dropdown">
      {fontFamilies.map((familyOption) => {
        const isSelected = currentFamily === familyOption.value;
        return (
          <div
            key={familyOption.value === null ? 'default' : familyOption.value}
            className={`hh-dropdown-item hh-fontfamily-item ${isSelected ? 'hh-selected' : ''}`}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelect(familyOption.value);
            }}
          >
            <span
              className="hh-fontfamily-preview"
              style={{
                fontFamily: familyOption.value || 'inherit'
              }}
            >
              {familyOption.label}
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

