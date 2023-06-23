import { expect, it, describe } from '@jest/globals';
import { staggeredFade } from './transitionUtils';

const baseDelay = 0.1;

describe('transitionUtils', () => {
    describe('staggeredFade', () => {
        it('stagger fadeIn from the middle (even, low)', () => {
            // middle two nodes should be 0
            expect(staggeredFade(1, 4, true, baseDelay).transitionDelay).toEqual('0s');
        });
        it('stagger fadeIn from the middle (even, high)', () => {
            // middle two nodes should be 0
            expect(staggeredFade(2, 4, true, baseDelay).transitionDelay).toEqual('0s');
        });
        it('stagger fadeIn from the middle (even)', () => {
            // middle two nodes should be 0
            expect(staggeredFade(0, 4, true, baseDelay).transitionDelay).toEqual('0.1s');
            expect(staggeredFade(3, 4, true, baseDelay).transitionDelay).toEqual('0.1s');
        });

        it('stagger fadeIn from the middle (odd)', () => {
            // middle one node should be 0
            expect(staggeredFade(2, 5, true, baseDelay).transitionDelay).toEqual('0s');
            // 1-off middle
            expect(staggeredFade(3, 5, true, baseDelay).transitionDelay).toEqual('0.1s');
            expect(staggeredFade(1, 5, true, baseDelay).transitionDelay).toEqual('0.1s');
            // 2-off middle
            expect(staggeredFade(4, 5, true, baseDelay).transitionDelay).toEqual('0.2s');
            expect(staggeredFade(0, 5, true, baseDelay).transitionDelay).toEqual('0.2s');
        });

        // fadeOut
        it('stagger fadeOut from the middle (even, edge)', () => {
            expect(staggeredFade(0, 4, false, baseDelay).transitionDelay).toEqual('0s');
            expect(staggeredFade(3, 4, false, baseDelay).transitionDelay).toEqual('0s');
        });

        it('stagger fadeOut from the middle (even, middle)', () => {
            expect(staggeredFade(1, 4, false, baseDelay).transitionDelay).toEqual('0.1s');
            expect(staggeredFade(2, 4, false, baseDelay).transitionDelay).toEqual('0.1s');
        });

        it('stagger fadeOut from the middle (odd)', () => {
            // middle one node should be 0
            expect(staggeredFade(2, 5, false, baseDelay).transitionDelay).toEqual('0.2s');
            // 1-off middle
            expect(staggeredFade(3, 5, false, baseDelay).transitionDelay).toEqual('0.1s');
            expect(staggeredFade(1, 5, false, baseDelay).transitionDelay).toEqual('0.1s');
            // 2-off middle
            expect(staggeredFade(4, 5, false, baseDelay).transitionDelay).toEqual('0s');
            expect(staggeredFade(0, 5, false, baseDelay).transitionDelay).toEqual('0s');
        });
    });
});
