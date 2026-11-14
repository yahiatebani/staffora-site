# Beyondesk

Marketing site plus applicant form.

## Base URL

Canonical, Open Graph, schema, sitemap and robots URLs all use `https://www.beyonddesk.co.uk`
(the domain has two d's; the brand name stays Beyondesk). The Cloudflare Pages project is
still called `staffora-site` and also serves the site at `https://staffora-site.pages.dev`.
To change the base URL later, replace it everywhere in one go:

    rg -l 'https://www.beyonddesk.co.uk' | xargs sed -i 's#https://www.beyonddesk.co.uk#https://NEW-HOST#g'
