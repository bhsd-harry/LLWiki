/**
 * @Function: 1. 提供一个全局方法mw.resizeLyrics，用于计算渲染后的歌词实际宽度并调整CSS
 *            2. 点击角色色块执行筛选效果
 *            3. 鼠标移至歌词上方时提示演唱者
 * @Dependencies: mediawiki.util, oojs-ui-core, ext.gadget.site-lib
 * @Author: https://llwiki.org/zh/User:Bhsd
 */
"use strict";
/* global mw, $ */
(() => {
    let style, members = [];
    const resize = () => {
        const $boxes = $('.Lyrics_box:visible');
        $boxes.filter(function() { return $(this).width() < 720; }).addClass( 'Lyrics_narrow' );
        $boxes.filter(function() { return $(this).width() >= 720; }).removeClass( 'Lyrics_narrow' );
    },
        addCSS = ($content) => {
        // 考虑到快速编辑小工具的页内预览，members有增无减
        members = [...new Set([...members, ...$content.find( '.memberblock' ).map(function() {
            return [...this.classList].filter(e => e.endsWith( '-block' )).toString().slice(0, -6);
        })])];
        style.textContent = members.map(ele => ['gradient', 'single'].map(type =>
            `.${ele}-block.mw-collapsed ~ .Lyrics_box .Lyrics_${type}:not(.${ele}-lyrics)`).join()
        ).join() + '{ -webkit-text-fill-color: #ddd; text-fill-color: #ddd; }';
    },
        main = () => {
        mw.widget = mw.widget || {};
        if (mw.widget.lyrics) { return; }
        const $body = $('#bodyContent');
        $(resize);
        mw.loader.using( 'mediawiki.util' ).then(() => {
            const windowResize = mw.util.debounce(200, resize);
            $(window).resize( windowResize );
            $body.on('click', '.tabs-label', windowResize); // 必须等待tabs的js先执行完毕
        });
        style = mw.loader.addStyleTag('');
        mw.hook( 'wikipage.content' ).add($content => {
            console.log('Hook: wikipage.content, 开始更新演唱者筛选样式表');
            addCSS($content);
        });
        mw.hook( 'wikipage.collapsibleContent' ).add($content => {
            console.log('Hook: wikipage.collapsibleContent, 移除演唱者标注的tabindex');
            $content.filter( '.memberblock' ).removeAttr( 'tabindex' );
        });
        mw.resizeLyrics = resize;
        mw.loader.using(['oojs-ui-core', 'ext.gadget.site-lib']).then(() => {
            mw.tipsy($body, '.Lyrics_single, .Lyrics_gradient', {classes: ['Lyrics_tipsy']});
        });
        mw.widget.lyrics = true;
    };
    if (window.jQuery) { main(); }
    else { window.addEventListener('jquery', main); }
}) ();
