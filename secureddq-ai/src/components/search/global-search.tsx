"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, ClipboardList, MessageSquare } from "lucide-react";
import Link from "next/link";

interface SearchResult {
  type: string;
  id: string;
  title: string;
  excerpt: string;
  url: string;
  score?: number;
}

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  const typeIcon = (type: string) => {
    switch (type) {
      case "document": return FileText;
      case "questionnaire": return ClipboardList;
      case "answer": return MessageSquare;
      default: return Search;
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Search</h1>
        <p className="text-muted-foreground">
          AI-powered semantic search across your knowledge base
        </p>
      </div>

      <form onSubmit={handleSearch} className="mb-8 flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search documents, questions, answers..."
          className="max-w-xl"
        />
        <Button type="submit" disabled={loading}>
          <Search className="mr-2 h-4 w-4" />
          {loading ? "Searching..." : "Search"}
        </Button>
      </form>

      {results.length > 0 && (
        <div className="space-y-4">
          {results.map((result) => {
            const Icon = typeIcon(result.type);
            return (
              <Card key={`${result.type}-${result.id}`}>
                <CardContent className="flex items-start gap-4 p-4">
                  <Icon className="mt-1 h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <Link href={result.url} className="font-medium hover:text-primary">
                        {result.title}
                      </Link>
                      <Badge variant="outline">{result.type}</Badge>
                      {result.score && (
                        <span className="text-xs text-muted-foreground">
                          {Math.round(result.score * 100)}% match
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {result.excerpt}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
