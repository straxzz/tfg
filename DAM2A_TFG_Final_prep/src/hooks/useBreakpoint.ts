/**
 * Sistema de breakpoints responsive.
 *
 * Móvil (sm): < 640
 * Tablet (md): 640 – 1023
 * Desktop (lg): 1024 – 1439
 * Wide (xl): >= 1440
 *
 * Devuelve también helpers prácticos como `isDesktop`, `gridColumns` y `screenPadding`.
 */

import { useWindowDimensions } from 'react-native';

export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl';

export interface BreakpointInfo {
  width: number;
  height: number;
  bp: Breakpoint;
  isPhone: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isWide: boolean;
  /** Columnas recomendadas para grids de prendas. */
  gridColumns: number;
  /** Padding lateral recomendado. */
  screenPadding: number;
  /** Ancho máximo del contenido centrado. */
  contentMaxWidth: number;
}

export const useBreakpoint = (): BreakpointInfo => {
  const { width, height } = useWindowDimensions();

  let bp: Breakpoint = 'sm';
  if (width >= 1440) bp = 'xl';
  else if (width >= 1024) bp = 'lg';
  else if (width >= 640) bp = 'md';

  const isPhone = bp === 'sm';
  const isTablet = bp === 'md';
  const isDesktop = bp === 'lg' || bp === 'xl';
  const isWide = bp === 'xl';

  let gridColumns = 2;
  if (bp === 'md') gridColumns = 3;
  if (bp === 'lg') gridColumns = 4;
  if (bp === 'xl') gridColumns = 5;

  let screenPadding = 24;
  if (bp === 'md') screenPadding = 40;
  if (bp === 'lg') screenPadding = 48;
  if (bp === 'xl') screenPadding = 64;

  let contentMaxWidth = 9999;
  if (bp === 'md') contentMaxWidth = 720;
  if (bp === 'lg') contentMaxWidth = 960;
  if (bp === 'xl') contentMaxWidth = 1200;

  return {
    width,
    height,
    bp,
    isPhone,
    isTablet,
    isDesktop,
    isWide,
    gridColumns,
    screenPadding,
    contentMaxWidth,
  };
};
