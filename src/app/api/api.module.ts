import { Module } from "@angelitosystems/rapidfast";
import { ApiController } from "./api.controller";

@Module({
  controllers: [ApiController],
})
export class ApiModule {}
