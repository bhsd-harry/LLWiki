/**
 * @Function: 用于 https://llwiki.org/zh/LoveLive!学园偶像祭歌曲列表 的表格折叠
 * @Author: https://llwiki.org/zh/User:Bhsd
 */
"use strict";
/* global mw, $ */
(() => {
    const formatData = (ele) => ele.textContent.toLowerCase().replace(/[^a-z]/g, ''),
        main = ($content) => {
        console.log('Hook: wikipage.content, 开始折叠SIF歌曲列表的下拉选单');
        const $dropdown = $content.find( '.sif-song-table .tabs-content' ).attr('lang', 'ja');
        // 手机版的下拉菜单解析有误
        if (mw.config.get('skin') == 'minerva') { $dropdown.append(function() { return $(this).next(); }); }
        $dropdown.parent().one('click mouseenter', function() {
            const $this = $(this);
            $this.css('width', $this.children( '.tabs-content' ).width());
        });
        $dropdown.find( 'li' ).not(function() {
            return $(this).closest( '.sif-song-table' ).find( `[data-${formatData( this )}]` ).length;
        }).remove();
    },
        timer = setInterval(() => {
        if (!window.jQuery) { return; }
        clearInterval(timer);
        mw.widget = mw.widget || {};
        if (mw.widget.sifSongTable) { return; }
        console.log('End setInterval: jQuery加载完毕，开始执行Widget:Sif-song-table');
        mw.hook( 'wikipage.content' ).add( main );
        $('body').on('click', '.sif-song-table .tabs-content', function(e) {
            const $ele = $(this),
                option = e.target,
                lvl = formatData( option );
            $ele.prev().text( option.textContent );
            $ele.closest( '.sif-song-table' ).find( '.sif-song-option' ).text(function() {
                return this.dataset[lvl] || '/';
            });
        });
        mw.widget.sifSongTable = true;
    }, 500);
}) ();
