/**
 * @Function: 手机版顶部编辑按钮编辑全文而非序言
 * @Dependencies: mediawiki.util
 * @Author: https://llwiki.org/zh/User:Bhsd
 */
'use strict';
$('#ca-edit').attr('href', mw.util.getUrl(null, {action: 'submit'})).removeAttr('title');
