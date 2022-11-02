import Vector from '../helpers/Vector';
import Colour from '../helpers/Colour';
import lerp from '../helpers/Lerp';

class ScoreText {
    private static readonly MIN_DIST = 20;
    private static readonly MAX_DIST = 35;

    private static readonly MIN_SIZE = 15;
    private static readonly MIN_START_SIZE = 40;
    private static readonly MAX_START_SIZE = 75;

    private _parentPosition: Vector;
    private _text: string;
    private _size: number;
    private _timeInFade: number;
    private readonly _fillColour: Colour;
    private readonly _outlineColour: Colour;
    private readonly _timeToFade: number;
    private readonly _startSize: number;

    constructor(
        parentPositionRef: Vector,
        text: string,
        actualScore: number,
        maxScore: number,
        timeToFade: number,
        fillColour: Colour,
        outlineColour: Colour,
    )
    {
        this._parentPosition = parentPositionRef;
        this._text = text;

        this._startSize = lerp(
            ScoreText.MIN_START_SIZE,
            ScoreText.MAX_START_SIZE,
            actualScore / maxScore
        );
        this._size = this._startSize;

        this._timeToFade = timeToFade;
        this._timeInFade = this._timeToFade;

        this._fillColour = fillColour,
        this._outlineColour = outlineColour;
    }

    get text() {
        return this._text;
    }

    get font() {
        return `${this._size}px Sans-serif`;
    }

    get fillColour() {
        return this._fillColour.toString();
    }

    get outlineColour() {
        return this._outlineColour.toString();
    }

    nextFrame(deltaTime: number) : void
    {
        this._timeInFade = Math.max(0, this._timeInFade - deltaTime);
        this._size = lerp(
            this._startSize,
            ScoreText.MIN_SIZE,
            1 - (this._timeInFade / this._timeToFade),
            'square'
        );
    }

    getPosition() : Vector
    {
        return this._parentPosition.add(
            new Vector(
                0,
                -lerp(
                    ScoreText.MIN_DIST,
                    ScoreText.MAX_DIST,
                    1 - (this._timeInFade / this._timeToFade),
                    'root'
                ),
            ),
        );
    }

    getOpacity() : number
    {
        return 1 - (this._timeInFade / this._timeToFade);
    }

    shouldDespawn() : boolean
    {
        return this._timeInFade === 0;
    }
}

export default ScoreText;
