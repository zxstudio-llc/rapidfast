import * as fs from 'fs-extra';
import * as path from 'path';

class TemplateManager {
  private templatesDir: string;

  constructor() {
    // En desarrollo, usar el directorio src/templates
    // En producción, usar el directorio dist/templates
    this.templatesDir = process.env.NODE_ENV === 'development'
      ? path.join(__dirname)
      : path.join(__dirname, '..', 'templates');

    // Asegurarse de que el directorio existe
    fs.ensureDirSync(this.templatesDir);
  }

  /**
   * Carga el contenido de una plantilla
   */
  loadTemplate(templatePath: string): string {
    templatePath = templatePath.replace(/\\/g, '/');
    const possiblePaths = [
      path.join(this.templatesDir, templatePath),
      path.join(this.templatesDir, `${templatePath}.template`),
      path.join(this.templatesDir, templatePath.split('/').slice(0, -1).join('/'), 'default.template'),
      path.join(this.templatesDir, 'default', 'default.template')
    ];

    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'utf-8');
      }
    }

    throw new Error(`No se pudo encontrar la plantilla: ${templatePath}. Rutas intentadas: ${possiblePaths.join(', ')}`);
  }

  /**
   * Obtiene la ruta completa de una plantilla
   */
  getTemplatePath(templatePath: string): string {
    templatePath = templatePath.replace(/\\/g, '/');
    const possiblePaths = [
      path.join(this.templatesDir, templatePath),
      path.join(this.templatesDir, `${templatePath}.template`),
      path.join(this.templatesDir, templatePath.split('/').slice(0, -1).join('/'), 'default.template'),
      path.join(this.templatesDir, 'default', 'default.template')
    ];

    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        return filePath;
      }
    }

    throw new Error(`No se pudo encontrar la plantilla: ${templatePath}. Rutas intentadas: ${possiblePaths.join(', ')}`);
  }

  /**
   * Verifica si una plantilla existe
   */
  templateExists(templatePath: string): boolean {
    templatePath = templatePath.replace(/\\/g, '/');
    const possiblePaths = [
      path.join(this.templatesDir, templatePath),
      path.join(this.templatesDir, `${templatePath}.template`),
      path.join(this.templatesDir, templatePath.split('/').slice(0, -1).join('/'), 'default.template'),
      path.join(this.templatesDir, 'default', 'default.template')
    ];

    return possiblePaths.some(filePath => fs.existsSync(filePath));
  }

  /**
   * Copia una plantilla a un destino
   */
  copyTemplate(templatePath: string, destination: string, variables: Record<string, any> = {}): void {
    const content = this.loadTemplate(templatePath);
    const processedContent = this.processTemplate(content, variables);
    fs.ensureFileSync(destination);
    fs.writeFileSync(destination, processedContent);
  }

  /**
   * Procesa una plantilla reemplazando variables
   */
  private processTemplate(content: string, variables: Record<string, any>): string {
    return content.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
      const trimmedKey = key.trim();
      return variables[trimmedKey] !== undefined ? variables[trimmedKey] : `{{${trimmedKey}}}`;
    });
  }
}

export const templateManager = new TemplateManager();
