import { waitElement } from '@1natsu/wait-element';
import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';

export default defineContentScript({
  matches: ['*://*.google.com/*'],
  async main(ctx) {
    // @webext-core/messaging sample: send a request to the background script.
    // @webext-core/messaging のサンプル: background script にリクエストを送ります。
    const echoed = await messenger.sendMessage('echo', 'Hello from content script');

    // @1natsu/wait-element sample: wait until the target element appears.
    // @1natsu/wait-element のサンプル: 対象要素が出現するまで待機します。
    const body = await waitElement('body', { signal: ctx.signal });

    console.info('[wxt-customizer] echo:', echoed);

    // wxt/storage sample: content scripts can read and write the shared vault directly.
    // wxt/storage のサンプル: content script から共有 vault を直接読み書きします。
    const debug = await vault.debug.getValue();
    body.toggleAttribute('data-wxt-debug', debug);

    if (debug) {
      alert('[wxt-customizer] Debug mode is on.');
    }

    const changeDebug = async (enabled: boolean) => {
      await vault.debug.setValue(enabled);
      body.toggleAttribute('data-wxt-debug', enabled);
      if (enabled) {
        alert('[wxt-customizer] Debug mode is on.');
      }
      console.info(`[wxt-customizer] debug: ${enabled ? 'on' : 'off'}`);
    };

    // WXT content script UI + React sample: click the floating button to toggle debug mode.
    // WXT content script UI + React のサンプル: 右下のボタンをクリックして debug mode を切り替えます。
    const ui = await createShadowRootUi<Root>(ctx, {
      name: 'wxt-debug-toggle',
      position: 'inline',
      anchor: body,
      append: 'last',
      onMount(container) {
        const root = createRoot(container);
        root.render(createElement(DebugToggle, { initialEnabled: debug, onChange: changeDebug }));
        return root;
      },
      onRemove(mountedRoot) {
        mountedRoot?.unmount();
      },
    });

    ui.mount();
  },
});
