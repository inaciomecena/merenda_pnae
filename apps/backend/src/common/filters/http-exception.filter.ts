import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = exception instanceof HttpException ? exception.message : 'Erro interno do servidor';
    const detalhe = exception instanceof HttpException ? exception.getResponse() : null;
    const corpo = detalhe && typeof detalhe === 'object' ? detalhe as { message?: string | string[]; erros?: string[] } : null;

    response.status(status).json({
      success: false,
      statusCode: status,
      message: corpo?.message || message,
      ...(Array.isArray(corpo?.erros) ? { erros: corpo.erros } : {}),
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
