/**
 * @Function: 插入外部图片
 * @Author: https://llwiki.org/zh/User:Bhsd
 */
"use strict";
/* global mw, $ */
(() => {
    const main = ($content) => {
        const $images = $content.find( '.outerImage img' );
        if ($images.length === 0) { return; }
        console.log('Hook: wikipage.content, 开始插入外部图片');
        $images.filter(function() { return this.complete && this.naturalWidth === 0; }).trigger( 'error' );
    },
        handler = () => {
        mw.widget = mw.widget || {};
        if (mw.widget.outerImage) { return; }
        $( document.body ).on('error', '.outerImage img', function() {
            $(this).closest( 'div' ).addClass( 'badImage' );
        });
        mw.hook( 'wikipage.content' ).add(main);
        mw.widget.outerImage = true;
    };
    if (window.jQuery) { handler(); }
    else { window.addEventListener('jquery', handler); }
}) ();
