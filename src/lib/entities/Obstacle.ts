import Vector from '../Vector';
import Entity from './Abstract';
import Game from '../Game';
import Colour from '../Colour';

class Obstacle extends Entity {
    private static readonly COLOUR = new Colour(255, 0, 0, 1);
    private static readonly BASE_SPEED = 130;
    private static readonly SPEED_VARIANCE = 20;
    private static readonly SPAWN_TIME = 1;
    public static readonly RADIUS = 15;

    private _spawnFrames: number = Obstacle.SPAWN_TIME;

    constructor(
        position: Vector,
    )
    {
        super(
            position,
            Obstacle.COLOUR,
            Obstacle.RADIUS,
            Obstacle.BASE_SPEED + (
                (Math.random() <= 0.5 ? -1 : 1) *
                    Math.floor(Math.random() * Obstacle.SPEED_VARIANCE)
            ),
        );

        if (Math.random() <= 0.5) {
            this._velocity.x = Math.random() <= 0.5 ? -1 : 1;
        } else {
            this._velocity.y = Math.random() <= 0.5 ? -1 : 1;
        }
    }

    nextFrame(deltaTime: number) : void
    {
        this._move(deltaTime);

        this._spawnFrames = Math.max(this._spawnFrames - deltaTime, 0);
        if (this._spawnFrames > 0) {
            this._colour = Colour.lerp(
                new Colour(255, 0, 0, 0),
                new Colour(255, 0, 0, 1),
                1 - (this._spawnFrames / Obstacle.SPAWN_TIME),
            );
        }

        if (
            this._position.x < this._radius ||
            this._position.x > (Game.REF_WIDTH - this._radius) ||
            this._position.y < this._radius ||
            this._position.y > (Game.REF_HEIGHT - this._radius)
        ) {
            this._position.clampSelf(
                this._radius,
                Game.REF_WIDTH - this._radius,
                this._radius,
                Game.REF_HEIGHT - this._radius,
            );
            this._velocity.multSelf(-1);
        }
    }

    isCollidingWith(entity: Entity) : boolean
    {
        if (this._spawnFrames > 0) {
            return false;
        }
        return super.isCollidingWith(entity);
    }
}

export default Obstacle;
