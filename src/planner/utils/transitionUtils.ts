/**
 * Copyright 2023 Kapeta Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

export const staggeredFade = (i: number, n: number, show: boolean, delay = 0.05) => {
    // staggered fade in from the middle
    const isEven = n % 2 === 0;
    // For even number, we care about the middle two elements, pick the closest one
    let middleIndex = Math.floor(n / 2);
    if (isEven) {
        middleIndex = i < middleIndex ? middleIndex - 1 : middleIndex;
    }

    // Calculate the distance from the middle index to the current element
    const distanceFromMiddle = Math.abs(i - middleIndex);
    const distanceFromEdge = Math.min(i, n - i - 1);

    const staggeredInDelay = distanceFromMiddle * delay;
    const staggeredOutDelay = distanceFromEdge * delay;
    return {
        transition: `opacity 0.1s linear`,
        transitionDelay: `${show ? staggeredInDelay : staggeredOutDelay}s`,
        opacity: show ? 1 : 0,
    };
};
