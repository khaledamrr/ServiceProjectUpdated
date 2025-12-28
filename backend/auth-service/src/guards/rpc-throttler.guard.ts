import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class RpcThrottlerGuard extends ThrottlerGuard {
    protected async handleRequest(...args: any[]): Promise<boolean> {
        try {
            // @ts-ignore
            return await super.handleRequest(...args);
        } catch (error) {
            // In RPC/Microservices, standard ThrottlerGuard tries to set headers on 'res'
            // which fails with "res.header is not a function". We ignore this specific error.
            if (error instanceof TypeError && error.message.includes('res.header is not a function')) {
                return true;
            }
            throw error;
        }
    }
}
