/**
 * @Function: 鼠标移动至歌曲站位图标上方时提示角色姓名
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
        if (mw.widget.songposition) { return; }
        console.log('End setInterval: jQuery加载完毕，开始执行Widget:Songposition');
        const target = '.member-symbol',
            map = new Map(),
            $label = $('<div>', {class: 'member-popup-image'}).wrap( '<div>' ).parent(),
            $body = $('body').on('mouseenter focus', target, function() {
            $label.children( 'div' ).html( map.get(this) );
        });
        mw.hook( 'wikipage.content' ).add($content => { // 更新图片对应关系
            if ($content.find( '.member-symbol-image' ).length === 0) { return; }
            console.log('Hook: wikipage.content, 开始更新songposition的图片映射');
            $content.find( target ).each(function() { map.set(this, $(this).next().find( 'img' )); });
        });
        mw.loader.using(['oojs-ui-core', 'ext.gadget.site-lib']).then(() => {
            mw.tipsy($body, target, {classes: ['member-popup']}, $label);
        });
        mw.widget.songposition = true;
    }, 500);
}) ();
