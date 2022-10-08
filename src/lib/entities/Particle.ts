import Entity from './Abstract';
import Vector from '../helpers/Vector';
import Colour from '../helpers/Colour';
import Game from '../Game';

class Particle extends Entity {
    private static readonly TIME_TO_FADE = 2;
    private static readonly POSITION_VARIANCE = 10;
    private static readonly GRAVITY_FORCE = 0.2;
    private static readonly BOUNCE_MULTIPLIER = 0.25;
    private static readonly WALL_FRICTION = 0.9;

    private _timeInFade: number = Particle.TIME_TO_FADE;

    constructor(
        parentPosition: Vector,
        parentColour: Colour,
        parentRadius: number,
        speed: number,
        startVelocity: Vector,
    ) {
        const position = new Vector(
            parentPosition.x + ((Math.random() - 0.5) * (Particle.POSITION_VARIANCE * 2)),
            parentPosition.y + ((Math.random() - 0.5) * (Particle.POSITION_VARIANCE * 2)),
        );

        super(
            position,
            Colour.from(parentColour),
            parentRadius / 2,
            speed,
            0.1
        );

        this._velocity = new Vector(
            startVelocity.x + (Math.random() - 0.5),
            startVelocity.y + (Math.random() - 0.5),
        );
    }

    nextFrame(deltaTime: number) : void
    {
        this._velocity.addSelf(new Vector(0, Particle.GRAVITY_FORCE));

        if (
            this.x === (Game.BORDER_WIDTH + this._radius) ||
            this.x === (Game.STAGE_WIDTH + Game.BORDER_WIDTH - this._radius)

        ) {
            this._velocity.x *= -Particle.BOUNCE_MULTIPLIER;
        }

        if (this.y === (Game.BORDER_WIDTH + this._radius)) {
            this._velocity.y *= -Particle.BOUNCE_MULTIPLIER;
        }

        if (this.y === Game.STAGE_HEIGHT + Game.BORDER_WIDTH - this._radius) {
            this._velocity.multSelf(Particle.WALL_FRICTION);

            this._timeInFade = Math.max(this._timeInFade - deltaTime, 0);
            this._colour = Colour.lerp(
                new Colour(this._colour.r, this._colour.g, this._colour.b, 1),
                new Colour(this._colour.r, this._colour.g, this._colour.b, 0),
                1 - (this._timeInFade / Particle.TIME_TO_FADE),
            );
        }

        super.nextFrame(deltaTime);
    }

    shouldDespawn() : boolean
    {
        return this._timeInFade === 0;
    }
}

export default Particle;
