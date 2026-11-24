const USER_AGENT = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0 Safari/537.36";
const PAGE_STATE = /window\.__myx = (\{.*?\});?\s*<\/script>/s;
const IMAGE_SIZE = "h_720,q_90,w_540";

const pageState = async (path) => {
  const response = await fetch(`https://www.myntra.com/${path}`, {
    headers: { "user-agent": USER_AGENT, "accept-language": "en-IN,en;q=0.9" },
  });
  const match = (await response.text()).match(PAGE_STATE);
  if (!match) throw new Error(`no page state at /${path} (HTTP ${response.status})`);
  return JSON.parse(match[1]);
};

const plainText = (html) =>
  html.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

const sizeOf = (size) => {
  const seller = size.sizeSellerData?.[0];
  return {
    label: size.label,
    inStock: size.available && Boolean(seller?.availableCount),
    left: seller?.availableCount ?? 0,
    garment: Object.fromEntries(
      (size.measurements ?? []).filter((m) => m.type === "GARMENT").map((m) => [m.name, Number(m.value)]),
    ),
    body: Object.fromEntries(
      (size.measurements ?? []).filter((m) => m.type === "BODY").map((m) => [m.name, Number(m.value)]),
    ),
  };
};

const pollsOf = (state) =>
  (state.pdpData?.ratings?.aggregatedQuestionsAndAnswers ?? []).map(
    (q) =>
      `${q.question.text_for_pdp} (${q.total_count_for_question} buyers): ` +
      q.answers_with_count
        .filter((a) => a.count)
        .map((a) => `${a.option.text_for_pdp} ${a.percentage}%`)
        .join(", "),
  );

const reviewsOf = (state) =>
  (state.reviewsData?.reviews ?? [])
    .map((r) => ({ stars: r.userRating, text: plainText(r.review ?? r.reviewText ?? "").slice(0, 400) }))
    .filter((r) => r.text.length > 8);

const product = async (id) => {
  const [{ pdpData: p }, reviewState] = await Promise.all([pageState(id), pageState(`reviews/${id}`)]);
  return {
    id: p.id,
    site: "Myntra",
    url: `https://www.myntra.com/${p.id}`,
    brand: p.brand.name,
    name: p.name,
    color: p.baseColour,
    articleType: p.analytics.articleType,
    price: p.price.discounted,
    mrp: p.price.mrp,
    rating: p.ratings ? Number(p.ratings.averageRating.toFixed(2)) : null,
    ratingCount: p.ratings?.totalCount ?? 0,
    attributes: p.articleAttributes,
    description: p.productDetails.map((d) => `${d.title}: ${plainText(d.description ?? "")}`).join(" | "),
    images: p.media.albums[0].images.slice(0, 4).map((i) => i.secureSrc.replace("h_($height),q_($qualityPercentage),w_($width)", IMAGE_SIZE)),
    sizes: p.sizes.map(sizeOf),
    polls: pollsOf(reviewState),
    reviews: reviewsOf(reviewState),
  };
};

const ids = process.argv.slice(2);
if (!ids.length) {
  console.error("usage: node myntra.mjs <product id>... > items.json");
  process.exit(1);
}

const items = [];
for (const id of ids) {
  try {
    items.push(await product(id));
  } catch (error) {
    console.error(`${id}: ${error.message}`);
  }
  await new Promise((resolve) => setTimeout(resolve, 400));
}
console.log(JSON.stringify(items, null, 1));
