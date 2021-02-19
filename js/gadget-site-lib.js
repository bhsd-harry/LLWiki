/**
 * @Description: LLWiki定义的常用函数，桌面版、手机版均可用，部分函数可能需要额外的JS库
 * @Functions: 1. 繁简转换函数（wgULS, wgUCS）
 *             2. 杂项（pagenamee, addMobileLinks, isModule, apiFailure）
 *             3. API标准方法（timedQuery, timedParse, standardQuery, sectionQuery, safeEdit, safeRedirect）
 *             4. OOUI标准方法（confirm, prompt, dialog, tipsy, menu）
 *             5. moment标准方法（convertTimezone）
 * @Document: https://llwiki.org/zh/LLWiki:管理员技术手册
 * @Author: 无特殊说明时均为https://llwiki.org/zh/User:Bhsd
 */
"use strict";
/*global OO, moment, wgULS*/
// 用于触发依赖jQuery的小部件，请勿改动
window.dispatchEvent( new Event('jquery') );
const pagename = mw.config.get('wgPageName'),
    revid = mw.config.get( 'wgRevisionId' ),
    cid = mw.config.get( 'wgCurRevisionId' ),
    wgUL = mw.config.get( 'wgUserLanguage' ), // 界面语言
    wgUC = mw.config.get( 'wgUserVariant' ); // 内容语言
/**
 * @Function: 根据界面语言或内容语言手动繁简转换，一般结合mw.messages使用，见本页使用例
 * @Source: https://zh.moegirl.org.cn/mediawiki:gadget-site-lib.js
 * @Param {String} hans, 简体文字内容
 * @Param {String} hant, 繁体文字内容（可选）
 * @Return {String} 转换后的文字
 */
function wgUXS(wg, hans, hant) { return ['zh-hant', 'zh-tw', 'zh-hk', 'zh-mo'].includes(wg) ? hant || hans : hans; }
window.wgULS = function(hans, hant) { return wgUXS(wgUL, hans, hant); };
window.wgUCS = function(hans, hant) { return wgUXS(wgUC == 'zh' ? wgUL : wgUC, hans, hant); };
mw.messages.set( wgULS({
    'gadget-lib-fail': '无法获得$1！错误信息：$2', 'gadget-lib-force': '获取历史版本的段落Wikitext必需force参数！',
    'gadget-lib-page': '页面', 'gadget-lib-latest': '最新修订', 'gadget-lib-createFail': '创建失败！错误原因：$1',
    'gadget-lib-conflict1': '编辑冲突！编辑内容已自动备份，请刷新页面后加载备份并重试。', 'gadget-lib-exist': '页面是否存在',
    'gadget-lib-conflict2': '编辑冲突！请备份您的编辑内容后刷新页面重试。', 'gadget-lib-createSuccess': '创建成功！',
    'gadget-lib-editFail': '编辑失败！错误信息：$1'
}, {
    'gadget-lib-fail': '無法獲得$1！錯誤信息：$2', 'gadget-lib-force': '獲取歷史版本的段落Wikitext必需force參數！',
    'gadget-lib-page': '頁面', 'gadget-lib-latest': '最新修訂', 'gadget-lib-createFail': '創建失敗！錯誤原因：$1',
    'gadget-lib-conflict1': '編輯衝突！編輯內容已自動備份，請刷新頁面後加載備份並重試。', 'gadget-lib-exist': '頁面是否存在',
    'gadget-lib-conflict2': '編輯衝突！請備份您的編輯內容後刷新頁面重試。', 'gadget-lib-createSuccess': '創建成功！',
    'gadget-lib-editFail': '編輯失敗！錯誤信息：$1'
}) );
/**
 * @Function: 当前页面标题转义
 * @Dependencies: mediawiki.util
 * @Return {String} 转义后的标题
 */
mw.pagenamee = function() { return mw.util.wikiUrlencode( pagename ); };
/**
 * @Function: 添加手机版菜单项
 * @Param {Object[]} link, 形如{icon, text, href, attr}或{icon, msg, href, attr}的对象
 * @Param {String} icon, FontAwesome图标名称（仅限fas类，默认为arrow-circle-right）
 * @Param {String} text, 文字（需手动繁简转换，优先级低于msg）
 * @Param {String} msg, mw.messages的键值
 * @Param {String} href, 目标地址（可选）
 * @Param {Object} attr, 外层<li>元素的属性（可选）
 * @Return {HTMLLIElement[]} 一组<li>元素
 */
const mobileLink = function(ele) {
    return $('<a>', {href: ele.href, html: [ $('<i>', {class: "fa fa-" + (ele.icon || 'arrow-circle-right')}),
         $('<span>', {text: ele.msg ? mw.msg( ele.msg ) : ele.text})
    ]}).wrap( '<li>' ).parent().attr( ele.attr || {} )[0];
};
mw.addMobileLinks = function(link) { return Array.isArray( link ) ? link.map( mobileLink ) : mobileLink( link ); };
/**
 * @Function: 检查一个模块是否加载
 * @Param {String} name, 模块或小工具名称
 * @Param {Boolean} flag, 是否是小工具
 * @Return {Boolean}
 */
mw.isModule = function(name, flag) {
    const fullname = (flag ? 'ext.gadget.' : '') + name;
    return ['loading', 'loaded', 'executing', 'ready'].includes( mw.loader.getState( fullname ) );
};
/**
 * @Function: API请求失败时通知错误信息
 * @Param {String} reason, API返回的错误信息
 * @Param {String} topic, API请求的内容（需手动繁简转换）
 */
mw.apiFailure = function(reason, topic) {
    mw.notify( mw.msg('gadget-lib-fail', topic, reason), {type: 'error', autoHideSeconds: 'long', tag: 'apiFailure'} );
};
/**
 * @Function: 提交一个API查询请求并计时，以方便评估表现
 * @Dependencies: mediawiki.api
 * @Param {mw.Api} api, mw.Api对象
 * @Param {Object} params, API参数对象
 * @Param {String} topic, API请求内容（需手动繁简转换）
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
 * @Param {mw.Api} api, mw.Api对象
 * @Param {Object} params, API参数对象（默认为当前页面）
 * @Param {String} topic, API请求内容（需手动繁简转换）
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
 * @Param {mw.Api} api, mw.Api对象
 * @Return {Promise} 全局Promise对象mw.request，且在请求成功时记录用时，失败时通知错误信息
 */
mw.standardQuery = function(api) {
    mw.request = mw.request || mw.timedQuery(api, {revids: revid, prop: 'revisions', rvprop: 'content'},
        mw.msg('gadget-lib-page') + 'Wikitext');
    return mw.request;
};
/**
 * @Function: 提交一个标准API请求以获得当前版本的段落Wikitext，一般不可用于历史版本
 * @Dependencies: mediawiki.api
 * @Param {mw.Api} api, mw.Api对象
 * @Param {Number} section, 段落编号（默认为序言）
 * @Param {Boolean} force, 强制历史版本（可选）
 * @Return {Promise} 全局Promise对象mw.sections[]，且在请求成功时记录用时，失败时通知错误信息
 */
mw.sectionQuery = function(api, section, force) {
    if (!force && revid < cid) {
        mw.notify( mw.msg('gadget-lib-force'), {type: 'warn', autoHideSeconds: 'long', tag: 'historySection'});
        return Promise.reject( 'historySection' );
    }
    section = section || 0;
    mw.sections = mw.sections || [];
    mw.sections[section] = mw.sections[section] || mw.timedQuery(api, {action: 'parse', oldid: revid,
        prop: 'wikitext|sections', section: section}, '段落Wikitext');
    return mw.sections[section];
};
/**
 * @Function: 检查编辑冲突后提交编辑
 * @Dependencies: mediawiki.api
 * @Param {mw.Api} api, mw.Api对象
 * @Param {Number} curRevid, 最新修订编号（默认为当前页面）
 * @Param {Object} params, API参数对象
 * @Param {Boolean} flag, 是否启用自动备份（可选，只会影响错误信息）
 * @Return {Promise} Promise对象，API请求失败时抛出revisionQueryFailure或editFailure，编辑冲突时抛出editConflict
 */
mw.safeEdit = function(api, curRevid, params, flag) {
    return mw.timedQuery(api, {prop: 'info', titles: params.title, pageids: params.pageid},
        mw.msg('gadget-lib-latest')).then(function(data) {
        // 未创建的页面lastrevid返回undefined，因此下式同样为false
        if (data.query.pages[0].lastrevid > (curRevid || cid)) {
            mw.notify( mw.msg('gadget-lib-conflict' + (flag ? 2 : 1)),
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
 * @Dependencies: mediawiki.api
 * @Param {mw.Api} api, mw.Api对象
 * @Param {String} title, 重定向页标题
 * @Param {String} target, 重定向目标（默认为当前页面）
 * @Param {String} summary, 编辑摘要（可选）
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
        api.create(title, {summary: summary}, '#重定向 [[' + (target || pagename) + ']]').then(function() {
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
 * @Dependencies: oojs-ui-windows
 * @Param {String} text, 文字提示
 * @Param {String[]} flags, 确认按钮样式（可选）
 * @Return {Promise} Promise对象
 */
mw.confirm = function(text, flags) {
    return OO.ui.confirm(text, {actions: [{label: "否"}, {label: "是", flags: flags, action: 'accept'}]});    
};
/**
 * @Function: 生成标准化的prompt对话框
 * @Dependencies: oojs-ui-windows
 * @Param {String} text, 文字提示
 * @Param {String[]} flags, 确认按钮样式（可选）
 * @Param {Object} config, 文本框设置（可选）
 * @Return {Promise} Promise对象
 */
mw.prompt = function(text, flags, config) {
    return OO.ui.prompt(text, {actions: [ {label: mw.msg('ooui-dialog-message-reject')},
        {label: mw.msg('ooui-dialog-message-accept'), flags: flags, action: 'accept'} ], textInput: config});    
};
/**
 * @Function: 生成标准化的对话框
 * @Dependencies: oojs-ui-windows
 * @Param {OO.ui.MessageDialog} dialog, OO.ui.MessageDialog对象dialog
 * @Param {Object[]} actions, 按钮
 * @Param {jQuery} $message, 文字（可选）
 * @Param {jQuery} $title, 标题（可选）
 * @Return {Promise} Promise对象
 */
mw.dialog = function(dialog, actions, $message, $title) {
    // 一个WindowManager只能打开一个MessageDialog
    if (!dialog.getManager()) {
        const manager = new OO.ui.WindowManager();
        manager.$element.appendTo( document.body );
        manager.addWindows( [dialog] );
    }
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
 * @Param {jQuery} $container, 容器
 * @Param {String} target, 目标选择器（可选）
 * @Param {Object} params, 参数（可选）
 * @Param {jQuery} $content, 标签对象（可选）
 */
mw.tipsy = function($container, target, params, $content) {
    const $label = $('<span>'),
        // 这里不用PopupWidget自带的autoClose功能，因为效果很奇怪；默认样式见mediawiki:gadget-site-styles.css
        popup = new OO.ui.PopupWidget( $.extend({$content: $content ? $content.append( $label ) : $label,
        padded: true, width: null, classes: ['mw-tipsy']}, params) );
    popup.$element.appendTo( document.body );
    // jQuery的mouseenter和mouseleave实际上是mouseover和mouseout
    // 手机浏览器支持见https://patrickhlauke.github.io/touch/tests/results/
    // $container不能是body，否则iOS无效（https://www.quirksmode.org/blog/archives/2014/02/mouse_event_bub.html）
    $container.on('mouseenter', target, function() {
        const $this = $(this);
        var title = this.title;
        // 不能寫成$this.data('title', title)
        if (title) { $this.attr('data-title', title).removeAttr( 'title' ); }
        else { title = $this.data('title') || ''; }
        $label.text( title );
        popup.toggle( true ).setFloatableContainer( $this );
    }).on('mouseleave', target, function() { popup.toggle( false ); });
};
/**
 * @Function: 生成一个仿OOUI样式的下拉菜单
 * @Dependencies: ext.gadget.site-styles
 * @Param {Object[]} options, 形如{text, msg, icon, href, target, click}的菜单项
 * @Param {Object} attr, 菜单外层容器属性
 * @Return {jQuery} 菜单外层容器
 */
mw.menu = function(options, attr) {
    const hasIcon = options.some(function(ele) { return ele.icon; });
    return $('<div>', $.extend({html: options.map(function(ele) {
        return $('<a>', {href: ele.href, target: ele.target, html: [
            hasIcon ? $('<i>', {class: 'fa' + (ele.icon ? 'fa-' + ele.icon : '')}) : null,
            ele.msg ? mw.msg( ele.msg ) : ele.text
        ]}).click( ele.click );
    }), class: 'site-menu', tabindex: -1}, attr)).extend({open: function() { this.slideDown( 'fast' ).focus(); }})
        .blur(function() { $(this).slideUp( 'fast' ); })
        .on('click', 'a', function(e) { $(e.delegateTarget).slideUp( 'fast' ); });
};
/**
 * @Function: 更改moment对象的时区
 * @Dependencies: moment
 * @Param {moment} then, 原始moment对象（默认为现在）
 * @Param {String} timeZone, 符合IANA标准的时区名称（不检查合法性）或UTC偏移量（默认为本地）
 * @Return {moment} 更改时区后的moment对象。注意这不是一个真实存在的时间，只能用于输出，不能用于进一步计算。
 * @Return {String} 以en-us记法表示的时区或UTC偏移量
 */
mw.convertTimezone = function(then, timezone) {
    if (timezone === '' || timezone === null) { timezone = undefined; } // 防止isNaN返回false
    then = then || moment();
    if (isNaN( timezone )) { // 时区名称
        const date = new Date(then);
        return [ timezone ? moment( date.toLocaleString('ia', {timeZone: timezone} ), 'DD-MM-YYYY HH:mm') : then,
            date.toLocaleString('en-us', {timeZone: timezone, year: '2-digit', timeZoneName: 'short'}).slice(4) ];
    } else { // UTC偏移量
        return [ moment.utc( then ).add(timezone, 'hour'),
            'UTC' + (timezone == '0' ? '' : (timezone > 0 ? '+' : '') + timezone)];
    }
};
