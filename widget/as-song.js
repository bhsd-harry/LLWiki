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
        $container.each(async function() {
            const nodes = [...$(this).find( '.as-song' )],
                buildMap = (selector) =>
                Object.fromEntries( nodes.map(ele => [$(ele).find( selector ).text(), ele]).filter(([ele]) => ele) ),
                mapJa = buildMap( 'big' ),
                mapZh = buildMap( '.zh' ),
                mapEn = buildMap( '.en' );
            let oldVal;
            await mw.loader.using( 'oojs-ui-core' );
            const buildOptions = (map) =>
                Object.keys( map ).sort().map(ele => new OO.ui.MenuOptionWidget({data: ele, label: ele}) ),
                optionsJa = buildOptions( mapJa ),
                optionsZh = buildOptions( mapZh ),
                optionsEn = buildOptions( mapEn ),
                select = new OO.ui.ComboBoxInputWidget({ menu: {items: [
                new OO.ui.MenuSectionOptionWidget({label: '原名'}), ...optionsJa,
                new OO.ui.MenuSectionOptionWidget({label: '中文名'}), ...optionsZh,
                new OO.ui.MenuSectionOptionWidget({label: '英文名'}), ...optionsEn
            ], width: '100%', filterFromInput: true, filterMode: 'substring'} }).on('change', () => {
                $(mapJa[ oldVal ] ?? mapZh[ oldVal ] ?? mapEn[ oldVal ]).hide(); // $(undefined).hide()不会报错
                oldVal = select.getValue();
                $(mapJa[ oldVal ] ?? mapZh[ oldVal ] ?? mapEn[ oldVal ]).show();
            });
            select.$element.prependTo( this )
                .append( $('<i>', {class: 'fas fa-backspace'}).click(() => { select.setValue(''); }) );
            optionsJa.forEach(({$element: $ele}) => { $ele.attr('lang', 'ja'); });
        });
    },
        handler = () => {
        mw.widget = mw.widget ?? {};
        if (mw.widget.asSong) { return; }
        mw.hook( 'wikipage.content' ).add(main);
        mw.widget.asSong = true;
    };
    if (window.jQuery) { handler(); }
    else { window.addEventListener('jquery', handler); }
}) ();
