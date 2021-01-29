/**
 * @Function: 插入外部图片
 * @Dependencies: mediawiki.util, ext.gadget.site-lib
 * @Author: https://llwiki.org/zh/User:Bhsd
 */
"use strict";
/* global mw, $, wgUCS */
(() => {
    const main = ($content) => {
        const $images = $content.find( '.outerImage > :empty' );
        if ($images.length === 0) { return; }
        console.log('Hook: wikipage.content, 开始插入外部图片');
        $images.append(function() {
            const url = `https://${ mw.util.wikiUrlencode( this.dataset.url ) }`; // 防止XSS
            return $('<a>', { href: url, target: '_blank',
                html: $('<img>', {src: url, alt: mw.msg('widget-oi'), class: 'error'}).on('error', function() {
                $(this).parent().removeAttr( 'href' ); // 移除不良链接
            }) });
        });
    },
        timer = setInterval(() => {
        if (!window.jQuery) { return; }
        clearInterval( timer );
        mw.widget = mw.widget || {};
        if (mw.widget.outerImage) { return; }
        console.log('End setInterval: jQuery加载完毕，开始执行Widget:OuterImage');
        mw.loader.using( ['mediawiki.util', 'ext.gadget.site-lib'] ).then(() => {
            mw.messages.set('widget-oi', wgUCS('无法加载外部图片！', '無法加載外部圖片！'));
            mw.hook( 'wikipage.content' ).add(main);
        });
        mw.widget.outerImage = true;
    });
}) ();
