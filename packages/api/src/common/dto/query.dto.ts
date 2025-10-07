/**
 * Query DTOs
 *
 * Data transfer objects for API requests and responses
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber, Min, Max } from 'class-validator';

/**
 * Request DTO for agent query
 */
export class QueryRequestDto {
  @ApiProperty({
    description: 'User query or question',
    example: 'What did the team discuss about API authentication?',
  })
  @IsString()
  @IsNotEmpty()
  query: string;

  @ApiPropertyOptional({
    description: 'User ID for tracking conversations',
    example: 'user_123',
  })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Include memory context in the response',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  includeMemoryContext?: boolean;
}

/**
 * Response DTO for agent query
 */
export class QueryResponseDto {
  @ApiProperty({
    description: 'Agent response text',
    example: 'Based on the team discussions...',
  })
  response: string;

  @ApiProperty({
    description: 'Processing duration in milliseconds',
    example: 1500,
  })
  durationMs: number;

  @ApiProperty({
    description: 'Number of steps taken by the agent',
    example: 3,
  })
  steps: number;

  @ApiPropertyOptional({
    description: 'Retrieved chunks used for context',
    type: [Object],
  })
  retrievedChunks?: Array<{
    id: string;
    content: string;
    similarity: number;
    sourceType: string;
  }>;
}

/**
 * Request DTO for memory search
 */
export class SearchRequestDto {
  @ApiProperty({
    description: 'Search query',
    example: 'authentication JWT OAuth2',
  })
  @IsString()
  @IsNotEmpty()
  query: string;

  @ApiPropertyOptional({
    description: 'Maximum number of results',
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({
    description: 'Minimum similarity threshold (0-1)',
    default: 0.7,
    minimum: 0,
    maximum: 1,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  minSimilarity?: number;

  @ApiPropertyOptional({
    description: 'Filter by source types',
    example: ['slack', 'jira'],
    type: [String],
  })
  @IsOptional()
  sourceTypes?: string[];
}

/**
 * Response DTO for memory search
 */
export class SearchResponseDto {
  @ApiProperty({
    description: 'Search results',
    type: [Object],
  })
  results: Array<{
    id: string;
    content: string;
    similarity: number;
    sourceType: string;
    metadata: Record<string, any>;
    createdAt: Date;
  }>;

  @ApiProperty({
    description: 'Total number of results',
    example: 5,
  })
  total: number;

  @ApiProperty({
    description: 'Search duration in milliseconds',
    example: 250,
  })
  durationMs: number;
}
