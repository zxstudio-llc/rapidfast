export type SchemaType = 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';

export interface SchemaField {
  type: SchemaType;
  required?: boolean;
  unique?: boolean;
  default?: any;
  ref?: string;
  validate?: (value: any) => boolean | Promise<boolean>;
  transform?: (value: any) => any;
}

export interface SchemaDefinition {
  [key: string]: SchemaField;
}

export class Schema {
  private fields: Map<string, SchemaField> = new Map();

  constructor(definition: SchemaDefinition) {
    this.parseDefinition(definition);
  }

  private parseDefinition(definition: SchemaDefinition): void {
    for (const [fieldName, fieldDef] of Object.entries(definition)) {
      this.fields.set(fieldName, this.normalizeField(fieldDef));
    }
  }

  private normalizeField(field: SchemaField): SchemaField {
    return {
      required: false,
      unique: false,
      ...field
    };
  }

  async validate(data: Record<string, any>): Promise<boolean> {
    for (const [fieldName, field] of this.fields.entries()) {
      // Verificar campos requeridos
      if (field.required && (data[fieldName] === undefined || data[fieldName] === null)) {
        throw new Error(`El campo "${fieldName}" es requerido`);
      }

      if (data[fieldName] !== undefined && data[fieldName] !== null) {
        // Validar tipo
        if (!this.validateType(data[fieldName], field.type)) {
          throw new Error(`El campo "${fieldName}" debe ser de tipo ${field.type}`);
        }

        // Ejecutar validación personalizada
        if (field.validate) {
          const isValid = await field.validate(data[fieldName]);
          if (!isValid) {
            throw new Error(`Validación fallida para el campo "${fieldName}"`);
          }
        }
      }
    }

    return true;
  }

  transform(data: Record<string, any>): Record<string, any> {
    const transformed: Record<string, any> = {};

    for (const [fieldName, field] of this.fields.entries()) {
      if (data[fieldName] !== undefined) {
        // Aplicar transformación personalizada
        if (field.transform) {
          transformed[fieldName] = field.transform(data[fieldName]);
        } else {
          transformed[fieldName] = this.transformValue(data[fieldName], field.type);
        }
      } else if (field.default !== undefined) {
        // Aplicar valor por defecto
        transformed[fieldName] = typeof field.default === 'function'
          ? field.default()
          : field.default;
      }
    }

    return transformed;
  }

  private validateType(value: any, type: SchemaType): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'date':
        return value instanceof Date && !isNaN(value.getTime());
      case 'object':
        return typeof value === 'object' && value !== null && !(value instanceof Array);
      case 'array':
        return Array.isArray(value);
      default:
        return false;
    }
  }

  private transformValue(value: any, type: SchemaType): any {
    switch (type) {
      case 'string':
        return String(value);
      case 'number':
        return Number(value);
      case 'boolean':
        return Boolean(value);
      case 'date':
        return new Date(value);
      case 'object':
      case 'array':
        return value;
      default:
        return value;
    }
  }

  getFields(): Map<string, SchemaField> {
    return this.fields;
  }
} 