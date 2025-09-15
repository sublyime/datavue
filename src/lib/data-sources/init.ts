// src/lib/data-sources/init.ts
import { DataSourceManager } from './manager';

let isInitialized = false;
let initPromise: Promise<void> | null = null;

export async function initializeDataSourceManager(): Promise<void> {
    // Prevent multiple initializations
    if (isInitialized) {
        return;
    }
    
    if (initPromise) {
        return initPromise;
    }

    initPromise = (async () => {
        try {
            console.log('🚀 Initializing DataVue Data Source Manager...');
            const manager = DataSourceManager.getInstance();
            await manager.initialize();
            
            isInitialized = true;
            console.log('✅ DataVue Data Source Manager ready');
        } catch (error) {
            console.error('❌ Failed to initialize DataVue Data Source Manager:', error);
            initPromise = null; // Allow retry
            throw error;
        }
    })();

    return initPromise;
}

export function getDataSourceManager(): DataSourceManager {
    if (!isInitialized) {
        throw new Error('DataSourceManager not initialized. Call initializeDataSourceManager() first.');
    }
    return DataSourceManager.getInstance();
}

// Auto-initialize for server-side usage
if (typeof window === 'undefined') {
    initializeDataSourceManager().catch(console.error);
}
