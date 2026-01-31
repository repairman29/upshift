# Upshift Launch Day Checklist

## Week Before Launch

### Product Hunt Prep
- [ ] Create Product Hunt account (if needed)
- [ ] Verify maker status
- [ ] Prepare all listing content (see PRODUCT_HUNT_LISTING.md)
- [ ] Upload images/screenshots
- [ ] Write first comment draft
- [ ] Schedule launch for Tuesday 12:01 AM PT

### Content Prep
- [ ] Terminal screenshots ready (marketing/demo-outputs/)
- [ ] Twitter thread drafted (TWITTER_LAUNCH_THREAD.md)
- [ ] LinkedIn post drafted
- [ ] Record demo GIF (30-60 seconds)

### Technical Prep
- [ ] Verify upshiftai.dev is up and fast
- [ ] Test `npm install -g upshift-cli` works
- [ ] Verify VS Code extension is searchable
- [ ] Check Stripe checkout flow works
- [ ] Verify email delivery (Resend)

---

## Launch Day (Tuesday)

### 12:00 AM PT - Launch Goes Live
- [ ] Product Hunt listing goes live
- [ ] Post first comment immediately
- [ ] Tweet announcement thread

### Morning (6 AM - 12 PM PT)
- [ ] Monitor Product Hunt comments - respond to ALL
- [ ] Retweet/engage with anyone sharing
- [ ] Post to LinkedIn
- [ ] Share in relevant Discord/Slack communities
- [ ] Post to Reddit (r/webdev, r/javascript, r/node)

### Afternoon (12 PM - 6 PM PT)
- [ ] Continue responding to PH comments
- [ ] Reply to Twitter thread with updates
- [ ] Share any positive feedback/testimonials
- [ ] Thank early supporters

### Evening (6 PM - 12 AM PT)
- [ ] Final check on PH ranking
- [ ] Thank the community in comments
- [ ] Plan follow-up content for next day

---

## Communities to Share In

### High Value (Share Thoughtfully)
- [ ] Hacker News "Show HN" (wait 1-2 days if PH goes well)
- [ ] r/webdev
- [ ] r/javascript  
- [ ] r/node
- [ ] r/reactjs

### Discord Servers
- [ ] Reactiflux
- [ ] TypeScript Community
- [ ] Node.js
- [ ] Indie Hackers

### Other
- [ ] Dev.to article
- [ ] Hashnode blog
- [ ] LinkedIn

---

## Response Templates

### Positive Feedback
```
Thanks so much! 🙏 Really appreciate you checking it out. 
Let me know if you hit any issues - I'm actively building and fixing things.
```

### Feature Request
```
Love this idea! Adding it to the roadmap. 
What's your use case - monorepo? Specific framework?
```

### Bug Report
```
Thanks for flagging! Can you share:
- OS/Node version
- The command you ran
- Any error message

I'll get this fixed ASAP.
```

### "Why not Dependabot/Renovate?"
```
Great question! Those tools tell you WHAT to upgrade. 
Upshift tells you what will BREAK and generates the fixes.

Think of it as: Dependabot opens the PR, Upshift helps you understand + merge it.
```

### "Is the AI accurate?"
```
Good question - it uses GPT-4o-mini with focused prompts. 
It's great for common packages (React, Express, etc.) 

I always recommend reviewing the suggestions - AI is a helper, not a replacement for understanding your code.
```

### Pricing Question
```
Trying to be sustainable as an indie project:
- Core features (scan, upgrade, rollback) = free forever
- AI features cost credits because OpenAI charges me per call

$0.05/analysis felt fair - cheaper than the time you'd spend reading changelogs!
```

---

## Metrics to Track

### Day 1
- [ ] Product Hunt upvotes
- [ ] Product Hunt ranking
- [ ] Website visits (Plausible)
- [ ] npm installs
- [ ] GitHub stars
- [ ] Twitter impressions

### Week 1
- [ ] Total PH upvotes
- [ ] Email signups
- [ ] npm weekly downloads
- [ ] First paying customers?
- [ ] VS Code extension installs

---

## Post-Launch Follow-Up

### Day 2
- [ ] Thank you post on Twitter
- [ ] Share final PH results
- [ ] Address top feature requests

### Week 1
- [ ] Write "What I Learned Launching on Product Hunt" post
- [ ] Implement quick-win feature requests
- [ ] Release patch with any bug fixes

### Month 1
- [ ] Analyze what worked
- [ ] Plan v0.4.0 features based on feedback
- [ ] Consider second launch (Hacker News?)

---

## Emergency Contacts

### If Site Goes Down
- Vercel dashboard: vercel.com/dashboard
- Check DNS: upshiftai.dev

### If npm Has Issues  
- npm status: status.npmjs.org
- Publish fix: `npm version patch && npm publish`

### If Stripe Breaks
- Stripe dashboard: dashboard.stripe.com
- Railway logs: railway.app
