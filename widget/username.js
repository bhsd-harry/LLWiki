/**
 * @Function: 在页面内显示用户名。这个小部件严禁滥用，目前仅可用于Template:Icon。
 * @Source: https://zh.moegirl.org.cn/Widget:UserName
 * @EditedBy: https://llwiki.org/zh/User:Bhsd
 */
"use strict";
/* global mw, $ */
(() => {
    const main = () => {
        const username = mw.config.get( 'wgUserName' );
        if (username) { $('.mw-parser-output .username').text( username ); }
    };
    if (window.jQuery) { main(); }
    else { window.addEventListener('jquery', main); }
}) ();
