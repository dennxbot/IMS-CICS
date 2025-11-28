'use client';

import { useEffect } from 'react';

interface ThemeUpdaterProps {
  primaryColor?: string;
  secondaryColor?: string;
}

export function ThemeUpdater({ primaryColor, secondaryColor }: ThemeUpdaterProps) {
  useEffect(() => {
    // Listen for theme update events
    const handleThemeUpdate = (event: CustomEvent<{primaryColor: string; secondaryColor: string}>) => {
      const { primaryColor: newPrimary, secondaryColor: newSecondary } = event.detail;
      updateTheme(newPrimary, newSecondary);
    };

    // Custom event type assertion for theme updates
    const themeEvent = 'theme-update' as string;
    window.addEventListener(themeEvent, handleThemeUpdate as EventListener);

    // Initial theme setup
    updateTheme(primaryColor, secondaryColor);

    return () => {
      window.removeEventListener(themeEvent, handleThemeUpdate as EventListener);
    };
  }, [primaryColor, secondaryColor]);

  const updateTheme = (primary?: string, secondary?: string) => {
    if (primary) {
      const primaryHsl = hexToHsl(primary);
      document.documentElement.style.setProperty('--primary-hue', primaryHsl.h.toString());
      document.documentElement.style.setProperty('--primary-saturation', `${primaryHsl.s}%`);
      document.documentElement.style.setProperty('--primary-lightness', `${primaryHsl.l}%`);
      
      const primaryForeground = primaryHsl.l > 50 ? '10%' : '98%';
      document.documentElement.style.setProperty('--primary-foreground-lightness', primaryForeground);
    }
    
    if (secondary) {
      const secondaryHsl = hexToHsl(secondary);
      document.documentElement.style.setProperty('--secondary-hue', secondaryHsl.h.toString());
      document.documentElement.style.setProperty('--secondary-saturation', `${secondaryHsl.s}%`);
      document.documentElement.style.setProperty('--secondary-lightness', `${secondaryHsl.l}%`);
      
      const secondaryForeground = secondaryHsl.l > 50 ? '10%' : '98%';
      document.documentElement.style.setProperty('--secondary-foreground-lightness', secondaryForeground);
    }
    
    // Force immediate style recalculation
    document.documentElement.style.display = 'none';
    void document.documentElement.offsetHeight; // Force reflow
    document.documentElement.style.display = '';
  };

  return null;
}

interface HSL {
  h: number;
  s: number;
  l: number;
}

function hexToHsl(hex: string): HSL {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 222.2, s: 47.4, l: 11.2 };
  
  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  
  let hue = 0;
  if (diff !== 0) {
    if (max === r) {
      hue = ((g - b) / diff) % 6;
    } else if (max === g) {
      hue = (b - r) / diff + 2;
    } else {
      hue = (r - g) / diff + 4;
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