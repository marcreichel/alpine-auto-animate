<h1 align="center">💫 Alpine AutoAnimate 💫</h1>

<p align="center">
  An <a href="https://alpinejs.dev">Alpine.js</a> wrapper for <a href="https://github.com/formkit/auto-animate">@formkit/auto-animate</a>.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@marcreichel/alpine-auto-animate">
    <img src="https://img.shields.io/github/v/tag/marcreichel/alpine-auto-animate?label=version" alt="version">
  </a>
  <a href="https://www.npmjs.com/package/@marcreichel/alpine-auto-animate">
    <img src="https://img.badgesize.io/marcreichel/alpine-auto-animate/main/dist/alpine-auto-animate.min.js.svg?compression=gzip&color=green" alt="Build size">
  </a>
  <a href="https://www.npmjs.com/package/@marcreichel/alpine-auto-animate">
    <img src="https://img.shields.io/npm/dt/@marcreichel/alpine-auto-animate" alt="downloads">
  </a>
  <a href="https://www.jsdelivr.com/package/npm/@marcreichel/alpine-auto-animate">
    <img src="https://data.jsdelivr.com/v1/package/npm/@marcreichel/alpine-auto-animate/badge?style=rounded" alt="JSDelivr">
  </a>
  <a href="https://www.npmjs.com/package/@marcreichel/alpine-auto-animate">
    <img alt="GitHub" src="https://img.shields.io/github/license/marcreichel/alpine-auto-animate">
  </a>
  <a href="https://gitmoji.dev/">
    <img src="https://img.shields.io/badge/gitmoji-%20😜%20😍-FFDD67.svg" alt="Gitmoji">
  </a>
</p>

## 🚀 Installation

### CDN

Include the following `<script>` tag in the `<head>` of your document, just before Alpine.

```html
<script
    src="https://cdn.jsdelivr.net/npm/@marcreichel/alpine-auto-animate@latest/dist/alpine-auto-animate.min.js"
    defer
></script>
```

### NPM

```shell
npm install @marcreichel/alpine-auto-animate
```

Add the `x-auto-animate` directive to your project by importing the package **before** starting Alpine.

```js
import Alpine from 'alpinejs';
import AutoAnimate from '@marcreichel/alpine-auto-animate';

Alpine.plugin(AutoAnimate);

Alpine.start();
```

## 🪄 Usage

Add the `x-auto-animate` directive to any element where you want to apply animations (including their direct children).

```html
<ul x-auto-animate>
    <li>Lorem</li>
    <li>Ipsum</li>
</ul>
```

### Duration

To adjust the animation duration add a modifier like so:

```html
<ul x-auto-animate.1000ms>
    <!-- ... -->
</ul>
```

or

```html
<ul x-auto-animate.1s>
    <!-- ... -->
</ul>
```

### Easing function

To adjust the easing function add it as a modifier:

```html
<ul x-auto-animate.linear>
    <!-- ... -->
</ul>
```

### Toggle animations

In some situations it may be necessary to disable animations and re-enable them later.

For this you can provide a boolean to the directive like so:

```html
<div x-data="{ enabled: true }">
    <ul x-auto-animate="enabled">
        <!-- ... -->
    </ul>
    <button @click="enabled = !enabled" type="button">Toggle animations</button>
</div>
```

## Global config

If you are using the `npm` installation method for this package or the ESM distribution, you can use the
`AutoAnimate.configure` method to provide a configuration:

```javascript
import AutoAnimate from '@marcreichel/alpine-auto-animate';

Alpine.plugin(
    AutoAnimate.configure({
        duration: 1000,
        easing: 'linear',
        disrespectUserMotionPreference: true,
    }),
);
```

## 📄 License

Copyright (c) 2022 Marc Reichel and contributors.

Licensed under the MIT license, see [LICENSE](LICENSE) for details.
