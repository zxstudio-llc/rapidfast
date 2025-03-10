import { ApiOperation, ApiTags, Controller, Get } from "../../decorators";

@ApiTags("API")
@Controller("/api")
export class ApiController {
  @Get("/test")
  @ApiOperation({ summary: "Endpoint de prueba" })
  test() {
    return { message: "API funcionando correctamente", timestamp: new Date().toISOString() };
  }
}
