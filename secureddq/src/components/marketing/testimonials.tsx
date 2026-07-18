import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";

const testimonials = [
  {
    quote:
      "We used to spend two weeks on every enterprise DDQ. Now our analysts approve AI drafts in an afternoon. It's changed how fast we can close.",
    name: "Jordan Ellis",
    title: "CISO, placeholder SaaS co.",
  },
  {
    quote:
      "The citations are the killer feature. Every answer links to the exact policy section, so our reviewers actually trust the output.",
    name: "Priya Raman",
    title: "Security Program Manager (placeholder)",
  },
  {
    quote:
      "Onboarding was a single afternoon of uploading policies. The knowledge base did the rest. Our sales engineers love it.",
    name: "Marcus Cole",
    title: "VP Sales Engineering (placeholder)",
  },
];

export function Testimonials() {
  return (
    <section className="border-t bg-muted/30 py-24">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Trusted by security-first teams</h2>
          <p className="mt-4 text-muted-foreground">Placeholder testimonials — swap in your customer stories.</p>
        </div>
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <Card key={t.name} className="bg-card/70">
              <CardContent className="pt-6">
                <p className="text-sm leading-relaxed">“{t.quote}”</p>
                <div className="mt-6 flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{initials(t.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-medium">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.title}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
