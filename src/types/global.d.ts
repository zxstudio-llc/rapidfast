declare module 'boxen' {
  interface BoxenOptions {
    padding?: number | { top?: number; right?: number; bottom?: number; left?: number };
    margin?: number | { top?: number; right?: number; bottom?: number; left?: number };
    borderStyle?: 'single' | 'double' | 'round' | 'bold' | 'singleDouble' | 'doubleSingle' | 'classic';
    borderColor?: string;
    backgroundColor?: string;
    title?: string;
    titleAlignment?: 'left' | 'center' | 'right';
    float?: 'left' | 'right' | 'center';
    align?: 'left' | 'center' | 'right';
    width?: number;
    height?: number;
    dimBorder?: boolean;
  }

  function boxen(input: string, options?: BoxenOptions): string;
  export = boxen;
}

declare module 'gradient-string' {
  interface Gradient {
    (str: string): string;
    multiline(str: string): string;
  }

  interface GradientString {
    [key: string]: Gradient;
    atlas: Gradient;
    cristal: Gradient;
    teen: Gradient;
    mind: Gradient;
    morning: Gradient;
    vice: Gradient;
    passion: Gradient;
    fruit: Gradient;
    instagram: Gradient;
    retro: Gradient;
    summer: Gradient;
    rainbow: Gradient;
    pastel: Gradient;
  }

  const gradient: GradientString;
  export = gradient;
}

declare module 'log-symbols' {
  interface LogSymbols {
    info: string;
    success: string;
    warning: string;
    error: string;
  }

  const logSymbols: LogSymbols;
  export = logSymbols;
} 