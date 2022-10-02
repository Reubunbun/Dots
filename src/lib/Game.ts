import {
    type GameEndEventParams,
    type PowerChangeEventParams,
    type ScoreChangeEventParams,
    EVENT_GAME_END,
    EVENT_POWER_CHANGE,
    EVENT_SCORE_CHANGE,
} from '../types/globals';
import Vector from './Vector';
import Player from './entities/Player';
import Obstacle from './entities/Obstacle';
import Collectable from './entities/Collectable';

class Game {
    private static readonly MIN_SPAWN_DIST_FROM_PLAYER = 200;
    private static readonly BORDER_COLOUR = '#c022ff'
    public static readonly BORDER_WIDTH = 4;
    private static readonly REF_WIDTH = 1920 + (Game.BORDER_WIDTH * 2);
    private static readonly REF_HEIGHT = 903 + (Game.BORDER_WIDTH * 2);
    public static readonly STAGE_WIDTH = Game.REF_WIDTH - (Game.BORDER_WIDTH * 2);
    public static readonly STAGE_HEIGHT = Game.REF_HEIGHT - (Game.BORDER_WIDTH * 2);

    private _ended: boolean = false;
    private _timeGameStart: number = Date.now();
    private _score: number = 0;
    private _collectablesCollected: number = 0;
    private _allObstacles: Set<Obstacle> = new Set();
    private _times: Array<number> = [];
    private _collectable: Collectable;
    private _player: Player;
    private _animationId: number;
    private _lastFrameTime: number;
    private _canvas: HTMLCanvasElement;
    private _context: CanvasRenderingContext2D;

    constructor(canvas: HTMLCanvasElement)
    {
        this._canvas = canvas;
        this._context = canvas.getContext('2d');

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
    }

    resize(screenWidth: number, screenHeight: number) : number
    {
        this._canvas.style.width = `${screenWidth}px`;
        this._canvas.style.height = `${screenHeight}px`;
        this._canvas.width = screenWidth;
        this._canvas.height = screenHeight;

        const scaleFitNative = Math.min(
            screenWidth / Game.REF_WIDTH,
            screenHeight / Game.REF_HEIGHT,
        );
        const screenXPadding = (this._canvas.width - Game.REF_WIDTH * scaleFitNative) / 2;

        this._context.setTransform(
            scaleFitNative, 0,
            0, scaleFitNative,
            screenXPadding,
            (this._canvas.height - Game.REF_HEIGHT * scaleFitNative) / 2,
        );

        if (scaleFitNative < 1) {
            this._context.imageSmoothingEnabled = true;
        } else {
            this._context.imageSmoothingEnabled = false;
        }

        return screenXPadding;
    }

    start() : void
    {
        this._animationId = requestAnimationFrame(this._nextFrame.bind(this));
    }

    stop(exitEarly?: boolean) : void
    {
        if (this._ended) {
            return;
        }

        cancelAnimationFrame(this._animationId);
        this._ended = true;

        this._context.fillStyle = 'black';
        this._context.fillRect(-100, -100, Game.REF_WIDTH + 200, Game.REF_HEIGHT + 200);
        if (!exitEarly) {
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

    private _nextFrame(frameTime: number) : void
    {
        if (this._lastFrameTime === undefined) {
            this._lastFrameTime = frameTime;
            requestAnimationFrame(this._nextFrame.bind(this));
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
        this._context.fillStyle = 'black';
        this._context.fillRect(-100, -100, Game.REF_WIDTH + 200, Game.REF_HEIGHT + 200);

        // Border
        this._context.strokeStyle = Game.BORDER_COLOUR;
        this._context.lineWidth = Game.BORDER_WIDTH;
        this._context.strokeRect(
            Game.BORDER_WIDTH / 2,
            Game.BORDER_WIDTH / 2,
            Game.REF_WIDTH - Game.BORDER_WIDTH,
            Game.REF_HEIGHT - Game.BORDER_WIDTH,
        );
        this._context.strokeStyle = 'none';

        this._context.fillStyle = 'white';
        this._context.font = '48px serif';
        this._context.fillText(`${fps}`, 10, 50);

        const allEntities = [
            this._player,
            this._collectable,
            ...this._allObstacles,
        ];

        for (const entity of allEntities) {
            entity.nextFrame(deltaTime);

            if (entity instanceof Obstacle) {
                if (entity.isCollidingWith(this._player)) {
                    if (this._player.inPowerup()) {
                        this._increaseScore(20);
                        this._allObstacles.delete(entity);
                    } else {
                        return this.stop();
                    }
                }
            }

            if (entity instanceof Collectable) {
                if (entity.isCollidingWith(this._player)) {
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

                    this._collectable.resetPosition(this._getRandomPositionToSpawn(
                        Collectable.RADIUS,
                    ));
                    this._allObstacles.add(
                        new Obstacle(
                            this._getRandomPositionToSpawn(Obstacle.RADIUS),
                        ),
                    );
                }
            }

            this._context.fillStyle = entity.colour;
            this._context.beginPath();
            this._context.arc(
                entity.x,
                entity.y,
                entity.radius,
                0,
                2 * Math.PI,
            );
            this._context.fill();
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

        this._animationId = requestAnimationFrame(this._nextFrame.bind(this));
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

        return randomPosition;
    }
}

export default Game;
