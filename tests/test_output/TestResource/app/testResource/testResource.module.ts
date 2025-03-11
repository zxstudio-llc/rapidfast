import { Module } from '@angelitosystems/rapidfast';
import { TestResourceController } from './testResource.controller';
import { TestResourceService } from './testResource.service';
// Puedes importar middlewares si es necesario
// import { SomeMiddleware } from './middlewares/some.middleware';

@Module({
  controllers: [TestResourceController],
  providers: [TestResourceService],
  // Puedes agregar middlewares específicos del módulo
  // middlewares: [SomeMiddleware]
})
export class TestResourceModule {}
