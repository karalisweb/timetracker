import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AsanaModule } from '../asana/asana.module';
import { ConfigPanelController } from './config-panel.controller';
import { ConfigPanelService } from './config-panel.service';

@Module({
  imports: [PrismaModule, AsanaModule],
  controllers: [ConfigPanelController],
  providers: [ConfigPanelService],
  exports: [ConfigPanelService],
})
export class ConfigPanelModule {}
