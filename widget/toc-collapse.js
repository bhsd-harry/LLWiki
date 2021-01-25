/**
 * @Function: 目录初始折叠
 * @Author: https://llwiki.org/zh/User:Bhsd
 */
"use strict";
/* global mw */
(() => {
    const timer = setInterval(() => {
        if (!window.mediaWiki) { return; }
        clearInterval(timer);
        console.log('End setInterval: mediaWiki加载完毕，开始折叠目录');
        document.querySelector( '#toctogglecheckbox' ).checked = mw.config.get('skin') == 'vector';
    }, 100);
}) ();
