import 'reflect-metadata';

// Tipos de validación disponibles
export type ValidationRule = {
  type: string;
  message?: string;
  options?: any;
};

// Decoradores de validación
export function IsString(message?: string): PropertyDecorator {
  return addValidation({ type: 'string', message });
}

export function IsNumber(message?: string): PropertyDecorator {
  return addValidation({ type: 'number', message });
}

export function IsBoolean(message?: string): PropertyDecorator {
  return addValidation({ type: 'boolean', message });
}

export function IsDate(message?: string): PropertyDecorator {
  return addValidation({ type: 'date', message });
}

export function IsEmail(message?: string): PropertyDecorator {
  return addValidation({ type: 'email', message });
}

export function IsRequired(message?: string): PropertyDecorator {
  return addValidation({ type: 'required', message });
}

export function MinLength(min: number, message?: string): PropertyDecorator {
  return addValidation({ type: 'minLength', options: { min }, message });
}

export function MaxLength(max: number, message?: string): PropertyDecorator {
  return addValidation({ type: 'maxLength', options: { max }, message });
}

export function Min(min: number, message?: string): PropertyDecorator {
  return addValidation({ type: 'min', options: { min }, message });
}

export function Max(max: number, message?: string): PropertyDecorator {
  return addValidation({ type: 'max', options: { max }, message });
}

export function Pattern(pattern: RegExp, message?: string): PropertyDecorator {
  return addValidation({ type: 'pattern', options: { pattern }, message });
}

// Función auxiliar para agregar reglas de validación
function addValidation(rule: ValidationRule): PropertyDecorator {
  return (target: any, propertyKey: string | symbol) => {
    const rules = Reflect.getMetadata('validation:rules', target) || {};
    rules[propertyKey] = [...(rules[propertyKey] || []), rule];
    Reflect.defineMetadata('validation:rules', rules, target);
  };
}

// Función para validar un DTO
export function validate(dto: any): { isValid: boolean; errors: { [key: string]: string[] } } {
  const rules = Reflect.getMetadata('validation:rules', dto.constructor) || {};
  const errors: { [key: string]: string[] } = {};
  let isValid = true;

  for (const [property, propertyRules] of Object.entries(rules)) {
    const value = dto[property];
    const propertyErrors: string[] = [];

    for (const rule of propertyRules as ValidationRule[]) {
      const error = validateRule(value, rule);
      if (error) {
        propertyErrors.push(error);
        isValid = false;
      }
    }

    if (propertyErrors.length > 0) {
      errors[property] = propertyErrors;
    }
  }

  return { isValid, errors };
}

// Función auxiliar para validar una regla
function validateRule(value: any, rule: ValidationRule): string | null {
  const defaultMessages: { [key: string]: string } = {
    required: 'Este campo es requerido',
    string: 'Debe ser una cadena de texto',
    number: 'Debe ser un número',
    boolean: 'Debe ser un valor booleano',
    date: 'Debe ser una fecha válida',
    email: 'Debe ser un correo electrónico válido',
    minLength: `Debe tener al menos ${rule.options?.min} caracteres`,
    maxLength: `Debe tener como máximo ${rule.options?.max} caracteres`,
    min: `Debe ser mayor o igual a ${rule.options?.min}`,
    max: `Debe ser menor o igual a ${rule.options?.max}`,
    pattern: 'El formato no es válido'
  };

  switch (rule.type) {
    case 'required':
      if (value === undefined || value === null || value === '') {
        return rule.message || defaultMessages.required;
      }
      break;

    case 'string':
      if (value !== undefined && typeof value !== 'string') {
        return rule.message || defaultMessages.string;
      }
      break;

    case 'number':
      if (value !== undefined && typeof value !== 'number') {
        return rule.message || defaultMessages.number;
      }
      break;

    case 'boolean':
      if (value !== undefined && typeof value !== 'boolean') {
        return rule.message || defaultMessages.boolean;
      }
      break;

    case 'date':
      if (value !== undefined && !(value instanceof Date) && isNaN(Date.parse(value))) {
        return rule.message || defaultMessages.date;
      }
      break;

    case 'email':
      if (value !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return rule.message || defaultMessages.email;
      }
      break;

    case 'minLength':
      if (value !== undefined && value.length < rule.options.min) {
        return rule.message || defaultMessages.minLength;
      }
      break;

    case 'maxLength':
      if (value !== undefined && value.length > rule.options.max) {
        return rule.message || defaultMessages.maxLength;
      }
      break;

    case 'min':
      if (value !== undefined && value < rule.options.min) {
        return rule.message || defaultMessages.min;
      }
      break;

    case 'max':
      if (value !== undefined && value > rule.options.max) {
        return rule.message || defaultMessages.max;
      }
      break;

    case 'pattern':
      if (value !== undefined && !rule.options.pattern.test(value)) {
        return rule.message || defaultMessages.pattern;
      }
      break;
  }

  return null;
} 