import Vector from '../Vector';

abstract class Entity {
    protected _velocity: Vector = new Vector();
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

    set x(newX: number) {
        this._position.x = newX;
    }

    get y() {
        return this._position.y;
    }

    set y(newY: number) {
        this._position.y = newY;
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
        return this._position.distanceTo(entity.position) <= minAllowedDist;
    }

    setVelocity(velocity: Vector) : void
    {
        this._velocity = velocity;
    }

    _move(deltaTime: number) : void
    {
        this._position.addSelf(
            this._velocity
                .mult(this._speed)
                .mult(deltaTime),
        );
    }

    abstract nextFrame(deltaTime: number) : void
}

export default Entity;
