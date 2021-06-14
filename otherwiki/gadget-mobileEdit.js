/**
 * @Function: 手机版打开普通编辑界面
 * @Dependencies: mediawiki.util, ext.gadget.site-lib
 * @Author: https://llwiki.org/zh/User:Bhsd
 */
"use strict";
$(() => { // Ajax小工具一般不会生成新的.edit-page，所以只需执行一次
    const id = mw.config.get( 'wgRevisionId' ),
        cid = mw.config.get( 'wgCurRevisionId' );
    if (['edit', 'submit'].includes( mw.config.get( 'wgAction' ) )) {
        mw.loader.addStyleTag( '.mw-editform span.cancelLink { display: inline-block; }' );
    }
    if (mw.config.get( 'wgIsArticle' ) === 0) { return; }
    // 不能用startsWith，因为data-section可能未定义
    $('a.edit-page').filter(function() { return /^T-/.test( this.dataset.section ); }).remove();
    // 这里希望在MobileFrontEnd的JS加载之前执行，但如果晚了也没问题
    $('a.edit-page, #ca-edit > a').off( 'click' ).click(function(e) {
        e.stopImmediatePropagation();
        location.href = mw.util.getUrl(null, $.extend( {}, // 移除无效的query parameter
            {action: 'submit', oldid: id == cid ? undefined : id, section: this.dataset.section}
        ));
    }).removeAttr( 'href' );
});
