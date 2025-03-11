import * as path from 'path';

export function normalizePath(pathToNormalize: string): string {
  return path.normalize(pathToNormalize).replace(/\\/g, '/');
}

export function joinPaths(...paths: string[]): string {
  return normalizePath(path.join(...paths));
}

export function resolvePath(...paths: string[]): string {
  return normalizePath(path.resolve(...paths));
}

export function getRelativePath(from: string, to: string): string {
  return normalizePath(path.relative(from, to));
}

export function getDirname(filePath: string): string {
  return normalizePath(path.dirname(filePath));
}

export function getBasename(filePath: string, ext?: string): string {
  return path.basename(filePath, ext);
}

export function getExtname(filePath: string): string {
  return path.extname(filePath);
} 