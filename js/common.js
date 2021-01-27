/**
 * @Function: 桌面版全局JS
 * @Author: https://llwiki.org/zh/User:Bhsd
 */
// 避免全局变量
"use strict";
/* global OO, wgULS */
// 设置CodeEditor的JSHint
if (['edit', 'submit'].includes( mw.config.get('wgAction') ) && mw.config.get('wgPageContentModel') == 'javascript') {
    mw.hook( 'codeEditor.configure' ).add(function(session) {
        // LLWiki修复了CodeEditor扩展的后台代码，将codeEditor.configure的时机延后到了CodeEditor完全加载完毕
        console.log('Hook: codeEditor.configure, 开始设置JSHint');
        session.$worker.send('changeOptions', [ $.extend(
            // Widget必须手动设置全局对象mw和$
            mw.config.get( 'wgPageName' ).startsWith( 'User:Bhsd/widget/' ) ? {varstmt: true} :
            {globals: {mw: true}, jquery: true},
            {bitwise: true, curly: true, latedef: 'nofunc', nonew: true, singleGroups: true, unused: true})
        ]);
    });
}
// 快速重定向到當前頁面
if (mw.config.get( 'wgNamespaceNumber' ) >= 0) {
    mw.loader.using( ['mediawiki.api', 'oojs-ui-windows', 'ext.gadget.site-lib'] ).then(function() {
        mw.messages.set({'cm-redirect-prompt': wgULS('请输入重定向页名称', '請輸入重定向頁名稱'), 'cm-redirect': '重定向至此',
            'cm-redirect-summary': '快速重定向'});
        const api = new mw.Api(),
            pagename = mw.config.get( 'wgPageName' );
        $( mw.util.addPortletLink('p-cactions', '#', mw.msg('cm-redirect')) ).click(function(e) {
            e.preventDefault();
            OO.ui.prompt( mw.msg('cm-redirect-prompt'), {actions: [{label: mw.msg('ooui-dialog-message-reject')},
                {label: mw.msg('ooui-dialog-message-accept'), flags: ['primary', 'progressive'], action: 'accept'}]} )
                .then(function(result) {
                if (!result) { return; }
                // 注意处理一下reject
                mw.safeRedirect(api, result, pagename, mw.msg('cm-redirect-summary')).catch(function() {});
            });
        });
    });
}
$(function() {
    // 重定向提示，预览时不需要
    if (mw.config.get( 'wgRedirectedFrom' )) { mw.notify( $('.mw-redirectedfrom').clone() ); }
    // 调整.mw-editTools的位置
    if (!['edit', 'submit'].includes( mw.config.get('wgAction') )) { return; }
    // 启用WikiEditor时，需要等待WikiEditor加载完毕
    mw.loader.using( 'user.options' ).then(function() {
        const $textarea = $('#wpTextbox1');
        if (mw.user.options.get( 'usebetatoolbar' )) {
            $textarea.on( 'wikiEditor-toolbar-doneInitialSections', function() {
                // 这个插入位置可以用CSS检查是否是CodeEditor，CodeEditor不可使用快速插入工具
                $('.mw-editTools').insertAfter( '#wikiEditor-ui-toolbar' );
            });
        } else { $('.mw-editTools').insertBefore( $textarea ); }
    });
});
