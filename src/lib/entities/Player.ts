import Vector from '../Vector';
import Colour from '../Colour';
import Entity from './Abstract';
import Game from '../Game';
import InputManager from '../InputManager';

class Player extends Entity {
    private static readonly MAX_VELOCITY = 5;
    private static readonly DRAG = 0.9;
    private static readonly CHARGE_NEEDED = 8;
    private static readonly POWERUP_TIME = 3.5;

    private _chargeAmount: number = 0;
    private _powerupRemaining: number = 0;
    private _baseColour: Colour;

    constructor(
        position: Vector,
        colour: Colour = new Colour(0, 0, 255, 1),
        radius: number = 25,
        speed: number = 125,
    ) {
        super(position, colour, radius, speed);
        this._baseColour = Colour.from(colour);
    }

    nextFrame(deltaTime: number) : void
    {
        this._powerupRemaining = Math.max(0, this._powerupRemaining - deltaTime);
        if (this.inPowerup()) {
            const [second, decimal] = String(this._powerupRemaining).split('.');
            this._colour = new Colour(0, 255, 0, 1);
        } else {
            this._colour = this._baseColour;
        }

        for (const input of InputManager.Instance.getAllPressed()) {
            switch (input) {
                case 'UP':
                    this._velocity.addSelf(new Vector(0, -1));
                    continue;
                case 'DOWN':
                    this._velocity.addSelf(new Vector(0, 1));
                    continue;
                case 'LEFT':
                    this._velocity.addSelf(new Vector(-1, 0));
                    continue;
                case 'RIGHT':
                    this._velocity.addSelf(new Vector(1, 0));
                    continue;
            }
        }

        // Clamp velocity
        this._velocity.clampSelf(
            -Player.MAX_VELOCITY,
            Player.MAX_VELOCITY
        );

        this._velocity.multSelf(Player.DRAG);
        this._move(deltaTime);

        this._position.clampSelf(
            this._radius,
            Game.REF_WIDTH - this._radius,
            this._radius,
            Game.REF_HEIGHT - this._radius,
        );
    }

    addCharge() : void
    {
        this._chargeAmount++;
        if (this._chargeAmount === Player.CHARGE_NEEDED) {
            this._chargeAmount = 0;
            this._powerupRemaining = Player.POWERUP_TIME;
        }
    }

    inPowerup() : boolean
    {
        return this._powerupRemaining > 0;
    }
}

export default Player;
