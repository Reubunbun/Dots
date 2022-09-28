import Vector from './Vector';
import Player from './entities/Player';
import InputManager from './InputManager';

class Game {
    private static readonly REF_WIDTH = 1920; //1920
    private static readonly REF_HEIGHT = 903; //903

    private _canvas: HTMLCanvasElement;
    private _context: CanvasRenderingContext2D;
    private _player: Player;
    private _inputManager: InputManager;

    constructor(
        canvas: HTMLCanvasElement,
    )
    {
        this._canvas = canvas;
        this._context = canvas.getContext('2d');
        this._player = new Player(
            new Vector(Game.REF_WIDTH / 2, Game.REF_HEIGHT / 2),
            '#ff1515',
            25,
            123,
        );
        this._inputManager = InputManager.Instance;
    }

    resize(screenWidth: number, screenHeight: number) : void
    {
        this._canvas.style.width = `${screenWidth}px`;
        this._canvas.style.height = `${screenHeight}px`;
        this._canvas.width = screenWidth;
        this._canvas.height = screenHeight;

        const scaleFitNative = Math.min(
            screenWidth / Game.REF_WIDTH,
            screenHeight / Game.REF_HEIGHT,
        );

        this._context.setTransform(
            scaleFitNative, 0,
            0, scaleFitNative,
            (this._canvas.width - Game.REF_WIDTH * scaleFitNative) / 2,
            (this._canvas.height - Game.REF_HEIGHT * scaleFitNative) / 2,
        );

        if (scaleFitNative < 1) {
            this._context.imageSmoothingEnabled = true;
        } else {
            this._context.imageSmoothingEnabled = false;
        }

        // const scale = Math.min(
        //     this._canvas.width / Game.REF_WIDTH,
        //     this._canvas.height / Game.REF_HEIGHT,
        // );
        // this._context.setTransform(
        //     scale,
        //     0,
        //     0,
        //     scale,
        //     (this._canvas.width - Game.REF_WIDTH * scale) / 2,
        //     (this._canvas.height - Game.REF_HEIGHT * scale) / 2,
        // );
    }

    getViewportWidth() : number
    {
        const scale = Math.min(
            this._canvas.width / Game.REF_WIDTH,
            this._canvas.height / Game.REF_HEIGHT,
        );

        return (1 - scale) * Game.REF_WIDTH;
    }

    private _nextFrame() : void
    {
        this._context.fillStyle = '#663399';
        this._context.fillRect(0, 0, Game.REF_WIDTH, Game.REF_HEIGHT);

        this._context.fillStyle = this._player.colour;
        this._context.beginPath();
        this._context.arc(
            this._player.x,
            this._player.y,
            this._player.radius,
            0,
            2 * Math.PI,
        );
        this._context.fill();

        for (const input of this._inputManager.getAllPressed()) {
            switch (input) {
                case 'UP':
                    this._player.move(new Vector(0, -1));
                    continue;
                case 'DOWN':
                    this._player.move(new Vector(0, 1));
                    continue;
                case 'LEFT':
                    this._player.move(new Vector(-1, 0));
                    continue;
                case 'RIGHT':
                    this._player.move(new Vector(1, 0));
                    continue;
            }
        }
    }

    start() : void
    {
        setInterval(this._nextFrame.bind(this), 1 / 60);
    }
}

export default Game;
