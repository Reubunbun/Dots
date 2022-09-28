import { type GameEndEventParams, KEY_GAME_END } from './types/globals';
declare global {
    interface DocumentEventMap {
        [KEY_GAME_END]: CustomEvent<GameEndEventParams>;
    }
}

import './styles.css';
import Game from './lib/Game';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const UIBar = document.getElementById('UI-bar') as HTMLDivElement;
const game = new Game(canvas);

const callbackResize = () => {
    const UIHeight = UIBar.getBoundingClientRect().height;
    const heightToUse = (window.innerHeight - UIHeight) * 0.9
    game.resize(window.innerWidth, heightToUse);
}

callbackResize();
window.addEventListener(
    'resize',
    callbackResize,
);

document.addEventListener(KEY_GAME_END, e => {
    console.log('GAME ENDED!', e.detail);
});

game.start();
console.log('after game start');
