/**
 * @Function: 用于在必要场合代替HTML的title属性，手机版也可生效
 * @Dependencies: oojs-ui-core, ext.gadget.site-lib
 * @Author: https://llwiki.org/zh/User:Bhsd
 */
"use strict";
/* global mw, $ */
(() => {
    const main = () => {
        mw.widget = mw.widget || {};
        if (mw.widget.abbr) { return; }
        mw.loader.using(['oojs-ui-core', 'ext.gadget.site-lib']).then(() => {
            mw.tipsy($('#bodyContent'), '.abbr', {anchor: false});
        });
        mw.widget.abbr = true;
    };
    if (window.jQuery) { main(); }
    else { window.addEventListener('jquery', main); }
}) ();
