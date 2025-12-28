import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { getModelToken } from '@nestjs/mongoose';
import axios from 'axios';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userModel = app.get<Model<UserDocument>>(getModelToken(User.name));

  try {
    // Define admin credentials
    const adminEmail = 'admin@example.com';
    const adminPassword = 'Admin123!';
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    // Upsert admin user (Create if new, Update if exists)
    // This guarantees the password is always reset to the known value
    const admin = await userModel.findOneAndUpdate(
      { email: adminEmail },
      {
        email: adminEmail,
        password: hashedPassword,
        name: 'Admin User',
        role: 'admin',
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log('✅ Admin user seeded successfully in Auth_db!');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   ID: ${admin._id}`);

    // Sync to User Service
    console.log('');
    console.log('🔄 Syncing admin profile to User Service...');
    await syncAdminToUserService(admin._id.toString(), admin.email, admin.name, admin.role);

    console.log('');
    console.log('⚠️  Please change the password after first login in production!');
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  } finally {
    await app.close();
  }
}

async function syncAdminToUserService(id: string, email: string, name: string, role: string) {
  const userServiceUrl = process.env.USER_SERVICE_HTTP_URL || 'http://localhost:3012';

  try {
    const response = await axios.post(`${userServiceUrl}/users/sync`, {
      _id: id,
      email: email,
      name: name,
      role: role,
    });

    console.log('✅ Admin profile synced to User_db successfully!');
    console.log('   User Service Response:', response.data.message);
  } catch (error) {
    console.error('❌ Failed to sync admin to User Service:', error.message);
    console.error('   Make sure User Service is running on port 3012');
    console.error('   You can manually sync later by registering again or calling the sync endpoint');
  }
}

bootstrap();
