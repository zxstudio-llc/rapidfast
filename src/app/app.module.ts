import { Module } from "@angelitosystems/rapidfast";
import { AppController } from "./app.controller";
import { ApiModule } from "./api/api.module";
import { TestResourceModule } from './../../tests/test_output/TestResource/app/testResource/testResource.module';

/**
 * Módulo principal de la aplicación usado cuando se ejecuta como aplicación independiente
 */
@Module({
  controllers: [AppController],
  imports: [ApiModule,
    TestResourceModule],
})
export class AppModule {}
