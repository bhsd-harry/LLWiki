/**
 * @Function: 配合jquery.makeCollapsible，进一步隐藏不存在可见标签的dl
 * @Author: https://llwiki.org/zh/User:Bhsd
 */
"use strict";
/* global mw */
(() => {
    const main = ($content) => {
        const $filter = $content.find( '.filter' );
        if ($filter.length === 0) { return; }
        console.log('Hook: wikipage.content, 开始添加年表标签筛选事件');
        const $dl = $content.find('dl:has(.chronology)');
        $filter.click(() => { // 由于jquery.makeCollapsible，不能delegate
            $dl.filter( ':has(dd > :visible)' ).toggle( true );
            $dl.not( ':has(dd > :visible)' ).toggle( false );
        });
    },
        timer = setInterval(() => {
        if (!window.jQuery) { return; }
        clearInterval(timer);
        mw.widget = mw.widget || {};
        if (mw.widget.tagFilter) { return; }
        console.log('End setInterval: jQuery加载完毕，开始执行Widget:年表标签/筛选');
        mw.hook( 'wikipage.content' ).add(main);
        mw.widget.tagFilter = true;
    }, 500);
}) ();
