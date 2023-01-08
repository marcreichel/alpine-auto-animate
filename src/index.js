import autoAnimate from '@formkit/auto-animate';

let autoAnimateConfig = {};

function AutoAnimate(Alpine) {
    Alpine.directive('auto-animate', (el, { expression, modifiers }, { evaluateLater, effect }) => {
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
        const controller = autoAnimate(el, { ...autoAnimateConfig, ...config });
        if (expression) {
            const isEnabled = evaluateLater(expression);
            effect(() => {
                isEnabled((enabled) => {
                    if (enabled) {
                        controller.enable();
                    } else {
                        controller.disable();
                    }
                });
            })
        }
    });
}

AutoAnimate.configure = (config) => {
    autoAnimateConfig = config;
};

export default AutoAnimate;
