import { Schema } from './schema';
import { Connection } from './connection';
import { Query } from './query';

export interface ModelOptions {
  connection?: string;
  tableName?: string;
  timestamps?: boolean;
}

export class Model {
  id?: string | number;
  createdAt?: Date;
  updatedAt?: Date;

  static schema: Schema;
  static modelName: string;
  static connection: Connection;

  constructor(data: Partial<Model> = {}) {
    Object.assign(this, data);
  }

  static async find(conditions: any = {}): Promise<Model[]> {
    const query = new Query(this);
    return query.find(conditions);
  }

  static async findOne(conditions: any = {}): Promise<Model | null> {
    const query = new Query(this);
    return query.findOne(conditions);
  }

  static async findById(id: string | number): Promise<Model | null> {
    const query = new Query(this);
    return query.findById(id);
  }

  static async create(data: Partial<Model>): Promise<Model> {
    const instance = new this(data);
    await instance.validate();
    const result = await instance.save();
    return result;
  }

  static async updateOne(conditions: any, data: Partial<Model>): Promise<boolean> {
    const query = new Query(this);
    return query.updateOne(conditions, data);
  }

  static async updateById(id: string | number, data: Partial<Model>): Promise<boolean> {
    const query = new Query(this);
    return query.updateById(id, data);
  }

  static async deleteOne(conditions: any): Promise<boolean> {
    const query = new Query(this);
    return query.deleteOne(conditions);
  }

  static async deleteById(id: string | number): Promise<boolean> {
    const query = new Query(this);
    return query.deleteById(id);
  }

  async validate(): Promise<boolean> {
    const Constructor = this.constructor as typeof Model;
    return Constructor.schema.validate(this);
  }

  async save(): Promise<this> {
    const Constructor = this.constructor as typeof Model;
    const query = new Query(Constructor);

    // Validar y transformar datos
    await this.validate();
    const transformed = Constructor.schema.transform(this);

    if (this.id) {
      // Actualizar
      await query.updateById(this.id, transformed);
    } else {
      // Crear nuevo
      transformed.createdAt = new Date();
      const result = await query.insert(transformed);
      this.id = result.id;
    }

    transformed.updatedAt = new Date();
    Object.assign(this, transformed);
    return this;
  }

  async delete(): Promise<boolean> {
    if (!this.id) {
      throw new Error('No se puede eliminar un modelo sin ID');
    }

    const Constructor = this.constructor as typeof Model;
    const query = new Query(Constructor);
    return query.deleteById(this.id);
  }

  toJSON(): Record<string, any> {
    const Constructor = this.constructor as typeof Model;
    return Constructor.schema.transform(this);
  }
} 