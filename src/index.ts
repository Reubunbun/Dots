import {
    type GameEndEventParams,
    type PowerChangeEventParams,
    type ScoreChangeEventParams,
    EVENT_GAME_END,
    EVENT_POWER_CHANGE,
    EVENT_SCORE_CHANGE,
} from './types/globals';
declare global {
    interface DocumentEventMap {
        [EVENT_GAME_END]: CustomEvent<GameEndEventParams>;
        [EVENT_POWER_CHANGE]: CustomEvent<PowerChangeEventParams>;
        [EVENT_SCORE_CHANGE]: CustomEvent<ScoreChangeEventParams>;
    }
}

import './styles.css';
import Game from './lib/Game';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const UIBar = document.getElementById('UI-bar') as HTMLDivElement;
const powerMeter = document.getElementById('power-meter') as HTMLSpanElement;
const currentScore = document.getElementById('current-score') as HTMLSpanElement;
const modalBackdrop = document.getElementById('modal-backdrop') as HTMLDivElement;
const modalResults = document.getElementById('modal-results-screen') as HTMLDivElement;
const resultsTotalText = document.getElementById('results-collected') as HTMLSpanElement;
const resultsTimeText = document.getElementById('results-time') as HTMLSpanElement;
const resultsScoreText = document.getElementById('results-score') as HTMLSpanElement;
const btnChangeStats = document.getElementById('btn-change-stats') as HTMLButtonElement;
const modalChangeStats = document.getElementById('modal-change-stats') as HTMLDivElement;
const sliderSize = document.getElementById('slider-size') as HTMLInputElement;
const sliderSpeed = document.getElementById('slider-speed') as HTMLInputElement;
const sliderInvTime = document.getElementById('slider-inv-time') as HTMLInputElement;
const sliderChargesNeeded = document.getElementById('slider-charges-needed') as HTMLInputElement;
const canvasPreview = document.getElementById('stats-canvas') as HTMLCanvasElement;
const containerCanvasPreivew = document.getElementById('container-stats-canvas') as HTMLDivElement;
const restartBtns = document.querySelectorAll('.btn-restart') as NodeListOf<HTMLButtonElement>;

const modals: Array<HTMLDivElement> = [
    modalResults,
    modalChangeStats,
];
modalBackdrop.innerHTML = '';

let game = new Game(canvas);

// Click restart button
restartBtns.forEach(el => el.addEventListener('click', () => {
    for (const modal of modals) {
        modal.style.opacity = '0';
    }
    modalBackdrop.style.backgroundColor = 'rgb(0, 0, 0, 0)';
    modalBackdrop.style.pointerEvents = 'none';
    modalBackdrop.innerHTML = '';

    game.restartGame();
}));

// Click change stats button
btnChangeStats.addEventListener('click', () => {
    game.stopGame();
    powerMeter.style.width = '0%';
    currentScore.innerText = '0';

    modalBackdrop.appendChild(modalChangeStats);
    setTimeout(() => {
        modalBackdrop.style.pointerEvents = 'all';
        modalBackdrop.style.backgroundColor = 'rgb(0, 0, 0, 0.5)';
        modalChangeStats.style.opacity = '1';

        const {width, height} = containerCanvasPreivew.getBoundingClientRect();
        game.startPreview(canvasPreview);
        game.resizePreview(width * 0.98, height);
    }, 5);
});
sliderSize.addEventListener('input', e => {
    game.updatePreviewSize(+(e.target as HTMLInputElement).value);
});
sliderSpeed.addEventListener('input', e => {
    game.updatePreviewSpeed(+(e.target as HTMLInputElement).value);
});
sliderInvTime.addEventListener('input', e => {
    game.updatePreviewInvTime(+(e.target as HTMLInputElement).value);
});
sliderChargesNeeded.addEventListener('input', e => {
    game.updatePreviewChargesNeeded(+(e.target as HTMLInputElement).value);
});

// Click backdrop of modal
modalBackdrop.addEventListener('click', e => {
    if (e.target !== modalBackdrop) {
        return;
    }

    for (const modal of modals) {
        modal.style.opacity = '0';
    }
    modalBackdrop.style.backgroundColor = 'rgb(0, 0, 0, 0)';
    modalBackdrop.style.pointerEvents = 'none';
    modalBackdrop.innerHTML = '';

    game.restartGame();
});

// Score changes
document.addEventListener(EVENT_SCORE_CHANGE, e => {
    currentScore.innerText = `${e.detail.score}`;
});

// Power meter changes
document.addEventListener(EVENT_POWER_CHANGE, e => {
    powerMeter.style.transition = `width ${e.detail.transitionTime}ms ease`;
    powerMeter.style.width = `${e.detail.percent}%`;
});

// Game ends
document.addEventListener(EVENT_GAME_END, e => {
    powerMeter.style.width = '0%';
    currentScore.innerText = '0';

    modalBackdrop.appendChild(modalResults);
    setTimeout(() => {
        resultsTotalText.innerText = `${e.detail.collected}`;
        resultsTimeText.innerText = `${(e.detail.time / 1000).toFixed(2)}s`;
        resultsScoreText.innerText = `${e.detail.score}`;

        modalBackdrop.style.pointerEvents = 'all';
        modalBackdrop.style.backgroundColor = 'rgb(0, 0, 0, 0.8)';
        modalResults.style.opacity = '1';
    }, 5);
});

// Screen resize
const callbackResize = () => {
    const UIHeight = UIBar.getBoundingClientRect().height;
    const heightToUse = (window.innerHeight - UIHeight) * 0.9
    const screenXPadding = game.resizeGame(window.innerWidth, heightToUse);
    const UIWidth = window.innerWidth - (screenXPadding * 2);
    UIBar.style.width = `${UIWidth}px`;
    UIBar.style.paddingLeft = `${screenXPadding}px`;
};
callbackResize();
window.addEventListener(
    'resize',
    callbackResize,
);

// Start game
game.startGame();
