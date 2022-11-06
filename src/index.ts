import autoAnimate, { AnimationController } from '@formkit/auto-animate';
import { Alpine } from 'alpinejs';

export interface AutoAnimateConfig {
    duration?: number;
    easing?: string;
}

let autoAnimateConfig: AutoAnimateConfig = {};

function AutoAnimate(Alpine: Alpine): void {
    Alpine.directive('auto-animate', (el: Node, { expression, modifiers }, { evaluateLater, effect }: { evaluateLater: (expression: string) => (value: unknown) => void, effect: (callback: () => void) => void }) => {
        let config: AutoAnimateConfig = {};
        const durationModifier: string = modifiers.filter((modifier: string) => modifier.match(/^\d+m?s$/))[0] || null;
        if (durationModifier) {
            const inMilliseconds: boolean = !!durationModifier.match(/ms$/);
            const matchedDuration: number = +durationModifier.match(/^\d+/);
            config.duration = matchedDuration * (inMilliseconds ? 1 : 1000);
        }
        const easingModifier: string = modifiers.filter((modifier: string) => !modifier.match(/^\d+m?s$/))[0] || null;
        if (easingModifier) {
            config.easing = easingModifier;
        }
        const controller: AnimationController = autoAnimate(<HTMLElement> el, { ...autoAnimateConfig, ...config });
        if (expression) {
            const isEnabled: (callback: (value: boolean) => void) => void = evaluateLater(expression);
            effect((): void => {
                isEnabled((enabled: boolean): void => {
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

AutoAnimate.configure = (config: AutoAnimateConfig) => {
    autoAnimateConfig = config;
};

export default AutoAnimate;
