// src/lib/db/schema.ts
import { 
  pgTable, 
  serial, 
  varchar, 
  text, 
  boolean, 
  timestamp, 
  integer, 
  jsonb,
  real,
  index
} from 'drizzle-orm/pg-core';

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull().default('USER'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Sessions table
export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Data sources configuration
export const dataSources = pgTable('data_sources', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // SERIAL, TCP, UDP, API, etc.
  protocol: varchar('protocol', { length: 50 }).notNull(), // MODBUS, MQTT, NMEA, etc.
  config: jsonb('config').notNull().default({}), // Protocol-specific configuration
  isActive: boolean('is_active').notNull().default(true),
  userId: integer('user_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('data_sources_user_id_idx').on(table.userId),
  typeIdx: index('data_sources_type_idx').on(table.type),
  protocolIdx: index('data_sources_protocol_idx').on(table.protocol),
}));

// Data points - the actual time-series data
export const dataPoints = pgTable('data_points', {
  id: serial('id').primaryKey(),
  sourceId: integer('source_id').notNull().references(() => dataSources.id, { onDelete: 'cascade' }),
  tagName: varchar('tag_name', { length: 255 }).notNull(), // The variable/sensor name
  value: jsonb('value').notNull(), // The actual value (can be any type)
  quality: integer('quality').notNull().default(192), // OPC-style quality code
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  location: jsonb('location'), // Optional GPS coordinates
  metadata: jsonb('metadata'), // Additional metadata
}, (table) => ({
  sourceIdIdx: index('data_points_source_id_idx').on(table.sourceId),
  tagNameIdx: index('data_points_tag_name_idx').on(table.tagName),
  timestampIdx: index('data_points_timestamp_idx').on(table.timestamp),
  sourceTagTimeIdx: index('data_points_source_tag_time_idx').on(
    table.sourceId, 
    table.tagName, 
    table.timestamp
  ),
}));

// Storage configurations
export const storageConfigs = pgTable('storage_configs', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // POSTGRESQL, INFLUXDB, MONGODB, etc.
  config: jsonb('config').notNull().default({}),
  isDefault: boolean('is_default').notNull().default(false),
  userId: integer('user_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Audit log for tracking changes
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  action: varchar('action', { length: 50 }).notNull(), // CREATE, UPDATE, DELETE, START, STOP
  resource: varchar('resource', { length: 50 }).notNull(), // data_source, user, etc.
  resourceId: integer('resource_id'),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('audit_logs_user_id_idx').on(table.userId),
  resourceIdx: index('audit_logs_resource_idx').on(table.resource, table.resourceId),
  timestampIdx: index('audit_logs_timestamp_idx').on(table.timestamp),
}));

// System metrics for monitoring
export const systemMetrics = pgTable('system_metrics', {
  id: serial('id').primaryKey(),
  metricName: varchar('metric_name', { length: 100 }).notNull(),
  value: real('value').notNull(),
  unit: varchar('unit', { length: 20 }),
  tags: jsonb('tags').default({}), // Additional dimensions
  timestamp: timestamp('timestamp').notNull().defaultNow(),
}, (table) => ({
  metricNameIdx: index('system_metrics_metric_name_idx').on(table.metricName),
  timestampIdx: index('system_metrics_timestamp_idx').on(table.timestamp),
}));

// Export types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type DataSource = typeof dataSources.$inferSelect;
export type NewDataSource = typeof dataSources.$inferInsert;
export type DataPoint = typeof dataPoints.$inferSelect;
export type NewDataPoint = typeof dataPoints.$inferInsert;
export type StorageConfig = typeof storageConfigs.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;