import { Controller, Get, ApiTags, ApiOperation } from "../decorators";

@ApiTags("API")
@Controller("/api")
export class TestController {
  @Get("/test")
  @ApiOperation({ summary: "Prueba básica de API" })
  test() {
    return { message: "API funcionando correctamente" };
  }
}
