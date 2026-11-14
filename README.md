# Beyondesk

Marketing site plus applicant form.

## Base URL

Canonical, Open Graph, schema, sitemap and robots URLs all use `https://staffora-site.pages.dev`.
When the real domain is live, change it everywhere in one go:

    rg -l 'https://staffora-site.pages.dev' | xargs sed -i 's#https://staffora-site.pages.dev#https://beyondesk.co.uk#g'
