/**
 * @Function: 将签名的时间戳替换为本地时间
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
    action = mw.config.get('wgAction');
if ( (ns >= 0 && ns % 2 == 1 || pagename == "LLWiki:互助客棧") && ["view", "submit"].includes(action) ) {
    mw.messages.set( wgUCS({'gadget-lc-error': '错误的签名时间！', 'gadget-lc-mm': '个月前', 'gadget-lc-tip': "原始时间戳："},
    {'gadget-lc-error': '錯誤的簽名時間！', 'gadget-lc-mm': '個月前', 'gadget-lc-tip': "原始時間戳："}) );
    // 合法的签名时间戳必须以CST为时区
    const regExp = /\d{4}年\d{1,2}月\d{1,2}日\s*(?:[(（]?(?:星期)?[一二三四五六日][)）]?)?\s*(\d\d:\d\d)?\s*[(（]CST[)）]/,
        weekdays = ['日', '一', '二', '三', '四', '五', '六'],
        $errorHTML = $('<span>', {class: "error", text: mw.msg( 'gadget-lc-error' )}),
        format = function(then, type, now) {
        if (type == "else") { return then.format( "YYYY年M月D日 " ) + '星期' + weekdays[ then.day() ]; }
        if (type == "HH:mm") {
            const utc = then.utcOffset() / 60;
            return then.format( "HH:mm [(UTC]" ) + (utc === 0 ? '' : (utc > 0 ? '+' : '') + utc) + ')';
        }
        const year = now.diff(then, 'year'),
            month = year ? null : now.diff(then, 'month'),
            day = year || month ? null : now.diff(then, 'day');
        return ' (' + (year ? year + '年前' : month ? month + mw.msg('gadget-lc-mm') : day + "天前") + ')';
    },
        display = function(then, withTime, now) {
        return then.calendar(null, {
            sameDay: '今天', lastDay: '昨天', lastWeek: format(then, "else") + format(then, "fromNow", now),
            sameElse: format(then, "else") + format(then, "fromNow", now)
        }) + (withTime ? ' ' + format(then, "HH:mm") : '');
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
                node = this.splitText( string.index ),
                $ele = $('<time>', { class: "LocalComments", 'data-title': mw.msg('gadget-lc-tip') + string[0],
                // 无效的输入并不会让moment抛出错误，只会警告
                html: then.isValid() && now.isAfter( then ) ? display(then, string[1], now) : $errorHTML.clone() });
            node.splitText( string[0].length );
            node.replaceWith( $ele[0] );
        });
        mw.hook( 'local.comments' ).fire( $content );
    });
    mw.tipsy($('body'), '.LocalComments', {classes: ['lc-popup'], anchor: false});
}
