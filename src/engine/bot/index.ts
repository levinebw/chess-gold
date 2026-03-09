// Bot AI module — barrel export

export type { BotPersona, PiecePriority, EvaluationScore, SpendingDecision } from './types.ts';
export { chooseAction } from './bot.ts';
export { evaluatePosition, evaluateMaterial } from './evaluate.ts';
export { decideSpending } from './strategy.ts';
export { findBestMoves, findCheckmateInOne } from './search.ts';
export { LIZZIE, MAXI, BOT_PERSONAS } from './personas.ts';
