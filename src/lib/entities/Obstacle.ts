import Vector from '../Vector';
import Entity from './Abstract';
import Game from '../Game';

class Obstacle extends Entity {
    private static readonly COLOUR = '#ff1515';
    public static readonly RADIUS = 15;

    constructor(
        position: Vector,
        speed: number,
    )
    {
        super(position, Obstacle.COLOUR, Obstacle.RADIUS, speed);

        if (Math.random() <= 0.5) {
            this._velocity.x = Math.random() <= 0.5 ? -1 : 1;
        } else {
            this._velocity.y = Math.random() <= 0.5 ? -1 : 1;
        }
    }

    nextFrame(deltaTime: number) : void
    {
        this._move(deltaTime);

        if (
            this._position.x < this._radius ||
            this._position.x > (Game.REF_WIDTH - this._radius) ||
            this._position.y < this._radius ||
            this._position.y > (Game.REF_HEIGHT - this._radius)
        ) {
            this._velocity.multSelf(-1);
        }
    }
}

export default Obstacle;
