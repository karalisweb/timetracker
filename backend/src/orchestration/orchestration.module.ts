import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AsanaModule } from '../asana/asana.module';

// Projects
import { OrchProjectsController } from './projects/orch-projects.controller';
import { OrchProjectsService } from './projects/orch-projects.service';

// Checklists
import { ChecklistTemplatesController } from './checklists/checklist-templates.controller';
import { ChecklistTemplatesService } from './checklists/checklist-templates.service';

// Gates
import { GateService } from './gates/gate.service';

@Module({
  imports: [PrismaModule, forwardRef(() => AsanaModule)],
  controllers: [
    OrchProjectsController,
    ChecklistTemplatesController,
  ],
  providers: [
    OrchProjectsService,
    ChecklistTemplatesService,
    GateService,
  ],
  exports: [
    OrchProjectsService,
    ChecklistTemplatesService,
    GateService,
  ],
})
export class OrchestrationModule {}
