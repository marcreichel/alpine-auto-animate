(function (factory) {
    typeof define === 'function' && define.amd ? define(factory) :
    factory();
})((function () { 'use strict';

    /******************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    /**
     * A set of all the parents currently being observe. This is the only non weak
     * registry.
     */
    const parents = new Set();
    /**
     * Element coordinates that is constantly kept up to date.
     */
    const coords = new WeakMap();
    /**
     * Siblings of elements that have been removed from the dom.
     */
    const siblings = new WeakMap();
    /**
     * Animations that are currently running.
     */
    const animations = new WeakMap();
    /**
     * A map of existing intersection observers used to track element movements.
     */
    const intersections = new WeakMap();
    /**
     * Intervals for automatically checking the position of elements occasionally.
     */
    const intervals = new WeakMap();
    /**
     * The configuration options for each group of elements.
     */
    const options = new WeakMap();
    /**
     * Debounce counters by id, used to debounce calls to update positions.
     */
    const debounces = new WeakMap();
    /**
     * All parents that are currently enabled are tracked here.
     */
    const enabled = new WeakSet();
    /**
     * The document used to calculate transitions.
     */
    let root;
    /**
     * Used to sign an element as the target.
     */
    const TGT = "__aa_tgt";
    /**
     * Used to sign an element as being part of a removal.
     */
    const DEL = "__aa_del";
    /**
     * Callback for handling all mutations.
     * @param mutations - A mutation list
     */
    const handleMutations = (mutations) => {
        const elements = getElements(mutations);
        // If elements is "false" that means this mutation that should be ignored.
        if (elements) {
            elements.forEach((el) => animate(el));
        }
    };
    /**
     *
     * @param entries - Elements that have been resized.
     */
    const handleResizes = (entries) => {
        entries.forEach((entry) => {
            if (entry.target === root)
                updateAllPos();
            if (coords.has(entry.target))
                updatePos(entry.target);
        });
    };
    /**
     * Observe this elements position.
     * @param el - The element to observe the position of.
     */
    function observePosition(el) {
        const oldObserver = intersections.get(el);
        oldObserver === null || oldObserver === void 0 ? void 0 : oldObserver.disconnect();
        let rect = coords.get(el);
        let invocations = 0;
        const buffer = 5;
        if (!rect) {
            rect = getCoords(el);
            coords.set(el, rect);
        }
        const { offsetWidth, offsetHeight } = root;
        const rootMargins = [
            rect.top - buffer,
            offsetWidth - (rect.left + buffer + rect.width),
            offsetHeight - (rect.top + buffer + rect.height),
            rect.left - buffer,
        ];
        const rootMargin = rootMargins
            .map((px) => `${-1 * Math.floor(px)}px`)
            .join(" ");
        const observer = new IntersectionObserver(() => {
            ++invocations > 1 && updatePos(el);
        }, {
            root,
            threshold: 1,
            rootMargin,
        });
        observer.observe(el);
        intersections.set(el, observer);
    }
    /**
     * Update the exact position of a given element.
     * @param el - An element to update the position of.
     */
    function updatePos(el) {
        clearTimeout(debounces.get(el));
        const optionsOrPlugin = getOptions(el);
        const delay = typeof optionsOrPlugin === "function" ? 500 : optionsOrPlugin.duration;
        debounces.set(el, setTimeout(async () => {
            const currentAnimation = animations.get(el);
            if (!currentAnimation || (await currentAnimation.finished)) {
                coords.set(el, getCoords(el));
                observePosition(el);
            }
        }, delay));
    }
    /**
     * Updates all positions that are currently being tracked.
     */
    function updateAllPos() {
        clearTimeout(debounces.get(root));
        debounces.set(root, setTimeout(() => {
            parents.forEach((parent) => forEach(parent, (el) => lowPriority(() => updatePos(el))));
        }, 100));
    }
    /**
     * Its possible for a quick scroll or other fast events to get past the
     * intersection observer, so occasionally we need want "cold-poll" for the
     * latests and greatest position. We try to do this in the most non-disruptive
     * fashion possible. First we only do this ever couple seconds, staggard by a
     * random offset.
     * @param el - Element
     */
    function poll(el) {
        setTimeout(() => {
            intervals.set(el, setInterval(() => lowPriority(updatePos.bind(null, el)), 2000));
        }, Math.round(2000 * Math.random()));
    }
    /**
     * Perform some operation that is non critical at some point.
     * @param callback
     */
    function lowPriority(callback) {
        if (typeof requestIdleCallback === "function") {
            requestIdleCallback(() => callback());
        }
        else {
            requestAnimationFrame(() => callback());
        }
    }
    /**
     * The mutation observer responsible for watching each root element.
     */
    let mutations;
    /**
     * A resize observer, responsible for recalculating elements on resize.
     */
    let resize;
    /**
     * If this is in a browser, initialize our Web APIs
     */
    if (typeof window !== "undefined") {
        root = document.documentElement;
        mutations = new MutationObserver(handleMutations);
        resize = new ResizeObserver(handleResizes);
        resize.observe(root);
    }
    /**
     * Retrieves all the elements that may have been affected by the last mutation
     * including ones that have been removed and are no longer in the DOM.
     * @param mutations - A mutation list.
     * @returns
     */
    function getElements(mutations) {
        return mutations.reduce((elements, mutation) => {
            // Short circuit if we find a purposefully deleted node.
            if (elements === false)
                return false;
            if (mutation.target instanceof Element) {
                target(mutation.target);
                if (!elements.has(mutation.target)) {
                    elements.add(mutation.target);
                    for (let i = 0; i < mutation.target.children.length; i++) {
                        const child = mutation.target.children.item(i);
                        if (!child)
                            continue;
                        if (DEL in child)
                            return false;
                        target(mutation.target, child);
                        elements.add(child);
                    }
                }
                if (mutation.removedNodes.length) {
                    for (let i = 0; i < mutation.removedNodes.length; i++) {
                        const child = mutation.removedNodes[i];
                        if (DEL in child)
                            return false;
                        if (child instanceof Element) {
                            elements.add(child);
                            target(mutation.target, child);
                            siblings.set(child, [
                                mutation.previousSibling,
                                mutation.nextSibling,
                            ]);
                        }
                    }
                }
            }
            return elements;
        }, new Set());
    }
    /**
     * Assign the target to an element.
     * @param el - The root element
     * @param child
     */
    function target(el, child) {
        if (!child && !(TGT in el))
            Object.defineProperty(el, TGT, { value: el });
        else if (child && !(TGT in child))
            Object.defineProperty(child, TGT, { value: el });
    }
    /**
     * Determines what kind of change took place on the given element and then
     * performs the proper animation based on that.
     * @param el - The specific element to animate.
     */
    function animate(el) {
        var _a;
        const isMounted = root.contains(el);
        const preExisting = coords.has(el);
        if (isMounted && siblings.has(el))
            siblings.delete(el);
        if (animations.has(el)) {
            (_a = animations.get(el)) === null || _a === void 0 ? void 0 : _a.cancel();
        }
        if (preExisting && isMounted) {
            remain(el);
        }
        else if (preExisting && !isMounted) {
            remove(el);
        }
        else {
            add(el);
        }
    }
    /**
     * Removes all non-digits from a string and casts to a number.
     * @param str - A string containing a pixel value.
     * @returns
     */
    function raw(str) {
        return Number(str.replace(/[^0-9.\-]/g, ""));
    }
    /**
     * Get the coordinates of elements adjusted for scroll position.
     * @param el - Element
     * @returns
     */
    function getCoords(el) {
        const rect = el.getBoundingClientRect();
        return {
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width,
            height: rect.height,
        };
    }
    /**
     * Returns the width/height that the element should be transitioned between.
     * This takes into account box-sizing.
     * @param el - Element being animated
     * @param oldCoords - Old set of Coordinates coordinates
     * @param newCoords - New set of Coordinates coordinates
     * @returns
     */
    function getTransitionSizes(el, oldCoords, newCoords) {
        let widthFrom = oldCoords.width;
        let heightFrom = oldCoords.height;
        let widthTo = newCoords.width;
        let heightTo = newCoords.height;
        const styles = getComputedStyle(el);
        const sizing = styles.getPropertyValue("box-sizing");
        if (sizing === "content-box") {
            const paddingY = raw(styles.paddingTop) +
                raw(styles.paddingBottom) +
                raw(styles.borderTopWidth) +
                raw(styles.borderBottomWidth);
            const paddingX = raw(styles.paddingLeft) +
                raw(styles.paddingRight) +
                raw(styles.borderRightWidth) +
                raw(styles.borderLeftWidth);
            widthFrom -= paddingX;
            widthTo -= paddingX;
            heightFrom -= paddingY;
            heightTo -= paddingY;
        }
        return [widthFrom, widthTo, heightFrom, heightTo].map(Math.round);
    }
    /**
     * Retrieves animation options for the current element.
     * @param el - Element to retrieve options for.
     * @returns
     */
    function getOptions(el) {
        return TGT in el && options.has(el[TGT])
            ? options.get(el[TGT])
            : { duration: 250, easing: "ease-in-out" };
    }
    /**
     * Returns the target of a given animation (generally the parent).
     * @param el - An element to check for a target
     * @returns
     */
    function getTarget(el) {
        if (TGT in el)
            return el[TGT];
        return undefined;
    }
    /**
     * Checks if animations are enabled or disabled for a given element.
     * @param el - Any element
     * @returns
     */
    function isEnabled(el) {
        const target = getTarget(el);
        return target ? enabled.has(target) : false;
    }
    /**
     * Iterate over the children of a given parent.
     * @param parent - A parent element
     * @param callback - A callback
     */
    function forEach(parent, ...callbacks) {
        callbacks.forEach((callback) => callback(parent, options.has(parent)));
        for (let i = 0; i < parent.children.length; i++) {
            const child = parent.children.item(i);
            if (child) {
                callbacks.forEach((callback) => callback(child, options.has(child)));
            }
        }
    }
    /**
     * The element in question is remaining in the DOM.
     * @param el - Element to flip
     * @returns
     */
    function remain(el) {
        const oldCoords = coords.get(el);
        const newCoords = getCoords(el);
        if (!isEnabled(el))
            return coords.set(el, newCoords);
        let animation;
        if (!oldCoords)
            return;
        const pluginOrOptions = getOptions(el);
        if (typeof pluginOrOptions !== "function") {
            const deltaX = oldCoords.left - newCoords.left;
            const deltaY = oldCoords.top - newCoords.top;
            const [widthFrom, widthTo, heightFrom, heightTo] = getTransitionSizes(el, oldCoords, newCoords);
            const start = {
                transform: `translate(${deltaX}px, ${deltaY}px)`,
            };
            const end = {
                transform: `translate(0, 0)`,
            };
            if (widthFrom !== widthTo) {
                start.width = `${widthFrom}px`;
                end.width = `${widthTo}px`;
            }
            if (heightFrom !== heightTo) {
                start.height = `${heightFrom}px`;
                end.height = `${heightTo}px`;
            }
            animation = el.animate([start, end], {
                duration: pluginOrOptions.duration,
                easing: pluginOrOptions.easing,
            });
        }
        else {
            animation = new Animation(pluginOrOptions(el, "remain", oldCoords, newCoords));
            animation.play();
        }
        animations.set(el, animation);
        coords.set(el, newCoords);
        animation.addEventListener("finish", updatePos.bind(null, el));
    }
    /**
     * Adds the element with a transition.
     * @param el - Animates the element being added.
     */
    function add(el) {
        const newCoords = getCoords(el);
        coords.set(el, newCoords);
        const pluginOrOptions = getOptions(el);
        if (!isEnabled(el))
            return;
        let animation;
        if (typeof pluginOrOptions !== "function") {
            animation = el.animate([
                { transform: "scale(.98)", opacity: 0 },
                { transform: "scale(0.98)", opacity: 0, offset: 0.5 },
                { transform: "scale(1)", opacity: 1 },
            ], {
                duration: pluginOrOptions.duration * 1.5,
                easing: "ease-in",
            });
        }
        else {
            animation = new Animation(pluginOrOptions(el, "add", newCoords));
            animation.play();
        }
        animations.set(el, animation);
        animation.addEventListener("finish", updatePos.bind(null, el));
    }
    /**
     * Animates the removal of an element.
     * @param el - Element to remove
     */
    function remove(el) {
        var _a;
        if (!siblings.has(el) || !coords.has(el))
            return;
        const [prev, next] = siblings.get(el);
        Object.defineProperty(el, DEL, { value: true });
        if (next && next.parentNode && next.parentNode instanceof Element) {
            next.parentNode.insertBefore(el, next);
        }
        else if (prev && prev.parentNode) {
            prev.parentNode.appendChild(el);
        }
        else {
            (_a = getTarget(el)) === null || _a === void 0 ? void 0 : _a.appendChild(el);
        }
        function cleanUp() {
            var _a;
            el.remove();
            coords.delete(el);
            siblings.delete(el);
            animations.delete(el);
            (_a = intersections.get(el)) === null || _a === void 0 ? void 0 : _a.disconnect();
        }
        if (!isEnabled(el))
            return cleanUp();
        const [top, left, width, height] = deletePosition(el);
        const optionsOrPlugin = getOptions(el);
        const oldCoords = coords.get(el);
        let animation;
        Object.assign(el.style, {
            position: "absolute",
            top: `${top}px`,
            left: `${left}px`,
            width: `${width}px`,
            height: `${height}px`,
            margin: 0,
            pointerEvents: "none",
            transformOrigin: "center",
            zIndex: 100,
        });
        if (typeof optionsOrPlugin !== "function") {
            animation = el.animate([
                {
                    transform: "scale(1)",
                    opacity: 1,
                },
                {
                    transform: "scale(.98)",
                    opacity: 0,
                },
            ], { duration: optionsOrPlugin.duration, easing: "ease-out" });
        }
        else {
            animation = new Animation(optionsOrPlugin(el, "remove", oldCoords));
            animation.play();
        }
        animations.set(el, animation);
        animation.addEventListener("finish", cleanUp);
    }
    function deletePosition(el) {
        const oldCoords = coords.get(el);
        const [width, , height] = getTransitionSizes(el, oldCoords, getCoords(el));
        let offsetParent = el.parentElement;
        while (offsetParent &&
            (getComputedStyle(offsetParent).position === "static" ||
                offsetParent instanceof HTMLBodyElement)) {
            offsetParent = offsetParent.parentElement;
        }
        if (!offsetParent)
            offsetParent = document.body;
        const parentStyles = getComputedStyle(offsetParent);
        const parentCoords = coords.get(offsetParent) || getCoords(offsetParent);
        const top = Math.round(oldCoords.top - parentCoords.top) -
            raw(parentStyles.borderTopWidth);
        const left = Math.round(oldCoords.left - parentCoords.left) -
            raw(parentStyles.borderLeftWidth);
        return [top, left, width, height];
    }
    /**
     * A function that automatically adds animation effects to itself and its
     * immediate children. Specifically it adds effects for adding, moving, and
     * removing DOM elements.
     * @param el - A parent element to add animations to.
     * @param options - An optional object of options.
     */
    function autoAnimate(el, config = {}) {
        if (mutations && resize) {
            const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
            const isDisabledDueToReduceMotion = mediaQuery.matches &&
                typeof config !== "function" &&
                !config.disrespectUserMotionPreference;
            if (!isDisabledDueToReduceMotion) {
                enabled.add(el);
                if (getComputedStyle(el).position === "static") {
                    Object.assign(el.style, { position: "relative" });
                }
                forEach(el, updatePos, poll, (element) => resize === null || resize === void 0 ? void 0 : resize.observe(element));
                if (typeof config === "function") {
                    options.set(el, config);
                }
                else {
                    options.set(el, { duration: 250, easing: "ease-in-out", ...config });
                }
                mutations.observe(el, { childList: true });
                parents.add(el);
            }
        }
        return Object.freeze({
            parent: el,
            enable: () => {
                enabled.add(el);
            },
            disable: () => {
                enabled.delete(el);
            },
            isEnabled: () => enabled.has(el),
        });
    }

    var autoAnimateConfig = {};
    function AutoAnimate(Alpine) {
        Alpine.directive('auto-animate', function (el, _a, _b) {
            var expression = _a.expression, modifiers = _a.modifiers;
            var evaluateLater = _b.evaluateLater, effect = _b.effect;
            var config = {};
            var durationModifier = modifiers.filter(function (modifier) { return modifier.match(/^\d+m?s$/); })[0] || null;
            if (durationModifier) {
                var inMilliseconds = !!durationModifier.match(/ms$/);
                var matchedDuration = +durationModifier.match(/^\d+/);
                config.duration = matchedDuration * (inMilliseconds ? 1 : 1000);
            }
            var easingModifier = modifiers.filter(function (modifier) { return !modifier.match(/^\d+m?s$/); })[0] || null;
            if (easingModifier) {
                config.easing = easingModifier;
            }
            var controller = autoAnimate(el, __assign(__assign({}, autoAnimateConfig), config));
            if (expression) {
                var isEnabled_1 = evaluateLater(expression);
                effect(function () {
                    isEnabled_1(function (enabled) {
                        if (enabled) {
                            controller.enable();
                        }
                        else {
                            controller.disable();
                        }
                    });
                });
            }
        });
    }
    AutoAnimate.configure = function (config) {
        autoAnimateConfig = config;
    };

    document.addEventListener('alpine:init', function () {
        AutoAnimate(window.Alpine);
    });

}));
//# sourceMappingURL=alpine-auto-animate.js.map
