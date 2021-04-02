/**
 * @Function: 将签名的时间戳替换为本地时区，用户可以自定义时间格式，但需要一定的知识和技术
 * @Dependencies: mediawiki.jqueryMsg（用于英文时间格式）, moment, ext.gadget.SettingsDialog
 * @Source: https://zh.moegirl.org.cn/User:AnnAngela/js/CommentsInLocalTime.js
 * @OriginalVersion: https://en.wikipedia.org/wiki/User:Mxn/CommentsInLocalTime.js
 * @Author: https://en.wikipedia.org/wiki/User:Mxn
 * @EditedBy: https://zh.moegirl.org.cn/User:AnnAngela、https://llwiki.org/zh/User:Bhsd
 */
"use strict";
/* global moment, OO, wgULS, wgUCS */
const ns = mw.config.get( 'wgNamespaceNumber' ),
    pagename = mw.config.get( 'wgPageName' ),
    action = mw.config.get('wgAction');
if ((ns >= 0 && ns % 2 == 1 || pagename == "Help:互助客棧") && ["view", "submit"].includes(action)) {
    // 1. 更新设置
    mw.gadgets = mw.gadgets || {};
    mw.gadgets.CommentsInLocalTime = $.extend( mw.storage.getObject( 'gadget-CommentsInLocalTime' ),
        mw.gadgets.CommentsInLocalTime ); // 注意优先级：用户JS优先
    const settings = mw.gadgets.CommentsInLocalTime,
        lang = settings.lang, // 注意这是一个数组！提供一套默认的英文设置
        isEn = lang == 'en', // lang会先自动转化为字符串再比较
        date = isEn ? 'ddd, ll' : settings.date,
        time = isEn ? 'LT' : settings.time,
        locale = isEn ? 'en' : settings.locale || '',
        i18n = settings.i18n || {},
        offset = settings.utcoffset;
    var tz = settings.timezone;
    // 2. 设置本地化消息
    mw.messages.set( $.extend( wgULS({ // 这些消息用于小工具设置
        'gadget-lc-label': '以本地时区显示签名时间戳', 'gadget-lc-time': '时间格式', 'gadget-lc-help': '请参考$1文档。',
        'gadget-lc-lang': '使用预定义的时间格式', 'gadget-lc-en': '英语格式', 'gadget-lc-locale': '语言',
        'gadget-lc-plural': '英语单复数请使用PLURAL魔术字，如$1。', 'gadget-lc-tz': '显示时区',
        'gadget-lc-tzhelp': '请使用IANA时区名称。', 'gadget-lc-tzerror': '错误的时区名称！当前显示为本地时区。',
        'gadget-lc-offsetHelp': '优先级低于时区名称。', 'gadget-lc-tzerror-offset': '错误的时区名称！改为由UTC偏移量设置时区。'
    }, {
        'gadget-lc-label': '以本地時區顯示簽名時間戳', 'gadget-lc-time': '時間格式', 'gadget-lc-help': '請參考$1文檔。',
        'gadget-lc-lang': '使用預定義的時間格式', 'gadget-lc-en': '英語格式', 'gadget-lc-locale': '語言',
        'gadget-lc-plural': '英語單複數請使用PLURAL魔術字，如$1。', 'gadget-lc-tz': '顯示時區',
        'gadget-lc-tzhelp': '請使用IANA時區名稱。', 'gadget-lc-tzerror': '錯誤的時區名稱！當前顯示為本地時區。',
        'gadget-lc-offsetHelp': '優先級低於時區名稱。', 'gadget-lc-tzerror-offset': '錯誤的時區名稱！改為由UTC偏移量設置時區。'
    }), wgUCS( // 这些消息用于页面内容
        {'gadget-lc-error': '错误的签名时间！', 'gadget-lc-m': '$1个月前', 'gadget-lc-tip': "原始时间戳："},
        {'gadget-lc-error': '錯誤的簽名時間！', 'gadget-lc-m': '$1個月前', 'gadget-lc-tip': "原始時間戳："}
    ), { 'gadget-lc-offset': 'UTC偏移量', 'gadget-lc-date': '日期格式', 'gadget-lc-y': '$1年前', 'gadget-lc-d': "$1天前",
        'gadget-lc-today': '今天', 'gadget-lc-yesterday': '昨天', 'gadget-lc-i18n': '本地化文字消息',
        'gadget-lc-yy': '若干年前', 'gadget-lc-mm': '若干月前', 'gadget-lc-dd': '若干天前', 'gadget-lc-td': '今天',
        'gadget-lc-yd': '昨天'
    }, isEn ? { 'gadget-lc-today': 'Today', 'gadget-lc-yesterday': 'Yesterday',
        'gadget-lc-y': '$1 year{{PLURAL:$1||s}} ago', 'gadget-lc-m': '$1 month{{PLURAL:$1||s}} ago',
        'gadget-lc-d': '$1 day{{PLURAL:$1||s}} ago'
    } : i18n) );
    // 3. 检查时区
    try { Intl.DateTimeFormat('en-us', {timeZone: tz}); }
    catch (error) {
        tz = undefined;
        mw.notify( mw.msg('gadget-lc-tzerror' + (offset ? '-offset' : '')), {type: 'error'} );
    }
    // 4. 小工具设置
    const helpInfo = new OO.ui.HtmlSnippet( mw.msg('gadget-lc-help', $('<a>', { target: "_blank", text: 'moment.js',
        href: "//momentjscom.readthedocs.io/en/latest/moment/04-displaying/01-format/" }).prop( 'outerHTML' )) ),
        helpPlural = new OO.ui.HtmlSnippet( mw.msg('gadget-lc-plural', '<br><code>{{PLURAL:$1|day|days}}</code>') ),
        locales = moment.locales();
    mw.settingsDialog.addTab({name: 'CommentsInLocalTime', label: 'gadget-lc-label', items: [
        {key: 'timezone', type: 'Text', label: 'gadget-lc-tz', help: mw.msg('gadget-lc-tzhelp'), config: {value: tz}},
        {key: 'utcoffset', type: 'Number', label: 'gadget-lc-offset', help: mw.msg('gadget-lc-offsetHelp'), config:
            {value: offset, max: 14, min: -12, step: 1, inputFilter: function(num) { return num.replace('+', ''); }}
        }, {key: 'lang', type: 'CheckboxMultiselect', label: 'gadget-lc-lang',
            config: {value: lang, options: [{data: 'en', label: mw.msg('gadget-lc-en')}]}
        }, {key: 'locale', type: 'Dropdown', label: 'gadget-lc-locale', config: {
            options: locales.map(function(ele) { return {data: ele}; }), value: settings.locale || '', disabled: isEn,
            inputFilter: function(locale) { return locales.includes( locale ) ? locale : moment.locale(); }}
        }, {key: 'date', type: 'Text', label: 'gadget-lc-date', help: helpInfo,
            config: {value: settings.date, disabled: isEn}
        }, {key: 'time', type: 'Text', label: 'gadget-lc-time', help: helpInfo,
            config: {value: settings.time, disabled: isEn}}
    ], fields: [{key: 'i18n', label: 'gadget-lc-i18n', items: [
        {key: 'gadget-lc-y', type: 'Text', label: 'gadget-lc-yy', help: helpPlural,
            config: {value: i18n['gadget-lc-y'], disabled: isEn, validate: /^[^[]*$/}
        }, {key: 'gadget-lc-m', type: 'Text', label: 'gadget-lc-mm', help: helpPlural,
            config: {value: i18n['gadget-lc-m'], disabled: isEn, validate: /^[^[]*$/}
        }, {key: 'gadget-lc-d', type: 'Text', label: 'gadget-lc-dd', help: helpPlural,
            config: {value: i18n['gadget-lc-d'], disabled: isEn, validate: /^[^[]*$/}
        }, {key: 'gadget-lc-today', type: 'Text', label: 'gadget-lc-td',
            config: {value: i18n['gadget-lc-today'], disabled: isEn, validate: /^[^[]*$/}
        }, {key: 'gadget-lc-yesterday', type: 'Text', label: 'gadget-lc-yd',
            config: {value: i18n['gadget-lc-yesterday'], disabled: isEn, validate: /^[^[]*$/}
        }
    ]}], help: '以本地时区显示签名时间戳'});
    mw.hook( 'settings.dialog' ).add(function(params) {
        if (params.name != 'CommentsInLocalTime') { return; }
        console.log('Hook: settings.dialog, 开始调整小工具设置 - CommentsInLocalTime');
        const items = params.items,
            checkbox = items[2].widget.on('change', function() { // 使用英语的设置组合
            const disabled = checkbox.value.length;
            items.slice(3).forEach(function(ele) { ele.widget.setDisabled( disabled ); });
            params.fields[0].items.forEach(function(ele) { ele.widget.setDisabled( disabled ); });
        });
    });
    // 5. 主体程序：替代签名时间戳。合法的签名时间戳必须以CST为时区。
    const regExp = /\d{4}年\d{1,2}月\d{1,2}日\s*(?:[(（]?(?:星期)?[一二三四五六日][)）]?)?\s*(\d\d:\d\d)?\s*[(（]CST[)）]/,
        weekdays = ['日', '一', '二', '三', '四', '五', '六'],
        // 用户可以自定义日期格式，否则模拟中文格式（用户可能未安装）
        formatDate = function(then) { // 附带左半中括号[
        return '[' + then.format(date || 'YYYY年M月D日 星期' + weekdays[ then.day() ]);
    },
        fromNow = function(then, now) { // 附带右半中括号]
        const y = now.diff(then, 'year'),
            m = y ? null : now.diff(then, 'month'),
            d = y || m ? null : now.diff(then, 'day');
        return ' (' + (y ? mw.msg('gadget-lc-y', y) : m ? mw.msg('gadget-lc-m', m) : mw.msg('gadget-lc-d', d)) + ')]';
    },
        display = function(then, withTime, now) { // 不使用moment.js自带的模糊时间方法fromNow
        const thenTz = mw.convertTimezone(then, tz || offset);
        return then.calendar(null, {
            sameDay: '[' + mw.msg('gadget-lc-today') + ']', lastDay: '[' + mw.msg('gadget-lc-yesterday') + ']',
            lastWeek: formatDate(thenTz[0]) + fromNow(then, now), sameElse: formatDate(thenTz[0]) + fromNow(then, now)
        }) + (withTime ? ' ' + thenTz[0].format(time || 'HH:mm') : '') + ' (' + thenTz[1] + ')';
    };
    mw.hook( 'wikipage.content' ).add(function($content) {
        const now = moment(), // 固定以页面内容生成的时间作为“当前”时点
            $comments = $content.find('p, dd, div').contents().filter(function() {
            return this.nodeType == 3 && regExp.test( this.textContent ); // 合法的时间戳总是text节点
        });
        if ($comments.length === 0) { return; }
        console.log('Hook: wikipage.content，开始替换签名时间戳');
        $comments.each(function() {
            const string = this.textContent.match( regExp ),
                then = moment(string[0] + '00:00+08', 'YYYY-MM-DD HH:mm Z').locale(locale), // 00:00是未输入时间时的默认值
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
    mw.tipsy('#bodyContent', '.LocalComments', {anchor: false}); // 尽量采取delegate的形式处理交互事件
}
