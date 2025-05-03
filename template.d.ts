/**
 * JSTemplate compiler.
 * The template text is obtained from `Template.tpl_finder()` which
 * needs to be set first by the caller.
 * The templates are then instantiated with `new Template("my-template")`.
 */
export default class Template {
  /** @type {?function(string): string} */
  static tpl_finder: ((arg0: string) => string) | null;

  /** @type {number} */
  id: number;
  /** @type {string} */
  name: string;
  /** @type {HTMLTemplateElement} */
  tpl_el: HTMLTemplateElement;
  /** @type {HTMLElement} */
  dst_el: HTMLElement;
  /** @type {?function(Template, Record<string, any>): string} */
  func: ((arg0: Template, arg1: Record<string, any>) => string) | null;
  /** @type {?Record<string, any>} */
  args: Record<string, any> | null;
  /** @type {?function(Element): void} */
  compile_cb: ((arg0: Element) => void) | null;

  /**
   * Create a new compiler instance for a single template
   * @param {string} name
   */
  constructor(name: string);
  /**
   * Obtain template source (via `Template.tpl_finder`), parse it,
   * and create an inner Function() that can output the final HTML.
   */
  compile(): void;
  /**
   * Compile the template (if it wasn't compiled yet),
   * evaluate it with given args, then assign it to a single
   * DIV element which is returned
   * @param {Record<string, any>} args
   * @returns {HTMLElement}
   */
  run(args?: Record<string, any>): HTMLElement;
  /**
   * Run querySelector() on the DIV element returned from `Template.run()`
   * and replace it with a recompiled & re-evaluated HTML from matching
   * part of the template.
   * @param {string} selector
   * @param {Record<string, any>} new_args
   */
  reload(selector: string, new_args?: Record<string, any>): false | undefined;
  /**
   * Drop a static reference to this Template
   */
  remove(): void;

  /**
   * Transform raw JSTemplate text into a string that can be passed
   * to new Function() which returns the final HTML.
   * @param {string} str
   * @returns {string}
   */
  static build(str: string): string;
}
