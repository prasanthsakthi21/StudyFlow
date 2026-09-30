const googleTTS = require('google-tts-api');
const fs = require('fs');
const path = require('path');

async function testTTS() {
    console.log("Testing TTS...");
    const text = "This is a test of the automatic text to speech generation system. It should be able to handle reasonably long text without crashing. Let's make this string a bit longer to ensure it triggers any multi-chunk logic if applicable, although 200 chars is the usual limit for single requests.";

    try {
        console.log("Text length:", text.length);

        // Test getAllAudioBase64
        const results = await googleTTS.getAllAudioBase64(text, {
            lang: 'en',
            slow: false,
            host: 'https://translate.google.com',
            timeout: 10000,
        });

        console.log("Results chunks:", results.length);

        const combinedBuffer = Buffer.concat(results.map(r => Buffer.from(r.base64, 'base64')));
        console.log("Combined Buffer size:", combinedBuffer.length);

        const outFile = path.join(__dirname, 'test_audio.mp3');
        fs.writeFileSync(outFile, combinedBuffer);
        console.log("✅ Audio file written to:", outFile);

        // Clean up
        fs.unlinkSync(outFile);
        console.log("✅ Cleanup successful");

    } catch (e) {
        console.error("❌ TTS Test Failed:", e);
    }
}

testTTS();
