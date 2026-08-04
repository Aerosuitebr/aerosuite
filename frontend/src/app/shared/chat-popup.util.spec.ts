import { describe, expect, it } from 'vitest';
import { buildChatPopupFeatures } from './chat-popup.util';

describe('buildChatPopupFeatures', () => {
  it('uses the preferred desktop size and centers it', () => {
    expect(buildChatPopupFeatures({ availWidth: 1920, availHeight: 1080 })).toContain(
      'width=900,height=700,left=510,top=190'
    );
  });

  it('fits the popup inside a compact notebook screen', () => {
    expect(buildChatPopupFeatures({ availWidth: 1366, availHeight: 600 })).toContain(
      'width=900,height=576,left=233,top=12'
    );
  });
});
