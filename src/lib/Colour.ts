class Colour {
    public static RED = new Colour(255, 0, 0, 1);
    public static GREEN = new Colour(0, 255, 0, 1);
    public static BLUE = new Colour(0, 0, 255, 1);
    public static PINK = new Colour(255, 0, 255, 1);
    public static YELLOW = new Colour(255, 255, 0, 1);
    public static PURPLE = new Colour(128, 0, 255, 1);
    public static TEAL = new Colour(0, 255, 255, 1);
    public static ORANGE = new Colour(255, 128, 0, 1);

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
    ) : Colour
    {
        return new this(
            from.r + ((to.r - from.r) * percent),
            from.g + ((to.g - from.g) * percent),
            from.b + ((to.b - from.b) * percent),
            from.a + ((to.a - from.a) * percent),
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
