import { type ChildProcess, execSync, spawn } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as net from 'node:net';
import * as path from 'node:path';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface ServiceProcess {
  process: ChildProcess;
  name: string;
  suppressOutput: () => void;
}

interface ServiceConfig {
  name: string;
  filter: string;
  command: string;
  healthCheckUrl: string;
  env?: Record<string, string>;
}

const services: ServiceProcess[] = [];

function getPortFromUrl(url: string): number | null {
  try {
    const urlObj = new URL(url);
    return Number(urlObj.port) || (urlObj.protocol === 'https:' ? 443 : 80);
  } catch {
    return null;
  }
}

async function checkAndKillPort(port: number): Promise<void> {
  try {
    // Check if port is in use on Linux/Mac
    const command = `lsof -ti:${port}`;
    const pids = execSync(command, { encoding: 'utf-8' }).trim();

    if (pids) {
      console.log(`   ⚠️  Port ${port} is in use, killing process(es): ${pids.split('\n').join(', ')}`);
      // Kill the processes
      execSync(`kill -9 ${pids.split('\n').join(' ')}`, { stdio: 'ignore' });
      // Wait a bit for port to be freed
      await sleep(1000);
      console.log(`   ✓ Port ${port} is now available`);
    }
  } catch {
    // Port is not in use or lsof failed (which is fine)
  }
}

async function verifyPortIsFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(true);
      }
    });

    server.once('listening', () => {
      server.close();
      resolve(true);
    });

    server.listen(port, '0.0.0.0');
  });
}

async function ensurePortsAvailable(serviceConfigs: ServiceConfig[]): Promise<void> {
  console.log('🔍 Checking port availability...\n');

  for (const config of serviceConfigs) {
    const port = getPortFromUrl(config.healthCheckUrl);
    if (port) {
      await checkAndKillPort(port);

      // Double-check that port is actually free by trying to bind to it
      const isFree = await verifyPortIsFree(port);
      if (!isFree) {
        console.error(`Port ${port} is still in use after cleanup attempt!`);
        console.error(
          `Try running: sudo netstat -tulpn | grep :3000 | awk '{print $7}' | cut -d'/' -f1 | xargs kill -9`,
        );
        throw new Error(`Port ${port} is in use and could not be freed`);
      }
    }
  }
}

async function waitForService(url: string, serviceName: string, timeout: number = 120000): Promise<boolean> {
  const startTime = Date.now();
  let attemptCount = 0;

  while (Date.now() - startTime < timeout) {
    try {
      attemptCount++;
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10000), // 10 second timeout per request
      });
      if (response.ok) {
        return true;
      }
      // Log non-ok responses occasionally
      if (attemptCount % 10 === 0) {
        console.log(`   ${serviceName}: Still waiting (status: ${response.status})...`);
      }
    } catch {
      // Service not ready yet - only log occasionally to reduce noise
      if (attemptCount % 10 === 0) {
        console.log(`   ${serviceName}: Still waiting (attempt ${attemptCount})...`);
      }
    }
    await sleep(2000); // Check every 2 seconds
  }
  return false;
}

async function cleanupServices() {
  if (services.length === 0) return;
  console.log('Cleaning up services...');

  const killPromises = services.map((service) => {
    return new Promise<void>((resolve) => {
      try {
        if (service.process.killed) {
          resolve();
          return;
        }
        service.process.kill('SIGTERM');
        // Wait a bit for graceful shutdown
        setTimeout(() => {
          if (!service.process.killed) {
            service.process.kill('SIGKILL');
          }
          console.log(`   Stopped ${service.name}`);
          resolve();
        }, 2000);
      } catch (error) {
        console.error(`   Failed to stop ${service.name}:`, error);
        resolve();
      }
    });
  });
  await Promise.all(killPromises);
}

async function startService(config: ServiceConfig, projectRoot: string): Promise<void> {
  console.log(`📦 Starting ${config.name} service...`);

  // Special handling for mock-server - run directly without pnpm filter
  const isDirectCommand = config.command.startsWith('tsx ');
  let serviceProcess: ChildProcess;

  if (isDirectCommand) {
    const [cmd, ...args] = config.command.split(' ');
    const workingDir = path.join(projectRoot, 'e2e');
    serviceProcess = spawn(cmd, args, {
      cwd: workingDir,
      stdio: 'pipe',
      env: { ...process.env, ...config.env },
    });
  } else {
    serviceProcess = spawn('pnpm', ['--filter', config.filter, 'run', config.command], {
      cwd: projectRoot,
      stdio: 'pipe',
      env: { ...process.env, ...config.env },
    });
  }

  const serviceName = config.name.charAt(0).toUpperCase() + config.name.slice(1);

  // Flag to suppress output during cleanup
  let suppressOutput = false;

  serviceProcess.stdout?.on('data', (data) => {
    if (!suppressOutput) {
      process.stdout.write(`[${serviceName}] ${data}`);
    }
  });

  serviceProcess.stderr?.on('data', (data) => {
    if (!suppressOutput) {
      process.stderr.write(`[${serviceName}] ${data}`);
    }
  });

  // Store the service with a method to suppress output
  services.push({
    process: serviceProcess,
    name: config.name,
    suppressOutput: () => {
      suppressOutput = true;
    },
  });
}

function parseServiceArguments(): string[] {
  // Get services from command line arguments
  // Usage: pnpm run e2e -- frontend backend
  // or: pnpm run e2e (starts all services)
  const args = process.argv.slice(2);

  // Filter out any flags or options
  const services = args.filter((arg) => !arg.startsWith('-'));

  return services;
}

async function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const e2eDir = __dirname;

  // Define all available service configurations
  // Service addresses are received from environment variables
  const frontendPort = process.env.FRONTEND_PORT ?? '3000';
  const frontendHost = process.env.FRONTEND_HOST ?? 'localhost';
  const backendPort = process.env.BACKEND_PORT ?? '4000';
  const backendHost = process.env.BACKEND_HOST ?? 'localhost';
  const mockServerPort = process.env.MOCK_SERVER_PORT ?? '5000';
  const mockServerHost = process.env.MOCK_SERVER_HOST ?? 'localhost';

  const allServiceConfigs: ServiceConfig[] = [
    {
      name: 'mock-server',
      filter: 'e2e',
      command: 'tsx mock-server.ts',
      healthCheckUrl: `http://${mockServerHost}:${mockServerPort}/posts`,
      env: {
        MOCK_SERVER_PORT: mockServerPort,
      },
    },
    {
      name: 'backend',
      filter: 'backend',
      command: 'dev',
      healthCheckUrl: `http://${backendHost}:${backendPort}`,
      env: {
        PORT: backendPort,
        HOST: backendHost,
        JSONPLACEHOLDER_URL: `http://${mockServerHost}:${mockServerPort}`,
      },
    },
    {
      name: 'frontend',
      filter: 'frontend',
      command: 'dev',
      healthCheckUrl: `http://${frontendHost}:${frontendPort}`,
      env: {
        PORT: frontendPort,
        HOST: frontendHost,
      },
    },
  ];

  // Parse which services to start from command line
  const requestedServices = parseServiceArguments();

  // If no services specified, start all
  const serviceConfigs =
    requestedServices.length > 0
      ? allServiceConfigs.filter((config) => requestedServices.includes(config.name))
      : allServiceConfigs;

  // Validate requested services exist
  if (requestedServices.length > 0) {
    const availableServices = allServiceConfigs.map((c) => c.name);
    const unknownServices = requestedServices.filter((s) => !availableServices.includes(s));

    if (unknownServices.length > 0) {
      console.error(`❌ Unknown service(s): ${unknownServices.join(', ')}`);
      console.error(`   Available services: ${availableServices.join(', ')}`);
      process.exit(1);
    }
  }

  if (serviceConfigs.length === 0) {
    console.error('❌ No services to start');
    process.exit(1);
  }

  console.log(`📋 Services to start: ${serviceConfigs.map((c) => c.name).join(', ')}\n`);

  try {
    // 1. Ensure ports are available
    await ensurePortsAvailable(serviceConfigs);

    // 2. Start requested services
    for (const serviceConfig of serviceConfigs) {
      await startService(serviceConfig, projectRoot);
      // Give service a moment to initialize before starting next one
      await sleep(1000);
    }

    // 3. Wait for all services to be ready
    console.log('\n⏳ Waiting for services to be ready...');
    for (const serviceConfig of serviceConfigs) {
      const ready = await waitForService(serviceConfig.healthCheckUrl, serviceConfig.name);
      if (!ready) {
        throw new Error(`${serviceConfig.name} service failed to start within timeout`);
      }
      console.log(`   ✓ ${serviceConfig.name} is ready`);
    }

    console.log('\n✅ All services are ready!\n');

    // 4. Run Playwright tests
    console.log('🧪 Running Playwright tests...\n');
    const playwrightProcess = spawn('pnpm', ['--filter', 'e2e', 'run', 'test'], {
      cwd: projectRoot,
      stdio: 'inherit',
      env: {
        ...process.env,
        BACKEND_URL: `http://${backendHost}:${backendPort}`,
        FRONTEND_URL: `http://${frontendHost}:${frontendPort}`,
      },
    });

    const playwrightExitCode = await new Promise<number>((resolve) => {
      playwrightProcess.on('close', (code) => {
        resolve(code ?? 0);
      });
    });

    // 5. Find and return HTML report
    const reportPath = path.join(e2eDir, 'playwright-report', 'index.html');
    try {
      await fs.access(reportPath);
      console.log(`\n📊 HTML Report generated at: ${reportPath}`);
      console.log(`\nTo view the report, run: pnpm --filter e2e run report`);
    } catch (error) {
      console.error(error);
      console.warn(`\n⚠️  Warning: HTML report not found at ${reportPath}`);
    }

    // Exit with playwright's exit code
    const exitCode = playwrightExitCode;
    await cleanupServices();
    process.exit(exitCode);
  } catch (error) {
    console.error('\n❌ Error during E2E test execution:', error);
    await cleanupServices();
    process.exit(1);
  }
}

let cleanupInProgress = false;

async function handleSignal() {
  if (cleanupInProgress) return;
  cleanupInProgress = true;
  console.log('\n\n⚠️  Received termination signal, cleaning up...');
  await cleanupServices();
  process.exit(1);
}

// Handle process termination
process.on('SIGINT', handleSignal);
process.on('SIGTERM', handleSignal);

main();
