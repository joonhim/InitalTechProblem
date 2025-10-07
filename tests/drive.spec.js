const { test, expect } = require('@playwright/test');

// -------------------- Helpers --------------------

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function login(page, creds) {
  var email = (creds && creds.email) ? creds.email : 'admin';
  var password = (creds && creds.password) ? creds.password : 'password123';

  await page.goto('/');

  // Fill login
  await page.fill('input[type="text"], input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');

  // Wait for unique H1 in the banner (avoid sidebar H2 duplicate)
  await expect(
    page.getByRole('banner').getByRole('heading', { level: 1, name: 'Web Application' })
  ).toBeVisible();

  // Optional: ensure first column renders
  await expect(page.getByRole('heading', { name: /to ?do/i })).toBeVisible({ timeout: 10000 });
}

async function navigateToSection(page, sectionName) {
  // Try a link first
  var link = page.getByRole('link', { name: new RegExp('^' + escapeRegex(sectionName) + '\\b', 'i') });
  if (await link.count()) {
    await link.first().click();
    return;
  }

  // Sidebar uses BUTTONs whose accessible name includes title + subtitle
  // e.g., "Mobile Application Native mobile app development"
  var btn = page.getByRole('button', { name: new RegExp('^' + escapeRegex(sectionName) + '\\b', 'i') });
  if (await btn.count()) {
    await btn.first().click();
    return;
  }

  // Last resort: click visible text
  await page.getByText(new RegExp('^' + escapeRegex(sectionName) + '$', 'i')).first().click();
}

async function getColumn(page, columnName) {
  // Prefer: column wrapper that has a direct <h2> with the column name
  var heading = page.locator('div:has(> h2:has-text("' + columnName + '"))').first();
  if (await heading.count()) return heading;

  // Fallbacks if layout changes
  var h2 = page.locator('h2').filter({ hasText: new RegExp('^' + escapeRegex(columnName) + '$', 'i') }).first();
  if (await h2.count()) return h2.locator('..');

  var region = page.getByRole('region', { name: new RegExp('^' + escapeRegex(columnName) + '$', 'i') });
  if (await region.count()) return region.first();

  return page; // last resort; assertions later will fail if wrong
}

async function findCardInColumn(page, columnName, taskTitle) {
  var column = await getColumn(page, columnName);
  await expect(column, 'Expected column "' + columnName + '" to be visible').toBeVisible();

  var titleLocator = column.locator('h3', { hasText: taskTitle }).first();
  var card = titleLocator.locator('..');
  await expect(card, 'Expected "' + taskTitle + '" to appear in "' + columnName + '"').toBeVisible();

  return card;
}

async function assertCardTitle(card, expectedTitle) {
  var actual = (await card.locator('h3').innerText()).trim();
  console.log('Found card title: "' + actual + '"');
  expect(actual).toBe(expectedTitle);
}

async function assertTagsOnCard(card, tagsArray) {
  var i;
  for (i = 0; i < tagsArray.length; i++) {
    var tag = tagsArray[i];
    var tagSpan = card.locator('span', { hasText: tag }).first();
    var text = (await tagSpan.innerText()).trim();
    console.log('Found tag: "' + text + '"');
    expect(text).toBe(tag);
  }
}

// -------------------- Test Cases --------------------

var scenarios = [
  { name: 'TC1 Web: Implement user authentication', section: 'Web Application',   column: 'To Do',       task: 'Implement user authentication', tags: ['Feature', 'High Priority'] },
  { name: 'TC2 Web: Fix navigation bug',            section: 'Web Application',   column: 'To Do',       task: 'Fix navigation bug',           tags: ['Bug'] },
  { name: 'TC3 Web: Design system updates',         section: 'Web Application',   column: 'In Progress', task: 'Design system updates',        tags: ['Design'] },
  { name: 'TC4 Mobile: Push notification system',   section: 'Mobile Application',column: 'To Do',       task: 'Push notification system',     tags: ['Feature'] },
  { name: 'TC5 Mobile: Offline mode',               section: 'Mobile Application',column: 'In Progress', task: 'Offline mode',                 tags: ['Feature', 'High Priority'] },
  { name: 'TC6 Mobile: App icon design',            section: 'Mobile Application',column: 'Done',        task: 'App icon design',              tags: ['Design'] },
  { name: 'TC7 Marketing: Social media',            section: 'Marketing Campaign',column: 'To Do',       task: 'Social media calendar',        tags: ['Feature'] },
  { name: 'TC8 Marketing: Email campaign',          section: 'Marketing Campaign',column: 'In Progress', task: 'Email campaign',               tags: ['Design', 'High Priority'] }
];

// -------------------- Tests --------------------

test.describe('Data-driven board checks', function () {
  test.beforeEach(async function ({ page }) {
    await login(page);
  });

  // Classic for-loop to avoid array shorthands
  var i;
  for (i = 0; i < scenarios.length; i++) {
    (function (s) {
      test(s.name, async function ({ page }) {
        console.log('----- Running: ' + s.name + ' -----');

        // Navigate if needed (sidebar uses BUTTONs)
        if (s.section !== 'Web Application') {
          await navigateToSection(page, s.section);
          await expect(
            page.getByRole('banner').getByRole('heading', { level: 1, name: s.section })
          ).toBeVisible();
        }

        // Scope to the required column, then find/validate the card and its tags
        var card = await findCardInColumn(page, s.column, s.task);
        await assertCardTitle(card, s.task);
        await assertTagsOnCard(card, s.tags);

        // Small pause to watch each scenario in non-headless runs
        await page.waitForTimeout(500);
      });
    })(scenarios[i]);
  }
});
