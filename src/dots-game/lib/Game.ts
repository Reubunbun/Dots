import {
    type GameEndEventParams,
    type PowerChangeEventParams,
    type ScoreChangeEventParams,
    EVENT_GAME_END,
    EVENT_POWER_CHANGE,
    EVENT_SCORE_CHANGE,
    HexColour,
} from '../types/globals';
import Storage from './Storage';
import Vector from './helpers/Vector';
import lerp from './helpers/Lerp';
import Player from './entities/Player';
import Obstacle from './entities/Obstacle';
import Collectable from './entities/Collectable';
import Particle from  './entities/Particle';
import ScoreText from './entities/ScoreText';
import Entity from './entities/Abstract';
import Colour from './helpers/Colour';

class Game {
    private static readonly MIN_SPAWN_DIST_FROM_PLAYER = 200;
    private static readonly BORDER_COLOUR = '#c022ff'
    private static readonly BORDER_WIDTH = 4;
    private static readonly GAME_REF_WIDTH = 1920 + (Game.BORDER_WIDTH * 2);
    private static readonly GAME_REF_HEIGHT = 903 + (Game.BORDER_WIDTH * 2);
    private static readonly STAGE_WIDTH = Game.GAME_REF_WIDTH - (Game.BORDER_WIDTH * 2);
    private static readonly STAGE_HEIGHT = Game.GAME_REF_HEIGHT - (Game.BORDER_WIDTH * 2);

    private static readonly BASE_COLLECT_SCORE = 5;
    private static readonly MAX_COLLECT_CHAIN = 5;
    private static readonly MAX_COLLECT_SCORE = Game.BASE_COLLECT_SCORE * (2 ** Game.MAX_COLLECT_CHAIN);
    private static readonly TIME_TO_CHAIN = 1.85;

    private static readonly PREV_BORDER_WIDTH = 1;
    private static readonly PREV_REF_WIDTH = 1020 + (Game.PREV_BORDER_WIDTH * 2);
    private static readonly PREV_REF_HEIGHT = 508 + (Game.PREV_BORDER_WIDTH * 2);
    private static readonly PREV_STAGE_WIDTH = Game.PREV_REF_WIDTH - (Game.BORDER_WIDTH * 2);
    private static readonly PREV_STAGE_HEIGHT = Game.PREV_REF_HEIGHT - (Game.BORDER_WIDTH * 2);

    private static readonly PREV_COLLECTABLE_RESPAWN_TIME = 1.5;

    private _storage: Storage;
    private _ended: boolean;
    private _timeGameStart: number;
    private _score: number;
    private _scoreMultiplier: number;
    private _collectablesCollected: number;
    private _timeTaken: number;
    private _allObstacles: Set<Obstacle>;
    private _allParticles: Set<Particle>;
    private _scoreText: ScoreText | null;
    private _collectable: Collectable;
    private _player: Player;
    private _gameAnimationId: number;
    private _lastFrameTime: number;
    private _gameCanvas: HTMLCanvasElement;
    private _gameCtx: CanvasRenderingContext2D;

    private _previewCanvas: HTMLCanvasElement;
    private _previewCtx: CanvasRenderingContext2D;
    private _previewAnimationId: number;
    private _previewCollectables: Set<{collectable: Collectable, timeToRespawn: number}>;
    private _previewParticles: Set<Particle>;

    constructor(gameCanvas: HTMLCanvasElement)
    {
        this._storage = new Storage();
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
        this._ended = false;
        this._timeGameStart = Date.now();
        this._score = 0;
        this._scoreMultiplier = 0;
        this._collectablesCollected = 0;
        this._scoreText = null;
        this._allObstacles = new Set<Obstacle>();
        this._allParticles = new Set<Particle>();

        this._player = new Player(
            new Vector(Game.STAGE_WIDTH / 2, Game.STAGE_HEIGHT / 2),
            this._storage.playerColour,
            this._storage.playerSize,
            this._storage.playerSpeed,
            this._storage.playerInvTime,
            this._storage.playerChargesNeeded,
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

    getGameResults()
    {
        return {
            Score: this._score,
            TimeTaken: this._timeTaken,
        };
    }

    hasEnded() : boolean
    {
        return this._ended;
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
        this.stopPreview();
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
                        if (this._scoreText) {
                            this._scoreMultiplier = Math.min(
                                Game.MAX_COLLECT_CHAIN,
                                this._scoreMultiplier + 1,
                            );
                        } else {
                            this._scoreMultiplier = 0;
                        }

                        const scoreToAdd = Math.ceil(
                            (Game.BASE_COLLECT_SCORE * (2 ** this._scoreMultiplier)) * 0.4,
                        );
                        this._increaseScore(scoreToAdd);
                        this._scoreText = new ScoreText(
                            this._player.position,
                            `+${scoreToAdd}`,
                            scoreToAdd,
                            Game.MAX_COLLECT_SCORE,
                            Game.TIME_TO_CHAIN,
                            Obstacle.COLOUR,
                            Colour.WHITE,
                        );

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

                        for (let i = 0; i < 5; i++) {
                            this._allParticles.add(new Particle(
                                this._player.position,
                                this._player.getColourAsObject(),
                                this._player.radius,
                                this._player.speed,
                                this._player.velocity
                            ));
                        }

                        this._timeTaken = Date.now() - this._timeGameStart;
                        document.dispatchEvent(new CustomEvent<GameEndEventParams>(
                            EVENT_GAME_END,
                            {
                                detail: {
                                    score: this._score,
                                    time: this._timeTaken,
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
                    if (this._scoreText) {
                        this._scoreMultiplier = Math.min(
                            Game.MAX_COLLECT_CHAIN,
                            this._scoreMultiplier + 1,
                        );
                    } else {
                        this._scoreMultiplier = 0;
                    }

                    const scoreToAdd = Game.BASE_COLLECT_SCORE * (2 ** this._scoreMultiplier);

                    this._collectablesCollected++;
                    this._player.addCharge();
                    this._increaseScore(scoreToAdd);
                    this._scoreText = new ScoreText(
                        this._player.position,
                        `+${scoreToAdd}`,
                        scoreToAdd,
                        Game.MAX_COLLECT_SCORE,
                        Game.TIME_TO_CHAIN,
                        Collectable.COLOUR,
                        Colour.WHITE,
                    );

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

        if (this._scoreText && !this._ended) {
            const pos = this._scoreText.getPosition();

            this._gameCtx.font = this._scoreText.font;
            this._gameCtx.strokeStyle = this._scoreText.outlineColour;
            this._gameCtx.fillStyle = this._scoreText.fillColour;
            this._gameCtx.lineWidth = 1;

            const {width: textWidth} = this._gameCtx.measureText(this._scoreText.text);
            this._gameCtx.strokeText(
                this._scoreText.text,
                pos.x - (textWidth / 2),
                pos.y - (this._player.radius / 2),
            );
            this._gameCtx.fillText(
                this._scoreText.text,
                pos.x - (textWidth / 2),
                pos.y - (this._player.radius / 2),
            );

            this._scoreText.nextFrame(deltaTime);
            if (this._scoreText.shouldDespawn()) {
                this._scoreText = null;
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
            this._storage.playerColour,
            this._storage.playerSize,
            this._storage.playerSpeed,
            this._storage.playerInvTime,
            this._storage.playerChargesNeeded,
        );

        this._previewCollectables = new Set();
        for (let i = 0; i < 5; i++) {
            this._previewCollectables.add({
                collectable: new Collectable(new Vector(
                    (Game.PREV_REF_WIDTH / 5) * (i + 1) - ((Game.PREV_REF_WIDTH / 5)) / 2,
                    Game.PREV_REF_HEIGHT * 0.25,
                )),
                timeToRespawn: 0,
            });
        }
        this._previewParticles = new Set();

        this._previewAnimationId = requestAnimationFrame(this._nextPreviewFrame.bind(this));
    }

    stopPreview()
    {
        cancelAnimationFrame(this._previewAnimationId);
    }

    updatePlayerSize(percent: number) : void
    {
        this._player.updatePreviewRadius(percent);
        this._storage.playerSize = percent;
    }

    updatePlayerSpeed(percent: number) : void
    {
        this._player.updatePreviewSpeed(percent);
        this._storage.playerSpeed = percent;
    }

    updatePlayerInvTime(percent: number) : void
    {
        this._player.updatePreviewInvTime(percent);
        this._storage.playerInvTime = percent;
    }

    updatePreviewChargesNeeded(percent: number) : void
    {
        this._player.updatePreviewChargesNeeded(1 - percent);
        this._storage.playerChargesNeeded = 1 - percent;
    }

    updatePreviewColour(hex: HexColour) : void
    {
        this._player.updatePreviewColour(hex);
        this._storage.playerColour = hex;
    }

    getStoredPlayerSize() : number
    {
        return this._storage.playerSize;
    }

    getStoredPlayerSpeed() : number
    {
        return this._storage.playerSpeed;
    }

    getStoredPlayerInvTime() : number
    {
        return this._storage.playerInvTime;
    }

    getStoredPlayerChargesNeeded() : number
    {
        return this._storage.playerChargesNeeded;
    }

    getStoredPlayerColour() : HexColour
    {
        return this._storage.playerColour;
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

        this._player.nextFrame(
            deltaTime,
            Game.PREV_BORDER_WIDTH,
            Game.PREV_STAGE_WIDTH + 5,
            Game.PREV_BORDER_WIDTH,
            Game.PREV_STAGE_HEIGHT + 5,
        );

        this._previewCtx.fillStyle = this._player.colour;
        this._previewCtx.beginPath();
        this._previewCtx.arc(
            this._player.x,
            this._player.y,
            this._player.radius,
            0,
            2 * Math.PI,
        );
        this._previewCtx.fill();

        const {r, g, b, a} = this._player.getColourAsObject();
        const maxTailWidth = this._player.radius * 2;
        const minTailWidth = 2;
        for (let i = this._player.trail.length - 1; i >= 0 ; i--) {
            this._previewCtx.lineWidth = lerp(
                maxTailWidth,
                minTailWidth,
                (this._player.trail.length - i) / this._player.trail.length,
                'ease',
            );

            this._previewCtx.beginPath();

            if (i === (this._player.trail.length - 1)) {
                const pointFrom = this._player.position;
                const { Position: pointTo, Opacity } = this._player.trail[i];
                this._previewCtx.strokeStyle = `rgb(${r}, ${g}, ${b}, ${Opacity * a})`;
                this._previewCtx.moveTo(pointFrom.x, pointFrom.y);
                this._previewCtx.lineTo(pointTo.x, pointTo.y);
            } else {
                const { Position: pointFrom } = this._player.trail[i + 1];
                const { Position: pointTo, Opacity } = this._player.trail[i];
                this._previewCtx.strokeStyle = `rgb(${r}, ${g}, ${b}, ${Opacity * a})`;
                this._previewCtx.moveTo(pointFrom.x, pointFrom.y);
                this._previewCtx.lineTo(pointTo.x, pointTo.y);
            }

            this._previewCtx.stroke();
        }

        for (const collectableObj of this._previewCollectables) {
            const { collectable, timeToRespawn } = collectableObj;

            if (timeToRespawn !== 0) {
                collectableObj.timeToRespawn = Math.max(0, timeToRespawn - deltaTime);
                continue;
            }

            if (this._player.isCollidingWith(collectable)) {
                this._player.addCharge();

                for (let i = 0; i < 5; i++) {
                    this._previewParticles.add(new Particle(
                        collectable.position,
                        collectable.getColourAsObject(),
                        collectable.radius,
                        this._player.speed,
                        this._player.velocity
                    ));
                }

                collectableObj.timeToRespawn = Game.PREV_COLLECTABLE_RESPAWN_TIME;
            }

            this._previewCtx.fillStyle = collectable.colour;
            this._previewCtx.beginPath();
            this._previewCtx.arc(
                collectable.x,
                collectable.y,
                collectable.radius,
                0,
                2 * Math.PI,
            );
            this._previewCtx.fill();
        }

        for (const particle of this._previewParticles) {
            particle.nextFrame(
                deltaTime,
                Game.PREV_BORDER_WIDTH,
                Game.PREV_STAGE_WIDTH + 5,
                Game.PREV_BORDER_WIDTH,
                Game.PREV_STAGE_HEIGHT + 5,
            );

            if (particle.shouldDespawn()) {
                this._previewParticles.delete(particle);
            }

            this._previewCtx.fillStyle = particle.colour;
            this._previewCtx.beginPath();
            this._previewCtx.arc(
                particle.x,
                particle.y,
                particle.radius,
                0,
                2 * Math.PI,
            );
            this._previewCtx.fill();
        }

        this._previewAnimationId = requestAnimationFrame(this._nextPreviewFrame.bind(this));
    }
}

export default Game;
