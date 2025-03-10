# RapidFAST Framework

[![npm version](https://img.shields.io/npm/v/@angelito-systems/rapidfast.svg)](https://www.npmjs.com/package/@angelito-systems/rapidfast)
[![GitHub Package](https://img.shields.io/badge/GitHub%20Package-1.0.2-blue)](https://github.com/Angelito-Systems/rapidfast/packages)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Un framework moderno para el desarrollo de APIs RESTful con TypeScript y Express, utilizando decoradores similares a NestJS pero más ligeros.

## Instalación

### Opción 1: Desde npm (recomendado)
```bash
npm install @angelito-systems/rapidfast
```

### Opción 2: Desde GitHub Packages
```bash
# Crea o edita tu archivo .npmrc en tu proyecto o global
echo "@angelito-systems:registry=https://npm.pkg.github.com" >> .npmrc

# Instala el paquete
npm install @angelito-systems/rapidfast
```

## Inicio Rápido

### Crear un nuevo proyecto

```bash
npx @angelito-systems/rapidfast new mi-proyecto
cd mi-proyecto
npm run dev
```

### Uso básico

```typescript
import { Controller, Get, Post, AppBootstrap, Module } from '@angelito-systems/rapidfast';

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
npx @angelito-systems/rapidfast new mi-proyecto

# Generar un controlador
npx @angelito-systems/rapidfast g:c usuarios

# Generar un controlador con operaciones CRUD
npx @angelito-systems/rapidfast g:c usuarios --resource

# Generar un módulo
npx @angelito-systems/rapidfast g:m autenticacion
```

## Documentación

Para más información, visita [la documentación completa](https://github.com/Angelito-Systems/rapidfast).

## Licencia

MIT
