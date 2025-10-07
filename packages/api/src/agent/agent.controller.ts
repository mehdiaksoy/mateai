/**
 * Agent Controller
 *
 * REST endpoints for AI agent interactions
 */

import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AgentService } from './agent.service';
import { QueryRequestDto, QueryResponseDto } from '../common/dto/query.dto';

@ApiTags('agent')
@Controller('agent')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  /**
   * Query the AI agent
   */
  @Post('query')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Query the AI agent',
    description: 'Send a query to the AI agent and get a response based on the team\'s collective knowledge',
  })
  @ApiResponse({
    status: 200,
    description: 'Query processed successfully',
    type: QueryResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async query(@Body() dto: QueryRequestDto): Promise<QueryResponseDto> {
    return this.agentService.query(dto);
  }
}
