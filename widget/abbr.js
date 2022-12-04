/**
 * @Function: 用于在必要场合代替HTML的title属性，手机版也可生效
 * @Dependencies: oojs-ui-core, ext.gadget.site-lib
 * @Author: https://llwiki.org/zh/User:Bhsd
 */
'use strict';
(() => {
    const main = async () => {
        mw.widget = mw.widget ?? {};
        if (mw.widget.abbr) {
            return;
        }
        mw.widget.abbr = true;
        await mw.loader.using(['oojs-ui-core', 'ext.gadget.site-lib']);
        mw.tipsy('#bodyContent', '.abbr', {anchor: false});
    };
    if (window.jQuery) {
        main();
    } else {
        window.addEventListener('jquery', main);
    }
})();