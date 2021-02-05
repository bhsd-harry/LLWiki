/**
 * @Function: 配合jquery.makeCollapsible，进一步隐藏不存在可见标签的dl
 * @Author: https://llwiki.org/zh/User:Bhsd
 */
"use strict";
/* global mw, $ */
(() => {
    const detectCollapse = (mutations) => {
        mutations.forEach(ele => {
            const $target = $(ele.target);
            if (!$target.is( 'dd > .mw-collapsible' )) { return; }
            const $dl = $target.closest( 'dl' );
            $dl.toggle( $dl.find( 'dd > :not(.mw-collapsed)' ).length > 0 );
        });
    },
        main = () => {
        mw.widget = mw.widget || {};
        if (mw.widget.tagFilter) { return; }
        // 因为dl折叠需要在jquery.makeCollapsible执行完毕之后，这里借助MutationObserver判断正确时机
        const observer = new MutationObserver( detectCollapse );
        observer.observe( document.body, {attributes: true, subtree: true, attributeFilter: ['class']} );
        mw.widget.tagFilter = true;
    };
    if (window.jQuery) { main(); }
    else { window.addEventListener('jquery', main); }
}) ();
