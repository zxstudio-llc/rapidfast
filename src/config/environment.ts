import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Determinar la ubicación del archivo .env (directorio raíz del proyecto)
const envPath = path.resolve(process.cwd(), '.env');

// Cargar variables de entorno desde .env si existe
if (fs.existsSync(envPath)) {
  console.log(`📄 Cargando variables de entorno desde ${envPath}`);
  dotenv.config({ path: envPath });
} else {
  console.warn('⚠️ No se encontró archivo .env, usando variables de entorno del sistema');
  dotenv.config();
}

// Interfaces para tipar las configuraciones
interface MongoDBConfig {
  uri: string;
  user: string;
  password: string;
  database: string;
  [key: string]: any; // Para otras configuraciones de MongoDB que puedan agregarse
}

interface AppConfig {
  name: string;
  version: string;
  nodeEnv: string;
  isProduction: boolean;
  isDevelopment: boolean;
  [key: string]: any; // Para otras configuraciones de la aplicación
}

interface Config {
  port: number;
  mongodb: MongoDBConfig;
  app: AppConfig;
  // Se agregarán dinámicamente otras propiedades
  [key: string]: any;
}

/**
 * Obtiene un valor de variable de entorno con conversión de tipo
 * @param key Nombre de la variable de entorno
 * @param defaultValue Valor por defecto si no existe
 * @param transform Función opcional para transformar el valor
 * @returns El valor de la variable de entorno o el valor por defecto
 */
function getEnv<T>(
  key: string,
  defaultValue: T,
  transform?: (value: string) => T
): T {
  const value = process.env[key];
  if (value === undefined) {
    return defaultValue;
  }
  
  if (transform) {
    return transform(value);
  }
  
  // Intentar convertir el tipo automáticamente según el tipo del valor por defecto
  if (typeof defaultValue === 'number') {
    return Number(value) as unknown as T;
  }
  if (typeof defaultValue === 'boolean') {
    return (value.toLowerCase() === 'true') as unknown as T;
  }
  return value as unknown as T;
}

/**
 * Valida si una variable de entorno requerida existe
 * @param key Nombre de la variable de entorno
 * @param errorMessage Mensaje de error opcional
 * @throws Error si la variable no existe
 */
function requireEnv(key: string, errorMessage?: string): string {
  const value = process.env[key];
  if (value === undefined) {
    throw new Error(
      errorMessage || `Variable de entorno requerida "${key}" no está definida`
    );
  }
  return value;
}

// Obtener el entorno actual como string genérica, no como literal
const nodeEnv: string = getEnv('NODE_ENV', 'development');

// Crear la configuración base con valores por defecto
const config: Config = {
  port: getEnv('PORT', 3000, Number),
  
  mongodb: {
    uri: getEnv('MONGODB_URI', 'mongodb://localhost:27017/rapidfast'),
    user: getEnv('MONGODB_USER', ''),
    password: getEnv('MONGODB_PASSWORD', ''),
    database: getEnv('MONGODB_DATABASE', 'rapidfast'),
  },
  
  app: {
    name: getEnv('APP_NAME', 'RapidFAST'),
    version: getEnv('APP_VERSION', '1.0.0'),
    nodeEnv: nodeEnv,
    // Usar el operador de igualdad para comparar el contenido, no los tipos
    isProduction: nodeEnv === 'production',
    isDevelopment: nodeEnv === 'development',
  }
};

// Agregar normalización de nombres de propiedades para MongoDB
Object.keys(process.env).forEach(key => {
  // Variables de MongoDB
  if (key.startsWith('MONGODB_')) {
    const mongoKey = key.replace('MONGODB_', '').toLowerCase();
    
    // Normalizar nombres de propiedades comunes
    const normalizedKey = mongoKey === 'maxpoolsize' ? 'maxPoolSize' : 
                          mongoKey === 'retrywrites' ? 'retryWrites' : 
                          mongoKey;
                          
    // Convertir valores a tipos adecuados
    const value = process.env[key] as string;
    if (/^\d+$/.test(value)) {
      config.mongodb[normalizedKey] = parseInt(value, 10);
    } else if (value === 'true' || value === 'false') {
      config.mongodb[normalizedKey] = value === 'true';
    } else {
      config.mongodb[normalizedKey] = value;
    }
  }
  
  // Variables de la aplicación
  else if (key.startsWith('APP_') && !key.match(/^APP_(NAME|VERSION)$/)) {
    const appKey = key.replace('APP_', '').toLowerCase();
    config.app[appKey] = process.env[key] as string;
  }
  
  // Otras variables con prefijos comunes
  else if (key.match(/^(API_|AUTH_|EMAIL_|SMS_|STORAGE_|CACHE_)/)) {
    // Dividir por el primer guion bajo para crear categorías
    const [category, ...rest] = key.split('_');
    const categoryKey = category.toLowerCase();
    
    // Inicializar la categoría si no existe
    if (!config[categoryKey]) {
      config[categoryKey] = {};
    }
    
    // Convertir el resto de la clave a minúsculas y usarla como propiedad
    const propKey = rest.join('_').toLowerCase();
    config[categoryKey][propKey] = process.env[key] as string;
  }
});

// Exportar la configuración
export const environment = config;

// Exportar funciones útiles
export { getEnv, requireEnv };
