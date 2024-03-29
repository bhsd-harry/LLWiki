/**
 * @Description: LLWiki定义的CodeMirror扩展函数，桌面版、手机版均可用
 * @Function: 1. 下载需要的CodeMirror模式（CodeMirror.download）
 *            2. 高亮显示页内Wikitext代码（CodeMirror.runmode）
 * @Author: 无特殊说明时均为https://llwiki.org/zh/User:Bhsd
 */
'use strict';
/* global CodeMirror */
(() => {
/**
 * @Function: 根据内容模型下载需要的CodeMirror模式
 * @Param {String} alias, 内容模型名称或别名
 * @Return {Promise} 表示下载是否成功的Promise对象
 */
	const promise = {javascript: null, css: null, lua: null, wiki: null},
		aliases = { js: 'javascript', javascript: 'javascript', json: 'javascript', css: 'css', 'sanitized-css': 'css',
			lua: 'lua', scribunto: 'lua', wikitext: 'wiki', mediawiki: 'wiki', wiki: 'wiki',
		};
	CodeMirror.download = alias => {
		const name = aliases[alias.toLowerCase()];
		if (!(name in promise)) {
			console.error('无法识别的CodeMirror模式');
			throw null;
		}
		if (!promise[name]) {
			if (name === 'wiki') {
				promise[name] = mw.config.get('extCodeMirrorConfig')
					? Promise.resolve()
					: Promise.all([
						$.get({ dataType: 'json', cache: true,
							url: '//fastly.jsdelivr.net/gh/bhsd-harry/LLWiki@2.16/otherwiki/gadget-CodeMirror.json',
						}).then(config => {
							mw.config.set('extCodeMirrorConfig', config);
						},
						reason => {
							throw reason;
						},
						),
						$.get({ dataType: 'script', cache: true,
							url: '//fastly.jsdelivr.net/gh/bhsd-harry/LLWiki@2.18/otherwiki/mediawiki.min.js',
						}).then(() => {
							mw.loader.load('//fastly.jsdelivr.net/gh/bhsd-harry/LLWiki@2.17/otherwiki/mediawiki.min.css', 'text/css');
						}),
					]);
			} else {
				promise[name] = $.get({ dataType: 'script', cache: true,
					url: `//fastly.jsdelivr.net/npm/codemirror@5.35.0/mode/${name}/${name}.min.js`,
				});
			}
		}
		return promise[name];
	};
	/**
	 * @Function: 高亮页内Wikitext代码
	 * @Source: https://codemirror.net/addon/runmode/runmode.js
	 * @EditedBy: https://llwiki.org/zh/User:Bhsd
	 * @Param {jQuery} $pre, 写有Wikitext代码的jQuery对象
	 */
	const render = target => {
		const mode = CodeMirror.getMode({mwConfig: mw.config.get('extCodeMirrorConfig')}, 'mediawiki'),
			$target = $(target),
			lines = CodeMirror.splitLines($target.text().trim()),
			state = mode.startState(),
			content = lines.map(line => {
				const stream = new CodeMirror.StringStream(line),
					$line = $('<pre>', {class: 'CodeMirror-line'});
				let token, style;
				if (!stream.string) {
					token = mode.blankLine(state);
					style = token ? token.trim().split(/\s+/) : [];
					return $line.addClass(style.map(ele => ele.slice(5)))[0];
				}
				while (!stream.eol()) {
					token = mode.token(stream, state);
					style = token ? token.trim().split(/\s+/) : [];
					if (stream.start === 0) {
						$line.addClass(style.filter(ele => ele.startsWith('line-')).map(ele => ele.slice(5)));
					}
					$('<span>', { text: stream.current(), class: style.filter(ele => !ele.startsWith('line-'))
						.map(ele => `cm-${ele}`).join(' ') }).appendTo($line);
					stream.start = stream.pos;
				}
				return $line[0];
			});
		$target.addClass('runmode').empty();
		if ($target.hasClass('linenums')) { // 添加行号
			const start = $target.data('start') || 1;
			$('<ol>', { start,
				html: content.map((ele, i) => $('<li>', {html: ele, id: `L${i + start}`})),
			}).css('padding-left', `${(content.length + start - 1).toString().length + 2.5}ch`).appendTo($target);
		} else {
			$target.append(content);
		}
	};
	CodeMirror.runmode = $pre => {
		CodeMirror.download('wiki').then(() => {
			[...$pre].forEach(render);
		});
	};
})();
