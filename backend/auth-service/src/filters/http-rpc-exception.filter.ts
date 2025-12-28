import { Catch, RpcExceptionFilter, ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { RpcException } from '@nestjs/microservices';

@Catch(HttpException)
export class HttpRpcExceptionFilter implements RpcExceptionFilter<HttpException> {
    private readonly logger = new Logger(HttpRpcExceptionFilter.name);

    catch(exception: HttpException, host: ArgumentsHost): Observable<any> {
        const status = exception.getStatus();
        const response = exception.getResponse();

        // Log typical "client" errors (4xx) as warnings or verbose, not errors
        if (status >= 400 && status < 500) {
            this.logger.log(`RPC Exception (Client Error): ${JSON.stringify(response)}`);
        } else {
            this.logger.error(`RPC Exception (Server Error): ${JSON.stringify(response)}`);
        }

        // Return as RpcException so it propagates correctly to Gateway
        return throwError(() => new RpcException(response));
    }
}
