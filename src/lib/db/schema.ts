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

// Data source templates table
export const dataSourceTemplates = pgTable('data_source_templates', {
  id: varchar('id', { length: 100 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  manufacturer: varchar('manufacturer', { length: 255 }),
  model: varchar('model', { length: 255 }),
  type: varchar('type', { length: 50 }).notNull(),
  supportedInterfaces: jsonb('supported_interfaces').notNull(),
  supportedProtocols: jsonb('supported_protocols').notNull(),
  defaultConfig: jsonb('default_config').notNull().default({}),
  documentation: text('documentation'),
  icon: varchar('icon', { length: 255 }),
  isSystem: boolean('is_system').notNull().default(false),
  userId: integer('user_id').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  typeIdx: index('data_source_templates_type_idx').on(table.type),
  userIdIdx: index('data_source_templates_user_id_idx').on(table.userId),
}));

// Updated data sources configuration with interface/protocol separation
export const dataSources = pgTable('data_sources', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  interfaceType: varchar('interface_type', { length: 50 }).notNull(),
  interfaceConfig: jsonb('interface_config').notNull().default({}),
  protocolType: varchar('protocol_type', { length: 50 }).notNull(),
  protocolConfig: jsonb('protocol_config').notNull().default({}),
  dataSourceType: varchar('data_source_type', { length: 50 }).notNull(),
  templateId: varchar('template_id', { length: 100 }).references(() => dataSourceTemplates.id),
  customConfig: jsonb('custom_config').default({}),
  isActive: boolean('is_active').notNull().default(true),
  userId: integer('user_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('data_sources_user_id_idx').on(table.userId),
  interfaceTypeIdx: index('data_sources_interface_type_idx').on(table.interfaceType),
  protocolTypeIdx: index('data_sources_protocol_type_idx').on(table.protocolType),
  dataSourceTypeIdx: index('data_sources_data_source_type_idx').on(table.dataSourceType),
  templateIdIdx: index('data_sources_template_id_idx').on(table.templateId),
}));

// Data points - the actual time-series data
export const dataPoints = pgTable('data_points', {
  id: serial('id').primaryKey(),
  sourceId: integer('source_id').notNull().references(() => dataSources.id, { onDelete: 'cascade' }),
  tagName: varchar('tag_name', { length: 255 }).notNull(),
  value: jsonb('value').notNull(),
  quality: integer('quality').notNull().default(192),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  location: jsonb('location'),
  metadata: jsonb('metadata'),
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
  type: varchar('type', { length: 50 }).notNull(),
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
  action: varchar('action', { length: 50 }).notNull(),
  resource: varchar('resource', { length: 50 }).notNull(),
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
  tags: jsonb('tags').default({}),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
}, (table) => ({
  metricNameIdx: index('system_metrics_metric_name_idx').on(table.metricName),
  timestampIdx: index('system_metrics_timestamp_idx').on(table.timestamp),
}));

// Export types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type DataSourceTemplate = typeof dataSourceTemplates.$inferSelect;
export type NewDataSourceTemplate = typeof dataSourceTemplates.$inferInsert;
export type DataSource = typeof dataSources.$inferSelect;
export type NewDataSource = typeof dataSources.$inferInsert;
export type DataPoint = typeof dataPoints.$inferSelect;
export type NewDataPoint = typeof dataPoints.$inferInsert;
export type StorageConfig = typeof storageConfigs.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
