/**
 * @Function: 在页面内显示用户名。这个小部件严禁滥用，目前仅可用于Template:Icon。
 * @Source: https://zh.moegirl.org.cn/Widget:UserName
 * @EditedBy: https://llwiki.org/zh/User:Bhsd
 */
"use strict";
/* global mw */
(() => {
    const main = () => {
        const username = mw.config.get( 'wgUserName' );
        if (!username) { return; }
        console.log('End setInterval: mediaWiki加载完毕，开始显示用户名');
        document.querySelectorAll( '.mw-parser-output .username' ).forEach(ele => { ele.textContent = username; });
    },
        timer = setInterval(() => {
        if (!window.mediaWiki) { return; }
        clearInterval(timer);
        main();
    }, 100);
}) ();
