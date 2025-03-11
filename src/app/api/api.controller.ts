import { Controller } from "../../decorators/controller.decorator";
import { Get } from "../../decorators/http.decorator";
import { ApiOperation, ApiResponse, ApiTags } from "../../decorators/swagger.decorator";

@ApiTags("API")
@Controller("/api")
export class ApiController {
  execute(...args: any[]): any {
    return this.getInfo();
  }

  @Get()
  @ApiOperation({ summary: "Información de la API" })
  @ApiResponse({ status: 200, description: "Retorna información sobre la API" })
  getInfo() {
    return {
      name: "RapidFAST API",
      version: "1.0.0",
      description: "API RESTful construida con RapidFAST Framework"
    };
  }
}
