# In-browser javascript template parser

This is a javascript equivalent of PHP template language used in [Woltlab Suite Core](https://docs.woltlab.com/view_templates.html).

The template code is transformed to a javascript Function which returns a valid HTML as a string. The code is roughly 160 lines long, written in ES6. Parts of the template can be recompiled and re-evaluated, making this a unique feature of this parser.

Let's take a look at the example (full version in `demo.html` inside this repo)

```
<div>Val inside #main: "{@$some_var}"</div>
{for i = 0; i < 3; i++}
	{assign obj = { name: 'test ' + $i \}}
	{if $i != 1}
		<div onclick="console.log('pressed ' + {serialize $obj.name})">
			<span class="{if $i == 2}test{/if}">{@$i}</span>
		</div>
	{/if}
{/for}

{@@
<style>
.test { font-weight: bold; }
</style>
@@}
```

## Syntax

* Code in curly brackets `{}` gets evaluated as javascript
* `{@code}` gets evaluated and the return value is appended to HTML. The most common use case is putting the value of a variable inside HTML, e.g. `{@$my_obj.name}`
* `{assing var_name = value}` sets a new variable to be used inside template as `$var_name`. The variable scope is template-wide
* `{for i = 0; i < 3; i++}` iterates with `$i` as readable iterator. Similar for `{for pen of $pens}` or `{for field of $object}`, with $pen and $field available inside the loop. Each of those must be terminated with `{/for}`
* `{if expression}` ...
* `{serialize $var_name}` this makes the compile-time variable accessible at runtime, e.g. in an `onclick` handler. Obviously a javascript object can't be directly referenced in an HTML text, but this parser uses a simple trick to make the object accessible with a static path.
* `{hascontent}{content}{/content}{/hascontent}` similar to Woltlab templates, `{hascontent}` is a conditional that is only visible if there's any text between the two `{content}` tags (whitespaces not included).
* `{@@ text_here @@}` text_here is appended to the HTML without any additional parsing
* **Note:** all closing curly brackets in the javascript blocks `{}` need to be escaped with a `\`, otherwise they end the block. `{@@` doesn't have this limitation and can contain `}` just fine.

## JS usage

```
const tpl = new Template('tpl-test');
/* 'tpl-test' is the DOM element id, e.g.
 * <script id="tpl-test" type="text/x-jstemplate">
 * ...template contents here
 * </script>
 */

/* This transforms the tpl into a javascript function
 * optional -> would be automatically run on first tpl.run();
 */
tpl.compile();

const els = tpl.run({ some_var: 'initial' });
document.body.append(...els);

/* replace all elements of `els` that match the '.test' selector.
 * If there are any variables used, they can be temporarily overwritten
 * with the second param (optional).
 */
tpl.reload('.test', { some_var: 'reloaded' });
```
