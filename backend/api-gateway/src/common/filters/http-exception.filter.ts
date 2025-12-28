import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);

    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();

        // Log the raw exception for debugging purposes (optional, but helpful)
        // this.logger.verbose(`Raw exception: ${JSON.stringify(exception)}`);

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message: any = 'Internal server error';

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            message = exception.getResponse();
        } else {
            // Try to find status in various places
            status =
                exception.statusCode ||
                exception.status ||
                exception.error?.statusCode ||
                exception.error?.status ||
                exception.response?.statusCode ||
                exception.response?.status ||
                HttpStatus.INTERNAL_SERVER_ERROR;

            // Try to find message in various places
            message =
                exception.message ||
                exception.response?.message ||
                exception.error?.message ||
                exception.error ||
                'Internal server error';
        }

        // Handle nested message objects
        const errorMessage = typeof message === 'object' && message['message']
            ? message['message']
            : message;

        // Handle nested error objects that might have ended up in message
        const finalMessage = typeof errorMessage === 'object'
            ? JSON.stringify(errorMessage)
            : errorMessage;

        // Log the error
        if (status >= 500) {
            this.logger.error(`Status: ${status} Error: ${finalMessage}`);
        } else {
            this.logger.warn(`Status: ${status} Error: ${finalMessage}`);
        }

        response.status(status).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            message: finalMessage,
            success: false,
        });
    }
}
