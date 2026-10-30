import { test, expect } from '@playwright/test';

// Read assembled visible text, not merely the lang attribute or an isolated
// catalogue fragment. These phrases previously produced broken sentences.
const expected = {
  nl: ['Bedrijfswebsites en landingspagina’s', 'Portfolio’s en inhoudelijke websites', 'Webshops en boekingswebsites', 'Op maat gemaakte webapplicaties'],
  fr: ['Sites professionnels et pages de présentation', 'Portfolios et sites éditoriaux', 'Boutiques en ligne et sites de réservation', 'Applications web sur mesure'],
  de: ['Unternehmenswebsites und Landingpages', 'Portfolios und Inhaltswebsites', 'Onlineshops und Buchungswebsites', 'Individuelle Webanwendungen'],
};

for (const locale of ['nl', 'fr', 'de']) {
  test(`${locale} assembled copy keeps natural headings, identities, and deposit meaning`, async ({ page }) => {
    await page.goto(`/${locale}/websites/`);
    const headings = await page.locator('.service-row h2').allInnerTexts();
    expect(headings.map((value) => value.replace(/\s+/g, ' ').trim())).toEqual(expected[locale]);
    await page.goto(`/${locale}/websites/examples/`);
    for (const brand of ['Fieldwork', 'Forma', 'Objects', 'Still']) {
      await expect(page.locator(`a[href*="template=${brand === 'Fieldwork' ? 'local' : brand === 'Forma' ? 'portfolio' : brand === 'Objects' ? 'shop' : 'booking'}"]`).first()).toContainText(brand);
    }
    await page.goto(`/${locale}/team/`);
    expect((await page.locator('h1').innerText()).replace(/\s+/g, ' ').trim()).toBe({
      nl: 'Maak kennis met de mensen achter Hotwire.', fr: 'Découvrez les personnes derrière Hotwire.', de: 'Lernen Sie die Menschen hinter Hotwire kennen.',
    }[locale]);
    await page.goto(`/${locale}/websites/examples/booking/`);
    expect((await page.locator('.demo-hero h1').innerText()).replace(/\s+/g, ' ').trim()).toBe({
      nl: 'Een beetje ruimte om tot rust te komen.', fr: 'Un peu d’espace pour ralentir.', de: 'Ein wenig Raum, um zur Ruhe zu kommen.',
    }[locale]);
    expect((await page.locator('#space h2').innerText()).replace(/\s+/g, ' ').trim()).toBe({
      nl: 'Ruimte om meer jezelf te zijn.', fr: 'Un espace pour être davantage vous-même.', de: 'Raum, um ganz Sie selbst zu sein.',
    }[locale]);
    await page.goto(`/${locale}/websites/agreement/`);
    const copy = await page.locator('main').innerText();
    expect(copy).toMatch({ nl: /daadwerkelijk ontvangen/, fr: /effectivement encaissé/, de: /tatsächlichen Eingang der Anzahlung/ }[locale]);
    expect(copy).toMatch(/50\s*%/);
    expect(copy).toContain('Max Hermanelei 55');
    expect(copy).toContain('Brasschaat 2930');
    await expect(page).toHaveTitle(/Hotwire Interactive$/);
  });
}
