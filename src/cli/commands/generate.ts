import * as path from "path";
import * as fs from "fs-extra";
import chalk from "chalk";
import inquirer from "inquirer";
import ora from "ora";
import logSymbols from "log-symbols";

// Tipos de generación
type GenerateType = 'controller' | 'service' | 'middleware' | 'module' | 'resource';

// Opciones para el comando generate
interface GenerateOptions {
  name: string;
  directory?: string;
  type: GenerateType;
  crud?: boolean;
}

// Función principal para generar recursos
export async function generateResource(options: GenerateOptions): Promise<void> {
  try {
    const { name, type, directory, crud } = options;
    
    // Normalizar el nombre para ser PascalCase y lowerCamelCase
    const pascalName = toPascalCase(name);
    const camelName = toCamelCase(name);
    
    // Determinar directorio base y crear si no existe
    const baseDir = directory || process.cwd();
    
    // Determinar subdirectorio según el tipo de recurso
    let subDir = "";
    
    switch(type) {
      case 'controller':
        subDir = path.join(baseDir, 'controllers');
        break;
      case 'service':
        subDir = path.join(baseDir, 'services');
        break;
      case 'middleware':
        subDir = path.join(baseDir, 'middlewares');
        break;
      case 'module':
      case 'resource':
        // Para módulos y recursos, creamos un directorio con el nombre
        subDir = path.join(baseDir, camelName);
        break;
    }
    
    await fs.ensureDir(subDir);
    
    // Generar archivos según el tipo
    const spinner = ora(`Generando ${type} ${chalk.cyan(pascalName)}...`).start();
    
    try {
      if (type === 'resource') {
        // Generar un recurso completo (módulo + controlador + servicio)
        await generateModule({ name, directory: subDir });
        await generateController({ name, directory: subDir, crud });
        await generateService({ name, directory: subDir });
        
        spinner.succeed(chalk.green(`Recurso ${pascalName} generado con éxito`));
        
        console.log(chalk.gray('Archivos generados:'));
        console.log(chalk.cyan(`  - ${path.join(subDir, `${camelName}.module.ts`)}`));
        console.log(chalk.cyan(`  - ${path.join(subDir, `${camelName}.controller.ts`)}`));
        console.log(chalk.cyan(`  - ${path.join(subDir, `${camelName}.service.ts`)}`));
      } else {
        // Generar el recurso individual
        switch(type) {
          case 'controller':
            await generateController({ name, directory: subDir, crud });
            break;
          case 'service':
            await generateService({ name, directory: subDir });
            break;
          case 'middleware':
            await generateMiddleware({ name, directory: subDir });
            break;
          case 'module':
            await generateModule({ name, directory: subDir });
            break;
        }
        
        spinner.succeed(chalk.green(`${pascalName}${capitalize(type)} generado con éxito`));
        
        // Mostrar ruta del archivo generado
        console.log(chalk.gray('Archivo generado:'));
        console.log(chalk.cyan(`  - ${path.join(subDir, `${camelName}.${type}.ts`)}`));
      }
      
      // Sugerir próximos pasos
      console.log('\n' + chalk.bold('Próximos pasos:'));
      
      if (type === 'controller' || type === 'resource') {
        console.log(chalk.yellow(`  1. Asegúrate de importar ${pascalName}Controller en tu módulo`));
        console.log(chalk.yellow(`     import { ${pascalName}Controller } from './${camelName}.controller';`));
      }
      
      if (type === 'service' || type === 'resource') {
        console.log(chalk.yellow(`  2. Inyecta ${pascalName}Service en los controladores que lo necesiten`));
        console.log(chalk.yellow(`     constructor(private ${camelName}Service: ${pascalName}Service) {}`));
      }
      
      if (type === 'middleware') {
        console.log(chalk.yellow(`  3. Usa el middleware en tu controlador o a nivel global:`));
        console.log(chalk.yellow(`     @UseMiddlewares(${pascalName}Middleware)`));
        console.log(chalk.yellow(`     // O a nivel de método específico`));
      }
    } catch (error) {
      spinner.fail(chalk.red(`Error al generar ${type}`));
      console.error(error);
    }
  } catch (error) {
    console.error(chalk.red('Error al generar recurso:'), error);
  }
}

// Funciones auxiliares para generar cada tipo de recurso
async function generateController({ name, directory, crud = false }: { name: string, directory: string, crud?: boolean }): Promise<void> {
  const pascalName = toPascalCase(name);
  const camelName = toCamelCase(name);
  const fileName = `${camelName}.controller.ts`;
  const filePath = path.join(directory, fileName);
  
  // Generar contenido según si es CRUD o no
  const content = crud 
    ? generateCrudControllerTemplate(pascalName, camelName)
    : generateBasicControllerTemplate(pascalName, camelName);
  
  await fs.writeFile(filePath, content);
}

async function generateService({ name, directory }: { name: string, directory: string }): Promise<void> {
  const pascalName = toPascalCase(name);
  const camelName = toCamelCase(name);
  const fileName = `${camelName}.service.ts`;
  const filePath = path.join(directory, fileName);
  
  const content = generateServiceTemplate(pascalName, camelName);
  
  await fs.writeFile(filePath, content);
}

async function generateMiddleware({ name, directory }: { name: string, directory: string }): Promise<void> {
  const pascalName = toPascalCase(name);
  const camelName = toCamelCase(name);
  const fileName = `${camelName}.middleware.ts`;
  const filePath = path.join(directory, fileName);
  
  const content = generateMiddlewareTemplate(pascalName);
  
  await fs.writeFile(filePath, content);
}

async function generateModule({ name, directory }: { name: string, directory: string }): Promise<void> {
  const pascalName = toPascalCase(name);
  const camelName = toCamelCase(name);
  const fileName = `${camelName}.module.ts`;
  const filePath = path.join(directory, fileName);
  
  const content = generateModuleTemplate(pascalName, camelName);
  
  await fs.writeFile(filePath, content);
}

// Plantillas para cada tipo de recurso
function generateBasicControllerTemplate(className: string, variableName: string): string {
  return `import { Controller, Get, Post, Put, Delete, Req, Res } from '@angelitosystems/rapidfast';
import { Request, Response } from 'express';

@Controller('/${variableName}s')
export class ${className}Controller {
  @Get()
  async findAll(@Res() res: Response) {
    return res.json({ message: 'Obtener todos los ${variableName}s' });
  }

  @Get('/:id')
  async findOne(@Req() req: Request, @Res() res: Response) {
    const { id } = req.params;
    return res.json({ message: \`Obtener ${variableName} con ID: \${id}\` });
  }

  @Post()
  async create(@Req() req: Request, @Res() res: Response) {
    return res.status(201).json({ message: 'Crear nuevo ${variableName}', data: req.body });
  }

  @Put('/:id')
  async update(@Req() req: Request, @Res() res: Response) {
    const { id } = req.params;
    return res.json({ message: \`Actualizar ${variableName} con ID: \${id}\`, data: req.body });
  }

  @Delete('/:id')
  async remove(@Req() req: Request, @Res() res: Response) {
    const { id } = req.params;
    return res.json({ message: \`Eliminar ${variableName} con ID: \${id}\` });
  }
}
`;
}

function generateCrudControllerTemplate(className: string, variableName: string): string {
  return `import { Controller, Get, Post, Put, Delete, Req, Res } from '@angelitosystems/rapidfast';
import { Request, Response } from 'express';
import { ${className}Service } from './${variableName}.service';

@Controller('/${variableName}s')
export class ${className}Controller {
  constructor(private ${variableName}Service: ${className}Service) {}

  @Get()
  async findAll(@Res() res: Response) {
    const items = await this.${variableName}Service.findAll();
    return res.json(items);
  }

  @Get('/:id')
  async findOne(@Req() req: Request, @Res() res: Response) {
    const { id } = req.params;
    const item = await this.${variableName}Service.findOne(id);
    
    if (!item) {
      return res.status(404).json({ message: '${className} no encontrado' });
    }
    
    return res.json(item);
  }

  @Post()
  async create(@Req() req: Request, @Res() res: Response) {
    const newItem = await this.${variableName}Service.create(req.body);
    return res.status(201).json(newItem);
  }

  @Put('/:id')
  async update(@Req() req: Request, @Res() res: Response) {
    const { id } = req.params;
    const updatedItem = await this.${variableName}Service.update(id, req.body);
    
    if (!updatedItem) {
      return res.status(404).json({ message: '${className} no encontrado' });
    }
    
    return res.json(updatedItem);
  }

  @Delete('/:id')
  async remove(@Req() req: Request, @Res() res: Response) {
    const { id } = req.params;
    const deleted = await this.${variableName}Service.delete(id);
    
    if (!deleted) {
      return res.status(404).json({ message: '${className} no encontrado' });
    }
    
    return res.status(204).send();
  }
}
`;
}

function generateServiceTemplate(className: string, variableName: string): string {
  return `import { Injectable } from '@angelitosystems/rapidfast';

@Injectable()
export class ${className}Service {
  private items: any[] = [];
  private idCounter = 1;

  async findAll() {
    return this.items;
  }

  async findOne(id: string) {
    const numericId = Number(id);
    return this.items.find(item => item.id === numericId);
  }

  async create(data: any) {
    const newItem = { id: this.idCounter++, ...data };
    this.items.push(newItem);
    return newItem;
  }

  async update(id: string, data: any) {
    const numericId = Number(id);
    const index = this.items.findIndex(item => item.id === numericId);
    
    if (index === -1) {
      return null;
    }
    
    const updatedItem = { ...this.items[index], ...data };
    this.items[index] = updatedItem;
    return updatedItem;
  }

  async delete(id: string) {
    const numericId = Number(id);
    const index = this.items.findIndex(item => item.id === numericId);
    
    if (index === -1) {
      return false;
    }
    
    this.items.splice(index, 1);
    return true;
  }
}
`;
}

function generateMiddlewareTemplate(className: string): string {
  return `import { Middleware } from '@angelitosystems/rapidfast';
import { Request, Response, NextFunction } from 'express';

@Middleware()
export class ${className}Middleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log(\`[${className}Middleware] \${req.method} \${req.url}\`);
    // Agrega tu lógica de middleware aquí
    
    next();
  }
}
`;
}

function generateModuleTemplate(className: string, variableName: string): string {
  return `import { Module } from '@angelitosystems/rapidfast';
import { ${className}Controller } from './${variableName}.controller';
import { ${className}Service } from './${variableName}.service';
// Puedes importar middlewares si es necesario
// import { SomeMiddleware } from './middlewares/some.middleware';

@Module({
  controllers: [${className}Controller],
  providers: [${className}Service],
  // Puedes agregar middlewares específicos del módulo
  // middlewares: [SomeMiddleware]
})
export class ${className}Module {}
`;
}

// Funciones utilitarias
function toCamelCase(str: string): string {
  return str
    .replace(/[-_\s.]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^[A-Z]/, c => c.toLowerCase());
}

function toPascalCase(str: string): string {
  const camel = toCamelCase(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
