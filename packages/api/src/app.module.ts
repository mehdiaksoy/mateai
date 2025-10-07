/**
 * App Module
 *
 * Root module for the NestJS application
 */

import { Module } from '@nestjs/common';
import { AgentModule } from './agent/agent.module';
import { MemoryModule } from './memory/memory.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [AgentModule, MemoryModule, HealthModule],
})
export class AppModule {}
