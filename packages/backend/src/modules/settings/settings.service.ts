import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { CreateAiKeyDto } from './dto/create-ai-key.dto';
import { ReplaceAiKeyDto } from './dto/replace-ai-key.dto';
import { UpdateKdsSettingsDto } from './dto/update-kds-settings.dto';
import { UpdateTaxSettingsDto } from './dto/update-tax-settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  private resolveTaxRatePercent(config: any) {
    const rawPercent = config?.taxRatePercent;
    if (Number.isFinite(Number(rawPercent))) {
      return Math.min(100, Math.max(0, Number(rawPercent)));
    }
    const legacyRate = Number(config?.taxRate);
    if (Number.isFinite(legacyRate)) {
      return legacyRate <= 1 ? legacyRate * 100 : legacyRate;
    }
    return 19;
  }

  private normalizeBranchConfig(config: any, moduleType: string) {
    const taxRatePercent = this.resolveTaxRatePercent(config);
    const taxEnabled = config?.taxEnabled !== undefined ? Boolean(config.taxEnabled) : true;
    const pricesIncludeTax = config?.pricesIncludeTax !== undefined ? Boolean(config.pricesIncludeTax) : false;
    const taxName = String(config?.taxName || 'IVA');

    const kdsTheme = config?.kdsTheme === 'light' ? 'light' : 'dark';
    const kdsDefaultPrepMinutes = Math.max(1, Math.round(Number(config?.kdsDefaultPrepMinutes || 15)));
    const kdsWarningMinutes = Math.max(1, Math.round(Number(config?.kdsWarningMinutes || 20)));
    const kdsCriticalMinutes = Math.max(kdsWarningMinutes + 1, Math.round(Number(config?.kdsCriticalMinutes || 30)));

    const tipSuggestionPercent = Math.max(
      0,
      Math.min(100, Math.round(Number(config?.restaurantTipSuggestionPercent ?? 10))),
    );

    return {
      ...config,
      taxName,
      taxEnabled,
      taxRatePercent,
      taxRate: taxRatePercent / 100,
      pricesIncludeTax,
      kdsTheme,
      kdsDefaultPrepMinutes,
      kdsWarningMinutes,
      kdsCriticalMinutes,
      restaurantTipSuggestionPercent: tipSuggestionPercent,
      tipsEnabled: moduleType === 'RESTAURANT' || moduleType === 'ALL',
    };
  }

  private async getBranch(branchId: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
      select: { id: true, moduleType: true, config: true, name: true },
    });

    if (!branch) {
      throw new NotFoundException('Sucursal no encontrada');
    }

    return branch;
  }

  private buildEncryptionKey() {
    const raw =
      this.configService.get<string>('SETTINGS_ENCRYPTION_KEY') ||
      this.configService.get<string>('JWT_SECRET') ||
      'omnipunto-dev-settings-key';
    return createHash('sha256').update(raw).digest();
  }

  private encryptSecret(value: string) {
    const key = this.buildEncryptionKey();
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return {
      encryptedKey: encrypted.toString('base64'),
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      keyFingerprint: createHash('sha256').update(value).digest('hex').slice(0, 16),
      last4: value.slice(-4),
    };
  }

  private validateApiKeyShape(provider: 'OPENAI' | 'ANTHROPIC', apiKey: string) {
    const trimmed = String(apiKey || '').trim();
    if (!trimmed) {
      throw new BadRequestException('API key requerida');
    }

    if (provider === 'OPENAI' && !trimmed.startsWith('sk-')) {
      throw new BadRequestException('Formato de OpenAI API key invalido');
    }

    if (provider === 'ANTHROPIC' && !(trimmed.startsWith('sk-ant-') || trimmed.startsWith('sk-'))) {
      throw new BadRequestException('Formato de Claude API key invalido');
    }
  }

  private maskKey(provider: string, last4: string) {
    const label = provider === 'OPENAI' ? 'OpenAI' : 'Claude';
    return `${label} ************${last4}`;
  }

  async getCurrent(branchId: string) {
    const branch = await this.getBranch(branchId);
    const normalizedConfig = this.normalizeBranchConfig((branch.config as any) || {}, branch.moduleType);
    const aiKeys = await this.listAiKeys(branchId);

    return {
      branch: {
        id: branch.id,
        name: branch.name,
        moduleType: branch.moduleType,
      },
      tax: {
        taxName: normalizedConfig.taxName,
        taxRatePercent: normalizedConfig.taxRatePercent,
        taxEnabled: normalizedConfig.taxEnabled,
        pricesIncludeTax: normalizedConfig.pricesIncludeTax,
      },
      kds: {
        theme: normalizedConfig.kdsTheme,
        defaultPrepMinutes: normalizedConfig.kdsDefaultPrepMinutes,
        warningMinutes: normalizedConfig.kdsWarningMinutes,
        criticalMinutes: normalizedConfig.kdsCriticalMinutes,
      },
      restaurant: {
        tipsEnabled: normalizedConfig.tipsEnabled,
        tipSuggestionPercent: normalizedConfig.restaurantTipSuggestionPercent,
      },
      ai: {
        keys: aiKeys,
      },
    };
  }

  async updateTax(branchId: string, data: UpdateTaxSettingsDto) {
    const branch = await this.getBranch(branchId);
    const current = this.normalizeBranchConfig((branch.config as any) || {}, branch.moduleType);
    const next = {
      ...current,
      ...(data.taxName !== undefined ? { taxName: data.taxName.trim() || current.taxName } : {}),
      ...(data.taxRatePercent !== undefined
        ? {
            taxRatePercent: Math.min(100, Math.max(0, Number(data.taxRatePercent))),
            taxRate: Math.min(100, Math.max(0, Number(data.taxRatePercent))) / 100,
          }
        : {}),
      ...(data.taxEnabled !== undefined ? { taxEnabled: data.taxEnabled } : {}),
      ...(data.pricesIncludeTax !== undefined ? { pricesIncludeTax: data.pricesIncludeTax } : {}),
    };

    await this.prisma.branch.update({
      where: { id: branch.id },
      data: { config: next },
    });

    return {
      message: 'Configuracion de impuesto actualizada',
      tax: {
        taxName: next.taxName,
        taxRatePercent: next.taxRatePercent,
        taxEnabled: next.taxEnabled,
        pricesIncludeTax: next.pricesIncludeTax,
      },
    };
  }

  async updateKds(branchId: string, data: UpdateKdsSettingsDto) {
    const branch = await this.getBranch(branchId);
    const current = this.normalizeBranchConfig((branch.config as any) || {}, branch.moduleType);
    const next = {
      ...current,
      ...(data.theme ? { kdsTheme: data.theme } : {}),
      ...(data.defaultPrepMinutes !== undefined
        ? { kdsDefaultPrepMinutes: Math.max(1, Math.round(Number(data.defaultPrepMinutes))) }
        : {}),
      ...(data.warningMinutes !== undefined
        ? { kdsWarningMinutes: Math.max(1, Math.round(Number(data.warningMinutes))) }
        : {}),
      ...(data.criticalMinutes !== undefined
        ? { kdsCriticalMinutes: Math.max(1, Math.round(Number(data.criticalMinutes))) }
        : {}),
    };

    if (next.kdsCriticalMinutes <= next.kdsWarningMinutes) {
      next.kdsCriticalMinutes = next.kdsWarningMinutes + 1;
    }

    await this.prisma.branch.update({
      where: { id: branch.id },
      data: { config: next },
    });

    return {
      message: 'Configuracion KDS actualizada',
      kds: {
        theme: next.kdsTheme,
        defaultPrepMinutes: next.kdsDefaultPrepMinutes,
        warningMinutes: next.kdsWarningMinutes,
        criticalMinutes: next.kdsCriticalMinutes,
      },
    };
  }

  async listAiKeys(branchId: string) {
    const rows = await this.prisma.aIProviderKey.findMany({
      where: { branchId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        provider: true,
        last4: true,
        isActive: true,
        createdAt: true,
      },
    });

    return rows.map((row) => ({
      id: row.id,
      provider: row.provider,
      maskedKey: this.maskKey(row.provider, row.last4),
      last4: row.last4,
      isActive: row.isActive,
      createdAt: row.createdAt,
    }));
  }

  async createAiKey(branchId: string, userId: string, payload: CreateAiKeyDto) {
    this.validateApiKeyShape(payload.provider, payload.apiKey);
    const secure = this.encryptSecret(payload.apiKey.trim());
    const activate = payload.isActive !== false;

    const created = await this.prisma.$transaction(async (tx) => {
      if (activate) {
        await tx.aIProviderKey.updateMany({
          where: { branchId, provider: payload.provider, deletedAt: null },
          data: { isActive: false },
        });
      }
      return tx.aIProviderKey.create({
        data: {
          branchId,
          createdById: userId,
          provider: payload.provider,
          isActive: activate,
          encryptedKey: secure.encryptedKey,
          iv: secure.iv,
          authTag: secure.authTag,
          keyFingerprint: secure.keyFingerprint,
          last4: secure.last4,
        },
      });
    });

    return {
      id: created.id,
      provider: created.provider,
      maskedKey: this.maskKey(created.provider, created.last4),
      last4: created.last4,
      isActive: created.isActive,
      message: 'API key guardada',
    };
  }

  async replaceAiKey(branchId: string, keyId: string, userId: string, payload: ReplaceAiKeyDto) {
    const existing = await this.prisma.aIProviderKey.findFirst({
      where: { id: keyId, branchId, deletedAt: null },
      select: { id: true, provider: true },
    });

    if (!existing) {
      throw new NotFoundException('API key no encontrada');
    }

    const provider = payload.provider || (existing.provider as 'OPENAI' | 'ANTHROPIC');
    this.validateApiKeyShape(provider, payload.apiKey);
    const secure = this.encryptSecret(payload.apiKey.trim());
    const activate = payload.isActive !== false;

    const updated = await this.prisma.$transaction(async (tx) => {
      if (activate) {
        await tx.aIProviderKey.updateMany({
          where: { branchId, provider, deletedAt: null, id: { not: keyId } },
          data: { isActive: false },
        });
      }
      return tx.aIProviderKey.update({
        where: { id: keyId },
        data: {
          provider,
          isActive: activate,
          createdById: userId,
          encryptedKey: secure.encryptedKey,
          iv: secure.iv,
          authTag: secure.authTag,
          keyFingerprint: secure.keyFingerprint,
          last4: secure.last4,
        },
      });
    });

    return {
      id: updated.id,
      provider: updated.provider,
      maskedKey: this.maskKey(updated.provider, updated.last4),
      last4: updated.last4,
      isActive: updated.isActive,
      message: 'API key reemplazada',
    };
  }

  async toggleAiKey(branchId: string, keyId: string, isActive: boolean) {
    const existing = await this.prisma.aIProviderKey.findFirst({
      where: { id: keyId, branchId, deletedAt: null },
      select: { id: true, provider: true, last4: true },
    });

    if (!existing) {
      throw new NotFoundException('API key no encontrada');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (isActive) {
        await tx.aIProviderKey.updateMany({
          where: { branchId, provider: existing.provider, deletedAt: null, id: { not: keyId } },
          data: { isActive: false },
        });
      }
      return tx.aIProviderKey.update({
        where: { id: keyId },
        data: { isActive },
      });
    });

    return {
      id: updated.id,
      provider: updated.provider,
      maskedKey: this.maskKey(updated.provider, existing.last4),
      isActive: updated.isActive,
      message: 'Estado de API key actualizado',
    };
  }

  async removeAiKey(branchId: string, keyId: string) {
    const existing = await this.prisma.aIProviderKey.findFirst({
      where: { id: keyId, branchId, deletedAt: null },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('API key no encontrada');
    }

    await this.prisma.aIProviderKey.update({
      where: { id: keyId },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    return { message: 'API key eliminada' };
  }
}
