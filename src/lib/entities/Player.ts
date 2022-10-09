import Vector from '../helpers/Vector';
import Colour from '../helpers/Colour';
import Entity from './Abstract';
import InputManager from '../InputManager';

class Player extends Entity {
    private static readonly MAX_VELOCITY = 5;
    private static readonly DRAG = 0.875;
    private static readonly CHARGE_NEEDED = 8;
    private static readonly POWERUP_TIME = 3.5;
    private static readonly POWERUP_COLOUR_ROTATIONS = 10;
    private static readonly TIME_PER_POWERUP_COLOUR =
        Player.POWERUP_TIME / Player.POWERUP_COLOUR_ROTATIONS;

    private _chargeAmount: number = 0;
    private _powerupRemaining: number = 0;
    private _powerupColours: Array<Colour>;
    private _timeInPowerupColour: number = 0;
    private _baseColour: Colour;

    constructor(
        position: Vector,
        colour: Colour = new Colour(0, 0, 255, 1),
        radius: number = 25,
        speed: number = 125,
    ) {
        super(position, colour, radius, speed, 0.4);
        this._baseColour = Colour.from(colour);
    }

    nextFrame(deltaTime: number) : void
    {
        if (this.inPowerup()) {
            // Lerp between random colours to create rainbow effect
            this._timeInPowerupColour = Math.max(this._timeInPowerupColour - deltaTime, 0);
            this._powerupRemaining = Math.max(this._powerupRemaining - deltaTime, 0);

            if (
                !this._powerupColours.length ||
                this._timeInPowerupColour === 0
            ) {
                const currColour = !this._powerupColours.length
                    ? this._baseColour
                    : this._powerupColours[1];

                const possibleColours = [
                    Colour.RED,
                    Colour.GREEN,
                    Colour.BLUE,
                    Colour.PINK,
                    Colour.YELLOW,
                    Colour.PURPLE,
                    Colour.TEAL,
                    Colour.ORANGE,
                ].filter(c => !c.equals(currColour));
                const nextColour = possibleColours[
                    Math.floor(Math.random() * possibleColours.length)
                ];

                this._powerupColours = [currColour, nextColour];
                this._timeInPowerupColour = Player.TIME_PER_POWERUP_COLOUR;
            }

            const [currColour, nextColour] = this._powerupColours;

            this._colour = Colour.lerp(
                currColour,
                nextColour,
                1 - (this._timeInPowerupColour / Player.TIME_PER_POWERUP_COLOUR),
            );
        } else {
            this._powerupColours = [];
            this._colour = this._baseColour;
        }

        const inputVector = new Vector(0, 0);
        for (const input of InputManager.Instance.getAllPressed()) {
            switch (input) {
                case 'UP':
                    inputVector.addSelf(new Vector(0, -1));
                    continue;
                case 'DOWN':
                    inputVector.addSelf(new Vector(0, 1));
                    continue;
                case 'LEFT':
                    inputVector.addSelf(new Vector(-1, 0));
                    continue;
                case 'RIGHT':
                    inputVector.addSelf(new Vector(1, 0));
                    continue;
            }
        }

        if (inputVector.x !== 0 && inputVector.y !== 0) {
            inputVector.normaliseSelf();
        }

        this._velocity.addSelf(inputVector);

        // Clamp velocity
        this._velocity.clampSelf(
            -Player.MAX_VELOCITY,
            Player.MAX_VELOCITY
        );

        this._velocity.multSelf(Player.DRAG);
        super.nextFrame(deltaTime);
    }

    addCharge() : void
    {
        this._chargeAmount++;
        if (this._chargeAmount === Player.CHARGE_NEEDED) {
            this._chargeAmount = 0;
            this._powerupRemaining = Player.POWERUP_TIME;
        }
    }

    getChargePercent() : number
    {
        if (this.inPowerup()) {
            const remaining = (this._powerupRemaining / Player.POWERUP_TIME);
            return remaining < 0.01 ? 0 : remaining * 100;
        }

        return (this._chargeAmount / Player.CHARGE_NEEDED) * 100;
    }

    inPowerup() : boolean
    {
        return this._powerupRemaining > 0;
    }

    get velocity() {
        return this._velocity;
    }
}

export default Player;
