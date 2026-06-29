import { config } from 'dotenv';
import { resolve } from 'path';

// Load nearest .env file from script context
config({ path: resolve(__dirname, '../../.env') });
config({ path: resolve(__dirname, '../.env') });

const BACKEND_URL = process.env.PUBLIC_BACKEND_URL || 'https://pexih-backend.vercel.app';

async function runCron() {
  console.log('⏳ CRON JOB INITIATED: Synchronizing edge cache & automated scheduling pipeline...');
  
  try {
    const url = `${BACKEND_URL}/api/admin/scheduler/run`;
    console.log(`> Ping to core endpoint: POST ${url}`);
    
    // Using standard global fetch
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-admin-token': 'yondaime-admin-token-13579'
      }
    });

    const data = await response.json().catch(() => ({}));
    
    if (response.ok && data.success) {
      console.log('✅ CRON SUCCESS: Cache flush and asynchronous jobs executed properly!');
      console.log('   Report:', JSON.stringify(data, null, 2));
      process.exit(0);
    } else {
      console.error('❌ CRON WARNING: Endpoint responded but rejected the execution.', response.status, data);
      process.exit(1);
    }
  } catch (error: any) {
    console.error('❌ CRON ERROR: Failed to execute automated cache purge.');
    console.error('   Details:', error.message);
    process.exit(1);
  }
}

// Execute the cron job autonomously
runCron();
