import {
    type GameEndEventParams,
    type PowerChangeEventParams,
    type ScoreChangeEventParams,
    EVENT_GAME_END,
    EVENT_POWER_CHANGE,
    EVENT_SCORE_CHANGE,
    API_URL,
    HexColour,
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
const resultsInput = document.getElementById('input-name') as HTMLInputElement;
const btnResultsSubmit = document.getElementById('btn-submit') as HTMLButtonElement;
const btnChangeStats = document.getElementById('btn-change-stats') as HTMLButtonElement;
const modalChangeStats = document.getElementById('modal-change-stats') as HTMLDivElement;
const inputChangeColour = document.getElementById('input-change-colour') as HTMLInputElement;
const sliderSize = document.getElementById('slider-size') as HTMLInputElement;
const statsMeter = document.getElementById('stats-meter') as HTMLSpanElement;
const sliderSpeed = document.getElementById('slider-speed') as HTMLInputElement;
const sliderInvTime = document.getElementById('slider-inv-time') as HTMLInputElement;
const sliderChargesNeeded = document.getElementById('slider-charges-needed') as HTMLInputElement;
const canvasPreview = document.getElementById('stats-canvas') as HTMLCanvasElement;
const containerCanvasPreivew = document.getElementById('container-stats-canvas') as HTMLDivElement;
const btnLeaderboard = document.getElementById('btn-leaderboard') as HTMLButtonElement;
const modalLeaderboard = document.getElementById('modal-leaderboard') as HTMLDivElement;
const textLeaderboardLoad = document.getElementById('text-leaderboard-load') as HTMLParagraphElement;
const tableLeaderboard = document.getElementById('table-leaderboard') as HTMLTableElement;
const tableBodyLeaderboard = document.getElementById('leaderboard-table-body') as HTMLBodyElement;
const btnScoreBack = document.getElementById('btn-score-back') as HTMLButtonElement;
const btnScoreNext = document.getElementById('btn-score-next') as HTMLButtonElement;
const containerScoreBtns = document.getElementById('container-score-btns') as HTMLDivElement;
const textScoreSubmit = document.getElementById('text-score-submit') as HTMLParagraphElement;
const restartBtns = document.querySelectorAll('.btn-restart') as NodeListOf<HTMLButtonElement>;

const game = new Game(canvas);

const modals: Array<HTMLDivElement> = [
    modalResults,
    modalChangeStats,
    modalLeaderboard,
];
modalBackdrop.innerHTML = '';

let playerSize = game.getStoredPlayerSize();
sliderSize.value = String(playerSize);

const sharedSliders: Array<HTMLInputElement> = [
    sliderSpeed,
    sliderInvTime,
    sliderChargesNeeded,
];

const DEFAULT_SHARED = 0.5;
const MAX_SHARED = (DEFAULT_SHARED * sharedSliders.length);

let playerSpeed = game.getStoredPlayerSpeed();
sliderSpeed.value = String(playerSpeed);
let playerInvTime = game.getStoredPlayerInvTime();
sliderInvTime.value = String(playerInvTime);
let playerChargesNeeded = game.getStoredPlayerChargesNeeded();
sliderChargesNeeded.value = String(1 - playerChargesNeeded);
inputChangeColour.value = game.getStoredPlayerColour();

const updateStatsMeter = () => {
    const currSharedValue = sharedSliders.reduce(
        (prev, curr) => prev + Number(curr.value),
        0,
    );
    const percentUsed = currSharedValue / MAX_SHARED;
    statsMeter.style.width = `${(1 - percentUsed) * 100}%`;
};
updateStatsMeter();

// Click restart button
const cbRestart = () => {
    for (const modal of modals) {
        modal.style.opacity = '0';
    }
    modalBackdrop.style.backgroundColor = 'rgb(0, 0, 0, 0)';
    modalBackdrop.style.pointerEvents = 'none';
    modalBackdrop.innerHTML = '';

    game.restartGame();
};
restartBtns.forEach(el => el.addEventListener('click', cbRestart));
window.addEventListener('keydown', e => {
    if (
        (
            e.code === 'Space' ||
            e.code === 'Enter'
        ) &&
        resultsInput !== document.activeElement
    ) {
        cbRestart();
    }
});

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

// Stats sliders
sliderSize.addEventListener('input', e => {
    const newSizeVal = +(e.target as HTMLInputElement).value;
    game.updatePlayerSize(newSizeVal);
    playerSize = newSizeVal;
});
sliderSpeed.addEventListener('input', e => {
    const newSpeedVal = +(e.target as HTMLInputElement).value;
    if (newSpeedVal + playerInvTime + playerChargesNeeded > MAX_SHARED) {
        sliderSpeed.value = String(playerSpeed);
        return;
    }

    game.updatePlayerSpeed(newSpeedVal);
    playerSpeed = newSpeedVal;
    updateStatsMeter();
});
sliderInvTime.addEventListener('input', e => {
    const newInvTime = +(e.target as HTMLInputElement).value;
    if (newInvTime + playerSpeed + playerChargesNeeded > MAX_SHARED) {
        sliderInvTime.value = String(playerInvTime);
        return;
    }

    game.updatePlayerInvTime(newInvTime);
    playerInvTime = newInvTime;
    updateStatsMeter();
});
sliderChargesNeeded.addEventListener('input', e => {
    const newChargesNeeded = +(e.target as HTMLInputElement).value;
    if (newChargesNeeded + playerSpeed + playerInvTime > MAX_SHARED) {
        sliderChargesNeeded.value = String(playerChargesNeeded);
        return;
    }

    game.updatePreviewChargesNeeded(newChargesNeeded);
    playerChargesNeeded = newChargesNeeded;
    updateStatsMeter();
});

inputChangeColour.addEventListener('input', e => {
    const input = (e.target as HTMLInputElement).value;

    if (!input) {
        return;
    }

    let strHex = input;
    if (!input.startsWith('#')) {
        strHex = `#${input}`;
    }

    game.updatePreviewColour(strHex as HexColour);
});

// Click show leaderboard
let leaderboardOffset = 0;
const LEADERBOARD_PAGE_SIZE = 20;

const cbFetchLeaderboard = () => {
    fetch(`${API_URL}?limit=${LEADERBOARD_PAGE_SIZE}&offset=${leaderboardOffset}`)
        .then(response => response.json())
        .then(({ results }) => {
            if (!results.length) {
                leaderboardOffset -= LEADERBOARD_PAGE_SIZE;
                return;
            }

            let builtRows = '';
            for (const i in results) {
                builtRows += `
                    <tr>
                        <td>${leaderboardOffset + Number(i) + 1}</td>
                        <td>${results[i].Name}</td>
                        <td>${results[i].Score}</td>
                        <td>${
                            new Date(results[i].TimeTaken * 1000)
                                .toISOString()
                                .substring(11, 19)
                        }</td>
                        <td>${
                            new Date(results[i].TimeSubmitted * 1000).toLocaleString()
                        }</td>
                    </tr>
                `;
            }

            textLeaderboardLoad.style.display = 'none';
            tableLeaderboard.style.display = 'block';
            tableBodyLeaderboard.innerHTML = builtRows;
    })
    .catch(console.error);
};
const cbShowLeaderboard = () => {
    game.stopGame();
    powerMeter.style.width = '0%';
    currentScore.innerText = '0';

    modalBackdrop.appendChild(modalLeaderboard);
    setTimeout(() => {
        modalBackdrop.style.pointerEvents = 'all';
        modalBackdrop.style.backgroundColor = 'rgb(0, 0, 0, 0.5)';
        modalLeaderboard.style.opacity = '1';
        cbFetchLeaderboard();
    }, 5);
}
btnLeaderboard.addEventListener('click', cbShowLeaderboard);

btnScoreNext.addEventListener('click', () => {
    leaderboardOffset += LEADERBOARD_PAGE_SIZE;
    modalLeaderboard.scroll({ top: 0, behavior: 'smooth' });
    cbFetchLeaderboard();
});
btnScoreBack.addEventListener('click', () => {
    if (leaderboardOffset === 0) {
        return;
    }

    leaderboardOffset = Math.max(0, leaderboardOffset - LEADERBOARD_PAGE_SIZE);
    modalLeaderboard.scroll({ top: 0, behavior: 'smooth' });
    cbFetchLeaderboard();
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

// Submit score
btnResultsSubmit.addEventListener('click', () => {
    containerScoreBtns.style.display = 'none';
    textScoreSubmit.style.display = 'block';

    const { Score, TimeTaken } = game.getGameResults();
    const name = resultsInput.value || 'Anon';
    fetch(
        API_URL,
        {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                Score: Score,
                Time: Math.floor(TimeTaken / 1000),
                Name: name,
            }),
        },
    )
        .then(() => {
            containerScoreBtns.style.display = 'block';
            textScoreSubmit.style.display = 'none';
            modalResults.style.opacity = '0';
            modalBackdrop.style.backgroundColor = 'rgb(0, 0, 0, 0)';
            modalBackdrop.style.pointerEvents = 'none';
            modalBackdrop.innerHTML = '';
            leaderboardOffset = 0;
            setTimeout(cbShowLeaderboard, 5);
        })
        .catch(console.error);
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
