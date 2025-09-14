import { db } from '@/lib/db';
import { dataSources, dataPoints } from '@/lib/db/schema';

async function seedSampleData() {
  try {
    console.log('🌱 Seeding sample data sources...');

    // Add real data sources with coordinates
    const sampleSources = await db.insert(dataSources).values([
      {
        name: 'Houston Refinery Plant A',
        description: 'Main processing unit temperature monitoring',
        interfaceType: 'TCP',
        interfaceConfig: {
          latitude: 29.7604,
          longitude: -95.3698,
          host: '192.168.1.10',
          port: 502
        },
        protocolType: 'MODBUS_TCP',
        protocolConfig: {
          unitId: 1,
          timeout: 5000
        },
        dataSourceType: 'SENSOR',
        customConfig: {
          sensorType: 'temperature',
          range: '0-200°C'
        },
        isActive: true,
        userId: 1, // Replace with your actual user ID
      },
      {
        name: 'Singapore Terminal Pressure',
        description: 'Storage tank pressure monitoring',
        interfaceType: 'TCP',
        interfaceConfig: {
          latitude: 1.3521,
          longitude: 103.8198,
          host: '192.168.1.11',
          port: 502
        },
        protocolType: 'MODBUS_TCP',
        protocolConfig: {
          unitId: 2,
          timeout: 5000
        },
        dataSourceType: 'POWER_METER',
        customConfig: {
          sensorType: 'pressure',
          range: '0-100 PSI'
        },
        isActive: true,
        userId: 1,
      },
      {
        name: 'Rotterdam Weather Station',
        description: 'Environmental monitoring',
        interfaceType: 'TCP',
        interfaceConfig: {
          latitude: 51.9244,
          longitude: 4.4777,
          host: '192.168.1.12',
          port: 8080
        },
        protocolType: 'API_REST',
        protocolConfig: {
          endpoint: '/api/weather',
          method: 'GET'
        },
        dataSourceType: 'WEATHER_STATION',
        customConfig: {
          parameters: ['temperature', 'humidity', 'pressure']
        },
        isActive: false,
        userId: 1,
      },
      {
        name: 'Dubai Operations Center',
        description: 'Main control system monitoring',
        interfaceType: 'SERIAL',
        interfaceConfig: {
          latitude: 25.2048,
          longitude: 55.2708,
          port: 'COM3',
          baudRate: 9600
        },
        protocolType: 'MODBUS_RTU',
        protocolConfig: {
          unitId: 3,
          timeout: 3000
        },
        dataSourceType: 'PLC',
        customConfig: {
          controllerType: 'Allen Bradley',
          tags: ['temp1', 'flow1', 'pressure1']
        },
        isActive: true,
        userId: 1,
      }
    ]).returning();

    console.log(`✅ Created ${sampleSources.length} data sources`);

    // Add some sample data points for each source
    for (const source of sampleSources) {
      if (source.isActive) {
        console.log(`📊 Adding data points for ${source.name}...`);
        
        // Create data points for the last 24 hours
        const dataPointsToInsert = [];
        for (let i = 0; i < 144; i++) { // Every 10 minutes for 24 hours
          const timestamp = new Date(Date.now() - (i * 10 * 60 * 1000));
          const baseValue = source.dataSourceType === 'SENSOR' ? 75 : 
                           source.dataSourceType === 'POWER_METER' ? 45 : 22;
          
          dataPointsToInsert.push({
            sourceId: source.id,
            tagName: 'main_reading',
            value: { 
              value: baseValue + (Math.random() - 0.5) * 20,
              unit: source.dataSourceType === 'SENSOR' ? '°C' : 
                   source.dataSourceType === 'POWER_METER' ? 'PSI' : '°C'
            },
            quality: 192,
            timestamp,
            metadata: {
              source: 'automated_seed',
              quality_description: 'good'
            }
          });
        }

        await db.insert(dataPoints).values(dataPointsToInsert);
        console.log(`✅ Added ${dataPointsToInsert.length} data points for ${source.name}`);
      }
    }

    console.log('🎉 Sample data seeding completed!');
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  }
}

// Run the seeding function
seedSampleData().then(() => {
  console.log('Seeding process finished');
  process.exit(0);
}).catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
