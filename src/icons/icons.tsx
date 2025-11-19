import React from 'react';

interface IconProps {
  className?: string;
  style?: React.CSSProperties;
  width?: number | string;
  height?: number | string;
}

export const UndoIcon: React.FC<IconProps> = ({ className = 'hh-icon-svg', style, width = 16, height = 16 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048" className={className} style={style} width={width} height={height}>
    <path d="M1152 640q128 0 245 48t208 139q91 91 139 208t48 245q0 133-50 249t-137 204-203 137-250 50v-128q106 0 199-40t162-110 110-163 41-199q0-106-40-199t-110-162-163-110-199-41H475l402 403-90 90-557-557 557-557 90 90-402 403h677z" />
  </svg>
);

export const RedoIcon: React.FC<IconProps> = ({ className = 'hh-icon-svg', style, width = 16, height = 16 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048" className={className} style={{ ...style, transform: 'scaleX(-1)' }} width={width} height={height}>
    <path d="M1152 640q128 0 245 48t208 139q91 91 139 208t48 245q0 133-50 249t-137 204-203 137-250 50v-128q106 0 199-40t162-110 110-163 41-199q0-106-40-199t-110-162-163-110-199-41H475l402 403-90 90-557-557 557-557 90 90-402 403h677z" />
  </svg>
);

export const AlignLeftIcon: React.FC<IconProps> = ({ className = 'hh-icon-svg', style, width = 16, height = 16 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className={className} style={style} width={width} height={height}>
    <path d="M2 3h12v1.5H2V3zm0 3h9v1.5H2V6zm0 3h12v1.5H2V9zm0 3h8v1.5H2V12z" />
  </svg>
);

export const AlignCenterIcon: React.FC<IconProps> = ({ className = 'hh-icon-svg', style, width = 16, height = 16 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className={className} style={style} width={width} height={height}>
    <path d="M2 3h12v1.5H2V3zm1.5 3h9v1.5h-9V6zm0 3h12v1.5h-12V9zm1.5 3h9v1.5h-9V12z" />
  </svg>
);

export const AlignRightIcon: React.FC<IconProps> = ({ className = 'hh-icon-svg', style, width = 16, height = 16 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className={className} style={style} width={width} height={height}>
    <path d="M2 3h12v1.5H2V3zm3 3h9v1.5H5V6zm0 3h12v1.5H5V9zm4 3h8v1.5H9V12z" />
  </svg>
);

export const AlignJustifyIcon: React.FC<IconProps> = ({ className = 'hh-icon-svg', style, width = 16, height = 16 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className={className} style={style} width={width} height={height}>
    <path d="M2 3h12v1.5H2V3zm0 3h12v1.5H2V6zm0 3h12v1.5H2V9zm0 3h12v1.5H2V12z" />
  </svg>
);

export const LinkIcon: React.FC<IconProps> = ({ className = 'hh-icon-svg', style, width = 16, height = 16 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048" className={className} style={style} width={width} height={height}>
    <path d="M1536 768v128q76 0 145 17t123 56 84 99 32 148q0 66-25 124t-69 101-102 69-124 26h-512q-66 0-124-25t-101-69-69-102-26-124q0-87 31-147t85-99 122-56 146-18V768h-64q-93 0-174 35t-142 96-96 142-36 175q0 93 35 174t96 142 142 96 175 36h512q93 0 174-35t142-96 96-142 36-175q0-93-35-174t-96-142-142-96-175-36h-64zm-640 512v-128q76 0 145-17t123-56 84-99 32-148q0-66-25-124t-69-101-102-69-124-26H448q-66 0-124 25t-101 69-69 102-26 124q0 87 31 147t85 99 122 56 146 18v128h-64q-93 0-174-35t-142-96-96-142T0 832q0-93 35-174t96-142 142-96 175-36h512q93 0 174 35t142 96 96 142 36 175q0 93-35 174t-96 142-142 96-175 36h-64z" />
  </svg>
);

export const ImageIcon: React.FC<IconProps> = ({ className = 'hh-icon-svg', style, width = 16, height = 16 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048" className={className} style={style} width={width} height={height}>
    <path d="M1792 1536H256V384h1536v1152zM384 512v486l352-352 448 447 192-191 288 287V512H384zm0 896h933L736 827l-352 351v230zm1280 0v-37l-288-288-102 101 225 224h165zm-192-640q-26 0-45-19t-19-45q0-26 19-45t45-19q26 0 45 19t19 45q0 26-19 45t-45 19zM2048 0v2048H0V0h2048zm-128 128H128v1792h1792V128z" />
  </svg>
);

export const CheckmarkIcon: React.FC<IconProps> = ({ className = 'hh-color-checkmark', style, width = 16, height = 16 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className={className} style={style} width={width} height={height}>
    <path 
      d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" 
      fill="white" 
      stroke="rgba(0,0,0,0.3)" 
      strokeWidth="0.5"
    />
  </svg>
);

export const RemoveColorIcon: React.FC<IconProps> = ({ className = 'hh-icon-svg', style, width = 16, height = 16 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className={className} style={style} width={width} height={height}>
    <line x1="2" y1="2" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const ColorPickerIcon: React.FC<IconProps> = ({ className = 'hh-icon-svg', style, width = 16, height = 16 }) => (
  <svg viewBox="0 0 24 24" className={className} style={style} width={width} height={height}>
    <path d="M12 3a9 9 0 0 0 0 18 1.5 1.5 0 0 0 1.1-2.5c-.2-.3-.4-.6-.4-1 0-.8.7-1.5 1.5-1.5H16a5 5 0 0 0 5-5c0-4.4-4-8-9-8Zm-5.5 9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm3-4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm3 4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z" fillRule="nonzero" fill="currentColor" />
  </svg>
);

