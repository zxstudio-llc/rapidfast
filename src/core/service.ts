export interface IService {
  initialize?(): Promise<void> | void;
  destroy?(): Promise<void> | void;
}

export class Service implements IService {
  constructor() {}

  async initialize(): Promise<void> {
    // Método opcional para inicialización
  }

  async destroy(): Promise<void> {
    // Método opcional para limpieza
  }
}

export default Service; 