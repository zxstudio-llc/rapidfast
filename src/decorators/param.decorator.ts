export const PARAM_METADATA = 'param';

export enum ParamType {
  REQUEST = 'REQUEST',
  RESPONSE = 'RESPONSE',
  NEXT = 'NEXT',
  PARAMS = 'PARAMS',
  QUERY = 'QUERY',
  BODY = 'BODY',
  HEADERS = 'HEADERS',
  SESSION = 'SESSION',
  FILE = 'FILE',
  FILES = 'FILES'
}

const createParamDecorator = (type: ParamType) => {
  return (data?: string) => {
    return (target: Object, propertyKey: string | symbol, parameterIndex: number): void => {
      const existingParams: any[] = Reflect.getMetadata(PARAM_METADATA, target.constructor, propertyKey!) || [];
      existingParams.push({
        type,
        index: parameterIndex,
        data
      });
      Reflect.defineMetadata(PARAM_METADATA, existingParams, target.constructor, propertyKey!);
    };
  };
};

export const Req = createParamDecorator(ParamType.REQUEST);
export const Res = createParamDecorator(ParamType.RESPONSE);
export const Next = createParamDecorator(ParamType.NEXT);
export const Param = createParamDecorator(ParamType.PARAMS);
export const Query = createParamDecorator(ParamType.QUERY);
export const Body = createParamDecorator(ParamType.BODY);
export const Headers = createParamDecorator(ParamType.HEADERS);
export const Session = createParamDecorator(ParamType.SESSION);
export const File = createParamDecorator(ParamType.FILE);
export const Files = createParamDecorator(ParamType.FILES); 