import * as path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';

interface GenerateModuleOptions {
  path?: string;
}

/**
 * Genera un nuevo módulo
 */
export async function generateModule(name: string, options: GenerateModuleOptions): Promise<void> {
  try {
    // Convertir el nombre a formato kebab-case para el nombre de archivo
    const kebabCaseName = name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    // Capitalizar el nombre para el nombre de la clase
    const className = kebabCaseName
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('') + 'Module';
    
    // Determinar la ruta donde se generará el módulo
    const basePath = options.path || 'src/modules';
    const modulePath = path.resolve(process.cwd(), basePath, kebabCaseName);
    
    // Verificar si el directorio existe, si no, crearlo
    fs.ensureDirSync(modulePath);
    
    const modulePaths = {
      module: path.join(modulePath, `${kebabCaseName}.module.ts`),
      controller: path.join(modulePath, `${kebabCaseName}.controller.ts`),
      service: path.join(modulePath, `${kebabCaseName}.service.ts`)
    };

    // Verificar si el archivo de módulo ya existe
    if (fs.existsSync(modulePaths.module)) {
      console.log(chalk.yellow(`El módulo ${kebabCaseName}.module.ts ya existe.`));
      return;
    }

    // Generar contenido de los archivos
    const moduleContent = generateModuleContent(className, kebabCaseName);
    const controllerContent = generateModuleControllerContent(className, kebabCaseName);
    const serviceContent = generateServiceContent(className, kebabCaseName);

    // Escribir los archivos
    fs.writeFileSync(modulePaths.module, moduleContent);
    fs.writeFileSync(modulePaths.controller, controllerContent);
    fs.writeFileSync(modulePaths.service, serviceContent);

    console.log(chalk.green(`Módulo ${kebabCaseName} creado exitosamente en ${basePath}/${kebabCaseName}`));
    console.log(`  - ${kebabCaseName}.module.ts`);
    console.log(`  - ${kebabCaseName}.controller.ts`);
    console.log(`  - ${kebabCaseName}.service.ts`);
  } catch (error) {
    console.error(chalk.red('Error al generar el módulo:'), error);
  }
}

/**
 * Genera el contenido para un archivo de módulo
 */
function generateModuleContent(className: string, kebabCaseName: string): string {
  // Extraer el nombre base sin "Module" al final
  const baseName = className.replace('Module', '');
  
  return `import { Module } from "rapidfast";
import { ${baseName}Controller } from "./${kebabCaseName}.controller";
import { ${baseName}Service } from "./${kebabCaseName}.service";

@Module({
  controllers: [${baseName}Controller],
  providers: [${baseName}Service],
})
export class ${className} {}
`;
}

/**
 * Genera el contenido para un controlador de módulo
 */
function generateModuleControllerContent(className: string, kebabCaseName: string): string {
  // Extraer el nombre base sin "Module" al final
  const baseName = className.replace('Module', '');
  
  return `import { Controller, Get, Post, Put, Delete, ApiTags, ApiOperation, Req, Res } from "rapidfast";
import { Request, Response } from "express";
import { ${baseName}Service } from "./${kebabCaseName}.service";

@ApiTags("${baseName}")
@Controller("/${kebabCaseName}")
export class ${baseName}Controller {
  constructor(private readonly ${kebabCaseName.replace(/-([a-z])/g, (match, p1) => p1.toUpperCase())}Service: ${baseName}Service) {}

  @Get()
  @ApiOperation({ summary: "Obtener todos los elementos" })
  async findAll(@Res() res: Response) {
    const result = this.${kebabCaseName.replace(/-([a-z])/g, (match, p1) => p1.toUpperCase())}Service.findAll();
    return res.status(200).json(result);
  }

  @Get("/:id")
  @ApiOperation({ summary: "Obtener un elemento por ID" })
  async findOne(@Req() req: Request, @Res() res: Response) {
    const id = req.params.id;
    const result = this.${kebabCaseName.replace(/-([a-z])/g, (match, p1) => p1.toUpperCase())}Service.findOne(id);
    return res.status(200).json(result);
  }

  @Post()
  @ApiOperation({ summary: "Crear un nuevo elemento" })
  async create(@Req() req: Request, @Res() res: Response) {
    const result = this.${kebabCaseName.replace(/-([a-z])/g, (match, p1) => p1.toUpperCase())}Service.create(req.body);
    return res.status(201).json(result);
  }

  @Put("/:id")
  @ApiOperation({ summary: "Actualizar un elemento" })
  async update(@Req() req: Request, @Res() res: Response) {
    const id = req.params.id;
    const result = this.${kebabCaseName.replace(/-([a-z])/g, (match, p1) => p1.toUpperCase())}Service.update(id, req.body);
    return res.status(200).json(result);
  }

  @Delete("/:id")
  @ApiOperation({ summary: "Eliminar un elemento" })
  async remove(@Req() req: Request, @Res() res: Response) {
    const id = req.params.id;
    const result = this.${kebabCaseName.replace(/-([a-z])/g, (match, p1) => p1.toUpperCase())}Service.remove(id);
    return res.status(200).json(result);
  }
}
`;
}

/**
 * Genera el contenido para un servicio
 */
function generateServiceContent(className: string, kebabCaseName: string): string {
  // Extraer el nombre base sin "Module" al final
  const baseName = className.replace('Module', '');
  
  return `import { Injectable } from "rapidfast";

@Injectable()
export class ${baseName}Service {
  private items: any[] = [];

  findAll() {
    return {
      message: "Esta acción devuelve todos los elementos",
      data: this.items
    };
  }

  findOne(id: string) {
    return {
      message: \`Esta acción devuelve el elemento con id \${id}\`,
      data: this.items.find(item => item.id === id)
    };
  }

  create(data: any) {
    const newItem = {
      id: Date.now().toString(),
      ...data
    };
    this.items.push(newItem);
    return {
      message: "Elemento creado correctamente",
      data: newItem
    };
  }

  update(id: string, data: any) {
    const index = this.items.findIndex(item => item.id === id);
    if (index >= 0) {
      this.items[index] = { ...this.items[index], ...data };
      return {
        message: \`Elemento con id \${id} actualizado correctamente\`,
        data: this.items[index]
      };
    }
    return {
      message: \`Elemento con id \${id} no encontrado\`,
      data: null
    };
  }

  remove(id: string) {
    const index = this.items.findIndex(item => item.id === id);
    if (index >= 0) {
      const deleted = this.items[index];
      this.items.splice(index, 1);
      return {
        message: \`Elemento con id \${id} eliminado correctamente\`,
        data: deleted
      };
    }
    return {
      message: \`Elemento con id \${id} no encontrado\`,
      data: null
    };
  }
}
`;
}
