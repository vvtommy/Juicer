test('slash and quote should be escaped', function() {
    var result = juicer('${hi}\\"', {hi: 'world'});
    ok(result === 'world\\"', 'Passed!');
});

test('should ignore undefined variable', function() {
    var result = juicer('${hi}', {});
    ok(result === '', 'Passed!');
});

test('should ignore undefined variable', function() {
    var result = juicer('${hi}', {});
    ok(result === '', 'Passed!');
});

test('enable cache', function() {
    var result = juicer('${hiCache}');
    ok(result === juicer('${hiCache}'), 'Passed!');
});

test('disable cache', function() {
    juicer.set('cache', false);
    var result = juicer('${hiDisableCache}');
    ok(result !== juicer('${hiDisableCache}'), 'Passed!');
});

test('variable escape', function() {
    var result = juicer('${hiEscape}', {hiEscape: '<span>'});
    ok(result === '&lt;span&gt;', 'Passed!');
});

test('variable no-escape', function() {
    var result = juicer('$${hiNoEscape}', {hiNoEscape: '<span>'});
    ok(result === '<span>', 'Passed!');
});

test('strip', function() {
    var result = juicer('${hiStrip}\r\n', {hiStrip: 'hello world'});
    ok(result === 'hello world  ', 'Passed!');
});

test('no-strip', function() {
    juicer.set('strip', false);
    var result = juicer('${hiNoStrip}\r\n', {hiNoStrip: 'hello world'});
    ok(result === 'hello world\r\n', 'Passed!');
});

test('id support and if-else statement', function() {
    var result = juicer('#juicer-tmpl');
    ok(result.render({benben: 'cc', hello: 'hello world'}).replace(/\s+/igm, '') === 'helloworld', 'Passed!');
    ok(result.render({benben: '.cc', hello: 'hello world'}).replace(/\s+/igm, '') === 'helloworld.cc', 'Passed!');
    ok(result.render({benben: '.us', hello: 'hello world'}).replace(/\s+/igm, '') === 'helloworld.jp', 'Passed!');
});

test('each statement [Array]', function() {
    var result = juicer('{@each list as o, i}${o},${i};{@/each}');
    ok(result.render({list: ['a', 'b', 'c']}) === 'a,0;b,1;c,2;', 'Passed!');
});

test('each statement [Object]', function() {
    var result = juicer('{@each list as o, i}${o},${i};{@/each}');
    ok(result.render({list: {'k1': 'v1', 'k2': 'v2', 'k3': 'v3'}}) === 'v1,k1;v2,k2;v3,k3;', 'Passed!');
});

test('multi-layer each statement with multi-layer if statement', function() {
    var result = juicer('{@each list as item}{@each item.arr as o, i}{@if item.arr.length === 3}${o},${i};{@else}{@if o === "h"}${o},${i};{@/if}{@/if}{@/each}{@/each}');
    var data = {list: [{arr: ['a', 'b', 'c']}, {arr: ['d', 'e', 'f']}, {arr: ['g', 'h']}]};
    ok(result.render(data) === 'a,0;b,1;c,2;d,0;e,1;f,2;h,1;', 'Passed!');
});

test('comment statement', function() {
    var result = juicer('{# comment here} ${hello} {# end comment}');
    ok(result.render({hello: 'world'}) === ' world ', 'Passed!');
});

test('range statement', function() {
    var result = juicer('{@each i in range(5, 10)}${i}{@/each}', {});
    ok(result === '56789', 'Passed!');
});

test('custom functions with register and unregister', function() {
    var result = juicer('${hello | fn}');
    var fn = function(s) {
        return s + '.';
    };
    juicer.register('fn', fn);
    ok(result.render({hello: 'world'}) === 'world.', 'Passed!');
    juicer.unregister('fn');
    if(navigator.appVersion.indexOf('MSIE') != -1) {
        var ieVersion = navigator.appVersion.match(/MSIE\s*?(\d)/i)[1];
        if(ieVersion <= 8) {
            raises(function() {result.render({hello: 'world'})}, 'lower IE8 will throw error to pass!');
            return;
        }
    }
    ok(result.render({hello: 'world'}) === '', 'Passed!');
});

test('custom functions, but using native function without register (IE8+)', function() {
    var result = juicer('${hello | encodeURIComponent}');
    if(navigator.appVersion.indexOf('MSIE') != -1) {
        juicer.register('encodeURIComponent', encodeURIComponent);
    }
    ok(result.render({hello: 'world#!'}) === 'world%23!', 'Passed!');
});

test('deep lexical analyze - if', function() {
    var result = juicer('{@if a == b}${a}{@/if}{@if b < c}${c}{@/if}{@if a || d}${d}{@/if}{@if a && d}${a}{@/if}', {a: 1, b: 1, c: 2, d: 0});
    ok(result === '120', 'Passed!');
});

test('deep lexical analyze - elseif', function() {
    var result = juicer('{@if a == b}X{@else if encodeURIComponent(content) === "CC%26DD"}$${content}{@/if}', {a: 1, b: 2, content: 'CC&DD'});
    ok(result === 'CC&DD', 'Passed!');
});

test('deep lexical analyze - true / function', function() {
    var result = juicer('{@if a === true}true{@/if}{@if encodeURIComponent(b) === "%26"}function{@/if}', {a: true, b: '&'});
    ok(result === 'truefunction', 'Passed!');
});

test('support arguments when using helper function, like ${vo.key | fn, arg1, agr2, agr3}', function() {
    var result;
    juicer.register('argumentsTest', function(val, arg1, arg2, arg3) {
        return val + '.' + arg1 + arg2 + arg3;
    });
    result = juicer('${argumentsTestValue | argumentsTest, 1, 2, "three"}', {argumentsTestValue: 'argumentsTestValue&'});
    ok(result === 'argumentsTestValue&amp;.12three', 'Passed!');
});

test('custom tag for if-else and interpolate', function() {
    juicer.set({
        'tag::operationOpen': '{{%',
        'tag::operationClose': '}}',
        'tag::interpolateOpen': '&{{',
        'tag::interpolateClose': '}}'
    });
    var result = juicer('{{%if list.length > 3}}&{{list[5]}}{{%/if}}', {list: [1,2,3,4,5,6]});
    ok(result === '6', 'Passed!');
});
