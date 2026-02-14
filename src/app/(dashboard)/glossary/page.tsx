"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpenText, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { usePageTitle } from "@/providers/page-title-provider";
import {
  GLOSSARY_CATEGORIES,
  GLOSSARY_TERMS,
  type GlossaryCategory,
} from "@/lib/constants/glossary";

type CategoryFilter = "All" | GlossaryCategory;

export default function GlossaryPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("All");
  const { setPageTitle, clearPageTitle } = usePageTitle();

  useEffect(() => {
    setPageTitle("F1 Glossary", "Quick terms for casual fans");
    return () => clearPageTitle();
  }, [setPageTitle, clearPageTitle]);

  const filteredTerms = useMemo(() => {
    const query = search.trim().toLowerCase();
    return GLOSSARY_TERMS.filter((term) => {
      const matchesCategory =
        activeCategory === "All" || term.category === activeCategory;
      if (!matchesCategory) return false;
      if (!query) return true;
      return (
        term.term.toLowerCase().includes(query) ||
        term.definition.toLowerCase().includes(query) ||
        term.whyItMatters.toLowerCase().includes(query)
      );
    });
  }, [activeCategory, search]);

  return (
    <div className="space-y-6">
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpenText className="h-5 w-5 text-primary" />
            Learn F1 Terms Faster
          </CardTitle>
          <CardDescription>
            Use this glossary while watching sessions. Every term includes what it means and why it matters in races.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search terms, like DRS or undercut"
              className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {GLOSSARY_CATEGORIES.map((category) => {
              const isActive = activeCategory === category;
              return (
                <Button
                  key={category}
                  type="button"
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </Button>
              );
            })}
            <Badge variant="secondary" className="ml-auto">
              {filteredTerms.length} terms
            </Badge>
          </div>
        </CardContent>
      </Card>

      {filteredTerms.length === 0 ? (
        <EmptyState
          icon={BookOpenText}
          title="No glossary terms found"
          description="Try a broader search or switch to another category."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredTerms.map((term) => (
            <Card key={term.id} className="h-full border-border/60">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base leading-tight">{term.term}</CardTitle>
                  <Badge variant="outline" className="text-[10px]">
                    {term.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Definition
                  </p>
                  <p className="mt-1 text-foreground">{term.definition}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Why It Matters
                  </p>
                  <p className="mt-1 text-muted-foreground">{term.whyItMatters}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
