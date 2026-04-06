import { Link } from "wouter";
import { Shield, Zap, FileSearch, AlertTriangle, CheckCircle, ArrowRight, Star, TrendingUp, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: FileSearch,
    title: "Instant Document Analysis",
    description: "Upload any contract — NDA, service agreement, employment contract — and get a full legal risk analysis in under 60 seconds.",
  },
  {
    icon: AlertTriangle,
    title: "Risk Highlighting",
    description: "Every clause that could hurt you is flagged with severity levels: low, medium, high, and critical. Nothing slips through.",
  },
  {
    icon: CheckCircle,
    title: "Plain-English Summaries",
    description: "No legalese. Get a clear, plain-language summary of what the contract actually says and what you should watch out for.",
  },
  {
    icon: Shield,
    title: "Actionable Recommendations",
    description: "Don't just find problems — fix them. Every finding comes with a specific recommendation you can bring to negotiations.",
  },
  {
    icon: Zap,
    title: "Faster Than a Lawyer",
    description: "A lawyer charges $300–$500/hour for contract review. ProofDesk does it in seconds, for a fraction of the monthly cost.",
  },
  {
    icon: TrendingUp,
    title: "Track Your Risk Over Time",
    description: "A document library and risk dashboard shows you patterns across all your contracts — from critical findings to overall risk trends.",
  },
];

const pricingPlans = [
  {
    name: "Starter",
    price: "$29",
    period: "/month",
    description: "For freelancers and solo operators",
    features: [
      "10 document reviews per month",
      "Full risk analysis and findings",
      "Plain-English summaries",
      "Document library",
      "Email support",
    ],
    cta: "Start Free Trial",
    highlight: false,
  },
  {
    name: "Professional",
    price: "$79",
    period: "/month",
    description: "For growing businesses and teams",
    features: [
      "50 document reviews per month",
      "Full risk analysis and findings",
      "Priority AI analysis",
      "Advanced dashboard analytics",
      "Risk breakdown reports",
      "Priority email support",
    ],
    cta: "Start Free Trial",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "$199",
    period: "/month",
    description: "For high-volume legal operations",
    features: [
      "Unlimited document reviews",
      "Team collaboration",
      "Custom document types",
      "API access",
      "Dedicated account manager",
      "SLA guarantee",
    ],
    cta: "Contact Sales",
    highlight: false,
  },
];

const testimonials = [
  {
    quote: "ProofDesk caught a $500 liability cap in a $180,000 contract before I signed it. Paid for itself a thousand times over.",
    author: "Marcus T.",
    role: "Freelance Software Engineer",
  },
  {
    quote: "I review 15-20 vendor contracts a month. ProofDesk cut my review time from 4 hours to 20 minutes. I don't know how I managed before.",
    author: "Sarah K.",
    role: "Operations Director, Series A Startup",
  },
  {
    quote: "The IP rights finding feature alone is worth every penny. Three contractors had all-IP-rights clauses I almost missed.",
    author: "James R.",
    role: "Agency Owner",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary text-primary-foreground rounded flex items-center justify-center font-serif font-bold text-lg">
              P
            </div>
            <span className="font-serif font-bold text-xl tracking-tight">ProofDesk</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
              Sign In
            </Link>
            <Link href="/dashboard">
              <Button size="sm" data-testid="cta-nav">
                Start Free Trial
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-6 text-xs font-semibold tracking-wider uppercase">
              AI-Powered Contract Review
            </Badge>
            <h1 className="text-4xl md:text-6xl font-serif font-bold leading-tight tracking-tight mb-6">
              Review any contract in{" "}
              <span className="text-amber-500">60 seconds.</span>
              <br />
              Not 60 minutes.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed max-w-2xl">
              ProofDesk uses AI to review contracts, highlight risks, and give you plain-English summaries and recommendations — in the time it takes to read one paragraph.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <Link href="/dashboard">
                <Button size="lg" className="gap-2 font-semibold" data-testid="cta-hero-primary">
                  Start Free Trial <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/documents">
                <Button size="lg" variant="outline" className="gap-2" data-testid="cta-hero-secondary">
                  <FileSearch className="w-4 h-4" /> Upload a Document
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-green-500" />
                No credit card required
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-green-500" />
                3 free reviews
              </div>
              <div className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-green-500" />
                Bank-level encryption
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats banner */}
      <section className="bg-primary text-primary-foreground py-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "< 60s", label: "Average review time" },
              { value: "$450/hr", label: "Average lawyer rate" },
              { value: "94%", label: "Issues caught first review" },
              { value: "10,000+", label: "Contracts reviewed" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-serif font-bold mb-1" data-testid={`stat-${stat.label.replace(/\s+/g, '-').toLowerCase()}`}>{stat.value}</div>
                <div className="text-sm opacity-70">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 border-b border-border">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
              Everything you need to protect yourself
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Stop signing contracts you don't fully understand. ProofDesk has you covered.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="bg-card border border-border rounded-lg p-6 hover:border-primary/30 transition-colors" data-testid={`feature-${feature.title.replace(/\s+/g, '-').toLowerCase()}`}>
                <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-base mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">How it works</h2>
            <p className="text-muted-foreground text-lg">Three steps from contract to confidence</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Upload Your Contract", desc: "Paste in the contract text or type it directly. Supports NDAs, service agreements, employment contracts, and more." },
              { step: "02", title: "AI Analyzes in Seconds", desc: "Our AI reads every clause, identifies risks, and checks for missing protections — in under 60 seconds." },
              { step: "03", title: "Get Your Risk Report", desc: "Receive a plain-English summary, risk severity breakdown, and specific recommendations you can act on immediately." },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-start">
                <div className="text-5xl font-serif font-bold text-amber-500/30 mb-4">{item.step}</div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 border-b border-border">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">Trusted by founders & freelancers</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.author} className="bg-card border border-border rounded-lg p-6">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <blockquote className="text-sm leading-relaxed text-foreground mb-4">
                  "{t.quote}"
                </blockquote>
                <div>
                  <div className="font-semibold text-sm">{t.author}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 border-b border-border bg-card" id="pricing">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">Simple, transparent pricing</h2>
            <p className="text-muted-foreground text-lg">Start free, cancel anytime</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-lg border p-6 flex flex-col ${
                  plan.highlight
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background"
                }`}
                data-testid={`pricing-${plan.name.toLowerCase()}`}
              >
                {plan.highlight && (
                  <Badge className="self-start mb-3 bg-amber-500 text-amber-950 text-xs">Most Popular</Badge>
                )}
                <div className="text-sm font-semibold mb-1 opacity-70">{plan.name}</div>
                <div className="mb-1">
                  <span className="text-4xl font-serif font-bold">{plan.price}</span>
                  <span className="text-sm opacity-70">{plan.period}</span>
                </div>
                <div className="text-xs mb-6 opacity-60">{plan.description}</div>
                <ul className="space-y-2 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 mt-0.5 text-green-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/dashboard">
                  <Button
                    className="w-full font-semibold"
                    variant={plan.highlight ? "secondary" : "default"}
                    data-testid={`cta-${plan.name.toLowerCase()}`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
            Don't sign another contract blind.
          </h2>
          <p className="text-lg mb-8 opacity-80 max-w-xl mx-auto">
            Three free reviews. No credit card. Know what you're signing before you sign it.
          </p>
          <Link href="/documents">
            <Button size="lg" variant="secondary" className="gap-2 font-semibold" data-testid="cta-bottom">
              Upload Your First Contract <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary text-primary-foreground rounded flex items-center justify-center font-serif font-bold text-sm">P</div>
            <span className="font-serif font-bold">ProofDesk</span>
          </div>
          <div className="text-sm text-muted-foreground">
            2025 ProofDesk. AI-powered contract review. Not legal advice.
          </div>
        </div>
      </footer>
    </div>
  );
}
