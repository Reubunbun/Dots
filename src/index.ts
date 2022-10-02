import {
    type GameEndEventParams,
    type PowerChangeEventParams,
    EVENT_GAME_END,
    EVENT_POWER_CHANGE,
} from './types/globals';
declare global {
    interface DocumentEventMap {
        [EVENT_GAME_END]: CustomEvent<GameEndEventParams>;
        [EVENT_POWER_CHANGE]: CustomEvent<PowerChangeEventParams>;
    }
}

import './styles.css';
import Game from './lib/Game';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const UIBar = document.getElementById('UI-bar') as HTMLDivElement;
const powerMeter = document.getElementById('power-meter') as HTMLSpanElement;
const modalBackdrop = document.getElementById('modal-backdrop') as HTMLDivElement;
const modalEditStats = document.getElementById('modal-edit-stats') as HTMLDivElement;
const modalResults = document.getElementById('modal-results-screen') as HTMLDivElement;
const resultsTotalText = document.getElementById('results-collected') as HTMLSpanElement;
const resultsTimeText = document.getElementById('results-time') as HTMLSpanElement;
const resultsScoreText = document.getElementById('results-score') as HTMLSpanElement;
const restartBtns = document.querySelectorAll('.btn-restart') as NodeListOf<HTMLButtonElement>;

const modals: Array<HTMLDivElement> = [
    modalResults,
    modalEditStats,
];
modalBackdrop.innerHTML = '';

let game = new Game(canvas);

restartBtns.forEach(el => el.addEventListener('click', () => {
    for (const modal of modals) {
        modal.style.opacity = '0';
    }
    modalBackdrop.style.backgroundColor = 'rgb(0, 0, 0, 0)';
    modalBackdrop.style.pointerEvents = 'none';
    modalBackdrop.innerHTML = '';

    game.stop(true);
    game = new Game(canvas);
    game.start();
}));

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
});
document.addEventListener(EVENT_POWER_CHANGE, e => {
    powerMeter.style.transition = `width ${e.detail.transitionTime}ms ease`;
    powerMeter.style.width = `${e.detail.percent}%`;
});
document.addEventListener(EVENT_GAME_END, e => {
    powerMeter.style.width = '0%';

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

const callbackResize = () => {
    const UIHeight = UIBar.getBoundingClientRect().height;
    const heightToUse = (window.innerHeight - UIHeight) * 0.9
    const screenXPadding = game.resize(window.innerWidth, heightToUse);
    const UIWidth = window.innerWidth - (screenXPadding * 2);
    UIBar.style.width = `${UIWidth}px`;
    UIBar.style.paddingLeft = `${screenXPadding}px`;
};
callbackResize();
window.addEventListener(
    'resize',
    callbackResize,
);

game.start();
