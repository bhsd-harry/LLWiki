/**
 * @Function: 使用ComboBox筛选歌曲
 * @Dependencies: oojs-ui-core
 * @Author: https://llwiki.org/zh/User:Bhsd
 */
"use strict";
/*global mw, $, OO*/
// 避免生成全局变量
(() => {
    const main = ($content) => {
        const $container = $content.find( '.as-song-container' );
        if ($container.length === 0) { return; }
        console.log('Hook: wikipage.content，开始添加AS歌曲下拉选单');
        $container.each(function() {
            const $nodes = $(this).find( '.as-song' ),
                names = [...$nodes].map(ele => $(ele).find( 'big' ).text()),
                indices = Object.fromEntries( names.map((ele, i) => [ele, i]) ),
                options = names.sort().map(ele => ({data: ele}));
            let oldIndex;
            mw.loader.using( 'oojs-ui-core' ).then(() => {
                const select = new OO.ui.ComboBoxInputWidget({menu: {filterFromInput: true}, options})
                    .on('change', () => {
                    $nodes.eq( oldIndex ).css('display', '');
                    oldIndex = indices[ select.getValue() ];
                    $nodes.eq( oldIndex ).css('display', 'table');
                });
                select.$element.attr('lang', 'ja').prependTo( this );
                $('<a>', {class: 'indicator-clear', html: '<i class="fas fa-backspace"></i>'})
                    .appendTo( select.$element ).click(() => { select.setValue(''); });
            });
        });
    },
        timer = setInterval(() => {
        if (!window.jQuery) { return; }
        clearInterval(timer);
        mw.widget = mw.widget || {};
        if (mw.widget.asSong) { return; }
        console.log('End setInterval: jQuery加载完毕，开始执行Widget:As-song');
        mw.hook( 'wikipage.content' ).add(main);
        mw.widget.asSong = true;
    }, 500);
}) ();
