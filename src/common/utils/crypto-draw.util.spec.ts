import { selectCryptographicWinner, EligibleTicket } from './crypto-draw.util';

describe('Cryptographic Draw Engine (CSPRNG)', () => {
  const mockTickets: EligibleTicket[] = [
    { id: 't-1', ticketNumber: 1, userId: 'u-1' },
    { id: 't-2', ticketNumber: 2, userId: 'u-2' },
    { id: 't-3', ticketNumber: 3, userId: 'u-3' },
    { id: 't-87', ticketNumber: 87, userId: 'u-87' },
    { id: 't-200', ticketNumber: 200, userId: 'u-200' },
  ];

  it('should securely select a valid winner from eligible tickets', () => {
    const result = selectCryptographicWinner(mockTickets);
    expect(result).toBeDefined();
    expect(result.winnerTicketId).toBeDefined();
    expect(mockTickets.map((t) => t.id)).toContain(result.winnerTicketId);
    expect(result.randomnessMetadata.algorithm).toContain('CSPRNG');
    expect(result.randomnessMetadata.drawSeedHex).toBeDefined();
    expect(result.randomnessMetadata.eligibleCount).toBe(5);
  });

  it('should strictly exclude previously awarded winners (1st prize cannot win 2nd or 3rd)', () => {
    const firstWinner = selectCryptographicWinner(mockTickets);
    const secondWinner = selectCryptographicWinner(mockTickets, [firstWinner.winnerTicketId]);

    expect(secondWinner.winnerTicketId).not.toBe(firstWinner.winnerTicketId);
    expect(secondWinner.randomnessMetadata.eligibleCount).toBe(4);

    const thirdWinner = selectCryptographicWinner(mockTickets, [
      firstWinner.winnerTicketId,
      secondWinner.winnerTicketId,
    ]);

    expect(thirdWinner.winnerTicketId).not.toBe(firstWinner.winnerTicketId);
    expect(thirdWinner.winnerTicketId).not.toBe(secondWinner.winnerTicketId);
    expect(thirdWinner.randomnessMetadata.eligibleCount).toBe(3);
  });

  it('should throw an error when no eligible candidates exist', () => {
    expect(() => selectCryptographicWinner([])).toThrow(
      'No eligible tickets available for draw selection'
    );
  });
});
