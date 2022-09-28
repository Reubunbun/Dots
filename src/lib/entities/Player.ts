import Vector from '../Vector';
import Entity from './Abstract';
import Game from '../Game';
import InputManager from '../InputManager';

class Player extends Entity {
    private static readonly MAX_VELOCITY = 5;
    private static readonly DRAG = 0.9;

    constructor(
        position: Vector,
        colour: string,
        radius: number,
        speed: number,
    ) {
        super(position, colour, radius, speed);
    }

    nextFrame(deltaTime: number) : void
    {
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
        this._velocity.x = Math.min(
            Math.max(this._velocity.x, -Player.MAX_VELOCITY),
            Player.MAX_VELOCITY,
        );
        this._velocity.y = Math.min(
            Math.max(this._velocity.y, -Player.MAX_VELOCITY),
            Player.MAX_VELOCITY,
        );

        this._velocity.multSelf(Player.DRAG);

        this._move(deltaTime);

        // Clamp position in game bounds
        this._position.x = Math.min(
            Math.max(this._position.x, this._radius),
            Game.REF_WIDTH - this._radius,
        );
        this._position.y = Math.min(
            Math.max(this._position.y, this._radius),
            Game.REF_HEIGHT - this._radius,
        );
    }
}

export default Player;
