import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContext {
    requestId: string;
    requestStartedAt?: number;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();

export const getContext = (): RequestContext | undefined => {
    return requestContext.getStore();
};
