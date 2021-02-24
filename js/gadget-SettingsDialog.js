/**
 * @Function: 定义小工具设置对话框
 * @Methods: constructor：构建mw.SettingsDialog对象
 *           initialize：初始化html
 *           getActionProcess：点击按钮时执行动作
 *           getIndex：获取小工具编号
 *           getName：获取小工具名称
 *           getObject：获取小工具对象
 *           addTab：添加小工具
 *           removeTab：移除小工具
 *           saveOptions：将设置保存到localStorage
 *           clearOptions：还原设置
 * @Dependencies: mediawiki.util, mediawiki.storage, oojs-ui-windows, oojs-ui-widgets, ext.gadget.site-lib, user
 * @Author: https://llwiki.org/zh/User:Bhsd
 */
"use strict";
/* global OO, hljs, wgULS */
// 1. 设置繁简文字信息
mw.messages.set( wgULS({
    'gadget-sd-copy': '请将以下代码添加至您的', 'gadget-sd-notify': '您的设置已保存！新设置将于刷新页面后生效。',
    'gadget-sd-help': '您可以在这里修改小工具偏好，修改仅对当前浏览器有效。如果想要修改设置对所有浏览器生效，请查阅',
    'gadget-sd-helptext': '帮助页面', 'gadget-sd-exporthelp': '导出代码', 'gadget-sd-js': '用户JS',
    'gadget-sd-title': '小工具设置', 'gadget-sd-back': '还原', 'gadget-sd-save': '保存', 'gadget-sd-export': '导出'
}, {
    'gadget-sd-copy': '請將以下代碼添加至您的', 'gadget-sd-notify': '您的偏好設定已儲存！新設定將於重新載入頁面後生效。',
    'gadget-sd-help': '您可以在這裡修改小工具偏好，修改僅對當前瀏覽器有效。如果想要修改設定對所有瀏覽器生效，請查閱',
    'gadget-sd-helptext': '說明頁面', 'gadget-sd-exporthelp': '導出代碼', 'gadget-sd-js': '使用者JS',
    'gadget-sd-title': '小工具偏好設定', 'gadget-sd-back': '復原', 'gadget-sd-save': '儲存', 'gadget-sd-export': '導出'
}) );
// 2. 准备HTML元素
var ready = false, dialog; // 是否是第一次打开对话框
const $helpPage = $('<a>', {target: '_blank', text: mw.msg('gadget-sd-helptext')}), // 需要动态设置href
    $help = $('<div>', {html: [ mw.msg('gadget-sd-help'), $helpPage, '，或',
    $('<a>', {href: '#settingsDialog-btns', text: mw.msg('gadget-sd-exporthelp')}), '。' // 链接跳转到“导出”按钮
]}),
    $block = $('<pre>', {class: 'javascript'}),
    $code = $('<div>', {id: 'settingsDialog-code', html: [ mw.msg('gadget-sd-copy'),
    $('<a>', {href: '/zh/special:mypage/common.js', target: '_blank', text: mw.msg('gadget-sd-js')}),
    '：', $block
]}),
    $btns = $('<div>', {id: 'settingsDialog-btns', html: [
    new OO.ui.ButtonWidget({label: mw.msg('gadget-sd-back'), flags: 'destructive'}).on('click', function() {
        dialog.clearOptions(); }).$element,
    new OO.ui.ButtonWidget({label: mw.msg('gadget-sd-export'), flags: 'progressive'}).on('click', function() {
        const $panel = $btns.parent();
        $block.text( dialog.export() );
        if (window.hljs) { hljs.highlightBlock( $block[0] ); }
        $code.show();
        $panel.animate({scrollTop: $panel.prop( 'scrollHeight' )}, 'slow');
    }).$element, $code
]}),
    // 3. 准备私有工具函数
    deleteKeys = function(arr, obj) { arr.forEach(function(ele) { delete obj[ele]; }); },
    buildWidget = function(obj) { // 生成单个OOUI widget
    obj.widget = new OO.ui[obj.type + 'InputWidget']( obj.config );
    const layout = new OO.ui.FieldLayout(obj.widget, {label: mw.msg( obj.label ), help: obj.help});
    deleteKeys(['config', 'label', 'help'], obj);
    return layout;
},
    clearWidgets = function(arr, settings) { // 还原一组OOUI widget
    (arr || []).forEach(function(ele) { ele.widget.setValue( settings ? settings[ele.key] || '' : '' ); });
},
    getValues = function(arr) { // 获取一组OOUI widget的值
    return Object.fromEntries( (arr || []).map(function(ele) {
        return [ele.key, !ele.widget.isDisabled() && ele.widget.getValue()];
    }).filter(function(ele) { return ele[1]; }) );
},
    buildForm = function(params, $element) {
    if (!params.ready) { // 生成表单，只需要执行一次，不用写成SettingsDialog的内置方法
        $element.append( (params.items || []).map(function(ele) { return buildWidget(ele).$element; }) );
        $element.append( (params.fields || []).map(function(ele) {
            const field = new OO.ui.FieldsetLayout({ label: mw.msg( ele.label ), help: ele.help, helpInline: true,
                items: (ele.items || []).map( buildWidget ) });
            deleteKeys(['label', 'help'], ele);
            return field.$element;
        }) );
        params.ready = true;
        mw.hook( 'settings.dialog' ).fire( params ); // 生成一个Hook
    }
    // 切换标签时添加帮助和按钮，不用写成SettingsDialog的内置方法
    $helpPage.attr('href', mw.util.getUrl( 'Help:小工具/' + params.help ));
    $element.prepend( $help ).append( $btns );
    $code.hide();
},
    openDialog = function(e) {
    e.preventDefault();
    dialog.open().opening.then(function() { buildForm(dialog.getObject(), dialog.getPanel().$element); });
};
// 4. 定义SettingsDialog类
function SettingsDialog() { // constructor只添加一个id，剩下的交给addTab方法逐一添加小工具
    SettingsDialog.super.call(this, {id: 'settingsDialog'});
    this.gadgets = [];
}
OO.inheritClass(SettingsDialog, OO.ui.ProcessDialog);
SettingsDialog.prototype.initialize = function() { // 只创建一个OO.ui.IndexLayout对象，剩下的交给addTab方法填入内容
    SettingsDialog.super.prototype.initialize.apply(this, arguments);
    this.content = new OO.ui.IndexLayout();
    this.$body.append( this.content.$element );
};
SettingsDialog.prototype.getActionProcess = function(action) {
    const dialog = this, // ES5不允许箭头函数，无法直接使用this关键字
        gadgets = this.gadgets.filter(function(ele) { return ele.ready; }); // 忽略未加载的小工具
    if (action == 'save') { gadgets.forEach(function(ele) { dialog.saveOptions( ele ); }); }
    else { gadgets.forEach(function(ele) { dialog.clearOptions( ele ); }); }
    this.close();
    return new OO.ui.Process();
};
/**
 * @Description: 同时添加数据和HTML，其中HTML会延后
 * @Param {Object} 数据对象
 */
SettingsDialog.prototype.addTab = function(params) {
    const panel = new OO.ui.TabPanelLayout( params.name, {label: mw.msg( params.label )} );
    delete params.label;
    this.content.addTabPanels( [panel] );
    this.gadgets.push( params );
    // 必要时才开始加载表单
    panel.on('active', function() { buildForm(params, panel.$element); });
    if (ready) { return; }
    // 添加按钮，注意手机版的执行时机
    if (mw.config.get('skin') == 'minerva') {
        mw.hook( 'mobile.menu' ).add(function($menu) {
            console.log('Hook: mobile.menu, 开始添加小工具设置按钮');
            $(mw.addMobileLinks( {icon: 'user-cog', msg: 'gadget-sd-title'} )).click( openDialog )
                .appendTo( $menu.find('ul:not(.hlist)').last() );
        });
    }
    else { $( mw.util.addPortletLink('p-cactions', '#', mw.msg('gadget-sd-title')) ).click( openDialog ); }
    ready = true;
};
/**
 * @Description: 获取小工具名称
 * @Param {Object} 小工具数据（可选），默认为当前小工具
 * @Return {String} 小工具名称
 */
SettingsDialog.prototype.getName = function(arg) {
    return arg ? arg.name || arg : this.content.getCurrentTabPanelName();
};
/**
 * @Description: 获取小工具数据
 * @Param {String} 小工具名称（可选），默认为当前小工具
 * @Return {Object} 小工具数据
 */
SettingsDialog.prototype.getObject = function(arg) {
    if (typeof arg == 'object') { return arg; }
    const name = arg || this.getName();
    return this.gadgets.find(function(ele) { return ele.name == name; });
};
/**
 * @Description: 获取小工具标签页
 * @Param {String} 小工具名称（可选），默认为当前小工具
 * @Param {Object} 小工具数据（可选），默认为当前小工具
 * @Return {OO.ui.TabPanelLayout} 小工具标签页
 */
SettingsDialog.prototype.getPanel = function(arg) {
    return arg ? this.content.getTabPanel( arg.name || arg ) : this.content.getCurrentTabPanel();
};
/**
 * @Description: 生成设置对象
 * @Param {String} 小工具名称（可选），默认为当前小工具
 * @Param {Object} 小工具数据（可选），默认为当前小工具
 * @Param {Boolean} 是否用于导出
 * @Return {Object} 小工具設置
 */
SettingsDialog.prototype.generateOptions = function(arg, flag) {
    const gadget = this.getObject(arg);
    return $.extend( getValues( gadget.items ), Object.fromEntries( (gadget.fields || []).map(function(ele) {
        const obj = getValues( ele.items );
        return [ele.key, flag && $.isEmptyObject( obj ) ? undefined : obj];
    }) ) );
};
/**
 * @Description: 保存设置
 * @Param {String} 小工具名称（可选），默认为当前小工具
 * @Param {Object} 小工具数据（可选），默认为当前小工具
 */
SettingsDialog.prototype.saveOptions = function(arg) {
    const name = this.getName(arg),
        settings = this.generateOptions( name );
    mw.gadgets[ name ] = settings;
    mw.storage.setObject('gadget-' + name, settings);
    mw.notify(mw.msg( 'gadget-sd-notify' ), {type: 'success', tag: 'gadget-settings'});
};
/**
 * @Description: 还原选项
 * @Param {String} 小工具名称（可选），默认为当前小工具
 * @Param {Object} 小工具数据（可选），默认为当前小工具
 */
SettingsDialog.prototype.clearOptions = function(arg) {
    const gadget = this.getObject(arg),
        settings = mw.gadgets[ gadget.name ];
    clearWidgets(gadget.items, settings);
    (gadget.fields || []).forEach(function(ele) { clearWidgets(ele.items, settings[ ele.key ]); });
};
/**
 * @Description: 导出JS格式的设置
 * @Param {String} 小工具名称（可选），默认为当前小工具
 * @Return {String} JS格式的设置
 */
SettingsDialog.prototype.export = function(name) {
    name = name || this.getName();
    return 'mw.gadgets = $.extend(mw.gadgets, {' + name + ': ' +
        JSON.stringify( this.generateOptions(name, true), null, '\t' ) + ' });';
};
SettingsDialog.static = {name: 'settingsDialog', tagName: 'div', title: mw.msg('gadget-sd-title'), escapable: true,
    actions: [{action: 'save', label: mw.msg('gadget-sd-save'), flags: ['primary', 'progressive']},
        {action: 'cancel', label: mw.msg('ooui-dialog-message-reject'), flags: 'safe'}]
};
// 5. 生成SettingsDialog并保存为全局对象
dialog = new SettingsDialog();
const manager = new OO.ui.WindowManager();
manager.$element.appendTo( document.body );
manager.addWindows( [dialog] ); // 此时已经初始化
mw.settingsDialog = dialog; // 创造一个全局对象
