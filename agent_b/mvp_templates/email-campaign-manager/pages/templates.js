import Link from "next/link";
import templates from "../src/mock-data/templates";
import { TemplateCard } from "../src/components/TemplateCard";

export default function TemplatesPage() {
  return (
    <main className="page">
      <header className="page-header">
        <div>
          <h1>Шаблоны писем</h1>
          <p className="subtitle">
            Библиотека шаблонов с автоматической ротацией – каждые 5/10/15/20
            отправок. Следующий шаг – подключить реальный редактор.
          </p>
        </div>
        <Link href="/" className="btn">
          ← На главную
        </Link>
      </header>

      <div className="grid three-columns">
        {templates.map((template) => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>
    </main>
  );
}

