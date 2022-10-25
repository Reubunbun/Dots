export type HexColour = `#${string}`;

export const EVENT_GAME_END = 'gameEnd';
export interface GameEndEventParams {
    time: number;
    collected: number;
    score: number;
};

export const EVENT_POWER_CHANGE = 'powerChange';
export interface PowerChangeEventParams {
    percent: number;
    transitionTime: number;
};

export const EVENT_SCORE_CHANGE = 'scoreChange';
export interface ScoreChangeEventParams {
    score: number;
};


export const API_URL = 'https://ojzn0sdtj0.execute-api.eu-west-1.amazonaws.com/prod/scores';
