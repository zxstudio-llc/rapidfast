import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { Template, TemplateAction, TemplateType } from '../../types/template';

const TEMPLATES_DIR = path.join(__dirname, '../../../templates');

export class TemplateManager {
  private static instance: TemplateManager;
  private templatesCache: Map<string, Template> = new Map();

  private constructor() {
    this.ensureTemplatesDirExists();
    this.loadTemplates();
  }

  static getInstance(): TemplateManager {
    if (!TemplateManager.instance) {
      TemplateManager.instance = new TemplateManager();
    }
    return TemplateManager.instance;
  }

  private ensureTemplatesDirExists(): void {
    if (!fs.existsSync(TEMPLATES_DIR)) {
      fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
    }
  }

  private loadTemplates(): void {
    const templateFiles = fs.readdirSync(TEMPLATES_DIR)
      .filter(file => file.endsWith('.json'));

    for (const file of templateFiles) {
      const template = fs.readJsonSync(path.join(TEMPLATES_DIR, file)) as Template;
      this.templatesCache.set(template.name, template);
    }
  }

  async listTemplates(type?: TemplateType): Promise<Template[]> {
    const templates = Array.from(this.templatesCache.values());
    return type ? templates.filter(t => t.type === type) : templates;
  }

  async viewTemplate(name: string): Promise<Template | null> {
    return this.templatesCache.get(name) || null;
  }

  async createTemplate(template: Partial<Template>): Promise<Template> {
    if (!template.name || !template.type || !template.content) {
      throw new Error('Nombre, tipo y contenido son requeridos');
    }

    const newTemplate: Template = {
      ...template,
      metadata: {
        ...template.metadata,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    } as Template;

    const filename = `${template.name}.json`;
    await fs.writeJson(
      path.join(TEMPLATES_DIR, filename),
      newTemplate,
      { spaces: 2 }
    );

    this.templatesCache.set(template.name, newTemplate);
    return newTemplate;
  }

  async editTemplate(name: string, updates: Partial<Template>): Promise<Template> {
    const template = await this.viewTemplate(name);
    if (!template) {
      throw new Error(`Template ${name} no encontrado`);
    }

    const updatedTemplate: Template = {
      ...template,
      ...updates,
      metadata: {
        ...template.metadata,
        ...updates.metadata,
        updatedAt: new Date()
      }
    };

    await fs.writeJson(
      path.join(TEMPLATES_DIR, `${name}.json`),
      updatedTemplate,
      { spaces: 2 }
    );

    this.templatesCache.set(name, updatedTemplate);
    return updatedTemplate;
  }

  async deleteTemplate(name: string): Promise<void> {
    const template = await this.viewTemplate(name);
    if (!template) {
      throw new Error(`Template ${name} no encontrado`);
    }

    await fs.remove(path.join(TEMPLATES_DIR, `${name}.json`));
    this.templatesCache.delete(name);
  }
}

export async function manageTemplates(action: TemplateAction): Promise<void> {
  const manager = TemplateManager.getInstance();

  try {
    switch (action.action) {
      case 'list':
        const templates = await manager.listTemplates(action.type);
        console.log(chalk.cyan('\nTemplates disponibles:'));
        templates.forEach(t => {
          console.log(chalk.green(`\n${t.name} (${t.type})`));
          console.log(chalk.gray(`Descripción: ${t.metadata.description || 'N/A'}`));
          console.log(chalk.gray(`Autor: ${t.metadata.author || 'N/A'}`));
          console.log(chalk.gray(`Versión: ${t.metadata.version || '1.0.0'}`));
        });
        break;

      case 'view':
        if (!action.name) {
          throw new Error('Se requiere el nombre del template');
        }
        const template = await manager.viewTemplate(action.name);
        if (template) {
          console.log(chalk.cyan('\nDetalles del template:'));
          console.log(JSON.stringify(template, null, 2));
        } else {
          console.log(chalk.red(`Template ${action.name} no encontrado`));
        }
        break;

      case 'create':
        if (!action.type || !action.name) {
          throw new Error('Se requiere tipo y nombre para crear un template');
        }
        
        const { content, description, author } = await inquirer.prompt([
          {
            type: 'editor',
            name: 'content',
            message: 'Contenido del template:',
          },
          {
            type: 'input',
            name: 'description',
            message: 'Descripción del template:',
          },
          {
            type: 'input',
            name: 'author',
            message: 'Autor del template:',
          }
        ]);

        const newTemplate = await manager.createTemplate({
          name: action.name,
          type: action.type,
          content,
          metadata: {
            description,
            author,
            version: '1.0.0',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });

        console.log(chalk.green('\nTemplate creado exitosamente:'));
        console.log(JSON.stringify(newTemplate, null, 2));
        break;

      case 'edit':
        if (!action.name) {
          throw new Error('Se requiere el nombre del template');
        }

        const existingTemplate = await manager.viewTemplate(action.name);
        if (!existingTemplate) {
          throw new Error(`Template ${action.name} no encontrado`);
        }

        const updates = await inquirer.prompt([
          {
            type: 'editor',
            name: 'content',
            message: 'Contenido del template:',
            default: existingTemplate.content
          },
          {
            type: 'input',
            name: 'description',
            message: 'Descripción del template:',
            default: existingTemplate.metadata.description
          }
        ]);

        const updatedTemplate = await manager.editTemplate(action.name, {
          content: updates.content,
          metadata: {
            ...existingTemplate.metadata,
            description: updates.description
          }
        });

        console.log(chalk.green('\nTemplate actualizado exitosamente:'));
        console.log(JSON.stringify(updatedTemplate, null, 2));
        break;

      case 'delete':
        if (!action.name) {
          throw new Error('Se requiere el nombre del template');
        }

        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: `¿Está seguro de eliminar el template ${action.name}?`,
            default: false
          }
        ]);

        if (confirm) {
          await manager.deleteTemplate(action.name);
          console.log(chalk.green(`\nTemplate ${action.name} eliminado exitosamente`));
        }
        break;

      default:
        throw new Error(`Acción ${action.action} no soportada`);
    }
  } catch (error) {
    console.error(chalk.red('Error al gestionar templates:'), error);
    process.exit(1);
  }
}
