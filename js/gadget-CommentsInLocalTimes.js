/**
 * @Function: 将签名的时间戳替换为本地时间，用户可以自定义时间格式，但需要一定的知识和技术
 * @Dependencies: moment, oojs-ui-core, ext.gadget.site-lib
 * @Source: https://zh.moegirl.org.cn/User:AnnAngela/CommentsInLocalTime.js
 * @OriginalVersion: https://en.wikipedia.org/wiki/User:Mxn/CommentsInLocalTime.js
 * @Author: https://en.wikipedia.org/wiki/User:Mxn
 * @EditedBy: https://zh.moegirl.org.nc/User:AnnAngela、https://llwiki.org/zh/User:Bhsd
 */
"use strict";
/* global moment, wgUCS */
const ns = mw.config.get( 'wgNamespaceNumber' ),
    pagename = mw.config.get( 'wgPageName' ),
    action = mw.config.get('wgAction'),
    gadgets = mw.gadgets || {},
    settings = gadgets.CommentsInLocalTime || {},
    lang = settings.lang, // 提供一套默认的英文设置
    date = lang == 'en' ? 'ddd, ll' : settings.date,
    time = lang == 'en' ? 'LT' : settings.time,
    locale = lang == 'en' ? 'en' : settings.locale || '';
if ( (ns >= 0 && ns % 2 == 1 || pagename == "LLWiki:互助客棧") && ["view", "submit"].includes(action) ) {
    // 用户可以由mw.gadgets.CommentsInLocalTime.i18n自行更改信息文字，未来会由gadget-SettingsDialog提供UI
    mw.messages.set( $.extend( wgUCS(
        {'gadget-lc-error': '错误的签名时间！', 'gadget-lc-m': '$1个月前', 'gadget-lc-tip': "原始时间戳："},
        {'gadget-lc-error': '錯誤的簽名時間！', 'gadget-lc-m': '$1個月前', 'gadget-lc-tip': "原始時間戳："}
    ), {'gadget-lc-y': '$1年前', 'gadget-lc-d': "$1天前", 'gadget-lc-today': '今天', 'gadget-lc-yesterday': '昨天'},
        lang == 'en' ? { 'gadget-lc-today': '[Today]', 'gadget-lc-yesterday': '[Yesterday]',
        'gadget-lc-y': '$1 year{{PLURAL:$1||s}} ago', 'gadget-lc-m': '$1 month{{PLURAL:$1||s}} ago',
        'gadget-lc-d': '$1 day{{PLURAL:$1||s}} ago'
    } : settings.i18n) );
    // 合法的签名时间戳必须以CST为时区
    const regExp = /\d{4}年\d{1,2}月\d{1,2}日\s*(?:[(（]?(?:星期)?[一二三四五六日][)）]?)?\s*(\d\d:\d\d)?\s*[(（]CST[)）]/,
        weekdays = ['日', '一', '二', '三', '四', '五', '六'],
        // 用户可以通过mw.gadgets.CommentsInLocalTime.format自定义日期格式，否则模拟中文格式（用户可能未安装）
        format = function(then, now) {
        const year = now.diff(then, 'year'),
            month = year ? null : now.diff(then, 'month'),
            day = year || month ? null : now.diff(then, 'day');
        return (date || 'YYYY年M月D日 星期' + weekdays[ then.day() ]) + ' ([' +
            (year ? mw.msg('gadget-lc-y', year) : month ? mw.msg('gadget-lc-m', month) : mw.msg('gadget-lc-d', day)) +
            '])';
    },
        display = function(then, withTime, now) { // 不使用moment.js自带的模糊时间方法fromNow
        const utc = then.utcOffset() / 60,
            // 这个参数对象依赖于then和now
            params = { sameDay: mw.msg('gadget-lc-today'), lastDay: mw.msg('gadget-lc-yesterday'),
            lastWeek: format(then, now), sameElse: format(then, now)
        };
        if (withTime) { $.each(params, function(key) { params[key] += ' ' + (time || 'HH:mm'); }); }
        return then.locale( locale ).calendar(null, params) +
            ' (UTC' + (utc === 0 ? '' : (utc > 0 ? '+' : '') + utc) + ')';
    };
    mw.hook( 'wikipage.content' ).add(function($content) {
        const now = moment(), // 固定以页面内容生成的时间作为“当前”时点
            $comments = $content.find('p, dd').contents().filter(function() {
            return this.nodeType == 3 && regExp.test( this.textContent ); // 合法的时间戳总是text节点
        });
        if ($comments.length === 0) { return; }
        console.log('Hook: wikipage.content，开始替换签名时间');
        $comments.each(function() {
            const string = this.textContent.match( regExp ),
                then = moment(string[0] + '00:00+08', 'YYYY-MM-DD HH:mm Z'), // 00:00是未输入时间时的默认值
                isValid = then.isValid() && now.isAfter( then ), // 无效的输入并不会让moment抛出错误，只会警告
                node = this.splitText( string.index ),
                $ele = $('<time>', { class: "LocalComments" + (isValid ? '' : ' error'),
                'data-title': mw.msg('gadget-lc-tip') + string[0],
                text: isValid ? display(then, string[1], now) : mw.msg( 'gadget-lc-error' ) })
                .data('time', isValid ? then : undefined); // 保存一份moment对象以供未来调用
            node.splitText( string[0].length );
            node.replaceWith( $ele[0] );
        });
        mw.hook( 'local.comments' ).fire( $content );
    });
    mw.tipsy($(document.body), '.LocalComments', {anchor: false}); // 尽量采取delegate的形式处理交互事件
}
