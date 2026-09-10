import { RecordPreview } from "@/components/RecordPreview";
import { RecordRenderResult } from "@/types/record";

export function ShareCard({ result }: { result: RecordRenderResult }) {
  return (
    <article className={`share-card share-${result.artDirection.stylePack}`} aria-label="9 by 16 share card preview">
      <div className="share-card-top"><span>YOUR RECORD</span><small>ONE OF ONE</small></div>
      <div className="share-card-art"><div className="share-card-sleeve" /><RecordPreview artDirection={result.artDirection} size="share" /></div>
      <div className="share-card-copy">
        <p>AFTERMARK PRESENTS</p>
        <h3>{result.recordType}</h3>
        {result.artDirection.userMessage && <blockquote>“{result.artDirection.userMessage}”</blockquote>}
        <div><span>{result.catalogNumber}</span><span>{result.artDirection.date.replaceAll("-", ".")}</span></div>
      </div>
      <footer>AFTERMARK <span>MADE TO KEEP.</span></footer>
    </article>
  );
}
