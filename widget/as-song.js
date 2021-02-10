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
            const nodes = [...$(this).find( '.as-song' )],
                map = Object.fromEntries( nodes.map(ele => [$(ele).find( 'big' ).text(), ele]) ),
                options = Object.keys( map ).sort().map(ele => ({data: ele}));
            let oldVal;
            mw.loader.using( 'oojs-ui-core' ).then(() => {
                const select = new OO.ui.ComboBoxInputWidget({ options,
                    menu: {width: '100%', filterFromInput: true, filterMode: 'substring'} }).on('change', () => {
                    $(map[ oldVal ]).hide(); // $(undefined).hide()不会报错
                    oldVal = select.getValue();
                    $(map[ oldVal ]).show();
                });
                select.$element.attr('lang', 'ja').prependTo( this )
                    .append( $('<i>', {class: 'fas fa-backspace'}).click(() => { select.setValue(''); }) );
            });
        });
    },
        handler = () => {
        mw.widget = mw.widget || {};
        if (mw.widget.asSong) { return; }
        mw.hook( 'wikipage.content' ).add(main);
        mw.widget.asSong = true;
    };
    if (window.jQuery) { handler(); }
    else { window.addEventListener('jquery', handler); }
}) ();
