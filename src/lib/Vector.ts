class Vector {
    public x: number;
    public y: number;

    constructor(x: number = 0, y: number = 0) {
        this.x = x;
        this.y = y;
    }

    static from(vector: Vector) : Vector
    {
        return new this(vector.x, vector.y);
    }

    addSelf(vector: Vector) : Vector
    {
        this.x += vector.x;
        this.y += vector.y;
        return this;
    }

    add(vector: Vector) : Vector
    {
        return new Vector(this.x + vector.x, this.y + vector.y);
    }

    multSelf(scalar: number) : Vector
    {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }

    mult(scalar: number) : Vector
    {
        return new Vector(this.x * scalar, this.y * scalar);
    }

    distBetween(vector: Vector) : number
    {
        return Math.sqrt(
            Math.pow(this.x - vector.x, 2) + Math.pow(this.y - vector.y, 2),
        );
    }
}

export default Vector;
