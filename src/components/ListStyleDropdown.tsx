import React from 'react';

interface ListStyleOption {
  value: string;
  label: string;
  preview: string[];
}

const listStyles: ListStyleOption[] = [
  { value: 'decimal', label: 'Decimal', preview: ['1.', '2.', '3.'] },
  { value: 'lower-alpha', label: 'Lower Alpha', preview: ['a.', 'b.', 'c.'] },
  { value: 'upper-alpha', label: 'Upper Alpha', preview: ['A.', 'B.', 'C.'] },
  { value: 'lower-roman', label: 'Lower Roman', preview: ['i.', 'ii.', 'iii.'] },
  { value: 'upper-roman', label: 'Upper Roman', preview: ['I.', 'II.', 'III.'] },
  { value: 'lower-greek', label: 'Lower Greek', preview: ['α.', 'β.', 'γ.'] }
];

interface ListStyleDropdownProps {
  currentStyle: string;
  onSelect: (style: string) => void;
}

export const ListStyleDropdown: React.FC<ListStyleDropdownProps> = ({
  currentStyle,
  onSelect
}) => {
  return (
    <div className="hh-toolbar-dropdown hh-list-style-dropdown">
      <div className="hh-list-style-grid">
        {listStyles.map((style) => {
          const isSelected = currentStyle === style.value;
          return (
            <div
              key={style.value}
              className={`hh-list-style-option ${isSelected ? 'hh-selected' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelect(style.value);
              }}
              title={style.label}
            >
              <div className="hh-list-style-preview">
                {style.preview.map((item, index) => (
                  <div key={index} className="hh-list-style-item">
                    <span className="hh-list-style-marker">{item}</span>
                    <span className="hh-list-style-skeleton-bar"></span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

