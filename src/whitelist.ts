import { PortInfo } from './baseline.types';

export interface WhitelistRule {
  port: number;
  protocol?: 'tcp' | 'udp';
  process?: string;
  comment?: string;
}

export interface WhitelistStore {
  rules: WhitelistRule[];
}

export function createWhitelistStore(): WhitelistStore {
  return { rules: [] };
}

export function addWhitelistRule(
  store: WhitelistStore,
  rule: WhitelistRule
): WhitelistStore {
  const exists = store.rules.some(
    (r) =>
      r.port === rule.port &&
      (r.protocol ?? 'tcp') === (rule.protocol ?? 'tcp') &&
      (r.process ?? '') === (rule.process ?? '')
  );
  if (exists) return store;
  return { rules: [...store.rules, rule] };
}

export function removeWhitelistRule(
  store: WhitelistStore,
  port: number,
  protocol?: 'tcp' | 'udp',
  process?: string
): WhitelistStore {
  return {
    rules: store.rules.filter(
      (r) =>
        !(r.port === port &&
          (protocol === undefined || (r.protocol ?? 'tcp') === protocol) &&
          (process === undefined || (r.process ?? '') === process))
    ),
  };
}

export function isWhitelisted(
  store: WhitelistStore,
  port: PortInfo
): boolean {
  return store.rules.some((rule) => {
    if (rule.port !== port.port) return false;
    if (rule.protocol && rule.protocol !== port.protocol) return false;
    if (rule.process && rule.process !== port.process) return false;
    return true;
  });
}

export function filterWhitelisted(
  store: WhitelistStore,
  ports: PortInfo[]
): PortInfo[] {
  return ports.filter((p) => !isWhitelisted(store, p));
}

export function getWhitelistRules(store: WhitelistStore): WhitelistRule[] {
  return [...store.rules];
}
