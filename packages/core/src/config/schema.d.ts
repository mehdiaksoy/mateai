import { z } from 'zod';
export declare const LLMProviderSchema: z.ZodEnum<["anthropic", "openai", "google"]>;
export type LLMProvider = z.infer<typeof LLMProviderSchema>;
export declare const NodeEnvSchema: z.ZodEnum<["development", "production", "test"]>;
export type NodeEnv = z.infer<typeof NodeEnvSchema>;
export declare const LogLevelSchema: z.ZodEnum<["debug", "info", "warn", "error"]>;
export type LogLevel = z.infer<typeof LogLevelSchema>;
export declare const DatabaseConfigSchema: z.ZodObject<{
    url: z.ZodString;
    maxConnections: z.ZodDefault<z.ZodNumber>;
    connectionTimeout: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    url: string;
    maxConnections: number;
    connectionTimeout: number;
}, {
    url: string;
    maxConnections?: number | undefined;
    connectionTimeout?: number | undefined;
}>;
export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>;
export declare const RedisConfigSchema: z.ZodObject<{
    host: z.ZodDefault<z.ZodString>;
    port: z.ZodDefault<z.ZodNumber>;
    password: z.ZodOptional<z.ZodString>;
    db: z.ZodDefault<z.ZodNumber>;
    maxRetriesPerRequest: z.ZodDefault<z.ZodNullable<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    host: string;
    port: number;
    db: number;
    maxRetriesPerRequest: number | null;
    password?: string | undefined;
}, {
    host?: string | undefined;
    port?: number | undefined;
    password?: string | undefined;
    db?: number | undefined;
    maxRetriesPerRequest?: number | null | undefined;
}>;
export type RedisConfig = z.infer<typeof RedisConfigSchema>;
export declare const LLMConfigSchema: z.ZodObject<{
    defaultProvider: z.ZodDefault<z.ZodEnum<["anthropic", "openai", "google"]>>;
    anthropic: z.ZodObject<{
        apiKey: z.ZodString;
        model: z.ZodDefault<z.ZodString>;
        maxTokens: z.ZodDefault<z.ZodNumber>;
        temperature: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        apiKey: string;
        model: string;
        maxTokens: number;
        temperature: number;
    }, {
        apiKey: string;
        model?: string | undefined;
        maxTokens?: number | undefined;
        temperature?: number | undefined;
    }>;
    openai: z.ZodObject<{
        apiKey: z.ZodOptional<z.ZodString>;
        model: z.ZodDefault<z.ZodString>;
        maxTokens: z.ZodDefault<z.ZodNumber>;
        temperature: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        model: string;
        maxTokens: number;
        temperature: number;
        apiKey?: string | undefined;
    }, {
        apiKey?: string | undefined;
        model?: string | undefined;
        maxTokens?: number | undefined;
        temperature?: number | undefined;
    }>;
    google: z.ZodObject<{
        apiKey: z.ZodOptional<z.ZodString>;
        model: z.ZodDefault<z.ZodString>;
        maxTokens: z.ZodDefault<z.ZodNumber>;
        temperature: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        model: string;
        maxTokens: number;
        temperature: number;
        apiKey?: string | undefined;
    }, {
        apiKey?: string | undefined;
        model?: string | undefined;
        maxTokens?: number | undefined;
        temperature?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    anthropic: {
        apiKey: string;
        model: string;
        maxTokens: number;
        temperature: number;
    };
    openai: {
        model: string;
        maxTokens: number;
        temperature: number;
        apiKey?: string | undefined;
    };
    google: {
        model: string;
        maxTokens: number;
        temperature: number;
        apiKey?: string | undefined;
    };
    defaultProvider: "anthropic" | "openai" | "google";
}, {
    anthropic: {
        apiKey: string;
        model?: string | undefined;
        maxTokens?: number | undefined;
        temperature?: number | undefined;
    };
    openai: {
        apiKey?: string | undefined;
        model?: string | undefined;
        maxTokens?: number | undefined;
        temperature?: number | undefined;
    };
    google: {
        apiKey?: string | undefined;
        model?: string | undefined;
        maxTokens?: number | undefined;
        temperature?: number | undefined;
    };
    defaultProvider?: "anthropic" | "openai" | "google" | undefined;
}>;
export type LLMConfig = z.infer<typeof LLMConfigSchema>;
export declare const EmbeddingConfigSchema: z.ZodObject<{
    provider: z.ZodDefault<z.ZodEnum<["anthropic", "openai", "google"]>>;
    model: z.ZodDefault<z.ZodString>;
    dimensions: z.ZodDefault<z.ZodNumber>;
    batchSize: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    model: string;
    provider: "anthropic" | "openai" | "google";
    dimensions: number;
    batchSize: number;
}, {
    model?: string | undefined;
    provider?: "anthropic" | "openai" | "google" | undefined;
    dimensions?: number | undefined;
    batchSize?: number | undefined;
}>;
export type EmbeddingConfig = z.infer<typeof EmbeddingConfigSchema>;
export declare const AppConfigSchema: z.ZodObject<{
    nodeEnv: z.ZodDefault<z.ZodEnum<["development", "production", "test"]>>;
    port: z.ZodDefault<z.ZodNumber>;
    logLevel: z.ZodDefault<z.ZodEnum<["debug", "info", "warn", "error"]>>;
}, "strip", z.ZodTypeAny, {
    port: number;
    nodeEnv: "development" | "production" | "test";
    logLevel: "error" | "debug" | "info" | "warn";
}, {
    port?: number | undefined;
    nodeEnv?: "development" | "production" | "test" | undefined;
    logLevel?: "error" | "debug" | "info" | "warn" | undefined;
}>;
export type AppConfig = z.infer<typeof AppConfigSchema>;
export declare const ApiConfigSchema: z.ZodObject<{
    port: z.ZodDefault<z.ZodNumber>;
    corsOrigins: z.ZodDefault<z.ZodString>;
    rateLimit: z.ZodOptional<z.ZodObject<{
        windowMs: z.ZodDefault<z.ZodNumber>;
        max: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        windowMs: number;
        max: number;
    }, {
        windowMs?: number | undefined;
        max?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    port: number;
    corsOrigins: string;
    rateLimit?: {
        windowMs: number;
        max: number;
    } | undefined;
}, {
    port?: number | undefined;
    corsOrigins?: string | undefined;
    rateLimit?: {
        windowMs?: number | undefined;
        max?: number | undefined;
    } | undefined;
}>;
export type ApiConfig = z.infer<typeof ApiConfigSchema>;
export declare const SlackConfigSchema: z.ZodEffects<z.ZodObject<{
    botToken: z.ZodOptional<z.ZodString>;
    appToken: z.ZodOptional<z.ZodString>;
    signingSecret: z.ZodOptional<z.ZodString>;
    enabled: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    enabled: boolean;
    botToken?: string | undefined;
    appToken?: string | undefined;
    signingSecret?: string | undefined;
}, {
    botToken?: string | undefined;
    appToken?: string | undefined;
    signingSecret?: string | undefined;
    enabled?: boolean | undefined;
}>, {
    enabled: boolean;
    botToken?: string | undefined;
    appToken?: string | undefined;
    signingSecret?: string | undefined;
}, {
    botToken?: string | undefined;
    appToken?: string | undefined;
    signingSecret?: string | undefined;
    enabled?: boolean | undefined;
}>;
export type SlackConfig = z.infer<typeof SlackConfigSchema>;
export declare const JiraConfigSchema: z.ZodEffects<z.ZodObject<{
    host: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    apiToken: z.ZodOptional<z.ZodString>;
    enabled: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    enabled: boolean;
    host?: string | undefined;
    email?: string | undefined;
    apiToken?: string | undefined;
}, {
    host?: string | undefined;
    enabled?: boolean | undefined;
    email?: string | undefined;
    apiToken?: string | undefined;
}>, {
    enabled: boolean;
    host?: string | undefined;
    email?: string | undefined;
    apiToken?: string | undefined;
}, {
    host?: string | undefined;
    enabled?: boolean | undefined;
    email?: string | undefined;
    apiToken?: string | undefined;
}>;
export type JiraConfig = z.infer<typeof JiraConfigSchema>;
export declare const GitHubConfigSchema: z.ZodEffects<z.ZodObject<{
    token: z.ZodOptional<z.ZodString>;
    webhookSecret: z.ZodOptional<z.ZodString>;
    enabled: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    enabled: boolean;
    token?: string | undefined;
    webhookSecret?: string | undefined;
}, {
    enabled?: boolean | undefined;
    token?: string | undefined;
    webhookSecret?: string | undefined;
}>, {
    enabled: boolean;
    token?: string | undefined;
    webhookSecret?: string | undefined;
}, {
    enabled?: boolean | undefined;
    token?: string | undefined;
    webhookSecret?: string | undefined;
}>;
export type GitHubConfig = z.infer<typeof GitHubConfigSchema>;
export declare const ConfigSchema: z.ZodObject<{
    app: z.ZodObject<{
        nodeEnv: z.ZodDefault<z.ZodEnum<["development", "production", "test"]>>;
        port: z.ZodDefault<z.ZodNumber>;
        logLevel: z.ZodDefault<z.ZodEnum<["debug", "info", "warn", "error"]>>;
    }, "strip", z.ZodTypeAny, {
        port: number;
        nodeEnv: "development" | "production" | "test";
        logLevel: "error" | "debug" | "info" | "warn";
    }, {
        port?: number | undefined;
        nodeEnv?: "development" | "production" | "test" | undefined;
        logLevel?: "error" | "debug" | "info" | "warn" | undefined;
    }>;
    api: z.ZodOptional<z.ZodObject<{
        port: z.ZodDefault<z.ZodNumber>;
        corsOrigins: z.ZodDefault<z.ZodString>;
        rateLimit: z.ZodOptional<z.ZodObject<{
            windowMs: z.ZodDefault<z.ZodNumber>;
            max: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            windowMs: number;
            max: number;
        }, {
            windowMs?: number | undefined;
            max?: number | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        port: number;
        corsOrigins: string;
        rateLimit?: {
            windowMs: number;
            max: number;
        } | undefined;
    }, {
        port?: number | undefined;
        corsOrigins?: string | undefined;
        rateLimit?: {
            windowMs?: number | undefined;
            max?: number | undefined;
        } | undefined;
    }>>;
    database: z.ZodObject<{
        url: z.ZodString;
        maxConnections: z.ZodDefault<z.ZodNumber>;
        connectionTimeout: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        url: string;
        maxConnections: number;
        connectionTimeout: number;
    }, {
        url: string;
        maxConnections?: number | undefined;
        connectionTimeout?: number | undefined;
    }>;
    redis: z.ZodObject<{
        host: z.ZodDefault<z.ZodString>;
        port: z.ZodDefault<z.ZodNumber>;
        password: z.ZodOptional<z.ZodString>;
        db: z.ZodDefault<z.ZodNumber>;
        maxRetriesPerRequest: z.ZodDefault<z.ZodNullable<z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        host: string;
        port: number;
        db: number;
        maxRetriesPerRequest: number | null;
        password?: string | undefined;
    }, {
        host?: string | undefined;
        port?: number | undefined;
        password?: string | undefined;
        db?: number | undefined;
        maxRetriesPerRequest?: number | null | undefined;
    }>;
    llm: z.ZodObject<{
        defaultProvider: z.ZodDefault<z.ZodEnum<["anthropic", "openai", "google"]>>;
        anthropic: z.ZodObject<{
            apiKey: z.ZodString;
            model: z.ZodDefault<z.ZodString>;
            maxTokens: z.ZodDefault<z.ZodNumber>;
            temperature: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            apiKey: string;
            model: string;
            maxTokens: number;
            temperature: number;
        }, {
            apiKey: string;
            model?: string | undefined;
            maxTokens?: number | undefined;
            temperature?: number | undefined;
        }>;
        openai: z.ZodObject<{
            apiKey: z.ZodOptional<z.ZodString>;
            model: z.ZodDefault<z.ZodString>;
            maxTokens: z.ZodDefault<z.ZodNumber>;
            temperature: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            model: string;
            maxTokens: number;
            temperature: number;
            apiKey?: string | undefined;
        }, {
            apiKey?: string | undefined;
            model?: string | undefined;
            maxTokens?: number | undefined;
            temperature?: number | undefined;
        }>;
        google: z.ZodObject<{
            apiKey: z.ZodOptional<z.ZodString>;
            model: z.ZodDefault<z.ZodString>;
            maxTokens: z.ZodDefault<z.ZodNumber>;
            temperature: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            model: string;
            maxTokens: number;
            temperature: number;
            apiKey?: string | undefined;
        }, {
            apiKey?: string | undefined;
            model?: string | undefined;
            maxTokens?: number | undefined;
            temperature?: number | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        anthropic: {
            apiKey: string;
            model: string;
            maxTokens: number;
            temperature: number;
        };
        openai: {
            model: string;
            maxTokens: number;
            temperature: number;
            apiKey?: string | undefined;
        };
        google: {
            model: string;
            maxTokens: number;
            temperature: number;
            apiKey?: string | undefined;
        };
        defaultProvider: "anthropic" | "openai" | "google";
    }, {
        anthropic: {
            apiKey: string;
            model?: string | undefined;
            maxTokens?: number | undefined;
            temperature?: number | undefined;
        };
        openai: {
            apiKey?: string | undefined;
            model?: string | undefined;
            maxTokens?: number | undefined;
            temperature?: number | undefined;
        };
        google: {
            apiKey?: string | undefined;
            model?: string | undefined;
            maxTokens?: number | undefined;
            temperature?: number | undefined;
        };
        defaultProvider?: "anthropic" | "openai" | "google" | undefined;
    }>;
    embedding: z.ZodObject<{
        provider: z.ZodDefault<z.ZodEnum<["anthropic", "openai", "google"]>>;
        model: z.ZodDefault<z.ZodString>;
        dimensions: z.ZodDefault<z.ZodNumber>;
        batchSize: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        model: string;
        provider: "anthropic" | "openai" | "google";
        dimensions: number;
        batchSize: number;
    }, {
        model?: string | undefined;
        provider?: "anthropic" | "openai" | "google" | undefined;
        dimensions?: number | undefined;
        batchSize?: number | undefined;
    }>;
    slack: z.ZodEffects<z.ZodObject<{
        botToken: z.ZodOptional<z.ZodString>;
        appToken: z.ZodOptional<z.ZodString>;
        signingSecret: z.ZodOptional<z.ZodString>;
        enabled: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        botToken?: string | undefined;
        appToken?: string | undefined;
        signingSecret?: string | undefined;
    }, {
        botToken?: string | undefined;
        appToken?: string | undefined;
        signingSecret?: string | undefined;
        enabled?: boolean | undefined;
    }>, {
        enabled: boolean;
        botToken?: string | undefined;
        appToken?: string | undefined;
        signingSecret?: string | undefined;
    }, {
        botToken?: string | undefined;
        appToken?: string | undefined;
        signingSecret?: string | undefined;
        enabled?: boolean | undefined;
    }>;
    jira: z.ZodEffects<z.ZodObject<{
        host: z.ZodOptional<z.ZodString>;
        email: z.ZodOptional<z.ZodString>;
        apiToken: z.ZodOptional<z.ZodString>;
        enabled: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        host?: string | undefined;
        email?: string | undefined;
        apiToken?: string | undefined;
    }, {
        host?: string | undefined;
        enabled?: boolean | undefined;
        email?: string | undefined;
        apiToken?: string | undefined;
    }>, {
        enabled: boolean;
        host?: string | undefined;
        email?: string | undefined;
        apiToken?: string | undefined;
    }, {
        host?: string | undefined;
        enabled?: boolean | undefined;
        email?: string | undefined;
        apiToken?: string | undefined;
    }>;
    github: z.ZodEffects<z.ZodObject<{
        token: z.ZodOptional<z.ZodString>;
        webhookSecret: z.ZodOptional<z.ZodString>;
        enabled: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        token?: string | undefined;
        webhookSecret?: string | undefined;
    }, {
        enabled?: boolean | undefined;
        token?: string | undefined;
        webhookSecret?: string | undefined;
    }>, {
        enabled: boolean;
        token?: string | undefined;
        webhookSecret?: string | undefined;
    }, {
        enabled?: boolean | undefined;
        token?: string | undefined;
        webhookSecret?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    slack: {
        enabled: boolean;
        botToken?: string | undefined;
        appToken?: string | undefined;
        signingSecret?: string | undefined;
    };
    jira: {
        enabled: boolean;
        host?: string | undefined;
        email?: string | undefined;
        apiToken?: string | undefined;
    };
    app: {
        port: number;
        nodeEnv: "development" | "production" | "test";
        logLevel: "error" | "debug" | "info" | "warn";
    };
    database: {
        url: string;
        maxConnections: number;
        connectionTimeout: number;
    };
    redis: {
        host: string;
        port: number;
        db: number;
        maxRetriesPerRequest: number | null;
        password?: string | undefined;
    };
    llm: {
        anthropic: {
            apiKey: string;
            model: string;
            maxTokens: number;
            temperature: number;
        };
        openai: {
            model: string;
            maxTokens: number;
            temperature: number;
            apiKey?: string | undefined;
        };
        google: {
            model: string;
            maxTokens: number;
            temperature: number;
            apiKey?: string | undefined;
        };
        defaultProvider: "anthropic" | "openai" | "google";
    };
    embedding: {
        model: string;
        provider: "anthropic" | "openai" | "google";
        dimensions: number;
        batchSize: number;
    };
    github: {
        enabled: boolean;
        token?: string | undefined;
        webhookSecret?: string | undefined;
    };
    api?: {
        port: number;
        corsOrigins: string;
        rateLimit?: {
            windowMs: number;
            max: number;
        } | undefined;
    } | undefined;
}, {
    slack: {
        botToken?: string | undefined;
        appToken?: string | undefined;
        signingSecret?: string | undefined;
        enabled?: boolean | undefined;
    };
    jira: {
        host?: string | undefined;
        enabled?: boolean | undefined;
        email?: string | undefined;
        apiToken?: string | undefined;
    };
    app: {
        port?: number | undefined;
        nodeEnv?: "development" | "production" | "test" | undefined;
        logLevel?: "error" | "debug" | "info" | "warn" | undefined;
    };
    database: {
        url: string;
        maxConnections?: number | undefined;
        connectionTimeout?: number | undefined;
    };
    redis: {
        host?: string | undefined;
        port?: number | undefined;
        password?: string | undefined;
        db?: number | undefined;
        maxRetriesPerRequest?: number | null | undefined;
    };
    llm: {
        anthropic: {
            apiKey: string;
            model?: string | undefined;
            maxTokens?: number | undefined;
            temperature?: number | undefined;
        };
        openai: {
            apiKey?: string | undefined;
            model?: string | undefined;
            maxTokens?: number | undefined;
            temperature?: number | undefined;
        };
        google: {
            apiKey?: string | undefined;
            model?: string | undefined;
            maxTokens?: number | undefined;
            temperature?: number | undefined;
        };
        defaultProvider?: "anthropic" | "openai" | "google" | undefined;
    };
    embedding: {
        model?: string | undefined;
        provider?: "anthropic" | "openai" | "google" | undefined;
        dimensions?: number | undefined;
        batchSize?: number | undefined;
    };
    github: {
        enabled?: boolean | undefined;
        token?: string | undefined;
        webhookSecret?: string | undefined;
    };
    api?: {
        port?: number | undefined;
        corsOrigins?: string | undefined;
        rateLimit?: {
            windowMs?: number | undefined;
            max?: number | undefined;
        } | undefined;
    } | undefined;
}>;
export type Config = z.infer<typeof ConfigSchema>;
//# sourceMappingURL=schema.d.ts.map