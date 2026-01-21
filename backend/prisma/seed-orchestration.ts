import { PrismaClient, ChecklistCategory, GateName } from '@prisma/client';

const prisma = new PrismaClient();

async function seedOrchestration() {
  console.log('🌱 Seeding Orchestration module...');

  // ============================================
  // Checklist Templates
  // ============================================

  const templates = [
    {
      name: 'SEO Base',
      category: ChecklistCategory.seo,
      version: 1,
      defaultMinutes: 60,
      items: [
        { label: 'noindex disattivato', required: true, sortOrder: 1 },
        { label: 'sitemap generata', required: true, sortOrder: 2 },
        { label: 'homepage indicizzabile', required: true, sortOrder: 3 },
        { label: 'title e meta description presenti', required: true, sortOrder: 4 },
      ],
    },
    {
      name: 'Tecnica Post-Pubblicazione',
      category: ChecklistCategory.technical,
      version: 1,
      defaultMinutes: 45,
      items: [
        { label: 'sito accessibile', required: true, sortOrder: 1 },
        { label: 'cache attiva', required: true, sortOrder: 2 },
        { label: 'backup attivo', required: true, sortOrder: 3 },
        { label: 'errori bloccanti assenti', required: true, sortOrder: 4 },
      ],
    },
    {
      name: 'Privacy Essenziale',
      category: ChecklistCategory.privacy,
      version: 1,
      defaultMinutes: 30,
      items: [
        { label: 'privacy policy collegata', required: true, sortOrder: 1 },
        { label: 'cookie banner attivo', required: true, sortOrder: 2 },
        { label: 'form conformi', required: true, sortOrder: 3 },
      ],
    },
    {
      name: 'Performance Minima',
      category: ChecklistCategory.performance,
      version: 1,
      defaultMinutes: 60,
      items: [
        { label: 'sito utilizzabile da mobile', required: true, sortOrder: 1 },
        { label: 'caricamento accettabile', required: true, sortOrder: 2 },
      ],
    },
    {
      name: 'Backend CMS - Proposte Viaggio',
      category: ChecklistCategory.backend,
      version: 1,
      defaultMinutes: 120,
      items: [
        { label: 'CPT dedicato creato', required: true, sortOrder: 1 },
        { label: 'campi ACF configurati', required: true, sortOrder: 2 },
        { label: 'ruolo cliente configurato', required: true, sortOrder: 3 },
        { label: 'backend testato con utente cliente', required: true, sortOrder: 4 },
        { label: 'nessun uso del blog', required: true, sortOrder: 5 },
      ],
    },
  ];

  const createdTemplates: Record<string, string> = {};

  for (const template of templates) {
    const existing = await prisma.checklistTemplate.findFirst({
      where: { name: template.name, version: template.version },
    });

    if (existing) {
      console.log(`  ⏭️  Template "${template.name}" already exists`);
      createdTemplates[template.name] = existing.id;
      continue;
    }

    const created = await prisma.checklistTemplate.create({
      data: {
        name: template.name,
        category: template.category,
        version: template.version,
        defaultMinutes: template.defaultMinutes,
        items: {
          create: template.items,
        },
      },
    });

    createdTemplates[template.name] = created.id;
    console.log(`  ✅ Created template: ${template.name}`);
  }

  // ============================================
  // Gates
  // ============================================

  const gates = [
    {
      name: GateName.published,
      displayName: 'Pubblicato',
      description: 'Il sito è online e accessibile',
      sortOrder: 1,
    },
    {
      name: GateName.delivered,
      displayName: 'Consegnato',
      description: 'Il progetto è completo e consegnato al cliente',
      sortOrder: 2,
    },
  ];

  const createdGates: Record<string, string> = {};

  for (const gate of gates) {
    const existing = await prisma.gate.findUnique({
      where: { name: gate.name },
    });

    if (existing) {
      console.log(`  ⏭️  Gate "${gate.displayName}" already exists`);
      createdGates[gate.name] = existing.id;
      continue;
    }

    const created = await prisma.gate.create({
      data: gate,
    });

    createdGates[gate.name] = created.id;
    console.log(`  ✅ Created gate: ${gate.displayName}`);
  }

  // ============================================
  // Gate Requirements
  // ============================================

  const requirements = [
    // Gate: Pubblicato - richiede SEO, Tecnica, Privacy
    {
      gateName: GateName.published,
      templateName: 'SEO Base',
      requiredIfAssigned: false,
    },
    {
      gateName: GateName.published,
      templateName: 'Tecnica Post-Pubblicazione',
      requiredIfAssigned: false,
    },
    {
      gateName: GateName.published,
      templateName: 'Privacy Essenziale',
      requiredIfAssigned: false,
    },
    // Gate: Consegnato - richiede Performance (solo se assegnata)
    {
      gateName: GateName.delivered,
      templateName: 'Performance Minima',
      requiredIfAssigned: true,
    },
  ];

  for (const req of requirements) {
    const gateId = createdGates[req.gateName];
    const templateId = createdTemplates[req.templateName];

    if (!gateId || !templateId) {
      console.log(`  ⚠️  Skipping requirement: gate or template not found`);
      continue;
    }

    const existing = await prisma.gateRequirement.findUnique({
      where: {
        gateId_checklistTemplateId: {
          gateId,
          checklistTemplateId: templateId,
        },
      },
    });

    if (existing) {
      console.log(`  ⏭️  Requirement "${req.gateName} -> ${req.templateName}" already exists`);
      continue;
    }

    await prisma.gateRequirement.create({
      data: {
        gateId,
        checklistTemplateId: templateId,
        requiredIfAssigned: req.requiredIfAssigned,
      },
    });

    console.log(`  ✅ Created requirement: ${req.gateName} -> ${req.templateName}`);
  }

  console.log('✅ Orchestration seeding complete!');
}

// Run if called directly
seedOrchestration()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

export { seedOrchestration };
