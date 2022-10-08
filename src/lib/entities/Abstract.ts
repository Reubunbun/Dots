import Vector from '../helpers/Vector';
import Colour from '../helpers/Colour';
import lerp from '../helpers/Lerp';
import Game from '../Game';

type TrailPoint = {
    Position: Vector;
    TimeAlive: number;
    Opacity: number;
};

abstract class Entity {
    private static readonly TIME_BETWEEN_TRAIL_POINTS = 0.01;
    private static readonly TRAIL_MAX_OPACITY = 0.8;
    private static readonly TRAIL_MIN_OPACITY = 0;

    protected _velocity: Vector = new Vector();
    protected _position: Vector;
    protected _colour: Colour;
    protected _radius: number;
    protected _speed: number;
    private _trailLiveTime: number;
    private _timeUntilNextTrail: number = 0;
    private _trail: Array<TrailPoint> = [];

    constructor(
        position: Vector,
        colour: Colour,
        radius: number,
        speed: number,
        trailLiveTime: number,
    ) {
        this._position = position;
        this._colour = colour;
        this._radius = radius;
        this._speed = speed;
        this._trailLiveTime = trailLiveTime;
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
        return this._colour.toString();
    }

    get radius() {
        return this._radius;
    }

    get speed() {
        return this._speed;
    }

    get trail() {
        return this._trail;
    }

    getColourAsObject() : Colour {
        return this._colour;
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

    protected _clampToStage() : void
    {
        this._position.clampSelf(
            Game.BORDER_WIDTH + this._radius,
            Game.STAGE_WIDTH + Game.BORDER_WIDTH - this._radius,
            Game.BORDER_WIDTH + this._radius,
            Game.STAGE_HEIGHT + Game.BORDER_WIDTH - this._radius,
        );
    }

    private _move(deltaTime: number) : void
    {
        this._position.addSelf(
            this._velocity
                .mult(this._speed)
                .mult(deltaTime),
        );
    }

    private _pushToTrail() : void
    {
        this._trail.push({
            Position: Vector.from(this._position),
            TimeAlive: 0,
            Opacity: 1,
        });
        this._timeUntilNextTrail = Entity.TIME_BETWEEN_TRAIL_POINTS;
    }

    protected nextFrame(deltaTime: number) : void
    {
        this._move(deltaTime);
        this._clampToStage();

        for (let i = 0; i < this._trail.length; i++) {
            const trailPoint = this._trail[i];

            trailPoint.TimeAlive = Math.min(
                trailPoint.TimeAlive + deltaTime,
                this._trailLiveTime,
            );

            if (trailPoint.TimeAlive === this._trailLiveTime) {
                this._trail.splice(i, 1);
                i--;
                continue;
            }

            trailPoint.Opacity = lerp(
                Entity.TRAIL_MIN_OPACITY,
                Entity.TRAIL_MAX_OPACITY,
                (1 - (trailPoint.TimeAlive / this._trailLiveTime)),
            );
        }

        if (!this._trail.length) {
            this._pushToTrail();
        }

        this._timeUntilNextTrail = Math.max(
            this._timeUntilNextTrail - deltaTime,
            0,
        );

        if (this._timeUntilNextTrail === 0) {
            this._pushToTrail();
        }
    }

}

export default Entity;
