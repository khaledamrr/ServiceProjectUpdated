import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  // Create hybrid app that supports both HTTP and TCP
  const app = await NestFactory.create(AppModule);
  
  // Add microservice TCP transport
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: process.env.HOST || 'localhost',
      port: parseInt(process.env.PORT) || 3002,
    },
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // Enable CORS for HTTP endpoints
  app.enableCors();

  // Start all microservices
  await app.startAllMicroservices();
  
  // Start HTTP server on different port for internal sync
  const httpPort = parseInt(process.env.HTTP_PORT) || 3012;
  await app.listen(httpPort);
  
  console.log(`👤 User Service is running on TCP port ${process.env.PORT || 3002}`);
  console.log(`👤 User Service HTTP API is running on port ${httpPort}`);
}
bootstrap();

