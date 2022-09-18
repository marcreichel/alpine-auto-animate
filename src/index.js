import autoAnimate from '@formkit/auto-animate';

let autoAnimateConfig = {};

function AutoAnimate(Alpine) {
    Alpine.directive('auto-animate', (el, { expression, modifiers }, { evaluate }) => {
        let config = {};
        const durationModifier = modifiers.filter((modifier) => modifier.match(/^\d+m?s$/))[0] || null;
        if (durationModifier) {
            const inMilliseconds = !!durationModifier.match(/ms$/);
            const matchedDuration = + durationModifier.match(/^\d+/);
            config.duration = matchedDuration * (inMilliseconds ? 1 : 1000);
        }
        const easingModifier = modifiers.filter((modifier) => !modifier.match(/^\d+m?s$/))[0] || null;
        if (easingModifier) {
            config.easing = easingModifier;
        }
        autoAnimate(el, { ...autoAnimateConfig, ...config });
    });
}

AutoAnimate.configure = (config) => {
    autoAnimateConfig = config;
};

export default AutoAnimate;
