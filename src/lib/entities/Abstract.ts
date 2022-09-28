import Vector from '../Vector';

abstract class Entity {
    protected _position: Vector;
    protected _colour: string;
    protected _radius: number;
    protected _speed: number;

    constructor(
        position: Vector,
        colour: string,
        radius: number,
        speed: number,
    ) {
        this._position = position;
        this._colour = colour;
        this._radius = radius;
        this._speed = speed;
    }

    get x() {
        return this._position.x;
    }

    get y() {
        return this._position.y;
    }

    get position() {
        return this._position;
    }

    get colour() {
        return this._colour;
    }

    get radius() {
        return this._radius;
    }

    isCollidingWith(entity: Entity) : boolean
    {
        const minAllowedDist = entity.radius + this._radius;
        return this._position.distBetween(entity.position) <= minAllowedDist;
    }
}

export default Entity;
