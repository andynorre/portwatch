import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { saveBaseline, loadBaseline, diffPorts, Baseline } from './baseline';
import { PortInfo } from './scanner';

const tmpFile = () => path.join(os.tmpdir(), `portwatch-test-${Date.now()}.json`);

const samplePorts: PortInfo[] = [
  { port: 80, protocol: 'tcp', pid: 100, process: 'nginx', state: 'LISTEN' },
  { port: 443, protocol: 'tcp', pid: 101, process: 'nginx', state: 'LISTEN' },
];

describe('saveBaseline / loadBaseline', () => {
  it('saves and reloads a baseline correctly', () => {
    const file = tmpFile();
    saveBaseline(samplePorts, file);
    const loaded = loadBaseline(file);
    expect(loaded).not.toBeNull();
    expect(loaded!.ports).toEqual(samplePorts);
    expect(loaded!.createdAt).toBeTruthy();
    fs.unlinkSync(file);
  });

  it('returns null when file does not exist', () => {
    const result = loadBaseline('/nonexistent/path/baseline.json');
    expect(result).toBeNull();
  });

  it('returns null for malformed JSON', () => {
    const file = tmpFile();
    fs.writeFileSync(file, 'not-json', 'utf-8');
    expect(loadBaseline(file)).toBeNull();
    fs.unlinkSync(file);
  });
});

describe('diffPorts', () => {
  it('detects newly added ports', () => {
    const current: PortInfo[] = [
      ...samplePorts,
      { port: 8080, protocol: 'tcp', pid: 200, process: 'node', state: 'LISTEN' },
    ];
    const { added, removed } = diffPorts(samplePorts, current);
    expect(added).toHaveLength(1);
    expect(added[0].port).toBe(8080);
    expect(removed).toHaveLength(0);
  });

  it('detects removed ports', () => {
    const current: PortInfo[] = [samplePorts[0]];
    const { added, removed } = diffPorts(samplePorts, current);
    expect(removed).toHaveLength(1);
    expect(removed[0].port).toBe(443);
    expect(added).toHaveLength(0);
  });

  it('returns empty diff when ports are identical', () => {
    const { added, removed } = diffPorts(samplePorts, samplePorts);
    expect(added).toHaveLength(0);
    expect(removed).toHaveLength(0);
  });
});
