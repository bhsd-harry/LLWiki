/**
 * @Description: LLWiki定义的常用函数，桌面版、手机版均可用，部分函数可能需要额外的JS库
 * @Author: 无特殊说明时均为https://llwiki.org/zh/User:Bhsd
 */
"use strict";
/*global OO, wgULS*/
const pagename = mw.config.get('wgPageName'),
    revid = mw.config.get( 'wgRevisionId' ),
    wgUL = mw.config.get( 'wgUserLanguage' ), // 界面语言
    wgUC = mw.config.get( 'wgUserVariant' ); // 内容语言
/**
 * @Function: 根据界面语言或内容语言手动繁简转换
 * @Source: https://zh.moegirl.org.cn/mediawiki:gadget-site-lib.js
 * @Parameter {String} 简体文字内容hans
 * @Parameter {String} 繁体文字内容hant（可选）
 * @Return {String} 转换后的文字
 */
function wgUXS(wg, hans, hant) { return ['zh-hant', 'zh-tw', 'zh-hk', 'zh-mo'].includes(wg) ? hant || hans : hans; }
window.wgULS = function(hans, hant) { return wgUXS(wgUL, hans, hant); };
window.wgUCS = function(hans, hant) { return wgUXS(wgUC == 'zh' ? wgUL : wgUC, hans, hant); };
mw.messages.set( wgULS({
    'gadget-lib-fail': '无法获得$1！错误信息：$2', 'gadget-lib-force': '获取历史版本的段落Wikitext必需force参数！',
    'gadget-lib-page': '页面', 'gadget-lib-latest': '最新修订',
    'gadget-lib-conflict1': '编辑冲突！编辑内容已自动备份，请刷新页面后加载备份并重试。',
    'gadget-lib-conflict2': '编辑冲突！请备份您的编辑内容后刷新页面重试。',
    'gadget-lib-editFail': '编辑失败！错误信息：$1', 'gadget-lib-exist': '页面是否存在',
    'gadget-lib-createSuccess': '创建成功！', 'gadget-lib-createFail': '创建失败！错误原因：$1'
}, {
    'gadget-lib-fail': '無法獲得$1！錯誤信息：$2', 'gadget-lib-force': '獲取歷史版本的段落Wikitext必需force參數！',
    'gadget-lib-page': '頁面', 'gadget-lib-latest': '最新修訂',
    'gadget-lib-conflict1': '編輯衝突！編輯內容已自動備份，請刷新頁面後加載備份並重試。',
    'gadget-lib-conflict2': '編輯衝突！請備份您的編輯內容後刷新頁面重試。',
    'gadget-lib-editFail': '編輯失敗！錯誤信息：$1', 'gadget-lib-exist': '頁面是否存在',
    'gadget-lib-createSuccess': '創建成功！', 'gadget-lib-createFail': '創建失敗！錯誤原因：$1'
}) );
/**
 * @Function: 当前页面标题转义
 * @Dependencies: mediawiki.util
 * @Return {String} 转义后的标题
 */
mw.pagenamee = function() { return mw.util.wikiUrlencode( pagename ); };
/**
 * @Function: 添加手机版菜单项
 * @Parameter {Array} 形如{icon, text, href}或{icon, msg, href}的对象数组
 * @Parameter {String} FontAwesome图标名称icon
 * @Parameter {String} 文字text（需手动繁简转换）
 * @Parameter {String} mw.messages的键值msg
 * @Parameter {String} 目标地址href
 * @Return {Array} 一组<li>元素
 */
mw.addMobileLinks = function(links) {
    return links.map(function(ele) {
        return $('<a>', {href: ele.href, html: [ $('<i>', {class: "fa fa-" + (ele.icon || 'arrow-circle-right')}),
             $('<span>', {text: ele.text || mw.msg( ele.msg )})
        ]}).wrap( '<li>' ).parent();
    });
};
/**
 * @Function: API请求失败时通知错误信息
 * @Parameter {String} API返回的错误信息reason
 * @Parameter {String} API请求的内容topic（需手动繁简转换）
 */
mw.apiFailure = function(reason, topic) {
    mw.notify( mw.msg('gadget-lib-fail', topic, reason), {type: 'error', autoHideSeconds: 'long', tag: 'apiFailure'} );
};
/**
 * @Function: 提交一个API查询请求并计时，以方便评估表现
 * @Dependencies: mediawiki.api
 * @Parameter {Api} mw.Api对象api
 * @Parameter {Object} API参数对象params
 * @Parameter {String} API请求内容topic（需手动繁简转换）
 * @Return {Promise} Promise对象，且在请求成功时记录用时，失败时通知错误信息
 */
mw.timedQuery = function(api, params, topic) {
    console.log('API request: 查询' + topic);
    const now = mw.now();
    return api.get( $.extend({action: 'query', formatversion: 2}, params) ).then(function(data) {
        console.log('End API request: 已获得' + topic + '，用时 ' + (mw.now() - now) + ' ms');
        return data;
    }, function(reason) {
        mw.apiFailure(reason, topic);
        throw reason;
    });
};
/**
 * @Function: 類似mw.timedQuery，但改用POST，適合用於預覽
 * @Dependencies: mediawiki.api
 * @Parameter {Api} mw.Api对象api
 * @Parameter {Object} API参数对象params
 * @Parameter {String} API请求内容topic（需手动繁简转换）
 * @Return {Promise} Promise对象，且在请求成功时记录用时，失败时通知错误信息
 */
mw.timedParse = function(api, params, topic) {
    console.log('API request: 解析' + topic);
    const now = mw.now();
    return api.post( $.extend({action: 'parse', prop: 'text', disablelimitreport: 1, disableeditsection: 1,
        title: pagename, pst: 1, formatversion: 2}, params) ).then(function(data) {
        console.log('End API request: 已获得' + topic + '，用时 ' + (mw.now() - now) + ' ms');
        return data;
    }, function(reason) {
        mw.apiFailure(reason, topic);
        throw reason;
    });
};
/**
 * @Function: 提交一个标准API请求以获得当前版本的Wikitext，这是在多个小工具中广泛使用的请求
 * @Dependencies: mediawiki.api
 * @Parameter {Api} mw.Api对象api
 * @Return {Promise} Promise对象，且在请求成功时记录用时，失败时通知错误信息
 */
mw.standardQuery = function(api) {
    mw.request = mw.request || mw.timedQuery(api, {revids: revid, prop: 'revisions', rvprop: 'content'},
        mw.msg('gadget-lib-page') + 'Wikitext');
    return mw.request;
};
/**
 * @Function: 提交一个标准API请求以获得当前版本的段落Wikitext，一般不可用于历史版本
 * @Dependencies: mediawiki.api
 * @Parameter {Api} mw.Api对象api
 * @Parameter {Number} 段落编号section
 * @Parameter {Boolean} 强制历史版本force（可选）
 * @Return {Promise} Promise对象，且在请求成功时记录用时，失败时通知错误信息
 */
mw.sectionQuery = function(api, section, force) {
    if (!force && revid < mw.config.get('wgCurRevisionId')) {
        mw.notify( mw.msg('gadget-lib-force'), {type: 'warn', autoHideSeconds: 'long', tag: 'historySection'});
        return Promise.reject( 'historySection' );
    }
    mw.sections = mw.sections || [];
    mw.sections[section] = mw.sections[section] || mw.timedQuery(api, {action: 'parse', oldid: revid,
        prop: 'wikitext|sections', section: section}, '段落Wikitext');
    return mw.sections[section];
};
/**
 * @Function: 检查编辑冲突后提交编辑
 * @Dependencies: mediawiki.api
 * @Parameter {Api} mw.Api对象api
 * @Parameter {Number} 最新修订编号curRevid
 * @Parameter {Object} API参数对象params
 * @Parameter {Boolean} 是否启用自动备份flag（可选）
 * @Return {Promise} Promise对象，API请求失败时抛出revisionQueryFailure或editFailure，编辑冲突时抛出editConflict
 */
mw.safeEdit = function(api, curRevid, params, flag) {
    return mw.timedQuery(api, {prop: 'info', titles: params.title, pageids: params.pageid},
        mw.msg('gadget-lib-latest')).then(function(data) {
        // 未创建的页面lastrevid返回undefined，因此下式同样为false
        if (data.query.pages[0].lastrevid > curRevid) {
            mw.notify( mw.msg('gadget-lib-conflict' + (flag + 1)),
                {type: 'error', autoHideSeconds: 'long', tag: 'editConflict'} );
            throw 'editConflict';
        }
        console.log('API request: 开始提交编辑');
        const now = mw.now();
        return api.postWithEditToken( $.extend({action: 'edit'}, params) ).then(function() {
            console.log('End API request: 编辑成功！用时 ' + (mw.now() - now) + ' ms');
        }, function(reason) {
            mw.notify( mw.msg('gadget-lib-editFail', reason),
                {type: 'error', autoHideSeconds: 'long', tag: 'apiFailure'} );
            throw 'editFailure';
        });
    }, function() { throw 'revisionQueryFailure'; }); // mw.timedQuery已通知错误信息
};
/**
 * @Function: 检查页面是否存在后新建重定向
 * @Dependencies: mediawiki.api, mediawiki.util
 * @Parameter {Api} mw.Api对象api
 * @Parameter {String} 重定向页标题title
 * @Parameter {String} 重定向目标target
 * @Parameter {String} 编辑摘要summary（可选）
 * @Return {Promise} Promise对象，API请求失败时抛出queryFailure或createFailure，页面已存在时抛出pageExists
 */
mw.safeRedirect = function(api, title, target, summary) {
    return mw.timedQuery(api, {titles: title, converttitles: 1}, mw.msg('gadget-lib-exist')).then(function(x) {
        const converted = x.query.pages[0],
            ctitle = converted.title;
        if (!converted.missing) {
            mw.notify([
                mw.msg('gadget-lib-page'),
                // 这个href会出现在地址栏，因此手动填入短地址'/zh'而非使用mw.util.getUrl
                $('<a>', {text: ctitle, href: '/zh?redirect=no&title=' + mw.util.wikiUrlencode( ctitle )}),
                '已存在！'
            ], {type: 'error', autoHideSeconds: 'long'});
            throw 'pageExists';
        }
        console.log('API request: 开始新建重定向');
        const now = mw.now();
        api.create(title, summary ? {summary: summary} : {}, '#重定向 [[' + target + ']]').then(function() {
            console.log('End API request: 成功新建重定向，用时 ' + (mw.now() - now) + ' ms');
            mw.notify( mw.msg('gadget-lib-createSuccess'), {type: 'success'} );
        }, function(reason) {
            mw.notify( mw.msg('gadget-lib-createFail', reason),
                {type: 'error', autoHideSeconds: 'long', tag: 'apiFailure'} );
            throw 'createFailure';
        });
    }, function() { throw 'queryFailure'; }); // mw.timedQuery已通知错误信息
};
/**
 * @Function: 生成标准化的确认对话框
 * @Dependencies: oojs-ui-core, oojs-ui-windows
 * @Parameter {String} 文字提示text
 * @Parameter {Array} 确认按钮样式flags
 * @Return {Promise} Promise对象
 */
mw.confirm = function(text, flags) {
    return OO.ui.confirm(text, {actions: [{label: "否"}, {label: "是", flags: flags, action: 'accept'}]});    
};
/**
 * @Function: 生成标准化的对话框
 * @Dependencies: oojs-ui-core, oojs-ui-windows
 * @Parameter {MessageDialog} OO.ui.MessageDialog对象dialog
 * @Parameter {Array} 按钮actions
 * @Parameter {jQuery} 文字$message
 * @Parameter {jQuery} 标题$title（可选）
 * @Return {Promise} Promise对象
 */
mw.dialog = function(dialog, actions, $message, $title) {
    if (!mw.windowManager) {
        mw.windowManager = new OO.ui.WindowManager();
        mw.windowManager.$element.appendTo( 'body' );
    }
    if (!dialog.getManager()) { mw.windowManager.addWindows( [dialog] ); }
    dialog.message.$label.html( $message ); // undefined不更新message
    dialog.title.$label.html( $title ); // undefined不更新title
    return dialog.open({actions: actions}).opening.then(function() {
        // 使href生效
        dialog.attachedActions.forEach(function(ele) {
            ele.$button.off( 'click' ).click(function() { dialog.close(); });
        });
    });
};
/**
 * @Function: 生成兼容手机版的tooltip
 * @Dependencies: oojs-ui-core
 * @Parameter {jQuery} 容器$container
 * @Parameter {String} 目标选择器target
 * @Parameter {Object} 参数params（可选)
 * @Parameter {jQuery} 标签对象$content（可选）
 */
mw.tipsy = function($container, target, params, $content) {
    const $label = $('<span>'),
        // 这里不用PopupWidget自带的autoClose功能，因为效果很奇怪
        popup = new OO.ui.PopupWidget( $.extend({$content: $content || $label, padded: true, width: null}, params) );
    if ($content) { $content.append( $label ); } // 没有title时，$label没有效果
    popup.$element.appendTo( 'body' );
    $container.on('mouseenter focus', target, function() {
        const $this = $(this);
        var title = this.title;
        // 不能寫成$this.data('title', title)
        if (title) { $this.attr('data-title', title).removeAttr( 'title' ); }
        else { title = $this.data('title'); }
        if (!title) { return; }
        // 不能写成this.tabIndex = -1
        if (this.tabIndex === undefined) { $this.attr('tabindex', -1); }
        $label.text(title);
        popup.toggle( true ).setFloatableContainer( $this );
    }).on('mouseleave blur', target, function() { popup.toggle( false ); });
};
