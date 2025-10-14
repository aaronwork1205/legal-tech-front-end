const stories = [
  {
    quote:
      "LexiFlow quadrupled our contract review velocity, and every attorney match has been spot on. It gave us confidence to launch in two new markets simultaneously.",
    author: "Founder, SaaS X"
  },
  {
    quote:
      "The AI remembers every detail. When a human attorney joins, the handoff is seamless and we never lose context.",
    author: "Head of Compliance, FinTech Y"
  },
  {
    quote:
      "Our data transfer program used to require 3 teams. Now LexiFlow keeps jurisdictional guidance updated automatically.",
    author: "GC, CloudOps EMEA"
  }
];

export const Testimonials = () => (
  <section className="container testimonials">
    <h2 className="section-title">Customer stories</h2>
    <div className="testimonials-grid">
      {stories.map((story) => (
        <article key={story.author}>
          <blockquote className="testimonial-quote">{story.quote}</blockquote>
          <cite className="muted">{story.author}</cite>
        </article>
      ))}
    </div>
  </section>
);
