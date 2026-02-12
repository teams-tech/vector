export type PublicConfig = {
  elevenLabsAgentId: string | null;
};

export function normalizeEnvValue(value: string | undefined): string | null {
  if (value === undefined) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function readPublicConfig(env: NodeJS.ProcessEnv = process.env): PublicConfig {
  return {
    elevenLabsAgentId: normalizeEnvValue(env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID),
  };
}

export const PUBLIC_CONFIG = readPublicConfig();
