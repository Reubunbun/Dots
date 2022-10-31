import Colour from '../helpers/Colour';
import Vector from '../helpers/Vector';
import Entity from './Abstract';

class Collectable extends Entity {
    private static readonly COLOUR = new Colour(144, 200, 0, 1);
    public static readonly RADIUS = 10;

    constructor(position: Vector)
    {
        super(position, Collectable.COLOUR, Collectable.RADIUS, 0, 0);
    }

    resetPosition(newPosition: Vector) : void
    {
        this._position = newPosition;
    }

    nextFrame(deltaTime: number) : void
    {}
}

export default Collectable;
