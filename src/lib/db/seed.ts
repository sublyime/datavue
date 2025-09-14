// src/lib/db/seed.ts
import { db } from './index';
import { users, dataSources } from './schema';
import * as bcrypt from 'bcrypt';

async function seed() {
  try {
    console.log('🌱 Starting database seed...');

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const adminUser = await db.insert(users).values({
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
      isActive: true,
    }).returning();

    console.log('✅ Created admin user:', adminUser[0].email);

    // Create engineer user
    const engineerPassword = await bcrypt.hash('engineer123', 12);
    
    const engineerUser = await db.insert(users).values({
      email: 'engineer@example.com',
      password: engineerPassword,
      name: 'John Engineer',
      role: 'ENGINEER',
      isActive: true,
    }).returning();

    console.log('✅ Created engineer user:', engineerUser[0].email);

    // Create sample data sources
    const sampleDataSources = [
      {
        name: 'Factory Floor PLC',
        type: 'MODBUS',
        protocol: 'MODBUS',
        config: {
          host: '192.168.1.100',
          port: 502,
          unitId: 1,
          registers: [
            { address: 40001, type: 'holding', length: 1, tagName: 'Temperature' },
            { address: 40002, type: 'holding', length: 1, tagName: 'Pressure' },
          ]
        },
        isActive: false,
        userId: adminUser[0].id,
      },
      {
        name: 'MQTT Sensor Network',
        type: 'MQTT',
        protocol: 'MQTT',
        config: {
          brokerUrl: 'mqtt://localhost:1883',
          topics: ['sensors/temperature', 'sensors/humidity', 'sensors/vibration'],
          qos: 1,
        },
        isActive: false,
        userId: adminUser[0].id,
      },
      {
        name: 'GPS NMEA Feed',
        type: 'SERIAL',
        protocol: 'NMEA',
        config: {
          port: '/dev/ttyUSB0',
          baudRate: 4800,
          sentences: ['GPGGA', 'GPRMC'],
        },
        isActive: false,
        userId: engineerUser[0].id,
      },
      {
        name: 'Weather API',
        type: 'API',
        protocol: 'API',
        config: {
          url: 'https://api.openweathermap.org/data/2.5/weather',
          method: 'GET',
          pollInterval: 300000, // 5 minutes
          headers: {
            'User-Agent': 'DataVue/1.0',
          },
        },
        isActive: false,
        userId: engineerUser[0].id,
      },
    ];

    const createdDataSources = await db.insert(dataSources).values(sampleDataSources).returning();
    
    console.log(`✅ Created ${createdDataSources.length} sample data sources`);

    console.log(`
🎉 Database seeding completed!

Login credentials:
📧 Admin: admin@example.com / admin123
📧 Engineer: engineer@example.com / engineer123

You can now start the application and begin managing data sources.
    `);

  } catch (error) {
    console.error('❌ Database seed failed:', error);
    throw error;
  }
}

if (require.main === module) {
  seed()
    .then(() => {
      console.log('Seed completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seed failed:', error);
      process.exit(1);
    });
}

export default seed;