import { Controller, Get, ApiTags, ApiOperation, ApiResponse, Res } from "../decorators";
import { Response } from "express";

@ApiTags("Aplicación")
@Controller()
export class AppController {
  @Get("/up")
  @ApiOperation({ summary: "Test de Funcionamiento" })
  @ApiResponse({
    status: 200,
    description: "Retorna el estado de la aplicación",
    schema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "Aplicación en funcionamiento",
        },
        version: { type: "string", example: "1.0.0" },
        uptime: { type: "number", example: 123456 },
      },
    },
  })
  async getHello(@Res() res: Response) {
    const appVersion = "1.0.0";
    const uptime = process.uptime();

    return res.status(200).json({
      message: "Aplicación en funcionamiento",
      version: appVersion,
      uptime: uptime,
    });
  }
}
