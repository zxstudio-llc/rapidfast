import { Module } from "../../decorators";
import { ApiController } from "./api.controller";

@Module({
  controllers: [ApiController],
})
export class ApiModule {}
