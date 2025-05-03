/* SPDX-License-Identifier: MIT
 * Copyright(c) 2019-2025 Darek Stojaczyk
 */

/** @module */
/* @ts-self-types="./template.d.ts" */
"use strict";

/**
 * JSTemplate compiler.
 * The template text is obtained from `Template.tpl_finder()` which
 * needs to be set first by the caller.
 * The templates are then instantiated with `new Template("my-template")`.
 */
class Template {
	/** @type {?function(string): string} */
	static tpl_finder;

	/** @type {number} */
	id;
	/** @type {string} */
	name;
	/** @type {HTMLTemplateElement} */
	tpl_el;
	/** @type {HTMLElement} */
	dst_el;

	/** @type {?function(Template, Record<string, any>): string} */
	func;
	/** @type {?Record<string, any>} */
	args;

	/** @type {?function(Element): void} */
	compile_cb;
	/** @internal @private @type {string[]} */
	tpl_code_blocks = [];
	/** @internal @private @type {Map<any, number>} */
	var_map = new Map();
	/** @internal @private @type {any[]} */
	vars = [];

	/**
	 * Create a new compiler instance for a single template
	 * @param {string} name
	 */
	constructor(name) {
		this.id = Template.tpl_map_idx++;
		this.name = name;
		this.tpl_el = document.createElement("template");
		this.dst_el = document.createElement("div");
		this.dst_el.jsTemplate = this;
		Template.tpl_map.set(this.id, this);
	}

	/**
	 * Obtain template source (via `Template.tpl_finder`), parse it,
	 * and create an inner Function() that can output the final HTML.
	 */
	compile() {
		const tpl_script = Template.tpl_finder ? Template.tpl_finder(this.name) : undefined;
		if (tpl_script === undefined) {
			throw new Error("Template script " + this.name + " doesn't exist");
		}
		const script_text = tpl_script;

		const code_blocks = [];
		const tpl_html = script_text
			.replace(
				/* comment */
				/{\*(.*?)\/*}/g, "",
			)
			.replace(
				/* raw text block */
				/{literal}(.*?){\/literal}/g,
				(_match, content) => {
					return content
						.replace(/{/g, "&#123;").replace(
							/}/g,
							"&#125;", /* mangle braces so they're not processed below */
						);
				},
			)
			.replace(
				/* the regex is explained inside build() */
				/\$?{{([\s\S]*?)}}|{([^{}]*(?:\{[^}]*\}[^{}]*)*)\}/g,
				(_match, contentDouble, contentSingle) => {
					/* replace with $JSTx to obtain valid HTML syntax; */
					const type = contentDouble ? "D" : "S";
					const idx = code_blocks.push(contentDouble ?? contentSingle) - 1;
					return `$__JST${type}${idx}`;
				},
			);
		this.tpl_el.innerHTML = tpl_html;
		this.tpl_code_blocks = code_blocks;

		const f_text = Template.build(script_text);
		this.func = new Function("tpl", "local", f_text);
	}

	/**
	 * Compile the template (if it wasn't compiled yet),
	 * evaluate it with given args, then assign it to a single
	 * DIV element which is returned
	 * @param {Record<string, any>} args
	 * @returns {HTMLElement}
	 */
	run(args = {}) {
		if (!this.func) {
			this.compile();
		}

		this.args = args;
		const html_str = this.func(this, args);
		this.dst_el.innerHTML = html_str;
		if (this.compile_cb) {
			this.compile_cb(this.dst_el);
		}
		return this.dst_el;
	}

	/**
	 * Run querySelector() on the DIV element returned from `Template.run()`
	 * and replace it with a recompiled & re-evaluated HTML from matching
	 * part of the template.
	 * @param {string} selector
	 * @param {Record<string, any>} new_args
	 */
	reload(selector, new_args = {}) {
		const raw = this.tpl_el.content.querySelector(selector);
		const real = this.dst_el.querySelector(selector);
		if (!raw || !real) {
			return false;
		}

		/* expand $JSTx variables into jstemplate syntax */
		const tpl_str = raw.outerHTML
			.replace(
				/\$__JST([DS])([0-9]+)/g,
				(_match, type, idxString) => {
					const idx = parseInt(idxString);
					const content = this.tpl_code_blocks[idx];
					if (type === "D") {
						return "{{" + content + "}}";
					} else {
						return "{" + content + "}";
					}
				},
			);
		const new_fn_text = Template.build(tpl_str);
		const new_fn = new Function("tpl", "local", new_fn_text);

		Object.assign(this.args, new_args);
		const new_real = document.createElement("template");
		new_real.innerHTML = new_fn(this, this.args);

		const new_el = new_real.content.firstElementChild;
		real.replaceWith(new_el);

		if (this.compile_cb) {
			this.compile_cb(new_el);
		}
	}

	/**
	 * Drop a static reference to this Template
	 */
	remove() {
		Template.tpl_map.delete(this.id);
	}

	/** @internal @private @type {Map<number, Template>} */
	static tpl_map = new Map();
	/** @internal @private @type {number} */
	static tpl_map_idx = 1;

	/**
	 * @internal
	 * @private
	 * @returns {number|undefined}
	 */
	get_var_id(obj) {
		let id = this.var_map.get(obj);
		if (id == undefined) {
			id = this.vars.push(obj) - 1;
			this.var_map.set(obj, id);
		}
		return id;
	}

	/**
	 * @internal
	 * @private
	 * @param {number} id
	 * @returns {Template|undefined}
	 */
	static get_by_id(id) {
		return Template.tpl_map.get(id);
	}

	/**
	 * @internal
	 * @private
	 * @param {string} name
	 * @param {any} args
	 * @returns {string}
	 */
	static include_tpl(name, args) {
		const tpl = new Template(name);
		tpl.compile();
		const ret = tpl.func(tpl, args);
		tpl.remove();
		return ret;
	}

	/**
	 * @internal
	 * @private
	 * @param {string} input
	 * @returns {string}
	 */
	static escape_html(input) {
		return input.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/( {2,})/g,
				(_match, content) => {
					const count = content.length;
					return "&nbsp;".repeat(count - 1) + " ";
				});
	}

	/**
	 * Transform raw JSTemplate text into a string that can be passed
	 * to new Function() which returns the final HTML.
	 * @param {string} str
	 * @returns {string}
	 */
	static build(str) {
		const append_s = "\nout += ";
		const content = str
			.replace(/(^\s+|\s+$)/gm, " " /* trim each line (tabs & spaces) */)
			.replace(/\n/g, " " /* don't break `out` with multi-line strings */)
			.replace(/"/g, '\\"' /* escape double quotes */)
			.replace(
				/* comment */
				/{\*(.*?)\/*}/g, "",
			)
			.replace(
				/* raw text block */
				/{literal}(.*?){\/literal}/g,
				(_match, content) => {
					return content
						.replace(/{/g, "&#123;").replace(
							/}/g,
							"&#125;", /* mangle braces so they're not processed below */
						);
				},
			)
			.replace(
				/* ${ ... }; allow up to one pair of braces inside,
				 * also, ${{ ... }}; which may contain any number of braces */
				/\$?{{([\s\S]*?)}}|\$?{([^{}]*(?:\{[^}]*\}[^{}]*)*)\}/g,
				(match, contentDouble, contentSingle) => {
					let content = contentDouble ?? contentSingle;
					let doEscapeHtml = true;
					content = content
						.replace(/^@/, (_match) => {
							doEscapeHtml = false;
							return "";
						})
						.replace(
							/\\"/g,
							'"', /* don't escape double quotes -> they're real strings now */
						)
						.replace(/\$/g, "local." /* $ variable access */)
						.replace(/^assign (.*)$/, "local.$1;" /* setup new $ variable */)
						.replace(
							/^(?:foreach|for) \s*(.*?)\s*=(.*?);(.*?);(.*?)$/,
							'{const __bn="$1"; const __b=local[__bn]; for (let $1 =$2;$3;$4) { local[__bn] = $1;', /* make the local variable available with $variable syntax, so also backup the previous value of local[var_name] */
						)
						.replace(
							/^(?:foreach|for) (.*) (of|in) (.*)$/,
							'{const __bn="$1"; const __b=local[__bn]; for (const $1 $2 $3) { local[__bn] = $1;',
						)
						.replace(
							/^\/(foreach|for)$/g,
							"}; local[__bn] = __b; };", /* restore local[var_name] from before the loop */
						)
						.replace(/^if (.*)$/g, ";if ($1) {")
						.replace(/^else$/g, "} else {")
						.replace(/^else if (.*)$/g, "} else if ($1) {")
						.replace(/^\/if$/g, "}")
						.replace(/^serialize (.*)$/g, (_match, content) => {
							doEscapeHtml = false;
							return '"Template.get_by_id(" + tpl.id + ").vars[" + tpl.get_var_id(' +
								content + ') + "]"';
						})
						.replace(
							/^hascontent$/g,
							"{const __b = out; let __hc = false; {",
						)
						.replace(/^content$/g, "{ const __b = out; {")
						.replace(/^\/content$/g, "} __hc = __b != out; }")
						.replace(/^\/hascontent$/g, "} if (!__hc) out = __b; }")
						.replace(/^include (.*)$/g, (_match, content) => {
							return Template.include_tpl(content);
						});

					const doRender = match.startsWith("$");
					if (doRender) {
						if (doEscapeHtml) {
							content = Template.escape_html(content);
						}
						return '";\n' + append_s + "(" + content + ");" + append_s + '"';
					} else {
						return '";\n' + content + append_s + '"';
					}
				},
			)
			.replace(/&#123;/g, "{").replace(/&#125;/g, "}" /* un-mangle braces */)
			.replace(/\\}/g, "}" /* get rid of escaped braces */);

		return "'use strict';\nlet out = \"" + content + '";\nreturn out;';
	}
}

/** For internal use (generated javascript) */
globalThis.Template = Template;
