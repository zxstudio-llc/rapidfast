import "reflect-metadata";

export class DependencyInjector {
  private providers = new Map<any, any>();

  /**
   * Registra un proveedor de servicio
   */
  registerProvider(Provider: any): void {
    // Verificar que el proveedor esté decorado con @Injectable
    const isInjectable = Reflect.getMetadata("injectable", Provider);
    if (!isInjectable) {
      throw new Error(`La clase ${Provider.name} debe estar decorada con @Injectable()`);
    }
    
    if (!this.providers.has(Provider)) {
      const instance = this.instantiate(Provider);
      this.providers.set(Provider, instance);
      console.log(`Proveedor registrado: ${Provider.name}`);
    }
  }

  /**
   * Obtiene una instancia de un servicio
   */
  get<T>(Provider: new (...args: any[]) => T): T {
    if (!this.providers.has(Provider)) {
      this.registerProvider(Provider);
    }
    return this.providers.get(Provider);
  }

  /**
   * Crea una instancia de una clase resolviendo sus dependencias
   */
  instantiate<T>(Provider: new (...args: any[]) => T): T {
    // Obtener tipos de parámetros del constructor
    const paramTypes = Reflect.getMetadata("design:paramtypes", Provider) || [];
    const injectParams = Reflect.getMetadata("inject:params", Provider) || [];
    
    // Resolver las dependencias
    const dependencies = paramTypes.map((paramType: any, index: number) => {
      // Buscar si hay un token de inyección personalizado
      const customInject = injectParams.find((p: any) => p.index === index);
      const dependencyType = customInject ? customInject.token : paramType;
      
      // Si es un tipo primitivo o no se puede resolver
      if (dependencyType === Object || dependencyType === String || 
          dependencyType === Number || dependencyType === Boolean || 
          dependencyType === Array || dependencyType === undefined) {
        throw new Error(
          `No se puede resolver el parámetro ${index} del constructor de ${Provider.name}. ` +
          `Utiliza @Inject() para proporcionar un token personalizado.`
        );
      }
      
      // Resolver la dependencia recurrentemente
      if (!this.providers.has(dependencyType)) {
        this.registerProvider(dependencyType);
      }
      
      return this.providers.get(dependencyType);
    });
    
    // Crear la instancia con las dependencias resueltas
    return new Provider(...dependencies);
  }
}
