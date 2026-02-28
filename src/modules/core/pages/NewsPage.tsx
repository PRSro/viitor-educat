import { useState, useEffect } from "react";
import { Calendar, ArrowRight, Award, Users, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  categories: string[];
  description: string;
}

const RSS_FEED_URL = `/news/feed`;

const parseRSSDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ro-RO", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

const stripHtml = (html: string): string => {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

const getCategoryIcon = (category: string): typeof Award => {
  const lower = category.toLowerCase();
  if (lower.includes("olimpiad") || lower.includes("concurs")) return Award;
  if (lower.includes("eveniment")) return Calendar;
  if (lower.includes("angaj")) return Users;
  return BookOpen;
};

export const NewsPage = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch(RSS_FEED_URL, {
          headers: { 'ngrok-skip-browser-warning': 'true' },
          signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) throw new Error("Failed to fetch news");
        
        const text = await response.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, "text/xml");
        
        const items = Array.from(xml.querySelectorAll("item")).map((item) => {
          const title = item.querySelector("title")?.textContent || "";
          const link = item.querySelector("link")?.textContent || "";
          const pubDate = item.querySelector("pubDate")?.textContent || "";
          const description = stripHtml(
            item.querySelector("description")?.textContent || ""
          );
          const categories = Array.from(item.querySelectorAll("category")).map(
            (cat) => cat.textContent || ""
          );

          return {
            title,
            link,
            pubDate,
            categories: categories.filter((c) => c !== "Stiri"),
            description: description.slice(0, 200) + (description.length > 200 ? "..." : ""),
          };
        });

        setNews(items);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  return (
    <main className="min-h-screen py-24 lg:py-32">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-semibold mb-6 backdrop-blur-sm">
            <Calendar className="w-4 h-4" />
            Noutăți & Evenimente
          </span>
          <h1 className="text-display-sm lg:text-display-md text-foreground mb-4">
            Ultimele Noutăți de la{" "}
            <span className="text-gradient">Tudor Vianu</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Stay updated with the latest news, events, and achievements from our school community.
          </p>
        </div>

        {loading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aero-glass p-6">
                <Skeleton className="h-6 w-3/4 mb-4" />
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="text-center py-20">
            <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive mb-4">
              <span className="text-2xl">⚠️</span>
              <div className="text-left">
                <p className="font-semibold">Nu s-au putut încărca știrile</p>
                <p className="text-sm opacity-80">Verifică conexiunea sau încearcă din nou</p>
              </div>
            </div>
            <br />
            <Button variant="outline" onClick={() => window.location.reload()}>
              Încearcă din nou
            </Button>
          </div>
        )}

        {!loading && !error && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {news.map((item, index) => {
              const icon = item.categories[0]
                ? getCategoryIcon(item.categories[0])
                : Calendar;
              const Icon = icon;
              const isFeatured = index === 0;

              return (
                <article
                  key={item.link}
                  className={`group aero-glass overflow-hidden transition-all duration-300 hover-lift hover-glow soft-shadow
                    ${isFeatured ? "md:col-span-2" : ""}`}
                >
                  <div
                    className={`p-6 lg:p-8 h-full flex flex-col ${
                      isFeatured ? "md:flex-row md:items-center md:gap-8" : ""
                    }`}
                  >
                    <div className={`mb-4 ${isFeatured ? "md:mb-0" : ""}`}>
                      <div
                        className={`rounded-2xl flex items-center justify-center transition-all duration-300
                          bg-gradient-to-br from-accent/20 to-teal-500/20 group-hover:from-accent group-hover:to-teal-500
                          relative overflow-hidden ${
                            isFeatured ? "w-20 h-20 lg:w-24 lg:h-24" : "w-16 h-16"
                          }`}
                      >
                        <Icon
                          className={`text-accent group-hover:text-white transition-colors ${
                            isFeatured ? "w-10 h-10" : "w-7 h-7"
                          }`}
                        />
                        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        {item.categories.slice(0, 2).map((cat) => (
                          <span
                            key={cat}
                            className="px-3 py-1 bg-accent/10 text-accent text-xs font-medium rounded-full backdrop-blur-sm border border-accent/20"
                          >
                            {cat}
                          </span>
                        ))}
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {parseRSSDate(item.pubDate)}
                        </span>
                      </div>

                      <h3
                        className={`font-bold text-foreground mb-3 group-hover:text-accent transition-colors ${
                          isFeatured ? "text-xl lg:text-2xl" : "text-lg"
                        }`}
                      >
                        {item.title}
                      </h3>

                      <p className="text-muted-foreground mb-4">
                        {item.description}
                      </p>

                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-accent font-medium hover:gap-3 transition-all"
                      >
                        Citește mai mult
                        <ArrowRight className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {news.length > 0 && (
          <div className="text-center mt-12">
            <a
              href="http://portal.lbi.ro/category/stiri/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-accent font-medium hover:gap-3 transition-all"
            >
              Vezi toate noutățile pe portal
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>
    </main>
  );
};

export default NewsPage;
