export type Input = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'PAUSED';

class InputManager {
    public static Instance = new InputManager();

    public static readonly UP: Input = 'UP';
    public static readonly DOWN: Input = 'DOWN';
    public static readonly LEFT: Input = 'LEFT';
    public static readonly RIGHT: Input = 'RIGHT';
    public static readonly PAUSED: Input = 'PAUSED';

    private _pressedKeys = new Set<Input>();

    getAllPressed(): Input[] {
        return [...this._pressedKeys];
    }

    private constructor() {
        document.addEventListener('keydown', e => {
            switch (e.key) {
                case 'ArrowUp':
                    return this._pressedKeys.add(InputManager.UP);
                case 'ArrowDown':
                    return this._pressedKeys.add(InputManager.DOWN);
                case 'ArrowLeft':
                    return this._pressedKeys.add(InputManager.LEFT);
                case 'ArrowRight':
                    return this._pressedKeys.add(InputManager.RIGHT);
                case 'Escape':
                    return this._pressedKeys.add(InputManager.PAUSED);
            }
        });

        document.addEventListener('keyup', e => {
            switch (e.key) {
                case 'ArrowUp':
                    return this._pressedKeys.delete(InputManager.UP);
                case 'ArrowDown':
                    return this._pressedKeys.delete(InputManager.DOWN);
                case 'ArrowLeft':
                    return this._pressedKeys.delete(InputManager.LEFT);
                case 'ArrowRight':
                    return this._pressedKeys.delete(InputManager.RIGHT);
                case 'Escape':
                    return this._pressedKeys.delete(InputManager.PAUSED);
            }
        });
    }
}

export default InputManager;
