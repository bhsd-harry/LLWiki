/**
 * @Function: 用于筛选LoveLive!学园偶像祭歌曲列表中出现的歌曲，并自动生成相应的Wiki代码
 * @Dependencies: oojs-ui-core
 * @Author: https://llwiki.org/zh/User:Bhsd
 */
'use strict';
(() => {
	let sifdata, $output;
	const attr = ['s', 'p', 'c'], // 依次为Smile/Pure/Cool属性
		diff = ['easy', 'normal', 'hard', 'expert', 'exran', 'master'],
		// 以m:ss的格式输出歌曲时长
		convertTime = t => `${Math.floor(t / 60)}:${(t % 60).toString().padStart(2, 0)}`,
		// 从数组生成下拉菜单的选项
		buildOptions = (list, key) => list.map(ele => ele[key]).filter(ele => ele)
			.map(ele => new OO.ui.MenuOptionWidget({data: ele, label: ele})),
		// 根据选中的歌曲修改输出的Wiki代码。这个函数需要sifdata。
		change = value => {
			const term = sifdata.find(ele => ele.j === value || ele.c === value),
				array = [];
			if (!term) {
				return;
			} // 不用清空上一次的输出
			$output.text(`{{sif-song-tablerow|${term.j}|${attr[term.a]}|${convertTime(term.t)}${
				term.s.map(ele => {
					const swing = ele.is ? 'swing' : '';
					let level = `${ele.k || ''}${ele.ia ? 'ac' : ''}${diff[ele.d - 1]}`; // 判定5键或是AC
					if (array.includes(level)) {
						level += 'melo';
					} // 无法直接判定歌melo
					array.push(level);
					return `|d-${level}=${ele.s}${swing}|c-${level}=${ele.c}${swing}`;
				}).join('')}|条件=}}`,
			);
		},
		// 分团体建立ComboBox。这个函数需要sifdata。
		buildSelect = group => {
			const list = sifdata.filter(ele => ele.g === group),
				optionsJa = buildOptions(list, 'j'),
				optionsZh = buildOptions(list, 'c'),
				select = new OO.ui.ComboBoxInputWidget({ menu: {items: [
					new OO.ui.MenuSectionOptionWidget({label: '原名'}), ...optionsJa,
					new OO.ui.MenuSectionOptionWidget({label: '中文名'}), ...optionsZh,
				], width: '100%', filterFromInput: true, filterMode: 'substring'} }).on('change', change);
			optionsJa.forEach(ele => {
				ele.$element.attr('lang', 'ja');
			});
			// 添加清空按钮
			return select.$element.append($('<i>', {class: 'fas fa-backspace'}).click(() => {
				select.setValue('');
			}));
		},
		main = data => {
			[sifdata] = data;
			const selectSet = [1, 2, 3, 4].map(buildSelect);
			mw.hook('wikipage.content').add($content => {
				console.log('Hook: wikipage.content, 开始建立歌曲数据库UI');
				$output = $content.find('#sif-song-tablerow');
				// 前4个三级标题固定为输入项，输出项未来可能会添加更多
				$content.find('h3').slice(0, 4).after(i => selectSet[i]);
			});
		},
		init = () => {
			mw.widget = mw.widget || {};
			if (mw.widget.list) {
				return;
			}
			Promise.all([$.ajax({ dataType: 'json', cache: true,
				url: '//cdn.jsdelivr.net/gh/bhsd-harry/LLWiki@latest/json/list.json',
			}), mw.loader.using('oojs-ui-core')]).then(main);
			mw.widget.list = true;
		};
	if (window.jQuery) {
		init();
	} else {
		window.addEventListener('jquery', init);
	}
})();
