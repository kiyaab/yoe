import { drawWinners, CandidateTicket } from '../lib/crypto-draw';

describe('CSPRNG Lottery Draw Engine', () => {
  it('should select 3 distinct winners for 1st, 2nd, and 3rd prizes', () => {
    const candidates: CandidateTicket[] = Array.from({ length: 200 }, (_, i) => ({
      ticketNumber: i + 1,
      userId: `user_${i + 1}`,
    }));

    const result = drawWinners(candidates);

    expect(result.firstPrize).toBeDefined();
    expect(result.secondPrize).toBeDefined();
    expect(result.thirdPrize).toBeDefined();

    // Ensure all 3 winning ticket numbers are distinct
    expect(result.firstPrize.ticketNumber).not.toBe(result.secondPrize.ticketNumber);
    expect(result.firstPrize.ticketNumber).not.toBe(result.thirdPrize.ticketNumber);
    expect(result.secondPrize.ticketNumber).not.toBe(result.thirdPrize.ticketNumber);

    // Ensure ticket numbers are valid range (1–200)
    expect(result.firstPrize.ticketNumber).toBeGreaterThanOrEqual(1);
    expect(result.firstPrize.ticketNumber).toBeLessThanOrEqual(200);
  });

  it('should throw an error if fewer than 3 candidates are provided', () => {
    const fewCandidates: CandidateTicket[] = [
      { ticketNumber: 1, userId: 'user_1' },
      { ticketNumber: 2, userId: 'user_2' },
    ];

    expect(() => drawWinners(fewCandidates)).toThrow(
      'At least 3 confirmed tickets are required to conduct a 3-prize draw.'
    );
  });
});
