/**
 * Memory Controller
 *
 * REST endpoints for memory search and retrieval
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { MemoryService } from './memory.service';
import { SearchRequestDto, SearchResponseDto } from '../common/dto/query.dto';

@ApiTags('memory')
@Controller('memory')
export class MemoryController {
  constructor(private readonly memoryService: MemoryService) {}

  /**
   * Search memory with semantic search
   */
  @Post('search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Search memory',
    description: 'Perform semantic search on the knowledge base',
  })
  @ApiResponse({
    status: 200,
    description: 'Search completed successfully',
    type: SearchResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async search(@Body() dto: SearchRequestDto): Promise<SearchResponseDto> {
    return this.memoryService.search(dto);
  }

  /**
   * Get memory statistics
   */
  @Get('stats')
  @ApiOperation({
    summary: 'Get memory statistics',
    description: 'Get statistics about the knowledge base',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getStats(): Promise<{
    total: number;
    byTier: Record<string, number>;
    bySource: Record<string, number>;
  }> {
    return this.memoryService.getStats();
  }

  /**
   * Get recent events
   */
  @Get('recent')
  @ApiOperation({
    summary: 'Get recent events',
    description: 'Get the most recent events from the knowledge base',
  })
  @ApiQuery({
    name: 'sourceType',
    required: false,
    description: 'Filter by source type (e.g., slack, jira)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of results',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Recent events retrieved successfully',
  })
  async getRecent(
    @Query('sourceType') sourceType?: string,
    @Query('limit') limit?: number
  ): Promise<Array<{
    id: string;
    content: string;
    sourceType: string;
    metadata: Record<string, any>;
    createdAt: Date;
  }>> {
    return this.memoryService.getRecent(sourceType, limit);
  }
}
