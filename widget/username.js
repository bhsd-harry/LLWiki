/**
 * @Function: 在页面内显示用户名。这个小部件严禁滥用，目前仅可用于https://llwiki.org/zh/Template:Icon。
 * @Source: https://zh.moegirl.org.cn/Widget:UserName
 * @EditedBy: https://llwiki.org/zh/User:Bhsd
 */
"use strict";
/* global mw, $ */
(() => {
    const main = () => {
        const username = mw.config.get( 'wgUserName' );
        if (username) { $('table.story .story-icon > .username').text( username ); } // 只可用于https://llwiki.org/zh/Template:Stories
    };
    if (window.jQuery) { main(); }
    else { window.addEventListener('jquery', main); }
}) ();
