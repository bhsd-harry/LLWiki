/**
 * @Function: 插入外部图片
 * @Author: https://llwiki.org/zh/User:Bhsd
 */
"use strict";
/* global mw, $ */
(() => {
    const errorFunc = function() { $(this).closest( 'div' ).addClass( 'badImage' ); },
        main = ($content) => {
        const $images = $content.find( '.outerImage img' ).on('error', errorFunc); // error事件不会冒泡
        if ($images.length === 0) { return; }
        console.log('Hook: wikipage.content, 开始插入外部图片');
        $images.filter(function() { return this.complete && this.naturalWidth === 0; }).trigger( 'error' );
    },
        handler = () => {
        mw.widget = mw.widget || {};
        if (mw.widget.outerImage) { return; }
        mw.hook( 'wikipage.content' ).add(main);
        mw.widget.outerImage = true;
    };
    if (window.jQuery) { handler(); }
    else { window.addEventListener('jquery', handler); }
}) ();
