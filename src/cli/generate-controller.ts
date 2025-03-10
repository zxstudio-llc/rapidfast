import * as path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';

interface GenerateControllerOptions {
  path?: string;
  resource?: boolean;
}

/**
 * Genera un nuevo controlador
 */
export async function generateController(name: string, options: GenerateControllerOptions): Promise<void> {
  try {
    // Convertir el nombre a formato kebab-case para el nombre de archivo
    const kebabCaseName = name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    // Capitalizar el nombre para el nombre de la clase
    const className = kebabCaseName
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('') + 'Controller';

    // Determinar la ruta donde se generará el controlador
    const basePath = options.path || 'src/controllers';
    const fullPath = path.resolve(process.cwd(), basePath);
    
    // Verificar si el directorio existe, si no, crearlo
    fs.ensureDirSync(fullPath);
    
    const filePath = path.join(fullPath, `${kebabCaseName}.controller.ts`);

    // Verificar si el archivo ya existe
    if (fs.existsSync(filePath)) {
      console.log(chalk.yellow(`El controlador ${kebabCaseName}.controller.ts ya existe.`));
      return;
    }

    let controllerContent;

    if (options.resource) {
      // Generar controlador tipo recurso (CRUD)
      controllerContent = generateResourceControllerContent(className, kebabCaseName);
    } else {
      // Generar controlador básico
      controllerContent = generateBasicControllerContent(className, kebabCaseName);
    }

    // Escribir el archivo del controlador
    fs.writeFileSync(filePath, controllerContent);

    console.log(chalk.green(`Controlador ${kebabCaseName}.controller.ts creado exitosamente en ${basePath}`));
  } catch (error) {
    console.error(chalk.red('Error al generar el controlador:'), error);
  }
}

/**
 * Genera el contenido para un controlador básico
 */
function generateBasicControllerContent(className: string, kebabCaseName: string): string {
  return `import { Controller, Get, Post, ApiTags, ApiOperation, Req, Res } from "rapidfast";
import { Request, Response } from "express";

@ApiTags("${className.replace('Controller', '')}")
@Controller("/${kebabCaseName}")
export class ${className} {
  @Get()
  @ApiOperation({ summary: "Obtener todos los elementos" })
  async findAll(@Res() res: Response) {
    return res.status(200).json({
      message: "Esta ruta devuelve todos los elementos"
    });
  }

  @Get("/:id")
  @ApiOperation({ summary: "Obtener un elemento por ID" })
  async findOne(@Req() req: Request, @Res() res: Response) {
    const id = req.params.id;
    return res.status(200).json({
      message: \`Esta ruta devuelve el elemento con ID: \${id}\`
    });
  }

  @Post()
  @ApiOperation({ summary: "Crear un nuevo elemento" })
  async create(@Req() req: Request, @Res() res: Response) {
    const body = req.body;
    return res.status(201).json({
      message: "Elemento creado exitosamente",
      data: body
    });
  }
}
`;
}

/**
 * Genera el contenido para un controlador de tipo recurso (CRUD)
 */
function generateResourceControllerContent(className: string, kebabCaseName: string): string {
  return `import { Controller, Get, Post, Put, Delete, ApiTags, ApiOperation, Req, Res } from "rapidfast";
import { Request, Response } from "express";

@ApiTags("${className.replace('Controller', '')}")
@Controller("/${kebabCaseName}")
export class ${className} {
  @Get()
  @ApiOperation({ summary: "Obtener todos los elementos" })
  async findAll(@Res() res: Response) {
    return res.status(200).json({
      message: "Esta ruta devuelve todos los elementos"
    });
  }

  @Get("/:id")
  @ApiOperation({ summary: "Obtener un elemento por ID" })
  async findOne(@Req() req: Request, @Res() res: Response) {
    const id = req.params.id;
    return res.status(200).json({
      message: \`Esta ruta devuelve el elemento con ID: \${id}\`
    });
  }

  @Post()
  @ApiOperation({ summary: "Crear un nuevo elemento" })
  async create(@Req() req: Request, @Res() res: Response) {
    const body = req.body;
    return res.status(201).json({
      message: "Elemento creado exitosamente",
      data: body
    });
  }

  @Put("/:id")
  @ApiOperation({ summary: "Actualizar un elemento por ID" })
  async update(@Req() req: Request, @Res() res: Response) {
    const id = req.params.id;
    const body = req.body;
    return res.status(200).json({
      message: \`Elemento con ID: \${id} actualizado exitosamente\`,
      data: body
    });
  }

  @Delete("/:id")
  @ApiOperation({ summary: "Eliminar un elemento por ID" })
  async remove(@Req() req: Request, @Res() res: Response) {
    const id = req.params.id;
    return res.status(200).json({
      message: \`Elemento con ID: \${id} eliminado exitosamente\`
    });
  }
}
`;
}
