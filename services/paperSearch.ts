import { Paper } from '../types';

/**
 * Searches ArXiv for papers matching the query.
 * Uses the proxy configured in vite.config.ts at /api/arxiv
 */
export const searchArxiv = async (query: string, maxResults = 5): Promise<Paper[]> => {
  try {
    const encodedQuery = encodeURIComponent(`all:${query}`);
    const response = await fetch(`/api/arxiv/api/query?search_query=${encodedQuery}&start=0&max_results=${maxResults}`);
    
    if (!response.ok) {
      throw new Error(`ArXiv API error: ${response.statusText}`);
    }

    const text = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, "text/xml");
    const entries = Array.from(xmlDoc.getElementsByTagName("entry"));

    return entries.map((entry) => {
      const idUrl = entry.getElementsByTagName("id")[0]?.textContent || "";
      const arxivId = idUrl.split("/abs/")[1] || "";
      const title = entry.getElementsByTagName("title")[0]?.textContent?.replace(/\s+/g, " ").trim() || "No Title";
      const summary = entry.getElementsByTagName("summary")[0]?.textContent?.replace(/\s+/g, " ").trim() || "";
      const published = entry.getElementsByTagName("published")[0]?.textContent || "";
      const year = published ? new Date(published).getFullYear() : undefined;
      
      const authorNodes = Array.from(entry.getElementsByTagName("author"));
      const authors = authorNodes.map(node => node.getElementsByTagName("name")[0]?.textContent || "Unknown");

      const links = Array.from(entry.getElementsByTagName("link"));
      const pdfLink = links.find(l => l.getAttribute("title") === "pdf")?.getAttribute("href") || idUrl;

      return {
        id: arxivId || Math.random().toString(36).substr(2, 9),
        title,
        authors,
        summary,
        abstract: summary,
        publishedDate: published.split("T")[0],
        year,
        url: pdfLink,
        arxivId,
        citationCount: 0, // ArXiv doesn't provide this directly
        venue: "ArXiv"
      };
    });
  } catch (error) {
    console.error("Failed to search ArXiv:", error);
    return [];
  }
};

/**
 * Searches Semantic Scholar for papers matching the query.
 * Uses the proxy configured in vite.config.ts at /api/semanticscholar
 */
export const searchSemanticScholar = async (query: string, limit = 5): Promise<Paper[]> => {
  try {
    const fields = "title,authors,year,abstract,url,externalIds,citationCount,venue";
    const response = await fetch(
      `/api/semanticscholar/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=${limit}&fields=${fields}`
    );

    if (!response.ok) {
      throw new Error(`Semantic Scholar API error: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.data) return [];

    return data.data.map((item: any) => ({
      id: item.paperId,
      title: item.title,
      authors: item.authors?.map((a: any) => a.name) || [],
      summary: item.abstract || "",
      abstract: item.abstract || "",
      year: item.year,
      url: item.url,
      arxivId: item.externalIds?.ArXiv,
      doi: item.externalIds?.DOI,
      citationCount: item.citationCount || 0,
      venue: item.venue || "Semantic Scholar"
    }));
  } catch (error) {
    console.error("Failed to search Semantic Scholar:", error);
    return [];
  }
};

/**
 * Formats a list of papers into a text block suitable for LLM context.
 */
export const formatPapersForContext = (papers: Paper[], source: string): string => {
  if (!papers.length) return `No papers found from ${source}.`;

  return `Here are relevant papers from ${source}:\n\n` + papers.map((p, index) => {
    return `${index + 1}. **${p.title}** (${p.year || 'n.d.'})\n` +
           `   Authors: ${p.authors.join(', ')}\n` +
           `   ${p.venue ? `Venue: ${p.venue}\n` : ''}` +
           `   Abstract: ${p.summary ? p.summary.substring(0, 300) + '...' : 'No abstract available.'}\n` +
           `   URL: ${p.url || 'N/A'}`;
  }).join('\n\n');
};
