import { type GameEndEventParams, KEY_GAME_END } from '../types/globals';
import Vector from './Vector';
import Player from './entities/Player';
import Obstacle from './entities/Obstacle';

class Game {
    public static readonly REF_WIDTH = 1920;
    public static readonly REF_HEIGHT = 903;

    private static readonly MIN_OBSTACLE_SPAWN_DIST = 50;

    private _timeGameStart: number = Date.now();
    private _collectablesCollected: number = 0;
    private _allObstacles: Set<Obstacle> = new Set();
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
            new Vector(Game.REF_WIDTH / 2, Game.REF_HEIGHT / 2),
            '#0011fd',
            25,
            123,
        );

        const firstObstacle = new Obstacle(
            this._getRandomPositionForObstacle(),
            100,
        );
        this._allObstacles.add(firstObstacle);
    }

    resize(screenWidth: number, screenHeight: number) : void
    {
        this._canvas.style.width = `${screenWidth}px`;
        this._canvas.style.height = `${screenHeight}px`;
        this._canvas.width = screenWidth;
        this._canvas.height = screenHeight;

        const scaleFitNative = Math.min(
            screenWidth / Game.REF_WIDTH,
            screenHeight / Game.REF_HEIGHT,
        );

        this._context.setTransform(
            scaleFitNative, 0,
            0, scaleFitNative,
            (this._canvas.width - Game.REF_WIDTH * scaleFitNative) / 2,
            (this._canvas.height - Game.REF_HEIGHT * scaleFitNative) / 2,
        );

        if (scaleFitNative < 1) {
            this._context.imageSmoothingEnabled = true;
        } else {
            this._context.imageSmoothingEnabled = false;
        }
    }

    start() : void
    {
        this._animationId = requestAnimationFrame(this._nextFrame.bind(this));
    }

    stop() : void
    {
        cancelAnimationFrame(this._animationId);
        this._context.fillStyle = 'black';
        this._context.fillRect(0, 0, Game.REF_WIDTH, Game.REF_HEIGHT);
        console.log('distpacting event');
        document.dispatchEvent(new CustomEvent<GameEndEventParams>(
            KEY_GAME_END,
            {
                detail: { score: 1, time: 2, collected: 3 },
                bubbles: true,
            }
        ));
    }

    private _nextFrame(frameTime: number) : void
    {
        if (this._lastFrameTime === undefined) {
            this._lastFrameTime = frameTime;
            requestAnimationFrame(this._nextFrame.bind(this));
            return;
        }

        const deltaTime = (frameTime - this._lastFrameTime) / 1000;
        this._lastFrameTime = frameTime;

        this._context.fillStyle = 'grey';
        this._context.fillRect(0, 0, Game.REF_WIDTH, Game.REF_HEIGHT);

        for (const entity of [this._player, ...this._allObstacles]) {
            entity.nextFrame(deltaTime);

            if (entity instanceof Obstacle) {
                if (entity.isCollidingWith(this._player)) {
                    return this.stop();
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

        this._animationId = requestAnimationFrame(this._nextFrame.bind(this));
    }

    private _getRandomPositionForObstacle() : Vector
    {
        const randomPosition = new Vector(
            Math.floor(
                Math.random() *
                    (Game.REF_WIDTH - Obstacle.RADIUS + 1) +
                    Obstacle.RADIUS,
            ),
            Math.floor(
                Math.random() *
                    (Game.REF_HEIGHT - Obstacle.RADIUS + 1) +
                    Obstacle.RADIUS,
            ),
        );

        const distToPlayer = randomPosition.distanceTo(this._player.position);
        if (distToPlayer < Game.MIN_OBSTACLE_SPAWN_DIST) {
            const dirVector = randomPosition
                .subtract(this._player.position)
                .mult(1/distToPlayer);
            const distToMove = Game.MIN_OBSTACLE_SPAWN_DIST - distToPlayer;
            randomPosition.addSelf(dirVector.mult(distToMove));
        }

        return randomPosition;
    }
}

export default Game;
