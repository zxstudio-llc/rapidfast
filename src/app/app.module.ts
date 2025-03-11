import { Module } from "../decorators/module.decorator";
import { AppController } from "./app.controller";
import { ApiModule } from "./api/api.module";

/**
 * Módulo principal de la aplicación usado cuando se ejecuta como aplicación independiente
 */
@Module({
  imports: [ApiModule],
  controllers: [AppController],
  providers: []
})
export class AppModule {}
