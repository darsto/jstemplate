<div id="main">
    <div>Val inside #main: "${$some_var}"</div>
    {for i = 0; i < 3; i++}
    {assign obj = { name: 'test ' + $i }}
    {hascontent}
    <div onclick="console.log('pressed ' + {serialize $obj.name})">
        <span>${$i} + 1 = </span>
        {content}
        {if $i != 1 && true == true}
        <span class="{if $i == 2}test{/if}">${$i + 1}</span>
        {/if}
        {/content}
    </div>
    {/hascontent}
    {/for}
</div>
<div id="to-reload">Val inside #to-reload: "${$some_var}"</div>

{literal}
<style>
    .test {
        font-weight: bold;
    }
</style>
{/literal}
