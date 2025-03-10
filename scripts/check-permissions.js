#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

function checkPermissions() {
  const isWindows = os.platform() === 'win32';
  const nodeModulesPath = path.join(process.cwd(), 'node_modules');
  
  try {
    // Verificar si podemos escribir en node_modules
    const testFile = path.join(nodeModulesPath, '.permission-test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    console.log('✅ Permisos de escritura verificados correctamente');
  } catch (error) {
    console.warn('\n⚠️  Advertencia: Posibles problemas de permisos detectados');
    console.warn('Este paquete podría necesitar permisos elevados para algunas operaciones.');
    
    if (isWindows) {
      console.warn('\nSugerencia: Para usuarios de Windows, ejecute los comandos como administrador');
      console.warn('Haga clic derecho en la terminal y seleccione "Ejecutar como administrador"\n');
    } else {
      console.warn('\nSugerencia: Para usuarios de Linux/macOS, use sudo:');
      console.warn('sudo npm install -g rapidfast\n');
    }
  }
}

// Solo ejecutar en instalación global
if (process.env.npm_config_global) {
  checkPermissions();
}
