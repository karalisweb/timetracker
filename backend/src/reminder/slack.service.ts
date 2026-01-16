import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebClient } from '@slack/web-api';

@Injectable()
export class SlackService {
  private readonly logger = new Logger(SlackService.name);
  private client: WebClient | null = null;

  constructor(private configService: ConfigService) {
    const token = this.configService.get<string>('SLACK_BOT_TOKEN');
    if (token) {
      this.client = new WebClient(token);
    } else {
      this.logger.warn('SLACK_BOT_TOKEN non configurato - Slack disabilitato');
    }
  }

  async sendDirectMessage(slackUserId: string, message: string): Promise<boolean> {
    if (!this.client) {
      this.logger.warn('Slack client non inizializzato');
      return false;
    }

    try {
      await this.client.chat.postMessage({
        channel: slackUserId,
        text: message,
        mrkdwn: true,
      });
      this.logger.log(`Messaggio Slack inviato a ${slackUserId}`);
      return true;
    } catch (error) {
      this.logger.error(`Errore invio Slack a ${slackUserId}: ${error}`);
      return false;
    }
  }

  async sendSoftReminder(slackUserId: string, userName: string, minutesLogged: number, targetMinutes: number): Promise<boolean> {
    const remaining = targetMinutes - minutesLogged;
    const message = `Ciao ${userName}! :wave:\n\nHai registrato *${minutesLogged} minuti* oggi su un target di *${targetMinutes} minuti*.\nTi mancano ancora *${remaining} minuti* da registrare.\n\n:clock3: Ricordati di aggiornare il time report!`;

    return this.sendDirectMessage(slackUserId, message);
  }

  async sendHardReminder(slackUserId: string, userName: string, minutesLogged: number, targetMinutes: number): Promise<boolean> {
    const message = `Ciao ${userName}! :bell:\n\n*La tua giornata lavorativa è terminata* ma non hai ancora chiuso il time report.\n\nHai registrato *${minutesLogged}/${targetMinutes} minuti*.\n\n:warning: Per favore chiudi la giornata il prima possibile!`;

    return this.sendDirectMessage(slackUserId, message);
  }

  async sendWeeklyReminder(slackUserId: string, userName: string): Promise<boolean> {
    const message = `Ciao ${userName}! :calendar:\n\n*Non hai ancora inviato il time report della settimana precedente.*\n\n:clipboard: Per favore invia il report settimanale il prima possibile!`;

    return this.sendDirectMessage(slackUserId, message);
  }

  isEnabled(): boolean {
    return this.client !== null;
  }
}
