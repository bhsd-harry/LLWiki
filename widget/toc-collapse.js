/**
 * @Function: 目录初始折叠
 * @Author: https://llwiki.org/zh/User:Bhsd
 */
"use strict";
/* global mw, $ */
(() => {
    const main = () => { $('#toctogglecheckbox').prop('checked', mw.config.get('skin') == 'vector'); };
    if (window.jQuery) { main(); }
    else { window.addEventListener('jquery', main); }
}) ();
