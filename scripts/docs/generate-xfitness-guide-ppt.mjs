import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = parseArgs(process.argv.slice(2));
const contentPath = path.resolve(args.content ?? path.join(__dirname, "xfitness-guide-content.json"));
const outputPath = path.resolve(args.out ?? path.join(process.cwd(), "outputs", "xfitness-webapp-guide-mobile.pptx"));
const previewDir = path.resolve(args["preview-dir"] ?? path.join(process.cwd(), "tmp", "preview", "ppt"));
const layoutDir = path.resolve(args["layout-dir"] ?? path.join(process.cwd(), "tmp", "layout", "ppt"));
const montagePath = path.resolve(args.montage ?? path.join(previewDir, "deck-montage.webp"));

const theme = {
  slide: { width: 1080, height: 1920 },
  page: { left: 72, right: 72, top: 148, bottom: 1768, width: 936, height: 1620 },
  colors: {
    background: "#090b0f",
    surface: "#131821",
    surfaceAlt: "#171d26",
    border: "#2b313d",
    text: "#f8f4ea",
    muted: "#c6c0b5",
    accent: "#ff6b2c",
    highlight: "#c0ff4f",
    soft: "#f1e8d3",
    darkText: "#140a06"
  },
  type: {
    title: 82,
    titleCompact: 72,
    body: 30,
    bodySmall: 24,
    cardTitle: 28,
    cardBody: 21,
    eyebrow: 18,
    footer: 17
  }
};

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      continue;
    }

    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] = true;
      continue;
    }

    parsed[key] = next;
    index += 1;
  }
  return parsed;
}

function box(slide, position, fill, borderFill = theme.colors.border, borderWidth = 1, radius = "rounded-3xl") {
  return slide.shapes.add({
    geometry: "roundRect",
    position,
    fill,
    line: { style: "solid", fill: borderFill, width: borderWidth },
    borderRadius: radius
  });
}

function lineBox(slide, position, fill, radius = "rounded-full") {
  return slide.shapes.add({
    geometry: "roundRect",
    position,
    fill,
    line: { style: "solid", fill, width: 0 },
    borderRadius: radius
  });
}

function textBox(slide, position, text, style = {}) {
  const shape = slide.shapes.add({
    geometry: "textbox",
    position,
    fill: "none",
    line: { style: "solid", fill: "none", width: 0 }
  });
  shape.text = text;
  shape.text.style = {
    fontSize: theme.type.body,
    color: theme.colors.text,
    typeface: "Aptos",
    wrap: "square",
    autoFit: "shrinkText",
    ...style
  };
  return shape;
}

function pill(slide, x, y, label, options = {}) {
  const width = options.width ?? Math.max(140, 34 + label.length * 10.5);
  box(
    slide,
    { left: x, top: y, width, height: options.height ?? 48 },
    options.fill ?? theme.colors.surfaceAlt,
    options.borderFill ?? theme.colors.border,
    options.borderWidth ?? 1,
    options.radius ?? "rounded-full"
  );
  textBox(
    slide,
    { left: x + 18, top: y + 8, width: width - 36, height: (options.height ?? 48) - 16 },
    label,
    {
      fontSize: options.fontSize ?? 18,
      color: options.color ?? theme.colors.soft,
      bold: options.bold ?? true,
      alignment: "center"
    }
  );
}

async function imageBytes(projectRoot, relativePath) {
  const absolutePath = path.resolve(projectRoot, relativePath);
  const bytes = await fs.readFile(absolutePath);
  return {
    blob: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    contentType: getContentType(relativePath)
  };
}

function getContentType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".png") {
    return "image/png";
  }
  if (extension === ".webp") {
    return "image/webp";
  }
  return "image/jpeg";
}

function addHeader(slide, titleText) {
  box(
    slide,
    { left: 72, top: 34, width: 936, height: 88 },
    theme.colors.surface,
    theme.colors.border,
    1,
    "rounded-full"
  );

  box(
    slide,
    { left: 92, top: 48, width: 56, height: 56 },
    theme.colors.accent,
    theme.colors.accent,
    0,
    "rounded-full"
  );

  textBox(
    slide,
    { left: 104, top: 58, width: 36, height: 28 },
    "XF",
    {
      fontSize: 20,
      bold: true,
      color: theme.colors.darkText,
      alignment: "center"
    }
  );

  textBox(
    slide,
    { left: 164, top: 50, width: 540, height: 32 },
    "Xfitness Guide",
    {
      fontSize: 28,
      bold: true,
      color: theme.colors.text
    }
  );

  textBox(
    slide,
    { left: 164, top: 78, width: 540, height: 22 },
    titleText,
    {
      fontSize: theme.type.eyebrow,
      color: theme.colors.muted
    }
  );

  box(
    slide,
    { left: 922, top: 48, width: 56, height: 56 },
    theme.colors.surfaceAlt,
    theme.colors.border,
    1,
    "rounded-full"
  );
  lineBox(slide, { left: 938, top: 63, width: 24, height: 4 }, theme.colors.text);
  lineBox(slide, { left: 938, top: 76, width: 24, height: 4 }, theme.colors.text);
  lineBox(slide, { left: 938, top: 89, width: 24, height: 4 }, theme.colors.text);
}

function addFooter(slide, navSections, currentNav, pageIndex, pageCount) {
  box(
    slide,
    { left: 72, top: 1780, width: 936, height: 92 },
    theme.colors.surface,
    theme.colors.border,
    1,
    "rounded-full"
  );

  const chips = navSections;
  const gap = 8;
  const chipWidth = 136;
  const startX = 80;

  chips.forEach((section, index) => {
    const x = startX + index * (chipWidth + gap);
    const active = section.id === currentNav;
    pill(slide, x, 1802, section.label, {
      width: chipWidth,
      height: 48,
      fill: active ? theme.colors.accent : theme.colors.surfaceAlt,
      borderFill: active ? theme.colors.accent : theme.colors.border,
      color: active ? theme.colors.darkText : theme.colors.soft,
      fontSize: 14,
      bold: true
    });
  });

  textBox(
    slide,
    { left: 944, top: 1833, width: 50, height: 22 },
    `${String(pageIndex + 1).padStart(2, "0")} / ${String(pageCount).padStart(2, "0")}`,
    {
      fontSize: theme.type.footer,
      color: theme.colors.muted,
      alignment: "right"
    }
  );
}

function getTitleMetrics(title) {
  if (title.length > 84) {
    return {
      fontSize: 58,
      titleHeight: 286,
      bodyTop: 470,
      bodyHeight: 106,
      contentStart: 604
    };
  }

  if (title.length > 64) {
    return {
      fontSize: 62,
      titleHeight: 254,
      bodyTop: 446,
      bodyHeight: 102,
      contentStart: 576
    };
  }

  if (title.length > 48) {
    return {
      fontSize: 68,
      titleHeight: 226,
      bodyTop: 424,
      bodyHeight: 98,
      contentStart: 550
    };
  }

  return {
    fontSize: 74,
    titleHeight: 206,
    bodyTop: 406,
    bodyHeight: 92,
    contentStart: 526
  };
}

function addTitleBlock(slide, page) {
  const metrics = getTitleMetrics(page.title);

  textBox(
    slide,
    { left: 72, top: 158, width: 936, height: 36 },
    page.eyebrow.toUpperCase(),
    {
      fontSize: theme.type.eyebrow,
      bold: true,
      color: theme.colors.highlight
    }
  );

  textBox(
    slide,
    { left: 72, top: 208, width: 936, height: metrics.titleHeight },
    page.title,
    {
      fontSize: metrics.fontSize,
      bold: true,
      color: theme.colors.text,
      typeface: "Aptos Display",
      lineSpacing: 0.94
    }
  );

  textBox(
    slide,
    { left: 72, top: metrics.bodyTop, width: 936, height: metrics.bodyHeight },
    page.body,
    {
      fontSize: 28,
      color: theme.colors.muted,
      lineSpacing: 1.12
    }
  );

  return metrics;
}

function addBulletPanel(slide, heading, items, position) {
  box(slide, position, theme.colors.surface, theme.colors.border, 1, "rounded-3xl");
  textBox(
    slide,
    { left: position.left + 24, top: position.top + 24, width: position.width - 48, height: 30 },
    heading,
    {
      fontSize: 26,
      color: theme.colors.text,
      bold: true
    }
  );

  const paragraphs = items.map((item) => ({
    bulletCharacter: "•",
    marginLeft: 24,
    indent: -12,
    spaceAfter: 16,
    runs: [
      {
        run: item,
        textStyle: {
          fontSize: "22pt",
          color: theme.colors.muted
        }
      }
    ]
  }));

  const shape = slide.shapes.add({
    geometry: "textbox",
    position: {
      left: position.left + 24,
      top: position.top + 72,
      width: position.width - 48,
      height: position.height - 96
    },
    fill: "none",
    line: { style: "solid", fill: "none", width: 0 }
  });
  shape.text = paragraphs;
  shape.text.style = {
    fontSize: theme.type.bodySmall,
    color: theme.colors.muted,
    typeface: "Aptos",
    wrap: "square",
    autoFit: "shrinkText"
  };
}

function addCallouts(slide, cards, x, y, width) {
  const height = 152;
  const gap = 18;

  cards.forEach((card, index) => {
    const top = y + index * (height + gap);
    box(slide, { left: x, top, width, height }, theme.colors.surfaceAlt, theme.colors.border, 1, "rounded-3xl");
    textBox(
      slide,
      { left: x + 22, top: top + 18, width: width - 44, height: 24 },
      card.label.toUpperCase(),
      {
        fontSize: 17,
        bold: true,
        color: theme.colors.highlight
      }
    );
    textBox(
      slide,
      { left: x + 22, top: top + 42, width: width - 44, height: 54 },
      card.value,
      {
        fontSize: 28,
        bold: true,
        color: theme.colors.text,
        typeface: "Aptos Display"
      }
    );
    textBox(
      slide,
      { left: x + 22, top: top + 92, width: width - 44, height: 46 },
      card.body,
      {
        fontSize: 20,
        color: theme.colors.muted,
        lineSpacing: 1.08
      }
    );
  });
}

async function addImageCard(slide, projectRoot, relativePath, position, alt, fit = "cover") {
  box(slide, position, theme.colors.surfaceAlt, theme.colors.border, 1, "rounded-3xl");
  const source = await imageBytes(projectRoot, relativePath);
  slide.images.add({
    ...source,
    alt,
    fit,
    position: {
      left: position.left,
      top: position.top,
      width: position.width,
      height: position.height
    },
    geometry: "roundRect",
    borderRadius: "rounded-3xl"
  });
}

function addRouteBar(slide, route) {
  pill(slide, 72, 988, `Where to find it: ${route}`, {
    width: 500,
    height: 54,
    fill: theme.colors.accent,
    borderFill: theme.colors.accent,
    color: theme.colors.darkText,
    fontSize: 18
  });
}

async function renderCover(slide, page, content) {
  await addImageCard(
    slide,
    content.meta.projectRoot,
    page.image,
    { left: 72, top: 164, width: 936, height: 860 },
    page.title
  );

  textBox(
    slide,
    { left: 72, top: 1064, width: 936, height: 34 },
    page.eyebrow.toUpperCase(),
    {
      fontSize: theme.type.eyebrow,
      bold: true,
      color: theme.colors.highlight
    }
  );

  textBox(
    slide,
    { left: 72, top: 1110, width: 936, height: 260 },
    page.title,
    {
      fontSize: 86,
      bold: true,
      color: theme.colors.text,
      typeface: "Aptos Display",
      lineSpacing: 0.94
    }
  );

  textBox(
    slide,
    { left: 72, top: 1370, width: 936, height: 96 },
    page.body,
    {
      fontSize: 30,
      color: theme.colors.muted,
      lineSpacing: 1.12
    }
  );

  let chipX = 72;
  let chipY = 1506;
  page.chips.forEach((chip, index) => {
    const width = Math.max(176, 40 + chip.length * 11);
    if (chipX + width > 1008) {
      chipX = 72;
      chipY += 62;
    }
    pill(slide, chipX, chipY, chip, {
      width,
      height: 50,
      fill: index === 0 ? theme.colors.accent : theme.colors.surfaceAlt,
      borderFill: index === 0 ? theme.colors.accent : theme.colors.border,
      color: index === 0 ? theme.colors.darkText : theme.colors.soft,
      fontSize: 18
    });
    chipX += width + 14;
  });
}

function renderOverview(slide, page) {
  const metrics = addTitleBlock(slide, page);
  const columnWidth = 456;
  const cardHeight = 214;
  const gapX = 24;
  const gapY = 24;
  const startY = Math.max(550, metrics.contentStart + 14);

  page.cards.forEach((card, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const left = 72 + column * (columnWidth + gapX);
    const top = startY + row * (cardHeight + gapY);

    box(slide, { left, top, width: columnWidth, height: cardHeight }, theme.colors.surface, theme.colors.border, 1, "rounded-3xl");
    textBox(
      slide,
      { left: left + 24, top: top + 22, width: columnWidth - 48, height: 40 },
      card.title,
      {
        fontSize: theme.type.cardTitle,
        bold: true,
        color: theme.colors.text,
        typeface: "Aptos Display"
      }
    );
    pill(slide, left + 24, top + 68, card.route, {
      width: columnWidth - 48,
      height: 40,
      fill: theme.colors.surfaceAlt,
      borderFill: theme.colors.border,
      color: theme.colors.soft,
      fontSize: 16
    });
    textBox(
      slide,
      { left: left + 24, top: top + 122, width: columnWidth - 48, height: 72 },
      card.body,
      {
        fontSize: theme.type.cardBody,
        color: theme.colors.muted,
        lineSpacing: 1.08
      }
    );
  });
}

async function renderJourney(slide, page, content) {
  const metrics = addTitleBlock(slide, page);
  const imageTop = Math.max(550, metrics.contentStart + 16);
  await addImageCard(
    slide,
    content.meta.projectRoot,
    page.image,
    { left: 72, top: imageTop, width: 936, height: 336 },
    page.title
  );

  const cardWidth = 456;
  const cardHeight = 158;
  const gapX = 24;
  const gapY = 22;
  const startY = imageTop + 376;

  page.steps.forEach((step, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const left = 72 + column * (cardWidth + gapX);
    const top = startY + row * (cardHeight + gapY);

    box(slide, { left, top, width: cardWidth, height: cardHeight }, theme.colors.surface, theme.colors.border, 1, "rounded-3xl");
    box(
      slide,
      { left: left + 20, top: top + 22, width: 52, height: 52 },
      theme.colors.accent,
      theme.colors.accent,
      0,
      "rounded-full"
    );
    textBox(
      slide,
      { left: left + 30, top: top + 34, width: 32, height: 22 },
      String(index + 1),
      {
        fontSize: 22,
        bold: true,
        color: theme.colors.darkText,
        alignment: "center"
      }
    );
    textBox(
      slide,
      { left: left + 88, top: top + 26, width: cardWidth - 110, height: 98 },
      step,
      {
        fontSize: 24,
        color: theme.colors.text,
        lineSpacing: 1.06
      }
    );
  });
}

async function renderFeature(slide, page, content) {
  const metrics = addTitleBlock(slide, page);
  const imageTop = Math.max(548, metrics.contentStart + 20);
  await addImageCard(
    slide,
    content.meta.projectRoot,
    page.image,
    { left: 72, top: imageTop, width: 936, height: 430 },
    page.title
  );
  pill(slide, 72, imageTop + 456, `Where to find it: ${page.route}`, {
    width: 500,
    height: 54,
    fill: theme.colors.accent,
    borderFill: theme.colors.accent,
    color: theme.colors.darkText,
    fontSize: 18
  });
  const panelsTop = imageTop + 542;
  addBulletPanel(slide, "What this area does", page.bullets, { left: 72, top: panelsTop, width: 506, height: 620 });
  addCallouts(slide, page.callouts, 602, panelsTop, 406);
}

async function renderDiagram(slide, page, content) {
  const metrics = addTitleBlock(slide, page);
  const top = Math.max(548, metrics.contentStart + 18);

  await addImageCard(
    slide,
    content.meta.projectRoot,
    page.image,
    { left: 604, top, width: 404, height: 268 },
    page.title
  );

  const nodeX = 72;
  const nodeY = top;
  const nodeWidth = 486;
  const nodeHeight = 152;
  const nodeGap = 18;

  page.nodes.forEach((node, index) => {
    const top = nodeY + index * (nodeHeight + nodeGap);
    box(slide, { left: nodeX, top, width: nodeWidth, height: nodeHeight }, theme.colors.surface, theme.colors.border, 1, "rounded-3xl");
    pill(slide, nodeX + 20, top + 18, `0${index + 1}`, {
      width: 66,
      height: 36,
      fill: theme.colors.accent,
      borderFill: theme.colors.accent,
      color: theme.colors.darkText,
      fontSize: 16
    });
    textBox(
      slide,
      { left: nodeX + 20, top: top + 60, width: nodeWidth - 40, height: 34 },
      node.title,
      {
        fontSize: 26,
        bold: true,
        color: theme.colors.text
      }
    );
    textBox(
      slide,
      { left: nodeX + 20, top: top + 92, width: nodeWidth - 40, height: 42 },
      node.body,
      {
        fontSize: 20,
        color: theme.colors.muted,
        lineSpacing: 1.06
      }
    );
  });

  addBulletPanel(slide, "What keeps the app connected", page.bullets, {
    left: 604,
    top: top + 290,
    width: 404,
    height: 678
  });
}

async function renderChecklist(slide, page, content) {
  const metrics = addTitleBlock(slide, page);
  const imageTop = Math.max(548, metrics.contentStart + 16);
  await addImageCard(
    slide,
    content.meta.projectRoot,
    page.image,
    { left: 72, top: imageTop, width: 936, height: 250 },
    page.title
  );

  const panelTop = imageTop + 282;
  addBulletPanel(slide, "Member rhythm", page.memberTasks, {
    left: 72,
    top: panelTop,
    width: 456,
    height: 664
  });
  addBulletPanel(slide, "Owner rhythm", page.ownerTasks, {
    left: 552,
    top: panelTop,
    width: 456,
    height: 664
  });
  addBulletPanel(slide, "Support notes", page.supportNotes, {
    left: 72,
    top: panelTop + 686,
    width: 936,
    height: 214
  });
}

async function buildPresentation(content) {
  const presentation = Presentation.create({
    slideSize: theme.slide
  });

  const pages = content.pages;

  for (const [index, page] of pages.entries()) {
    const slide = presentation.slides.add();
    slide.background.fill = theme.colors.background;
    addHeader(slide, page.eyebrow);
    addFooter(slide, content.navSections, page.nav, index, pages.length);

    if (page.layout === "cover") {
      await renderCover(slide, page, content);
      continue;
    }

    if (page.layout === "overview") {
      renderOverview(slide, page);
      continue;
    }

    if (page.layout === "journey") {
      await renderJourney(slide, page, content);
      continue;
    }

    if (page.layout === "diagram") {
      await renderDiagram(slide, page, content);
      continue;
    }

    if (page.layout === "checklist") {
      await renderChecklist(slide, page, content);
      continue;
    }

    await renderFeature(slide, page, content);
  }

  return presentation;
}

async function exportAssets(presentation) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.mkdir(previewDir, { recursive: true });
  await fs.mkdir(layoutDir, { recursive: true });

  for (const [index, slide] of presentation.slides.items.entries()) {
    const stem = `slide-${String(index + 1).padStart(2, "0")}`;
    const previewBlob = await presentation.export({ slide, format: "png", scale: 1 });
    await fs.writeFile(path.join(previewDir, `${stem}.png`), new Uint8Array(await previewBlob.arrayBuffer()));

    const layoutBlob = await slide.export({ format: "layout" });
    await fs.writeFile(path.join(layoutDir, `${stem}.layout.json`), await layoutBlob.text());
  }

  const montage = await presentation.export({
    format: "webp",
    montage: true,
    scale: 1
  });
  await fs.mkdir(path.dirname(montagePath), { recursive: true });
  await fs.writeFile(montagePath, new Uint8Array(await montage.arrayBuffer()));

  const pptx = await PresentationFile.exportPptx(presentation);
  await pptx.save(outputPath);
}

async function main() {
  const raw = await fs.readFile(contentPath, "utf8");
  const content = JSON.parse(raw);
  const presentation = await buildPresentation(content);
  await exportAssets(presentation);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
