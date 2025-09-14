// src/lib/db/seed.ts

import { db } from './index';
import { users, dataSources, dataSourceTemplates } from './schema';
import * as bcrypt from 'bcrypt';

export const systemTemplates: any[] = [
  {
    id: 'schneider-m580-plc',
    name: 'Schneider Electric Modicon M580 PLC',
    description: 'Industrial PLC with Modbus TCP/IP support',
    manufacturer: 'Schneider Electric',
    model: 'Modicon M580',
    type: 'PLC',
    supportedInterfaces: ['TCP'],
    supportedProtocols: ['MODBUS_TCP'],
    defaultConfig: {
      interface: {
        port: 502,
        timeout: 5000,
        keepAlive: true,
        reconnectInterval: 10000,
        maxReconnectAttempts: 5
      },
      protocol: {
        unitId: 1,
        pollInterval: 1000,
        maxRetries: 3,
        registers: [
          {
            address: 40001,
            type: 'holding',
            length: 1,
            tagName: 'Temperature',
            dataType: 'float32',
            scalingFactor: 0.1,
            offset: 0
          }
        ]
      }
    },
    documentation: 'Standard Schneider Electric Modicon M580 PLC configuration',
    icon: 'plc',
    isSystem: true
  },
  {
    id: 'generic-mqtt-broker',
    name: 'Generic MQTT Broker',
    description: 'Standard MQTT broker connection',
    type: 'SENSOR_NETWORK',
    supportedInterfaces: ['TCP'],
    supportedProtocols: ['MQTT'],
    defaultConfig: {
      interface: {
        port: 1883,
        timeout: 30000,
        keepAlive: true,
        reconnectInterval: 5000,
        maxReconnectAttempts: 10
      },
      protocol: {
        keepAlive: 60,
        cleanSession: true,
        topics: [
          {
            topic: 'sensors/+/temperature',
            qos: 1,
            tagMapping: 'temperature'
          },
          {
            topic: 'sensors/+/humidity',
            qos: 1,
            tagMapping: 'humidity'
          }
        ]
      }
    },
    documentation: 'Generic MQTT broker for IoT sensor networks',
    icon: 'mqtt',
    isSystem: true
  },
  {
    id: 'gps-nmea-tracker',
    name: 'GPS NMEA 0183 Tracker',
    description: 'Standard GPS device with NMEA 0183 output',
    type: 'GPS_TRACKER',
    supportedInterfaces: ['SERIAL', 'TCP', 'UDP'],
    supportedProtocols: ['NMEA_0183'],
    defaultConfig: {
      interface: {
        baudRate: 4800,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
        flowControl: 'none',
        timeout: 5000
      },
      protocol: {
        sentences: ['GPGGA', 'GPRMC', 'GPVTG'],
        parseGps: true,
        parseWeather: false
      }
    },
    documentation: 'Standard GPS tracker with NMEA 0183 sentences',
    icon: 'gps',
    isSystem: true
  },
  {
    id: 'weather-api-openweather',
    name: 'OpenWeatherMap API',
    description: 'OpenWeatherMap weather data service',
    manufacturer: 'OpenWeatherMap',
    type: 'WEATHER_STATION',
    supportedInterfaces: ['TCP'],
    supportedProtocols: ['API_REST'],
    defaultConfig: {
      interface: {
        host: 'api.openweathermap.org',
        port: 443,
        timeout: 30000,
        keepAlive: false
      },
      protocol: {
        method: 'GET',
        pollInterval: 300000,
        timeout: 30000,
        authentication: {
          type: 'apikey',
          credentials: {
            paramName: 'appid',
            apiKey: ''
          }
        },
        responseMapping: [
          {
            jsonPath: '$.main.temp',
            tagName: 'temperature',
            dataType: 'number',
            unit: 'K'
          },
          {
            jsonPath: '$.main.humidity',
            tagName: 'humidity',
            dataType: 'number',
            unit: '%'
          },
          {
            jsonPath: '$.main.pressure',
            tagName: 'pressure',
            dataType: 'number',
            unit: 'hPa'
          }
        ]
      }
    },
    documentation: 'OpenWeatherMap API integration',
    icon: 'weather',
    isSystem: true
  },
  {
    id: 'generic-4-20ma-sensor',
    name: 'Generic 4-20mA Analog Sensor',
    description: 'Standard 4-20mA analog input sensor',
    type: 'TEMPERATURE_SENSOR',
    supportedInterfaces: ['USB', 'SERIAL'],
    supportedProtocols: ['ANALOG_4_20MA'],
    defaultConfig: {
      protocol: {
        channels: [
          {
            channel: 0,
            tagName: 'sensor_value',
            rangeMin: 4.0,
            rangeMax: 20.0,
            scalingMin: 0.0,
            scalingMax: 100.0,
            unit: '°C',
            samplingRate: 1000
          }
        ],
        samplingMode: 'continuous'
      }
    },
    documentation: 'Generic 4-20mA analog sensor configuration',
    icon: 'sensor',
    isSystem: true
  },
  {
    id: 'allen-bradley-plc',
    name: 'Allen-Bradley CompactLogix PLC',
    description: 'Allen-Bradley PLC with Ethernet/IP support',
    manufacturer: 'Allen-Bradley',
    model: 'CompactLogix',
    type: 'PLC',
    supportedInterfaces: ['TCP'],
    supportedProtocols: ['MODBUS_TCP', 'OPC_UA'],
    defaultConfig: {
      interface: {
        port: 502,
        timeout: 5000,
        keepAlive: true,
        reconnectInterval: 10000,
        maxReconnectAttempts: 5
      },
      protocol: {
        unitId: 1,
        pollInterval: 1000,
        maxRetries: 3,
        registers: [
          {
            address: 40001,
            type: 'holding',
            length: 1,
            tagName: 'Process_Value',
            dataType: 'int16',
            scalingFactor: 1.0,
            offset: 0
          }
        ]
      }
    },
    documentation: 'Allen-Bradley CompactLogix PLC configuration',
    icon: 'plc',
    isSystem: true
  },
  {
    id: 'siemens-s7-plc',
    name: 'Siemens S7-1200/1500 PLC',
    description: 'Siemens S7 PLC with S7 communication',
    manufacturer: 'Siemens',
    model: 'S7-1200/1500',
    type: 'PLC',
    supportedInterfaces: ['TCP'],
    supportedProtocols: ['MODBUS_TCP'],
    defaultConfig: {
      interface: {
        port: 502,
        timeout: 5000,
        keepAlive: true,
        reconnectInterval: 10000,
        maxReconnectAttempts: 5
      },
      protocol: {
        unitId: 1,
        pollInterval: 1000,
        maxRetries: 3,
        registers: [
          {
            address: 100,
            type: 'holding',
            length: 1,
            tagName: 'DB1_Real0',
            dataType: 'float32',
            scalingFactor: 1.0,
            offset: 0
          }
        ]
      }
    },
    documentation: 'Siemens S7-1200/1500 PLC configuration',
    icon: 'plc',
    isSystem: true
  },
  {
    id: 'modbus-rtu-sensor',
    name: 'Generic Modbus RTU Sensor',
    description: 'Generic sensor with Modbus RTU over serial',
    type: 'TEMPERATURE_SENSOR',
    supportedInterfaces: ['SERIAL'],
    supportedProtocols: ['MODBUS_RTU'],
    defaultConfig: {
      interface: {
        baudRate: 9600,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
        flowControl: 'none',
        timeout: 5000
      },
      protocol: {
        unitId: 1,
        pollInterval: 5000,
        maxRetries: 3,
        registers: [
          {
            address: 30001,
            type: 'input',
            length: 1,
            tagName: 'Temperature',
            dataType: 'int16',
            scalingFactor: 0.1,
            offset: 0
          }
        ]
      }
    },
    documentation: 'Generic Modbus RTU sensor over serial connection',
    icon: 'sensor',
    isSystem: true
  },
  {
    id: 'opc-ua-server',
    name: 'Generic OPC UA Server',
    description: 'Standard OPC UA server connection',
    type: 'SCADA_SYSTEM',
    supportedInterfaces: ['TCP'],
    supportedProtocols: ['OPC_UA'],
    defaultConfig: {
      interface: {
        port: 4840,
        timeout: 30000,
        keepAlive: true,
        reconnectInterval: 10000,
        maxReconnectAttempts: 5
      },
      protocol: {
        endpointUrl: 'opc.tcp://localhost:4840',
        securityMode: 'None',
        securityPolicy: 'None',
        subscriptionInterval: 1000,
        nodes: [
          {
            nodeId: 'ns=2;s=Temperature',
            tagName: 'Temperature',
            dataType: 'double'
          },
          {
            nodeId: 'ns=2;s=Pressure',
            tagName: 'Pressure',
            dataType: 'double'
          }
        ]
      }
    },
    documentation: 'Generic OPC UA server configuration',
    icon: 'opcua',
    isSystem: true
  },
  {
    id: 'hart-transmitter',
    name: 'HART Protocol Transmitter',
    description: 'HART protocol field transmitter',
    type: 'PRESSURE_TRANSMITTER',
    supportedInterfaces: ['SERIAL'],
    supportedProtocols: ['HART'],
    defaultConfig: {
      interface: {
        baudRate: 1200,
        dataBits: 8,
        stopBits: 1,
        parity: 'odd',
        flowControl: 'none',
        timeout: 5000
      },
      protocol: {
        deviceAddress: 0,
        maxRetries: 3,
        commands: [
          {
            commandNumber: 3,
            tagName: 'primary_variable',
            pollInterval: 5000,
            dataType: 'float',
            unit: 'bar'
          }
        ]
      }
    },
    documentation: 'HART protocol transmitter configuration',
    icon: 'transmitter',
    isSystem: true
  },
  {
    id: 'file-csv-logger',
    name: 'CSV File Data Logger',
    description: 'CSV file with periodic data logging',
    type: 'HISTORIAN_SERVER',
    supportedInterfaces: ['FILE'],
    supportedProtocols: ['API_REST'],
    defaultConfig: {
      interface: {
        path: './data/sensor_data.csv',
        watchMode: true,
        pollInterval: 5000,
        encoding: 'utf8',
        delimiter: ','
      },
      protocol: {
        responseMapping: [
          {
            jsonPath: '$.timestamp',
            tagName: 'timestamp',
            dataType: 'string',
            unit: ''
          },
          {
            jsonPath: '$.temperature',
            tagName: 'temperature',
            dataType: 'number',
            unit: '°C'
          },
          {
            jsonPath: '$.humidity',
            tagName: 'humidity',
            dataType: 'number',
            unit: '%'
          }
        ]
      }
    },
    documentation: 'CSV file data logger configuration',
    icon: 'file',
    isSystem: true
  }
];

export async function seedDataSourceTemplates() {
  console.log('🌱 Seeding data source templates...');
  
  try {
    for (const template of systemTemplates) {
      await db.insert(dataSourceTemplates)
        .values(template)
        .onConflictDoUpdate({
          target: dataSourceTemplates.id,
          set: {
            name: template.name,
            description: template.description,
            manufacturer: template.manufacturer,
            model: template.model,
            type: template.type,
            supportedInterfaces: template.supportedInterfaces,
            supportedProtocols: template.supportedProtocols,
            defaultConfig: template.defaultConfig,
            documentation: template.documentation,
            icon: template.icon,
            updatedAt: new Date()
          }
        });
    }
    
    console.log(`✅ Seeded ${systemTemplates.length} data source templates`);
  } catch (error) {
    console.error('❌ Failed to seed data source templates:', error);
    throw error;
  }
}

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

    // Create operator user
    const operatorPassword = await bcrypt.hash('operator123', 12);
    const operatorUser = await db.insert(users).values({
      email: 'operator@example.com',
      password: operatorPassword,
      name: 'Jane Operator',
      role: 'OPERATOR',
      isActive: true,
    }).returning();

    console.log('✅ Created operator user:', operatorUser[0].email);

    // Seed data source templates
    await seedDataSourceTemplates();

    // Create sample data sources using the new structure
    const sampleDataSources = [
      {
        name: 'Factory Floor PLC #1',
        description: 'Main production line PLC',
        interfaceType: 'TCP',
        interfaceConfig: {
          host: '192.168.1.100',
          port: 502,
          timeout: 5000,
          keepAlive: true,
          reconnectInterval: 10000,
          maxReconnectAttempts: 5
        },
        protocolType: 'MODBUS_TCP',
        protocolConfig: {
          unitId: 1,
          pollInterval: 1000,
          maxRetries: 3,
          registers: [
            { 
              address: 40001, 
              type: 'holding', 
              length: 1, 
              tagName: 'Line1_Temperature',
              dataType: 'float32',
              scalingFactor: 0.1,
              offset: 0
            },
            { 
              address: 40002, 
              type: 'holding', 
              length: 1, 
              tagName: 'Line1_Pressure',
              dataType: 'int16',
              scalingFactor: 0.01,
              offset: 0
            }
          ]
        },
        dataSourceType: 'PLC',
        templateId: 'schneider-m580-plc',
        customConfig: {
          location: 'Building A - Line 1',
          department: 'Production'
        },
        isActive: false,
        userId: adminUser[0].id,
      },
      {
        name: 'MQTT Sensor Network',
        description: 'IoT sensors throughout facility',
        interfaceType: 'TCP',
        interfaceConfig: {
          host: 'mqtt.factory.local',
          port: 1883,
          timeout: 30000,
          keepAlive: true,
          reconnectInterval: 5000,
          maxReconnectAttempts: 10
        },
        protocolType: 'MQTT',
        protocolConfig: {
          keepAlive: 60,
          cleanSession: true,
          topics: [
            { topic: 'factory/building-a/+/temperature', qos: 1, tagMapping: 'temperature' },
            { topic: 'factory/building-a/+/humidity', qos: 1, tagMapping: 'humidity' },
            { topic: 'factory/building-b/+/vibration', qos: 1, tagMapping: 'vibration' }
          ]
        },
        dataSourceType: 'SENSOR_NETWORK',
        templateId: 'generic-mqtt-broker',
        customConfig: {
          location: 'Factory Wide',
          sensorCount: 25
        },
        isActive: false,
        userId: engineerUser[0].id,
      },
      {
        name: 'GPS Tracker - Vehicle Fleet',
        description: 'Company vehicle GPS tracking',
        interfaceType: 'SERIAL',
        interfaceConfig: {
          port: '/dev/ttyUSB0',
          baudRate: 4800,
          dataBits: 8,
          stopBits: 1,
          parity: 'none',
          flowControl: 'none',
          timeout: 5000
        },
        protocolType: 'NMEA_0183',
        protocolConfig: {
          sentences: ['GPGGA', 'GPRMC', 'GPVTG'],
          parseGps: true,
          parseWeather: false
        },
        dataSourceType: 'GPS_TRACKER',
        templateId: 'gps-nmea-tracker',
        customConfig: {
          vehicleId: 'TRUCK-001',
          driverName: 'John Driver'
        },
        isActive: false,
        userId: operatorUser[0].id,
      },
      {
        name: 'Weather Station API',
        description: 'Local weather conditions',
        interfaceType: 'TCP',
        interfaceConfig: {
          host: 'api.openweathermap.org',
          port: 443,
          timeout: 30000,
          keepAlive: false
        },
        protocolType: 'API_REST',
        protocolConfig: {
          method: 'GET',
          pollInterval: 300000, // 5 minutes
          timeout: 30000,
          authentication: {
            type: 'apikey',
            credentials: {
              paramName: 'appid',
              apiKey: 'your-api-key-here'
            }
          },
          responseMapping: [
            {
              jsonPath: '$.main.temp',
              tagName: 'outdoor_temperature',
              dataType: 'number',
              unit: 'K'
            },
            {
              jsonPath: '$.main.humidity',
              tagName: 'outdoor_humidity',
              dataType: 'number',
              unit: '%'
            },
            {
              jsonPath: '$.wind.speed',
              tagName: 'wind_speed',
              dataType: 'number',
              unit: 'm/s'
            }
          ]
        },
        dataSourceType: 'WEATHER_STATION',
        templateId: 'weather-api-openweather',
        customConfig: {
          location: 'Factory Location',
          coordinates: { lat: 40.7128, lon: -74.0060 }
        },
        isActive: false,
        userId: engineerUser[0].id,
      },
      {
        name: 'Temperature Sensors - Building A',
        description: '4-20mA temperature sensors in Building A',
        interfaceType: 'SERIAL',
        interfaceConfig: {
          port: '/dev/ttyUSB1',
          baudRate: 9600,
          dataBits: 8,
          stopBits: 1,
          parity: 'none',
          flowControl: 'none',
          timeout: 5000
        },
        protocolType: 'ANALOG_4_20MA',
        protocolConfig: {
          channels: [
            {
              channel: 0,
              tagName: 'zone1_temperature',
              rangeMin: 4.0,
              rangeMax: 20.0,
              scalingMin: -10.0,
              scalingMax: 50.0,
              unit: '°C',
              samplingRate: 1000
            },
            {
              channel: 1,
              tagName: 'zone2_temperature',
              rangeMin: 4.0,
              rangeMax: 20.0,
              scalingMin: -10.0,
              scalingMax: 50.0,
              unit: '°C',
              samplingRate: 1000
            }
          ],
          samplingMode: 'continuous'
        },
        dataSourceType: 'TEMPERATURE_SENSOR',
        templateId: 'generic-4-20ma-sensor',
        customConfig: {
          building: 'Building A',
          zones: ['Production Floor', 'Storage Area']
        },
        isActive: false,
        userId: operatorUser[0].id,
      }
    ];

    const createdDataSources = await db.insert(dataSources).values(sampleDataSources).returning();
    console.log(`✅ Created ${createdDataSources.length} sample data sources`);

    console.log(`
🎉 Database seeding completed!

Login credentials:
📧 Admin: admin@example.com / admin123
📧 Engineer: engineer@example.com / engineer123  
📧 Operator: operator@example.com / operator123

Templates created: ${systemTemplates.length}
Data sources created: ${createdDataSources.length}

You can now start the application and begin managing data sources.
The system supports the new interface/protocol/data source architecture.
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
