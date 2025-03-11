import { Module } from "../../decorators/module.decorator";
import { ApiController } from "./api.controller";

@Module({
  controllers: [ApiController],
  providers: []
})
export class ApiModule {}
