import { PrismaClient, TicketStatus, RoundStatus } from '@prisma/client';
import { TicketsService } from '../src/tickets/tickets.service';

describe('Critical Concurrency Race Condition Test (Section 56)', () => {
  let prisma: PrismaClient;
  let ticketsService: TicketsService;
  let testRoundId: string;

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();
    ticketsService = new TicketsService(prisma as any);

    // Ensure an open round exists
    let round = await prisma.lotteryRound.findFirst({
      where: { status: RoundStatus.OPEN },
    });

    if (!round) {
      round = await prisma.lotteryRound.create({
        data: {
          roundNumber: 999,
          name: 'Concurrency Test Round',
          status: RoundStatus.OPEN,
          ticketPrice: 100,
          maxTickets: 200,
        },
      });
      await prisma.ticket.create({
        data: {
          roundId: round.id,
          ticketNumber: 87,
          status: TicketStatus.AVAILABLE,
        },
      });
    }

    testRoundId = round.id;

    // Reset Ticket #87 to AVAILABLE
    await prisma.ticket.upsert({
      where: {
        roundId_ticketNumber: {
          roundId: testRoundId,
          ticketNumber: 87,
        },
      },
      update: {
        status: TicketStatus.AVAILABLE,
        userId: null,
        reservedAt: null,
      },
      create: {
        roundId: testRoundId,
        ticketNumber: 87,
        status: TicketStatus.AVAILABLE,
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should enforce strict database-level locking when two users race to purchase Ticket #87 simultaneously', async () => {
    const userA = {
      ticketNumber: 87,
      roundId: testRoundId,
      telegramId: 'simulated_user_A_99991',
      username: 'user_alpha',
    };

    const userB = {
      ticketNumber: 87,
      roundId: testRoundId,
      telegramId: 'simulated_user_B_99992',
      username: 'user_beta',
    };

    // Fire both reservation requests at the exact same millisecond
    const results = await Promise.allSettled([
      ticketsService.reserveTicket(userA),
      ticketsService.reserveTicket(userB),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[];

    // Exactly one user MUST succeed
    expect(fulfilled).toHaveLength(1);
    // Exactly one user MUST fail
    expect(rejected).toHaveLength(1);

    // The failing user MUST receive the user-friendly race condition error
    expect(rejected[0].reason.message).toContain('is no longer available');

    // Verify at the database level that Ticket #87 is assigned to only ONE user
    const dbTicket = await prisma.ticket.findUnique({
      where: {
        roundId_ticketNumber: {
          roundId: testRoundId,
          ticketNumber: 87,
        },
      },
      include: { user: true },
    });

    expect(dbTicket).toBeDefined();
    expect(dbTicket!.status).toBe(TicketStatus.RESERVED);
    expect(
      dbTicket!.user!.telegramId === userA.telegramId ||
        dbTicket!.user!.telegramId === userB.telegramId
    ).toBe(true);
  });
});
