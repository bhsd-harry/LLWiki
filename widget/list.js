"use strict";
/* global mw, $, OO */
(() => {
    const main = (data) => {
        mw.sifdata = data[0];
        let $output;
        const attr = ['s', 'p', 'c'],
            diff = ['easy', 'normal', 'hard', 'expert', 'exran', 'master'],
            convertTime = (t) => `${ Math.floor(t / 60) }:${ (t % 60).toString().padStart(2, 0) }`,
            buildOptions = (list, key) =>
            list.map(ele => ele[key]).filter(ele => ele)
                .map(ele => new OO.ui.MenuOptionWidget({data: ele, label: ele})),
            change = (value) => {
            const term = mw.sifdata.find(ele => ele.j == value || ele.c == value);
            if (!term) { return; }
            $output.text( `{{sif-song-tablerow|${ term.j }|${ attr[term.a] }|${ convertTime( term.t ) }` +
                term.s.map(ele => {
                    const level = diff[ele.d - 1];
                    return `|d-${ level }=${ ele.s }|c-${ level }=${ ele.c }`;
                }).join( '' ) + '|条件=}}'
            );
        },
            buildSelect = (group) => {
            const list = mw.sifdata.filter(ele => ele.g == group),
                optionsJa = buildOptions(list, 'j'),
                optionsZh = buildOptions(list, 'c'),
                select = new OO.ui.ComboBoxInputWidget({ menu: {items: [
                new OO.ui.MenuSectionOptionWidget({label: '原名'}), ...optionsJa,
                new OO.ui.MenuSectionOptionWidget({label: '中文名'}), ...optionsZh,
            ], width: '100%', filterFromInput: true, filterMode: 'substring'} }).on('change', change);
            optionsJa.forEach(ele => { ele.$element.attr('lang', 'ja'); });
            return select.$element.append( $('<i>', {class: 'fas fa-backspace'}).click(() => { select.setValue(''); }) );
        },
            selectSet = [1, 2, 3, 4].map( buildSelect );
        mw.hook( 'wikipage.content' ).add($content => {
            $output = $content.find( '#sif-song-tablerow' );
            $content.find( 'h3' ).slice(0, 4).after(i => selectSet[i]);
        });
    },
        init = () => {
        mw.widget = mw.widget || {};
        if (mw.widget.list) { return; }
        Promise.all([ $.ajax({ dataType: 'json', cache: true,
            url: '//cdn.jsdelivr.net/gh/bhsd-harry/LLWiki@latest/json/list.json'
        }), mw.loader.using( 'oojs-ui-core' ) ]).then( main );
        mw.widget.list = true;
    };
    if (window.jQuery) { init(); }
    else { window.addEventListener('jquery', init); }
}) ();
