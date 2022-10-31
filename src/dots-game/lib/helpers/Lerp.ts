export type LerpFunction = 'linear' | 'ease' | 'square' | 'root' | 'croot';

const lerpFunctions: {[key in LerpFunction]: (t:number) => number} = {
    linear: (t:number) => t,
    ease: (t:number) => 1 - (1 - t) * (1 - t),
    square: (t:number) => t * t,
    root: Math.sqrt,
    croot: Math.cbrt,
};

const lerp = (
    from: number,
    to: number,
    percent: number,
    func: LerpFunction = 'linear',
) : number  => from + (to - from) * lerpFunctions[func](percent);

export default lerp;
