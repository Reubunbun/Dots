import Vector from '../helpers/Vector';
import Colour from '../helpers/Colour';
import lerp from '../helpers/Lerp';
import Entity from './Abstract';
import InputManager from '../InputManager';
import { type HexColour } from '../../types/globals';

class Player extends Entity {
    private static readonly MIN_RADIUS = 10;
    private static readonly MAX_RADIUS = 50;

    private static readonly MIN_SPEED = 85;
    private static readonly MAX_SPEED = 180;

    private static readonly MIN_POWERUP_TIME = 2;
    private static readonly MAX_POWERUP_TIME = 3.8;

    private static readonly MIN_CHARGES_NEEDED = 4;
    private static readonly MAX_CHARGES_NEEDED = 10;

    private static readonly MAX_VELOCITY = 5;
    private static readonly DRAG = 0.875;
    private static readonly POWERUP_COLOUR_ROTATIONS = 10;

    private _chargeAmount: number = 0;
    private _powerupRemaining: number = 0;
    private _powerupColours: Array<Colour>;
    private _timeInPowerupColour: number = 0;
    private _powerupTime: number;
    private _chargesNeeded: number;

    private _baseColour: Colour;
    private readonly _timePerPowerupColour: number;

    static getDefaultRadius() : number
    {
        return lerp(
            Player.MIN_RADIUS,
            Player.MAX_RADIUS,
            0.5
        );
    }

    static getDefaultSpeed() : number
    {
        return lerp(
            Player.MIN_SPEED,
            Player.MAX_SPEED,
            0.5,
        );
    }

    static getDefaultPowerupTime() : number
    {
        return lerp(
            Player.MIN_POWERUP_TIME,
            Player.MAX_POWERUP_TIME,
            0.5,
        );
    }

    static getDefaultChargesNeeded() : number
    {
        return Math.round(
            lerp(
                Player.MIN_CHARGES_NEEDED,
                Player.MAX_CHARGES_NEEDED,
                0.5,
            ),
        );
    }

    static getDefaultColour() : HexColour
    {
        return '#0000FF';
    }

    constructor(
        position: Vector,
        colourHex: HexColour,
        radius: number,
        speed: number,
        invTime: number,
        chargesNeeded: number,
    ) {
        const colour = Colour.fromHex(colourHex);

        super(
            position,
            colour,
            lerp(
                Player.MIN_RADIUS,
                Player.MAX_RADIUS,
                radius
            ),
            lerp(
                Player.MIN_SPEED,
                Player.MAX_SPEED,
                speed,
            ),
            0.4,
        );
        this._baseColour = Colour.from(colour);
        this._powerupTime = lerp(
            Player.MIN_POWERUP_TIME,
            Player.MAX_POWERUP_TIME,
            invTime,
        );
        this._timePerPowerupColour = this._powerupTime / Player.POWERUP_COLOUR_ROTATIONS;
        this._chargesNeeded = Math.round(lerp(
            Player.MIN_CHARGES_NEEDED,
            Player.MAX_CHARGES_NEEDED,
            1 - chargesNeeded,
        ));
    }

    nextFrame(
        deltaTime: number,
        stageMinX: number,
        stageMaxX: number,
        stageMinY: number,
        stageMaxY: number,
    ) : void
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
                this._timeInPowerupColour = this._timePerPowerupColour;
            }

            const [currColour, nextColour] = this._powerupColours;

            this._colour = Colour.lerp(
                currColour,
                nextColour,
                1 - (this._timeInPowerupColour / this._timePerPowerupColour),
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
        super.nextFrame(
            deltaTime,
            stageMinX,
            stageMaxX,
            stageMinY,
            stageMaxY,
        );
    }

    addCharge() : void
    {
        if (this.inPowerup()) {
            return;
        }

        this._chargeAmount++;
        if (this._chargeAmount === this._chargesNeeded) {
            this._chargeAmount = 0;
            this._powerupRemaining = this._powerupTime;
        }
    }

    getChargePercent() : number
    {
        if (this.inPowerup()) {
            const remaining = (this._powerupRemaining / this._powerupTime);
            return remaining < 0.01 ? 0 : remaining * 100;
        }

        return (this._chargeAmount / this._chargesNeeded) * 100;
    }

    inPowerup() : boolean
    {
        return this._powerupRemaining > 0;
    }

    updatePreviewRadius(percent: number) : void
    {
        const newRadius = lerp(
            Player.MIN_RADIUS,
            Player.MAX_RADIUS,
            percent,
        );
        this._radius = newRadius;
    }

    updatePreviewSpeed(percent: number) : void
    {
        const newSpeed = lerp(
            Player.MIN_SPEED,
            Player.MAX_SPEED,
            percent,
        );
        this._speed = newSpeed;
    }

    updatePreviewInvTime(percent: number) : void
    {
        const newInvTime = lerp(
            Player.MIN_POWERUP_TIME,
            Player.MAX_POWERUP_TIME,
            percent,
        );
        this._powerupTime = newInvTime;
    }

    updatePreviewChargesNeeded(percent: number) : void
    {
        const newChargesNeeded = Math.round(
            lerp(
                Player.MIN_CHARGES_NEEDED,
                Player.MAX_CHARGES_NEEDED,
                (1 - percent),
            ),
        );
        this._chargesNeeded = newChargesNeeded;
    }

    updatePreviewColour(hex: HexColour) : void
    {
        this._colour = Colour.fromHex(hex);
        this._baseColour = Colour.from(this._colour);
    }

    get velocity() {
        return this._velocity;
    }
}

export default Player;
