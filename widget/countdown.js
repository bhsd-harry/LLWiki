/**
 * @Function: 生成倒计时
 * @Source: https://zh.moegirl.org.cn/Widget:Countdown
 * @Dependencies: moment, ext.gadget.site-lib
 * @EditedBy: https://llwiki.org/zh/User:Bhsd
 */
"use strict";
/*global mw, $, moment, wgUCS*/
(() => {
    let counter, $num;
    const fromNow = function() { // 处理一个 .counting 节点，显示时间
        const $ele = $(this),
            now = moment(), // now必须是一个新的moment对象
            then = moment( $ele.data('target') ), // 必需复制一个moment对象再进行操作
            isBefore = then.isBefore( now ),
            [early, late] = isBefore ? [then, now] : [now, then],
            year = late.diff( early, 'year' ),
            month = late.diff( early.add(year, 'year'), 'month' ),
            day = year ? null : late.diff( early.add(month, 'month'), 'day' ),
            hour = year || month ? null : late.diff( early.add(day, 'day'), 'hour' ),
            minute = year || month || day ? null : late.diff( early.add(hour, 'hour'), 'minute' ),
            second = year || month || day ? null : late.diff( early.add(minute, 'minute'), 'second' ),
            result = [
            ... year ? [$num.clone().text( year ), '年'] : [],
            ... month ? [$num.clone().text( month ), mw.msg('widget-cd-mm')] : [],
            ... day ? [$num.clone().text( day ), '天'] : [],
            ... hour ? [$num.clone().text( hour ), mw.msg('widget-cd-hh')] : [],
            ... minute !== null ? [$num.clone().text( minute ), '分'] : [],
            ... second !== null ? [$num.clone().text( second ), '秒'] : []
        ];
        $ele.toggleClass('isBefore', isBefore).children().eq(isBefore ? 0 : 1).find( '.countdown' ).html( result );
    },
        run = () => { $( '.counting' ).each( fromNow ); }, // 每秒循环一遍所有 .counting 节点
        main = ($content) => {
        const $nodes = $content.find( '.countdownNode' );
        if ($nodes.length === 0) { return; }
        mw.loader.using( ['moment', 'ext.gadget.site-lib'] ).then(() => {
            mw.messages.set( wgUCS({ 'widget-cd-error': "时间格式错误！", 'widget-cd-mm': '个月', 'widget-cd-hh': '小时' },
               { 'widget-cd-error': "時間格式錯誤！", 'widget-cd-mm': '個月', 'widget-cd-hh': '小時' }) );
            $nodes.each(function() {
                const $ele = $(this),
                    then = moment(this.title, 'YYYY-MM-DD HH:mm Z');
                if (then.isValid()) {
                    $ele.data('target', then).addClass( 'counting' )
                         // 以本地时间替换title，之后交给Widget:Abbr就好
                        .attr('title', then.format( 'llll ([UTC]Z' ).slice(0, -3) + ')');
                }
                else { $ele.toggleClass('error countdownNode').text( mw.msg('widget-cd-error') ); }
            });
            const $counting = $nodes.filter( '.counting' );
            if ($counting.length === 0) { return; }
            console.log('Hook: wikipage.content，开始添加倒计时');
            run();
            $counting.removeClass( 'countdownNode' ); // 新节点至少要执行过一次run()后才能移除countdownNode类
            counter = counter || setInterval(run, 1000); // 防止重复setInterval
        });
    },
        handler = () => {
        $num = $('<span>', {class: 'countdown-num'});
        mw.widget = mw.widget || {};
        if (mw.widget.countdown) { return; } // 不要和mw.countdown搞混
        mw.hook( 'wikipage.content' ).add( main );
        mw.widget.countdown = true;
    };
    if (window.jQuery) { handler(); }
    else { window.addEventListener( 'jquery', handler ); }
}) ();
