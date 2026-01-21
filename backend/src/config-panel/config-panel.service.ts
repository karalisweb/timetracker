import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

// Chiavi di configurazione Asana
export const ASANA_CONFIG_KEYS = {
  ACCESS_TOKEN: 'asana_access_token',
  WORKSPACE_ID: 'asana_workspace_id',
  DEFAULT_PROJECT_ID: 'asana_default_project_id',
  FIELD_PROJECT_ID: 'asana_field_project_id',
  FIELD_CHECKLIST_ID: 'asana_field_checklist_id',
  WEBHOOK_SECRET: 'asana_webhook_secret',
} as const;

// Chiavi che devono essere criptate
const ENCRYPTED_KEYS = [
  ASANA_CONFIG_KEYS.ACCESS_TOKEN,
  ASANA_CONFIG_KEYS.WEBHOOK_SECRET,
];

@Injectable()
export class ConfigPanelService {
  private readonly logger = new Logger(ConfigPanelService.name);
  private encryptionKey: Buffer;

  constructor(private readonly prisma: PrismaService) {
    // Usa JWT_SECRET come base per encryption key (32 bytes per AES-256)
    const secret = process.env.JWT_SECRET || 'default-secret-key-change-me';
    this.encryptionKey = crypto
      .createHash('sha256')
      .update(secret)
      .digest();
  }

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  private decrypt(encryptedText: string): string {
    const [ivHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      this.encryptionKey,
      iv,
    );
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  async getConfig(key: string): Promise<string | null> {
    const config = await this.prisma.appConfig.findUnique({
      where: { key },
    });

    if (!config) {
      return null;
    }

    if (config.encrypted) {
      try {
        return this.decrypt(config.value);
      } catch {
        this.logger.error(`Errore decrypt config ${key}`);
        return null;
      }
    }

    return config.value;
  }

  async setConfig(key: string, value: string): Promise<void> {
    const shouldEncrypt = ENCRYPTED_KEYS.includes(key as any);
    const storedValue = shouldEncrypt ? this.encrypt(value) : value;

    await this.prisma.appConfig.upsert({
      where: { key },
      update: { value: storedValue, encrypted: shouldEncrypt },
      create: { key, value: storedValue, encrypted: shouldEncrypt },
    });

    this.logger.log(`Config ${key} aggiornata`);
  }

  async deleteConfig(key: string): Promise<void> {
    await this.prisma.appConfig.deleteMany({
      where: { key },
    });
  }

  async getAsanaConfig(): Promise<{
    accessToken: string | null;
    workspaceId: string | null;
    defaultProjectId: string | null;
    fieldProjectId: string | null;
    fieldChecklistId: string | null;
    webhookSecret: string | null;
    isConfigured: boolean;
  }> {
    const [
      accessToken,
      workspaceId,
      defaultProjectId,
      fieldProjectId,
      fieldChecklistId,
      webhookSecret,
    ] = await Promise.all([
      this.getConfig(ASANA_CONFIG_KEYS.ACCESS_TOKEN),
      this.getConfig(ASANA_CONFIG_KEYS.WORKSPACE_ID),
      this.getConfig(ASANA_CONFIG_KEYS.DEFAULT_PROJECT_ID),
      this.getConfig(ASANA_CONFIG_KEYS.FIELD_PROJECT_ID),
      this.getConfig(ASANA_CONFIG_KEYS.FIELD_CHECKLIST_ID),
      this.getConfig(ASANA_CONFIG_KEYS.WEBHOOK_SECRET),
    ]);

    // Fallback a variabili ambiente se non configurato nel DB
    const finalAccessToken = accessToken || process.env.ASANA_ACCESS_TOKEN || null;
    const finalWorkspaceId = workspaceId || process.env.ASANA_WORKSPACE_ID || null;

    return {
      accessToken: finalAccessToken ? '••••••••' : null, // Non esporre token
      workspaceId: finalWorkspaceId,
      defaultProjectId: defaultProjectId || process.env.ASANA_DEFAULT_PROJECT_ID || null,
      fieldProjectId: fieldProjectId || process.env.ASANA_FIELD_PROJECT_ID || null,
      fieldChecklistId: fieldChecklistId || process.env.ASANA_FIELD_CHECKLIST_ID || null,
      webhookSecret: webhookSecret ? '••••••••' : null, // Non esporre secret
      isConfigured: !!(finalAccessToken && finalWorkspaceId),
    };
  }

  async setAsanaConfig(config: {
    accessToken?: string;
    workspaceId?: string;
    defaultProjectId?: string;
    fieldProjectId?: string;
    fieldChecklistId?: string;
    webhookSecret?: string;
  }): Promise<void> {
    const updates: Promise<void>[] = [];

    if (config.accessToken !== undefined) {
      updates.push(this.setConfig(ASANA_CONFIG_KEYS.ACCESS_TOKEN, config.accessToken));
    }
    if (config.workspaceId !== undefined) {
      updates.push(this.setConfig(ASANA_CONFIG_KEYS.WORKSPACE_ID, config.workspaceId));
    }
    if (config.defaultProjectId !== undefined) {
      updates.push(this.setConfig(ASANA_CONFIG_KEYS.DEFAULT_PROJECT_ID, config.defaultProjectId));
    }
    if (config.fieldProjectId !== undefined) {
      updates.push(this.setConfig(ASANA_CONFIG_KEYS.FIELD_PROJECT_ID, config.fieldProjectId));
    }
    if (config.fieldChecklistId !== undefined) {
      updates.push(this.setConfig(ASANA_CONFIG_KEYS.FIELD_CHECKLIST_ID, config.fieldChecklistId));
    }
    if (config.webhookSecret !== undefined) {
      updates.push(this.setConfig(ASANA_CONFIG_KEYS.WEBHOOK_SECRET, config.webhookSecret));
    }

    await Promise.all(updates);
  }

  // Metodo per ottenere il token reale (per uso interno)
  async getAsanaAccessToken(): Promise<string | null> {
    const dbToken = await this.getConfig(ASANA_CONFIG_KEYS.ACCESS_TOKEN);
    return dbToken || process.env.ASANA_ACCESS_TOKEN || null;
  }

  async getAsanaWorkspaceId(): Promise<string | null> {
    const dbId = await this.getConfig(ASANA_CONFIG_KEYS.WORKSPACE_ID);
    return dbId || process.env.ASANA_WORKSPACE_ID || null;
  }
}
