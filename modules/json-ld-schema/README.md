# Module: json-ld-schema

Structured-data schema markup for SEO. Helps Google show rich results (rating, hours, price range, address) in search.

## What it adds

A `<script type="application/ld+json">` block to drop in the `<head>` of `index.html`. Defines:
- `Organization` — brand name, URL, logo, contact details
- `LocalBusiness` (or `ProfessionalService` / `Dentist` / `LegalService`) — opening hours, address, areas served, services offered
- `WebSite` — sitelinks search box

## Dependencies

None. Add to `<head>` and you're done.

## Customization

Pick the **most specific** business type that fits — schema.org has a deep type tree:
- General → `LocalBusiness`
- Dentist → `Dentist` (extends MedicalBusiness, LocalBusiness)
- Solicitor → `LegalService`
- Construction → `GeneralContractor`
- Accountant → `AccountingService`

Replace placeholders, then validate with [Google's Rich Results Test](https://search.google.com/test/rich-results) before deploying.

## Snippet

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://[domain]/#organization",
      "name": "[Brand Name]",
      "url": "https://[domain]/",
      "email": "hello@[domain]",
      "telephone": "+3530XXXXXXXX",
      "logo": "https://[domain]/og-image.jpg",
      "description": "[~155-char description]",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "[Street]",
        "addressLocality": "[Town]",
        "addressRegion": "Co. [County]",
        "postalCode": "[P12 ABCD]",
        "addressCountry": "IE"
      },
      "areaServed": { "@type": "Country", "name": "Ireland" }
    },
    {
      "@type": "LocalBusiness",
      "@id": "https://[domain]/#business",
      "name": "[Brand Name]",
      "url": "https://[domain]/",
      "image": "https://[domain]/og-image.jpg",
      "telephone": "+3530XXXXXXXX",
      "priceRange": "€€",
      "address": { "@id": "https://[domain]/#organization" },
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday"],
          "opens": "09:00",
          "closes": "17:30"
        },
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": "Saturday",
          "opens": "10:00",
          "closes": "14:00"
        }
      ],
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "reviewCount": "120"
      },
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Services",
        "itemListElement": [
          { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "[Service 1]" } },
          { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "[Service 2]" } },
          { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "[Service 3]" } }
        ]
      }
    },
    {
      "@type": "WebSite",
      "@id": "https://[domain]/#website",
      "url": "https://[domain]/",
      "name": "[Brand Name]",
      "publisher": { "@id": "https://[domain]/#organization" }
    }
  ]
}
</script>
```

## Reference

For a real-world example with multiple `@graph` entities, see `mtmn-digital/index.html` head — it includes both `Organization` and `ProfessionalService` graphs.
