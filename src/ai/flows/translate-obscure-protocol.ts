// src/ai/flows/translate-obscure-protocol.ts
export interface TranslateObscureProtocolInput {
  protocolData: string;
  protocolDescription?: string;
}

export interface TranslateObscureProtocolOutput {
  translationSuccessful: boolean;
  translatedData?: string;
  logMessage: string;
  confidence?: number;
}

export async function translateObscureProtocol(
  input: TranslateObscureProtocolInput
): Promise<TranslateObscureProtocolOutput> {
  try {
    // This is a mock implementation
    // In a real application, you would use AI/ML services like OpenAI, Claude, etc.
    
    const { protocolData, protocolDescription } = input;
    
    // Simple pattern-based translation for demonstration
    let translatedData = '';
    let confidence = 0;
    
    // Check for common patterns
    if (protocolData.includes('Modbus') || /^\d{2}\s\d{2}/.test(protocolData)) {
      // Looks like Modbus
      translatedData = JSON.stringify({
        protocol: 'MODBUS',
        data: parseModbusData(protocolData),
        timestamp: new Date().toISOString(),
      }, null, 2);
      confidence = 85;
    } else if (protocolData.startsWith('$') && protocolData.includes('*')) {
      // Looks like NMEA
      translatedData = JSON.stringify({
        protocol: 'NMEA',
        data: parseNmeaData(protocolData),
        timestamp: new Date().toISOString(),
      }, null, 2);
      confidence = 90;
    } else if (protocolData.includes('{') && protocolData.includes('}')) {
      // Already looks like JSON
      try {
        JSON.parse(protocolData);
        translatedData = protocolData;
        confidence = 95;
      } catch {
        translatedData = JSON.stringify({
          protocol: 'UNKNOWN',
          rawData: protocolData,
          note: 'Could not parse as JSON',
          timestamp: new Date().toISOString(),
        }, null, 2);
        confidence = 30;
      }
    } else {
      // Unknown format, attempt basic parsing
      translatedData = JSON.stringify({
        protocol: 'UNKNOWN',
        rawData: protocolData,
        hexData: Buffer.from(protocolData, 'utf8').toString('hex'),
        description: protocolDescription || 'No description provided',
        timestamp: new Date().toISOString(),
      }, null, 2);
      confidence = 20;
    }
    
    return {
      translationSuccessful: confidence > 50,
      translatedData,
      logMessage: `Translation completed with ${confidence}% confidence. ${
        confidence > 50 ? 'Protocol detected and parsed successfully.' : 'Low confidence - manual review recommended.'
      }`,
      confidence,
    };
    
  } catch (error) {
    return {
      translationSuccessful: false,
      logMessage: `Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// Helper functions for parsing specific protocols
function parseModbusData(data: string): any {
  // Simple Modbus parsing - in reality this would be much more complex
  const lines = data.split('\n').filter(line => line.trim());
  const registers = [];
  
  for (const line of lines) {
    const match = line.match(/(\d+)\s+(\d+)/);
    if (match) {
      registers.push({
        address: parseInt(match[1]),
        value: parseInt(match[2]),
      });
    }
  }
  
  return { registers };
}

function parseNmeaData(data: string): any {
  // Simple NMEA parsing
  const sentences = data.split('\n').filter(line => line.startsWith('$'));
  const parsed = [];
  
  for (const sentence of sentences) {
    const parts = sentence.split(',');
    if (parts.length > 0) {
      parsed.push({
        type: parts[0].substring(1), // Remove $
        fields: parts.slice(1),
      });
    }
  }
  
  return { sentences: parsed };
}

// src/ai/flows/suggest-database-config.ts
export interface SuggestDatabaseConfigInput {
  dataVolume: string;
  dataVelocity: string;
  intendedAnalysis: string;
  requirements?: string;
  performanceNeeds?: string;
  budgetConstraints?: string;
}

export interface SuggestDatabaseConfigOutput {
  suggestedDatabaseType: string;
  suggestedSettings: string;
  justification: string;
}

export async function suggestDatabaseConfig(
  input: SuggestDatabaseConfigInput
): Promise<SuggestDatabaseConfigOutput> {
  const { dataVolume, dataVelocity, intendedAnalysis } = input;
  
  // Simple rule-based recommendation system
  // In a real application, this would use ML/AI services
  
  let databaseType = 'PostgreSQL';
  let settings = '';
  let justification = '';
  
  const volumeNum = extractNumber(dataVolume);
  const velocityNum = extractNumber(dataVelocity);
  
  if (velocityNum > 10000 || volumeNum > 1000) {
    // High velocity/volume - recommend time series DB
    databaseType = 'InfluxDB';
    settings = `# InfluxDB Configuration
[meta]
  dir = "/var/lib/influxdb/meta"

[data]
  dir = "/var/lib/influxdb/data"
  wal-dir = "/var/lib/influxdb/wal"
  
[http]
  enabled = true
  bind-address = ":8086"
  
# Retention policies
CREATE RETENTION POLICY "one_week" ON "historian" DURATION 7d REPLICATION 1 DEFAULT
CREATE RETENTION POLICY "one_year" ON "historian" DURATION 365d REPLICATION 1`;
    
    justification = `InfluxDB is recommended for your high-velocity data (${dataVelocity}) and large volume (${dataVolume}). It's specifically designed for time-series data with excellent compression and query performance for analytical workloads.`;
    
  } else if (intendedAnalysis.toLowerCase().includes('real-time') || intendedAnalysis.toLowerCase().includes('dashboard')) {
    // Real-time analysis - recommend Redis + PostgreSQL
    databaseType = 'Redis + PostgreSQL';
    settings = `# Redis Configuration (for real-time data)
maxmemory 2gb
maxmemory-policy allkeys-lru
save 900 1

# PostgreSQL Configuration (for historical data)
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB
max_connections = 100
wal_buffers = 16MB
checkpoint_completion_target = 0.9`;

    justification = `A hybrid Redis + PostgreSQL approach is recommended for your real-time analysis needs. Redis provides fast access for dashboards and real-time queries, while PostgreSQL handles historical data storage and complex analytics.`;
    
  } else if (intendedAnalysis.toLowerCase().includes('analytics') || intendedAnalysis.toLowerCase().includes('reporting')) {
    // Analytics focus - recommend PostgreSQL with time-series extensions
    databaseType = 'TimescaleDB (PostgreSQL)';
    settings = `# TimescaleDB Configuration
shared_preload_libraries = 'timescaledb'
shared_buffers = 512MB
effective_cache_size = 2GB
work_mem = 8MB
maintenance_work_mem = 128MB
max_connections = 100

# Time-series optimizations
timescaledb.max_background_workers = 8
timescaledb.last_updated_threshold = '1h'

# Create hypertable
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
SELECT create_hypertable('data_points', 'timestamp');`;

    justification = `TimescaleDB (PostgreSQL extension) is ideal for your analytical workload. It provides SQL compatibility with time-series optimizations, making it perfect for complex queries and reporting on your ${dataVolume} of data.`;
    
  } else {
    // Default case - standard PostgreSQL
    databaseType = 'PostgreSQL';
    settings = `# PostgreSQL Configuration
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB
max_connections = 100
wal_buffers = 16MB
checkpoint_completion_target = 0.9

# Indexing strategy
CREATE INDEX CONCURRENTLY idx_data_points_timestamp ON data_points(timestamp);
CREATE INDEX CONCURRENTLY idx_data_points_source_tag ON data_points(source_id, tag_name);

# Partitioning (if needed)
-- Consider partitioning by time for large datasets`;

    justification = `PostgreSQL is a solid choice for your moderate data volume (${dataVolume}) and velocity (${dataVelocity}). It provides ACID compliance, excellent query performance, and supports JSON data types for flexible schema design.`;
  }
  
  return {
    suggestedDatabaseType: databaseType,
    suggestedSettings: settings,
    justification,
  };
}

// Helper function to extract numbers from strings like "1TB", "10,000 records/sec"
function extractNumber(str: string): number {
  const match = str.match(/[\d,]+/);
  if (!match) return 0;
  
  const num = parseInt(match[0].replace(/,/g, ''));
  
  // Apply multipliers for common units
  if (str.toLowerCase().includes('tb')) return num * 1000;
  if (str.toLowerCase().includes('gb')) return num;
  if (str.toLowerCase().includes('mb')) return num / 1000;
  if (str.toLowerCase().includes('k')) return num * 1000;
  
  return num;
}