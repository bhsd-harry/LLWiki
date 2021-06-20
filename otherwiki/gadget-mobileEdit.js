/**
 * @Function: 手机版打开普通编辑界面
 * @Dependencies: mediawiki.util
 * @Author: https://llwiki.org/zh/User:Bhsd
 */
"use strict";
/* global mw, $ */
$(() => { // Ajax小工具一般不会生成新的.edit-page，所以只需执行一次
    const id = mw.config.get( 'wgRevisionId' ),
        oldid = mw.config.get( 'wgCurRevisionId' ) == id ? undefined : id;
    if (['edit', 'submit'].includes( mw.config.get( 'wgAction' ) )) {
        mw.loader.addStyleTag( '.mw-editform span.cancelLink { display: inline-block; }' );
        $('#mw-editform-cancel').toggleClass( 'oo-ui-buttonElement-frameless oo-ui-buttonElement-framed' );
    }
    if (mw.config.get( 'wgIsArticle' ) === 0) { return; }
    $('.talk').off( 'click' ).click(e => { e.stopImmediatePropagation(); });
    // 不能用startsWith，因为data-section可能未定义
    $('.edit-page').filter(function() { return /^T-/.test( this.dataset.section ); }).remove();
    // 这里希望在MobileFrontEnd的JS加载之前执行，但如果晚了也没问题
    $('.edit-page').off( 'click' ).click(function(e) {
        e.stopImmediatePropagation();
        location.href = this.href;
    });
    $('#mw-mf-viewport')[0].addEventListener('click', e => {
        const $target = $(e.target);
        if ($target.parent().attr( 'id' ) != 'ca-edit') { return; }
        e.stopPropagation();
        $target.removeAttr( 'href' );
        location.href = mw.util.getUrl(null, $.extend({action: 'edit'}, {oldid}));
    }, true);
});