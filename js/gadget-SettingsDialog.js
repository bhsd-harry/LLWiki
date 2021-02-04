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
/* global OO, wgULS */
//避免使用API加载消息，直接手动添加
mw.messages.set( wgULS({
    'gadget-sd-title': '小工具设置', 'gadget-sd-notify': '您的设置已保存！新设置将于刷新页面后生效。',
    'gadget-sd-tooltip': '为当前浏览器设置小工具偏好', 'gadget-sd-help': '您可以在这里修改小工具偏好，修改仅对当前浏览器有效。',
    'gadget-sd-back': '还原', 'gadget-sd-helppage': '如果想要修改设置对所有浏览器生效，请查阅', 'gadget-sd-save': '保存',
    'gadget-sd-helptext': '帮助页面'
}, {
    'gadget-sd-title': '小工具偏好設定', 'gadget-sd-notify': '您的偏好設定已儲存！新設定將於重新載入頁面後生效。',
    'gadget-sd-tooltip': '為當前瀏覽器設定小工具偏好', 'gadget-sd-help': '您可以在這裡修改小工具偏好，修改僅對當前瀏覽器有效。',
    'gadget-sd-back': '復原', 'gadget-sd-helppage': '如果想要修改設定對所有瀏覽器生效，請查閱', 'gadget-sd-save': '儲存',
    'gadget-sd-helptext': '說明頁面'
}) );
var ready = false;
const buildForm = function(dialog, params) { // 生成表单，只需要执行一次，所有不用写成SettingsDialog的内置方法
    if (params.ready) { return; }
    const Help = params.help,
        $element = dialog.content.getTabPanel( params.name ).$element.append(
        $('<div>', {html: [mw.msg('gadget-sd-help')].concat( Help ? [mw.msg('gadget-sd-helppage'),
        $('<a>', {href: mw.util.getUrl('Help:小工具/' + Help), target: '_blank', text: mw.msg('gadget-sd-helptext')}),
    '。'] : [] )}) );
    (params.items || []).forEach(function(ele) {
        ele.widget = new OO.ui[ele.type + 'InputWidget']( ele.config );
        $element.append( new OO.ui.FieldLayout(ele.widget, {label: mw.msg( ele.label ), help: ele.help}).$element );
        delete ele.config;
    });
    (params.fields || []).forEach(function(ele) {
        const field = new OO.ui.FieldsetLayout({label: mw.msg( ele.label ), help: ele.help, helpInline: true});
        field.addItems( (ele.items || []).map(function(e) {
            e.widget = new OO.ui[e.type + 'InputWidget']( e.config );
            delete e.config;
            return new OO.ui.FieldLayout(e.widget, {label: mw.msg( e.label ), help: e.help});
        }) );
        $element.append( field.$element );
    });
    $('<div>', {class: 'panel-btns', html: new OO.ui.ButtonWidget({label: mw.msg('gadget-sd-back'),
        flags: 'destructive'}).on('click', function() { dialog.clearOptions( params.name ); }).$element})
        .appendTo( $element );
    params.ready = true;
    mw.hook( 'settings.dialog' ).fire( params ); // 生成一个Hook
};
/**
 * @Description: constructor只添加一个CSS类，剩下的交给addTab方法逐一添加小工具
 */
function SettingsDialog() {
    SettingsDialog.super.call(this, {classes: ['settingsDialog']});
    this.gadgets = [];
}
OO.inheritClass(SettingsDialog, OO.ui.ProcessDialog);
/**
 * @Description: initialize只创建一个OO.ui.IndexLayout对象，剩下的交给addTab方法填入内容
 */
SettingsDialog.prototype.initialize = function() {
    SettingsDialog.super.prototype.initialize.apply(this, arguments);
    this.content = new OO.ui.IndexLayout();
    this.$body.append( this.content.$element );
};
/**
 * @Description: 处理动作
 * @Param {String} 动作名
 */
SettingsDialog.prototype.getActionProcess = function(action) {
    const dialog = this,
        gadgets = this.gadgets.filter(function(ele) { return ele.ready; }); // 忽略未加载的小工具
    if (action == 'save') { gadgets.forEach(function(ele) { dialog.saveOptions(ele); }); }
    else { gadgets.forEach(function(ele) { dialog.clearOptions(ele); }); }
    this.close();
    return new OO.ui.Process();
};
/**
 * @Description: 同时添加数据和HTML，其中HTML会延后
 * @Param {Object} 数据对象
 */
SettingsDialog.prototype.addTab = function(params) {
    const dialog = this,
        panel = new OO.ui.TabPanelLayout( params.name, {label: mw.msg( params.label )} );
    this.content.addTabPanels( [panel] );
    this.gadgets.push( params );
    // 必要时才开始加载表单
    panel.on('active', function() { buildForm(dialog, params); });
    if (ready) { return; }
    // 添加按钮，注意手机版的执行时机
    if (mw.config.get('skin') == 'minerva') {
        mw.hook( 'mobile.menu' ).add(function($menu) {
            console.log('Hook: mobile.menu, 开始添加小工具设置按钮');
            mw.addMobileLinks([{icon: 'user-cog', msg: 'gadget-sd-title', attr: {id: 'ca-settingsDialog'}}])[0]
                .appendTo( $menu.find('ul:not(.hlist)').last() );
        });
    } else {
        mw.util.addPortletLink('p-cactions', '#', mw.msg('gadget-sd-title'), 'ca-settingsDialog',
            mw.msg('gadget-sd-tooltip'));
    }
    ready = true;
};
/**
 * @Description: 获取小工具序号
 * @Param {String} 小工具名称
 * @Param {Object} 小工具数据
 * @Return {Number} 小工具序号
 */
SettingsDialog.prototype.getIndex = function(arg) {
    if (typeof arg == 'string') { return this.gadgets.findIndex(function(ele) { return ele.name == arg; }); }
    else if (typeof arg == 'number') { return arg; }
    else { return this.gadgets.indexOf( arg ); }
};
/**
 * @Description: 获取小工具名称
 * @Param {Number} 小工具序号
 * @Param {Object} 小工具数据
 * @Return {String} 小工具名称
 */
SettingsDialog.prototype.getName = function(arg) {
    if (typeof arg == 'string') { return arg; }
    else if (typeof arg == 'number') { return this.gadgets[ arg ].name; }
    else { return arg.name; }
};
/**
 * @Description: 获取小工具数据
 * @Param {String} 小工具名称
 * @Param {Number} 小工具序号
 * @Return {Object} 小工具数据
 */
SettingsDialog.prototype.getObject = function(arg) {
    if (typeof arg == 'string') { return this.gadgets.find(function(ele) { return ele.name == arg; }); }
    else if (typeof arg == 'number') { return this.gadgets[ arg ]; }
    else { return arg; }
};
/**
 * @Description: 移除小工具
 * @Param {String} 小工具名称
 * @Param {Number} 小工具序号
 * @Param {Object} 小工具数据
 */
SettingsDialog.prototype.removeTab = function(arg) {
    const name = this.getName(arg),
        index = this.getIndex(arg);
    if (index == -1) {
        console.warn( '无法删除不存在的小工具设置！' );
        return;
    }
    // 需要同时移除数据和对应的HTML元素
    this.gadgets.splice(index, 1);
    this.content.removeTabPanels( this.content.getTabPanel( name ) );
};
/**
 * @Description: 还原选项
 * @Param {String} 小工具名称
 * @Param {Number} 小工具序号
 * @Param {Object} 小工具数据
 */
SettingsDialog.prototype.clearOptions = function(arg) {
    const gadget = this.getObject(arg);
    if (!gadget) {
        console.warn( '无法还原不存在的小工具设置！' );
        return;
    }
    (gadget.clearOptions || function() {
        const name = gadget.name,
            settings = mw.gadgets[ name ];
        (gadget.items || []).forEach(function(ele) { ele.widget.setValue( settings[ ele.key ] ); });
        (gadget.fields || []).forEach(function(ele) {
            const obj = settings[ ele.key ] || {};
            ele.items.forEach(function(e) { e.widget.setValue( obj[ e.key ] ); });
        });
    }) ();
};
/**
 * @Description: 保存设置
 * @Param {String} 小工具名称
 * @Param {Number} 小工具序号
 * @Param {Object} 小工具数据
 */
SettingsDialog.prototype.saveOptions = function(arg) {
    const gadget = this.getObject(arg);
    if (!gadget) {
        console.warn( '无法保存不存在的小工具设置！' );
        return;
    }
    (gadget.saveOptions || function() {
        const name = gadget.name,
            settings = mw.gadgets[ name ];
        (gadget.items || []).filter(function(ele) { return !ele.widget.isDisabled(); })
            .forEach(function(ele) { settings[ ele.key ] = ele.widget.getValue() || undefined; });
        (gadget.fields || []).forEach(function(ele) {
            settings[ ele.key ] = settings[ ele.key ] || {};
            const obj = settings[ ele.key ]; // 已经是一个对象了
            ele.items.filter(function(e) { return !e.widget.isDisabled(); })
                .forEach(function(e) { obj[ e.key ] = e.widget.getValue() || undefined; });
        });
        mw.storage.setObject('gadget-' + name, settings);
        mw.notify(mw.msg( 'gadget-sd-notify' ), {type: 'success', tag: 'gadget-settings'});
    }) ();
};
SettingsDialog.static = {name: 'settingsDialog', tagName: 'div', title: mw.msg('gadget-sd-title'),
    actions: [{action: 'save', label: mw.msg('gadget-sd-save'), flags: ['primary', 'progressive']},
        {action: 'cancel', label: mw.msg('ooui-dialog-message-reject'), flags: 'safe'}]
};
mw.settingsDialog = new SettingsDialog();
const $body = $(document.body);
if (!mw.windowManager) {
    mw.windowManager = mw.windowmanager || new OO.ui.WindowManager();
    mw.windowManager.$element.appendTo( $body );
}
mw.windowManager.addWindows( [mw.settingsDialog] ); // 此时已经初始化
$body.on('click', '#ca-settingsDialog', function(e) {
    e.preventDefault();
    const dialog = mw.settingsDialog,
        params = dialog.getObject( dialog.content.getCurrentTabPanelName() );
    dialog.open().opening.then(function() {
        if (params.ready) { return; }
        buildForm(dialog, params);
    });
});
