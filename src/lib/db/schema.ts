import { pgTable, text, serial, integer, boolean, jsonb, timestamp, varchar, pgEnum } from 'drizzle-orm/pg-core';

// Enum for data source types
export const dataSourceTypeEnum = pgEnum('data_source_type', [
  'SERIAL', 'USB', 'FILE', 'TCP', 'UDP', 'API', 'MODBUS', 'OPC', 'MQTT', 'NMEA', 'HART', 'ANALOG'
]);

// Enum for protocol types
export const protocolTypeEnum = pgEnum('protocol_type', [
  'OSI_PI', 'OPC', 'MODBUS', 'MQTT', 'NMEA', 'HART', 'ANALOG_4_20mA', 'ANALOG_0_5V', 'CUSTOM'
]);

// Enum for storage types
export const storageTypeEnum = pgEnum('storage_type', [
  'POSTGRESQL', 'MYSQL', 'MONGODB', 'SQLSERVER', 'SQLITE',
  'AZURE_BLOB', 'AWS_S3', 'GOOGLE_CLOUD_STORAGE', 'FIRESTORE', 'TIMESCALE'
]);

// User roles enum
export const userRoleEnum = pgEnum('user_role', [
  'ADMIN',
  'USER',
  'VIEWER',
  'OPERATOR'
]);

// Users table - SINGLE DEFINITION
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  role: userRoleEnum('role').notNull().default('USER'),
  isActive: boolean('is_active').notNull().default(true),
  lastLogin: timestamp('last_login'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Data sources configuration
export const dataSources = pgTable('data_sources', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  type: dataSourceTypeEnum('type').notNull(),
  protocol: protocolTypeEnum('protocol').notNull(),
  config: jsonb('config').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  userId: integer('user_id').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Storage configurations
export const storageConfigs = pgTable('storage_configs', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  type: storageTypeEnum('type').notNull(),
  config: jsonb('config').notNull(),
  isDefault: boolean('is_default').notNull().default(false),
  userId: integer('user_id').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Data points table
export const dataPoints = pgTable('data_points', {
  id: serial('id').primaryKey(),
  sourceId: integer('source_id').references(() => dataSources.id),
  tagName: varchar('tag_name', { length: 255 }).notNull(),
  value: jsonb('value').notNull(),
  quality: integer('quality').notNull().default(0),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  location: jsonb('location'),
  metadata: jsonb('metadata'),
});

// Data point metadata
export const dataPointMetadata = pgTable('data_point_metadata', {
  id: serial('id').primaryKey(),
  dataPointId: integer('data_point_id').references(() => dataPoints.id),
  key: varchar('key', { length: 255 }).notNull(),
  value: jsonb('value').notNull(),
});

// User sessions for authentication - SINGLE DEFINITION
export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// User permissions
export const userPermissions = pgTable('user_permissions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  resource: varchar('resource', { length: 255 }).notNull(),
  action: varchar('action', { length: 50 }).notNull(),
  conditions: jsonb('conditions'),
});