import * as fs from 'fs-extra';
import * as path from 'path';

async function copyTemplates() {
  const srcDir = path.join(process.cwd(), 'src', 'templates');
  const distDir = path.join(process.cwd(), 'dist', 'templates');

  try {
    // Limpiar el directorio de destino
    await fs.emptyDir(distDir);

    // Copiar todos los archivos y directorios
    await fs.copy(srcDir, distDir, {
      filter: (src) => {
        // Incluir solo archivos .template y directorios
        return fs.statSync(src).isDirectory() || src.endsWith('.template');
      }
    });

    console.log('✅ Templates copiados correctamente a dist/templates');
  } catch (error) {
    console.error('❌ Error copiando templates:', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  copyTemplates();
}

export default copyTemplates; 