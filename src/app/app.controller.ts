import { Response } from "express";
import { ApiOperation, ApiResponse, ApiTags } from "../decorators/swagger.decorator";
import { Controller } from "../decorators/controller.decorator";
import { Get } from "../decorators/http.decorator";
import { Res } from "../decorators/param.decorator";
import { environment } from "../config/environment";
import { db } from "../config/database";

@ApiTags("App")
@Controller()
export class AppController {
  execute(res: Response): any {
    return this.test(res);
  }

  @Get()
  @ApiOperation({ summary: "Endpoint de prueba" })
  @ApiResponse({ status: 200, description: "Retorna un mensaje de prueba" })
  test(@Res() res: Response) {
    return res.json({ message: "¡Hola desde RapidFAST!" });
  }
  
  @Get("/")
  @ApiOperation({ summary: "Página de inicio" })
  home() {
    return {
      message: "RapidFAST Framework",
      description: "Framework para aplicaciones de streaming basado en Express y TypeScript",
      endpoints: {
        health: "/up",
        api: "/api/test"
      }
    };
  }
  
  @Get("/up")
  @ApiOperation({ summary: "Verificación de estado" })
  healthCheck() {
    return { 
      status: "ok", 
      message: "RapidFAST Framework funcionando correctamente",
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };
  }

  @Get("/env")
  @ApiOperation({ summary: "Información de entorno" })
  @ApiResponse({
    status: 200,
    description: "Retorna información sobre el entorno de ejecución"
  })
  async getEnv(@Res() res: Response) {
    return res.status(200).json({
      nodeEnv: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    });
  }

  @Get("/db-status")
  @ApiOperation({ summary: "Estado de la base de datos" })
  @ApiResponse({
    status: 200,
    description: "Retorna el estado de conexión con la base de datos",
  })
  async getDbStatus(@Res() res: Response) {
    const isConnected = db.isConnected();

    return res.status(200).json({
      database: {
        connected: isConnected,
        name: environment.mongodb.database,
        uri: environment.mongodb.uri.replace(/\/\/(.+)@/, "//***:***@"), // Ocultar credenciales
      },
    });
  }
}
