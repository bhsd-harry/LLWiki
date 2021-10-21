/* eslint-disable no-use-before-define, space-before-function-paren, no-var, prefer-arrow-callback,
 prefer-destructuring, prefer-template, object-shorthand */
/* global CodeMirror */
( function ( CodeMirror ) {
	'use strict';

	function eatMnemonic( stream, style, mnemonicStyle ) {
		var ok;
		if ( stream.eat( '#' ) ) {
			if ( stream.eat( 'x' ) ) {
				ok = stream.eatWhile( /[a-fA-F\d]/ ) && stream.eat( ';' );
			} else {
				ok = stream.eatWhile( /[\d]/ ) && stream.eat( ';' );
			}
		} else {
			ok = stream.eatWhile( /[\w.\-:]/ ) && stream.eat( ';' );
		}
		if ( ok ) {
			mnemonicStyle += ' mw-mnemonic';
			return mnemonicStyle;
		}
		return style;
	}

	CodeMirror.defineMode( 'mediawiki', function ( config /* , parserConfig */ ) {

		var mwConfig = config.mwConfig,
			urlProtocols = new RegExp( '^(?:' + mwConfig.urlProtocols + ')', 'i' ),
			permittedHtmlTags = { b: true, bdi: true, del: true, i: true, ins: true,
				u: true, font: true, big: true, small: true, sub: true, sup: true,
				h1: true, h2: true, h3: true, h4: true, h5: true, h6: true, cite: true,
				code: true, em: true, s: true, strike: true, strong: true, tt: true,
				var: true, div: true, center: true, blockquote: true, ol: true, ul: true,
				dl: true, table: true, caption: true, pre: true, ruby: true, rb: true,
				rp: true, rt: true, rtc: true, p: true, span: true, abbr: true, dfn: true,
				kbd: true, samp: true, data: true, time: true, mark: true, br: true,
				wbr: true, hr: true, li: true, dt: true, dd: true, td: true, th: true,
				tr: true, noinclude: true, includeonly: true, onlyinclude: true, translate: true, img: true },
			voidHtmlTags = { br: true, hr: true, wbr: true, img: true },
			isBold, isItalic, firstsingleletterword, firstmultiletterword, firstspace,
			mBold, mItalic, mTokens = [],
			mStyle;

		function makeStyle( style, state, endGround ) {
			if ( isBold || state.isStrong ) {
				style += ' strong';
			}
			if ( isItalic || state.isEm ) {
				style += ' em';
			}
			return makeLocalStyle( style, state, endGround );
		}

		function makeLocalStyle( style, state, endGround ) {
			var ground = '';
			switch ( state.nTemplate ) {
				case 0:
					break;
				case 1:
					ground += '-template';
					break;
				case 2:
					ground += '-template2';
					break;
				default:
					ground += '-template3';
					break;
			}
			switch ( state.nExt ) {
				case 0:
					break;
				case 1:
					ground += '-ext';
					break;
				case 2:
					ground += '-ext2';
					break;
				default:
					ground += '-ext3';
					break;
			}
			if ( state.nLink > 0 ) {
				ground += '-link';
			}
			if ( ground !== '' ) {
				style = 'mw' + ground + '-ground ' + style;
			}
			if ( endGround ) {
				state[ endGround ]--;
			}
			if ( state.isStrike ) {
				style += ' strike';
			}
			return style;
		}

		function eatBlock( style, terminator ) {
			return function ( stream, state ) {
				while ( !stream.eol() ) {
					if ( stream.match( terminator ) ) {
						state.tokenize = state.stack.pop();
						break;
					}
					stream.next();
				}
				return makeLocalStyle( style, state );
			};
		}

		function eatEnd( style ) {
			return function ( stream, state ) {
				stream.skipToEnd();
				state.tokenize = state.stack.pop();
				return makeLocalStyle( style, state );
			};
		}

		function eatChar( char, style ) {
			return function ( stream, state ) {
				state.tokenize = state.stack.pop();
				if ( stream.eat( char ) ) {
					return makeLocalStyle( style, state );
				}
				return makeLocalStyle( 'error', state );
			};
		}

		function eatSectionHeader( count ) {
			return function ( stream, state ) {
				if ( stream.match( /^[^&<[{~]+/ ) ) {
					if ( stream.eol() ) {
						stream.backUp( count );
						state.tokenize = eatEnd( 'mw-section-header' );
					}
					return null; // style is null
				}
				return eatWikiText( '', '' )( stream, state );
			};
		}

		function inVariable( stream, state ) {
			if ( stream.match( /^[^{}|]+/ ) ) {
				return makeLocalStyle( 'mw-templatevariable-name', state );
			}
			if ( stream.eat( '|' ) ) {
				state.tokenize = inVariableDefault;
				return makeLocalStyle( 'mw-templatevariable-delimiter', state );
			}
			if ( stream.match( '}}}' ) ) {
				state.tokenize = state.stack.pop();
				return makeLocalStyle( 'mw-templatevariable-bracket', state );
			}
			if ( stream.match( '{{{' ) ) {
				state.stack.push( state.tokenize );
				return makeLocalStyle( 'mw-templatevariable-bracket', state );
			}
			stream.next();
			return makeLocalStyle( 'mw-templatevariable-name', state );
		}

		function inVariableDefault( stream, state ) {
			if ( stream.match( /^[^{}[<&~]+/ ) ) {
				return makeStyle( 'mw-templatevariable', state );
			}
			if ( stream.match( '}}}' ) ) {
				state.tokenize = state.stack.pop();
				return makeLocalStyle( 'mw-templatevariable-bracket', state );
			}
			return eatWikiText( 'mw-templatevariable', '' )( stream, state );
		}

		function inParserFunctionName( stream, state ) {
			if ( stream.match( /^#?[^:}{~|<>[\]]+/ ) ) { // FIXME: {{#name}} and {{uc}} are wrong, must have ':'
				return makeLocalStyle( 'mw-parserfunction-name', state );
			}
			if ( stream.eat( ':' ) ) {
				state.tokenize = inParserFunctionArguments;
				return makeLocalStyle( 'mw-parserfunction-delimiter', state );
			}
			if ( stream.match( '}}' ) ) {
				state.tokenize = state.stack.pop();
				return makeLocalStyle( 'mw-parserfunction-bracket', state, 'nExt' );
			}
			return eatWikiText( 'error', '' )( stream, state );
		}

		function inParserFunctionArguments( stream, state ) {
			if ( stream.match( /^[^|}{[<&~]+/ ) ) {
				return makeStyle( 'mw-parserfunction', state );
			} else if ( stream.eat( '|' ) ) {
				return makeLocalStyle( 'mw-parserfunction-delimiter', state );
			} else if ( stream.match( '}}' ) ) {
				state.tokenize = state.stack.pop();
				return makeLocalStyle( 'mw-parserfunction-bracket', state, 'nExt' );
			}
			return eatWikiText( 'mw-parserfunction', '' )( stream, state );
		}

		function eatTemplatePageName( haveAte ) {
			return function ( stream, state ) {
				if ( stream.match( /^[\s\u00a0]*\|[\s\u00a0]*/ ) ) {
					state.expectArgName = true;
					state.tokenize = eatTemplateArgument;
					return makeLocalStyle( 'mw-template-delimiter', state );
				}
				if ( stream.match( /^[\s\u00a0]*\}\}/ ) ) {
					state.tokenize = state.stack.pop();
					return makeLocalStyle( 'mw-template-bracket', state, 'nTemplate' );
				}
				if ( stream.match( /^[\s\u00a0]*<!--.*?-->/ ) ) {
					return makeLocalStyle( 'mw-comment', state );
				}
				if ( haveAte && stream.sol() ) {
					// @todo error message
					state.nTemplate--;
					state.tokenize = state.stack.pop();
					return;
				}
				if ( stream.match( /^[\s\u00a0]*[^\s\u00a0|}<{&~]+/ ) ) {
					state.tokenize = eatTemplatePageName( true );
					return makeLocalStyle( 'mw-template-name mw-pagename', state );
				} else if ( stream.eatSpace() ) {
					if ( stream.eol() === true ) {
						return makeLocalStyle( 'mw-template-name', state );
					}
					return makeLocalStyle( 'mw-template-name mw-pagename', state );
				}
				return eatWikiText( 'mw-template-name mw-pagename', 'mw-template-name-mnemonic mw-pagename', true )( stream, state );
			};
		}

		function eatTemplateArgument( stream, state ) {
			if ( state.expectArgName && stream.eatWhile( /[^=|}{[<&~]/ ) ) {
				if ( stream.eat( '=' ) ) {
					state.expectArgName = false;
					state.tokenize = eatTemplateArgument;
					return makeLocalStyle( 'mw-template-argument-name', state );
				}
				return makeStyle( 'mw-template', state );
			} else if ( stream.eatWhile( /[^|}{[<&~]/ ) ) {
				return makeStyle( 'mw-template', state );
			} else if ( stream.eat( '|' ) ) {
					state.expectArgName = true;
				state.tokenize = eatTemplateArgument;
				return makeLocalStyle( 'mw-template-delimiter', state );
			} else if ( stream.match( '}}' ) ) {
				state.tokenize = state.stack.pop();
				return makeLocalStyle( 'mw-template-bracket', state, 'nTemplate' );
			}
			return eatWikiText( 'mw-template', '' )( stream, state );
		}

		function eatExternalLinkProtocol( chars ) {
			return function ( stream, state ) {
				while ( chars > 0 ) {
					chars--;
					stream.next();
				}
				if ( stream.eol() ) {
					state.nLink--;
					// @todo error message
					state.tokenize = state.stack.pop();
				} else {
					state.tokenize = inExternalLink;
				}
				return makeLocalStyle( 'mw-extlink-protocol', state );
			};
		}

		function inExternalLink( stream, state ) {
			if ( stream.sol() ) {
				state.nLink--;
				// @todo error message
				state.tokenize = state.stack.pop();
				return;
			}
			if ( stream.match( /^[\s\u00a0]*\]/ ) ) {
				state.tokenize = state.stack.pop();
				return makeLocalStyle( 'mw-extlink-bracket', state, 'nLink' );
			}
			if ( stream.eatSpace() ) {
				state.tokenize = inExternalLinkText;
				return makeStyle( '', state );
			}
			if ( stream.match( /^[^\s\u00a0\]{&~']+/ ) || stream.eatSpace() ) {
				if ( stream.peek() === '\'' ) {
					if ( stream.match( '\'\'', false ) ) {
						state.tokenize = inExternalLinkText;
					} else {
						stream.next();
					}
				}
				return makeLocalStyle( 'mw-extlink', state );
			}
			return eatWikiText( 'mw-extlink', '', true )( stream, state );
		}

		function inExternalLinkText( stream, state ) {
			if ( stream.sol() ) {
				state.nLink--;
				// @todo error message
				state.tokenize = state.stack.pop();
				return;
			}
			if ( stream.eat( ']' ) ) {
				state.tokenize = state.stack.pop();
				return makeLocalStyle( 'mw-extlink-bracket', state, 'nLink' );
			}
			return eatWikiText( 'mw-extlink-text', '' )( stream, state );
		}

		function inFileLink( stream, state ) {
			if ( stream.sol() ) {
				state.nLink--;
				// @todo error message
				state.tokenize = state.stack.pop();
				return;
			}
			if ( stream.match( /^[\s\u00a0]*#[\s\u00a0]*/ ) ) {
				state.tokenize = inLinkToSection( true );
				return makeLocalStyle( 'error', state );
			}
			if ( stream.match( /^[\s\u00a0]*\|[\s\u00a0]*/ ) ) {
				state.tokenize = eatLinkText( true );
				return makeLocalStyle( 'mw-link-delimiter', state );
			}
			if ( stream.match( /^[\s\u00a0]*\]\]/ ) ) {
				state.tokenize = state.stack.pop();
				return makeLocalStyle( 'mw-link-bracket', state, 'nLink' );
				// if ( !stream.eatSpace() ) {
				// state.ImInBlock.push( 'LinkTrail' );
				// }
			}
			if ( stream.match( /^[\s\u00a0]*[^\s\u00a0#|\]&~{]+/ ) || stream.eatSpace() ) { // FIXME '{{' brokes Link, sample [[z{{page]]
				return makeStyle( 'mw-link-pagename mw-pagename', state );
			}
			return eatWikiText( 'mw-link-pagename mw-pagename', 'mw-pagename' )( stream, state );
		}

		function inLink( stream, state ) {
			if ( stream.sol() ) {
				state.nLink--;
				// @todo error message
				state.tokenize = state.stack.pop();
				return;
			}
			if ( stream.match( /^[\s\u00a0]*#[\s\u00a0]*/ ) ) {
				state.tokenize = inLinkToSection();
				return makeLocalStyle( 'mw-link', state );
			}
			if ( stream.match( /^[\s\u00a0]*\|[\s\u00a0]*/ ) ) {
				state.tokenize = eatLinkText();
				return makeLocalStyle( 'mw-link-delimiter', state );
			}
			if ( stream.match( /^[\s\u00a0]*\]\]/ ) ) {
				state.tokenize = state.stack.pop();
				return makeLocalStyle( 'mw-link-bracket', state, 'nLink' );
				// if ( !stream.eatSpace() ) {
				// state.ImInBlock.push( 'LinkTrail' );
				// }
			}
			if ( stream.match( /^[\s\u00a0]*[^\s\u00a0#|\]&~{]+/ ) || stream.eatSpace() ) { // FIXME '{{' brokes Link, sample [[z{{page]]
				return makeStyle( 'mw-link-pagename mw-pagename', state );
			}
			return eatWikiText( 'mw-link-pagename mw-pagename', 'mw-pagename' )( stream, state );
		}

		function inLinkToSection( isFile ) {
			return function( stream, state ) {
				if ( stream.sol() ) {
					// @todo error message
					state.nLink--;
					state.tokenize = state.stack.pop();
					return;
				}
				if ( isFile && stream.eatWhile( /[^|\]]/ ) ) {
					return makeLocalStyle( 'error', state );
				}
				if ( stream.match( /^[^|\]&~{}]+/ ) ) { // FIXME '{{' brokes Link, sample [[z{{page]]
					return makeStyle( 'mw-link-tosection', state );
				}
				if ( stream.eat( '|' ) ) {
					state.tokenize = eatLinkText( isFile );
					return makeLocalStyle( 'mw-link-delimiter', state );
				}
				if ( stream.match( ']]' ) ) {
					state.tokenize = state.stack.pop();
					return makeLocalStyle( 'mw-link-bracket', state, 'nLink' );
					// if ( !stream.eatSpace() ) {
					// state.ImInBlock.push( 'LinkTrail' );
					// }
				}
				if ( isFile && stream.eat( ']' ) ) {
					return makeLocalStyle( 'error', state );
				}
				return eatWikiText( 'mw-link-tosection', '' )( stream, state );
			};
		}

		function eatLinkText( isFile ) {
			return function ( stream, state ) {
				if ( stream.match( ']]' ) ) {
					state.tokenize = state.stack.pop();
					return makeLocalStyle( 'mw-link-bracket', state, 'nLink' );
				}
				if ( isFile && stream.eat( '|' ) ) {
					return makeLocalStyle( 'mw-link-delimiter', state );
				}
				return eatWikiText( 'mw-link-text', '' )( stream, state );
			};
		}

		function eatTagName( chars, isCloseTag, isHtmlTag ) {
			return function ( stream, state ) {
				var name = '';
				while ( chars > 0 ) {
					chars--;
					name += stream.next();
				}
				name = name.toLowerCase();
				if ( stream.eol() ) {
					// @todo error message
					state.tokenize = state.stack.pop();
					return makeLocalStyle( isHtmlTag ? 'mw-htmltag-name mw-htmltag-' + name : 'mw-exttag-name', state );
				}
				stream.eatSpace();
				if ( stream.eol() ) {
					// @todo error message
					state.tokenize = state.stack.pop();
					return makeLocalStyle( isHtmlTag ? 'mw-htmltag-name mw-htmltag-' + name : 'mw-exttag-name', state );
				}

				if ( isHtmlTag ) {
					if ( isCloseTag && !( name in voidHtmlTags ) ) {
						state.tokenize = eatChar( '>', 'mw-htmltag-bracket' );
						if ( [ 's', 'del', 'strike' ].includes( name ) ) { state.isStrike = false; }
						if ( [ 'b', 'strong' ].includes( name ) ) { state.isStrong = false; }
						if ( [ 'i', 'em' ].includes( name ) ) { state.isEm = false; }
					} else {
						state.tokenize = eatHtmlTagAttribute( name );
					}
					return makeLocalStyle( 'mw-htmltag-name mw-htmltag-' + name, state );
				} // it is the extension tag
				if ( isCloseTag ) {
					state.tokenize = eatChar( '>', 'mw-exttag-bracket mw-ext-' + name );
				} else {
					state.tokenize = eatExtTagAttribute( name );
				}
				return makeLocalStyle( 'mw-exttag-name mw-ext-' + name, state );
			};
		}

		function eatHtmlTagAttribute( name ) {
			return function ( stream, state ) {
				if ( state.expectArgName && stream.match( /^[^>/<{&~=]+/ ) ||
					!state.expectArgName && stream.match( /^[^>/<{&~]+/ ) ) {
					return makeLocalStyle( 'mw-htmltag-attribute', state );
				}
				if ( state.expectArgName && stream.eat( '=' ) ) {
					state.expectArgName = false;
					return makeLocalStyle( 'error', state );
				}
				if ( stream.eat( '>' ) ) {
					if ( !( name in voidHtmlTags ) ) {
						state.InHtmlTag.push( name );
					}
					state.tokenize = state.stack.pop();
					if ( [ 's', 'del', 'strike' ].includes( name ) ) { state.isStrike = true; }
					if ( [ 'b', 'strong' ].includes( name ) ) { state.isStrong = true; }
					if ( [ 'i', 'em' ].includes( name ) ) { state.isEm = true; }
					return makeLocalStyle( 'mw-htmltag-bracket', state );
				}
				if ( stream.match( '/>' ) ) {
					state.tokenize = state.stack.pop();
					return makeLocalStyle( name in voidHtmlTags ? 'mw-htmltag-bracket' : 'error', state );
				}
				return eatWikiText( 'mw-htmltag-attribute', '', true )( stream, state );
			};
		}

		function eatExtTagAttribute( name ) {
			return function ( stream, state ) {
				if ( stream.match( /^(?:"[^"]*"|'[^']*'|[^>/<{&~])+/ ) ) {
					return makeLocalStyle( 'mw-exttag-attribute mw-ext-' + name, state );
				}
				if ( stream.eat( '>' ) ) {
					state.extName = name;
					if ( name in mwConfig.tagModes ) {
						state.extMode = CodeMirror.getMode( config, mwConfig.tagModes[ name ] );
						state.extState = CodeMirror.startState( state.extMode );
					}
					state.tokenize = eatExtTagArea( name );
					return makeLocalStyle( 'mw-exttag-bracket mw-ext-' + name, state );
				}
				if ( stream.match( '/>' ) ) {
					state.tokenize = state.stack.pop();
					return makeLocalStyle( 'mw-exttag-bracket mw-ext-' + name, state );
				}
				return eatWikiText( 'mw-exttag-attribute mw-ext-' + name, '', true )( stream, state );
			};
		}

		function eatExtTagArea( name ) {
			return function ( stream, state ) {
				var origString = false,
					from = stream.pos,
					to,
					pattern = new RegExp( '</' + name + '\\s*>', 'i' ),
					m = pattern.exec( from ? stream.string.slice( from ) : stream.string );

				if ( m ) {
					if ( m.index === 0 ) {
						state.tokenize = eatExtCloseTag( name );
						state.extName = false;
						if ( state.extMode !== false ) {
							state.extMode = false;
							state.extState = false;
						}
						return state.tokenize( stream, state );
					}
					to = m.index + from;
					origString = stream.string;
					stream.string = origString.slice( 0, to );
				}

				state.stack.push( state.tokenize );
				state.tokenize = eatExtTokens( origString );
				return state.tokenize( stream, state );
			};
		}

		function eatExtCloseTag( name ) {
			return function ( stream, state ) {
				stream.next(); // eat <
				stream.next(); // eat /
				state.tokenize = eatTagName( name.length, true, false );
				return makeLocalStyle( 'mw-exttag-bracket mw-ext-' + name, state );
			};
		}

		function eatExtTokens( origString ) {
			return function ( stream, state ) {
				var ret;
				if ( state.extMode === false ) {
					ret = 'mw-exttag';
					stream.skipToEnd();
				} else {
					ret = 'mw-tag-' + state.extName;
					if ( [ 'pre', 'nowiki' ].includes( state.extName ) ) {
						ret += ( state.isStrike ? ' strike' : '' ) + ( isBold || state.isStrong ? ' strong' : '' ) +
							( isItalic || state.isEm ? ' em' : '' );
					}
					ret += ' ' + state.extMode.token( stream, state.extState );
				}
				if ( stream.eol() ) {
					if ( origString !== false ) {
						stream.string = origString;
					}
					state.tokenize = state.stack.pop();
				}
				return makeLocalStyle( ret, state );
			};
		}

		function eatStartTable( stream, state ) {
			stream.match( '{|' );
			stream.eatSpace();
			state.tokenize = inTableDefinition;
			return 'mw-table-bracket';
		}

		function inTableDefinition( stream, state ) {
			if ( stream.sol() ) {
				state.tokenize = inTable;
				return inTable( stream, state );
			}
			return eatWikiText( 'mw-table-definition', '' )( stream, state );
		}

		function inTableCaption( stream, state ) {
			if ( stream.sol() && stream.match( /^[\s\u00a0]*[|!]/, false ) ) {
				state.tokenize = inTable;
				return inTable( stream, state );
			}
			return eatWikiText( 'mw-table-caption', '' )( stream, state );
		}

		function inTable( stream, state ) {
			if ( stream.sol() ) {
				stream.eatSpace();
				if ( stream.eat( '|' ) ) {
					if ( stream.eat( '-' ) ) {
						stream.eatSpace();
						state.tokenize = inTableDefinition;
						return makeLocalStyle( 'mw-table-delimiter', state );
					}
					if ( stream.eat( '+' ) ) {
						stream.eatSpace();
						state.tokenize = inTableCaption;
						return makeLocalStyle( 'mw-table-delimiter', state );
					}
					if ( stream.eat( '}' ) ) {
						state.tokenize = state.stack.pop();
						return makeLocalStyle( 'mw-table-bracket', state );
					}
					stream.eatSpace();
					state.tokenize = eatTableRow( false, true );
					return makeLocalStyle( 'mw-table-delimiter', state );
				}
				if ( stream.eat( '!' ) ) {
					stream.eatSpace();
					state.tokenize = eatTableRow( true, true );
					return makeLocalStyle( 'mw-table-delimiter', state );
				}
			}
			return eatWikiText( '', '' )( stream, state );
		}

		function eatTableRow( isHead, expectAttr ) {
			return function ( stream, state ) {
				if ( stream.sol() ) {
					if ( stream.match( /^[\s\u00a0]*[|!]/, false ) ) {
						state.tokenize = inTable;
						return inTable( stream, state );
					}
				} else {
					if ( stream.match( /^[^'|{[<&~!]+/ ) ) {
						return makeStyle( isHead ? 'strong' : '', state );
					}
					if ( stream.match( '||' ) || isHead && stream.match( '!!' ) ) {
						isBold = false;
						isItalic = false;
						state.tokenize = eatTableRow( isHead, true );
						return makeLocalStyle( 'mw-table-delimiter', state );
					}
					if ( expectAttr && stream.eat( '|' ) ) {
						state.tokenize = eatTableRow( isHead, false );
						return makeLocalStyle( 'mw-table-delimiter2', state );
					}
				}
				return eatWikiText( isHead ? 'strong' : '', isHead ? 'strong' : '' )( stream, state );
			};
		}

		function eatFreeExternalLinkProtocol( stream, state ) {
			stream.match( urlProtocols );
			state.tokenize = eatFreeExternalLink;
			return makeStyle( 'mw-free-extlink-protocol', state );
		}

		function eatFreeExternalLink( stream, state ) {
			if ( stream.eol() ) {
				// @todo error message
			} else if ( stream.match( /^[^\s\u00a0{[\]<>~).,']*/ ) ) {
				if ( stream.peek() === '~' ) {
					if ( !stream.match( /^~{3,}/, false ) ) {
						stream.match( /^~*/ );
						return makeStyle( 'mw-free-extlink', state );
					}
				} else if ( stream.peek() === '{' ) {
					if ( !stream.match( /^\{\{/, false ) ) {
						stream.next();
						return makeStyle( 'mw-free-extlink', state );
					}
				} else if ( stream.peek() === '\'' ) {
					if ( !stream.match( '\'\'', false ) ) {
						stream.next();
						return makeStyle( 'mw-free-extlink', state );
					}
				} else if ( stream.match( /^[).,]+(?=[^\s\u00a0{[\]<>~).,])/ ) ) {
					return makeStyle( 'mw-free-extlink', state );
				}
			}
			state.tokenize = state.stack.pop();
			return makeStyle( 'mw-free-extlink', state );
		}

		function eatWikiText( style, mnemonicStyle, local ) {
			return function ( stream, state ) {
				var ch, tmp, mt, name, isCloseTag, tagname,
					sol = stream.sol();

				function chain( parser ) {
					state.stack.push( state.tokenize );
					state.tokenize = parser;
					return parser( stream, state );
				}

				if ( sol ) {
					if ( !stream.match( '//', false ) && stream.match( urlProtocols ) ) { // highlight free external links, bug T108448
						state.stack.push( state.tokenize );
						state.tokenize = eatFreeExternalLink;
						return ( local ? makeLocalStyle : makeStyle )( 'mw-free-extlink-protocol', state );
					}
					ch = stream.next();
					switch ( ch ) {
						case '-':
							if ( stream.match( /^----*/ ) ) {
								return 'mw-hr';
							}
							break;
						case '=':
							tmp = stream.match( /^(={0,5})(.+?(=\1\s*))$/ );
							if ( tmp ) { // Title
								stream.backUp( tmp[ 2 ].length );
								state.stack.push( state.tokenize );
								state.tokenize = eatSectionHeader( tmp[ 3 ].length );
								return 'mw-section-header line-cm-mw-section-' + ( tmp[ 1 ].length + 1 );
							}
							break;
						case '*':
						case '#':
							if ( stream.match( /^[*#]*:*/ ) ) {
								return 'mw-list';
							}
							break;
						case ':':
							if ( stream.match( /^:*{\|/, false ) ) { // Highlight indented tables :{|, bug T108454
								state.stack.push( state.tokenize );
								state.tokenize = eatStartTable;
							}
							if ( stream.match( /^:*[*#]*/ ) ) {
								return 'mw-indenting';
							}
							break;
						case ';':
							isBold = true;
							return 'mw-indenting';
						case ' ':
							if ( stream.match( /^[\s\u00a0]*:*{\|/, false ) ) { // Leading spaces is the correct syntax for a table, bug T108454
								stream.eatSpace();
								if ( stream.match( /^:+/ ) ) { // ::{|
									state.stack.push( state.tokenize );
									state.tokenize = eatStartTable;
									return 'mw-indenting';
								}
								stream.eat( '{' );
							} else {
								return 'mw-skipformatting';
							}
							// break is not necessary here
							// falls through
						case '{':
							if ( stream.eat( '|' ) ) {
								stream.eatSpace();
								state.stack.push( state.tokenize );
								state.tokenize = inTableDefinition;
								return 'mw-table-bracket';
							}
					}
				} else {
					ch = stream.next();
				}

				switch ( ch ) {
					case '&':
						return ( local ? makeLocalStyle : makeStyle )( eatMnemonic( stream, style, mnemonicStyle ), state );
					case '\'':
						if ( stream.match( /^'*(?=''''')/ ) || stream.match( /^'''(?!')/, false ) ) { // skip the irrelevant apostrophes ( >5 or =4 )
							break;
						}
						if ( stream.match( '\'\'' ) ) { // bold
							if ( !( firstsingleletterword || stream.match( '\'\'', false ) ) ) {
								prepareItalicForCorrection( stream );
							}
							isBold = !isBold;
							return makeLocalStyle( 'mw-apostrophes-bold', state );
						} else if ( stream.eat( '\'' ) ) { // italic
							isItalic = !isItalic;
							return makeLocalStyle( 'mw-apostrophes-italic', state );
						}
						break;
					case '[':
						if ( stream.eat( '[' ) ) { // Link Example: [[ Foo | Bar ]]
							stream.eatSpace();
							if ( /[^\]|[]/.test( stream.peek() ) ) {
								state.nLink++;
								state.stack.push( state.tokenize );
								state.tokenize = stream.match( /^[\s\u00a0]*(file|image|文件|[圖图]像|[档檔]案)[\s\u00a0]*:/i, false ) ? inFileLink : inLink;
								return makeLocalStyle( 'mw-link-bracket', state );
							}
						} else {
							mt = stream.match( urlProtocols );
							if ( mt ) {
								state.nLink++;
								stream.backUp( mt[ 0 ].length );
								state.stack.push( state.tokenize );
								state.tokenize = eatExternalLinkProtocol( mt[ 0 ].length );
								return makeLocalStyle( 'mw-extlink-bracket', state );
							}
						}
						break;
					case '{':
						if ( !stream.match( '{{{{', false ) && stream.match( '{{' ) ) { // Template parameter (skip parameters inside a template transclusion, Bug: T108450)
							stream.eatSpace();
							state.stack.push( state.tokenize );
							state.tokenize = inVariable;
							return makeLocalStyle( 'mw-templatevariable-bracket', state );
						} else if ( stream.match( /^\{[\s\u00a0]*/ ) ) {
							if ( stream.peek() === '#' ) { // Parser function
								state.nExt++;
								state.stack.push( state.tokenize );
								state.tokenize = inParserFunctionName;
								return makeLocalStyle( 'mw-parserfunction-bracket', state );
							}
							// Check for parser function without '#'
							name = stream.match( /^([^\s\u00a0}[\]<{'|&:]+)(:|[\s\u00a0]*)(\}\}?)?(.)?/ );
							if ( name ) {
								stream.backUp( name[ 0 ].length );
								if ( ( name[ 2 ] === ':' || name[ 4 ] === undefined || name[ 3 ] === '}}' ) && ( name[ 1 ].toLowerCase() in mwConfig.functionSynonyms[ 0 ] || name[ 1 ] in mwConfig.functionSynonyms[ 1 ] ) ) {
									state.nExt++;
									state.stack.push( state.tokenize );
									state.tokenize = inParserFunctionName;
									return makeLocalStyle( 'mw-parserfunction-bracket', state );
								}
							}
							// Template
							state.nTemplate++;
							state.stack.push( state.tokenize );
							state.tokenize = eatTemplatePageName( false );
							return makeLocalStyle( 'mw-template-bracket', state );
						}
						break;
					case '<':
						isCloseTag = !!stream.eat( '/' );
						tagname = stream.match( /^[^>/\s\u00a0.*,[\]{}$^+?|/\\'`~<=!@#%&()-]+/ );
						if ( stream.match( '!--' ) ) { // comment
							return chain( eatBlock( 'mw-comment', '-->' ) );
						}
						if ( tagname ) {
							tagname = tagname[ 0 ].toLowerCase();
							if ( tagname in mwConfig.tags ) { // Parser function
								if ( isCloseTag === true ) {
									// @todo message
									return 'error';
								}
								stream.backUp( tagname.length );
								state.stack.push( state.tokenize );
								state.tokenize = eatTagName( tagname.length, isCloseTag, false );
								return makeLocalStyle( 'mw-exttag-bracket mw-ext-' + tagname, state );
							}
							if ( tagname in permittedHtmlTags ) { // Html tag
								if ( isCloseTag === true && !RegExp( tagname, 'i').test( state.InHtmlTag.pop() ) ) {
									// @todo message
									return 'error';
								}
								if ( isCloseTag === true && tagname in voidHtmlTags ) {
									// @todo message
									return 'error';
								}
								stream.backUp( tagname.length );
								state.stack.push( state.tokenize );
								// || ( tagname in voidHtmlTags ) because opening void tags should also be treated as the closing tag.
								state.tokenize = eatTagName( tagname.length, isCloseTag || tagname in voidHtmlTags, true );
								return makeLocalStyle( 'mw-htmltag-bracket', state );
							}
							stream.backUp( tagname.length );
						}
						break;
					case '~':
						if ( stream.match( /^~{2,4}/ ) ) {
							return 'mw-signature';
						}
						break;
					case '_': // Maybe double undescored Magic Word as __TOC__
						tmp = 1;
						while ( stream.eat( '_' ) ) { // Optimize processing of many underscore symbols
							tmp++;
						}
						if ( tmp > 2 ) { // Many underscore symbols
							if ( !stream.eol() ) {
								stream.backUp( 2 ); // Leave last two underscore symbols for processing again in next iteration
							}
							return ( local ? makeLocalStyle : makeStyle )( style, state ); // Optimization: skip regex function at the end for EOL and backuped symbols
						} else if ( tmp === 2 ) { // Check on double underscore Magic Word
							name = stream.match( /^([^\s\u00a0>}[\]<{'|&:~]+?)__/ ); // The same as the end of function except '_' inside and with '__' at the end of string
							if ( name && name[ 0 ] ) {
								if ( '__' + name[ 0 ].toLowerCase() in mwConfig.doubleUnderscore[ 0 ] || '__' + name[ 0 ] in mwConfig.doubleUnderscore[ 1 ] ) {
									return 'mw-doubleUnderscore';
								}
								if ( !stream.eol() ) {
									stream.backUp( 2 ); // Two underscore symbols at the end can be begining of other double undescored Magic Word
								}
								return ( local ? makeLocalStyle : makeStyle )( style, state ); // Optimization: skip regex function at the end for EOL and backuped symbols
							}
						}
						break;
					default:
						if ( /[\s\u00a0]/.test( ch ) ) {
							stream.eatSpace();
							return ( local ? makeLocalStyle : makeStyle )( style, state );
						}
						stream.backUp( 1 );
						if ( stream.match( urlProtocols, false ) && !stream.match( '//' ) ) { // highlight free external links, bug T108448
							state.stack.push( state.tokenize );
							return eatFreeExternalLinkProtocol( stream, state );
						}
						stream.next();
						break;
				}
				stream.match( /^[^\s\u00a0_>}[\]<{'|&:~]+/ );
				return ( local ? makeLocalStyle : makeStyle )( style, state );
			};
		}

		/**
		 * Remembers position and status for rollbacking.
		 * It needed for change bold to italic with apostrophe before it if required
		 *
		 * see https://phabricator.wikimedia.org/T108455
		 *
		 * @param {Object} stream CodeMirror.StringStream
		 */
		function prepareItalicForCorrection( stream ) {
			// see Parser::doQuotes() in MediaWiki core, it works similar
			// firstsingleletterword has maximum priority
			// firstmultiletterword has medium priority
			// firstspace has low priority
			var end = stream.pos,
				str = stream.string.substr( 0, end - 3 ),
				x1 = str.substr( -1, 1 ),
				x2 = str.substr( -2, 1 );

			// firstsingleletterword olways is undefined here
			if ( x1 === ' ' ) {
				if ( firstmultiletterword || firstspace ) {
					return;
				}
				firstspace = end;
			} else if ( x2 === ' ' ) {
				firstsingleletterword = end;
			} else if ( firstmultiletterword ) {
				return;
			} else {
				firstmultiletterword = end;
			}
			// remember bold and italic state for restore
			mBold = isBold;
			mItalic = isItalic;
		}

		return {
			startState: function () {
				return { tokenize: eatWikiText( '', '' ), stack: [], InHtmlTag: [], extName: false, extMode: false,
				extState: false, nTemplate: 0, nLink: 0, nExt: 0 };
			},
			copyState: function ( state ) {
				return {
					tokenize: state.tokenize,
					stack: state.stack.concat( [] ),
					InHtmlTag: state.InHtmlTag.concat( [] ),
					extName: state.extName,
					extMode: state.extMode,
					extState: state.extMode !== false && CodeMirror.copyState( state.extMode, state.extState ),
					nTemplate: state.nTemplate,
					nLink: state.nLink,
					nExt: state.nExt,
					isStrike: state.isStrike,
					isStrong: state.isStrong,
					isEm: state.isEm
				};
			},
			token: function ( stream, state ) {
				var style, p, t, f,
					readyTokens = [],
					tmpTokens = [];

				if ( mTokens.length > 0 ) { // just send saved tokens till they exists
					t = mTokens.shift();
					stream.pos = t.pos;
					state = t.state;
					return t.style;
				}

				if ( stream.sol() && ![ 'pre', 'nowiki' ].includes( state.extName ) ) { // reset bold and italic status in every new line
					isBold = false;
					isItalic = false;
					firstsingleletterword = undefined;
					firstmultiletterword = undefined;
					firstspace = undefined;
				}

				do {
					style = state.tokenize( stream, state ); // get token style
					f = firstsingleletterword || firstmultiletterword || firstspace;
					if ( f ) { // rollback point exists
						if ( f !== p ) { // new rollbak point
							p = f;
							if ( tmpTokens.length > 0 ) { // it's not first rollbak point
								readyTokens = readyTokens.concat( tmpTokens ); // save tokens
								tmpTokens = [];
							}
						}
						tmpTokens.push( { // save token
							pos: stream.pos,
							style: style,
							state: CodeMirror.copyState( state.extMode ? state.extMode : 'mediawiki', state )
						} );
					} else { // rollback point not exists
						mStyle = style; // remember style before possible rollback point
						return style; // just return token style
					}
				} while ( !stream.eol() );

				if ( isBold && isItalic ) { // needs to rollback
					isItalic = mItalic; // restore status
					isBold = mBold;
					firstsingleletterword = undefined;
					firstmultiletterword = undefined;
					firstspace = undefined;
					if ( readyTokens.length > 0 ) { // it contains tickets before the point of rollback
						readyTokens[ readyTokens.length - 1 ].pos++; // add one apostrophe, next token will be italic (two apostrophes)
						mTokens = readyTokens; // for sending tokens till the point of rollback
					} else { // there are no tikets before the point of rollback
						stream.pos = tmpTokens[ 0 ].pos - 2; // eat( '\'')
						return mStyle; // send saved Style
					}
				} else { // not needs to rollback
					mTokens = readyTokens.concat( tmpTokens ); // send all saved tokens
				}
				// return first saved token
				t = mTokens.shift();
				stream.pos = t.pos;
				state = t.state;
				return t.style;
			},
			blankLine: function ( state ) {
				var ret;
				if ( state.extName ) {
					if ( state.extMode ) {
						ret = '';
						if ( state.extMode.blankLine ) {
							ret = ' ' + state.extMode.blankLine( state.extState );
						}
						return 'line-cm-mw-tag-' + state.extName + ret;
					}
					return 'line-cm-mw-exttag';
				}
			}
		};
	} );

	CodeMirror.defineMIME( 'text/mediawiki', 'mediawiki' );

	function eatNowiki() {
		return function ( stream ) {
			if ( stream.match( /^[^&]+/ ) ) {
				return '';
			}
			stream.next(); // eat &
			return eatMnemonic( stream, '', '' );
		};
	}

	function eatPre() {
		return function ( stream, state ) {
			if ( stream.eat( '&' ) ) {
				return eatMnemonic( stream, '', '' );
			}
			if ( stream.eat( '<' ) ) {
				if ( !state.nowiki && stream.match( 'nowiki>' ) || state.nowiki && stream.match( '/nowiki>' ) ) {
					state.nowiki = !state.nowiki;
					return 'mw-comment mw-ext-nowiki';
				}
				stream.match( /^[^&<}|-]+/ );
				return '';
			}
			if ( stream.match( '-{' ) ) {
				state.converter++;
				if ( stream.match( /^((?!(-{|}-)).)*\|/, false ) ) {
					state.flags.push( 1 );
				} else {
					state.flags.push( 0 );
				}
				return 'mw-lang-converter-bracket';
			}
			if ( state.converter < 0 ) {
				stream.eat( '-' );
				stream.match( /^[^&<-]+/ );
				return '';
			}
			if ( stream.match( '}-' ) ) {
				state.converter--;
				state.flags.pop();
				return 'mw-lang-converter-bracket';
			}
			if ( [ 0, 2 ].includes( state.flags[ state.converter ] ) ) {
				stream.match( /^[^&<}-]+/ ) || stream.next();
				return '';
			}
			if ( stream.eat( '|' ) ) {
				state.flags[ state.converter ] = 2;
				return 'mw-lang-converter-delimiter';
			}
			stream.next();
			stream.match( /^[^&<|]+/ );
			return 'mw-lang-converter-flag';
		};
	}

	CodeMirror.defineMode( 'mw-tag-pre', function ( /* config, parserConfig */ ) {
		return {
			startState: function () { return { converter: -1, flags: [] }; },
			token: eatPre()
		};
	} );

	CodeMirror.defineMode( 'mw-tag-nowiki', function ( /* config, parserConfig */ ) {
		return {
			startState: function () { return {}; },
			token: eatNowiki()
		};
	} );

}( CodeMirror ) );