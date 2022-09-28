import Vector from '../Vector';
import Entity from './Abstract';

class Player extends Entity {
    constructor(
        position: Vector,
        colour: string,
        radius: number,
        speed: number,
    ) {
        super(position, colour, radius, speed);
    }

    move(vector: Vector) {
        this._position.addSelf(vector);
    }
}

export default Player;
