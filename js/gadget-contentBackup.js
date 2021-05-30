/**
 * @Function: 点击“提交编辑、显示预览、显示更改”中任意一个按钮时备份当前的编辑。备份会保存12小时，12小时后自动清除。
 * @Dependencies: mediawiki.storage, oojs-ui-core, ext.gadget.site-lib
 * @Source: https://zh.moegirl.org.cn/User:东东君/js/contentBackup.js
 * @EditedBy: https://llwiki.org/zh/User:Bhsd
 */
"use strict";
/* global OO, wgULS */
const action = mw.config.get('wgAction'),
    isEditable = mw.config.get( 'wgIsProbablyEditable' ),
    isWikiplus = mw.isModule('Wikiplus', true) || mw.isModule('mobile-Wikiplus', true);
if (isEditable && (["edit", "submit"].includes(action) || action == 'view' && isWikiplus)) {
    mw.messages.set('gadget-cb-text', wgULS("还原备份", "還原備份"));
    var backup, codeEditor, btn;
    const id = mw.config.get('wgArticleId'), // 所有新建页面共用备份
        btns = '#wpSaveWidget, #wpPreviewWidget, #wpDiffWidget, #wpTemplateSandboxPreview,' + // 编辑页面
        '#Wikiplus-Quickedit-Submit, #Wikiplus-Quickedit-Preview-Submit', // Wikiplus
        editor = '#wpTextbox1, #Wikiplus-Quickedit', // Wikiplus编辑区需动态生成，所以这里只保存选择器
        // 先更新备份
        expired = mw.now() - 1000 * 3600 * 12, // 12小时后备份过期
        backupList = (mw.storage.getObject( 'LLWiki-contentBackup' ) || []).filter(function(ele) {
        return ele[1][0] > expired; // 过滤过期备份
    }),
        backupObj = Object.fromEntries( backupList );
    mw.storage.setObject( 'LLWiki-contentBackup', backupList );
    backup = (backupObj[id] || [])[1];
    // 1. 加载备份
    const loadBackup = function() {
        // CodeEditor需特殊处理
        if ($( '.codeEditor-ui-toolbar' ).length) { codeEditor.setValue( backup ); }
        else { $(editor).val( backup ); }
        mw.notify('已' + mw.msg('gadget-cb-text') + '！', {type: 'success'});
    },
        // 保存备份
        saveBackup = function() {
        // CodeEditor需特殊处理
        if ($( '.codeEditor-ui-toolbar' ).length) { backup = codeEditor.getValue(); }
        else { backup = $(editor).val(); }
        backupObj[id] = [mw.now(), backup];
        mw.storage.setObject( 'LLWiki-contentBackup', Object.entries( backupObj ) );
    };
    mw.hook( 'codeEditor.configure' ).add(function(session) { // 更新Ace Editor Session
        console.log('Hook: codeEditor.configure, 更新CodeEditor编辑器');
        codeEditor = session;
    });
    // 2. 添加备份按钮
    if (action == 'view') {
        const $btn = $('<button>', {text: mw.msg('gadget-cb-text')}).click( loadBackup );
        mw.hook( 'wikiplus.dialog' ).add(function() { // Wikiplus需动态添加备份按钮
            const previewBtn = $('#Wikiplus-Quickedit-Preview-Submit');
            if (previewBtn.next( 'button' ).length) { return; } // 防止按钮已存在
            console.log('Hook: wikiplus.dialog, 开始添加备份按钮');
            btn = $btn.clone(true).prop('disabled', !backup).insertAfter( previewBtn );
        });
    }
    else {
        btn = new OO.ui.ButtonWidget({label: mw.msg('gadget-cb-text'), disabled: !backup}).on('click', loadBackup);
        $(function() { btn.$element.insertAfter( '#wpDiffWidget' ); }); // 只添加一次按钮
    }
    // 3. 保存备份
    $(document.body).on('mousedown', btns, function() {
        saveBackup();
        if (action == 'view') { btn.prop('disabled', false); }
        else { btn.setDisabled( false ); }
    });
}
