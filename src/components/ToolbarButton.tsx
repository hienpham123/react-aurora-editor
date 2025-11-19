import React from 'react';
import { ToolbarButton as ToolbarButtonType } from '../AuroraEditor';
import { getButtonConfig } from '../const/constants';
import {
  UndoIcon,
  RedoIcon,
  AlignLeftIcon,
  AlignCenterIcon,
  AlignRightIcon,
  AlignJustifyIcon,
  LinkIcon,
  ImageIcon
} from '../icons/icons';

interface ToolbarButtonProps {
  button: ToolbarButtonType;
  disabled: boolean;
  onClick: () => void;
}

export const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  button,
  disabled,
  onClick
}) => {
  const buttonConfig = getButtonConfig(button);

  const renderIcon = () => {
    switch (button) {
      case 'undo':
        return <UndoIcon />;
      case 'redo':
        return <RedoIcon />;
      case 'alignLeft':
        return <AlignLeftIcon />;
      case 'alignCenter':
        return <AlignCenterIcon />;
      case 'alignRight':
        return <AlignRightIcon />;
      case 'alignJustify':
        return <AlignJustifyIcon />;
      case 'link':
        return <LinkIcon />;
      case 'image':
        return <ImageIcon />;
      default:
        return buttonConfig.icon;
    }
  };

  return (
    <button
      type="button"
      className="hh-toolbar-button"
      onClick={onClick}
      disabled={disabled}
      title={buttonConfig.title}
    >
      {renderIcon()}
    </button>
  );
};

