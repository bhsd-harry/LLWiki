/**
 * @Function: 将签名的时间戳替换为本地时区，用户可以自定义时间格式，但需要一定的知识和技术
 * @Dependencies: mediawiki.jqueryMsg（用于英文时间格式）, moment, ext.gadget.SettingsDialog
 * @Source: https://zh.moegirl.org.cn/User:AnnAngela/js/CommentsInLocalTime.js
 * @OriginalVersion: https://en.wikipedia.org/wiki/User:Mxn/CommentsInLocalTime.js
 * @Author: https://en.wikipedia.org/wiki/User:Mxn
 * @EditedBy: https://zh.moegirl.org.nc/User:AnnAngela、https://llwiki.org/zh/User:Bhsd
 */
"use strict";
/* global moment, OO, wgULS, wgUCS */
const ns = mw.config.get( 'wgNamespaceNumber' ),
    pagename = mw.config.get( 'wgPageName' ),
    action = mw.config.get('wgAction');
if ( (ns >= 0 && ns % 2 == 1 || pagename == "LLWiki:互助客棧") && ["view", "submit"].includes(action) ) {
    // 1. 更新设置
    mw.gadgets = mw.gadgets || {};
    mw.gadgets.CommentsInLocalTime = $.extend( mw.storage.getObject( 'gadget-CommentsInLocalTime' ),
        mw.gadgets.CommentsInLocalTime ); // 注意优先级：用户JS优先
    const settings = mw.gadgets.CommentsInLocalTime,
        lang = (settings.lang || [])[0], // 注意这是一个数组！提供一套默认的英文设置
        isEn = lang == 'en',
        date = isEn ? 'ddd, ll' : settings.date,
        time = isEn ? 'LT' : settings.time,
        locale = isEn ? 'en' : settings.locale || '',
        i18n = settings.i18n || {};
    // 2. 设置本地化消息
    mw.messages.set( $.extend( wgULS({ // 这些消息用于小工具设置
        'gadget-lc-label': '以本地时区显示签名时间戳', 'gadget-lc-time': '时间格式', 'gadget-lc-help': '请参考$1文档。',
        'gadget-lc-lang': '语言', 'gadget-lc-en': '英语', 'gadget-lc-locale': '本地化语言',
        'gadget-lc-plural': '英语单复数请使用PLURAL魔术字。', 'gadget-lc-bracket': '请使用$1防止字母转换为时间。'
    }, {
        'gadget-lc-label': '以本地時區顯示簽名時間戳', 'gadget-lc-time': '時間格式', 'gadget-lc-help': '請參考$1文檔。',
        'gadget-lc-lang': '語言', 'gadget-lc-en': '英語', 'gadget-lc-locale': '本地化語言',
        'gadget-lc-plural': '英語單複數請使用PLURAL魔術字。', 'gadget-lc-bracket': '請使用$1防止字母轉換為時間。'
    }), wgUCS( // 这些消息用于页面内容
        {'gadget-lc-error': '错误的签名时间！', 'gadget-lc-m': '$1个月前', 'gadget-lc-tip': "原始时间戳："},
        {'gadget-lc-error': '錯誤的簽名時間！', 'gadget-lc-m': '$1個月前', 'gadget-lc-tip': "原始時間戳："}
    ), {'gadget-lc-date': '日期格式', 'gadget-lc-y': '$1年前', 'gadget-lc-d': "$1天前", 'gadget-lc-today': '今天',
        'gadget-lc-yesterday': '昨天', 'gadget-lc-i18n': '本地化文字消息', 'gadget-lc-yy': '若干年前',
        'gadget-lc-mm': '若干月前', 'gadget-lc-dd': '若干天前', 'gadget-lc-td': '今天', 'gadget-lc-yd': '昨天'
    }, isEn ? { 'gadget-lc-today': '[Today]', 'gadget-lc-yesterday': '[Yesterday]',
        'gadget-lc-y': '$1 year{{PLURAL:$1||s}} ago', 'gadget-lc-m': '$1 month{{PLURAL:$1||s}} ago',
        'gadget-lc-d': '$1 day{{PLURAL:$1||s}} ago'
    } : Object.fromEntries( Object.entries(i18n).filter(function(ele) { return ele[1]; })) ) ); // 移除空字符串
    // 3. 小工具设置
    const helpInfo = new OO.ui.HtmlSnippet( mw.msg('gadget-lc-help', $('<a>', { target: "_blank", text: 'moment.js',
        href: "//momentjscom.readthedocs.io/en/latest/moment/04-displaying/01-format/" }).prop( 'outerHTML' )) ),
        helpI18n = new OO.ui.HtmlSnippet( mw.msg('gadget-lc-bracket', '<code>[]</code>'));
    mw.settingsDialog.addTab({name: 'CommentsInLocalTime', label: 'gadget-lc-label', items: [
        {key: 'lang', type: 'CheckboxMultiselect', label: 'gadget-lc-lang', config: {value: isEn ? ['en'] : [],
            options: [{data: 'en', label: mw.msg('gadget-lc-en')}]}},
        {key: 'locale', type: 'Text', label: 'gadget-lc-locale', config: {value: locale, disabled: isEn}},
        {key: 'date', type: 'Text', label: 'gadget-lc-date', help: helpInfo, config: {value: date, disabled: isEn}},
        {key: 'time', type: 'Text', label: 'gadget-lc-time', help: helpInfo, config: {value: time, disabled: isEn}}
    ], fields: [{key: 'i18n', label: 'gadget-lc-i18n', items: [
        {key: 'gadget-lc-y', type: 'Text', label: 'gadget-lc-yy', help: mw.msg('gadget-lc-plural'),
            config: {value: i18n['gadget-lc-y'], disabled: isEn}
        }, {key: 'gadget-lc-m', type: 'Text', label: 'gadget-lc-mm', help: mw.msg('gadget-lc-plural'),
            config: {value: i18n['gadget-lc-m'], disabled: isEn}
        }, {key: 'gadget-lc-d', type: 'Text', label: 'gadget-lc-dd', help: mw.msg('gadget-lc-plural'),
            config: {value: i18n['gadget-lc-d'], disabled: isEn}
        }, {key: 'gadget-lc-today', type: 'Text', label: 'gadget-lc-td', help: helpI18n,
            config: {value: i18n['gadget-lc-today'], disabled: isEn}
        }, {key: 'gadget-lc-yesterday', type: 'Text', label: 'gadget-lc-yd', help: helpI18n,
            config: {value: i18n['gadget-lc-yesterday'], disabled: isEn}
        }
    ]}], help: '以本地时区显示签名时间戳'});
    mw.hook( 'settings.dialog' ).add(function(params) {
        if (params.name != 'CommentsInLocalTime') { return; }
        console.log('Hook: settings.dialog, 开始调整小工具设置 - CommentsInLocalTime');
        const items = params.items,
            checkbox = items[0].widget;
        checkbox.on('change', function() { // 使用英语的设置组合
            const disabled = checkbox.getValue().length;
            items.slice(1).forEach(function(ele) { ele.widget.setDisabled( disabled ); });
            params.fields[0].items.forEach(function(ele) { ele.widget.setDisabled( disabled ); });
        });
    });
    // 4. 主体程序：替代签名时间戳。合法的签名时间戳必须以CST为时区。
    const regExp = /\d{4}年\d{1,2}月\d{1,2}日\s*(?:[(（]?(?:星期)?[一二三四五六日][)）]?)?\s*(\d\d:\d\d)?\s*[(（]CST[)）]/,
        weekdays = ['日', '一', '二', '三', '四', '五', '六'],
        // 用户可以自定义日期格式，否则模拟中文格式（用户可能未安装）
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
        console.log('Hook: wikipage.content，开始替换签名时间戳');
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
