# Sites

Open each site in the T3 preview browser and read its JSON with `preview_evaluate` and `fetch(..., {credentials: 'include'})` from a tab on that site. That returns structured data in one call, where screenshots and page text lose it. One tab per site: navigating a tab to another site loses the first site's state.

## Myntra

The best site for this. It is the only one that gives garment measurements per size, and it has buyer polls on fit, length and thickness.

- **Search.** From a Myntra tab: `/gateway/v2/search/<slug>?rows=50&o=<offset>&sort=popularity`, where `<slug>` is the listing path, such as `men-sweatshirts`. Add `&rf=Price%3A0.0_1000.0_0.0%20TO%201000.0` for a price range. A `rows=1` call returns `filters`, which lists the valid filter ids and values (color, size, neck, fit). Each product has `productId`, `brand`, `productName`, `price`, `mrp`, `rating`, `ratingCount`, `primaryColour`, `sizes` and `inventoryInfo`.
- **Product, measurements and reviews.** `node scripts/myntra.mjs <id>...` fetches them with plain requests, no browser. Each item has `sizes[]` with `inStock`, `left` and `garment` measurements in inches, plus `polls` and the 12 most helpful `reviews`. The 12 lean positive, so weigh the polls more.
- **Delivery.** Needs a browser session, since plain requests get a 401. In a Myntra tab, define this once, then call it for each item:

```js
window.deliversTo = async (id, size, pincode) => {
  const style = (await (await fetch(`/gateway/v2/product/${id}`, { credentials: "include" })).json()).style;
  const sku = style.sizes.find((s) => s.label === size);
  const seller = sku?.sizeSellerData?.[0];
  if (!sku?.available || !seller) return { id, inStock: false };
  const response = await fetch("/gateway/v3/serviceability/check", {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      pincode, clientId: "2297", paymentMode: "ALL", serviceTypes: ["FORWARD"], shippingMethod: "ALL",
      clientReferenceId: `guest_${Date.now()}`,
      items: [{
        itemReferenceId: String(seller.sellerPartnerId), skuId: String(sku.skuId), procurementTimeInDays: 0,
        availableInWarehouses: seller.warehouses, itemValue: seller.discountedPrice, codValue: seller.discountedPrice,
        isHazmat: false, isLarge: false, isJewellery: false, isFragile: false, codEnabled: true, tryAndBuyEnabled: false,
        isExchangeable: true, isReturnable: true, openBoxPickupEnabled: true, measurementModeEnabled: false,
        sampleModeEnabled: false, articleType: style.analytics.articleType, articleGender: style.analytics.gender,
      }],
    }),
  });
  const entry = (await response.json()).itemServiceabilityEntries?.[0];
  return { id, inStock: true, delivers: Boolean(entry?.serviceable) };
};
```

## Nykaa Fashion

Plain requests are blocked, so use the browser. Few reviews: most listings have 1-11 ratings and almost no written reviews.

- **Search.** From a Nykaa Fashion tab: `/rest/appapi/V2/categories/products?searchTerm=<term>&PageSize=40&currentPage=1&sort=popularity&filter_format=v2&apiVersion=5`. The response's `filters` gives keys and value ids, passed as `&<key>=<id>,<id>`, such as `instock_size_nykaa_filter`, `fit_filter`, `color_filter`, `neckline_type_filter` and `price_filter=0-1000`. Large combined queries can fail. Keep `PageSize` at 40.
- **Product.** `/rest/appapi/V3/products/id/<id>` returns `response.product` with `sizeOptions.options` (stock per size), `pdp_sections` (material and details), `review_rating_json`, `productMedia` and `delivery_details`. Size charts are often images. Many measure tight, at 35.5-38 inch chest in S.

## Meesho

Listing pages load and show ratings, but product pages block automated browsers, in normal and incognito profiles. So there's no size chart, stock or delivery check. Seller size charts are often copied or wrong, and many listings share the same stock photos. Use it only when the user asks, or for cheap items where a big review count stands in for the checks, and tell the user to confirm size and pincode at checkout.

## Bewakoof

Mostly oversized and drop-shoulder cuts, so few items survive the fit filter. Its listing paginates differently from Myntra. Find the filter URL from the page's own requests.

## Cahoot

Pricier than the rest: sweaters start around ₹1,299 and hoodies around ₹1,499. Check it when the budget allows.

## Flipkart and Amazon

Mostly unknown brands with no garment size charts, and review counts that are often low or pooled across unrelated variants. Keep an item only when it has thousands of reviews or a real size chart.
