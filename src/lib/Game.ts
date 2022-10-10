import {
    type GameEndEventParams,
    type PowerChangeEventParams,
    type ScoreChangeEventParams,
    EVENT_GAME_END,
    EVENT_POWER_CHANGE,
    EVENT_SCORE_CHANGE,
} from '../types/globals';
import Vector from './helpers/Vector';
import lerp from './helpers/Lerp';
import Player from './entities/Player';
import Obstacle from './entities/Obstacle';
import Collectable from './entities/Collectable';
import Particle from  './entities/Particle';
import Entity from './entities/Abstract';

class Game {
    private static readonly MIN_SPAWN_DIST_FROM_PLAYER = 200;
    private static readonly BORDER_COLOUR = '#c022ff'
    private static readonly BORDER_WIDTH = 4;
    private static readonly GAME_REF_WIDTH = 1920 + (Game.BORDER_WIDTH * 2);
    private static readonly GAME_REF_HEIGHT = 903 + (Game.BORDER_WIDTH * 2);
    private static readonly STAGE_WIDTH = Game.GAME_REF_WIDTH - (Game.BORDER_WIDTH * 2);
    private static readonly STAGE_HEIGHT = Game.GAME_REF_HEIGHT - (Game.BORDER_WIDTH * 2);

    private static readonly PREV_BORDER_WIDTH = 1;
    private static readonly PREV_REF_WIDTH = 1020 + (Game.PREV_BORDER_WIDTH * 2);
    private static readonly PREV_REF_HEIGHT = 508 + (Game.PREV_BORDER_WIDTH * 2);
    private static readonly PREV_STAGE_WIDTH = Game.PREV_REF_WIDTH - (Game.BORDER_WIDTH * 2);
    private static readonly PREV_STAGE_HEIGHT = Game.PREV_REF_HEIGHT - (Game.BORDER_WIDTH * 2);

    private _ended: boolean;
    private _timeGameStart: number;
    private _score: number;
    private _collectablesCollected: number;
    private _allObstacles: Set<Obstacle>;
    private _allParticles: Set<Particle>;
    private _times: Array<number>;
    private _collectable: Collectable;
    private _player: Player;
    private _gameAnimationId: number;
    private _lastFrameTime: number;
    private _gameCanvas: HTMLCanvasElement;
    private _gameCtx: CanvasRenderingContext2D;

    private _previewCanvas: HTMLCanvasElement;
    private _previewCtx: CanvasRenderingContext2D;
    private _previewPlayer: Player;
    private _previewAnimationId: number;

    constructor(gameCanvas: HTMLCanvasElement)
    {
        this._gameCanvas = gameCanvas;
        this._gameCtx = gameCanvas.getContext('2d');
    }

    resizeGame(screenWidth: number, screenHeight: number) : number
    {
        return Game.resizeCanvas(
            this._gameCanvas,
            this._gameCtx,
            screenWidth,
            screenHeight,
            Game.GAME_REF_WIDTH,
            Game.GAME_REF_HEIGHT,
        );
    }

    resizePreview(width: number, height: number) : number | null
    {
        if (!this._previewCanvas || !this._previewCtx) {
            return null;
        }

        return Game.resizeCanvas(
            this._previewCanvas,
            this._previewCtx,
            width,
            height,
            Game.PREV_REF_WIDTH,
            Game.PREV_REF_HEIGHT,
        );
    }

    private static resizeCanvas(
        canvas: HTMLCanvasElement,
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number,
        refWidth: number,
        refHeight: number
    ) : number
    {
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        canvas.width = width;
        canvas.height = height;

        const scaleFitNative = Math.min(
            width / refWidth,
            height / refHeight,
        );
        const screenXPadding = (canvas.width - refWidth * scaleFitNative) / 2;

        ctx.setTransform(
            scaleFitNative, 0,
            0, scaleFitNative,
            screenXPadding,
            (canvas.height - refHeight * scaleFitNative) / 2,
        );

        if (scaleFitNative < 1) {
            ctx.imageSmoothingEnabled = true;
        } else {
            ctx.imageSmoothingEnabled = false;
        }

        return screenXPadding;
    }

    startGame() : void
    {
        this._times = [];
        this._ended = false;
        this._timeGameStart = Date.now();
        this._score = 0;
        this._collectablesCollected = 0;
        this._allObstacles = new Set<Obstacle>();
        this._allParticles = new Set<Particle>();

        this._player = new Player(
            new Vector(Game.STAGE_WIDTH / 2, Game.STAGE_HEIGHT / 2),
        );

        const firstObstacle = new Obstacle(
            this._getRandomPositionToSpawn(Obstacle.RADIUS),
        );
        this._allObstacles.add(firstObstacle);

        this._collectable = new Collectable(
            this._getRandomPositionToSpawn(Collectable.RADIUS),
        );

        this._gameAnimationId = requestAnimationFrame(this._nextGameFrame.bind(this));
    }

    stopGame() : void
    {
        cancelAnimationFrame(this._gameAnimationId);

        this._lastFrameTime = undefined;
        this._gameCtx.fillStyle = 'black';
        this._gameCtx.fillRect(-100, -100, Game.GAME_REF_WIDTH + 200, Game.GAME_REF_HEIGHT + 200);
    }

    restartGame() : void
    {
        this.stopGame();
        this.startGame();
    }

    private _nextGameFrame(frameTime: number) : void
    {
        if (this._lastFrameTime === undefined) {
            this._lastFrameTime = frameTime;
            requestAnimationFrame(this._nextGameFrame.bind(this));
            return;
        }

        while (this._times.length > 0 && this._times[0] <= frameTime - 1000) {
            this._times.shift();
        }
        this._times.push(frameTime);
        const fps = this._times.length;

        const deltaTime = (frameTime - this._lastFrameTime) / 1000;
        this._lastFrameTime = frameTime;

        // Background
        this._gameCtx.fillStyle = 'black';
        this._gameCtx.fillRect(
            -100, -100,
            Game.GAME_REF_WIDTH + 200, Game.GAME_REF_HEIGHT + 200,
        );

        // Border
        this._gameCtx.strokeStyle = Game.BORDER_COLOUR;
        this._gameCtx.lineWidth = Game.BORDER_WIDTH;
        this._gameCtx.strokeRect(
            Game.BORDER_WIDTH / 2,
            Game.BORDER_WIDTH / 2,
            Game.GAME_REF_WIDTH - Game.BORDER_WIDTH,
            Game.GAME_REF_HEIGHT - Game.BORDER_WIDTH,
        );
        this._gameCtx.strokeStyle = 'none';

        this._gameCtx.fillStyle = 'white';
        this._gameCtx.font = '48px serif';
        this._gameCtx.fillText(`${fps}`, 10, 50);

        const allEntities: Array<Entity> = [
            this._collectable,
            ...this._allParticles,
            ...this._allObstacles,
        ];

        if (!this._ended) {
            allEntities.push(this._player);
        }

        for (const entity of allEntities) {
            entity.nextFrame(
                deltaTime,
                Game.BORDER_WIDTH,
                Game.STAGE_WIDTH + Game.BORDER_WIDTH,
                Game.BORDER_WIDTH,
                Game.STAGE_HEIGHT + Game.BORDER_WIDTH,
            );

            if (entity instanceof Obstacle) {
                if (entity.isCollidingWith(this._player) && !this._ended) {
                    if (this._player.inPowerup()) {
                        this._increaseScore(20);
                        this._allObstacles.delete(entity);

                        for (let i = 0; i < 5; i++) {
                            this._allParticles.add(new Particle(
                                entity.position,
                                entity.getColourAsObject(),
                                entity.radius,
                                this._player.speed,
                                this._player.velocity
                            ));
                        }
                    } else {
                        this._ended = true;

                        this._allParticles.add(new Particle(
                            this._player.position,
                            this._player.getColourAsObject(),
                            this._player.radius,
                            this._player.speed,
                            this._player.velocity
                        ));

                        document.dispatchEvent(new CustomEvent<GameEndEventParams>(
                            EVENT_GAME_END,
                            {
                                detail: {
                                    score: this._score,
                                    time: Date.now() - this._timeGameStart,
                                    collected: this._collectablesCollected,
                                },
                                bubbles: true,
                            }
                        ));
                    }
                }
            }

            if (entity instanceof Collectable) {
                if (entity.isCollidingWith(this._player) && !this._ended) {
                    this._collectablesCollected++;
                    this._player.addCharge();
                    this._increaseScore(10);

                    document.dispatchEvent(new CustomEvent<PowerChangeEventParams>(
                        EVENT_POWER_CHANGE,
                        {
                            detail: {
                                percent: this._player.getChargePercent(),
                                transitionTime: 750,
                            },
                        }
                    ));

                    for (let i = 0; i < 5; i++) {
                        this._allParticles.add(new Particle(
                            this._collectable.position,
                            this._collectable.getColourAsObject(),
                            this._collectable.radius,
                            this._player.speed,
                            this._player.velocity
                        ));
                    }

                    const nextCollectablePos = this._getRandomPositionToSpawn(
                        Collectable.RADIUS,
                    );
                    this._collectable.resetPosition(nextCollectablePos);

                    this._allObstacles.add(
                        new Obstacle(
                            this._getRandomPositionToSpawn(Obstacle.RADIUS),
                        ),
                    );
                }
            }

            if (entity instanceof Particle) {
                if (entity.shouldDespawn()) {
                    this._allParticles.delete(entity);
                }
            }

            this._gameCtx.fillStyle = entity.colour;
            this._gameCtx.beginPath();
            this._gameCtx.arc(
                entity.x,
                entity.y,
                entity.radius,
                0,
                2 * Math.PI,
            );
            this._gameCtx.fill();

            const {r, g, b, a} = entity.getColourAsObject();
            const maxTailWidth = entity.radius * 2;
            const minTailWidth = 2;
            for (let i = entity.trail.length - 1; i >= 0 ; i--) {
                this._gameCtx.lineWidth = lerp(
                    maxTailWidth,
                    minTailWidth,
                    (entity.trail.length - i) / entity.trail.length,
                    'ease',
                );

                this._gameCtx.beginPath();

                if (i === (entity.trail.length - 1)) {
                    const pointFrom = entity.position;
                    const { Position: pointTo, Opacity } = entity.trail[i];
                    this._gameCtx.strokeStyle = `rgb(${r}, ${g}, ${b}, ${Opacity * a})`;
                    this._gameCtx.moveTo(pointFrom.x, pointFrom.y);
                    this._gameCtx.lineTo(pointTo.x, pointTo.y);
                } else {
                    const { Position: pointFrom } = entity.trail[i + 1];
                    const { Position: pointTo, Opacity } = entity.trail[i];
                    this._gameCtx.strokeStyle = `rgb(${r}, ${g}, ${b}, ${Opacity * a})`;
                    this._gameCtx.moveTo(pointFrom.x, pointFrom.y);
                    this._gameCtx.lineTo(pointTo.x, pointTo.y);
                }

                this._gameCtx.stroke();
            }
        }

        if (this._player.inPowerup()) {
            document.dispatchEvent(new CustomEvent<PowerChangeEventParams>(
                EVENT_POWER_CHANGE,
                {
                    detail: {
                        percent: this._player.getChargePercent(),
                        transitionTime: 100,
                    },
                },
            ));
        }

        this._gameAnimationId = requestAnimationFrame(this._nextGameFrame.bind(this));
    }

    private _increaseScore(increment: number) : void
    {
        this._score += increment;
        document.dispatchEvent(new CustomEvent<ScoreChangeEventParams>(
            EVENT_SCORE_CHANGE,
            {
                detail: {
                    score: this._score,
                },
            },
        ));
    }

    private _getRandomPositionToSpawn(entityRadius: number) : Vector
    {
        const minX = Game.BORDER_WIDTH + entityRadius;
        const maxX = Game.STAGE_WIDTH + Game.BORDER_WIDTH - entityRadius;
        const minY = Game.BORDER_WIDTH + entityRadius;
        const maxY = Game.STAGE_HEIGHT + Game.BORDER_WIDTH - entityRadius;

        const randomPosition = new Vector(
            Math.floor(
                Math.random() * (maxX - minX + 1) + minX,
            ),
            Math.floor(
                Math.random() * (maxY - minY + 1) + minY,
            ),
        );

        const distToPlayer = randomPosition.distanceTo(this._player.position);
        if (distToPlayer < Game.MIN_SPAWN_DIST_FROM_PLAYER) {
            const dirVector = randomPosition
                .subtract(this._player.position)
                .mult(1/distToPlayer);
            const distToMove = Game.MIN_SPAWN_DIST_FROM_PLAYER - distToPlayer;
            randomPosition.addSelf(dirVector.mult(distToMove));
        }

        randomPosition.clampSelf(minX, maxX, minY, maxY);

        return randomPosition;
    }


    startPreview(canvas: HTMLCanvasElement)
    {
        this._previewCanvas = canvas;
        this._previewCtx = canvas.getContext('2d');

        this._player = new Player(
            new Vector(Game.PREV_STAGE_WIDTH / 2, Game.PREV_STAGE_HEIGHT / 2),
        );

        this._previewAnimationId = requestAnimationFrame(this._nextPreviewFrame.bind(this));
    }

    updatePreviewSize(percent: number) : number
    {
        return this._player.updatePreviewRadius(percent);
    }

    updatePreviewSpeed(percent:number) : number
    {
        return this._player.updatePreviewSpeed(percent);
    }

    private _nextPreviewFrame(frameTime: number) : void
    {
        if (this._lastFrameTime === undefined) {
            this._lastFrameTime = frameTime;
            requestAnimationFrame(this._nextPreviewFrame.bind(this));
            return;
        }

        const deltaTime = (frameTime - this._lastFrameTime) / 1000;
        this._lastFrameTime = frameTime;

        // Background
        this._previewCtx.fillStyle = 'black';
        this._previewCtx.fillRect(
            -100, -100,
            Game.PREV_REF_WIDTH + 200, Game.PREV_REF_HEIGHT + 200,
        );

        // Border
        this._previewCtx.strokeStyle = Game.BORDER_COLOUR;
        this._previewCtx.lineWidth = Game.PREV_BORDER_WIDTH;
        this._previewCtx.strokeRect(
            Game.PREV_BORDER_WIDTH / 2,
            Game.PREV_BORDER_WIDTH / 2,
            Game.PREV_REF_WIDTH - Game.PREV_BORDER_WIDTH,
            Game.PREV_REF_HEIGHT - Game.PREV_BORDER_WIDTH,
        );
        this._previewCtx.strokeStyle = 'none';

        const allEntities = [this._player];
        for (const entity of allEntities) {
            entity.nextFrame(
                deltaTime,
                Game.PREV_BORDER_WIDTH,
                Game.PREV_STAGE_WIDTH + 5,
                Game.PREV_BORDER_WIDTH,
                Game.PREV_STAGE_HEIGHT + 5,
            );

            this._previewCtx.fillStyle = entity.colour;
            this._previewCtx.beginPath();
            this._previewCtx.arc(
                entity.x,
                entity.y,
                entity.radius,
                0,
                2 * Math.PI,
            );
            this._previewCtx.fill();

            const {r, g, b, a} = entity.getColourAsObject();
            const maxTailWidth = entity.radius * 2;
            const minTailWidth = 2;
            for (let i = entity.trail.length - 1; i >= 0 ; i--) {
                this._previewCtx.lineWidth = lerp(
                    maxTailWidth,
                    minTailWidth,
                    (entity.trail.length - i) / entity.trail.length,
                    'ease',
                );

                this._previewCtx.beginPath();

                if (i === (entity.trail.length - 1)) {
                    const pointFrom = entity.position;
                    const { Position: pointTo, Opacity } = entity.trail[i];
                    this._previewCtx.strokeStyle = `rgb(${r}, ${g}, ${b}, ${Opacity * a})`;
                    this._previewCtx.moveTo(pointFrom.x, pointFrom.y);
                    this._previewCtx.lineTo(pointTo.x, pointTo.y);
                } else {
                    const { Position: pointFrom } = entity.trail[i + 1];
                    const { Position: pointTo, Opacity } = entity.trail[i];
                    this._previewCtx.strokeStyle = `rgb(${r}, ${g}, ${b}, ${Opacity * a})`;
                    this._previewCtx.moveTo(pointFrom.x, pointFrom.y);
                    this._previewCtx.lineTo(pointTo.x, pointTo.y);
                }

                this._previewCtx.stroke();
            }
        }

        this._previewAnimationId = requestAnimationFrame(this._nextPreviewFrame.bind(this));
    }
}

export default Game;
