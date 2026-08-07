import '@angular/compiler';
import '@analogjs/vitest-angular/setup-snapshots';
import { setupTestBed } from '@analogjs/vitest-angular/setup-testbed';

// Allow self-signed certificates in test environment (corporate network)
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

// Mock HTMLCanvasElement.getContext for jsdom (used by Lottie animations in Baloise DS)
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: () => ({
    fillStyle: '',
    fillRect: () => {},
    getImageData: () => ({ data: [] }),
    putImageData: () => {},
    clearRect: () => {},
    drawImage: () => {},
    scale: () => {},
    translate: () => {},
    save: () => {},
    restore: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    stroke: () => {},
    fill: () => {},
    arc: () => {},
    clip: () => {},
    measureText: () => ({ width: 0 }),
    createLinearGradient: () => ({ addColorStop: () => {} }),
  }),
  writable: true,
});

setupTestBed();
