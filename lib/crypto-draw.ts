import crypto from 'crypto';

export interface CandidateTicket {
  ticketNumber: number;
  userId: string;
}

export interface DrawWinnerResult {
  firstPrize: CandidateTicket;
  secondPrize: CandidateTicket;
  thirdPrize: CandidateTicket;
}

/**
 * CSPRNG selection using crypto.randomInt with strict exclusion of previous winners
 */
export function drawWinners(candidates: CandidateTicket[]): DrawWinnerResult {
  if (!candidates || candidates.length < 3) {
    throw new Error('At least 3 confirmed tickets are required to conduct a 3-prize draw.');
  }

  // 1st Prize Draw
  const firstIndex = crypto.randomInt(0, candidates.length);
  const firstPrize = candidates[firstIndex];

  // Exclude 1st prize winner from 2nd prize
  const poolForSecond = candidates.filter((t) => t.ticketNumber !== firstPrize.ticketNumber);
  const secondIndex = crypto.randomInt(0, poolForSecond.length);
  const secondPrize = poolForSecond[secondIndex];

  // Exclude 1st and 2nd prize winners from 3rd prize
  const poolForThird = poolForSecond.filter((t) => t.ticketNumber !== secondPrize.ticketNumber);
  const thirdIndex = crypto.randomInt(0, poolForThird.length);
  const thirdPrize = poolForThird[thirdIndex];

  return {
    firstPrize,
    secondPrize,
    thirdPrize,
  };
}
