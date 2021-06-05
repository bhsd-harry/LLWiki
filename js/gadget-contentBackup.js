/**
 * @Function: 点击“提交编辑、显示预览、显示更改”中任意一个按钮，或在编辑页面每隔一段时间自动备份当前的编辑。备份会保存一段时间后自动清除。支持Wikiplus、代码编辑器和MobileFrontEnd的Ajax编辑器。
 * @Dependencies: ext.gadget.SettingsDialog, localforage
 * @Source: https://zh.moegirl.org.cn/User:东东君/js/contentBackup.js
 * @EditedBy: https://llwiki.org/zh/User:Bhsd
 */
"use strict";
/* global OO, wgULS, localforage */
mw.gadgets = mw.gadgets || {};
mw.gadgets.contentBackup = $.extend( mw.storage.getObject( 'gadget-contentBackup' ), mw.gadgets.contentBackup );
const action = mw.config.get( 'wgAction' ),
    isEditable = mw.config.get( 'wgIsProbablyEditable' ),
    skin = mw.config.get( 'skin' ),
    isMobile = action == 'view' && skin == 'minerva' && mw.config.get( 'wgPageContentModel' ) == 'wikitext',
    isWikiplus = action == 'view' && (mw.isModule('Wikiplus', true) || mw.isModule('mobile-Wikiplus', true)),
    settings = mw.gadgets.contentBackup; // 这已经是个Object了
settings.range = settings.range || ['vector']; // 默认只用于桌面版
if (isEditable && settings.range.includes( skin ) && (['edit', 'submit'].includes(action) || isWikiplus || isMobile)) {
    var codeEditor, // 实时更新的Ace Editor Session
        btn, // 需要等待localforage才能移除disabled
        backup = '', // 因为localforage提取backup是个Promise，这里先初始化
        expList = mw.storage.getObject( 'LLWiki-contentBackup-exp' ) || {}; // 单独存储备份过期时间，这是个Object
    const id = mw.config.get( 'wgArticleId' ), // 所有新建页面共用备份
        btns = '#wpSaveWidget, #wpPreviewWidget, #wpDiffWidget, #wpTemplateSandboxPreview', // MW原生编辑页面
        editor = '#wpTextbox1, #Wikiplus-Quickedit, #wikitext-editor'; // 部分编辑器需动态生成，所以这里只保存选择器
    // 1. 设置本地化消息
    mw.messages.set( wgULS({
        'gadget-cb-label': '编辑内容自动备份', 'gadget-cb-range': '使用范围', 'gadget-cb-d': '桌面版',
        'gadget-cb-m': '手机版', 'gadget-cb-rhelp': '可用于代码编辑器和Wikiplus小工具。',
        'gadget-cb-exp': '备份有效期（小时）', 'gadget-cb-stay': '自动备份间隔（分）', 'gadget-cb-text': '还原备份',
        'gadget-cb-shelp': "仅用于原生编辑页面。值为'0'时不会自动更新备份，变动后需刷新页面才会生效。"
    }, {
        'gadget-cb-label': '編輯內容自動備份', 'gadget-cb-range': '使用範圍', 'gadget-cb-d': '桌面版',
        'gadget-cb-m': '手機版', 'gadget-cb-rhelp': '可用於代碼編輯器和Wikiplus小工具。',
        'gadget-cb-exp': '備份有效期（小時）', 'gadget-cb-stay': '自動備份間隔（分）', 'gadget-cb-text': '還原備份',
        'gadget-cb-shelp': "僅用於原生編輯頁面。值為'0'時不會自動更新備份，變動後需重新整理頁面才會生效。"
    }) );
    // 2. 小工具设置
    settings.exp = settings.exp || 12; // 默认备份保存12小时
    settings.stay = settings.stay || 30; // 默认每隔30分钟自动更新备份
    mw.settingsDialog.addTab({name: 'contentBackup', label: 'gadget-cb-label', items: [
        {key: 'range', type: 'CheckboxMultiselect', label: 'gadget-cb-range', help: mw.msg( 'gadget-cb-rhelp' ),
            config: {value: settings.range, options: [
                {data: 'vector', label: mw.msg( 'gadget-cb-d' )}, {data: 'minerva', label: mw.msg( 'gadget-cb-m' )}
            ]}
        }, {key: 'stay', type: 'Number', label: 'gadget-cb-stay', help: mw.msg('gadget-cb-shelp'),
            config: {value: settings.stay, min: 0, step: 5}
        }, {key: 'exp', type: 'Number', label: 'gadget-cb-exp', config: {value: settings.exp, min: 1, step: 1}}
    ], help: '编辑内容备份'});
    // 3. 核心函数
    const loadBackup = function() { // 加载备份函数
        // CodeEditor需特殊处理
        if ($( '.codeEditor-ui-toolbar' ).length) { codeEditor.setValue( backup ); }
        else { $(editor).val( backup ); }
        mw.notify('已' + mw.msg('gadget-cb-text') + '！', {type: 'success'});
        update();
    },
        saveBackup = function() { // 保存备份函数
        // CodeEditor需特殊处理
        if ($( '.codeEditor-ui-toolbar' ).length) { backup = codeEditor.getValue(); }
        else { backup = $(editor).val(); }
        expList[id] = mw.now();
        mw.storage.setObject('LLWiki-contentBackup-exp', expList);
        localforage.setItem(id.toString(), backup);
        update();
    },
        stay = settings.stay * 1000 * 60, // 通过设置改动stay时若立即生效会造成bug
        // 自动更新函数，不支持Wikiplus
        update = action == 'view' || stay === 0 ? function() {} : mw.util.debounce(stay, function() {
        saveBackup();
        console.log('备份自动更新于' + new Date().toLocaleTimeString( 'zh' ));
    });

    mw.storage.remove( 'LLWiki-contentBackup' ); // 移除旧版小工具的备份存档
    mw.loader.getScript( 'https://cdn.jsdelivr.net/npm/localforage/dist/localforage.min.js' ).then(function() {
        localforage.config({name: 'LLWiki-contentBackup'});
        // 4. 先更新备份
        const expArray = Object.entries( expList ),
            expired = mw.now() - settings.exp * 1000 * 3600;
        expArray.filter(function(ele) { return ele[1] <= expired; })
            .forEach(function(ele) { localforage.removeItem( ele[0] ); });
        expList = Object.fromEntries( expArray.filter(function(ele) { return ele[1] > expired; }) );
        mw.storage.setObject('LLWiki-contentBackup-exp', expList);
        if (expList[id]) { localforage.getItem(id, function(err, item) {
            backup = item;
            if (btn) { btn.setDisabled( !backup ); }
        }); }
        // 5. 初始化延时保存备份功能
        if (action != 'view' && stay > 0) { update(); } // 不支持Wikiplus
        // 6. 添加备份按钮和按键保存备份功能
        if (action != 'view') {
            btn = new OO.ui.ButtonWidget({label: mw.msg('gadget-cb-text'), disabled: true}).on('click', loadBackup);
            $(function() {
                btn.$element.insertAfter( '#wpDiffWidget' ); // 只添加一次按钮
                // #wpTemplateSandboxPreview可能由小工具生成，这里避免麻烦直接delegate
                $('.editOptions').on('mousedown', btns, function() {
                    saveBackup();
                    btn.setDisabled( !backup );
                });
            });
            return;
        }
        if (isMobile) {
            const $btnPro = $('<button>', {text: mw.msg('gadget-cb-text'), class: 'mw-ui-button'}).click( loadBackup ),
                detectEditor = function(records) {
                const $node = $( records[0].addedNodes[0] );
                if (!$node.hasClass( 'editor-overlay' )) { return; }
                const $btn = $btnPro.clone( true ).prop('disabled', !backup).insertBefore(
                    $node.find( 'button.continue' ).mousedown(function() {
                        saveBackup();
                        $btn.prop('disabled', !backup);
                    }).parent()
                ).wrap( '<div>' );
            },
                observer = new MutationObserver( detectEditor ); // jshint ignore: line
            observer.observe( $('.mw-overlays-container')[0], {childList: true} );
        }
        if (isWikiplus) {
            const $btnPro = $('<button>', {text: mw.msg('gadget-cb-text')}).click( loadBackup );
            mw.hook( 'wikiplus.dialog' ).add(function() { // Wikiplus需动态添加备份按钮
                const $previewBtn = $('#Wikiplus-Quickedit-Preview-Submit');
                if ($previewBtn.next( 'button' ).length) { return; } // 防止按钮已存在
                console.log('Hook: wikiplus.dialog, 开始添加备份按钮');
                const $btn = $btnPro.clone( true ).prop('disabled', !backup).insertAfter( $previewBtn );
                // Wikiplus的上层为body，delegate效率太低
                $('#Wikiplus-Quickedit-Submit, #Wikiplus-Quickedit-Preview-Submit').mousedown(function() {
                    saveBackup();
                    $btn.prop('disabled', !backup);
                });
            });
        }
    }, function() { console.error( '无法获得localforage！' ); });
    // 7. 更新Ace Editor Session
    mw.hook( 'codeEditor.configure' ).add(function(session) {
        console.log('Hook: codeEditor.configure, 更新CodeEditor编辑器');
        codeEditor = session;
    });
}
