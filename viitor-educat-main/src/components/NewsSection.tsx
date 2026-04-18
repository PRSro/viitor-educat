import { Calendar, ArrowRight, Award, Users, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "@/lib/apiClient";

interface NewsArticle {
  id: string;
  title: string;
  excerpt: string | null;
  category: string;
  createdAt: string;
}

export const NewsSection = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await api.get<{ articles: NewsArticle[] }>('/api/articles/latest');
        setArticles(res.articles || []);
      } catch (error) {
        console.error("Failed to fetch news:", error);
        setArticles([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchNews();
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'COMPUTER_SCIENCE':
      case 'CTF':
        return Award;
      case 'EVENTS':
        return Users;
      default:
        return BookOpen;
    }
  };

  return (
    <section id="news" className="py-24 lg:py-32 relative overflow-hidden bg-gradient-to-b from-background via-muted/30 to-background">
      <div className="absolute top-32 right-20 w-24 h-24 rounded-full bg-accent/10 animate-float-slow">
        <div className="absolute top-[12%] left-[18%] w-[35%] h-[20%] bg-white/50 rounded-full blur-[2px] rotate-[-20deg]" />
      </div>
      <div className="absolute bottom-20 left-[25%] w-16 h-16 rounded-full bg-sky-400/10 animate-float" style={{ animationDelay: '1.5s' }}>
        <div className="absolute top-[15%] left-[20%] w-[30%] h-[18%] bg-white/40 rounded-full blur-[1px]" />
      </div>
      
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/8 rounded-full blur-[150px]" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-sky-400/8 rounded-full blur-[120px]" />
      
      <div className="container mx-auto px-4 lg:px-8 relative">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <div>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-semibold mb-6 backdrop-blur-sm">
              <Calendar className="w-4 h-4" />
              News & Events
            </span>
            <h2 className="text-display-sm lg:text-display-md text-foreground">
              What&apos;s Happening at{" "}
              <span className="text-gradient">Obscuron</span>
            </h2>
          </div>
          <Button asChild className="aero-button group shrink-0 hover-glow" size="lg">
            <Link to="/news">
              View All News
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-3 text-center py-12">
              <div className="animate-pulse flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-muted"></div>
                <div className="h-4 w-32 bg-muted rounded"></div>
                <div className="h-3 w-48 bg-muted rounded"></div>
              </div>
              <p className="text-muted-foreground text-sm mt-4">Loading news...</p>
            </div>
          ) : articles.length === 0 ? (
            <div className="col-span-3 text-center py-12">
              <div className="flex flex-col items-center gap-4">
                <Calendar className="w-12 h-12 text-muted-foreground/30" />
                <p className="text-muted-foreground text-lg font-medium">No news available yet</p>
                <p className="text-muted-foreground/60 text-sm">Check back soon for updates</p>
              </div>
            </div>
          ) : (
            articles.slice(0, 3).map((item, index) => {
              const IconComponent = getCategoryIcon(item.category);
              const isFeatured = index === 0;
              return (
                <article
                  key={item.id}
                  className={`group aero-glass overflow-hidden transition-all duration-300 hover-lift hover-glow soft-shadow
                    ${isFeatured ? "lg:col-span-2 lg:row-span-1" : ""}`}
                >
                  <div className={`p-6 lg:p-8 h-full flex flex-col ${
                    isFeatured ? "lg:flex-row lg:items-center lg:gap-8" : ""
                  }`}>
                    <div className={`mb-4 ${isFeatured ? "lg:mb-0" : ""}`}>
                      <div className={`rounded-2xl flex items-center justify-center transition-all duration-300
                        bg-gradient-to-br from-accent/20 to-teal-500/20 group-hover:from-accent group-hover:to-teal-500
                        relative overflow-hidden
                        ${isFeatured ? "w-20 h-20 lg:w-24 lg:h-24" : "w-16 h-16"}`}
                      >
                        <IconComponent className={`text-accent group-hover:text-white transition-colors
                          ${isFeatured ? "w-10 h-10" : "w-7 h-7"}`} 
                        />
                        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <span className="px-3 py-1 bg-accent/10 text-accent text-xs font-medium rounded-full backdrop-blur-sm border border-accent/20">
                          {item.category.replace('_', ' ')}
                        </span>
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {formatDate(item.createdAt)}
                        </span>
                      </div>
                      
                      <h3 className={`font-bold text-foreground mb-3 group-hover:text-accent transition-colors ${
                        isFeatured ? "text-xl lg:text-2xl" : "text-lg"
                      }`}>
                        {item.title}
                      </h3>
                      
                      <p className="text-muted-foreground mb-4">
                        {item.excerpt || 'Click to read more...'}
                      </p>
                      
                      <Link 
                        to={`/news/${item.id}`}
                        className="inline-flex items-center gap-2 text-accent font-medium hover:gap-3 transition-all"
                      >
                        Read more
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
};
