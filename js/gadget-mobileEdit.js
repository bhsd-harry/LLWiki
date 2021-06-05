/**
 * @Function: 手机版打开普通编辑界面
 * @Dependencies: mediawiki.util, ext.gadget.site-lib
 * @Author: https://llwiki.org/zh/User:Bhsd
 */
"use strict";
const id = mw.config.get( 'wgRevisionId' ),
    cid = mw.config.get( 'wgCurRevisionId' ),
    isText = mw.config.get( 'wgPageContentModel' ) == 'wikitext';
// 注意不能用常用的#bodyContent；这里涵盖了创建新页面、从移动版差异编辑和模板中常见的编辑链接
$('#content').on('click', 'a.new, .mw-mf-diff-info__link-latest > a, .plainlinks > a.external', function() {
    $(this).attr('href', function(i, attr) { return attr.replace('&action=edit', '&action=submit'); });
});
$(function() { // Ajax小工具一般不会生成新的.edit-page，所以只需执行一次
    if (mw.config.get( 'wgIsArticle' ) === 0) { return; }
    // 不能用startsWith，因为data-section可能未定义
    $( 'a.edit-page' ).filter(function() { return /^T-/.test( this.dataset.section ); }).remove();
    const notTop = mw.isModule( 'notEditTopSection', true );
    // 这里希望在MobileFrontEnd的JS加载之前执行，但如果晚了也没问题
    $( 'a.edit-page' ).off( 'click' ).on('click', function(e) {
        e.stopImmediatePropagation();
        const section = this.dataset.section || (isText && !notTop ? 0 : undefined);
        location.href = mw.util.getUrl(null, $.extend( {}, // 移除无效的query parameter
            {action: 'submit', oldid: id == cid ? undefined : id, section: section}
        ));
    }).removeAttr( 'href' );
});