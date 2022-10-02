import { type GameEndEventParams, EVENT_GAME_END } from './types/globals';
declare global {
    interface DocumentEventMap {
        [EVENT_GAME_END]: CustomEvent<GameEndEventParams>;
    }
}

import './styles.css';
import Game from './lib/Game';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const UIBar = document.getElementById('UI-bar') as HTMLDivElement;
const btnRestart = document.getElementById('btn-restart') as HTMLButtonElement;
let game = new Game(canvas);

btnRestart.addEventListener('click', () => {
    game.stop();
    game = new Game(canvas);
    game.start();
});

document.addEventListener(EVENT_GAME_END, e => {
    console.log('GAME ENDED!', e.detail);
});

const callbackResize = () => {
    const UIHeight = UIBar.getBoundingClientRect().height;
    const heightToUse = (window.innerHeight - UIHeight) * 0.9
    game.resize(window.innerWidth, heightToUse);
};
callbackResize();
window.addEventListener(
    'resize',
    callbackResize,
);

game.start();
