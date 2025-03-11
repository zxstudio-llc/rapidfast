import 'reflect-metadata';

/**
 * Establece metadatos en una clase o método
 */
export function SetMetadata(metadataKey: string, metadataValue: any) {
  return (target: any, key?: string | symbol) => {
    if (key) {
      // Si es un método
      Reflect.defineMetadata(metadataKey, metadataValue, target, key);
    } else {
      // Si es una clase
      Reflect.defineMetadata(metadataKey, metadataValue, target);
    }
  };
}

/**
 * Obtiene metadatos de una clase o método
 */
export function GetMetadata(metadataKey: string, target: any, key?: string | symbol): any {
  return key 
    ? Reflect.getMetadata(metadataKey, target, key)
    : Reflect.getMetadata(metadataKey, target);
}

/**
 * Verifica si existen metadatos en una clase o método
 */
export function HasMetadata(metadataKey: string, target: any, key?: string | symbol): boolean {
  return key 
    ? Reflect.hasMetadata(metadataKey, target, key)
    : Reflect.hasMetadata(metadataKey, target);
} 