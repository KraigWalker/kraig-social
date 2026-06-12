import { mkdir, appendFile } from 'node:fs/promises';
import path from 'node:path';

const dataRoot = path.resolve(process.cwd(), '.kraig-social-data');
const auditPath = path.join(dataRoot, 'audit.jsonl');

export async function writeAuditLog(event: {
  type: string;
  actor?: string;
  details: Record<string, unknown>;
}): Promise<void> {
  await mkdir(dataRoot, { recursive: true });
  await appendFile(
    auditPath,
    `${JSON.stringify({
      ...event,
      createdAt: new Date().toISOString(),
    })}\n`
  );
}
