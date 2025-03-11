import { Model } from './model';
import { Connection } from './connection';

export class Query {
  private modelClass: typeof Model;
  private connection: Connection;

  constructor(modelClass: typeof Model) {
    this.modelClass = modelClass;
    this.connection = modelClass.connection;
  }

  async find(conditions: any = {}): Promise<Model[]> {
    const client = this.connection.getClient();
    const results = await this.executeQuery('find', conditions);
    return results.map((data: any) => new this.modelClass(data));
  }

  async findOne(conditions: any = {}): Promise<Model | null> {
    const client = this.connection.getClient();
    const result = await this.executeQuery('findOne', conditions);
    return result ? new this.modelClass(result) : null;
  }

  async findById(id: string | number): Promise<Model | null> {
    return this.findOne({ id });
  }

  async insert(data: Partial<Model>): Promise<{ id: string | number }> {
    const client = this.connection.getClient();
    const result = await this.executeQuery('insert', data);
    return { id: result.insertedId || result.id };
  }

  async updateOne(conditions: any, data: Partial<Model>): Promise<boolean> {
    const client = this.connection.getClient();
    const result = await this.executeQuery('updateOne', { conditions, data });
    return result.modifiedCount > 0 || result.affectedRows > 0;
  }

  async updateById(id: string | number, data: Partial<Model>): Promise<boolean> {
    return this.updateOne({ id }, data);
  }

  async deleteOne(conditions: any): Promise<boolean> {
    const client = this.connection.getClient();
    const result = await this.executeQuery('deleteOne', conditions);
    return result.deletedCount > 0 || result.affectedRows > 0;
  }

  async deleteById(id: string | number): Promise<boolean> {
    return this.deleteOne({ id });
  }

  private async executeQuery(operation: string, params: any): Promise<any> {
    const client = this.connection.getClient();
    
    switch (this.connection.constructor.name) {
      case 'MongoDBConnection':
        return this.executeMongoQuery(client, operation, params);
      case 'MySQLConnection':
        return this.executeMySQLQuery(client, operation, params);
      case 'PostgresConnection':
        return this.executePostgresQuery(client, operation, params);
      case 'SQLiteConnection':
        return this.executeSQLiteQuery(client, operation, params);
      default:
        throw new Error('Tipo de conexión no soportado');
    }
  }

  private async executeMongoQuery(client: any, operation: string, params: any): Promise<any> {
    const collection = client.db().collection(this.modelClass.modelName);
    
    switch (operation) {
      case 'find':
        return collection.find(params).toArray();
      case 'findOne':
        return collection.findOne(params);
      case 'insert':
        return collection.insertOne(params);
      case 'updateOne':
        return collection.updateOne(params.conditions, { $set: params.data });
      case 'deleteOne':
        return collection.deleteOne(params);
      default:
        throw new Error(`Operación no soportada: ${operation}`);
    }
  }

  private async executeMySQLQuery(client: any, operation: string, params: any): Promise<any> {
    const table = this.modelClass.modelName;
    
    switch (operation) {
      case 'find':
        const [rows] = await client.query(`SELECT * FROM ${table} WHERE ?`, [params]);
        return rows;
      case 'findOne':
        const [[row]] = await client.query(`SELECT * FROM ${table} WHERE ? LIMIT 1`, [params]);
        return row;
      case 'insert':
        const [result] = await client.query(`INSERT INTO ${table} SET ?`, [params]);
        return { id: result.insertId };
      case 'updateOne':
        const [updateResult] = await client.query(
          `UPDATE ${table} SET ? WHERE ?`,
          [params.data, params.conditions]
        );
        return { affectedRows: updateResult.affectedRows };
      case 'deleteOne':
        const [deleteResult] = await client.query(`DELETE FROM ${table} WHERE ?`, [params]);
        return { affectedRows: deleteResult.affectedRows };
      default:
        throw new Error(`Operación no soportada: ${operation}`);
    }
  }

  private async executePostgresQuery(client: any, operation: string, params: any): Promise<any> {
    const table = this.modelClass.modelName;
    
    switch (operation) {
      case 'find':
        const { rows } = await client.query(`SELECT * FROM ${table} WHERE $1`, [params]);
        return rows;
      case 'findOne':
        const result = await client.query(`SELECT * FROM ${table} WHERE $1 LIMIT 1`, [params]);
        return result.rows[0];
      case 'insert':
        const insertResult = await client.query(
          `INSERT INTO ${table} ($1) VALUES ($2) RETURNING id`,
          [Object.keys(params), Object.values(params)]
        );
        return { id: insertResult.rows[0].id };
      case 'updateOne':
        const updateResult = await client.query(
          `UPDATE ${table} SET $1 WHERE $2`,
          [params.data, params.conditions]
        );
        return { affectedRows: updateResult.rowCount };
      case 'deleteOne':
        const deleteResult = await client.query(`DELETE FROM ${table} WHERE $1`, [params]);
        return { affectedRows: deleteResult.rowCount };
      default:
        throw new Error(`Operación no soportada: ${operation}`);
    }
  }

  private async executeSQLiteQuery(client: any, operation: string, params: any): Promise<any> {
    const table = this.modelClass.modelName;
    
    return new Promise((resolve, reject) => {
      switch (operation) {
        case 'find':
          client.all(`SELECT * FROM ${table} WHERE ?`, params, (err: Error | null, rows: any[]) => {
            if (err) reject(err);
            else resolve(rows);
          });
          break;
        case 'findOne':
          client.get(`SELECT * FROM ${table} WHERE ? LIMIT 1`, params, (err: Error | null, row: any) => {
            if (err) reject(err);
            else resolve(row);
          });
          break;
        case 'insert':
          client.run(
            `INSERT INTO ${table} (${Object.keys(params).join(', ')}) VALUES (${Object.values(params).map(() => '?').join(', ')})`,
            Object.values(params),
            function(this: { lastID: number }, err: Error | null) {
              if (err) reject(err);
              else resolve({ id: this.lastID });
            }
          );
          break;
        case 'updateOne':
          client.run(
            `UPDATE ${table} SET ? WHERE ?`,
            [params.data, params.conditions],
            function(this: { changes: number }, err: Error | null) {
              if (err) reject(err);
              else resolve({ affectedRows: this.changes });
            }
          );
          break;
        case 'deleteOne':
          client.run(
            `DELETE FROM ${table} WHERE ?`,
            params,
            function(this: { changes: number }, err: Error | null) {
              if (err) reject(err);
              else resolve({ affectedRows: this.changes });
            }
          );
          break;
        default:
          reject(new Error(`Operación no soportada: ${operation}`));
      }
    });
  }
} 