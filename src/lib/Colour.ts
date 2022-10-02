class Colour {
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
            from.r + (Math.abs(to.r - from.r) * percent),
            from.g + (Math.abs(to.g - from.g) * percent),
            from.b + (Math.abs(to.b - from.b) * percent),
            from.a + (Math.abs(to.a - from.a) * percent),
        );
    }

    static from(colour: Colour) : Colour
    {
        return new this(colour.r, colour.g, colour.b, colour.a);
    }
}

export default Colour;
