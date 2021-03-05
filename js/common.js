/**
 * @Description: 桌面版全局JS
 * @Functions: 1. 添加快速重定向功能，取代Wikiplus
 *             2. 重定向时生成气泡提示
 *             3. 编辑页面调整.mw-editTools的位置
 *             4. 编辑页面设置CodeEditor的JSHint
 * @Author: https://llwiki.org/zh/User:Bhsd
 */
// 避免全局变量
"use strict";
/* global wgULS */
// 1. 添加按钮“快速重定向到當前頁面”
if (mw.config.get( 'wgNamespaceNumber' ) >= 0) {
    mw.loader.using( ['mediawiki.api', 'oojs-ui-windows', 'ext.gadget.site-lib'] ).then(function() {
        mw.messages.set({'cm-redirect-prompt': wgULS('请输入重定向页名称:', '請輸入重定向頁名稱:'),
            'cm-redirect': '重定向至此', 'cm-redirect-summary': '快速重定向'});
        const api = new mw.Api();
        $( mw.util.addPortletLink('p-cactions', '#', mw.msg('cm-redirect')) ).click(function(e) {
            e.preventDefault();
            mw.prompt( mw.msg('cm-redirect-prompt'), ['primary', 'progressive'] ).then(function(result) {
                if (!result) { return; } // 这里故意不区分null和空字符串
                // 注意处理一下reject
                mw.safeRedirect(api, result, null, mw.msg('cm-redirect-summary')).catch(function() {});
            });
        });
    });
}
// 2. 重定向气泡提示，预览时不需要重复生成
if (mw.config.get( 'wgRedirectedFrom' )) { mw.notify( $('.mw-redirectedfrom').clone() ); }
if (['edit', 'submit'].includes( mw.config.get('wgAction') )) {
    // 3. 调整.mw-editTools的位置，只能执行一次
    $(function() {
        const $tools = $('.mw-editTools').insertBefore( '#wpTextbox1' );
        // 启用WikiEditor时，需要等待WikiEditor加载完毕
        $('#wpTextbox1').on( 'wikiEditor-toolbar-doneInitialSections', function() {
            // 这个插入位置可以用CSS检查是否是CodeEditor，CodeEditor不可使用快速插入工具
            $tools.insertAfter( '#wikiEditor-ui-toolbar' );
        });
    });
    // 4. 设置CodeEditor的JSHint
    if (mw.config.get( 'wgPageContentModel' ) == 'javascript') {
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
}
