import lerp, {type LerpFunction} from './Lerp';
import { type HexColour } from '../../types/globals';

class Colour {
    public static readonly RED = new Colour(255, 0, 0, 1);
    public static readonly GREEN = new Colour(0, 255, 0, 1);
    public static readonly BLUE = new Colour(0, 0, 255, 1);
    public static readonly PINK = new Colour(255, 0, 255, 1);
    public static readonly YELLOW = new Colour(255, 255, 0, 1);
    public static readonly PURPLE = new Colour(128, 0, 255, 1);
    public static readonly TEAL = new Colour(0, 255, 255, 1);
    public static readonly ORANGE = new Colour(255, 128, 0, 1);
    public static readonly WHITE = new Colour(255, 255, 255, 1);

    private static readonly HEX_SHORTHAND_RGX = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    private static readonly HEX_RGX = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;

    private _r: number;
    private _g: number;
    private _b: number;
    private _a: number;

    constructor(
        r: number,
        g: number,
        b: number,
        a: number,
    )
    {
        this._r = Math.max(
            Math.min(r, 255),
            0,
        );
        this._g = Math.max(
            Math.min(g, 255),
            0,
        );
        this._b = Math.max(
            Math.min(b, 255),
            0,
        );
        this._a = Math.max(
            Math.min(a, 1),
            0,
        );
    }

    get r() {
        return this._r;
    }

    get g() {
        return this._g;
    }

    get b() {
        return this._b;
    }

    get a() {
        return this._a;
    }

    toString() : string
    {
        return `rgb(${this._r}, ${this._g}, ${this._b}, ${this._a})`;
    }

    static lerp(
        from: Colour,
        to: Colour,
        percent: number,
        lerpFunc: LerpFunction = 'linear',
    ) : Colour
    {
        return new this(
            lerp(from.r, to.r, percent, lerpFunc),
            lerp(from.g, to.g, percent, lerpFunc),
            lerp(from.b, to.b, percent, lerpFunc),
            lerp(from.a, to.a, percent, lerpFunc),
        );
    }

    static fromHex(hex: HexColour) : Colour
    {
        // If its in shorthand form, convert to long form
        const fullHexValue = hex.replace(
            Colour.HEX_SHORTHAND_RGX,
            (m, r, g, b) => r + r + g + g + b + b,
        );

        const parseResult = Colour.HEX_RGX.exec(fullHexValue);
        if (!parseResult) {
            return Colour.BLUE;
        }

        return new Colour(
            parseInt(parseResult[1], 16),
            parseInt(parseResult[2], 16),
            parseInt(parseResult[3], 16),
            1,
        );
    }

    static from(colour: Colour) : Colour
    {
        return new this(colour.r, colour.g, colour.b, colour.a);
    }

    equals(colour: Colour) : boolean
    {
        return (
            colour.r === this._r &&
            colour.g === this._g &&
            colour.b === this._b &&
            colour.a === this._a
        );
    }
}

export default Colour;
