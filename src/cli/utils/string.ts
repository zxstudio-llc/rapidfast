/**
 * Convierte un string a PascalCase
 * Ejemplo: "hello-world" -> "HelloWorld"
 */
export function toPascalCase(str: string): string {
  return str
    .split(/[-_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

/**
 * Convierte un string a kebab-case
 * Ejemplo: "HelloWorld" -> "hello-world"
 */
export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/**
 * Convierte un string a camelCase
 * Ejemplo: "hello-world" -> "helloWorld"
 */
export function toCamelCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '')
    .replace(/^[A-Z]/, c => c.toLowerCase());
}

/**
 * Capitaliza la primera letra de un string
 * Ejemplo: "hello" -> "Hello"
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
} 