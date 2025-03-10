# RapidFAST Framework

[![npm version](https://img.shields.io/npm/v/@angelitosystems/rapidfast.svg)](https://www.npmjs.com/package/@angelitosystems/rapidfast)
[![GitHub Package](https://img.shields.io/badge/GitHub%20Package-1.0.2-blue)](https://github.com/Angelito-Systems/rapidfast/packages)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Un framework moderno para el desarrollo de APIs RESTful con TypeScript y Express, utilizando decoradores similares a NestJS pero más ligeros.

## Instalación

### Opción 1: Desde npm (recomendado)
```bash
npm install @angelitosystems/rapidfast
```

# Instala el paquete
npm install @angelitosystems/rapidfast
```

## Inicio Rápido

### Crear un nuevo proyecto

```bash
npx @angelitosystems/rapidfast new mi-proyecto
cd mi-proyecto
npm run dev
```

### Uso básico

```typescript
import { Controller, Get, Post, AppBootstrap, Module } from '@angelitosystems/rapidfast';

@Controller('/api')
class ApiController {
  @Get('/hello')
  hello() {
    return { message: 'Hello World!' };
  }
}

@Module({
  controllers: [ApiController]
})
class AppModule {}

AppBootstrap.bootstrap(AppModule);
```

## Características

- ✅ Decoradores para definir controladores, rutas, y parámetros
- ✅ Integración modular con sistema de módulos
- ✅ Soporte para MongoDB integrado
- ✅ CLI para generar componentes
- ✅ Configuración simplificada

## CLI

RapidFAST incluye un CLI para facilitar la creación de proyectos y componentes:

```bash
# Crear un nuevo proyecto
rapidfast new mi-proyecto

# Generar un controlador
rapidfast g:c usuarios

# Generar un controlador con operaciones CRUD
rapidfast g:c usuarios --resource

# Generar un módulo
rapidfast g:m autenticacion
```

## Documentación

Para más información, visita [la documentación completa](https://github.com/Angelito-Systems/rapidfast).

## Licencia

MIT
