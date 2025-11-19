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

export const BulletListIcon: React.FC<IconProps> = ({ className = 'hh-icon-svg', style, width = 16, height = 16 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048" className={className} style={style} width={width} height={height}>
    <path d="M0 1280v-128h128v128H0zm0-384V768h128v128H0zm384 0V768h1664v128H384zM0 512V384h128v128H0zm384-128h1664v128H384V384zm0 896v-128h1664v128H384zM0 1664v-128h128v128H0zm384 0v-128h1664v128H384z" />
  </svg>
);

export const NumberedListIcon: React.FC<IconProps> = ({ className = 'hh-icon-svg', style, width = 16, height = 16 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048" className={className} style={style} width={width} height={height}>
    <path d="M2048 384v128H512V384h1536zM512 896h1536v128H512V896zm0 512h1536v128H512v-128zM135 349q-14 11-37 21t-43 11v-69q31-11 59-24t54-33h49v385h-82V349zm-1 420q25 0 47 6t39 20 26 34 10 47q0 31-12 54t-29 42-39 33-38 27-30 25-12 26h160v69H5v-41q0-18 10-39 15-34 41-57t51-44 45-40 19-47q0-27-15-38t-40-11q-26 0-49 11t-44 28v-73q50-32 111-32zm36 699q36 5 61 27t25 61q0 31-12 53t-33 35-46 20-54 7q-24 0-48-4t-47-15v-73q19 14 41 21t47 7q26 0 46-11t21-41q0-22-13-32t-31-15-39-5-34 0v-64h32q18 0 34-3t28-14 12-31q0-26-16-36t-40-10q-39 0-74 24v-68q22-11 45-15t48-5q22 0 44 5t39 16 28 30 11 43q0 38-19 60t-56 32v1z" />
  </svg>
);

export const DropdownArrowIcon: React.FC<IconProps> = ({ className = 'hh-dropdown-arrow-icon', style, width = 10, height = 10 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048" className={className} style={style} width={width} height={height}>
    <path d="M1024 1657L25 658l121-121 878 878 878-878 121 121-999 999z" />
  </svg>
);

