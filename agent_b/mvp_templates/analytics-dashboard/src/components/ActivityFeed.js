export default function ActivityFeed({ items }) {
  return (
    <article className="panel feed">
      <header>
        <h2>Последние события</h2>
      </header>
      <ul>
        {items.map((item, index) => (
          <li key={index}>
            <span className="time">{item.time}</span>
            <div>
              <strong>{item.title}</strong>
              <p>{item.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}
