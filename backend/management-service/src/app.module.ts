import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ManagementController } from './management.controller';
import { ManagementService } from './management.service';
import { SectionService } from './section.service';
import { Slider, SliderSchema } from './schemas/slider.schema';
import { Section, SectionSchema } from './schemas/section.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI),
    ClientsModule.register([
      {
        name: 'PRODUCT_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.PRODUCT_SERVICE_HOST || 'localhost',
          port: parseInt(process.env.PRODUCT_SERVICE_PORT) || 3003,
        },
      },
    ]),
    MongooseModule.forFeature([
      { name: Slider.name, schema: SliderSchema },
      { name: Section.name, schema: SectionSchema },
    ]),
  ],
  controllers: [ManagementController],
  providers: [ManagementService, SectionService],
})
export class AppModule {}
