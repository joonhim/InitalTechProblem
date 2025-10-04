const { test, expect } = require('@playwright/test');

// ---- Login helper ----
async function login(page, { email = 'admin', password = 'password123' } = {}) {
  await page.goto('/');

  // Fill login form
  await page.fill('input[type="text"], input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');

  // Wait for the unique H1 inside the banner, avoids sidebar duplicate <h2>
  await expect(
    page.getByRole('banner').getByRole('heading', { level: 1, name: 'Web Application' })
  ).toBeVisible();

  // Optional: ensure first column ("To Do") is visible before continuing
  await expect(page.getByRole('heading', { name: 'To Do' })).toBeVisible();
}

// ---- Test scenarios ----
const scenarios = [
  {
    name: 'TC1 Web: Implement user authentication',
    section: 'Web Application',
    column: 'To Do',
    task: 'Implement user authentication',
    tags: ['Feature', 'High Priority'],
  },
  {
    name: 'TC2 Web: Fix navigation bug',
    section: 'Web Application',
    column: 'To Do',
    task: 'Fix navigation bug',
    tags: ['Bug'],
  },
  {
    name: 'TC3 Web: Design system updates',
    section: 'Web Application',
    column: 'In Progress',
    task: 'Design system updates',
    tags: ['Design'],
  },
  {
    name: 'TC4 Mobile: Push notification system',
    section: 'Mobile Application',
    column: 'To Do',
    task: 'Push notification system',
    tags: ['Feature'],
  },
  {
    name: 'TC5 Mobile: Offline mode',
    section: 'Mobile Application',
    column: 'In Progress',
    task: 'Offline mode',
    tags: ['Feature', 'High Priority'],
  },
  {
    name: 'TC6 Mobile: App icon design',
    section: 'Mobile Application',
    column: 'Done',
    task: 'App icon design',
    tags: ['Design'],
  },
  {
    name: 'TC7 Marketing: Social media',
    section: 'Marketing Campaign',
    column: 'To Do',
    task: 'Social media calendar',
    tags: ['Feature'],
  },
  {
    name: 'TC8 Marketing: Email campaign',
    section: 'Marketing Campaign',
    column: 'In Progress',
    task: 'Email campaign',
    tags: ['Design', 'High Priority'],
  },
];
//Helper
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function navigateToSection(page, sectionName) {
  // Try a link first (some UIs use links)
  const link = page.getByRole('link', { name: new RegExp(`^${escapeRegex(sectionName)}\\b`, 'i') });
  if (await link.count()) {
    await link.first().click();
    return;
  }

  // Sidebar uses a BUTTON whose accessible name includes the title + subtitle
  // e.g. "Mobile Application Native mobile app development"
  const btn = page.getByRole('button', { name: new RegExp(`^${escapeRegex(sectionName)}\\b`, 'i') });
  await btn.first().click();
}


// ---- Tests ----
test.describe('Data-driven board checks', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  for (const s of scenarios) {
    test(s.name, async ({ page }) => {
      //Navigate
      if (s.section !== 'Web Application') {
        await navigateToSection(page, s.section);
        await expect(
          page.getByRole('banner').getByRole('heading', { level: 1, name: s.section })
        ).toBeVisible();
      }

      //Narrow search to the right column
      const column = page.locator('div:has(> h2:has-text("' + s.column + '"))').first();
      await expect(column).toBeVisible();
      await page.waitForTimeout(1500);

      const card = column.locator('h3', { hasText: s.task }).locator('..');
      await expect(card).toBeVisible();
      await page.waitForTimeout(1500);

      //Validate card title text and log it
      const cardTitle = (await card.locator('h3').innerText()).trim();
      console.log(`Found card title: "${cardTitle}"`);
      expect(cardTitle).toBe(s.task);

      //Validate and log tags
      for (const tag of s.tags) {
        const tagText = (await card.locator('span', { hasText: tag }).innerText()).trim();
        console.log(`Found tag: "${tagText}"`);
        expect(tagText).toBe(tag);
      }
    });
  }
});
