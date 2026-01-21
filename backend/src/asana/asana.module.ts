import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { AsanaClientService } from './asana-client.service';
import { AsanaTaskService } from './asana-task.service';
import { AsanaWebhookController } from './asana-webhook.controller';
import { AsanaWebhookService } from './asana-webhook.service';
import { OrchestrationModule } from '../orchestration/orchestration.module';

@Module({
  imports: [ConfigModule, PrismaModule, forwardRef(() => OrchestrationModule)],
  controllers: [AsanaWebhookController],
  providers: [AsanaClientService, AsanaTaskService, AsanaWebhookService],
  exports: [AsanaClientService, AsanaTaskService, AsanaWebhookService],
})
export class AsanaModule {}
