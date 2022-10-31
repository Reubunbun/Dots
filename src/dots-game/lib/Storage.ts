import Player from './entities/Player';
import { type HexColour } from '../types/globals';

interface SaveState {
    PlayerSize: number;
    PlayerSpeed: number;
    PlayerInvTime: number;
    PlayerChargesNeeded: number;
    PlayerColour: HexColour;
    ChallengesCompleted: number;
};

class GameStorage {
    private static readonly STORAGE_KEY = 'SaveState';

    private _saveState: SaveState;

    constructor() {
        const serializedSaveState = localStorage.getItem(GameStorage.STORAGE_KEY);
        if (!serializedSaveState) {
            this._saveState = {
                PlayerSize: 0.5,
                PlayerSpeed: 0.5,
                PlayerInvTime: 0.5,
                PlayerChargesNeeded: 0.5,
                PlayerColour: Player.getDefaultColour(),
                ChallengesCompleted: 0,
            };
        } else {
            this._saveState = JSON.parse(serializedSaveState) as SaveState;
        }
    }

    private _setLocalStorage() {
        localStorage.setItem(
            GameStorage.STORAGE_KEY,
            JSON.stringify(this._saveState),
        );
    }

    get playerSize() {
        return this._saveState.PlayerSize;
    }

    get playerSpeed() {
        return this._saveState.PlayerSpeed;
    }

    get playerInvTime() {
        return this._saveState.PlayerInvTime;
    }

    get playerChargesNeeded() {
        return this._saveState.PlayerChargesNeeded;
    }

    get playerColour() {
        return this._saveState.PlayerColour;
    }

    set playerSize(newSize: number) {
        this._saveState.PlayerSize = newSize;
        this._setLocalStorage();
    }

    set playerSpeed(newSpeed: number) {
        this._saveState.PlayerSpeed = newSpeed;
        this._setLocalStorage();
    }

    set playerInvTime(newInvTime: number) {
        this._saveState.PlayerInvTime = newInvTime;
        this._setLocalStorage();
    }

    set playerChargesNeeded(newChargesNeeded: number) {
        this._saveState.PlayerChargesNeeded = newChargesNeeded;
        this._setLocalStorage();
    }

    set playerColour(newColour: HexColour) {
        this._saveState.PlayerColour = newColour;
        this._setLocalStorage();
    }
}

export default GameStorage;
