/**
 * Data quality validation for gossip snapshots.
 * Produces a quality score (0–1) and an array of issue codes for each pNode record.
 */

import type { GossipPnode } from './gossip.js';

export type IssueCode =
  | 'MISSING_ADDRESS'
  | 'MISSING_VERSION'
  | 'INVALID_ADDRESS_FORMAT'
  | 'INVALID_VERSION_FORMAT'
  | 'MISSING_CAPABILITIES'
  | 'EMPTY_PUBKEY'
  | 'SUSPICIOUS_PUBKEY';

export interface ValidationResult {
  pubkey: string;
  qualityScore: number;
  issues: IssueCode[];
  isValid: boolean;
}

export interface BatchValidationResult {
  results: ValidationResult[];
  aggregateScore: number;
  totalIssues: number;
  validCount: number;
  invalidCount: number;
}

const WEIGHT_ADDRESS = 0.25;
const WEIGHT_VERSION = 0.25;
const WEIGHT_CAPABILITIES = 0.15;
const WEIGHT_PUBKEY_QUALITY = 0.35;

const ADDRESS_PATTERN = /^[\w.-]+:\d+$|^\d{1,3}(\.\d{1,3}){3}(:\d+)?$/;
const VERSION_PATTERN = /^\d+\.\d+(\.\d+)?(-[\w.]+)?$/;
const PUBKEY_MIN_LENGTH = 32;
const PUBKEY_MAX_LENGTH = 128;

function isValidAddressFormat(address: string): boolean {
  return ADDRESS_PATTERN.test(address);
}

function isValidVersionFormat(version: string): boolean {
  return VERSION_PATTERN.test(version);
}

function isPubkeyValid(pubkey: string): { valid: boolean; suspicious: boolean } {
  if (!pubkey || pubkey.trim().length === 0) {
    return { valid: false, suspicious: false };
  }
  const trimmed = pubkey.trim();
  if (trimmed.length < PUBKEY_MIN_LENGTH || trimmed.length > PUBKEY_MAX_LENGTH) {
    return { valid: true, suspicious: true };
  }
  // Check for obviously fake patterns
  if (/^(test|mock|fake|dummy)/i.test(trimmed)) {
    return { valid: true, suspicious: true };
  }
  return { valid: true, suspicious: false };
}

export function validatePnode(pnode: GossipPnode): ValidationResult {
  const issues: IssueCode[] = [];
  let score = 0;

  // Pubkey validation
  const pubkeyCheck = isPubkeyValid(pnode.pubkey);
  if (!pubkeyCheck.valid) {
    issues.push('EMPTY_PUBKEY');
  } else {
    score += WEIGHT_PUBKEY_QUALITY;
    if (pubkeyCheck.suspicious) {
      issues.push('SUSPICIOUS_PUBKEY');
      score -= WEIGHT_PUBKEY_QUALITY * 0.5;
    }
  }

  // Address validation
  if (!pnode.address) {
    issues.push('MISSING_ADDRESS');
  } else if (!isValidAddressFormat(pnode.address)) {
    issues.push('INVALID_ADDRESS_FORMAT');
    score += WEIGHT_ADDRESS * 0.5;
  } else {
    score += WEIGHT_ADDRESS;
  }

  // Version validation
  if (!pnode.version) {
    issues.push('MISSING_VERSION');
  } else if (!isValidVersionFormat(pnode.version)) {
    issues.push('INVALID_VERSION_FORMAT');
    score += WEIGHT_VERSION * 0.5;
  } else {
    score += WEIGHT_VERSION;
  }

  // Capabilities validation
  if (!pnode.capabilities || (typeof pnode.capabilities === 'object' && Object.keys(pnode.capabilities as object).length === 0)) {
    issues.push('MISSING_CAPABILITIES');
  } else {
    score += WEIGHT_CAPABILITIES;
  }

  // Clamp score to 0-1
  const qualityScore = Math.max(0, Math.min(1, score));

  return {
    pubkey: pnode.pubkey,
    qualityScore,
    issues,
    isValid: !issues.includes('EMPTY_PUBKEY')
  };
}

export function validateBatch(pnodes: GossipPnode[]): BatchValidationResult {
  if (pnodes.length === 0) {
    return {
      results: [],
      aggregateScore: 0,
      totalIssues: 0,
      validCount: 0,
      invalidCount: 0
    };
  }

  const results = pnodes.map(validatePnode);
  const validResults = results.filter((r) => r.isValid);
  const invalidResults = results.filter((r) => !r.isValid);

  const aggregateScore =
    validResults.length > 0
      ? validResults.reduce((sum, r) => sum + r.qualityScore, 0) / validResults.length
      : 0;

  const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);

  return {
    results,
    aggregateScore,
    totalIssues,
    validCount: validResults.length,
    invalidCount: invalidResults.length
  };
}

export function summarizeIssues(results: ValidationResult[]): Record<IssueCode, number> {
  const summary: Record<string, number> = {};
  for (const r of results) {
    for (const issue of r.issues) {
      summary[issue] = (summary[issue] ?? 0) + 1;
    }
  }
  return summary as Record<IssueCode, number>;
}
