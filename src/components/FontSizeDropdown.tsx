import React from 'react';
import { fontSizes } from '../const/constants';

interface FontSizeDropdownProps {
    currentSize: number | null;
    onSelect: (size: number | null) => void;
}

export const FontSizeDropdown: React.FC<FontSizeDropdownProps> = ({
    currentSize,
    onSelect
}) => {
    return (
        <div className="hh-toolbar-dropdown hh-fontsize-dropdown">
            {fontSizes.map((sizeOption) => {
                const isSelected = currentSize === sizeOption.value;
                return (
                    <div
                        key={sizeOption.value === null ? 'default' : sizeOption.value}
                        className={`hh-dropdown-item hh-fontsize-item ${isSelected ? 'hh-selected' : ''}`}
                        onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onSelect(sizeOption.value);
                        }}
                    >
                        <span
                            className="hh-fontsize-preview"
                            style={{
                                fontSize: sizeOption.value ? `${sizeOption.value}px` : 'inherit'
                            }}
                        >
                            {sizeOption.label}
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

