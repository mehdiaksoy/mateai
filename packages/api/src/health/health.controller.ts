/**
 * Health Controller
 *
 * System health and monitoring endpoints
 */

import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { getPrismaClient, loadConfig, getLogger } from '@mateai/core';

const logger = getLogger();

@ApiTags('health')
@Controller('health')
export class HealthController {
  /**
   * Basic health check
   */
  @Get()
  @ApiOperation({
    summary: 'Health check',
    description: 'Check if the API is running',
  })
  @ApiResponse({
    status: 200,
    description: 'API is healthy',
  })
  getHealth(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Detailed health check with dependencies
   */
  @Get('detailed')
  @ApiOperation({
    summary: 'Detailed health check',
    description: 'Check health of all system components',
  })
  @ApiResponse({
    status: 200,
    description: 'Detailed health information',
  })
  async getDetailedHealth(): Promise<{
    status: string;
    timestamp: string;
    version: string;
    uptime: number;
    components: {
      database: { status: string; message?: string };
      config: { status: string };
    };
  }> {
    loadConfig(); // Validate config loading
    const components = {
      database: { status: 'unknown', message: undefined as string | undefined },
      config: { status: 'ok' },
    };

    // Check database connection
    try {
      const prisma = getPrismaClient();
      await prisma.$queryRaw`SELECT 1`;
      components.database.status = 'ok';
    } catch (error) {
      logger.error({ error }, 'Database health check failed');
      components.database.status = 'error';
      components.database.message = error instanceof Error ? error.message : 'Unknown error';
    }

    return {
      status: components.database.status === 'ok' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      version: '0.1.0',
      uptime: process.uptime(),
      components,
    };
  }

  /**
   * Readiness probe for Kubernetes
   */
  @Get('ready')
  @ApiOperation({
    summary: 'Readiness check',
    description: 'Check if the API is ready to serve requests',
  })
  @ApiResponse({
    status: 200,
    description: 'API is ready',
  })
  @ApiResponse({
    status: 503,
    description: 'API is not ready',
  })
  async getReadiness(): Promise<{ ready: boolean }> {
    try {
      // Check database connection
      const prisma = getPrismaClient();
      await prisma.$queryRaw`SELECT 1`;

      return { ready: true };
    } catch (error) {
      logger.error({ error }, 'Readiness check failed');
      throw new Error('Service not ready');
    }
  }

  /**
   * Liveness probe for Kubernetes
   */
  @Get('live')
  @ApiOperation({
    summary: 'Liveness check',
    description: 'Check if the API process is alive',
  })
  @ApiResponse({
    status: 200,
    description: 'API is alive',
  })
  getLiveness(): { alive: boolean } {
    return { alive: true };
  }
}
