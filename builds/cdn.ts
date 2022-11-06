import AutoAnimate from '../src/index';

document.addEventListener('alpine:init', (): void => {
    AutoAnimate((<any>window).Alpine);
});
