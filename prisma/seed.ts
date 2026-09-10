import { PrismaClient, AdminRole, RoundStatus, TicketStatus, PaymentMethodCode } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Yalfal Online Eta database seed (DEVELOPMENT / INITIAL SETUP)...');

  // 1. Seed Super Admin
  const adminEmail = 'admin@yalfal.et';
  const existingAdmin = await prisma.admin.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('AdminPassword2026!', 10);
    const admin = await prisma.admin.create({
      data: {
        email: adminEmail,
        passwordHash,
        name: 'Super Admin',
        role: AdminRole.SUPER_ADMIN,
        permissions: [
          'MANAGE_ROUNDS',
          'REVIEW_PAYMENTS',
          'MANAGE_USERS',
          'DRAW_WINNERS',
          'MANAGE_SETTINGS',
          'VIEW_AUDIT',
          'BROADCAST',
        ],
      },
    });
    console.log(`✓ Created Super Admin: ${admin.email}`);
  } else {
    console.log(`ℹ Super Admin already exists: ${adminEmail}`);
  }

  // 2. Seed Payment Methods (CBE & Telebirr)
  const cbeMethod = await prisma.paymentMethod.upsert({
    where: { code: PaymentMethodCode.CBE },
    update: {
      accountNumber: '1000346643289',
    },
    create: {
      code: PaymentMethodCode.CBE,
      accountName: 'Yalfal Online Eta Ltd.',
      accountNumber: '1000346643289',
      instructions: 'Transfer exact 100 ETB per ticket to our CBE account. Capture screenshot of receipt showing reference ID.',
      isActive: true,
    },
  });
  console.log(`✓ Configured payment method: ${cbeMethod.code} (${cbeMethod.accountNumber})`);

  const telebirrMethod = await prisma.paymentMethod.upsert({
    where: { code: PaymentMethodCode.TELEBIRR },
    update: {
      accountNumber: '0913344061',
    },
    create: {
      code: PaymentMethodCode.TELEBIRR,
      accountName: 'Yalfal Online Eta',
      accountNumber: '0913344061',
      instructions: 'Send 100 ETB via Telebirr. Capture screenshot or PDF showing the transaction SMS / confirmation code.',
      isActive: true,
    },
  });
  console.log(`✓ Configured payment method: ${telebirrMethod.code} (${telebirrMethod.accountNumber})`);

  // 3. Seed System Settings
  const settings = [
    { key: 'PLATFORM_NAME', value: 'Yalfal Online Eta', description: 'Platform official name' },
    { key: 'TAGLINE', value: 'Your Number. Your Chance. Your Moment.', description: 'Official slogan' },
    { key: 'SUPPORT_PHONE', value: '+251911000000', description: 'Customer support phone line' },
    { key: 'SUPPORT_TELEGRAM', value: '@YalfalSupport', description: 'Telegram support handle' },
    { key: 'TICKET_PRICE', value: '100', description: 'Standard ticket entry price in ETB' },
    { key: 'MAX_TICKETS_PER_ROUND', value: '200', description: 'Capacity of numbers per round' },
    { key: 'CBE_ACCOUNT_NUMBER', value: '1000346643289', description: 'CBE payment account number' },
    { key: 'CBE_ACCOUNT_NAME', value: 'Yalfal Online Eta Lottery', description: 'CBE beneficiary name' },
    { key: 'TELEBIRR_PHONE', value: '0913344061', description: 'Telebirr payment phone number' },
    { key: 'TELEBIRR_ACCOUNT_NAME', value: 'Yalfal Online Eta', description: 'Telebirr account name' },
  ];

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }
  console.log(`✓ Seeded ${settings.length} system settings`);

  // 4. Seed Active Lottery Round #001 if none exists
  const existingRound = await prisma.lotteryRound.findUnique({
    where: { roundNumber: 1 },
  });

  if (!existingRound) {
    const round = await prisma.lotteryRound.create({
      data: {
        roundNumber: 1,
        name: 'Grand Genesis Draw #001',
        ticketPrice: 100.0,
        maxTickets: 200,
        firstPrize: 10000.0,
        secondPrize: 1000.0,
        thirdPrize: 500.0,
        status: RoundStatus.OPEN,
        startDate: new Date(),
      },
    });

    // Pre-create all 200 tickets (1 to 200) for this round
    const ticketData = [];
    for (let i = 1; i <= 200; i++) {
      ticketData.push({
        roundId: round.id,
        ticketNumber: i,
        status: TicketStatus.AVAILABLE,
      });
    }

    await prisma.ticket.createMany({
      data: ticketData,
    });

    console.log(`✓ Created Round #001 (${round.name}) with 200 available tickets (1-200)`);
  } else {
    console.log(`ℹ Round #001 already exists`);
  }

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error running seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
