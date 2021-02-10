---
layout: post
title: Retro Supersampling
---

Modern systems have a lot more functionaliy than classic ones, except for the ability to render non-square pictures as unlike CRTs, modern displays have fixed square pixels. This means when drawing at the correct aspect ratio there is no direct mapping of pixels between displays at any scale. Emulators usually handle this by using an incorrect aspect ratio and scaling at a round multiple, but a full screen scaling isn't going to be an exact multiple of the original size.

A good way to solve this problem is supersampling the original pixels, [Here is a live example in WebAssembly]({{ site.baseurl }}/zxsc/).

Naive nearest neighbor upscaling on the left, supersampling on the right.

![_config.yml]({{ site.baseurl }}/zxsc/compare.png)

