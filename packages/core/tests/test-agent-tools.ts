/**
 * Test Agent with Tools Access
 */

import { ClaudeSDKAgent } from '../src/agents/claude-sdk-agent';
import { MemoryRetrievalService } from '../src/memory/retrieval-service';
import { VectorStore } from '../src/memory/vector-store';
import { LLMClientManager } from '../src/llm';
import { loadConfig } from '../src/config';

async function testAgentTools() {
  console.log('🧪 Testing Agent with Tools Access\n');

  try {
    // Load config
    const config = loadConfig();

    // Initialize LLM clients
    const llmManager = new LLMClientManager(config.llm);
    const embeddingClient = llmManager.getClient(config.embedding.provider);

    // Initialize vector store
    const vectorStore = new VectorStore();

    // Initialize memory service
    const memoryService = new MemoryRetrievalService(vectorStore, embeddingClient);

    // Create agent
    const agent = new ClaudeSDKAgent(memoryService, {
      name: 'TestAgent',
      description: 'a test agent to verify tool access',
      model: 'sonnet',
    });

    console.log('✅ Agent initialized\n');

    // Test 1: Simple query without memory
    console.log('📝 Test 1: Simple query (no memory needed)');
    const result1 = await agent.process({
      prompt: 'What is 2+2? Just answer with the number.',
      includeMemoryContext: false,
    });
    console.log('Response:', result1.content.substring(0, 100));
    console.log('Duration:', result1.metadata.duration, 'ms\n');

    // Test 2: Query that should trigger tool usage
    console.log('📝 Test 2: Query that requires memory tools');
    const result2 = await agent.process({
      prompt: 'Use the search_memory tool to search for "test". What do you find?',
      includeMemoryContext: true,
    });
    console.log('Response:', result2.content.substring(0, 500));
    console.log('Duration:', result2.metadata.duration, 'ms');
    console.log('Steps:', result2.steps.length, '\n');

    console.log('✅ All tests completed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run test
testAgentTools().then(() => {
  console.log('\n🎉 Tests passed!');
  process.exit(0);
}).catch((error) => {
  console.error('\n💥 Tests failed:', error);
  process.exit(1);
});
