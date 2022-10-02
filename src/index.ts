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
const btnRestart = document.getElementById('btn-restart') as HTMLButtonElement;
const powerMeter = document.getElementById('power-meter') as HTMLSpanElement;
let game = new Game(canvas);

btnRestart.addEventListener('click', () => {
    game.stop();
    game = new Game(canvas);
    game.start();
});

document.addEventListener(EVENT_POWER_CHANGE, e => {
    powerMeter.style.transition = `width ${e.detail.transitionTime}ms ease`;
    powerMeter.style.width = `${e.detail.percent}%`;
});
document.addEventListener(EVENT_GAME_END, e => {
    powerMeter.style.width = '0%';
    console.log('GAME ENDED!', e.detail);
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
