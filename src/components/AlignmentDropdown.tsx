import React from 'react';
import { AlignLeftIcon, AlignCenterIcon, AlignRightIcon, AlignJustifyIcon } from '../icons/icons';

interface AlignmentOption {
  value: string;
  label: string;
  icon: React.ReactNode;
}

const alignments: AlignmentOption[] = [
  { value: 'left', label: 'Left', icon: <AlignLeftIcon /> },
  { value: 'center', label: 'Center', icon: <AlignCenterIcon /> },
  { value: 'right', label: 'Right', icon: <AlignRightIcon /> },
  { value: 'justify', label: 'Justify', icon: <AlignJustifyIcon /> }
];

interface AlignmentDropdownProps {
  currentAlignment: string;
  onSelect: (alignment: string) => void;
}

export const AlignmentDropdown: React.FC<AlignmentDropdownProps> = ({
  currentAlignment,
  onSelect
}) => {
  return (
    <div className="hh-toolbar-dropdown hh-alignment-dropdown">
      {alignments.map((alignment) => {
        const isSelected = currentAlignment === alignment.value;
        return (
          <div
            key={alignment.value}
            className={`hh-dropdown-item hh-alignment-option ${isSelected ? 'hh-selected' : ''}`}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelect(alignment.value);
            }}
          >
            <span className="hh-alignment-icon">{alignment.icon}</span>
            <span className="hh-alignment-label">{alignment.label}</span>
            {isSelected && (
              <span className="hh-checkmark">✓</span>
            )}
          </div>
        );
      })}
    </div>
  );
};

