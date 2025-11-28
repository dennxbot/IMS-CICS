'use client';

import { useEffect } from 'react';

interface ThemeProviderProps {
  primaryColor?: string;
  secondaryColor?: string;
  children: React.ReactNode;
}

export function ThemeProvider({ primaryColor, secondaryColor, children }: ThemeProviderProps) {
  useEffect(() => {
    // Force immediate CSS update without cache
    const updateTheme = () => {
      if (primaryColor) {
        const primaryHsl = hexToHsl(primaryColor);
        document.documentElement.style.setProperty('--primary-hue', primaryHsl.h.toString());
        document.documentElement.style.setProperty('--primary-saturation', `${primaryHsl.s}%`);
        document.documentElement.style.setProperty('--primary-lightness', `${primaryHsl.l}%`);
        
        // Set foreground color based on lightness for contrast
        const primaryForeground = primaryHsl.l > 50 ? '10%' : '98%';
        document.documentElement.style.setProperty('--primary-foreground-lightness', primaryForeground);
      }
      
      if (secondaryColor) {
        const secondaryHsl = hexToHsl(secondaryColor);
        document.documentElement.style.setProperty('--secondary-hue', secondaryHsl.h.toString());
        document.documentElement.style.setProperty('--secondary-saturation', `${secondaryHsl.s}%`);
        document.documentElement.style.setProperty('--secondary-lightness', `${secondaryHsl.l}%`);
        
        // Set foreground color based on lightness for contrast
        const secondaryForeground = secondaryHsl.l > 50 ? '10%' : '98%';
        document.documentElement.style.setProperty('--secondary-foreground-lightness', secondaryForeground);
      }
      
      // Force browser to recalculate styles immediately
      document.documentElement.style.display = 'none';
      void document.documentElement.offsetHeight; // Force reflow
      document.documentElement.style.display = '';
    };

    updateTheme();
  }, [primaryColor, secondaryColor]);

  return <>{children}</>;
}

interface HSL {
  h: number;
  s: number;
  l: number;
}

function hexToHsl(hex: string): HSL {
  const rgb = hexToRgb(hex);
  if (!rgb) return { h: 222.2, s: 47.4, l: 11.2 };
  
  const { r, g, b } = rgb;
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const diff = max - min;
  
  let hue = 0;
  
  if (diff !== 0) {
    if (max === rNorm) {
      hue = ((gNorm - bNorm) / diff) % 6;
    } else if (max === gNorm) {
      hue = (bNorm - rNorm) / diff + 2;
    } else {
      hue = (rNorm - gNorm) / diff + 4;
    }
  }
  
  hue = Math.round(hue * 60);
  if (hue < 0) hue += 360;
  
  const lightness = (max + min) / 2;
  
  if (diff === 0) return { h: hue, s: 0, l: lightness * 100 };
  
  const saturation = diff / (1 - Math.abs(2 * lightness - 1));
  
  return {
    h: hue,
    s: saturation * 100,
    l: lightness * 100
  };
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}