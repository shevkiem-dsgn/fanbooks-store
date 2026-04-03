import { mkdir, appendFile } from "node:fs/promises";
import path from "node:path";

type AdminAuditEvent = {
  actorId: string;
  actorEmail: string;
  action: string;
  targetType?: string;
  targetId?: string;
  ip?: string | null;
  metadata?: Record<string, unknown>;
};

function getAuditFilePath() {
  return path.join(process.cwd(), ".audit", "admin-actions.log");
}

export async function writeAdminAuditEvent(event: AdminAuditEvent) {
  const filePath = getAuditFilePath();
  await mkdir(path.dirname(filePath), { recursive: true });

  const record = JSON.stringify({
    ...event,
    createdAt: new Date().toISOString(),
  });

  await appendFile(filePath, `${record}\n`, "utf8");
}
