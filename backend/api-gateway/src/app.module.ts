import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './controllers/auth.controller';
import { UserController } from './controllers/user.controller';
import { ProductController } from './controllers/product.controller';
import { OrderController } from './controllers/order.controller';
import { PaymentController } from './controllers/payment.controller';
import { UploadController } from './controllers/upload.controller';
import { CategoryController } from './controllers/category.controller';
import { ManagementController } from './controllers/management.controller';
import { JwtModule } from '@nestjs/jwt';
import { AuthGuard } from './guards/auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '24h' },
    }),
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.AUTH_SERVICE_HOST || 'localhost',
          port: parseInt(process.env.AUTH_SERVICE_PORT) || 3001,
        },
      },
      {
        name: 'USER_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.USER_SERVICE_HOST || 'localhost',
          port: parseInt(process.env.USER_SERVICE_PORT) || 3002,
        },
      },
      {
        name: 'PRODUCT_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.PRODUCT_SERVICE_HOST || 'localhost',
          port: parseInt(process.env.PRODUCT_SERVICE_PORT) || 3003,
        },
      },
      {
        name: 'ORDER_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.ORDER_SERVICE_HOST || 'localhost',
          port: parseInt(process.env.ORDER_SERVICE_PORT) || 3004,
        },
      },
      {
        name: 'PAYMENT_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.PAYMENT_SERVICE_HOST || 'localhost',
          port: parseInt(process.env.PAYMENT_SERVICE_PORT) || 3005,
        },
      },
      {
        name: 'CATEGORY_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.CATEGORY_SERVICE_HOST || 'localhost',
          port: parseInt(process.env.CATEGORY_SERVICE_PORT) || 3006,
        },
      },
      {
        name: 'MANAGEMENT_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.MANAGEMENT_SERVICE_HOST || 'localhost',
          port: parseInt(process.env.MANAGEMENT_SERVICE_PORT) || 3007,
        },
      },
    ]),
  ],
  controllers: [
    AuthController,
    UserController,
    ProductController,
    OrderController,
    PaymentController,
    UploadController,
    CategoryController,
    ManagementController,
  ],
  providers: [AuthGuard],
})
export class AppModule {}
