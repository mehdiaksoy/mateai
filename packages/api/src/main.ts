/**
 * MateAI REST API Server
 *
 * Main entry point for the NestJS application
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { loadConfig, getLogger } from '@mateai/core';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

const logger = getLogger();

async function bootstrap() {
  const config = loadConfig();

  // Create NestJS application
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // Enable CORS
  app.enableCors({
    origin: config.api?.corsOrigins || '*',
    credentials: true,
  });

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('MateAI REST API')
    .setDescription('Collective memory and AI agent API')
    .setVersion('0.1.0')
    .addTag('agent', 'AI Agent interactions')
    .addTag('memory', 'Memory search and retrieval')
    .addTag('health', 'System health and monitoring')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  // Start server
  const port = config.api?.port || 3000;
  await app.listen(port);

  logger.info(
    {
      port,
      environment: config.app.nodeEnv,
      docs: `http://localhost:${port}/api/docs`,
    },
    'MateAI API Server started'
  );
}

bootstrap().catch((error) => {
  logger.error({ error }, 'Failed to start server');
  process.exit(1);
});
