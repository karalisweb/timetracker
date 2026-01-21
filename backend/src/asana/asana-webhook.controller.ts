import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  Logger,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { AsanaWebhookService } from './asana-webhook.service';

@Controller('asana/webhook')
export class AsanaWebhookController {
  private readonly logger = new Logger(AsanaWebhookController.name);

  constructor(private readonly webhookService: AsanaWebhookService) {}

  /**
   * Endpoint per ricevere webhook da Asana
   * Asana invia eventi quando task vengono completati/modificati
   */
  @Post()
  @HttpCode(200)
  async handleWebhook(
    @Headers('x-hook-secret') hookSecret: string | undefined,
    @Headers('x-hook-signature') hookSignature: string | undefined,
    @Body() body: any,
    @Req() req: RawBodyRequest<Request>,
  ) {
    // Handshake iniziale - Asana verifica l'endpoint
    if (hookSecret) {
      this.logger.log('Asana webhook handshake ricevuto');
      return {
        'X-Hook-Secret': hookSecret,
      };
    }

    // Verifica firma se configurata
    if (hookSignature) {
      const rawBody = req.rawBody?.toString() || JSON.stringify(body);
      const isValid = await this.webhookService.verifySignature(
        rawBody,
        hookSignature,
      );
      if (!isValid) {
        this.logger.warn('Webhook signature non valida - ignorato');
        return { received: true };
      }
    }

    // Processa eventi
    if (body.events && Array.isArray(body.events)) {
      this.logger.log(`Ricevuti ${body.events.length} eventi Asana`);

      // Processa in background per rispondere velocemente
      setImmediate(() => {
        this.webhookService.processEvents(body.events).catch((err) => {
          this.logger.error(`Errore processing eventi: ${err.message}`);
        });
      });
    }

    return { received: true };
  }
}
