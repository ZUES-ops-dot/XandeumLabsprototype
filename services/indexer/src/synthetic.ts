/**
 * Synthetic gossip harness for testing the ingestion pipeline.
 * Generates configurable scenarios including missing fields, stale data, and duplicates.
 */

import type { GossipPnode } from './gossip.js';

export type ScenarioType =
  | 'healthy'
  | 'missing_address'
  | 'missing_version'
  | 'missing_capabilities'
  | 'invalid_address'
  | 'invalid_version'
  | 'duplicate_pubkey'
  | 'empty_pubkey'
  | 'suspicious_pubkey';

export interface SyntheticConfig {
  count: number;
  scenarios?: Partial<Record<ScenarioType, number>>;
  baseVersion?: string;
  regions?: string[];
}

const DEFAULT_CONFIG: SyntheticConfig = {
  count: 10,
  scenarios: {
    healthy: 6,
    missing_address: 1,
    missing_version: 1,
    missing_capabilities: 1,
    invalid_address: 1
  },
  baseVersion: '1.2.0',
  regions: ['us-east', 'us-west', 'eu-west', 'ap-south']
};

function randomHex(length: number): string {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function randomIP(): string {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

function randomPort(): number {
  return 8000 + Math.floor(Math.random() * 2000);
}

function generateHealthyPnode(index: number, config: SyntheticConfig): GossipPnode {
  const region = config.regions?.[index % (config.regions?.length ?? 1)] ?? 'unknown';
  return {
    pubkey: randomHex(64),
    address: `${randomIP()}:${randomPort()}`,
    version: config.baseVersion ?? '1.0.0',
    capabilities: { storage: true, compute: index % 2 === 0 },
    metadata: { region, index },
    raw: { synthetic: true, scenario: 'healthy', index }
  };
}

function generateScenarioPnode(scenario: ScenarioType, index: number, config: SyntheticConfig): GossipPnode {
  const base = generateHealthyPnode(index, config);

  switch (scenario) {
    case 'healthy':
      return base;

    case 'missing_address':
      return { ...base, address: null, raw: { ...base.raw as object, scenario } };

    case 'missing_version':
      return { ...base, version: null, raw: { ...base.raw as object, scenario } };

    case 'missing_capabilities':
      return { ...base, capabilities: null, raw: { ...base.raw as object, scenario } };

    case 'invalid_address':
      return { ...base, address: 'not-a-valid-address', raw: { ...base.raw as object, scenario } };

    case 'invalid_version':
      return { ...base, version: 'vX.Y.Z-bad', raw: { ...base.raw as object, scenario } };

    case 'duplicate_pubkey':
      return { ...base, pubkey: 'duplicate-pubkey-for-testing', raw: { ...base.raw as object, scenario } };

    case 'empty_pubkey':
      return { ...base, pubkey: '', raw: { ...base.raw as object, scenario } };

    case 'suspicious_pubkey':
      return { ...base, pubkey: 'test-node-' + index, raw: { ...base.raw as object, scenario } };

    default:
      return base;
  }
}

export function generateSyntheticGossip(config: Partial<SyntheticConfig> = {}): GossipPnode[] {
  const mergedConfig: SyntheticConfig = { ...DEFAULT_CONFIG, ...config };
  const scenarios = mergedConfig.scenarios ?? DEFAULT_CONFIG.scenarios!;

  const pnodes: GossipPnode[] = [];
  let index = 0;

  for (const [scenario, count] of Object.entries(scenarios)) {
    for (let i = 0; i < (count ?? 0); i++) {
      pnodes.push(generateScenarioPnode(scenario as ScenarioType, index++, mergedConfig));
    }
  }

  // Fill remaining with healthy nodes
  while (pnodes.length < mergedConfig.count) {
    pnodes.push(generateHealthyPnode(index++, mergedConfig));
  }

  // Shuffle for realism
  for (let i = pnodes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pnodes[i], pnodes[j]] = [pnodes[j], pnodes[i]];
  }

  return pnodes.slice(0, mergedConfig.count);
}

export function generateStressTest(nodeCount: number): GossipPnode[] {
  return generateSyntheticGossip({
    count: nodeCount,
    scenarios: {
      healthy: Math.floor(nodeCount * 0.7),
      missing_address: Math.floor(nodeCount * 0.05),
      missing_version: Math.floor(nodeCount * 0.05),
      missing_capabilities: Math.floor(nodeCount * 0.05),
      invalid_address: Math.floor(nodeCount * 0.05),
      invalid_version: Math.floor(nodeCount * 0.03),
      suspicious_pubkey: Math.floor(nodeCount * 0.05),
      duplicate_pubkey: Math.floor(nodeCount * 0.02)
    }
  });
}

export function generateEdgeCases(): GossipPnode[] {
  return generateSyntheticGossip({
    count: 20,
    scenarios: {
      healthy: 2,
      missing_address: 2,
      missing_version: 2,
      missing_capabilities: 2,
      invalid_address: 2,
      invalid_version: 2,
      duplicate_pubkey: 3,
      empty_pubkey: 2,
      suspicious_pubkey: 3
    }
  });
}
