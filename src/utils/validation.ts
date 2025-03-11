import { Type } from '../types/common';

export function isNil(value: any): value is null | undefined {
  return value === null || value === undefined;
}

export function isObject(value: any): value is object {
  return typeof value === 'object' && value !== null;
}

export function isFunction(value: any): value is Function {
  return typeof value === 'function';
}

export function isString(value: any): value is string {
  return typeof value === 'string';
}

export function isNumber(value: any): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isBoolean(value: any): value is boolean {
  return typeof value === 'boolean';
}

export function isArray(value: any): value is any[] {
  return Array.isArray(value);
}

export function isClass(value: any): value is Type<any> {
  return isFunction(value) && /^\s*class\s+/.test(value.toString());
}

export function isEmpty(value: any): boolean {
  if (isNil(value)) return true;
  if (isString(value)) return value.trim().length === 0;
  if (isArray(value)) return value.length === 0;
  if (isObject(value)) return Object.keys(value).length === 0;
  return false;
}

export function isPromise(value: any): value is Promise<any> {
  return value instanceof Promise;
} 