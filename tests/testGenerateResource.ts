import { generateResource } from '../src/cli/commands/generate';  // Ajusta el path según la ubicación de tu función
import fs from 'fs';
import path from 'path';

async function testGenerateResource() {
    const resourceName = 'TestResource';
    const targetDir = path.join(__dirname, 'test_output', resourceName);

    await generateResource({
        name: resourceName,
        type: 'resource',
        directory: targetDir,
        crud: true,
    });

    // Verifica que los archivos existen
    if (fs.existsSync(path.join(targetDir, `${resourceName}.module.ts`))) {
        console.log('Archivo module.ts generado correctamente');
    }
    if (fs.existsSync(path.join(targetDir, `${resourceName}.controller.ts`))) {
        console.log('Archivo controller.ts generado correctamente');
    }
    if (fs.existsSync(path.join(targetDir, `${resourceName}.service.ts`))) {
        console.log('Archivo service.ts generado correctamente');
    }
}

testGenerateResource();
