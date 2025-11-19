import React from 'react';

interface BulletStyleOption {
  value: string;
  label: string;
  preview: string[];
}

const bulletStyles: BulletStyleOption[] = [
  { value: 'disc', label: 'Disc', preview: ['●', '●', '●'] },
  { value: 'circle', label: 'Circle', preview: ['○', '○', '○'] },
  { value: 'square', label: 'Square', preview: ['■', '■', '■'] }
];

interface BulletStyleDropdownProps {
  currentStyle: string;
  onSelect: (style: string) => void;
}

export const BulletStyleDropdown: React.FC<BulletStyleDropdownProps> = ({
  currentStyle,
  onSelect
}) => {
  return (
    <div className="hh-toolbar-dropdown hh-bullet-style-dropdown">
      <div className="hh-bullet-style-grid">
        {bulletStyles.map((style) => {
          const isSelected = currentStyle === style.value;
          return (
            <div
              key={style.value}
              className={`hh-bullet-style-option ${isSelected ? 'hh-selected' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelect(style.value);
              }}
              title={style.label}
            >
              <div className="hh-bullet-style-preview">
                {style.preview.map((item, index) => (
                  <div key={index} className="hh-bullet-style-item">
                    <span className="hh-bullet-style-marker">{item}</span>
                    <span className="hh-bullet-style-skeleton-bar"></span>
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

