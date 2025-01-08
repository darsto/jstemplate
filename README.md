# JavaScript template parser for HTML

Embed javascript variables, loops, and minor bits of logic together with HTML.

```
<div class="myclass">Value: {@$some_var}</div>
{for i = 0; i < 3; i++}
	{assign obj = { name: 'test ' + $i \}}
	{if $i != 1}
		<div onclick="console.log('pressed ' + {serialize $obj.name})">
			<span class="{if $i == 2}test{/if}">{@$i}</span>
		</div>
	{/if}
{/for}
```

Parts of the HTML can be reloaded at any time with a querySelector-like API:

```
my_tpl_args.some_var = "updated value";
my_tpl.reload('.myclass');
```

The above will `querySelector('.myclass')` in the template code, re-evaluate it,
then `querySelector('.myclass')` in the old generated HTML and replace it.

See `demo.html` for a full example.

jstemplate is a javascript equivalent of PHP template language used in
[Woltlab Suite Core](https://docs.woltlab.com/view_templates.html),
which itself is based on [PHP Smarty](https://www.smarty.net) template language.

The template code is transformed to a valid HTML element which can be processed
with the regular querySelector DOM API. The code is roughly 150 lines long,
written in ES6 in a single file, and boils down to a chain of RegEx-es.

## Syntax

* Code in curly brackets `{}` gets evaluated as javascript
* `{@code}` `code` gets stringified and appended to HTML.
* `{assing var_name = value}` sets a new variable to be used inside template as `$var_name`. The variable scope is template-wide
* `{for i = 0; i < 3; i++}` iterates with `$i` as readable iterator. Similarly, `{for pen of $pens}` or `{for field of $object}`, with `$pen` and `$field` available inside the loop. Each of those must be terminated with `{/for}`
* `{if expression}` Must be terminated with `{/if}`
* `{serialize $obj.selected}` this makes the compile-time variable accessible at runtime, e.g. in an `onclick` handler. A javascript `$obj` can't be directly referenced in an HTML text, but `serialize` generates a path to it starting from the global scope (Template.get_by_id()...).
* `{hascontent}{content}{/content}{/hascontent}` a conditional only visible if there's any text between the two `{content}` tags (whitespaces not included).
* `{@@ text_here @@}` `text_here` is appended to the HTML without any additional parsing
* **Note:** all closing curly brackets in the javascript blocks `{}` need to be escaped with a `\`, otherwise they end the block. `{@@` doesn't have this limitation and can contain `}` just fine.

## JS usage

```
const tpl = new Template('tpl-test');
/* 'tpl-test' is the DOM element id, e.g.
 * <script id="tpl-test" type="text/x-jstemplate">
 * ...template contents here
 * </script>
 */

const tpl_div = tpl.run({ some_var: 'initial' });
/* this is a plain div with evaluated template inside */
document.body.append(tpl_div);

/* reload a part of `tpl_div` that matches the '.test' selector.
 * If there are any variables used, they can be temporarily overwritten
 * with the second param (optional).
 */
tpl.reload('.test', { some_var: 'reloaded' });
```
