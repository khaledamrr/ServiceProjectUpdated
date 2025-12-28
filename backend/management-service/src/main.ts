import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        host: process.env.HOST || 'localhost',
        port: parseInt(process.env.PORT) || 3007,
      },
    },
  );

  await app.listen();
  console.log('🚀 Management Service is running on port 3007');
}
bootstrap();
