import {defineConfig,devices} from '@playwright/test';
import {resolve} from 'node:path';
export default defineConfig({
 testDir:'./e2e',fullyParallel:false,workers:1,retries:0,timeout:60000,
 use:{baseURL:'http://localhost:5173',...devices['Desktop Chrome'],trace:'retain-on-failure'},
 webServer:[
  {command:'node --env-file=../.runtime/backend.env dist/src/server.js',cwd:resolve('backend'),url:'http://127.0.0.1:3000/api/ready',reuseExistingServer:false,timeout:30000},
  {command:'npm run preview -- --host 127.0.0.1 --port 5173 --strictPort',url:'http://localhost:5173',reuseExistingServer:false,timeout:30000}
 ]
});
