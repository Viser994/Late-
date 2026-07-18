import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Head of Security",
    company: "TechFlow Inc",
    avatar: "SC",
    content:
      "We used to spend 3 weeks completing every enterprise questionnaire. With SecureDDQ AI, our team reviews AI-generated answers in a day. It's completely transformed our sales cycle.",
    rating: 5,
  },
  {
    name: "Marcus Rodriguez",
    role: "Sales Engineer",
    company: "CloudBase Systems",
    avatar: "MR",
    content:
      "I was skeptical about AI accuracy for security questions, but the citation system gives me full confidence. Every answer points back to our actual documentation.",
    rating: 5,
  },
  {
    name: "Jennifer Park",
    role: "CISO",
    company: "FinData Corp",
    avatar: "JP",
    content:
      "We handle 50+ questionnaires per quarter. SecureDDQ AI saved us an estimated $400K annually in engineering time. The compliance center also helped us identify coverage gaps.",
    rating: 5,
  },
  {
    name: "David Thompson",
    role: "VP of Compliance",
    company: "MedSecure",
    avatar: "DT",
    content:
      "HIPAA questionnaires are notoriously complex. The AI handles them with impressive accuracy, and the approval workflow ensures our compliance team reviews everything before submission.",
    rating: 5,
  },
  {
    name: "Aisha Patel",
    role: "Security Manager",
    company: "Nexus Analytics",
    avatar: "AP",
    content:
      "The knowledge base feature is a game-changer. Our security documentation is now an asset that actively works for us rather than sitting in a SharePoint folder nobody reads.",
    rating: 5,
  },
  {
    name: "Tom Wilson",
    role: "Director of InfoSec",
    company: "RetailChain Pro",
    avatar: "TW",
    content:
      "PCI DSS questionnaires used to be a nightmare. SecureDDQ AI pre-fills everything from our documentation, and our team only spends time on edge cases. Highly recommend.",
    rating: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-24 bg-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight mb-4">
            Trusted by security teams worldwide
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See how security professionals and sales engineers are using
            SecureDDQ AI to close deals faster.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.name}
              className="p-6 rounded-2xl bg-card border border-border/60 flex flex-col"
            >
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-6">
                &ldquo;{testimonial.content}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-medium text-sm">{testimonial.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {testimonial.role} at {testimonial.company}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
