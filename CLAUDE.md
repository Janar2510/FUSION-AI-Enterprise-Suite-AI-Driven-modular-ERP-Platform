> **Orchestration:** Each session — read root [`BUILD_STATE.md`](BUILD_STATE.md), then [`docs/BUILD_ORCHESTRATION.md`](docs/BUILD_ORCHESTRATION.md). Architecture index: [`docs/architecture.md`](docs/architecture.md). AI rules index: [`docs/ai-rules.md`](docs/ai-rules.md). Obsidian: [`docs/OBSIDIAN_VAULT.md`](docs/OBSIDIAN_VAULT.md).

<skills_system priority="1">

## Available Skills

<!-- SKILLS_TABLE_START -->
<usage>
When users ask you to perform tasks, check if any of the available skills below can help complete the task more effectively. Skills provide specialized capabilities and domain knowledge.

How to use skills:
- Invoke: `skillkit read <skill-name>` or `npx skillkit read <skill-name>`
- The skill content will load with detailed instructions on how to complete the task
- Base directory provided in output for resolving bundled resources (references/, scripts/, assets/)

Usage notes:
- Only use skills listed in <available_skills> below
- Do not invoke a skill that is already loaded in your context
- Each skill invocation is stateless
</usage>

<available_skills>

<skill>
<name>ab-test-setup</name>
<description>When the user wants to plan, design, or implement an A/B test or experiment, or build a growth experimentation program. Also use when the user mentions &quot;A/B test,&quot; &quot;split test,&quot; &quot;experiment,&quot; &quot;test this change,&quot; &quot;variant copy,&quot; &quot;multivariate test,&quot; &quot;hypothesis,&quot; &quot;should I test this,&quot; &quot;which version is better,&quot; &quot;test two versions,&quot; &quot;statistical significance,&quot; &quot;how long should I run this test,&quot; &quot;growth experiments,&quot; &quot;experiment velocity,&quot; &quot;experiment backlog,&quot; &quot;ICE score,&quot; &quot;experimentation program,&quot; or &quot;experiment playbook.&quot; Use this whenever someone is comparing two approaches and wants to measure which performs better, or when they want to build a systematic experimentation practice. For tracking implementation, see analytics-tracking. For page-level conversion optimization, see page-cro.</description>
<location>project</location>
</skill>

<skill>
<name>ad-creative</name>
<description>When the user wants to generate, iterate, or scale ad creative — headlines, descriptions, primary text, or full ad variations — for any paid advertising platform. Also use when the user mentions &apos;ad copy variations,&apos; &apos;ad creative,&apos; &apos;generate headlines,&apos; &apos;RSA headlines,&apos; &apos;bulk ad copy,&apos; &apos;ad iterations,&apos; &apos;creative testing,&apos; &apos;ad performance optimization,&apos; &apos;write me some ads,&apos; &apos;Facebook ad copy,&apos; &apos;Google ad headlines,&apos; &apos;LinkedIn ad text,&apos; or &apos;I need more ad variations.&apos; Use this whenever someone needs to produce ad copy at scale or iterate on existing ads. For campaign strategy and targeting, see paid-ads. For landing page copy, see copywriting.</description>
<location>project</location>
</skill>

<skill>
<name>ai-seo</name>
<description>When the user wants to optimize content for AI search engines, get cited by LLMs, or appear in AI-generated answers. Also use when the user mentions &apos;AI SEO,&apos; &apos;AEO,&apos; &apos;GEO,&apos; &apos;LLMO,&apos; &apos;answer engine optimization,&apos; &apos;generative engine optimization,&apos; &apos;LLM optimization,&apos; &apos;AI Overviews,&apos; &apos;optimize for ChatGPT,&apos; &apos;optimize for Perplexity,&apos; &apos;AI citations,&apos; &apos;AI visibility,&apos; &apos;zero-click search,&apos; &apos;how do I show up in AI answers,&apos; &apos;LLM mentions,&apos; or &apos;optimize for Claude/Gemini.&apos; Use this whenever someone wants their content to be cited or surfaced by AI assistants and AI search engines. For traditional technical and on-page SEO audits, see seo-audit. For structured data implementation, see schema-markup.</description>
<location>project</location>
</skill>

<skill>
<name>analytics-tracking</name>
<description>When the user wants to set up, improve, or audit analytics tracking and measurement. Also use when the user mentions &quot;set up tracking,&quot; &quot;GA4,&quot; &quot;Google Analytics,&quot; &quot;conversion tracking,&quot; &quot;event tracking,&quot; &quot;UTM parameters,&quot; &quot;tag manager,&quot; &quot;GTM,&quot; &quot;analytics implementation,&quot; &quot;tracking plan,&quot; &quot;how do I measure this,&quot; &quot;track conversions,&quot; &quot;attribution,&quot; &quot;Mixpanel,&quot; &quot;Segment,&quot; &quot;are my events firing,&quot; or &quot;analytics isn&apos;t working.&quot; Use this whenever someone asks how to know if something is working or wants to measure marketing results. For A/B test measurement, see ab-test-setup.</description>
<location>project</location>
</skill>

<skill>
<name>aso-audit</name>
<description>When the user wants to audit or optimize an App Store or Google Play listing. Also use when the user mentions &apos;ASO audit,&apos; &apos;app store optimization,&apos; &apos;optimize my app listing,&apos; &apos;improve app visibility,&apos; &apos;app store ranking,&apos; &apos;audit my listing,&apos; &apos;why aren&apos;t people downloading my app,&apos; &apos;improve my app conversion,&apos; &apos;keyword optimization for app,&apos; or &apos;compare my app to competitors.&apos; Use when the user shares an App Store or Google Play URL and wants to improve it.</description>
<location>project</location>
</skill>

<skill>
<name>churn-prevention</name>
<description>When the user wants to reduce churn, build cancellation flows, set up save offers, recover failed payments, or implement retention strategies. Also use when the user mentions &apos;churn,&apos; &apos;cancel flow,&apos; &apos;offboarding,&apos; &apos;save offer,&apos; &apos;dunning,&apos; &apos;failed payment recovery,&apos; &apos;win-back,&apos; &apos;retention,&apos; &apos;exit survey,&apos; &apos;pause subscription,&apos; &apos;involuntary churn,&apos; &apos;people keep canceling,&apos; &apos;churn rate is too high,&apos; &apos;how do I keep users,&apos; or &apos;customers are leaving.&apos; Use this whenever someone is losing subscribers or wants to build systems to prevent it. For post-cancel win-back email sequences, see email-sequence. For in-app upgrade paywalls, see paywall-upgrade-cro.</description>
<location>project</location>
</skill>

<skill>
<name>co-marketing</name>
<description>When the user wants to find co-marketing partners, plan joint campaigns, or brainstorm partnership opportunities. Use when the user says &apos;co-marketing,&apos; &apos;partner marketing,&apos; &apos;joint campaign,&apos; &apos;who should we partner with,&apos; &apos;integration marketing,&apos; &apos;cross-promotion,&apos; &apos;collaborate with another company,&apos; &apos;partnership ideas,&apos; or &apos;co-brand.&apos; For customer referral programs, see referral-program. For launch-specific partnerships, see launch-strategy.</description>
<location>project</location>
</skill>

<skill>
<name>cold-email</name>
<description>Write B2B cold emails and follow-up sequences that get replies. Use when the user wants to write cold outreach emails, prospecting emails, cold email campaigns, sales development emails, or SDR emails. Also use when the user mentions &quot;cold outreach,&quot; &quot;prospecting email,&quot; &quot;outbound email,&quot; &quot;email to leads,&quot; &quot;reach out to prospects,&quot; &quot;sales email,&quot; &quot;follow-up email sequence,&quot; &quot;nobody&apos;s replying to my emails,&quot; or &quot;how do I write a cold email.&quot; Covers subject lines, opening lines, body copy, CTAs, personalization, and multi-touch follow-up sequences. For warm/lifecycle email sequences, see email-sequence. For sales collateral beyond emails, see sales-enablement.</description>
<location>project</location>
</skill>

<skill>
<name>community-marketing</name>
<description>Build and leverage online communities to drive product growth and brand loyalty. Use when the user wants to create a community strategy, grow a Discord or Slack community, manage a forum or subreddit, build brand advocates, increase word-of-mouth, drive community-led growth, engage users post-signup, or turn customers into evangelists. Trigger phrases: &quot;build a community,&quot; &quot;community strategy,&quot; &quot;Discord community,&quot; &quot;Slack community,&quot; &quot;community-led growth,&quot; &quot;brand advocates,&quot; &quot;user community,&quot; &quot;forum strategy,&quot; &quot;community engagement,&quot; &quot;grow our community,&quot; &quot;ambassador program,&quot; &quot;community flywheel.&quot;</description>
<location>project</location>
</skill>

<skill>
<name>competitor-alternatives</name>
<description>When the user wants to create competitor comparison or alternative pages for SEO and sales enablement. Also use when the user mentions &apos;alternative page,&apos; &apos;vs page,&apos; &apos;competitor comparison,&apos; &apos;comparison page,&apos; &apos;[Product] vs [Product],&apos; &apos;[Product] alternative,&apos; &apos;competitive landing pages,&apos; &apos;how do we compare to X,&apos; &apos;battle card,&apos; or &apos;competitor teardown.&apos; Use this for any content that positions your product against competitors. Covers four formats: singular alternative, plural alternatives, you vs competitor, and competitor vs competitor. For sales-specific competitor docs, see sales-enablement.</description>
<location>project</location>
</skill>

<skill>
<name>competitor-profiling</name>
<description>When the user wants to research, profile, or analyze competitors from their URLs. Also use when the user mentions &apos;competitor profile,&apos; &apos;competitor research,&apos; &apos;competitor analysis,&apos; &apos;profile this competitor,&apos; &apos;analyze competitor,&apos; &apos;competitive intelligence,&apos; &apos;competitor deep dive,&apos; &apos;who are my competitors,&apos; &apos;competitor landscape,&apos; &apos;competitor dossier,&apos; &apos;competitive audit,&apos; or &apos;research these competitors.&apos; Input is a list of competitor URLs. Output is structured competitor profile markdown files. For creating comparison/alternative pages from profiles, see competitor-alternatives. For sales-specific battle cards, see sales-enablement.</description>
<location>project</location>
</skill>

<skill>
<name>content-strategy</name>
<description>When the user wants to plan a content strategy, decide what content to create, or figure out what topics to cover. Also use when the user mentions &quot;content strategy,&quot; &quot;what should I write about,&quot; &quot;content ideas,&quot; &quot;blog strategy,&quot; &quot;topic clusters,&quot; &quot;content planning,&quot; &quot;editorial calendar,&quot; &quot;content marketing,&quot; &quot;content roadmap,&quot; &quot;what content should I create,&quot; &quot;blog topics,&quot; &quot;content pillars,&quot; or &quot;I don&apos;t know what to write.&quot; Use this whenever someone needs help deciding what content to produce, not just writing it. For writing individual pieces, see copywriting. For SEO-specific audits, see seo-audit. For social media content specifically, see social-content.</description>
<location>project</location>
</skill>

<skill>
<name>copy-editing</name>
<description>When the user wants to edit, review, or improve existing marketing copy, or refresh outdated content. Also use when the user mentions &apos;edit this copy,&apos; &apos;review my copy,&apos; &apos;copy feedback,&apos; &apos;proofread,&apos; &apos;polish this,&apos; &apos;make this better,&apos; &apos;copy sweep,&apos; &apos;tighten this up,&apos; &apos;this reads awkwardly,&apos; &apos;clean up this text,&apos; &apos;too wordy,&apos; &apos;sharpen the messaging,&apos; &apos;refresh this content,&apos; &apos;update this page,&apos; &apos;this content is outdated,&apos; or &apos;content audit.&apos; Use this when the user already has copy and wants it improved or refreshed rather than rewritten from scratch. For writing new copy, see copywriting.</description>
<location>project</location>
</skill>

<skill>
<name>copywriting</name>
<description>When the user wants to write, rewrite, or improve marketing copy for any page — including homepage, landing pages, pricing pages, feature pages, about pages, or product pages. Also use when the user says &quot;write copy for,&quot; &quot;improve this copy,&quot; &quot;rewrite this page,&quot; &quot;marketing copy,&quot; &quot;headline help,&quot; &quot;CTA copy,&quot; &quot;value proposition,&quot; &quot;tagline,&quot; &quot;subheadline,&quot; &quot;hero section copy,&quot; &quot;above the fold,&quot; &quot;this copy is weak,&quot; &quot;make this more compelling,&quot; or &quot;help me describe my product.&quot; Use this whenever someone is working on website text that needs to persuade or convert. For email copy, see email-sequence. For popup copy, see popup-cro. For editing existing copy, see copy-editing.</description>
<location>project</location>
</skill>

<skill>
<name>customer-research</name>
<description>When the user wants to conduct, analyze, or synthesize customer research. Use when the user mentions &quot;customer research,&quot; &quot;ICP research,&quot; &quot;talk to customers,&quot; &quot;analyze transcripts,&quot; &quot;customer interviews,&quot; &quot;survey analysis,&quot; &quot;support ticket analysis,&quot; &quot;voice of customer,&quot; &quot;VOC,&quot; &quot;build personas,&quot; &quot;customer personas,&quot; &quot;jobs to be done,&quot; &quot;JTBD,&quot; &quot;what do customers say,&quot; &quot;what are customers struggling with,&quot; &quot;Reddit mining,&quot; &quot;G2 reviews,&quot; &quot;review mining,&quot; &quot;digital watering holes,&quot; &quot;community research,&quot; &quot;forum research,&quot; &quot;competitor reviews,&quot; &quot;customer sentiment,&quot; or &quot;find out why customers churn/convert/buy.&quot; Use for both analyzing existing research assets AND gathering new research from online sources. For writing copy informed by research, see copywriting. For acting on research to improve pages, see page-cro.</description>
<location>project</location>
</skill>

<skill>
<name>directory-submissions</name>
<description>When the user wants to submit their product to startup, SaaS, AI, agent, MCP, no-code, or review directories for backlinks, domain rating, and discovery. Also use when the user mentions &quot;directory submissions,&quot; &quot;submit to directories,&quot; &quot;backlinks from directories,&quot; &quot;list my product,&quot; &quot;submit to Product Hunt,&quot; &quot;BetaList,&quot; &quot;TAAFT,&quot; &quot;Futurepedia,&quot; &quot;G2 listing,&quot; &quot;Capterra listing,&quot; &quot;AlternativeTo,&quot; &quot;SaaSHub,&quot; &quot;AI directories,&quot; &quot;MCP registry,&quot; &quot;agent directory,&quot; &quot;dofollow backlinks,&quot; &quot;launch directories,&quot; or &quot;directory tracker.&quot; Use this whenever someone is planning the directory layer of a product launch or an ongoing backlink campaign. For the broader launch moment, see launch-strategy. For programmatic SEO pages that should live behind these backlinks, see programmatic-seo. For AI citation optimization, see ai-seo.</description>
<location>project</location>
</skill>

<skill>
<name>email-sequence</name>
<description>When the user wants to create or optimize an email sequence, drip campaign, automated email flow, or lifecycle email program. Also use when the user mentions &quot;email sequence,&quot; &quot;drip campaign,&quot; &quot;nurture sequence,&quot; &quot;onboarding emails,&quot; &quot;welcome sequence,&quot; &quot;re-engagement emails,&quot; &quot;email automation,&quot; &quot;lifecycle emails,&quot; &quot;trigger-based emails,&quot; &quot;email funnel,&quot; &quot;email workflow,&quot; &quot;what emails should I send,&quot; &quot;welcome series,&quot; or &quot;email cadence.&quot; Use this for any multi-email automated flow. For cold outreach emails, see cold-email. For in-app onboarding, see onboarding-cro.</description>
<location>project</location>
</skill>

<skill>
<name>form-cro</name>
<description>When the user wants to optimize any form that is NOT signup/registration — including lead capture forms, contact forms, demo request forms, application forms, survey forms, or checkout forms. Also use when the user mentions &quot;form optimization,&quot; &quot;lead form conversions,&quot; &quot;form friction,&quot; &quot;form fields,&quot; &quot;form completion rate,&quot; &quot;contact form,&quot; &quot;nobody fills out our form,&quot; &quot;form abandonment,&quot; &quot;too many fields,&quot; &quot;demo request form,&quot; or &quot;lead form isn&apos;t converting.&quot; Use this for any non-signup form that captures information. For signup/registration forms, see signup-flow-cro. For popups containing forms, see popup-cro.</description>
<location>project</location>
</skill>

<skill>
<name>free-tool-strategy</name>
<description>When the user wants to plan, evaluate, or build a free tool for marketing purposes — lead generation, SEO value, or brand awareness. Also use when the user mentions &quot;engineering as marketing,&quot; &quot;free tool,&quot; &quot;marketing tool,&quot; &quot;calculator,&quot; &quot;generator,&quot; &quot;interactive tool,&quot; &quot;lead gen tool,&quot; &quot;build a tool for leads,&quot; &quot;free resource,&quot; &quot;ROI calculator,&quot; &quot;grader tool,&quot; &quot;audit tool,&quot; &quot;should I build a free tool,&quot; or &quot;tools for lead gen.&quot; Use this whenever someone wants to build something useful and give it away to attract leads or earn links. For downloadable content lead magnets (ebooks, checklists, templates), see lead-magnets.</description>
<location>project</location>
</skill>

<skill>
<name>image</name>
<description>When the user wants to create, generate, edit, or optimize images for marketing — blog heroes, social graphics, product mockups, profile banners, listing visuals, or brand assets. Also use when the user mentions &apos;AI image generation,&apos; &apos;generate an image,&apos; &apos;create a graphic,&apos; &apos;product mockup,&apos; &apos;hero image,&apos; &apos;social media graphic,&apos; &apos;banner image,&apos; &apos;cover photo,&apos; &apos;profile banner,&apos; &apos;listing screenshot,&apos; &apos;Flux,&apos; &apos;Midjourney,&apos; &apos;DALL-E,&apos; &apos;GPT Image,&apos; &apos;Ideogram,&apos; &apos;Gemini image,&apos; &apos;Canva,&apos; &apos;Figma,&apos; &apos;image optimization,&apos; &apos;compress images,&apos; &apos;WebP,&apos; or &apos;OG image.&apos; Use this for general-purpose marketing image creation and optimization. For paid ad image creative and platform-specific ad specs, see ad-creative. For video production, see video.</description>
<location>project</location>
</skill>

<skill>
<name>launch-strategy</name>
<description>When the user wants to plan a product launch, feature announcement, or release strategy. Also use when the user mentions &apos;launch,&apos; &apos;Product Hunt,&apos; &apos;feature release,&apos; &apos;announcement,&apos; &apos;go-to-market,&apos; &apos;beta launch,&apos; &apos;early access,&apos; &apos;waitlist,&apos; &apos;product update,&apos; &apos;how do I launch this,&apos; &apos;launch checklist,&apos; &apos;GTM plan,&apos; or &apos;we&apos;re about to ship.&apos; Use this whenever someone is preparing to release something publicly. For ongoing marketing after launch, see marketing-ideas.</description>
<location>project</location>
</skill>

<skill>
<name>lead-magnets</name>
<description>When the user wants to create, plan, or optimize a lead magnet for email capture or lead generation. Also use when the user mentions &quot;lead magnet,&quot; &quot;gated content,&quot; &quot;content upgrade,&quot; &quot;downloadable,&quot; &quot;ebook,&quot; &quot;cheat sheet,&quot; &quot;checklist,&quot; &quot;template download,&quot; &quot;opt-in,&quot; &quot;freebie,&quot; &quot;PDF download,&quot; &quot;resource library,&quot; &quot;content offer,&quot; &quot;email capture content,&quot; &quot;Notion template,&quot; &quot;spreadsheet template,&quot; or &quot;what should I give away for emails.&quot; Use this for planning what to create and how to distribute it. For interactive tools as lead magnets, see free-tool-strategy. For writing the actual content, see copywriting. For the email sequence after capture, see email-sequence.</description>
<location>project</location>
</skill>

<skill>
<name>marketing-ideas</name>
<description>When the user needs marketing ideas, inspiration, or strategies for their SaaS or software product. Also use when the user asks for &apos;marketing ideas,&apos; &apos;growth ideas,&apos; &apos;how to market,&apos; &apos;marketing strategies,&apos; &apos;marketing tactics,&apos; &apos;ways to promote,&apos; &apos;ideas to grow,&apos; &apos;what else can I try,&apos; &apos;I don&apos;t know how to market this,&apos; &apos;brainstorm marketing,&apos; or &apos;what marketing should I do.&apos; Use this as a starting point whenever someone is stuck or looking for inspiration on how to grow. For specific channel execution, see the relevant skill (paid-ads, social-content, email-sequence, etc.).</description>
<location>project</location>
</skill>

<skill>
<name>marketing-psychology</name>
<description>When the user wants to apply psychological principles, mental models, or behavioral science to marketing. Also use when the user mentions &apos;psychology,&apos; &apos;mental models,&apos; &apos;cognitive bias,&apos; &apos;persuasion,&apos; &apos;behavioral science,&apos; &apos;why people buy,&apos; &apos;decision-making,&apos; &apos;consumer behavior,&apos; &apos;anchoring,&apos; &apos;social proof,&apos; &apos;scarcity,&apos; &apos;loss aversion,&apos; &apos;framing,&apos; or &apos;nudge.&apos; Use this whenever someone wants to understand or leverage how people think and make decisions in a marketing context.</description>
<location>project</location>
</skill>

<skill>
<name>onboarding-cro</name>
<description>When the user wants to optimize post-signup onboarding, user activation, first-run experience, or time-to-value. Also use when the user mentions &quot;onboarding flow,&quot; &quot;activation rate,&quot; &quot;user activation,&quot; &quot;first-run experience,&quot; &quot;empty states,&quot; &quot;onboarding checklist,&quot; &quot;aha moment,&quot; &quot;new user experience,&quot; &quot;users aren&apos;t activating,&quot; &quot;nobody completes setup,&quot; &quot;low activation rate,&quot; &quot;users sign up but don&apos;t use the product,&quot; &quot;time to value,&quot; or &quot;first session experience.&quot; Use this whenever users are signing up but not sticking around. For signup/registration optimization, see signup-flow-cro. For ongoing email sequences, see email-sequence.</description>
<location>project</location>
</skill>

<skill>
<name>page-cro</name>
<description>When the user wants to optimize, improve, or increase conversions on any marketing page — including homepage, landing pages, pricing pages, feature pages, or blog posts. Also use when the user says &quot;CRO,&quot; &quot;conversion rate optimization,&quot; &quot;this page isn&apos;t converting,&quot; &quot;improve conversions,&quot; &quot;why isn&apos;t this page working,&quot; &quot;my landing page sucks,&quot; &quot;nobody&apos;s converting,&quot; &quot;low conversion rate,&quot; &quot;bounce rate is too high,&quot; &quot;people leave without signing up,&quot; or &quot;this page needs work.&quot; Use this even if the user just shares a URL and asks for feedback — they probably want conversion help. For signup/registration flows, see signup-flow-cro. For post-signup activation, see onboarding-cro. For forms outside of signup, see form-cro. For popups/modals, see popup-cro.</description>
<location>project</location>
</skill>

<skill>
<name>paid-ads</name>
<description>When the user wants help with paid advertising campaigns on Google Ads, Meta (Facebook/Instagram), LinkedIn, Twitter/X, or other ad platforms. Also use when the user mentions &apos;PPC,&apos; &apos;paid media,&apos; &apos;ROAS,&apos; &apos;CPA,&apos; &apos;ad campaign,&apos; &apos;retargeting,&apos; &apos;audience targeting,&apos; &apos;Google Ads,&apos; &apos;Facebook ads,&apos; &apos;LinkedIn ads,&apos; &apos;ad budget,&apos; &apos;cost per click,&apos; &apos;ad spend,&apos; or &apos;should I run ads.&apos; Use this for campaign strategy, audience targeting, bidding, and optimization. For bulk ad creative generation and iteration, see ad-creative. For landing page optimization, see page-cro.</description>
<location>project</location>
</skill>

<skill>
<name>paywall-upgrade-cro</name>
<description>When the user wants to create or optimize in-app paywalls, upgrade screens, upsell modals, or feature gates. Also use when the user mentions &quot;paywall,&quot; &quot;upgrade screen,&quot; &quot;upgrade modal,&quot; &quot;upsell,&quot; &quot;feature gate,&quot; &quot;convert free to paid,&quot; &quot;freemium conversion,&quot; &quot;trial expiration screen,&quot; &quot;limit reached screen,&quot; &quot;plan upgrade prompt,&quot; &quot;in-app pricing,&quot; &quot;free users won&apos;t upgrade,&quot; &quot;trial to paid conversion,&quot; or &quot;how do I get users to pay.&quot; Use this for any in-product moment where you&apos;re asking users to upgrade. Distinct from public pricing pages (see page-cro) — this focuses on in-product upgrade moments where the user has already experienced value. For pricing decisions, see pricing-strategy.</description>
<location>project</location>
</skill>

<skill>
<name>popup-cro</name>
<description>When the user wants to create or optimize popups, modals, overlays, slide-ins, or banners for conversion purposes. Also use when the user mentions &quot;exit intent,&quot; &quot;popup conversions,&quot; &quot;modal optimization,&quot; &quot;lead capture popup,&quot; &quot;email popup,&quot; &quot;announcement banner,&quot; &quot;overlay,&quot; &quot;collect emails with a popup,&quot; &quot;exit popup,&quot; &quot;scroll trigger,&quot; &quot;sticky bar,&quot; or &quot;notification bar.&quot; Use this for any overlay or interrupt-style conversion element. For forms outside of popups, see form-cro. For general page conversion optimization, see page-cro.</description>
<location>project</location>
</skill>

<skill>
<name>pricing-strategy</name>
<description>When the user wants help with pricing decisions, packaging, or monetization strategy. Also use when the user mentions &apos;pricing,&apos; &apos;pricing tiers,&apos; &apos;freemium,&apos; &apos;free trial,&apos; &apos;packaging,&apos; &apos;price increase,&apos; &apos;value metric,&apos; &apos;Van Westendorp,&apos; &apos;willingness to pay,&apos; &apos;monetization,&apos; &apos;how much should I charge,&apos; &apos;my pricing is wrong,&apos; &apos;pricing page,&apos; &apos;annual vs monthly,&apos; &apos;per seat pricing,&apos; or &apos;should I offer a free plan.&apos; Use this whenever someone is figuring out what to charge or how to structure their plans. For in-app upgrade screens, see paywall-upgrade-cro.</description>
<location>project</location>
</skill>

<skill>
<name>product-marketing-context</name>
<description>When the user wants to create or update their product marketing context document. Also use when the user mentions &apos;product context,&apos; &apos;marketing context,&apos; &apos;set up context,&apos; &apos;positioning,&apos; &apos;who is my target audience,&apos; &apos;describe my product,&apos; &apos;ICP,&apos; &apos;ideal customer profile,&apos; or wants to avoid repeating foundational information across marketing tasks. Use this at the start of any new project before using other marketing skills — it creates `.agents/product-marketing-context.md` that all other skills reference for product, audience, and positioning context.</description>
<location>project</location>
</skill>

<skill>
<name>programmatic-seo</name>
<description>When the user wants to create SEO-driven pages at scale using templates and data. Also use when the user mentions &quot;programmatic SEO,&quot; &quot;template pages,&quot; &quot;pages at scale,&quot; &quot;directory pages,&quot; &quot;location pages,&quot; &quot;[keyword] + [city] pages,&quot; &quot;comparison pages,&quot; &quot;integration pages,&quot; &quot;building many pages for SEO,&quot; &quot;pSEO,&quot; &quot;generate 100 pages,&quot; &quot;data-driven pages,&quot; or &quot;templated landing pages.&quot; Use this whenever someone wants to create many similar pages targeting different keywords or locations. For auditing existing SEO issues, see seo-audit. For content strategy planning, see content-strategy.</description>
<location>project</location>
</skill>

<skill>
<name>referral-program</name>
<description>When the user wants to create, optimize, or analyze a referral program, affiliate program, or word-of-mouth strategy. Also use when the user mentions &apos;referral,&apos; &apos;affiliate,&apos; &apos;ambassador,&apos; &apos;word of mouth,&apos; &apos;viral loop,&apos; &apos;refer a friend,&apos; &apos;partner program,&apos; &apos;referral incentive,&apos; &apos;how to get referrals,&apos; &apos;customers referring customers,&apos; or &apos;affiliate payout.&apos; Use this whenever someone wants existing users or partners to bring in new customers. For launch-specific virality, see launch-strategy.</description>
<location>project</location>
</skill>

<skill>
<name>revops</name>
<description>When the user wants help with revenue operations, lead lifecycle management, or marketing-to-sales handoff processes. Also use when the user mentions &apos;RevOps,&apos; &apos;revenue operations,&apos; &apos;lead scoring,&apos; &apos;lead routing,&apos; &apos;MQL,&apos; &apos;SQL,&apos; &apos;pipeline stages,&apos; &apos;deal desk,&apos; &apos;CRM automation,&apos; &apos;marketing-to-sales handoff,&apos; &apos;data hygiene,&apos; &apos;leads aren&apos;t getting to sales,&apos; &apos;pipeline management,&apos; &apos;lead qualification,&apos; or &apos;when should marketing hand off to sales.&apos; Use this for anything involving the systems and processes that connect marketing to revenue. For cold outreach emails, see cold-email. For email drip campaigns, see email-sequence. For pricing decisions, see pricing-strategy.</description>
<location>project</location>
</skill>

<skill>
<name>sales-enablement</name>
<description>When the user wants to create sales collateral, pitch decks, one-pagers, objection handling docs, or demo scripts. Also use when the user mentions &apos;sales deck,&apos; &apos;pitch deck,&apos; &apos;one-pager,&apos; &apos;leave-behind,&apos; &apos;objection handling,&apos; &apos;deal-specific ROI analysis,&apos; &apos;demo script,&apos; &apos;talk track,&apos; &apos;sales playbook,&apos; &apos;proposal template,&apos; &apos;buyer persona card,&apos; &apos;help my sales team,&apos; &apos;sales materials,&apos; or &apos;what should I give my sales reps.&apos; Use this for any document or asset that helps a sales team close deals. For competitor comparison pages and battle cards, see competitor-alternatives. For marketing website copy, see copywriting. For cold outreach emails, see cold-email.</description>
<location>project</location>
</skill>

<skill>
<name>schema-markup</name>
<description>When the user wants to add, fix, or optimize schema markup and structured data on their site. Also use when the user mentions &quot;schema markup,&quot; &quot;structured data,&quot; &quot;JSON-LD,&quot; &quot;rich snippets,&quot; &quot;schema.org,&quot; &quot;FAQ schema,&quot; &quot;product schema,&quot; &quot;review schema,&quot; &quot;breadcrumb schema,&quot; &quot;Google rich results,&quot; &quot;knowledge panel,&quot; &quot;star ratings in search,&quot; or &quot;add structured data.&quot; Use this whenever someone wants their pages to show enhanced results in Google. For broader SEO issues, see seo-audit. For AI search optimization, see ai-seo.</description>
<location>project</location>
</skill>

<skill>
<name>seo-audit</name>
<description>When the user wants to audit, review, or diagnose SEO issues on their site. Also use when the user mentions &quot;SEO audit,&quot; &quot;technical SEO,&quot; &quot;why am I not ranking,&quot; &quot;SEO issues,&quot; &quot;on-page SEO,&quot; &quot;meta tags review,&quot; &quot;SEO health check,&quot; &quot;my traffic dropped,&quot; &quot;lost rankings,&quot; &quot;not showing up in Google,&quot; &quot;site isn&apos;t ranking,&quot; &quot;Google update hit me,&quot; &quot;page speed,&quot; &quot;core web vitals,&quot; &quot;crawl errors,&quot; or &quot;indexing issues.&quot; Use this even if the user just says something vague like &quot;my SEO is bad&quot; or &quot;help with SEO&quot; — start with an audit. For building pages at scale to target keywords, see programmatic-seo. For adding structured data, see schema-markup. For AI search optimization, see ai-seo.</description>
<location>project</location>
</skill>

<skill>
<name>signup-flow-cro</name>
<description>When the user wants to optimize signup, registration, account creation, or trial activation flows. Also use when the user mentions &quot;signup conversions,&quot; &quot;registration friction,&quot; &quot;signup form optimization,&quot; &quot;free trial signup,&quot; &quot;reduce signup dropoff,&quot; &quot;account creation flow,&quot; &quot;people aren&apos;t signing up,&quot; &quot;signup abandonment,&quot; &quot;trial conversion rate,&quot; &quot;nobody completes registration,&quot; &quot;too many steps to sign up,&quot; or &quot;simplify our signup.&quot; Use this whenever the user has a signup or registration flow that isn&apos;t performing. For post-signup onboarding, see onboarding-cro. For lead capture forms (not account creation), see form-cro.</description>
<location>project</location>
</skill>

<skill>
<name>site-architecture</name>
<description>When the user wants to plan, map, or restructure their website&apos;s page hierarchy, navigation, URL structure, or internal linking. Also use when the user mentions &quot;sitemap,&quot; &quot;site map,&quot; &quot;visual sitemap,&quot; &quot;site structure,&quot; &quot;page hierarchy,&quot; &quot;information architecture,&quot; &quot;IA,&quot; &quot;navigation design,&quot; &quot;URL structure,&quot; &quot;breadcrumbs,&quot; &quot;internal linking strategy,&quot; &quot;website planning,&quot; &quot;what pages do I need,&quot; &quot;how should I organize my site,&quot; or &quot;site navigation.&quot; Use this whenever someone is planning what pages a website should have and how they connect. NOT for XML sitemaps (that&apos;s technical SEO — see seo-audit). For SEO audits, see seo-audit. For structured data, see schema-markup.</description>
<location>project</location>
</skill>

<skill>
<name>social-content</name>
<description>When the user wants help creating, scheduling, or optimizing social media content for LinkedIn, Twitter/X, Instagram, TikTok, Facebook, or other platforms. Also use when the user mentions &apos;LinkedIn post,&apos; &apos;Twitter thread,&apos; &apos;social media,&apos; &apos;content calendar,&apos; &apos;social scheduling,&apos; &apos;engagement,&apos; &apos;viral content,&apos; &apos;what should I post,&apos; &apos;repurpose this content,&apos; &apos;tweet ideas,&apos; &apos;LinkedIn carousel,&apos; &apos;social media strategy,&apos; &apos;grow my following,&apos; &apos;TikTok video,&apos; &apos;Reels,&apos; &apos;Shorts,&apos; &apos;video script,&apos; &apos;video hook,&apos; &apos;short-form video,&apos; or &apos;create a reel.&apos; Use this for social media content creation, repurposing, scheduling, and short-form video scripting. For broader content strategy, see content-strategy. For paid video ads, see ad-creative.</description>
<location>project</location>
</skill>

<skill>
<name>video</name>
<description>When the user wants to create, generate, or produce video content using AI tools or programmatic frameworks. Also use when the user mentions &apos;video production,&apos; &apos;AI video,&apos; &apos;Remotion,&apos; &apos;Hyperframes,&apos; &apos;HeyGen,&apos; &apos;Synthesia,&apos; &apos;Veo,&apos; &apos;Runway,&apos; &apos;Kling,&apos; &apos;Pika,&apos; &apos;video generation,&apos; &apos;AI avatar,&apos; &apos;talking head video,&apos; &apos;programmatic video,&apos; &apos;video template,&apos; &apos;explainer video,&apos; &apos;product demo video,&apos; &apos;video pipeline,&apos; or &apos;make me a video.&apos; Use this for video creation, generation, and production workflows. For video content strategy and what to post, see social-content. For paid video ad creative, see ad-creative.</description>
<location>project</location>
</skill>

<skill>
<name>humanizer</name>
<description>Remove signs of AI-generated writing from text. Use when editing or reviewing
text to make it sound more natural and human-written. Based on Wikipedia&apos;s
comprehensive &quot;Signs of AI writing&quot; guide. Detects and fixes patterns including:
inflated symbolism, promotional language, superficial -ing analyses, vague
attributions, em dash overuse, rule of three, AI vocabulary words, passive
voice, negative parallelisms, and filler phrases.
</description>
<location>global</location>
</skill>

<skill>
<name>nano-banana</name>
<description>Generates and edits images with Google Gemini via the @ycse/nanobanana-mcp server (gemini_generate_image, gemini_edit_image, aspect ratio, session chat). Use when the user asks for AI image generation or editing, mentions nanobanana, nano-banana, Gemini images, or when nanobanana MCP tools are available.</description>
<location>global</location>
</skill>

<skill>
<name>odoo-development</name>
<description>No description available</description>
<location>global</location>
</skill>

<skill>
<name>seo</name>
<description>Comprehensive SEO analysis for any website or business type. Full site audits, single-page analysis, technical SEO (crawlability, indexability, Core Web Vitals with INP), schema markup, content quality (E-E-A-T), image optimization, sitemap analysis, and GEO for AI Overviews/ChatGPT/Perplexity. Industry detection for SaaS, e-commerce, local, publishers, agencies. Triggers on: SEO, audit, schema, Core Web Vitals, sitemap, E-E-A-T, AI Overviews, GEO, technical SEO, content quality, page speed, structured data.</description>
<location>global</location>
</skill>

<skill>
<name>seo-backlinks</name>
<description>Backlink profile analysis: referring domains, anchor text distribution, toxic link detection, competitor gap analysis. Works with free APIs (Moz, Bing Webmaster, Common Crawl) and DataForSEO extension. Use when user says backlinks, link profile, referring domains, anchor text, toxic links, link gap, link building, disavow, or backlink audit.</description>
<location>global</location>
</skill>

<skill>
<name>seo-cluster</name>
<description>SERP-based semantic topic clustering for content architecture planning. Groups keywords by actual Google SERP overlap (not text similarity), designs hub-and-spoke content clusters with internal link matrices, and generates interactive visualizations. Optionally executes content creation if claude-blog is installed. Use when user says &quot;topic cluster&quot;, &quot;content cluster&quot;, &quot;semantic clustering&quot;, &quot;pillar page&quot;, &quot;hub and spoke&quot;, &quot;content architecture&quot;, &quot;keyword grouping&quot;, or &quot;cluster plan&quot;.
</description>
<location>global</location>
</skill>

<skill>
<name>seo-competitor-pages</name>
<description>Generate SEO-optimized competitor comparison and alternatives pages. Covers &quot;X vs Y&quot; layouts, &quot;alternatives to X&quot; pages, feature matrices, schema markup, and conversion optimization. Use when user says &quot;comparison page&quot;, &quot;vs page&quot;, &quot;alternatives page&quot;, &quot;competitor comparison&quot;, &quot;X vs Y&quot;, &quot;versus&quot;, &quot;compare competitors&quot;, or &quot;alternative to&quot;.
</description>
<location>global</location>
</skill>

<skill>
<name>seo-content</name>
<description>Content quality and E-E-A-T analysis with AI citation readiness assessment. Use when user says &quot;content quality&quot;, &quot;E-E-A-T&quot;, &quot;content analysis&quot;, &quot;readability check&quot;, &quot;thin content&quot;, or &quot;content audit&quot;.
</description>
<location>global</location>
</skill>

<skill>
<name>seo-dataforseo</name>
<description>Live SEO data via DataForSEO MCP server. SERP analysis (Google, Bing, Yahoo, YouTube), keyword research (volume, difficulty, intent, trends), backlink profiles, on-page analysis (Lighthouse, content parsing), competitor analysis, content analysis, business listings, AI visibility (ChatGPT scraper, LLM mention tracking), and domain analytics. Requires DataForSEO extension installed. Use when user says &quot;dataforseo&quot;, &quot;live SERP&quot;, &quot;keyword volume&quot;, &quot;backlink data&quot;, &quot;competitor data&quot;, &quot;AI visibility check&quot;, &quot;LLM mentions&quot;, or &quot;real search data&quot;.
</description>
<location>global</location>
</skill>

<skill>
<name>seo-drift</name>
<description>SEO drift monitoring: capture baselines of SEO-critical elements, detect changes, and track regressions over time. Git for SEO — baseline, diff, and track changes to your on-page SEO. Use when user says &quot;SEO drift&quot;, &quot;baseline&quot;, &quot;track changes&quot;, &quot;did anything break&quot;, &quot;SEO regression&quot;, &quot;compare SEO&quot;, &quot;before and after&quot;, &quot;monitor SEO changes&quot;, or &quot;deployment check&quot;.
</description>
<location>global</location>
</skill>

<skill>
<name>seo-ecommerce</name>
<description>E-commerce SEO analysis: Google Shopping visibility, Amazon marketplace intelligence, product schema validation, competitor pricing analysis, and marketplace keyword gaps. Combines on-page product SEO with marketplace data from DataForSEO Merchant API. Use when user says &quot;ecommerce SEO&quot;, &quot;product SEO&quot;, &quot;Google Shopping&quot;, &quot;marketplace SEO&quot;, &quot;product schema&quot;, &quot;Amazon SEO&quot;, &quot;product listings&quot;, &quot;shopping ads&quot;, or &quot;merchant SEO&quot;.
</description>
<location>global</location>
</skill>

<skill>
<name>seo-firecrawl</name>
<description>Full-site crawling, scraping, and site mapping via Firecrawl MCP. Use when user says &quot;crawl site&quot;, &quot;map site&quot;, &quot;full crawl&quot;, &quot;find all pages&quot;, &quot;broken links&quot;, &quot;site structure&quot;, &quot;discover pages&quot;, &quot;JS rendering&quot;, or needs site-wide analysis.
</description>
<location>global</location>
</skill>

<skill>
<name>seo-google</name>
<description>Google SEO APIs: Search Console (Search Analytics, URL Inspection, Sitemaps), PageSpeed Insights v5, CrUX field data with 25-week history, Indexing API v3, and GA4 organic traffic. Provides real Google field data for Core Web Vitals, indexation status, search performance, and organic traffic trends. Use when user says &quot;search console&quot;, &quot;GSC&quot;, &quot;PageSpeed&quot;, &quot;CrUX&quot;, &quot;field data&quot;, &quot;indexing API&quot;, &quot;GA4 organic&quot;, &quot;URL inspection&quot;, &quot;google api setup&quot;, &quot;real CWV data&quot;, &quot;impressions&quot;, &quot;clicks&quot;, &quot;CTR&quot;, &quot;position data&quot;, &quot;LCP&quot;, &quot;INP&quot;, &quot;CLS&quot;, &quot;FCP&quot;, &quot;TTFB&quot;, or &quot;Lighthouse scores&quot;.
</description>
<location>global</location>
</skill>

<skill>
<name>seo-hreflang</name>
<description>Hreflang and international SEO audit, validation, and generation. Detects common mistakes, validates language/region codes, and generates correct hreflang implementations. Use when user says &quot;hreflang&quot;, &quot;i18n SEO&quot;, &quot;international SEO&quot;, &quot;multi-language&quot;, &quot;multi-region&quot;, or &quot;language tags&quot;.
</description>
<location>global</location>
</skill>

<skill>
<name>seo-image-gen</name>
<description>AI image generation for SEO assets: OG/social preview images, blog hero images, schema images, product photography, infographics. Powered by Gemini via nanobanana-mcp. Requires banana extension installed. Use when user says &quot;generate image&quot;, &quot;OG image&quot;, &quot;social preview&quot;, &quot;hero image&quot;, &quot;blog image&quot;, &quot;product photo&quot;, &quot;infographic&quot;, &quot;seo image&quot;, &quot;create visual&quot;, &quot;image-gen&quot;, &quot;favicon&quot;, &quot;schema image&quot;, &quot;pinterest pin&quot;, &quot;generate visual&quot;, &quot;banner&quot;, or &quot;thumbnail&quot;.</description>
<location>global</location>
</skill>

<skill>
<name>seo-images</name>
<description>Image optimization analysis for SEO and performance. Checks alt text, file sizes, formats, responsive images, lazy loading, CLS prevention, image SERP rankings (via DataForSEO), and image file optimization (WebP/AVIF conversion, IPTC/XMP metadata injection). Use when user says &quot;image optimization&quot;, &quot;alt text&quot;, &quot;image SEO&quot;, &quot;image size&quot;, &quot;image audit&quot;, &quot;optimize images&quot;, &quot;image metadata&quot;, &quot;image SERP&quot;, &quot;convert to webp&quot;, or &quot;image file optimize&quot;.
</description>
<location>global</location>
</skill>

<skill>
<name>seo-local</name>
<description>Local SEO analysis covering Google Business Profile optimization, NAP consistency, citation health, review signals, local schema markup, location page quality, multi-location SEO, and industry-specific recommendations. Detects business type (brick-and-mortar, SAB, hybrid) and industry vertical (restaurant, healthcare, legal, home services, real estate, automotive). Use when user says &quot;local SEO&quot;, &quot;Google Business Profile&quot;, &quot;GBP&quot;, &quot;map pack&quot;, &quot;local pack&quot;, &quot;citations&quot;, &quot;NAP consistency&quot;, &quot;local rankings&quot;, &quot;service area&quot;, &quot;multi-location&quot;, or &quot;local search&quot;.
</description>
<location>global</location>
</skill>

<skill>
<name>seo-maps</name>
<description>Maps intelligence for local SEO — geo-grid rank tracking, GBP profile auditing via API, review intelligence across Google/Tripadvisor/Trustpilot, cross-platform NAP verification (Google/Bing/Apple/OSM), competitor radius mapping, and LocalBusiness schema generation from API data. Three-tier capability: free (Overpass + Geoapify), DataForSEO (full intelligence), DataForSEO + Google (maximum coverage). Use when user says &quot;maps&quot;, &quot;geo-grid&quot;, &quot;rank tracking&quot;, &quot;GBP audit&quot;, &quot;review velocity&quot;, &quot;competitor radius&quot;, &quot;maps analysis&quot;, &quot;local rank tracking&quot;, &quot;Share of Local Voice&quot;, or &quot;SoLV&quot;.
</description>
<location>global</location>
</skill>

<skill>
<name>seo-page</name>
<description>Deep single-page SEO analysis covering on-page elements, content quality, technical meta tags, schema, images, and performance. Use when user says &quot;analyze this page&quot;, &quot;check page SEO&quot;, &quot;single URL&quot;, &quot;check this page&quot;, &quot;page analysis&quot;, or provides a single URL for review.
</description>
<location>global</location>
</skill>

<skill>
<name>seo-plan</name>
<description>Strategic SEO planning for new or existing websites. Industry-specific templates, competitive analysis, content strategy, and implementation roadmap. Use when user says &quot;SEO plan&quot;, &quot;SEO strategy&quot;, &quot;SEO planning&quot;, &quot;content strategy&quot;, &quot;keyword strategy&quot;, &quot;content calendar&quot;, &quot;site architecture&quot;, or &quot;SEO roadmap&quot;.
</description>
<location>global</location>
</skill>

<skill>
<name>seo-programmatic</name>
<description>Programmatic SEO planning and analysis for pages generated at scale from data sources. Covers template engines, URL patterns, internal linking automation, thin content safeguards, and index bloat prevention. Use when user says &quot;programmatic SEO&quot;, &quot;pages at scale&quot;, &quot;dynamic pages&quot;, &quot;template pages&quot;, &quot;generated pages&quot;, or &quot;data-driven SEO&quot;.
</description>
<location>global</location>
</skill>

<skill>
<name>seo-schema</name>
<description>Detect, validate, and generate Schema.org structured data. JSON-LD format preferred. Use when user says &quot;schema&quot;, &quot;structured data&quot;, &quot;rich results&quot;, &quot;JSON-LD&quot;, or &quot;markup&quot;.
</description>
<location>global</location>
</skill>

<skill>
<name>seo-sitemap</name>
<description>Analyze existing XML sitemaps or generate new ones with industry templates. Validates format, URLs, and structure. Use when user says &quot;sitemap&quot;, &quot;generate sitemap&quot;, &quot;sitemap issues&quot;, or &quot;XML sitemap&quot;.
</description>
<location>global</location>
</skill>

<skill>
<name>seo-sxo</name>
<description>Search Experience Optimization: reads Google SERPs backwards to detect page-type mismatches, derives user stories from search intent signals, and scores pages from multiple persona perspectives. Identifies why well-optimized pages fail to rank by analyzing what Google rewards for each keyword. Use when user says &quot;SXO&quot;, &quot;search experience&quot;, &quot;page type mismatch&quot;, &quot;SERP analysis&quot;, &quot;user story&quot;, &quot;persona scoring&quot;, &quot;why isn&apos;t my page ranking&quot;, &quot;intent mismatch&quot;, or &quot;wireframe&quot;.
</description>
<location>global</location>
</skill>

<skill>
<name>seo-technical</name>
<description>Technical SEO audit across 9 categories: crawlability, indexability, security, URL structure, mobile, Core Web Vitals, structured data, JavaScript rendering, and IndexNow protocol. Use when user says &quot;technical SEO&quot;, &quot;crawl issues&quot;, &quot;robots.txt&quot;, &quot;Core Web Vitals&quot;, &quot;site speed&quot;, or &quot;security headers&quot;.
</description>
<location>global</location>
</skill>

<skill>
<name>ui-ux-pro-max</name>
<description>UI/UX design intelligence. 67 styles, 96 palettes, 57 font pairings, 25 charts, 13 stacks (React, Next.js, Vue, Svelte, SwiftUI, React Native, Flutter, Tailwind, shadcn/ui). Actions: plan, build, create, design, implement, review, fix, improve, optimize, enhance, refactor, check UI/UX code. Projects: website, landing page, dashboard, admin panel, e-commerce, SaaS, portfolio, blog, mobile app, .html, .tsx, .vue, .svelte. Elements: button, modal, navbar, sidebar, card, table, form, chart. Styles: glassmorphism, claymorphism, minimalism, brutalism, neumorphism, bento grid, dark mode, responsive, skeuomorphism, flat design. Topics: color palette, accessibility, animation, layout, typography, font pairing, spacing, hover, shadow, gradient. Integrations: shadcn/ui MCP for component search and examples.</description>
<location>global</location>
</skill>

<skill>
<name>wiki-brain</name>
<description>Turn Claude Code into a knowledge base that compounds. Every conversation ingests into a personal wiki you browse in Obsidian. Based on Andrej Karpathy&apos;s LLM Wiki pattern, powered by Graphify.</description>
<location>global</location>
</skill>

</available_skills>
<!-- SKILLS_TABLE_END -->

</skills_system>