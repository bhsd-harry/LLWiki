/**
 * @Function: 鼠标移动至歌曲站位图标上方时提示角色姓名
 * @Dependencies: oojs-ui-core, ext.gadget.site-lib
 * @Author: https://llwiki.org/zh/User:Bhsd
 */
"use strict";
/* global mw, $ */
(() => {
    const main = () => {
        mw.widget = mw.widget || {};
        if (mw.widget.songposition) { return; }
        const target = '.member-symbol',
            map = new Map(),
            $label = $('<div>', {html: '<div>'}),
            $body = $( '#bodyContent' ).on('mouseenter focus', target, function() {
            $label.children( 'div' ).html( map.get(this) );
        });
        mw.hook( 'wikipage.content' ).add($content => { // 更新图片对应关系
            if ($content.find( '.member-symbol-image' ).length === 0) { return; }
            console.log('Hook: wikipage.content, 开始更新songposition的图片映射');
            $content.find( target ).each(function() { map.set(this, $(this).next().find( 'img' )); });
        });
        mw.loader.using(['oojs-ui-core', 'ext.gadget.site-lib']).then(() => {
            mw.tipsy($body, target, {id: 'member-popup'}, $label);
        });
        mw.widget.songposition = true;
    };
    if (window.jQuery) { main(); }
    else { window.addEventListener('jquery', main); }
}) ();
