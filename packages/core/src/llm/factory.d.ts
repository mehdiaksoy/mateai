import type { LLMClient, LLMProviderType } from './types';
import type { LLMConfig } from '../config';
export declare function createLLMClient(provider: LLMProviderType, config: LLMConfig): LLMClient;
export declare class LLMClientManager {
    private clients;
    private defaultProvider;
    constructor(config: LLMConfig);
    getClient(provider?: LLMProviderType): LLMClient;
    getClientWithFallback(preferredProvider?: LLMProviderType): Promise<LLMClient>;
    getAvailableProviders(): LLMProviderType[];
    hasProvider(provider: LLMProviderType): boolean;
}
//# sourceMappingURL=factory.d.ts.map