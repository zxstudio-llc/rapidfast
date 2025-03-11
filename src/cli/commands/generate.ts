import * as path from "path";
import * as fs from "fs-extra";
import chalk from "chalk";
import inquirer from "inquirer";
import ora from "ora";
import logSymbols from "log-symbols";
import { templateManager } from '../../templates/template-manager';
import { GenerateOptions } from '../../types/generate';
import { toCamelCase, toPascalCase, toKebabCase, normalizeString } from '../../utils/string';

// Tipos de generación
type GenerateType = 'controller' | 'service' | 'middleware' | 'module' | 'model' | 'dto' | 'resource';

// Función principal para generar recursos
export async function generateResource(options: GenerateOptions): Promise<void> {
  const { name, type, directory = process.cwd(), crud = false, template = 'default' } = options;

  // Normalizar el nombre para diferentes casos
  const normalizedName = normalizeString(name);

  // Construir la ruta del template
  let templatePath = `${type}/${template}`;

  // Si el template no existe, intentar con variaciones
  if (!templateManager.templateExists(templatePath)) {
    const possiblePaths = [
      `${type}/${template}`,
      `${type}/${template}.template`,
      `${type}/default`,
      `${type}/default.template`
    ];

    templatePath = possiblePaths.find(path => templateManager.templateExists(path)) || templatePath;
  }

  // Preparar las variables para el template
  const templateVars = {
    PascalCase: normalizedName.pascal,
    camelCase: normalizedName.camel,
    kebabCase: normalizedName.kebab,
    crud
  };

  try {
    // Cargar y procesar el template
    const content = templateManager.loadTemplate(templatePath);
    const processedContent = content.replace(/\{\{([^}]+)\}\}/g, (match, key: string) => {
      const trimmedKey = key.trim();
      return String(templateVars[trimmedKey as keyof typeof templateVars] || `{{${trimmedKey}}}`);
    });

    // Crear el archivo
    const fileName = `${normalizedName.kebab}.${type}.ts`;
    const filePath = path.join(directory, fileName);

    // Asegurarse de que el directorio existe
    await fs.ensureDir(directory);

    // Escribir el archivo
    await fs.writeFile(filePath, processedContent);

    console.log(`✅ Archivo generado: ${filePath}`);

    // Si es un recurso CRUD, generar archivos adicionales
    if (crud) {
      await generateCrudFiles(normalizedName, directory);
    }
  } catch (error) {
    console.error(`❌ Error generando el recurso: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    throw error;
  }
}

async function generateCrudFiles(normalizedName: ReturnType<typeof normalizeString>, directory: string) {
  // Generar DTO
  await generateDto(normalizedName, directory);

  // Generar servicio
  await generateService(normalizedName, directory);

  // Generar módulo
  await generateModule(normalizedName, directory);
}

async function generateDto(normalizedName: ReturnType<typeof normalizeString>, directory: string) {
  const dtoDir = path.join(directory, 'dto');
  await fs.ensureDir(dtoDir);

  const templateVars = {
    PascalCase: normalizedName.pascal,
    camelCase: normalizedName.camel
  };

  // Create DTO
  const createDtoPath = path.join(dtoDir, `create-${normalizedName.kebab}.dto.ts`);
  const createDtoContent = templateManager.loadTemplate('dto/create.dto.ts.template');
  const processedCreateDto = createDtoContent.replace(/\{\{([^}]+)\}\}/g, (match, key: string) => {
    const trimmedKey = key.trim();
    return String(templateVars[trimmedKey as keyof typeof templateVars] || `{{${trimmedKey}}}`);
  });
  await fs.writeFile(createDtoPath, processedCreateDto);

  // Update DTO
  const updateDtoPath = path.join(dtoDir, `update-${normalizedName.kebab}.dto.ts`);
  const updateDtoContent = templateManager.loadTemplate('dto/update.dto.ts.template');
  const processedUpdateDto = updateDtoContent.replace(/\{\{([^}]+)\}\}/g, (match, key: string) => {
    const trimmedKey = key.trim();
    return String(templateVars[trimmedKey as keyof typeof templateVars] || `{{${trimmedKey}}}`);
  });
  await fs.writeFile(updateDtoPath, processedUpdateDto);

  console.log(`✅ DTOs generados en: ${dtoDir}`);
}

async function generateService(normalizedName: ReturnType<typeof normalizeString>, directory: string) {
  const templateVars = {
    PascalCase: normalizedName.pascal,
    camelCase: normalizedName.camel
  };

  const content = templateManager.loadTemplate('service/service.ts.template');
  const processedContent = content.replace(/\{\{([^}]+)\}\}/g, (match, key: string) => {
    const trimmedKey = key.trim();
    return String(templateVars[trimmedKey as keyof typeof templateVars] || `{{${trimmedKey}}}`);
  });

  const servicePath = path.join(directory, `${normalizedName.kebab}.service.ts`);
  await fs.writeFile(servicePath, processedContent);

  console.log(`✅ Servicio generado: ${servicePath}`);
}

async function generateModule(normalizedName: ReturnType<typeof normalizeString>, directory: string) {
  const templateVars = {
    PascalCase: normalizedName.pascal,
    camelCase: normalizedName.camel
  };

  const content = templateManager.loadTemplate('module/module.ts.template');
  const processedContent = content.replace(/\{\{([^}]+)\}\}/g, (match, key: string) => {
    const trimmedKey = key.trim();
    return String(templateVars[trimmedKey as keyof typeof templateVars] || `{{${trimmedKey}}}`);
  });

  const modulePath = path.join(directory, `${normalizedName.kebab}.module.ts`);
  await fs.writeFile(modulePath, processedContent);

  console.log(`✅ Módulo generado: ${modulePath}`);
}

// Funciones auxiliares para generar cada tipo de recurso
async function generateController({ name, directory, crud = false }: { name: string, directory: string, crud?: boolean }): Promise<void> {
  const pascalName = toPascalCase(name);
  const camelName = toCamelCase(name);
  const fileName = `${camelName}.controller.ts`;
  const filePath = path.join(directory, fileName);
  
  // Variables para la plantilla
  const templateVars = {
    className: pascalName,
    fileName: camelName,
    resourceName: camelName,
    propertyName: camelName
  };
  
  // Seleccionar la plantilla según si es CRUD o no
  const templatePath = crud 
    ? 'controller/crud.ts.template'
    : 'controller/basic.ts.template';
  
  try {
    // Cargar la plantilla y reemplazar variables
    const content = templateManager.loadTemplate(templatePath);
    const processedContent = content.replace(/\{\{([^}]+)\}\}/g, (match, key: string) => {
      const trimmedKey = key.trim();
      return String(templateVars[trimmedKey as keyof typeof templateVars] || `{{${trimmedKey}}}`);
    });
    
    // Escribir el archivo generado
    await fs.writeFile(filePath, processedContent);
  } catch (error) {
    throw new Error(`Error al generar el controlador: ${error}`);
  }
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Función auxiliar para buscar el directorio raíz del proyecto
function findProjectRoot(startDir: string): string | null {
  let currentDir = startDir;
  
  // Recorrer hasta 10 niveles arriba buscando el package.json
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(currentDir, 'package.json'))) {
      return currentDir;
    }
    
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      return null; // Llegamos a la raíz del sistema sin encontrar package.json
    }
    
    currentDir = parentDir;
  }
  
  return null;
}