# JSTemplate

Use javascript variables, loops, and minor bits of logic together with HTML.
Parts of the HTML can be reloaded at any time with a querySelector-like API.

```
<div class="myclass">Value: ${$some_var}</div>
{for i = 0; i < 3; i++}
	{assign obj = { name: 'test ' + $i }}
	{if $i != 1}
		<div onclick="console.log('pressed ' + ${serialize $obj.name})">
			<span class="{if $i == 2}test{/if}">${$i}</span>
		</div>
	{/if}
{/for}
```

```
Template.tpl_finder = (name) => { ... return found_template_text; };
const tpl = new Template('tpl-test');

const tpl_div = tpl.run({ some_var: 'initial' });
/* this is a plain div with the evaluated template inside */
document.body.append(tpl_div);

/* reload a part of `tpl_div` that matches the '.myclass' selector.
 * If there are any variables used, they can be overwritten with the
 * second param (optional).
 */
tpl.reload('.myclass', { some_var: 'reloaded' });
```


The above will `querySelector('.myclass')` in the template code, re-evaluate it,
then `querySelector('.myclass')` in the old generated HTML and replace it.

See a full example here:
[selfcontained.html](https://github.com/darsto/jstemplate/blob/master/examples/selfcontained.html).

jstemplate is based on the PHP template language used in
[Woltlab Suite Core](https://docs.woltlab.com/view_templates.html),
which itself is based on the [PHP Smarty](https://www.smarty.net) template language.

The template code is transformed to a valid HTML element which can be processed
with the regular querySelector DOM API. The code is roughly 150 lines long,
written in ES6 in a single file, and boils down to a chain of RegEx-es.

## Syntax

* Code in curly braces `{}` as well as `{{}}` gets evaluated as javascript. `{}` may
  contain up to one nested braces - i.e. `{console.log({ key: "value" }}`. `{{}}` may
  contain any number of nested braces.
* `${code}` or `${{code}}` - after evaluation, `code` gets stringified and inserted to
  HTML as text (escaped HTML).
* `${@code}` - same as above, but doesn't escape HTML tags.
* `$variable` inside code refers to a variable passed to `Template.run()` or `Template.reload()`.
* `{assign var_name = value}` sets a new variable to be used inside template as `$var_name`.
  The variable is persisted inside the template.
* `{for i = 0; i < 3; i++}` iterates with `$i` as readable iterator. Similarly,
  `{for pen of $pens}` or `{for field of $object}`, with `$pen` and `$field` available
  inside the loop. Each of those must be terminated with `{/for}`
* `{if expression}` Must be terminated with `{/if}`
* `{include other.tpl}` will be substituted with the contents of `Template("other.tpl")`
* `${serialize $obj.selected}` this makes the compile-time variable accessible at runtime,
   e.g. in an `onclick` handler. A javascript `$obj` can't be directly referenced in
   HTML text, but `serialize` generates a path to it starting from the global scope
   (Template.get_by_id()...).
* `{hascontent}{content}{/content}{/hascontent}` a conditional only visible if there's
  any text between the two `{content}` tags (whitespaces not included).
* `{literal}text_here{/literal}` `text_here` is appended to the HTML without any additional parsing.
* `{* comment *}` is stripped from the final HTML.
* **Note:** unlike the Smarty language, whitespace makes no difference to the template parsing.
