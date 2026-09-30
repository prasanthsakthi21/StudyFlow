const { translate } = require('google-translate-api-x');

async function test() {
    try {
        const res = await translate('Hello world', { to: 'ta' });
        console.log(res.text); // Should print Tamil
    } catch (e) {
        console.error(e);
    }
}

test();
