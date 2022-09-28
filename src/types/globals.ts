export const KEY_GAME_END = 'gameEnd';

export interface GameEndEventParams {
    time: number;
    collected: number;
    score: number;
}
