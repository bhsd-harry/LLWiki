/**
 * @Function: 用于在必要场合代替HTML的title属性，手机版也可生效
 * @Dependencies: oojs-ui-core, ext.gadget.site-lib
 * @Author: https://llwiki.org/zh/User:Bhsd
 */
"use strict";
/* global mw, $ */
(() => {
    const timer = setInterval(() => {
        if (!window.jQuery) { return; }
        clearInterval(timer);
        mw.widget = mw.widget || {};
        if (mw.widget.abbr) { return; }
        console.log('End setInterval: jQuery加载完毕，开始执行Widget:Abbr');
        mw.loader.using(['oojs-ui-core', 'ext.gadget.site-lib']).then(() => {
            mw.tipsy($('body'), '.abbr', {classes: ['abbr-popup'], anchor: false});
        });
        mw.widget.abbr = true;
    }, 500);
}) ();
