#!/usr/bin/env node
/**
 * Post-deploy health check for Overworld Online (drbango.com/world).
 * Opens the page in headless Chrome, waits for Unity to load, and
 * reports any console errors/exceptions.
 *
 * Usage:
 *   node post-deploy-check.js [url] [--wait=seconds]
 *
 * Requires: npm i puppeteer (or npx puppeteer)
 */

const puppeteer = require('puppeteer');

const URL = process.argv[2] || 'https://drbango.com/world';
const WAIT_SECS = parseInt((process.argv.find(a => a.startsWith('--wait=')) || '--wait=30').split('=')[1]);

(async () => {
    console.log(`\n🔍 Post-deploy check: ${URL}`);
    console.log(`   Waiting ${WAIT_SECS}s for Unity to load...\n`);

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-gpu']
    });

    const page = await browser.newPage();

    const errors = [];
    const warnings = [];
    let unityLoaded = false;

    // Capture console messages
    page.on('console', msg => {
        const text = msg.text();
        const type = msg.type();

        if (type === 'error') {
            errors.push(text);
        } else if (type === 'warning') {
            warnings.push(text);
        }

        // Detect Unity load completion
        if (text.includes('LoadAllPrefabs took') || text.includes('Player loaded at')) {
            unityLoaded = true;
        }
    });

    // Capture page errors (uncaught exceptions)
    page.on('pageerror', err => {
        errors.push(`[PageError] ${err.message}`);
    });

    // Navigate
    try {
        await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    } catch (e) {
        console.error(`FAIL: Could not load page: ${e.message}`);
        await browser.close();
        process.exit(2);
    }

    // Wait for Unity to initialize
    await new Promise(r => setTimeout(r, WAIT_SECS * 1000));

    await browser.close();

    // --- Report ---
    const criticalErrors = errors.filter(e =>
        e.includes('Exception') ||
        e.includes('NullReference') ||
        e.includes('SerializationException') ||
        e.includes('Error:') ||
        e.includes('FAILED')
    );

    // Filter out known harmless WebGL warnings
    const realErrors = errors.filter(e =>
        !e.includes('favicon.ico') &&
        !e.includes('Content-Encoding') &&
        !e.includes('INVALID_ENUM: getInternalformatParameter')
    );

    console.log('═══════════════════════════════════════');
    console.log(`Unity loaded: ${unityLoaded ? 'YES' : 'NO'}`);
    console.log(`Console errors: ${realErrors.length}`);
    console.log(`Critical errors: ${criticalErrors.length}`);
    console.log(`Warnings: ${warnings.length}`);
    console.log('═══════════════════════════════════════');

    if (criticalErrors.length > 0) {
        console.log('\n🚨 CRITICAL ERRORS:');
        criticalErrors.forEach((e, i) => console.log(`  ${i + 1}. ${e.substring(0, 200)}`));
    }

    if (realErrors.length > 0 && realErrors.length <= 20) {
        console.log('\n⚠️  ALL ERRORS:');
        realErrors.forEach((e, i) => console.log(`  ${i + 1}. ${e.substring(0, 200)}`));
    } else if (realErrors.length > 20) {
        console.log(`\n⚠️  ${realErrors.length} errors (showing first 10):`);
        realErrors.slice(0, 10).forEach((e, i) => console.log(`  ${i + 1}. ${e.substring(0, 200)}`));
    }

    if (!unityLoaded) {
        console.log('\n🚨 Unity did NOT finish loading within the timeout!');
    }

    if (criticalErrors.length === 0 && unityLoaded) {
        console.log('\n✅ DEPLOY HEALTHY — no critical errors, Unity loaded successfully.');
        process.exit(0);
    } else {
        console.log('\n❌ DEPLOY UNHEALTHY — fix errors before shipping.');
        process.exit(1);
    }
})();
